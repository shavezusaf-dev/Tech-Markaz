import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { sendSellerWelcome } from '../lib/emailjs';
import { ADMIN_EMAIL } from '../lib/constants';
import Icon from '../components/ui/Icon';

const STEPS = [
  { key: 'create',  label: 'Creating account' },
  { key: 'logo',    label: 'Uploading logo' },
  { key: 'profile', label: 'Saving store profile' },
  { key: 'email',   label: 'Sending welcome email' },
];

export default function SellerAuth() {
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [signupDone, setSignupDone] = useState(null);
  const [steps, setSteps] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [form, setForm] = useState({
    email: '', password: '',
    store_name: '', full_name: '', phone: '', cnic: '', bank_details: '',
  });

  useEffect(() => {
    const wasDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
    return () => { if (wasDark) document.documentElement.classList.add('dark'); };
  }, []);

  useEffect(() => {
    setForm({ email: '', password: '', store_name: '', full_name: '', phone: '', cnic: '', bank_details: '' });
  }, []);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setStep = (key, status, detail = '') => setSteps((s) => ({ ...s, [key]: { status, detail } }));

  const pickLogo = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return setMsg('Logo must be under 2 MB');
    if (!f.type.startsWith('image/')) return setMsg('Only images allowed');
    setLogoFile(f);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const doLogin = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!form.email || !form.password) return setMsg('Email and password required');
    setBusy(true);
    try {
      const r = await supabase.auth.signInWithPassword({
        email: form.email.toLowerCase().trim(),
        password: form.password,
      });
      if (r.error) throw r.error;
      // Verify the user actually has a seller profile
      const { data: sellerRow } = await supabase
        .from('sellers')
        .select('id,status')
        .eq('id', r.data.user.id)
        .maybeSingle();
      const emailLower = (r.data.user.email || '').toLowerCase();
      const isAdminUser = emailLower === ADMIN_EMAIL.toLowerCase();
      if (!isAdminUser && !sellerRow) {
        await supabase.auth.signOut();
        throw new Error('This email is not registered as a seller. Use the customer site instead.');
      }
      setTimeout(() => window.location.replace('/seller'), 100);
    } catch (err) {
      let m = err.message || 'Login failed';
      if (m.toLowerCase().includes('invalid')) m = 'Wrong email or password.';
      setMsg(m);
      setBusy(false);
    }
  };

  const doSignup = async (e) => {
    e.preventDefault();
    setMsg('');
    setSteps({});

    if (!form.store_name || !form.full_name || !form.phone || !form.cnic || !form.bank_details || !form.email) {
      return setMsg('All fields are required');
    }
    if (!logoFile) return setMsg('Store logo is required');
    if (form.phone.replace(/\D/g, '').length < 10) return setMsg('Phone too short');
    if (form.cnic.replace(/\D/g, '').length < 13) return setMsg('CNIC should be 13 digits');

    const rawEmail = form.email.toLowerCase().trim();
    if (rawEmail === ADMIN_EMAIL.toLowerCase()) return setMsg('This email is reserved');

    setBusy(true);

    // STEP 1 — create auth user with REAL email + role tag
    setStep('create', 'active');
    const tempPw = Math.random().toString(36).slice(2, 12) + 'Aa1!';
    let userId = null;

    try {
      const r = await supabase.auth.signUp({
        email: rawEmail,
        password: tempPw,
        options: {
          data: {
            role: 'seller',
            full_name: form.full_name,
            store_name: form.store_name,
          },
        },
      });
      if (r.error) {
        // Email already registered — user should log in instead
        if (/already|exists|registered/i.test(r.error.message)) {
          throw new Error(
            'This email already has an account. Try signing in instead, or use a different email.'
          );
        }
        throw new Error('Auth signup: ' + r.error.message);
      }
      if (!r.data?.user) throw new Error('No user returned');
      userId = r.data.user.id;
      setStep('create', 'done');
    } catch (err) {
      setStep('create', 'error', err.message);
      setMsg(err.message);
      setBusy(false);
      return;
    }

    try { await supabase.auth.signOut({ scope: 'local' }); } catch {}

    // STEP 2 — upload logo
    setStep('logo', 'active');
    let logoUrl = '';
    try {
      const ext = (logoFile.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `store-logos/${userId}-${Date.now()}.${ext}`;
      const up = await supabase.storage
        .from('chat-media')
        .upload(path, logoFile, { contentType: logoFile.type, upsert: true });
      if (up.error) {
        setStep('logo', 'warn', 'Skipped: ' + up.error.message);
      } else {
        const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
        logoUrl = urlData.publicUrl;
        setStep('logo', 'done');
      }
    } catch (e) {
      setStep('logo', 'warn', 'Skipped: ' + e.message);
    }

    // STEP 3 — save seller profile
    setStep('profile', 'active');
    const sellerPayload = {
      id: userId,
      full_name: form.full_name,
      store_name: form.store_name,
      phone: form.phone,
      cnic: form.cnic,
      bank_details: form.bank_details,
      email: rawEmail,
      status: 'active',
    };
    if (logoUrl) sellerPayload.store_logo_url = logoUrl;

    try {
      let ins = await supabase.from('sellers').upsert(sellerPayload, { onConflict: 'id' });
      if (ins.error && /store_logo_url/.test(ins.error.message)) {
        delete sellerPayload.store_logo_url;
        ins = await supabase.from('sellers').upsert(sellerPayload, { onConflict: 'id' });
      }
      if (ins.error && /email/.test(ins.error.message)) {
        delete sellerPayload.email;
        ins = await supabase.from('sellers').upsert(sellerPayload, { onConflict: 'id' });
      }
      if (ins.error) throw new Error(ins.error.message);
      setStep('profile', 'done');
    } catch (err) {
      setStep('profile', 'error', err.message);
      setMsg('Profile save failed: ' + err.message);
      setBusy(false);
      return;
    }

    // STEP 4 — send welcome email
    setStep('email', 'active');
    try {
      const ok = await sendSellerWelcome({
        email: rawEmail,
        fullName: form.full_name,
        password: tempPw,
        storeLogoUrl: logoUrl,
      });
      if (ok) setStep('email', 'done');
      else setStep('email', 'warn', 'Email service returned failure');
    } catch (e) {
      setStep('email', 'warn', e.message);
    }

    try { await supabase.auth.signOut({ scope: 'local' }); } catch {}

    setSignupDone({ email: rawEmail });
    setBusy(false);
  };

  if (signupDone) {
    const emailOk = steps.email?.status === 'done';
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#EEF1F9]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,71,255,0.35),transparent_65%)] blur-3xl" />
          <div className="absolute top-[15%] right-[-8%] w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(255,180,0,0.35),transparent_65%)] blur-3xl" />
        </div>
        <div className="relative w-full max-w-[460px]">
          <div className="glass-tile rounded-3xl p-7">
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 rounded-full bg-ok/15 text-ok flex items-center justify-center mx-auto mb-4">
                <Icon name="check" size={30} color="currentColor" strokeWidth={3} />
              </div>
              <h2 className="text-[18px] font-black mb-2 text-[#08091F]">Account Created</h2>
              <p className="text-[12.5px] text-[#5C6A88] leading-relaxed mb-4">
                Your seller account is ready. Login credentials have been sent to your email.
              </p>
              <div className="bg-white/60 border border-white/80 rounded-xl px-4 py-2.5 mb-4">
                <div className="text-[10px] uppercase font-extrabold text-[#8891A6] tracking-wider mb-1">Email</div>
                <div className="font-mono font-extrabold text-[#0047FF] text-[12px] break-all">{signupDone.email}</div>
              </div>
              {emailOk ? (
                <div className="rounded-xl bg-[#E7F8F1] border border-[#10B981]/30 p-3.5 text-[11.5px] text-[#059669] font-semibold text-left leading-relaxed mb-4">
                  <div className="font-black mb-1">Welcome email sent</div>
                  <div>Check your inbox. If you don't see it in 60 seconds, look in <b>Spam</b>.</div>
                </div>
              ) : (
                <div className="rounded-xl bg-[#FEF3E2] border border-[#F59E0B]/40 p-3.5 text-[11.5px] text-[#B45309] font-semibold text-left leading-relaxed mb-4">
                  <div className="font-black mb-1">Couldn't send email</div>
                  <div>Contact support at 0300-TECHMARKAZ to get your login password.</div>
                </div>
              )}
              <button onClick={() => { setSignupDone(null); setMode('login'); setSteps({}); }} className="btn-primary w-full">
                Go to Sign In
                <Icon name="arrowRight" size={15} color="white" strokeWidth={2.6} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.85)',
    borderRadius: 10, fontSize: 13, color: '#08091F', fontWeight: 500, outline: 'none',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 2px rgba(8,9,31,0.03)',
    fontFamily: 'inherit',
  };
  const onFocus = (e) => {
    e.target.style.borderColor = 'rgba(0,71,255,0.55)';
    e.target.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,1), 0 0 0 3px rgba(0,71,255,0.15)';
  };
  const onBlur = (e) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.85)';
    e.target.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 2px rgba(8,9,31,0.03)';
  };

  const stepIcon = (s) => {
    if (s === 'done') return <Icon name="check" size={12} color="white" strokeWidth={3} />;
    if (s === 'error') return <Icon name="x" size={12} color="white" strokeWidth={3} />;
    if (s === 'warn') return <Icon name="sparkle" size={12} color="white" strokeWidth={3} />;
    if (s === 'active') return <div className="w-2 h-2 rounded-full bg-white animate-pulse" />;
    return <div className="w-2 h-2 rounded-full bg-white/40" />;
  };
  const stepBg = (s) =>
    s === 'done' ? '#10B981' : s === 'error' ? '#EF4444' : s === 'warn' ? '#F59E0B' : s === 'active' ? '#0047FF' : 'rgba(136,145,166,0.4)';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#EEF1F9]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(0,71,255,0.35),transparent_65%)] blur-3xl" />
        <div className="absolute top-[15%] right-[-8%] w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(255,180,0,0.35),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-[-10%] left-[25%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.28),transparent_65%)] blur-3xl" />
      </div>

      <div className={`relative w-full ${mode === 'signup' ? 'max-w-[680px]' : 'max-w-[400px]'}`}>
        <div className="glass-tile rounded-3xl p-5 md:p-6">
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <div className="flex flex-col items-center">
                <div className="relative w-[56px] h-[56px] rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-lg animate-[logoFloat_3s_ease-in-out_infinite]">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-brandOrange border-2 border-white animate-[dotPulse_2s_ease-in-out_infinite]" />
                </div>
                <div className="mt-2.5 text-[15px] font-black tracking-tight text-[#08091F]">
                  TECH <span className="text-brandOrange">MARKAZ</span>
                </div>
                <div className="text-[7.5px] font-extrabold tracking-[1.4px] text-[#8891A6] uppercase mt-1">
                  Premium Electronics Marketplace
                </div>
              </div>
            </div>

            <div className="text-center mb-4">
              <div className="text-[14px] font-black text-[#08091F]">
                {mode === 'login' ? 'Seller Sign In' : 'Become a Seller'}
              </div>
              <div className="text-[11px] text-[#5C6A88] mt-0.5">
                {mode === 'login' ? 'Manage your store' : 'Create your seller account'}
              </div>
            </div>

            <div className="flex gap-1.5 mb-4 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.7)' }}>
              {[{ id: 'login', label: 'Sign In' }, { id: 'signup', label: 'Sign Up' }].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setMode(t.id); setMsg(''); setSteps({}); }}
                  className="flex-1 py-2 rounded-lg text-[11.5px] font-extrabold transition"
                  style={mode === t.id ? { background: '#fff', color: '#0047FF', boxShadow: '0 1px 3px rgba(8,9,31,0.08)' } : { background: 'transparent', color: '#5C6A88' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={mode === 'login' ? doLogin : doSignup} autoComplete="off">
              {mode === 'signup' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition" style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.75)' }}>
                      <input type="file" accept="image/*" onChange={pickLogo} className="hidden" />
                      {logoPreview ? (
                        <img src={logoPreview} alt="" className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 border border-white" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.6)', color: '#8891A6' }}>
                          <Icon name="image" size={16} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-extrabold text-[#08091F]">Store Logo</div>
                        <div className="text-[10px] text-[#5C6A88]">{logoPreview ? 'Tap to change' : 'Required · Under 2 MB'}</div>
                      </div>
                    </label>

                    <input value={form.store_name} onChange={(e) => upd('store_name', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Store name" style={inputStyle} autoComplete="off" name="tm-sn" />
                    <input value={form.full_name} onChange={(e) => upd('full_name', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Full name" style={inputStyle} autoComplete="off" name="tm-fn" />
                    <input value={form.phone} onChange={(e) => upd('phone', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Phone (03XX-XXXXXXX)" style={inputStyle} autoComplete="off" name="tm-ph" />
                  </div>

                  <div className="space-y-2">
                    <input value={form.cnic} onChange={(e) => upd('cnic', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="CNIC (13 digits)" style={inputStyle} autoComplete="off" name="tm-cn" />
                    <input value={form.bank_details} onChange={(e) => upd('bank_details', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Bank details (Meezan PK00...)" style={inputStyle} autoComplete="off" name="tm-bk" />
                    <input type="email" value={form.email} onChange={(e) => upd('email', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Email address" style={inputStyle} autoComplete="off" name="tm-em" />
                    <div className="rounded-lg p-2.5 text-[10px] font-semibold leading-snug" style={{ background: 'rgba(235,240,255,0.7)', border: '1px solid rgba(214,225,255,0.9)', color: '#0047FF' }}>
                      Temp password sent to your email after signup.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <input type="email" value={form.email} onChange={(e) => upd('email', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Email address" style={inputStyle} autoComplete="off" name="tm-li" />
                  <input type="password" value={form.password} onChange={(e) => upd('password', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Password" style={inputStyle} autoComplete="new-password" name="tm-lp" />
                </div>
              )}

              {msg && (
                <div className="rounded-lg p-2.5 mt-2.5 text-[11px] font-semibold" style={{ background: 'rgba(254,231,231,0.75)', border: '1px solid rgba(239,68,68,0.35)', color: '#DC2626' }}>
                  {msg}
                </div>
              )}

              {mode === 'signup' && Object.keys(steps).length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {STEPS.map((s) => {
                    const state = steps[s.key];
                    if (!state) return null;
                    return (
                      <div key={s.key} className="flex items-center gap-2.5 text-[11.5px]">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: stepBg(state.status) }}>
                          {stepIcon(state.status)}
                        </span>
                        <span className="font-extrabold" style={{
                          color: state.status === 'done' ? '#059669' : state.status === 'error' ? '#DC2626' : state.status === 'warn' ? '#B45309' : '#0047FF'
                        }}>{s.label}</span>
                        {state.detail && <span className="text-[10.5px] text-[#8891A6] font-medium truncate">{state.detail}</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              <button type="submit" disabled={busy} className="btn-primary w-full mt-3.5" style={{ padding: '11px 22px' }}>
                {busy ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Seller Account'}
                {!busy && <Icon name="arrowRight" size={15} color="white" strokeWidth={2.6} />}
              </button>
            </form>

            <div className="text-center text-[10px] text-[#8891A6] mt-3 font-medium">
              By continuing you agree to Tech Markaz seller terms.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes logoFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes dotPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.85; } }
      `}</style>
    </div>
  );
}
