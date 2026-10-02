import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';
import Icon from '../ui/Icon';

export default function AuthModal() {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setMode('login');
      setMsg('');
      setResetSent(false);
    };
    document.addEventListener('open-auth', onOpen);
    return () => document.removeEventListener('open-auth', onOpen);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!email || !pass) return setMsg('Email and password required.');
    if (mode === 'signup' && pass.length < 6) return setMsg('Password must be at least 6 characters.');
    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email, pass);
        toast('Welcome back!', 'ok', 'Signed in');
      } else {
        await signUp(email, pass);
        toast('Account created', 'ok', 'Welcome');
      }
      setOpen(false);
      setEmail('');
      setPass('');
    } catch (err) {
      setMsg(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async () => {
    setMsg('');
    if (!email.trim()) return setMsg('Enter your email first, then tap Forgot password.');
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      setResetSent(true);
      toast('Reset link sent', 'ok', 'Check your email');
    } catch (err) {
      setMsg(err.message || 'Failed to send reset link.');
    } finally {
      setBusy(false);
    }
  };

  // Reset-link sent confirmation screen
  if (resetSent) {
    return (
      <Modal open={open} onClose={() => setOpen(false)} title="Check your email">
        <div className="text-center -mt-2">
          <div className="w-16 h-16 rounded-full bg-ok/15 text-ok flex items-center justify-center mx-auto mb-4">
            <Icon name="mail" size={28} />
          </div>
          <p className="text-[13px] text-muted mb-4 leading-relaxed">
            We sent a password reset link to:
          </p>
          <div className="bg-surface-2/60 border border-line rounded-xl px-4 py-3 mb-4">
            <div className="font-mono font-extrabold text-brand text-[13px] break-all">{email}</div>
          </div>
          <div className="rounded-xl bg-brand-light/60 border border-brand-lighter p-3.5 text-[12px] text-brand font-semibold text-left leading-relaxed mb-4">
            <div className="mb-1.5"><b>1.</b> Check your inbox for the reset email</div>
            <div className="mb-1.5"><b>2.</b> Look in <b>Spam</b> if you don't see it in 60 seconds</div>
            <div><b>3.</b> Click the link to set a new password</div>
          </div>
          <button
            onClick={() => { setResetSent(false); setMode('login'); setMsg(''); }}
            className="btn-primary w-full"
          >
            Back to Sign In
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} title={mode === 'login' ? 'Welcome Back' : 'Create Account'}>
      <p className="text-[13px] text-muted -mt-2 mb-5">
        {mode === 'login'
          ? 'Sign in to save your wishlist and track orders.'
          : 'Create an account to unlock all features.'}
      </p>

      <form onSubmit={submit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          autoComplete="email"
          className="form-input mb-3"
        />
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="Password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="form-input mb-3"
        />

        {msg && (
          <div className="text-[12.5px] text-bad font-semibold mb-3 text-center">{msg}</div>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          {!busy && <Icon name="arrowRight" size={15} color="white" strokeWidth={2.6} />}
        </button>
      </form>

      {/* Two buttons — switch mode + forgot password */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(''); }}
          className="py-3 rounded-xl border border-line text-[12.5px] font-extrabold text-ink-2 hover:bg-surface-2 transition"
        >
          {mode === 'login' ? 'Create account' : 'Sign In instead'}
        </button>
        <button
          type="button"
          onClick={sendReset}
          disabled={busy}
          className="py-3 rounded-xl border border-brand/40 bg-brand-light/40 text-[12.5px] font-extrabold text-brand hover:bg-brand hover:text-white transition disabled:opacity-50"
        >
          Forgot password?
        </button>
      </div>

      <div className="text-center text-[11px] text-muted mt-4 font-medium">
        Need help? Contact <span className="text-brand font-extrabold">0300-TECHMARKAZ</span>
      </div>
    </Modal>
  );
}
