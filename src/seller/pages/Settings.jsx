import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';

export default function Settings() {
  const { user, signOut } = useSeller();
  const { dark, toggleDark } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [cf, setCf] = useState('');

  const changePw = async () => {
    if (nw.length < 6) return toast('New password must be 6+ chars', 'warn');
    if (nw !== cf) return toast('Passwords do not match', 'warn');
    setBusy(true);
    try {
      const r = await supabase.auth.signInWithPassword({ email: user.email, password: cur });
      if (r.error) throw new Error('Current password is incorrect');
      const upd = await supabase.auth.updateUser({ password: nw });
      if (upd.error) throw upd.error;
      toast('Password changed', 'ok');
      setShowPw(false);
      setCur(''); setNw(''); setCf('');
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const rows = [
    { section: 'General', items: [
      { icon: dark ? 'sun' : 'moon', label: 'Dark Mode', sub: 'Toggle theme', right: (
        <button onClick={toggleDark} className={`w-11 h-6 rounded-full relative transition ${dark ? 'bg-brand' : 'bg-line'}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${dark ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      ) },
      { icon: 'lock', label: 'Change Password', sub: 'Update your password', onClick: () => setShowPw(true) },
    ] },
    { section: 'Store', items: [
      { icon: 'store', label: 'Store Profile', sub: 'Edit your store info', to: '/seller/profile' },
      { icon: 'wallet', label: 'Wallet', sub: 'Balance & transactions', to: '/seller/wallet' },
    ] },
    { section: 'Account', items: [
      { icon: 'logout', label: 'Sign Out', sub: 'End this session', onClick: signOut, danger: true },
    ] },
  ];

  return (
    <div className="max-w-[720px] mx-auto space-y-4">
      {rows.map((grp) => (
        <div key={grp.section} className="glass-tile-flat rounded-2xl overflow-hidden">
          <div className="relative z-10 px-5 pt-4 pb-2">
            <div className="text-[10.5px] uppercase tracking-[1.2px] font-extrabold text-muted">{grp.section}</div>
          </div>
          <div className="relative z-10">
            {grp.items.map((it, i) => (
              <div
                key={it.label}
                onClick={it.onClick}
                className={`flex items-center gap-3.5 px-5 py-3.5 ${i > 0 ? 'border-t border-line/40' : ''} ${
                  it.onClick || it.to ? 'cursor-pointer hover:bg-brand-light/40 transition-all' : ''
                }`}
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  it.danger ? 'bg-bad/15 text-bad' : 'bg-brand-light text-brand'
                }`}>
                  <Icon name={it.icon} size={17} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-[13.5px] font-extrabold ${it.danger ? 'text-bad' : 'text-ink'}`}>{it.label}</div>
                  <div className="text-[11.5px] text-muted font-semibold">{it.sub}</div>
                </div>
                {it.right || (it.to ? <Icon name="chevronRight" size={15} className="text-muted" /> : null)}
              </div>
            ))}
          </div>
        </div>
      ))}

      {showPw && (
        <div className="fixed inset-0 z-[6000] bg-[#050814]/70 backdrop-blur-md flex items-center justify-center p-5">
          <div className="glass-tile rounded-2xl p-6 w-full max-w-[440px]">
            <div className="relative z-10">
              <h3 className="text-[17px] font-black mb-4">Change Password</h3>
              <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Current password" className="form-input mb-2.5" />
              <input type="password" value={nw} onChange={(e) => setNw(e.target.value)} placeholder="New password" className="form-input mb-2.5" />
              <input type="password" value={cf} onChange={(e) => setCf(e.target.value)} placeholder="Confirm new password" className="form-input mb-4" />
              <div className="flex gap-2.5">
                <button onClick={() => setShowPw(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={changePw} disabled={busy} className="btn-primary flex-1">
                  {busy ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

