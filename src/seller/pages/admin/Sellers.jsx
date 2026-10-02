import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSeller } from '../../../seller/contexts/SellerContext';
import { useToast } from '../../../contexts/ToastContext';
import { getOrCreateAdminSellerConversation } from '../../../lib/chat';
import Icon from '../../../components/ui/Icon';
import Modal from '../../../components/ui/Modal';

export default function Sellers() {
  const { user, isAdmin } = useSeller();
  const { toast } = useToast();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailStats, setDetailStats] = useState({ products: 0, orders: 0, revenue: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: false });
      setSellers(data || []);
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const openDetail = async (s) => {
    setDetail(s);
    try {
      const [p, o] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', s.id),
        supabase.from('orders').select('total_amount').eq('seller_id', s.id),
      ]);
      const revenue = (o.data || []).reduce((sum, x) => sum + Number(x.total_amount || 0), 0);
      setDetailStats({ products: p.count || 0, orders: (o.data || []).length, revenue });
    } catch {}
  };

  const toggleStatus = async (id, newStatus) => {
    if (id === user.id) return toast('You cannot change your own status', 'warn');
    const { error } = await supabase.from('sellers').update({ status: newStatus }).eq('id', id);
    if (error) return toast(error.message, 'err');
    toast(`Seller ${newStatus}`, 'ok');
    load();
  };

  const deleteSeller = async (s) => {
    if (s.id === user.id) return toast('You cannot delete your own admin account', 'warn');
    if (!confirm(`Delete "${s.store_name || s.full_name}"?\n\nThis removes their products, chats, orders, vouchers and free up their email for re-registration. Cannot be undone.`)) return;
    try {
      const { data, error } = await supabase.rpc('delete_seller_cascade', { seller_uuid: s.id });
      if (error) throw new Error(error.message);
      if (data && data.ok === false) throw new Error(data.error || 'Delete failed');
      toast('Seller deleted', 'ok');
      load();
    } catch (e) {
      toast(e.message || 'Delete failed', 'err');
      console.error('[delete seller]', e);
    }
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected).filter((id) => id !== user.id);
    if (!ids.length) return toast('No deletable sellers selected', 'warn');
    if (!confirm(`Delete ${ids.length} seller(s)? Cannot be undone.`)) return;
    let ok = 0, fail = 0;
    for (const id of ids) {
      const rpc = await supabase.rpc('delete_seller_cascade', { seller_uuid: id });
      if (rpc.error) fail++; else ok++;
    }
    toast(`${ok} deleted${fail ? ` · ${fail} failed` : ''}`, fail ? 'warn' : 'ok');
    setSelected(new Set());
    load();
  };

  const bulkStatus = async (newStatus) => {
    const ids = Array.from(selected).filter((id) => id !== user.id);
    if (!ids.length) return toast('No editable sellers selected', 'warn');
    const { error } = await supabase.from('sellers').update({ status: newStatus }).in('id', ids);
    if (error) return toast(error.message, 'err');
    toast(`${ids.length} → ${newStatus}`, 'ok');
    setSelected(new Set());
    load();
  };

  const openChatWith = async (s) => {
    if (s.id === user.id) return toast('You cannot chat with yourself', 'warn');
    setBusyId(s.id);
    try {
      await getOrCreateAdminSellerConversation(s.id);
      toast(`Chat started with ${s.store_name || s.full_name}`, 'ok');
      setTimeout(() => { window.location.href = '/seller/messages'; }, 400);
    } catch (e) {
      toast(e.message || 'Failed', 'err');
    } finally {
      setBusyId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="glass-tile rounded-2xl p-10 text-center">
        <div className="relative z-10">
          <div className="text-[15px] font-black mb-1">Admins only</div>
          <div className="text-[12px] text-muted">This page is restricted.</div>
        </div>
      </div>
    );
  }

  const filtered = sellers.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (s.store_name || '').toLowerCase().includes(q) ||
        (s.full_name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q)
      );
    }
    return true;
  });

  const selectableIds = filtered.filter((s) => s.id !== user.id).map((s) => s.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const someSelected = selectableIds.some((id) => selected.has(id));

  const toggleSel = (id) => {
    if (id === user.id) return;
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(selectableIds));
  };

  return (
    <div className="space-y-5">
      <div className="glass-tile-flat rounded-2xl overflow-hidden">
        <div className="relative z-10 px-5 py-4 border-b border-line/60 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="font-black text-[15px]">All Sellers</h3>
            <p className="text-[11.5px] text-muted font-semibold mt-0.5">
              {loading ? 'Loading...' : `${filtered.length} of ${sellers.length}`}
            </p>
          </div>
          <button onClick={load} className="btn-glass relative z-10">Refresh</button>
          <button
            onClick={async () => {
              if (!confirm('Purge orphan auth users?\n\nThis deletes any auth accounts that have no seller/customer profile. Fixes "email already registered" errors.')) return;
              try {
                const { data } = await supabase.rpc('purge_orphan_auth_users');
                toast(`Purged ${data?.deleted ?? 0} orphan account(s)`, 'ok');
              } catch (e) { toast(e.message, 'err'); }
            }}
            className="btn-glass-warn relative z-10"
            title="Clean up stuck signup emails"
          >
            Purge Orphans
          </button>
        </div>

        <div className="relative z-10 p-4 border-b border-line/40 flex gap-2.5 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by store, name, email, phone..."
            className="form-input mb-0 flex-1 min-w-[220px]"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input mb-0 max-w-[180px]">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2/60 text-[10.5px] uppercase text-muted font-extrabold tracking-wider">
              <tr>
                <th className="p-3 w-10 text-left">
                  <input
                    type="checkbox"
                    className="accent-brand w-4 h-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={selectableIds.length === 0}
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={toggleAll}
                  />
                </th>
                <th className="p-3 text-left">Store</th>
                <th className="p-3 text-left">Owner</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted text-[13px]">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted text-[13px]">
                    No sellers match.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isSelf = s.id === user.id;
                  return (
                    <tr
                      key={s.id}
                      className={`border-t border-line/30 ${
                        selected.has(s.id) ? 'bg-brand-light/50' : 'hover:bg-surface-2/40'
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          className="accent-brand w-4 h-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={isSelf}
                          checked={selected.has(s.id)}
                          onChange={() => toggleSel(s.id)}
                        />
                      </td>
                      <td className="p-3">
                        <button onClick={() => openDetail(s)} className="flex items-center gap-2.5 text-left">
                          {s.store_logo_url ? (
                            <img
                              src={s.store_logo_url}
                              alt=""
                              className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-line shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white flex items-center justify-center font-black text-[14px] shrink-0">
                              {(s.store_name || s.full_name || 'S').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-[12.5px] truncate flex items-center gap-1.5">
                              {s.store_name || '—'}
                              {isSelf && (
                                <span className="bg-accent text-ink text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[10.5px] text-muted font-mono">
                              TM-{s.id.split('-')[0].toUpperCase()}
                            </div>
                          </div>
                        </button>
                      </td>
                      <td className="p-3 text-[12.5px] font-medium">{s.full_name || '—'}</td>
                      <td className="p-3 text-[12px] text-muted">
                        <div className="truncate max-w-[180px]">{s.email || '—'}</div>
                        <div>{s.phone || '—'}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase ${
                            s.status === 'active'
                              ? 'bg-ok/15 text-ok'
                              : s.status === 'suspended'
                              ? 'bg-bad/15 text-bad'
                              : 'bg-warn/15 text-warn'
                          }`}
                        >
                          {s.status || 'pending'}
                        </span>
                      </td>
                      <td className="p-3">
                        {isSelf ? (
                          <span className="text-[11px] text-muted font-semibold italic">
                            That's you
                          </span>
                        ) : (
                          <div className="flex gap-1.5 flex-wrap">
                            <button
                              onClick={() => openChatWith(s)}
                              disabled={busyId === s.id}
                              className="btn-glass-brand"
                              title="Chat"
                            >
                              {busyId === s.id ? '...' : <Icon name="message" size={12} />}
                            </button>
                            <button
                              onClick={() => toggleStatus(s.id, s.status === 'active' ? 'pending' : 'active')}
                              className={s.status === 'active' ? 'btn-glass-warn' : 'btn-glass-success'}
                              title={s.status === 'active' ? 'Suspend' : 'Approve'}
                            >
                              {s.status === 'active' ? <Icon name="lock" size={12} /> : <Icon name="check" size={12} />}
                            </button>
                            <button
                              onClick={() => deleteSeller(s)}
                              className="btn-glass-danger"
                              title="Delete"
                            >
                              <Icon name="trash" size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar-wrap">
          <div className="bulk-bar-inner glass-tile rounded-2xl p-3 px-4 shadow-2xl flex items-center gap-3">
            <span className="relative z-10 text-[13px] font-extrabold whitespace-nowrap">
              <b className="text-brand text-[15px] mr-1">{selected.size}</b> selected
            </span>
            <button onClick={() => bulkStatus('active')} className="btn-glass-success relative z-10 py-2 px-3.5">
              Activate
            </button>
            <button onClick={() => bulkStatus('pending')} className="btn-glass-warn relative z-10 py-2 px-3.5">
              Suspend
            </button>
            <button onClick={bulkDelete} className="btn-glass-danger relative z-10 py-2 px-3.5">
              Delete All
            </button>
            <button onClick={() => setSelected(new Set())} className="btn-glass relative z-10 py-2 px-3.5">
              Clear
            </button>
          </div>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.store_name || 'Seller'} maxWidth="max-w-[520px]">
        {detail && (
          <div>
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-line/60">
              {detail.store_logo_url ? (
                <img src={detail.store_logo_url} alt="" className="w-16 h-16 rounded-2xl object-contain bg-white p-1 border border-line" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white flex items-center justify-center font-black text-[22px]">
                  {(detail.store_name || 'S').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-black truncate flex items-center gap-2">
                  {detail.store_name || '—'}
                  {detail.id === user.id && (
                    <span className="bg-accent text-ink text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      You
                    </span>
                  )}
                </div>
                <div className="text-[11.5px] font-mono text-muted">TM-{detail.id.split('-')[0].toUpperCase()}</div>
                <div className="text-[11px] text-muted mt-0.5">
                  Joined {detail.created_at ? new Date(detail.created_at).toLocaleDateString() : '—'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {[
                { label: 'Products', value: detailStats.products },
                { label: 'Orders', value: detailStats.orders },
                { label: 'Revenue', value: 'Rs. ' + detailStats.revenue.toLocaleString('en-PK') },
              ].map((s) => (
                <div key={s.label} className="bg-surface-2/60 border border-line/60 rounded-xl p-3 text-center">
                  <div className="text-[15px] font-black text-brand leading-none mb-1">{s.value}</div>
                  <div className="text-[9.5px] uppercase tracking-wider font-extrabold text-muted">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2.5">
              {[
                { label: 'Owner', value: detail.full_name },
                { label: 'Email', value: detail.email },
                { label: 'Phone', value: detail.phone },
                { label: 'CNIC', value: detail.cnic },
                { label: 'Bank', value: detail.bank_details },
              ].map((f) => (
                <div key={f.label} className="flex justify-between gap-3 py-2 border-b border-line/40 last:border-0">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-muted shrink-0">{f.label}</span>
                  <span className="text-[12.5px] font-bold text-ink text-right break-all">{f.value || '—'}</span>
                </div>
              ))}
            </div>

            {detail.id !== user.id && (
              <div className="grid grid-cols-2 gap-2 mt-5">
                <button onClick={() => openChatWith(detail)} className="btn-glass-brand py-2.5">
                  <Icon name="message" size={13} />
                  Chat
                </button>
                <button
                  onClick={() => { deleteSeller(detail); setDetail(null); }}
                  className="btn-glass-danger py-2.5"
                >
                  <Icon name="trash" size={13} />
                  Delete Seller
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}



