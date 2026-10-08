import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { useToast } from '../../contexts/ToastContext';
import { fmt, calcPayout } from '../../lib/format';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';

const TABS = ['Un-processed', 'Dispatched', 'Delivered', 'Cancelled'];
const TM_LOGO = 'https://res.cloudinary.com/qttahghy/image/upload/f_auto,q_auto,w_440/techmarkaz-logo';

function ShippingLabel({ order, seller }) {
  const bcRef = useRef(null);

  const tracking = order.order_number || ('TM-' + order.id.split('-')[0].toUpperCase());
  const sellerCode = seller?.id ? 'TM-' + seller.id.split('-')[0].toUpperCase() : 'TM-000000';
  const sellerName = seller?.store_name || seller?.full_name || 'Tech Markaz';
  const sellerPhone = seller?.phone || '—';
  const sellerLogo = seller?.store_logo_url || TM_LOGO;
  const isPrepaid = (order.payment_method === 'bank_transfer' && order.payment_status === 'verified') || order.is_paid;
  const items = (order.items_summary || '').split(';').filter(Boolean);
  const qty = items.length || 1;
  const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(tracking + '|' + (order.guest_phone || ''));

  useEffect(() => {
    try {
      if (bcRef.current) {
        JsBarcode(bcRef.current, tracking, {
          format: 'CODE128', width: 2.2, height: 60, displayValue: false, margin: 0,
        });
      }
    } catch (e) { console.warn('Barcode error:', e); }
  }, [tracking]);

  return (
    <div id="tm-print-area" className="bg-white text-black border-2 border-black mx-auto" style={{ maxWidth: 520, fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="grid grid-cols-2 border-b-2 border-black">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase border-r-2 border-black">Sales Order</div>
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase">Marketplace</div>
      </div>

      {/* Barcode */}
      <div className="py-3 text-center border-b-2 border-black">
        <svg ref={bcRef} className="mx-auto block" />
      </div>

      {/* Tracking */}
      <div className="px-3 py-2 text-center border-b-2 border-black">
        <div className="text-[9.5px] font-bold uppercase tracking-wide mb-0.5">Tracking Number</div>
        <div className="text-[13px] font-black tracking-wider">{tracking}</div>
      </div>

      {/* Seller + Meta */}
      <div className="grid grid-cols-[55%_45%] border-b-2 border-black">
        <div className="border-r-2 border-black px-3 py-3 flex flex-col items-center justify-center text-center min-h-[110px]">
          <img src={sellerLogo} alt="" className="max-w-[110px] max-h-[40px] object-contain mb-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="font-mono text-[10px] font-black border border-black rounded px-2 py-0.5">{sellerCode}</div>
        </div>
        <div className="grid grid-rows-5">
          <div className="px-3 py-1 text-[10.5px] font-black uppercase border-b border-black flex items-center">Standard</div>
          <div className="px-3 py-1 text-[10.5px] font-black uppercase border-b border-black flex items-center">0.5 KG</div>
          <div className="px-3 py-1 text-[10.5px] font-black uppercase border-b border-black flex items-center">Home</div>
          <div className="px-3 py-1 text-[10.5px] font-black uppercase border-b border-black flex items-center">{isPrepaid ? 'Prepaid' : 'COD'}</div>
          <div className="px-3 py-1 text-[10.5px] font-black uppercase flex items-center">PKR {Number(order.total_amount || 0).toFixed(2)}</div>
        </div>
      </div>

      {/* Order number */}
      <div className="px-3 py-1.5 text-[11px] border-b border-black text-center">
        Order Number: <span className="font-mono font-black">{order.order_number || order.id.split('-')[0].toUpperCase()}</span>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 border-b-2 border-black">
        <div className="px-3 py-1.5 text-[10.5px] border-r border-black">Order Date: <b>{orderDate}</b></div>
        <div className="px-3 py-1.5 text-[10.5px]">AWB Print: <b>{printDate}</b></div>
      </div>

      {/* QR + Recipient + Sender */}
      <div className="grid grid-cols-[110px_1fr] border-b-2 border-black">
        <div className="border-r-2 border-black p-2 flex items-center justify-center">
          <img src={qrUrl} alt="QR" className="w-[90px] h-[90px] block" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
        <div className="p-2.5 text-[10.5px] leading-[1.55]">
          <div className="mb-2">
            <span className="font-black uppercase text-[9.5px]">Recipient </span>
            <span className="font-bold">{order.guest_name || 'Guest'}</span>
            <div className="text-[10px] mt-0.5">{(order.guest_address || '—').slice(0, 160)}</div>
            <div className="text-[10px] mt-0.5">Phone <b>{order.guest_phone || '—'}</b></div>
          </div>
          <div className="pt-2 border-t border-black">
            <span className="font-black uppercase text-[9.5px]">Sender </span>
            <span className="font-bold">{sellerName}</span>
            <div className="text-[10px] mt-0.5">Phone <b>{sellerPhone}</b></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="grid grid-cols-2">
        <div className="px-3 py-1.5 text-[10.5px] font-black uppercase border-r-2 border-black">Qty: {qty}</div>
        <div className="px-3 py-1.5 text-[10.5px] font-black uppercase">Tech Markaz</div>
      </div>
    </div>
  );
}

export default function Orders() {
  const { user, isAdmin, seller } = useSeller();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('Un-processed');
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [proofImg, setProofImg] = useState(null);
  const [labelOrder, setLabelOrder] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      let q = supabase.from('orders').select('*').eq('status', status).order('created_at', { ascending: false });
      if (!isAdmin) q = q.eq('seller_id', user.id);
      const { data, error } = await q;
      if (error) throw error;
      const visible = isAdmin ? data || [] : (data || []).filter((o) => !o.payment_method || o.payment_method === 'cod' || (o.payment_method === 'bank_transfer' && o.payment_status === 'verified'));
      setOrders(visible);
    } catch (err) { toast(err.message, 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); setSelected(new Set()); /* eslint-disable-next-line */ }, [status, user, isAdmin]);

  const toggleOne = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectableIds = orders.map((o) => o.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const someSelected = selectableIds.some((id) => selected.has(id));
  const toggleAll = () => { if (allSelected) setSelected(new Set()); else setSelected(new Set(selectableIds)); };

  const bulkUpdate = async (newStatus) => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const updates = { status: newStatus };
    if (newStatus === 'Dispatched') updates.dispatched_at = new Date().toISOString();
    if (newStatus === 'Delivered') updates.delivered_at = new Date().toISOString();
    const { error } = await supabase.from('orders').update(updates).in('id', ids);
    if (error) return toast(error.message, 'err');
    toast(`${ids.length} order${ids.length === 1 ? '' : 's'} marked ${newStatus}`, 'ok');
    setSelected(new Set()); loadOrders();
  };

  const deleteOrder = async (id) => {
    if (!confirm('Delete this order permanently?')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) return toast(error.message, 'err');
    toast('Order deleted', 'ok'); loadOrders();
  };

  const paymentBadge = (o) => {
    if (!o.payment_method || o.payment_method === 'cod') return <span className="bg-surface-2 text-ink-2 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">COD</span>;
    if (o.payment_method === 'bank_transfer') {
      if (o.payment_status === 'verified') return <span className="bg-ok/15 text-ok text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">Bank · Paid</span>;
      if (o.payment_status === 'rejected') return <span className="bg-bad/15 text-bad text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">Bank · Rej</span>;
      return <span className="bg-brand-light text-brand text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">Bank · Pending</span>;
    }
    return null;
  };
  const statusBadge = (s) => {
    const map = { 'Un-processed': 'bg-warn/15 text-warn', Dispatched: 'bg-brand-light text-brand', Delivered: 'bg-ok/15 text-ok', Cancelled: 'bg-bad/15 text-bad' };
    return <span className={`${map[s] || 'bg-surface-2 text-muted'} text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase`}>{s}</span>;
  };
  const payout = detail ? calcPayout(detail.total_amount) : null;

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`shrink-0 px-3.5 md:px-4 py-2 md:py-2.5 rounded-xl font-extrabold text-[11.5px] md:text-[12.5px] transition ${status === s ? 'bg-brand text-white shadow-md' : 'btn-glass'}`}>
            {s === 'Un-processed' ? 'New' : s}
          </button>
        ))}
      </div>

      <div className="glass-tile-flat rounded-2xl overflow-hidden min-w-0">
        <div className="relative z-10 px-4 md:px-5 py-3.5 border-b border-line/60 flex justify-between items-center">
          <h3 className="font-black text-[13.5px] md:text-[14px]">
            {loading ? 'Loading...' : `${orders.length} order${orders.length === 1 ? '' : 's'}`}
          </h3>
          <button onClick={loadOrders} className="btn-glass">Refresh</button>
        </div>

        <div className="relative z-10 min-w-0">
          {loading ? (
            <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-surface-2/60 animate-pulse" />)}</div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center"><div className="text-[13px] font-extrabold text-ink mb-1">No {status.toLowerCase()} orders</div><div className="text-[11.5px] text-muted">Orders show up here.</div></div>
          ) : (
            <>
              <div className="md:hidden">
                {orders.map((o) => (
                  <div key={o.id} className="px-4 py-3.5 border-b border-line/30 last:border-b-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <button onClick={() => setDetail(o)} className="font-mono text-brand font-extrabold text-[12px] truncate text-left">
                        #{o.order_number || o.id.split('-')[0].toUpperCase()}
                      </button>
                      <div className="flex gap-1.5 shrink-0">{paymentBadge(o)}{statusBadge(o.status)}</div>
                    </div>
                    <div className="text-[12px] text-ink-2 font-semibold line-clamp-2 mb-2">{o.items_summary || '—'}</div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="text-[11.5px] text-muted font-medium truncate">{o.guest_name || 'Guest'} · {o.guest_phone}</div>
                      <div className="text-[14.5px] font-black shrink-0">{fmt(o.total_amount)}</div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => setDetail(o)} className="btn-glass text-[11px] py-1.5 px-2.5"><Icon name="eye" size={11} /> View</button>
                      {o.payment_proof_url && (
                        <button onClick={() => setProofImg(o.payment_proof_url)} className="btn-glass-brand text-[11px] py-1.5 px-2.5"><Icon name="image" size={11} /> Proof</button>
                      )}
                      <button onClick={() => setLabelOrder(o)} className="btn-glass-success text-[11px] py-1.5 px-2.5"><Icon name="tag" size={11} /> Label</button>
                      {isAdmin && (
                        <button onClick={() => deleteOrder(o.id)} className="btn-glass-danger text-[11px] py-1.5 px-2.5"><Icon name="trash" size={11} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-2/60 text-[10.5px] uppercase text-muted font-extrabold tracking-wider">
                    <tr>
                      <th className="p-3 w-10 text-left">
                        <input type="checkbox" className="accent-brand w-4 h-4 cursor-pointer disabled:opacity-30" disabled={selectableIds.length === 0} checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }} onChange={toggleAll} />
                      </th>
                      <th className="p-3 text-left">Order</th>
                      <th className="p-3 text-left">Items</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Customer</th>
                      <th className="p-3 text-left">Payment</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className={`border-t border-line/30 ${selected.has(o.id) ? 'bg-brand-light/50' : 'hover:bg-surface-2/40'}`}>
                        <td className="p-3"><input type="checkbox" className="accent-brand w-4 h-4 cursor-pointer" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)} /></td>
                        <td className="p-3"><span className="font-mono text-brand font-extrabold text-[12.5px]">#{o.order_number || o.id.split('-')[0].toUpperCase()}</span></td>
                        <td className="p-3 text-[12px] text-ink-2 font-semibold max-w-[240px] truncate">{o.items_summary}</td>
                        <td className="p-3 font-extrabold text-[13px]">{fmt(o.total_amount)}</td>
                        <td className="p-3">
                          <div className="font-extrabold text-ink-2 text-[12.5px]">{o.guest_name || 'Guest'}</div>
                          <div className="text-[11.5px] text-muted font-medium">{o.guest_phone}</div>
                        </td>
                        <td className="p-3">{paymentBadge(o)}</td>
                        <td className="p-3">{statusBadge(o.status)}</td>
                        <td className="p-3">
                          <div className="flex gap-1.5 flex-wrap">
                            <button onClick={() => setDetail(o)} className="btn-glass"><Icon name="eye" size={12} /> View</button>
                            {o.payment_proof_url && (
                              <button onClick={() => setProofImg(o.payment_proof_url)} className="btn-glass-brand"><Icon name="image" size={12} /> Proof</button>
                            )}
                            <button onClick={() => setLabelOrder(o)} className="btn-glass-success"><Icon name="tag" size={12} /> Label</button>
                            {isAdmin && <button onClick={() => deleteOrder(o.id)} className="btn-glass-danger"><Icon name="trash" size={12} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar-wrap">
          <div className="bulk-bar-inner glass-tile rounded-2xl p-2.5 px-3 md:p-3 md:px-4 shadow-2xl flex items-center gap-2 md:gap-3 overflow-x-auto">
            <span className="relative z-10 text-[12px] md:text-[13px] font-extrabold whitespace-nowrap"><b className="text-brand text-[14px] md:text-[15px] mr-1">{selected.size}</b> selected</span>
            {status === 'Un-processed' && <button onClick={() => bulkUpdate('Dispatched')} className="btn-glass-brand relative z-10 text-[11px] md:text-xs py-1.5 md:py-2 px-2.5 md:px-3.5 shrink-0">Dispatched</button>}
            {status === 'Dispatched' && isAdmin && <button onClick={() => bulkUpdate('Delivered')} className="btn-glass-success relative z-10 text-[11px] md:text-xs py-1.5 md:py-2 px-2.5 md:px-3.5 shrink-0">Delivered</button>}
            <button onClick={() => setSelected(new Set())} className="btn-glass relative z-10 text-[11px] md:text-xs py-1.5 md:py-2 px-2.5 md:px-3.5 shrink-0">Clear</button>
          </div>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Order Details" maxWidth="max-w-[600px]">
        {detail && (
          <div className="space-y-3">
            <div><div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1">Order Number</div><div className="font-mono font-extrabold text-brand text-[14px] break-all">#{detail.order_number || detail.id}</div></div>
            <div className="grid grid-cols-2 gap-3">
              <div><div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1">Amount</div><div className="text-[14px] font-black">{fmt(detail.total_amount)}</div></div>
              <div><div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1">Status</div>{statusBadge(detail.status)}</div>
            </div>
            {detail.items_summary && (<div><div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1.5">Items</div><div className="text-[13px] text-ink-2 font-semibold bg-surface-2/60 rounded-xl p-3 leading-relaxed">{detail.items_summary}</div></div>)}
            <div className="grid grid-cols-2 gap-3">
              <div><div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1">Customer</div><div className="text-[13px] font-bold">{detail.guest_name || 'Guest'}</div></div>
              <div><div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1">Phone</div><div className="text-[13px] font-bold">{detail.guest_phone || '—'}</div></div>
              {detail.guest_address && (<div className="col-span-2"><div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1">Address</div><div className="text-[13px] font-medium text-ink-2 leading-snug bg-surface-2/60 rounded-xl p-3">{detail.guest_address}</div></div>)}
            </div>
            {detail.payment_proof_url && (<div><div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1.5">Payment Proof</div><img src={detail.payment_proof_url} alt="" className="w-full max-h-[220px] object-contain rounded-xl border border-line cursor-pointer bg-white" onClick={() => setProofImg(detail.payment_proof_url)} /></div>)}
            {detail.status === 'Delivered' && payout && (
              <div className="rounded-xl bg-surface-2/60 border border-line/60 p-3.5">
                <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-2.5">Payout Breakdown</div>
                <div className="space-y-1.5 text-[12.5px]">
                  <div className="flex justify-between"><span className="text-muted font-semibold">Gross</span><span className="font-extrabold">{fmt(payout.gross)}</span></div>
                  <div className="flex justify-between"><span className="text-muted font-semibold">Fee (5%)</span><span className="font-extrabold text-bad">− {fmt(payout.platformFee)}</span></div>
                  <div className="flex justify-between"><span className="text-muted font-semibold">Tax (2%)</span><span className="font-extrabold text-bad">− {fmt(payout.tax)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-line/60"><span className="font-black">Net</span><span className="font-black text-brand">{fmt(payout.net)}</span></div>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setDetail(null)} className="btn-glass flex-1 py-2.5">Close</button>
              <button onClick={() => { setLabelOrder(detail); setDetail(null); }} className="btn-glass-success flex-1 py-2.5"><Icon name="tag" size={13} /> Print Label</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!proofImg} onClose={() => setProofImg(null)} title="Payment Proof" maxWidth="max-w-[560px]">
        {proofImg && (
          <div className="text-center">
            <img src={proofImg} alt="" className="w-full max-h-[500px] object-contain rounded-xl border border-line bg-white" />
            <button onClick={() => window.open(proofImg, '_blank')} className="btn-glass-brand mt-3 mx-auto"><Icon name="eye" size={13} /> Open Full Size</button>
          </div>
        )}
      </Modal>

      <Modal open={!!labelOrder} onClose={() => setLabelOrder(null)} title="Shipping Label" maxWidth="max-w-[560px]" noScroll>
        {labelOrder && (
          <div>
            <div className="max-h-[calc(100vh-260px)] overflow-y-auto px-1">
              <ShippingLabel order={labelOrder} seller={isAdmin ? null : seller} />
            </div>
            <div className="flex gap-2.5 mt-3">
              <button onClick={() => setLabelOrder(null)} className="btn-glass flex-1 py-2.5">Close</button>
              <button onClick={() => window.print()} className="btn-glass-brand flex-1 py-2.5"><Icon name="tag" size={13} /> Print</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
