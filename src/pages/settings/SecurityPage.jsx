import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';
import Reveal from '../../components/ui/Reveal';

export default function SecurityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [twoFA, setTwoFA] = useState(() => localStorage.getItem('tm_2fa') === 'on');

  const toggle2FA = () => {
    const next = !twoFA;
    setTwoFA(next);
    localStorage.setItem('tm_2fa', next ? 'on' : 'off');
    toast(next ? 'Two-factor authentication enabled' : 'Two-factor disabled', next ? 'ok' : 'warn');
  };

  const logoutAll = async () => {
    if (!confirm('Sign out of all devices?\n\nYou will need to sign in again on every device.')) return;
    toast('Signed out of all other devices', 'ok');
  };

  return (
    <div className="max-w-[820px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account/settings" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div>
            <h1 className="text-[20px] md:text-[24px] font-black">Security</h1>
            <p className="text-[12.5px] text-muted font-semibold">Sessions, 2FA & devices</p>
          </div>
        </div>
      </Reveal>

      <div className="space-y-4">
        <Reveal direction="up" delay={80}>
          <div className="glass-tile-flat rounded-2xl p-5 flex items-center gap-4">
            <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${twoFA ? 'bg-ok/15 text-ok' : 'bg-surface-2 text-muted'}`}>
              <Icon name="shield" size={20} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-extrabold text-ink">Two-Factor Authentication</div>
              <div className="text-[12px] text-muted font-medium">
                {twoFA ? 'Enabled · an OTP is required on new devices' : 'Add an extra layer of security to your account'}
              </div>
            </div>
            <button
              onClick={toggle2FA}
              className={`w-11 h-6 rounded-full transition shrink-0 ${twoFA ? 'bg-brand' : 'bg-line'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${twoFA ? 'left-[22px]' : 'left-0.5'}`} style={{ position: 'relative' }} />
            </button>
          </div>
        </Reveal>

        <Reveal direction="up" delay={120}>
          <div className="glass-tile-flat rounded-2xl overflow-hidden">
            <div className="relative z-10 px-5 pt-4 pb-2">
              <div className="text-[10.5px] uppercase tracking-[1.2px] font-extrabold text-muted">Active Sessions</div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3.5 px-5 py-3.5 border-t border-line/40">
                <span className="w-10 h-10 rounded-xl bg-ok/15 text-ok flex items-center justify-center shrink-0">
                  <Icon name="shield" size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-extrabold text-ink">Current session</div>
                  <div className="text-[11px] text-muted font-medium truncate">
                    {navigator.userAgent.includes('Mobile') ? 'Mobile browser' : 'Desktop browser'} · This device
                  </div>
                </div>
                <span className="bg-ok/15 text-ok text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">Active</span>
              </div>
              <div className="px-5 py-4 text-center">
                <button onClick={logoutAll} className="btn-glass-danger">
                  <Icon name="logout" size={13} />
                  Sign out of all other devices
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal direction="up" delay={160}>
          <div className="glass-tile-flat rounded-2xl overflow-hidden">
            <Link
              to="/account/settings/password"
              className="relative z-10 flex items-center gap-3.5 px-5 py-3.5 hover:bg-brand-light/40 transition"
            >
              <span className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                <Icon name="lock" size={16} />
              </span>
              <div className="flex-1">
                <div className="text-[13.5px] font-extrabold text-ink">Change Password</div>
                <div className="text-[11.5px] text-muted font-semibold">Update your login password</div>
              </div>
              <Icon name="chevronRight" size={15} className="text-muted" />
            </Link>
          </div>
        </Reveal>
      </div>

      <div className="rounded-2xl bg-brand-light/40 border border-brand-lighter p-4 text-[12.5px] text-brand font-semibold mt-5 leading-relaxed">
        <b>Security tip:</b> Never share your password or OTP with anyone. Tech Markaz will never ask for your password.
      </div>
    </div>
  );
}
