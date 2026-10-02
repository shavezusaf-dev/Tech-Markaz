import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAddresses } from '../../contexts/AddressContext';
import { useToast } from '../../contexts/ToastContext';
import { PROVINCES, CITIES_BY_PROVINCE } from '../../lib/constants';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import Reveal from '../../components/ui/Reveal';

export default function AddressesPage() {
  const { addresses, addAddress, updateAddress, removeAddress, setDefault } = useAddresses();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(-1);
  const [form, setForm] = useState({ name: '', phone: '', province: '', city: '', area: '', street: '', isDefault: false });

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const cities = form.province ? CITIES_BY_PROVINCE[form.province] || [] : [];

  const startAdd = () => {
    setEditingIdx(-1);
    setForm({ name: '', phone: '', province: '', city: '', area: '', street: '', isDefault: addresses.length === 0 });
    setOpen(true);
  };

  const startEdit = (i) => {
    setEditingIdx(i);
    setForm({ ...addresses[i] });
    setOpen(true);
  };

  const save = () => {
    if (!form.name || !form.phone || !form.province || !form.city || !form.area || !form.street) {
      return toast('Please fill all fields', 'warn');
    }
    if (editingIdx >= 0) {
      updateAddress(editingIdx, form);
      toast('Address updated', 'ok');
    } else {
      addAddress(form);
      toast('Address added', 'ok');
    }
    setOpen(false);
  };

  const del = (i) => {
    if (!confirm('Delete this address?')) return;
    removeAddress(i);
    toast('Address deleted', 'info');
  };

  return (
    <div className="max-w-[820px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account/settings" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div className="flex-1">
            <h1 className="text-[20px] md:text-[24px] font-black">Address Book</h1>
            <p className="text-[12.5px] text-muted font-semibold">Manage delivery addresses</p>
          </div>
          <button onClick={startAdd} className="btn-primary text-xs py-2.5 px-4">
            <Icon name="plus" size={14} color="white" strokeWidth={2.6} />
            Add
          </button>
        </div>
      </Reveal>

      {addresses.length === 0 ? (
        <Reveal direction="zoom">
          <div className="glass-tile rounded-3xl p-12 text-center">
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-4">
                <Icon name="mapPin" size={26} />
              </div>
              <h2 className="text-lg font-black mb-2">No addresses yet</h2>
              <p className="text-[13px] text-muted mb-5">Add one to speed up checkout.</p>
              <button onClick={startAdd} className="btn-primary inline-flex">
                <Icon name="plus" size={14} color="white" strokeWidth={2.6} />
                Add Address
              </button>
            </div>
          </div>
        </Reveal>
      ) : (
        <div className="space-y-3">
          {addresses.map((a, i) => (
            <Reveal key={i} direction="up" delay={i * 40}>
              <div className={`glass-tile rounded-2xl p-5 ${a.isDefault ? 'ring-2 ring-brand/60' : ''}`}>
                <div className="relative z-10 flex gap-4">
                  <span className="w-11 h-11 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                    <Icon name="mapPin" size={17} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div className="text-[14px] font-black">{a.name}</div>
                      {a.isDefault && (
                        <span className="bg-accent text-ink text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-[12.5px] text-ink-2 leading-snug font-medium">
                      {a.street}, {a.area}<br />
                      {a.city}, {a.province}
                    </div>
                    <div className="text-[11.5px] text-muted font-semibold mt-1.5">{a.phone}</div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button onClick={() => startEdit(i)} className="text-[11.5px] font-extrabold px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-brand-light hover:text-brand transition">
                        Edit
                      </button>
                      {!a.isDefault && (
                        <button onClick={() => setDefault(i)} className="text-[11.5px] font-extrabold px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-brand-light hover:text-brand transition">
                          Set Default
                        </button>
                      )}
                      <button onClick={() => del(i)} className="text-[11.5px] font-extrabold px-3 py-1.5 rounded-lg text-bad hover:bg-bad/10 transition">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingIdx >= 0 ? 'Edit Address' : 'New Address'}>
        <input value={form.name} onChange={(e) => upd('name', e.target.value)} placeholder="Full name *" className="form-input mb-2.5" />
        <input value={form.phone} onChange={(e) => upd('phone', e.target.value)} placeholder="Phone *" className="form-input mb-2.5" />
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <select value={form.province} onChange={(e) => { upd('province', e.target.value); upd('city', ''); }} className="form-input">
            <option value="">Province *</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={form.city} onChange={(e) => upd('city', e.target.value)} disabled={!form.province} className={`form-input ${!form.province ? 'bg-surface-2 cursor-not-allowed' : ''}`}>
            <option value="">City *</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <input value={form.area} onChange={(e) => upd('area', e.target.value)} placeholder="Area / Town *" className="form-input mb-2.5" />
        <textarea value={form.street} onChange={(e) => upd('street', e.target.value)} placeholder="Street address, house #, landmark *" rows={2} className="form-input mb-2.5 resize-vertical font-[inherit]" />
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => upd('isDefault', e.target.checked)} className="w-4 h-4 accent-brand" />
          <span className="text-[13px] font-semibold">Set as default address</span>
        </label>
        <button onClick={save} className="btn-primary w-full">Save Address</button>
      </Modal>
    </div>
  );
}
