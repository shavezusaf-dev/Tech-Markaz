import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { useToast } from '../../contexts/ToastContext';
import { fmt } from '../../lib/format';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';

const FILTERS = [
  { id: 'awaiting_verification', label: 'Pending' },
  { id: 'verified', label: 'Verified' },
  { id: 'rejected', label: 'Rejected' },
];

export default function Payments() {
  const { isAdmin } = useSeller();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('awaiting_verification');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [detail, setDetail] = useState(null);
  const [proofImg, setProofImg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_method', 'bank_transfer')
        .order('created_at', { ascending: false });
      const list = (data || []).filter((o) => {
        if (filter === 'awaiting_verification') return !o.payment_status || o.payment_status === 'awaiting_verification';
        return o.payment_status === filter;
      });
      setOrders(list);
      setSelected(new Set());
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line */ }, [filter, isAdmin]);

  const verify = async (id) => {
    const { error } = await supabase.from('orders').update({ payment_status: 'verified', status: 'Un-processed' }).eq('id', id);
    if (error) return toast(error.message, 'err');
    toast('Payment verified', 'ok');
    load();
  };

  const reject = async (id) => {
    if (!confirm('Reject this payment? Order will be cancelled.')) return;
    const { error } = await supabase.from('orders').update({ payment_status: 'rejected', status: 'Cancelled' }).eq('id', id);
    if (error) return toast(error.message, 'err');
    toast('Payment rejected', 'warn');
    load();
  };

  const deleteOrder = async (id) => {
    if (!confirm('Delete this order permanently?')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) return toast(error.message, 'err');
    toast('Order deleted', 'ok');
    load();
  };

  const bulk = async (action) => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    if (action === 'verify') {
      const { error } = await supabase.from('orders').update({ payment_status: 'verified', status: 'Un-processed' }).in('id', ids);
      if (error) return toast(error.message, 'err');
      toast(`${ids.length} verified`, 'ok');
    } else if (action === 'reject') {
      if (!confirm(`Reject ${ids.length} payment(s)?`)) return;
      const { error } = await supabase.from('orders').update({ payment_status: 'rejected', status: 'Cancelled' }).in('id', ids);
      if (error) return toast(error.message, 'err');
      toast(`${ids.length} rejected`, 'warn');
    } else if (action === 'delete') {
      if (!confirm(`Delete ${ids.length} order(s)?`)) return;
      const { error } = await supabase.from('orders').delete().in('id', ids);
      if (error) return toast(error.message, 'err');
      toast(`${ids.length} deleted`, 'ok');
    }
    setSelected(new Set());
    load();
  };

  if (!isAdmin) return <div className="glass-tile rounded-2xl p-10 text-center text-muted text-[13px]">Admins only</div>;

  const isPending = filter === 'awaiting_verification';
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectableIds = isPending ? orders.filter((o) => !o.payment_status || o.payment_status === 'awaiting_verification').map((o) => o.id) : orders.map((o) => o.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const someSelected = selectableIds.some((id) => selected.has(id));
  const onMasterToggle = () => { if (allSelected) setSelected(new Set()); else setSelected(new Set(selectableIds)); };

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`shrink-0 px-3.5 md:px-4 py-2 md:py-2.5 rounded-xl font-extrabold text-[11.5px] md:text-[12.5px] transition ${
              filter === t.id ? 'bg-brand text-white shadow-md' : 'btn-glass'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="glass-tile-flat rounded-2xl overflow-hidden min-w-0">
        <div className="relative z-10 px-4 md:px-5 py-3.5 md:py-4 border-b border-line/60 flex justify-between items-center">
          <div className="min-w-0">
            <h3 className="font-black text-[13.5px] md:text-[15px]">Payment Verification</h3>
            <p className="text-[11px] md:text-[11.5px] text-muted font-semibold mt-0.5">
              Bank transfers · {loading ? '...' : orders.length}
            </p>
          </div>
          <button onClick={load} className="btn-glass shrink-0">Refresh</button>
        </div>

        <div className="relative z-10 min-w-0">
          {loading ? (
            <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-surface-2/60 animate-pulse" />)}</div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center text-muted text-[13px]">No {filter.replace('_', ' ')} payments</div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="md:hidden">
                {orders.map((o) => {
                  const canAct = !o.payment_status || o.payment_status === 'awaiting_verification';
                  return (
                    <div key={o.id} className="px-4 py-3.5 border-b border-line/30 last:border-b-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <button onClick={() => setDetail(o)} className="font-mono text-brand font-extrabold text-[12px] truncate text-left">
                          #{o.order_number || o.id.split('-')[0].toUpperCase()}
                        </button>
                        {canAct ? (
                          <span className="bg-warn/15 text-warn text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase shrink-0">Pending</span>
                        ) : o.payment_status === 'verified' ? (
                          <span className="bg-ok/15 text-ok text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase shrink-0">Verified</span>
                        ) : (
                          <span className="bg-bad/15 text-bad text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase shrink-0">Rejected</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="text-[12px] text-ink-2 font-semibold truncate">
                          {o.guest_name || 'Guest'} · {o.guest_phone}
                        </div>
                        <div className="text-[14.5px] font-black shrink-0">{fmt(o.total_amount)}</div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap mt-2.5">
                        <button onClick={() => setDetail(o)} className="btn-glass text-[11px] py-1.5 px-2.5">
                          <Icon name="eye" size={11} />
                          View
                        </button>
                        {o.payment_proof_url && (
                          <button onClick={() => setProofImg(o.payment_proof_url)} className="btn-glass-brand text-[11px] py-1.5 px-2.5">
                            <Icon name="image" size={11} />
                            Proof
                          </button>
                        )}
                        {canAct ? (
                          <>
                            <button onClick={() => verify(o.id)} className="btn-glass-success text-[11px] py-1.5 px-2.5">
                              <Icon name="check" size={11} />
                              Approve
                            </button>
                            <button onClick={() => reject(o.id)} className="btn-glass-danger text-[11px] py-1.5 px-2.5">
                              <Icon name="x" size={11} />
                              Reject
                            </button>
                          </>
                        ) : (
                          <button onClick={() => deleteOrder(o.id)} className="btn-glass-danger text-[11px] py-1.5 px-2.5">
                            <Icon name="trash" size={11} />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-2/60 text-[10.5px] uppercase text-muted font-extrabold tracking-wider">
                    <tr>
                      <th className="p-3 w-10 text-left">
                        <input type="checkbox" className="accent-brand w-4 h-4 cursor-pointer disabled:opacity-30" disabled={selectableIds.length === 0} checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }} onChange={onMasterToggle} />
                      </th>
                      <th className="p-3 text-left">Order</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Customer</th>
                      <th className="p-3 text-left">Proof</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const canAct = !o.payment_status || o.payment_status === 'awaiting_verification';
                      return (
                        <tr key={o.id} className={`border-t border-line/30 ${selected.has(o.id) ? 'bg-brand-light/50' : 'hover:bg-surface-2/40'}`}>
                          <td className="p-3">
                            <input type="checkbox" className="accent-brand w-4 h-4 cursor-pointer" checked={selected.has(o.id)} onChange={() => toggle(o.id)} />
                          </td>
                          <td className="p-3">
                            <button onClick={() => setDetail(o)} className="font-mono text-brand font-extrabold text-[12.5px] hover:underline">#{o.order_number || o.id.split('-')[0].toUpperCase()}</button>
                          </td>
                          <td className="p-3 font-extrabold text-[13px]">{fmt(o.total_amount)}</td>
                          <td className="p-3">
                            <div className="font-extrabold text-ink-2 text-[12.5px]">{o.guest_name || 'Guest'}</div>
                            <div className="text-[11.5px] text-muted font-medium">{o.guest_phone}</div>
                          </td>
                          <td className="p-3">
                            {o.payment_proof_url ? (
                              <button onClick={() => setProofImg(o.payment_proof_url)} className="btn-glass-brand"><Icon name="image" size={12} /> View</button>
                            ) : (
                              <span className="text-[11px] text-muted font-semibold">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1.5 flex-wrap">
                              <button onClick={() => setDetail(o)} className="btn-glass"><Icon name="eye" size={12} /> View</button>
                              {canAct ? (
                                <>
                                  <button onClick={() => verify(o.id)} className="btn-glass-success"><Icon name="check" size={12} /> Approve</button>
                                  <button onClick={() => reject(o.id)} className="btn-glass-danger"><Icon name="x" size={12} /> Reject</button>
                                </>
                              ) : (
                                <button onClick={() => deleteOrder(o.id)} className="btn-glass-danger"><Icon name="trash" size={12} /> Delete</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {selected.size > 0 && isPending && (
        <div className="bulk-bar-wrap">
          <div className="bulk-bar-inner glass-tile rounded-2xl p-2.5 px-3 md:p-3 md:px-4 shadow-2xl flex items-center gap-2 md:gap-3 overflow-x-auto">
            <span className="relative z-10 text-[12px] md:text-[13px] font-extrabold whitespace-nowrap">
              <b className="text-brand text-[14px] mr-1">{selected.size}</b> selected
            </span>
            <button onClick={() => bulk('verify')} className="btn-glass-success relative z-10 text-[11px] md:text-xs py-1.5 md:py-2 px-2.5 md:px-3.5 shrink-0">Verify</button>
            <button onClick={() => bulk('reject')} className="btn-glass-danger relative z-10 text-[11px] md:text-xs py-1.5 md:py-2 px-2.5 md:px-3.5 shrink-0">Reject</button>
            <button onClick={() => bulk('delete')} className="btn-glass-danger relative z-10 text-[11px] md:text-xs py-1.5 md:py-2 px-2.5 md:px-3.5 shrink-0">Delete</button>
            <button onClick={() => setSelected(new Set())} className="btn-glass relative z-10 text-[11px] md:text-xs py-1.5 md:py-2 px-2.5 md:px-3.5 shrink-0">Clear</button>
          </div>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Order Details" maxWidth="max-w-[580px]">
        {detail && (
          <div className="space-y-3">
            <div>
              <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1">Order Number</div>
              <div className="font-mono font-extrabold text-brand text-[14px] break-all">#{detail.order_number || detail.id}</div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1">Amount</div>
              <div className="text-[14px] font-black">{fmt(detail.total_amount)}</div>
            </div>
            {detail.items_summary && (
              <div>
                <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1.5">Items</div>
                <div className="text-[13px] text-ink-2 font-semibold bg-surface-2/60 rounded-xl p-3 leading-relaxed">{detail.items_summary}</div>
              </div>
            )}
            <div>
              <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1">Customer</div>
              <div className="text-[13px] font-bold">{detail.guest_name || 'Guest'} · {detail.guest_phone || '—'}</div>
            </div>
            {detail.guest_address && (
              <div>
                <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1">Address</div>
                <div className="text-[13px] font-medium text-ink-2 leading-snug bg-surface-2/60 rounded-xl p-3">{detail.guest_address}</div>
              </div>
            )}
            {detail.payment_proof_url && (
              <div>
                <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1.5">Payment Proof</div>
                <img src={detail.payment_proof_url} alt="" className="w-full max-h-[260px] object-contain rounded-xl border border-line cursor-pointer bg-white" onClick={() => setProofImg(detail.payment_proof_url)} />
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setDetail(null)} className="btn-glass flex-1 py-2.5">Close</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!proofImg} onClose={() => setProofImg(null)} title="Payment Proof" maxWidth="max-w-[560px]">
        {proofImg && (
          <div className="text-center">
            <img src={proofImg} alt="" className="w-full max-h-[500px] object-contain rounded-xl border border-line bg-white" />
            <button onClick={() => window.open(proofImg, '_blank')} className="btn-glass-brand mt-3 mx-auto">
              <Icon name="eye" size={13} />
              Open Full Size
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
