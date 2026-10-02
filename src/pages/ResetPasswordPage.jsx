import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import Icon from '../components/ui/Icon';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    // Supabase attaches the recovery token to the URL hash (#access_token=...&type=recovery)
    // Supabase JS auto-consumes it and sets a session; we just wait for it
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setSessionOk(true);
      }
      setReady(true);
    };
    // small delay so Supabase can process the hash first
    const t = setTimeout(check, 300);

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionOk(true);
        setReady(true);
      }
    });

    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  const save = async () => {
    setMsg('');
    if (pass.length < 6) return setMsg('Password must be at least 6 characters');
    if (pass !== confirm) return setMsg('Passwords do not match');
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pass });
      if (error) throw error;
      toast('Password updated', 'ok');
      setTimeout(() => navigate('/account'), 800);
    } catch (err) {
      setMsg(err.message || 'Failed to update password');
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <div className="max-w-[500px] mx-auto px-6 py-20 text-center">
        <div className="glass-tile-flat rounded-2xl p-10">
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Icon name="lock" size={22} />
            </div>
            <div className="text-[14px] font-extrabold text-ink">Verifying reset link...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionOk) {
    return (
      <div className="max-w-[500px] mx-auto px-6 py-20 text-center">
        <div className="glass-tile-flat rounded-2xl p-10">
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-full bg-bad/15 text-bad flex items-center justify-center mx-auto mb-4">
              <Icon name="x" size={22} />
            </div>
            <h2 className="text-[16px] font-black mb-2">Invalid or expired link</h2>
            <p className="text-[13px] text-muted mb-5 leading-relaxed">
              This reset link is no longer valid. Please request a new one.
            </p>
            <Link to="/account" className="btn-primary inline-flex">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[500px] mx-auto px-6 py-20">
      <div className="glass-tile-flat rounded-3xl p-7">
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-4">
            <Icon name="lock" size={22} />
          </div>
          <h1 className="text-[18px] font-black text-center mb-1.5">Set a new password</h1>
          <p className="text-[12.5px] text-muted text-center mb-6">
            Choose something strong — at least 6 characters.
          </p>

          <div className="space-y-3">
            <div>
              <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1.5">
                New Password
              </div>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="At least 6 characters"
                className="form-input mb-0"
                autoComplete="new-password"
              />
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1.5">
                Confirm Password
              </div>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your new password"
                className="form-input mb-0"
                autoComplete="new-password"
              />
            </div>

            {msg && (
              <div className="rounded-lg p-3 bg-bad/10 border border-bad/30 text-[12px] font-semibold text-bad text-center">
                {msg}
              </div>
            )}

            <button onClick={save} disabled={busy} className="btn-primary w-full">
              {busy ? 'Saving...' : 'Update Password'}
              {!busy && <Icon name="check" size={14} color="white" strokeWidth={3} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
