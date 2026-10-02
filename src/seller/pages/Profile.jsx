import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';

export default function Profile() {
  const { user, seller, isAdmin } = useSeller();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    store_name: '', full_name: '', phone: '', cnic: '', bank_details: '',
  });

  useEffect(() => {
    if (seller) {
      setForm({
        store_name: seller.store_name || '',
        full_name: seller.full_name || '',
        phone: seller.phone || '',
        cnic: seller.cnic || '',
        bank_details: seller.bank_details || '',
      });
    }
  }, [seller]);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.full_name.trim() || !form.phone.trim() || !form.cnic.trim() || !form.bank_details.trim()) {
      return toast('All fields required', 'warn');
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from('sellers')
        .update({
          store_name: form.store_name.trim(),
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          cnic: form.cnic.trim(),
          bank_details: form.bank_details.trim(),
        })
        .eq('id', user.id);
      if (error) throw error;
      toast('Profile saved', 'ok');
      setEditing(false);
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const code = isAdmin ? 'TM-ADMIN' : 'TM-' + user.id.split('-')[0].toUpperCase();
  const initial = (form.store_name || form.full_name || 'S').charAt(0).toUpperCase();

  return (
    <div className="max-w-[820px] mx-auto">
      <div className="glass-tile rounded-2xl p-6 md:p-7">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-line/60">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-dark text-ink flex items-center justify-center font-black text-[24px] shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[18px] font-black truncate">
                {form.store_name || form.full_name || 'Store'}
              </div>
              <div className="text-[12px] text-muted font-semibold truncate">{user.email}</div>
              <div className="text-[10.5px] font-mono font-extrabold text-brand mt-1">{code}</div>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn-primary text-xs py-2.5 px-4">
                <Icon name="edit" size={13} color="white" strokeWidth={2.4} />
                Edit
              </button>
            )}
          </div>

          <div className="space-y-3.5">
            {[
              { key: 'store_name', label: 'Store Name', type: 'text' },
              { key: 'full_name', label: 'Full Name', type: 'text' },
              { key: 'phone', label: 'Phone', type: 'tel' },
              { key: 'cnic', label: 'CNIC', type: 'text' },
              { key: 'bank_details', label: 'Bank Details', type: 'text' },
            ].map((f) => (
              <div key={f.key}>
                <div className="text-[10.5px] uppercase font-extrabold text-muted tracking-wider mb-1.5">
                  {f.label}
                </div>
                {editing ? (
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={(e) => upd(f.key, e.target.value)}
                    className="form-input"
                  />
                ) : (
                  <div className="text-[14px] font-bold text-ink">
                    {form[f.key] || <span className="text-muted font-medium">Not set</span>}
                  </div>
                )}
              </div>
            ))}

            {!editing && (
              <div className="rounded-xl bg-surface-2/60 border border-line/60 p-3.5 mt-3">
                <div className="text-[11.5px] font-extrabold text-brand mb-1">Payout Policy</div>
                <div className="text-[11.5px] text-ink-2 font-medium leading-snug">
                  Platform fee <b>5%</b> + Tax <b>2%</b> are deducted from each delivered order before crediting your wallet.
                </div>
              </div>
            )}

            {editing && (
              <div className="flex gap-2.5 mt-3">
                <button onClick={() => setEditing(false)} className="btn-ghost flex-1">
                  Cancel
                </button>
                <button onClick={save} disabled={busy} className="btn-primary flex-1">
                  {busy ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

