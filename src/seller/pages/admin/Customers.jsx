import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSeller } from '../../../seller/contexts/SellerContext';
import { useToast } from '../../../contexts/ToastContext';
import Icon from '../../../components/ui/Icon';
import Modal from '../../../components/ui/Modal';

export default function Customers() {
  const { isAdmin } = useSeller();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', city: '' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      setItems(data || []);
    } catch (e) { toast(e.message, 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line */ }, [isAdmin]);

  const openEdit = (c) => {
    setEditing(c);
    setForm({ full_name: c.full_name || '', email: c.email || '', phone: c.phone || '', city: c.city || '' });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from('customers').update(form).eq('id', editing.id);
    if (error) return toast(error.message, 'err');
    toast('Customer updated', 'ok');
    setEditing(null);
    load();
  };

  const del = async (c) => {
    if (!confirm(`Delete "${c.full_name || c.email}"?\n\nThis removes their orders, chats and free up their email for re-registration.`)) return;
    try {
      const { data, error } = await supabase.rpc('delete_customer_cascade', { customer_uuid: c.id });
      if (error) throw new Error(error.message);
      if (data && data.ok === false) throw new Error(data.error || 'Delete failed');
      toast('Customer deleted', 'ok');
      load();
    } catch (e) {
      toast(e.message || 'Delete failed', 'err');
      console.error('[delete customer]', e);
    }
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} customer(s)? Cannot be undone.`)) return;
    let ok = 0, fail = 0;
    for (const id of ids) {
      const rpc = await supabase.rpc('delete_customer_cascade', { customer_uuid: id });
      if (rpc.error) fail++; else ok++;
    }
    toast(`${ok} deleted${fail ? ` · ${fail} failed` : ''}`, fail ? 'warn' : 'ok');
    setSelected(new Set());
    load();
  };

  if (!isAdmin) return <div className="glass-tile rounded-2xl p-10 text-center text-muted text-[13px]">Admins only</div>;

  const filtered = items.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(search)
    );
  });

  const toggleSel = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = (on) => setSelected(on ? new Set(filtered.map((c) => c.id)) : new Set());

  return (
    <div className="space-y-5">
      <div className="glass-tile-flat rounded-2xl overflow-hidden">
        <div className="relative z-10 px-5 py-4 border-b border-line/60 flex justify-between items-center">
          <div>
            <h3 className="font-black text-[15px]">All Customers</h3>
            <p className="text-[11.5px] text-muted font-semibold mt-0.5">
              {loading ? 'Loading...' : `${filtered.length} of ${items.length}`}
            </p>
          </div>
          <button onClick={load} className="btn-ghost text-xs py-2.5 px-3.5">Refresh</button>
        </div>

        <div className="relative z-10 p-4 border-b border-line/40">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            className="form-input mb-0"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2/60 text-[10.5px] uppercase text-muted font-extrabold tracking-wider">
              <tr>
                <th className="p-3 w-10 text-left">
                  <input type="checkbox" className="accent-brand w-4 h-4" checked={filtered.length > 0 && selected.size === filtered.length} onChange={(e) => toggleAll(e.target.checked)} />
                </th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Joined</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted text-[13px]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-muted text-[13px]">No customers match.</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className={`border-t border-line/30 ${selected.has(c.id) ? 'bg-brand-light/50' : 'hover:bg-surface-2/40'}`}>
                  <td className="p-3">
                    <input type="checkbox" className="accent-brand w-4 h-4" checked={selected.has(c.id)} onChange={() => toggleSel(c.id)} />
                  </td>
                  <td className="p-3 text-[12.5px] font-bold">{c.full_name || '—'}</td>
                  <td className="p-3 text-[12px] text-muted truncate max-w-[200px]">{c.email || '—'}</td>
                  <td className="p-3 text-[12.5px]">{c.phone || '—'}</td>
                  <td className="p-3 text-[12px] text-muted">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(c)} className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-brand-light hover:text-brand">
                        <Icon name="edit" size={12} />
                      </button>
                      <button onClick={() => del(c)} className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg bg-bad/15 text-bad hover:bg-bad/25">
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar-wrap"><div className="bulk-bar-inner glass-tile rounded-2xl p-3 px-4 shadow-2xl flex items-center gap-3">
          <span className="relative z-10 text-[13px] font-extrabold whitespace-nowrap">
            <b className="text-brand text-[15px] mr-1">{selected.size}</b> selected
          </span>
          <button onClick={bulkDelete} className="relative z-10 text-xs font-extrabold py-2 px-3.5 rounded-lg bg-bad/15 text-bad hover:bg-bad/25">Delete All</button>
          <button onClick={() => setSelected(new Set())} className="relative z-10 text-xs font-extrabold py-2 px-3.5 rounded-lg bg-surface-2 hover:bg-surface-3">Clear</button>
        </div></div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Customer" maxWidth="max-w-[520px]">
        <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Full name" className="form-input mb-2.5" />
        <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" className="form-input mb-2.5" />
        <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="form-input mb-2.5" />
        <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="City" className="form-input mb-4" />
        <div className="flex gap-2.5">
          <button onClick={() => setEditing(null)} className="btn-ghost flex-1">Cancel</button>
          <button onClick={saveEdit} className="btn-primary flex-1">Save Changes</button>
        </div>
      </Modal>
    </div>
  );
}



