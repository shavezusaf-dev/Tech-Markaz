import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { useToast } from '../../contexts/ToastContext';
import { fmt, finalPrice, parseImgs } from '../../lib/format';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import { PROVINCES } from '../../lib/constants';

const CATEGORIES = ['Smartphone', 'Smart TV', 'Audio', 'Washing Machine', 'Smart Watch', 'Tablet', 'Projector'];

const EMPTY = {
  title: '', category_name: '', brand: '', price: '', discount_percent: 0,
  stock_count: 1, status: 'active', badge: '', description: '',
  image1: '', image2: '', image3: '', image4: '',
  specs: {},
};

export default function Inventory() {
  const { user, isAdmin } = useSeller();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let q = supabase.from('products').select('*').order('created_at', { ascending: false });
      if (!isAdmin) q = q.eq('seller_id', user.id);
      const { data, error } = await q;
      if (error) throw error;
      setProducts(data || []);
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  const filtered = products.filter((p) => {
    if (search && !(p.title || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && p.category_name !== catFilter) return false;
    if (statusFilter && (p.status || 'active') !== statusFilter) return false;
    return true;
  });

  const toggle = (id) => setSelected((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const toggleAll = (checked) => setSelected(checked ? new Set(filtered.map((p) => p.id)) : new Set());

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    const imgs = parseImgs(p.images);
    setForm({
      title: p.title || '',
      category_name: p.category_name || '',
      brand: p.brand || '',
      price: p.price ?? '',
      discount_percent: p.discount_percent ?? 0,
      stock_count: p.stock_count ?? 1,
      status: p.status || 'active',
      badge: p.badge || '',
      description: p.description || '',
      image1: imgs[0] || '', image2: imgs[1] || '', image3: imgs[2] || '', image4: imgs[3] || '',
      specs: p.specs || {},
    });
    setModalOpen(true);
  };

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const updSpec = (k, v) => setForm((f) => ({ ...f, specs: { ...f.specs, [k]: v } }));

  const save = async () => {
    if (!form.title.trim()) return toast('Title required', 'warn');
    if (!form.category_name) return toast('Category required', 'warn');
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) return toast('Valid price required', 'warn');

    const images = [form.image1, form.image2, form.image3, form.image4]
      .map((s) => s.trim()).filter(Boolean);

    const payload = {
      title: form.title.trim(),
      category_name: form.category_name,
      brand: form.brand.trim() || null,
      price,
      discount_percent: parseFloat(form.discount_percent) || 0,
      stock_count: parseInt(form.stock_count) || 0,
      status: form.status,
      badge: form.badge || null,
      description: form.description.trim() || null,
      images,
      specs: Object.keys(form.specs).length ? form.specs : null,
      seller_id: isAdmin ? null : user.id,
    };

    setBusy(true);
    try {
      let r;
      if (editingId) {
        r = await supabase.from('products').update(payload).eq('id', editingId);
      } else {
        r = await supabase.from('products').insert([payload]);
      }
      if (r.error) throw r.error;
      toast(editingId ? 'Product updated' : 'Product added', 'ok');
      setModalOpen(false);
      load();
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const del = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return toast(error.message, 'err');
    toast('Product deleted', 'ok');
    load();
  };

  const bulk = async (action) => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    let update = {};
    if (action === 'active') update = { status: 'active' };
    if (action === 'inactive') update = { status: 'inactive' };
    if (action === 'delete') {
      if (!confirm(`Delete ${ids.length} product(s)?`)) return;
      const { error } = await supabase.from('products').delete().in('id', ids);
      if (error) return toast(error.message, 'err');
      toast(`${ids.length} deleted`, 'ok');
    } else {
      const { error } = await supabase.from('products').update(update).in('id', ids);
      if (error) return toast(error.message, 'err');
      toast(`${ids.length} → ${action}`, 'ok');
    }
    setSelected(new Set());
    load();
  };

  const specsForCategory = {
    Smartphone: ['Display Size', 'Resolution', 'Processor', 'RAM', 'Storage', 'Battery', 'Main Camera', 'Front Camera', 'Bluetooth', 'PTA Approved', 'Charging Port'],
    'Smart TV': ['Screen Size', 'Resolution', 'Panel Type', 'Smart OS', 'HDMI Ports', 'Refresh Rate'],
    Audio: ['Driver Size', 'Battery Life', 'Noise Cancellation', 'Bluetooth', 'Charging Port'],
    Tablet: ['Display Size', 'Resolution', 'Processor', 'RAM', 'Storage', 'Battery'],
    'Smart Watch': ['Display Size', 'Battery Life', 'Bluetooth', 'Water Resistance'],
    Projector: ['Brightness', 'Resolution', 'Throw Ratio', 'Lamp Life'],
    'Washing Machine': ['Capacity', 'Type', 'Energy Rating', 'Spin Speed'],
  };
  const specFields = form.category_name ? (specsForCategory[form.category_name] || []) : [];

  return (
    <div className="space-y-5">
      <div className="glass-tile-flat rounded-2xl overflow-hidden">
        <div className="relative z-10 px-5 py-4 border-b border-line/60 flex justify-between items-center gap-3 flex-wrap">
          <div>
            <h3 className="font-black text-[15px]">Products</h3>
            <p className="text-[11.5px] text-muted font-semibold mt-0.5">
              {loading ? 'Loading...' : `${filtered.length} of ${products.length} product${products.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="btn-ghost text-xs py-2.5 px-3.5">Refresh</button>
            <button onClick={openAdd} className="btn-primary text-xs py-2.5 px-3.5">
              <Icon name="plus" size={13} color="white" strokeWidth={2.6} />
              Add Product
            </button>
          </div>
        </div>

        <div className="relative z-10 p-4 border-b border-line/40 flex gap-2.5 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="form-input mb-0 flex-1 min-w-[200px]"
          />
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="form-input mb-0 max-w-[180px]">
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input mb-0 max-w-[160px]">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2/60 text-[10.5px] uppercase text-muted font-extrabold tracking-wider">
              <tr>
                <th className="p-3 w-10 text-left">
                  <input type="checkbox" className="accent-brand w-4 h-4" checked={filtered.length > 0 && selected.size === filtered.length} onChange={(e) => toggleAll(e.target.checked)} />
                </th>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted text-[13px]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center">
                  <div className="text-[13.5px] font-extrabold text-ink mb-1">No products</div>
                  <div className="text-[12px] text-muted mb-4">Add your first product to get started.</div>
                  <button onClick={openAdd} className="btn-primary text-xs py-2.5 px-4 mx-auto">Add Product</button>
                </td></tr>
              ) : filtered.map((p) => {
                const imgs = parseImgs(p.images);
                const thumb = imgs[0] || 'https://via.placeholder.com/44';
                const disc = parseFloat(p.discount_percent) || 0;
                const fp = finalPrice(p);
                const status = p.status || 'active';
                const statusCls = status === 'active' ? 'bg-ok/15 text-ok' : status === 'out_of_stock' ? 'bg-bad/15 text-bad' : 'bg-surface-2 text-muted';
                return (
                  <tr key={p.id} className={`border-t border-line/30 ${selected.has(p.id) ? 'bg-brand-light/50' : 'hover:bg-surface-2/40'}`}>
                    <td className="p-3">
                      <input type="checkbox" className="accent-brand w-4 h-4" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img src={thumb} alt="" className="w-11 h-11 object-contain rounded-lg border border-line/60 bg-white p-1 shrink-0" />
                        <div className="font-bold text-[12.5px] max-w-[220px] truncate">{p.title}</div>
                      </div>
                    </td>
                    <td className="p-3 text-[12px] text-muted">{p.category_name || '-'}</td>
                    <td className="p-3">
                      {disc > 0 ? (
                        <>
                          <div className="text-[11px] text-muted line-through">{fmt(p.price)}</div>
                          <div className="text-[12.5px] font-extrabold text-ok">{fmt(fp)}</div>
                        </>
                      ) : (
                        <div className="text-[12.5px] font-extrabold">{fmt(p.price)}</div>
                      )}
                    </td>
                    <td className="p-3 text-[12.5px] font-bold">{p.stock_count || 0}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase ${statusCls}`}>
                        {status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(p)} className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-brand-light hover:text-brand transition">
                          Edit
                        </button>
                        <button onClick={() => del(p.id, p.title)} className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg text-bad hover:bg-bad/10 transition">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar-wrap"><div className="bulk-bar-inner glass-tile rounded-2xl p-3 px-4 shadow-2xl flex items-center gap-3">
          <span className="relative z-10 text-[13px] font-extrabold whitespace-nowrap">
            <b className="text-brand text-[15px] mr-1">{selected.size}</b> selected
          </span>
          <button onClick={() => bulk('active')} className="relative z-10 text-xs font-extrabold py-2 px-3.5 rounded-lg bg-ok/15 text-ok hover:bg-ok/25 transition">Activate</button>
          <button onClick={() => bulk('inactive')} className="relative z-10 text-xs font-extrabold py-2 px-3.5 rounded-lg bg-surface-2 hover:bg-surface-3 transition">Deactivate</button>
          <button onClick={() => bulk('delete')} className="relative z-10 text-xs font-extrabold py-2 px-3.5 rounded-lg bg-bad/15 text-bad hover:bg-bad/25 transition">Delete</button>
          <button onClick={() => setSelected(new Set())} className="relative z-10 text-xs font-extrabold py-2 px-3.5 rounded-lg bg-surface-2 hover:bg-surface-3 transition">Clear</button>
        </div></div>
      )}

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Product' : 'Add Product'} maxWidth="max-w-[640px]">
        <input value={form.title} onChange={(e) => upd('title', e.target.value)} placeholder="Product title *" className="form-input mb-2.5" />
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <select value={form.category_name} onChange={(e) => upd('category_name', e.target.value)} className="form-input">
            <option value="">Category *</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={form.brand} onChange={(e) => upd('brand', e.target.value)} placeholder="Brand" className="form-input" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <input type="number" value={form.price} onChange={(e) => upd('price', e.target.value)} placeholder="Price (PKR) *" className="form-input" />
          <input type="number" value={form.discount_percent} onChange={(e) => upd('discount_percent', e.target.value)} placeholder="Discount %" className="form-input" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <input type="number" value={form.stock_count} onChange={(e) => upd('stock_count', e.target.value)} placeholder="Stock count" className="form-input" />
          <select value={form.status} onChange={(e) => upd('status', e.target.value)} className="form-input">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
        <select value={form.badge} onChange={(e) => upd('badge', e.target.value)} className="form-input mb-2.5">
          <option value="">No badge</option>
          <option value="HOT">HOT</option>
          <option value="NEW">NEW</option>
          <option value="FEATURED">FEATURED</option>
          <option value="SALE">SALE</option>
        </select>

        <div className="text-[10.5px] uppercase font-extrabold text-muted tracking-wider mt-3 mb-2">Images (URLs)</div>
        <input value={form.image1} onChange={(e) => upd('image1', e.target.value)} placeholder="Image URL 1" className="form-input mb-2" />
        <input value={form.image2} onChange={(e) => upd('image2', e.target.value)} placeholder="Image URL 2" className="form-input mb-2" />
        <input value={form.image3} onChange={(e) => upd('image3', e.target.value)} placeholder="Image URL 3" className="form-input mb-2" />
        <input value={form.image4} onChange={(e) => upd('image4', e.target.value)} placeholder="Image URL 4" className="form-input mb-3" />

        {specFields.length > 0 && (
          <>
            <div className="text-[10.5px] uppercase font-extrabold text-muted tracking-wider mb-2">Specifications</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {specFields.map((s) => (
                <input
                  key={s}
                  value={form.specs[s] || ''}
                  onChange={(e) => updSpec(s, e.target.value)}
                  placeholder={s}
                  className="form-input text-[12.5px]"
                />
              ))}
            </div>
          </>
        )}

        <textarea value={form.description} onChange={(e) => upd('description', e.target.value)} placeholder="Description" rows={3} className="form-input mb-3 resize-vertical font-[inherit]" />

        <button onClick={save} disabled={busy} className="btn-primary w-full">
          {busy ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
        </button>
      </Modal>
    </div>
  );
}


