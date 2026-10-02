import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';

export default function Vouchers() {
  const { user, isAdmin } = useSeller();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_order_amount: 0, max_uses: '', expires_at: '', active: true });

  const load = async () => {
    setLoading(true);
    try {
      let q = supabase.from('vouchers').select('*').order('created_at', { ascending: false });
      if (!isAdmin) q = q.eq('seller_id', user.id);
      const { data } = await q;
      setItems(data || []);
    } catch (e) { toast(e.message, 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, isAdmin]);

  const openNew = () => {
    setEditingId(null);
    setForm({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_order_amount: 0, max_uses: '', expires_at: '', active: true });
    setOpen(true);
  };

  const openEdit = (v) => {
    setEditingId(v.id);
    setForm({
      code: v.code || '',
      description: v.description || '',
      discount_type: v.discount_type || 'percentage',
      discount_value: v.discount_value || '',
      min_order_amount: v.min_order_amount || 0,
      max_uses: v.max_uses || '',
      expires_at: v.expires_at ? new Date(v.expires_at).toISOString().slice(0, 16) : '',
      active: v.active !== false,
    });
    setOpen(true);
  };

  const save = async () => {
    const code = form.code.trim().toUpperCase();
    const val = parseFloat(form.discount_value);
    if (!code) return toast('Code required', 'warn');
    if (!val || val <= 0) return toast('Valid value required', 'warn');

    const payload = {
      code, description: form.description.trim() || null,
      discount_type: form.discount_type, discount_value: val,
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      active: form.active,
      seller_id: isAdmin ? null : user.id,
    };

    let err;
    if (editingId) {
      const r = await supabase.from('vouchers').update(payload).eq('id', editingId);
      err = r.error;
    } else {
      const r = await supabase.from('vouchers').insert([payload]);
      err = r.error;
    }
    if (err) return toast(err.message, 'err');
    toast(editingId ? 'Updated' : 'Created', 'ok');
    setOpen(false);
    load();
  };

  const del = async (id) => {
    if (!confirm('Delete voucher?')) return;
    const { error } = await supabase.from('vouchers').delete().eq('id', id);
    if (error) return toast(error.message, 'err');
    toast('Deleted', 'ok');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="glass-tile rounded-2xl overflow-hidden">
        <div className="relative z-10 px-5 py-4 border-b border-line/60 flex justify-between items-center">
          <div>
            <h3 className="font-black text-[15px]">Vouchers</h3>
            <p className="text-[11.5px] text-muted font-semibold mt-0.5">
              {loading ? 'Loading...' : `${items.length} voucher${items.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="btn-ghost text-xs py-2.5 px-3.5">Refresh</button>
            <button onClick={openNew} className="btn-primary text-xs py-2.5 px-3.5">
              <Icon name="plus" size={13} color="white" strokeWidth={2.6} />
              Create
            </button>
          </div>
        </div>
        <div className="relative z-10">
          {loading ? (
            <div className="p-4 space-y-2">{[1,2].map(i => <div key={i} className="h-14 rounded-xl bg-surface-2/60 animate-pulse" />)}</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-[13.5px] font-extrabold text-ink mb-1">No vouchers</div>
              <div className="text-[12px] text-muted">Create a discount code to boost sales.</div>
            </div>
          ) : items.map((v) => {
            const disc = v.discount_type === 'percentage' ? `${v.discount_value}%` : `Rs. ${Number(v.discount_value).toLocaleString()}`;
            const exp = v.expires_at && new Date(v.expires_at) < new Date();
            return (
              <div key={v.id} className="flex items-center gap-3.5 px-5 py-3.5 border-t border-line/30">
                <span className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                  <Icon name="ticket" size={17} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-mono font-extrabold text-brand">{v.code}</div>
                  <div className="text-[11.5px] text-muted font-semibold">{disc} off · min Rs. {Number(v.min_order_amount || 0).toLocaleString()}</div>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase shrink-0 ${
                  !v.active ? 'bg-surface-2 text-muted' : exp ? 'bg-bad/15 text-bad' : 'bg-ok/15 text-ok'
                }`}>
                  {!v.active ? 'Off' : exp ? 'Expired' : 'Active'}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(v)} className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-brand-light hover:text-brand">Edit</button>
                  <button onClick={() => del(v.id)} className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg text-bad hover:bg-bad/10">Del</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Edit Voucher' : 'Create Voucher'} maxWidth="max-w-[520px]">
        <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="Code (e.g. SUMMER20) *" className="form-input mb-2.5 font-mono font-extrabold" />
        <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" className="form-input mb-2.5" />
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <select value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))} className="form-input">
            <option value="percentage">Percentage %</option>
            <option value="fixed">Fixed Rs.</option>
          </select>
          <input type="number" value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))} placeholder="Value *" className="form-input" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <input type="number" value={form.min_order_amount} onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))} placeholder="Min order Rs." className="form-input" />
          <input type="number" value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))} placeholder="Max uses" className="form-input" />
        </div>
        <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} className="form-input mb-3" />
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-brand" />
          <span className="text-[13px] font-semibold">Active</span>
        </label>
        <button onClick={save} className="btn-primary w-full">{editingId ? 'Update' : 'Create'}</button>
      </Modal>
    </div>
  );
}
