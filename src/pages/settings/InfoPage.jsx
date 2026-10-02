import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';
import Reveal from '../../components/ui/Reveal';

export default function InfoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', city: '', gender: '', dob: '' });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('customers').select('*').eq('id', user.id).maybeSingle();
      if (data) {
        setForm({
          full_name: data.full_name || user.email.split('@')[0],
          phone: data.phone || '',
          city: data.city || '',
          gender: data.gender || '',
          dob: data.dob || '',
        });
      } else {
        setForm((f) => ({ ...f, full_name: user.email.split('@')[0] }));
      }
    })();
  }, [user]);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.full_name.trim()) return toast('Name required', 'warn');
    setBusy(true);
    const r = await supabase
      .from('customers')
      .upsert({ id: user.id, ...form }, { onConflict: 'id' });
    setBusy(false);
    if (r.error) return toast(r.error.message, 'err');
    toast('Profile updated', 'ok');
    setTimeout(() => navigate('/account/settings'), 700);
  };

  return (
    <div className="max-w-[820px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account/settings" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div>
            <h1 className="text-[20px] md:text-[24px] font-black">Your Information</h1>
            <p className="text-[12.5px] text-muted font-semibold">Manage your personal details</p>
          </div>
        </div>
      </Reveal>

      <Reveal direction="up" delay={80}>
        <div className="glass-tile rounded-2xl p-6 space-y-4">
          <div className="relative z-10">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-2/60 border border-line/60 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent-dark text-ink flex items-center justify-center font-black text-[20px]">
                {(form.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-[14px] font-black">{form.full_name || 'User'}</div>
                <div className="text-[11.5px] text-muted font-semibold">{user?.email}</div>
              </div>
            </div>

            <label className="block mb-3">
              <span className="text-[10.5px] uppercase font-extrabold text-muted tracking-wider block mb-1.5">
                Full Name
              </span>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => upd('full_name', e.target.value)}
                className="form-input"
                placeholder="Your full name"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <label className="block">
                <span className="text-[10.5px] uppercase font-extrabold text-muted tracking-wider block mb-1.5">
                  Email
                </span>
                <input type="email" value={user?.email || ''} disabled className="form-input bg-surface-2 cursor-not-allowed" />
              </label>
              <label className="block">
                <span className="text-[10.5px] uppercase font-extrabold text-muted tracking-wider block mb-1.5">
                  Phone
                </span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => upd('phone', e.target.value)}
                  className="form-input"
                  placeholder="03XX-XXXXXXX"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <label className="block">
                <span className="text-[10.5px] uppercase font-extrabold text-muted tracking-wider block mb-1.5">
                  Date of Birth
                </span>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => upd('dob', e.target.value)}
                  className="form-input"
                />
              </label>
              <label className="block">
                <span className="text-[10.5px] uppercase font-extrabold text-muted tracking-wider block mb-1.5">
                  Gender
                </span>
                <select value={form.gender} onChange={(e) => upd('gender', e.target.value)} className="form-input">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <label className="block mb-5">
              <span className="text-[10.5px] uppercase font-extrabold text-muted tracking-wider block mb-1.5">
                City
              </span>
              <input
                type="text"
                value={form.city}
                onChange={(e) => upd('city', e.target.value)}
                className="form-input"
                placeholder="Your city"
              />
            </label>

            <button onClick={save} disabled={busy} className="btn-primary w-full">
              {busy ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
