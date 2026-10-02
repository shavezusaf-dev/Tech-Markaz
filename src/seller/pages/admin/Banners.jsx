import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSeller } from '../../../seller/contexts/SellerContext';
import { useToast } from '../../../contexts/ToastContext';
import Icon from '../../../components/ui/Icon';
import Modal from '../../../components/ui/Modal';

export default function Banners() {
  const { isAdmin } = useSeller();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ image_url: '', title: '', subtitle: '', link_url: '', position: 0, active: true });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('banners').select('*').order('position', { ascending: true });
      setItems(data || []);
    } catch (e) { toast(e.message, 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line */ }, [isAdmin]);

  const openNew = () => {
    setEditingId(null);
    setForm({ image_url: '', title: '', subtitle: '', link_url: '', position: 0, active: true });
    setOpen(true);
  };

  const openEdit = (b) => {
    setEditingId(b.id);
    setForm({
      image_url: b.image_url || '', title: b.title || '', subtitle: b.subtitle || '',
      link_url: b.link_url || '', position: b.position || 0, active: b.active !== false,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.image_url.trim()) return toast('Image URL required', 'warn');
    const payload = {
      image_url: form.image_url.trim(),
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      link_url: form.link_url.trim() || null,
      position: parseInt(form.position) || 0,
      active: form.active,
    };
    let err;
    if (editingId) {
      const r = await supabase.from('banners').update(payload).eq('id', editingId);
      err = r.error;
    } else {
      const r = await supabase.from('banners').insert([payload]);
      err = r.error;
    }
    if (err) return toast(err.message, 'err');
    toast(editingId ? 'Updated' : 'Created', 'ok');
    setOpen(false);
    load();
  };

  const del = async (id) => {
    if (!confirm('Delete?')) return;
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) return toast(error.message, 'err');
    toast('Deleted', 'ok');
    load();
  };

  if (!isAdmin) return <div className="glass-tile rounded-2xl p-10 text-center text-muted text-[13px]">Admins only</div>;

  return (
    <div className="space-y-5">
      <div className="glass-tile-flat rounded-2xl overflow-hidden">
        <div className="relative z-10 px-5 py-4 border-b border-line/60 flex justify-between items-center">
          <div>
            <h3 className="font-black text-[15px]">Homepage Banners</h3>
            <p className="text-[11.5px] text-muted font-semibold mt-0.5">
              {loading ? 'Loading...' : `${items.length} banner${items.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="btn-ghost text-xs py-2.5 px-3.5">Refresh</button>
            <button onClick={openNew} className="btn-primary text-xs py-2.5 px-3.5">
              <Icon name="plus" size={13} color="white" strokeWidth={2.6} />
              New
            </button>
          </div>
        </div>
        <div className="relative z-10">
          {loading ? (
            <div className="p-4 space-y-2">{[1,2].map(i => <div key={i} className="h-16 rounded-xl bg-surface-2/60 animate-pulse" />)}</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-muted text-[13px]">No banners yet.</div>
          ) : items.map((b) => (
            <div key={b.id} className="flex items-center gap-3.5 px-5 py-3.5 border-t border-line/30">
              <img src={b.image_url} alt="" className="w-20 h-12 rounded-xl object-cover border border-line shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-extrabold text-ink truncate">{b.title || 'Untitled'}</div>
                <div className="text-[11px] text-muted font-semibold">Position {b.position}</div>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase shrink-0 ${
                b.active ? 'bg-ok/15 text-ok' : 'bg-surface-2 text-muted'
              }`}>
                {b.active ? 'Active' : 'Off'}
              </span>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(b)} className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-brand-light hover:text-brand">Edit</button>
                <button onClick={() => del(b.id)} className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg text-bad hover:bg-bad/10">Del</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Edit Banner' : 'New Banner'} maxWidth="max-w-[520px]">
        <input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="Image URL *" className="form-input mb-2.5" />
        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" className="form-input mb-2.5" />
        <input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} placeholder="Subtitle" className="form-input mb-2.5" />
        <input value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} placeholder="Link URL" className="form-input mb-2.5" />
        <input type="number" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} placeholder="Position (0 = first)" className="form-input mb-3" />
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-brand" />
          <span className="text-[13px] font-semibold">Active</span>
        </label>
        <button onClick={save} className="btn-primary w-full">{editingId ? 'Update' : 'Create'}</button>
      </Modal>
    </div>
  );
}

