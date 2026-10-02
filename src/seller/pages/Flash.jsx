import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';

export default function Flash() {
  const { user, isAdmin } = useSeller();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ product_id: '', discount_percent: '', ends_at: '' });

  const load = async () => {
    setLoading(true);
    try {
      let pq = supabase.from('products').select('id,title').eq('status', 'active');
      if (!isAdmin) pq = pq.eq('seller_id', user.id);
      const [pr, fs] = await Promise.all([
        pq,
        supabase.from('flash_sales').select('*').order('created_at', { ascending: false }),
      ]);
      const prods = pr.data || [];
      setProducts(prods);
      const pMap = Object.fromEntries(prods.map((p) => [p.id, p.title]));
      setItems((fs.data || []).map((f) => ({ ...f, product_title: pMap[f.product_id] || '(deleted)' })));
    } catch (e) { toast(e.message, 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, isAdmin]);

  const save = async () => {
    if (!form.product_id) return toast('Select product', 'warn');
    const disc = parseFloat(form.discount_percent);
    if (!disc || disc <= 0) return toast('Valid discount required', 'warn');
    if (!form.ends_at) return toast('Set end time', 'warn');

    const { error } = await supabase.from('flash_sales').insert([{
      seller_id: isAdmin ? null : user.id,
      product_id: form.product_id,
      discount_percent: disc,
      starts_at: new Date().toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      active: true,
    }]);
    if (error) return toast(error.message, 'err');
    toast('Flash sale created', 'ok');
    setOpen(false);
    setForm({ product_id: '', discount_percent: '', ends_at: '' });
    load();
  };

  const del = async (id) => {
    if (!confirm('Delete flash sale?')) return;
    const { error } = await supabase.from('flash_sales').delete().eq('id', id);
    if (error) return toast(error.message, 'err');
    toast('Deleted', 'ok');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="glass-tile rounded-2xl overflow-hidden">
        <div className="relative z-10 px-5 py-4 border-b border-line/60 flex justify-between items-center">
          <div>
            <h3 className="font-black text-[15px]">Flash Sales</h3>
            <p className="text-[11.5px] text-muted font-semibold mt-0.5">
              {loading ? 'Loading...' : `${items.length} sale${items.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="btn-ghost text-xs py-2.5 px-3.5">Refresh</button>
            <button onClick={() => setOpen(true)} className="btn-primary text-xs py-2.5 px-3.5">
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
              <div className="text-[13.5px] font-extrabold text-ink mb-1">No flash sales</div>
              <div className="text-[12px] text-muted">Create one to boost sales.</div>
            </div>
          ) : items.map((f) => {
            const exp = new Date(f.ends_at) < new Date();
            const s = !f.active ? 'ina' : exp ? 'can' : 'act';
            return (
              <div key={f.id} className="flex items-center gap-3.5 px-5 py-3.5 border-t border-line/30">
                <span className="w-10 h-10 rounded-xl bg-brandOrange/15 text-brandOrange flex items-center justify-center shrink-0">
                  <Icon name="flame" size={17} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-extrabold text-ink truncate">{f.product_title}</div>
                  <div className="text-[11.5px] text-muted font-semibold">
                    {Number(f.discount_percent)}% OFF · ends {new Date(f.ends_at).toLocaleString()}
                  </div>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase shrink-0 ${
                  s === 'act' ? 'bg-ok/15 text-ok' : s === 'can' ? 'bg-bad/15 text-bad' : 'bg-surface-2 text-muted'
                }`}>
                  {s === 'act' ? 'Live' : s === 'can' ? 'Ended' : 'Inactive'}
                </span>
                <button onClick={() => del(f.id)} className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg text-bad hover:bg-bad/10">
                  Del
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Flash Sale" maxWidth="max-w-[520px]">
        <select value={form.product_id} onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))} className="form-input mb-2.5">
          <option value="">Select product *</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <input type="number" value={form.discount_percent} onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))} placeholder="Discount % *" className="form-input mb-2.5" />
        <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))} className="form-input mb-4" />
        <button onClick={save} className="btn-primary w-full">Create Flash Sale</button>
      </Modal>
    </div>
  );
}
