import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';
import Reveal from '../../components/ui/Reveal';

export default function PasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [cf, setCf] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (nw.length < 6) return toast('New password must be 6+ chars', 'warn');
    if (nw !== cf) return toast('Passwords do not match', 'warn');
    setBusy(true);
    try {
      const r = await supabase.auth.signInWithPassword({ email: user.email, password: cur });
      if (r.error) throw new Error('Current password is incorrect');
      const upd = await supabase.auth.updateUser({ password: nw });
      if (upd.error) throw upd.error;
      toast('Password changed', 'ok');
      setTimeout(() => navigate('/account/settings'), 800);
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[820px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account/settings" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div>
            <h1 className="text-[20px] md:text-[24px] font-black">Change Password</h1>
            <p className="text-[12.5px] text-muted font-semibold">Keep your account secure</p>
          </div>
        </div>
      </Reveal>

      <Reveal direction="up" delay={80}>
        <div className="glass-tile rounded-2xl p-6 space-y-4">
          <div className="relative z-10">
            <label className="block mb-3">
              <span className="text-[10.5px] uppercase font-extrabold text-muted tracking-wider block mb-1.5">
                Current Password
              </span>
              <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} className="form-input" placeholder="Enter current password" />
            </label>
            <label className="block mb-3">
              <span className="text-[10.5px] uppercase font-extrabold text-muted tracking-wider block mb-1.5">
                New Password
              </span>
              <input type="password" value={nw} onChange={(e) => setNw(e.target.value)} className="form-input" placeholder="At least 6 characters" />
            </label>
            <label className="block mb-5">
              <span className="text-[10.5px] uppercase font-extrabold text-muted tracking-wider block mb-1.5">
                Confirm New Password
              </span>
              <input type="password" value={cf} onChange={(e) => setCf(e.target.value)} className="form-input" placeholder="Re-enter new password" />
            </label>
            <button onClick={save} disabled={busy} className="btn-primary w-full">
              {busy ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
