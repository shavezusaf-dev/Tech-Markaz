import { useEffect, useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAddresses } from '../../contexts/AddressContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { sendOrderConfirmation } from '../../lib/emailjs';
import { CITIES_BY_PROVINCE, PROVINCES } from '../../lib/constants';
import { fmt, finalPrice } from '../../lib/format';
import { validateVoucher, computeDiscount, isVoucherExpired, getCollectedVouchers } from '../../lib/vouchers';
import Modal from '../ui/Modal';
import Icon from '../ui/Icon';

const SHIPPING = 500;

export default function CheckoutModal() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { addresses, addAddress, defaultAddress } = useAddresses();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState('cod');
  const [proof, setProof] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    province: '', city: '', area: '', street: '',
  });
  const [showForm, setShowForm] = useState(true);
  const [useSaved, setUseSaved] = useState(null);

  // Voucher state
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setMethod('cod');
      setProof(null);
      setVoucherInput('');
      setAppliedVoucher(null);
      setVoucherError('');
      const saved = defaultAddress || addresses[0];
      if (saved) { setUseSaved(saved); setShowForm(false); }
      else { setUseSaved(null); setShowForm(true); }
      setForm((f) => ({ ...f, email: user?.email || f.email }));

      // Load collected voucher codes and resolve their details
      const codes = getCollectedVouchers();
      if (codes.length) {
        supabase
          .from('home_vouchers')
          .select('*')
          .in('code', codes)
          .eq('active', true)
          .then(({ data }) => {
            setAvailableVouchers((data || []).filter((v) => !isVoucherExpired(v)));
          });
      } else {
        setAvailableVouchers([]);
      }
    };
    document.addEventListener('open-checkout', onOpen);
    return () => document.removeEventListener('open-checkout', onOpen);
  }, [user, addresses, defaultAddress]);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const cities = form.province ? CITIES_BY_PROVINCE[form.province] || [] : [];

  const onProof = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return toast('Image must be under 2 MB', 'warn');
    if (!f.type.startsWith('image/')) return toast('Only images allowed', 'warn');
    const reader = new FileReader();
    reader.onload = () => setProof({ url: reader.result, name: f.name, size: f.size });
    reader.readAsDataURL(f);
  };

  const discount = computeDiscount(appliedVoucher, subtotal);
  const total = subtotal + SHIPPING - discount;

  const applyVoucher = async (code) => {
    setVoucherError('');
    const clean = (code || voucherInput).toUpperCase().trim();
    if (!clean) return;

    // Must be a collected voucher
    const collected = getCollectedVouchers();
    if (!collected.includes(clean)) {
      return setVoucherError('Collect this voucher from the homepage first.');
    }

    setCheckingVoucher(true);
    const v = await validateVoucher(clean);
    setCheckingVoucher(false);

    if (!v) return setVoucherError('Voucher not found or inactive.');
    if (isVoucherExpired(v)) return setVoucherError('This voucher has expired.');
    if (subtotal < (v.min_spend || 0)) {
      return setVoucherError(`Min spend Rs. ${Number(v.min_spend).toLocaleString('en-PK')} required.`);
    }

    setAppliedVoucher(v);
    setVoucherInput('');
    toast(`${v.code} applied — you saved ${fmt(computeDiscount(v, subtotal))}`, 'ok', 'Voucher');
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError('');
  };

  const placeOrder = async () => {
    const addr = useSaved
      ? useSaved
      : {
          name: form.name.trim(),
          phone: form.phone.trim(),
          province: form.province,
          city: form.city,
          area: form.area.trim(),
          street: form.street.trim(),
        };
    const email = (useSaved ? user?.email : form.email)?.trim();

    if (!addr.name || !addr.phone || !addr.province || !addr.city || !addr.area || !addr.street)
      return toast('Please fill in all address fields', 'warn');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return toast('Valid email required', 'warn');
    if (method === 'bank' && !proof)
      return toast('Please upload your payment screenshot', 'warn');

    setBusy(true);
    const orderNum = 'TM-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1000);
    const fullAddress = [addr.area, addr.street, addr.city, addr.province].join(', ');

    try {
      // Ensure customer row exists
      if (user?.id) {
        try {
          await supabase
            .from('customers')
            .upsert({ id: user.id, full_name: addr.name || user.email.split('@')[0] }, { onConflict: 'id' });
        } catch {}
      }

      // Save address if new
      if (!useSaved) addAddress({ ...addr, isDefault: addresses.length === 0 });

      // Group items by seller
      const groups = {};
      items.forEach((it) => {
        const sid = it.product.seller_id || 'admin';
        groups[sid] = groups[sid] || [];
        groups[sid].push(it);
      });
      const sids = Object.keys(groups);

      for (const sid of sids) {
        const group = groups[sid];
        const groupSub = group.reduce((s, it) => s + finalPrice(it.product) * it.qty, 0);

        // Distribute voucher discount proportionally to this seller's group
        const groupDiscount =
          subtotal > 0 ? Math.round((groupSub / subtotal) * discount) : 0;

        const gTotal = groupSub + SHIPPING / sids.length - groupDiscount;
        const summary = group.map((it) => `${it.qty}x ${it.product.title}`).join('; ');

        const payload = {
          seller_id: sid === 'admin' ? null : sid,
          total_amount: Math.round(gTotal * 100) / 100,
          status: 'Un-processed',
          order_number: orderNum,
          items_summary: summary,
          guest_name: addr.name,
          guest_email: email,
          guest_phone: addr.phone,
          guest_address: fullAddress,
          payment_method: method === 'bank' ? 'bank_transfer' : 'cod',
          payment_status: method === 'bank' ? 'awaiting_verification' : 'pending',
          customer_id: user?.id || null,
          voucher_code: appliedVoucher?.code || null,
          discount_amount: groupDiscount || 0,
        };
        if (method === 'bank' && proof) {
          payload.payment_proof_url = proof.url;
          payload.payment_proof_name = proof.name;
        }

        let { error } = await supabase.from('orders').insert([payload]);
        if (error && /voucher_code|discount_amount/i.test(error.message || '')) {
          // Only strip the voucher columns — never the payment columns
          delete payload.voucher_code;
          delete payload.discount_amount;
          const retry = await supabase.from('orders').insert([payload]);
          if (retry.error) throw retry.error;
        } else if (error) throw error;

        sendOrderConfirmation({
          guest_email: email,
          guest_name: addr.name,
          order_number: orderNum,
          items_summary: summary,
          total_amount: gTotal,
          payment_method: method === 'bank' ? 'bank_transfer' : 'cod',
          pickup_location: 'Home Delivery',
        }).catch(() => {});
      }

      clearCart();
      setOpen(false);
      document.dispatchEvent(new CustomEvent('open-success', { detail: { orderNum, method, email } }));
    } catch (err) {
      console.error(err);
      toast(err.message || 'Order failed. Please try again.', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Complete Your Order" maxWidth="max-w-[580px]">
      {user && (
        <div className="flex items-center gap-2.5 bg-ok/10 border border-ok/30 rounded-xl px-4 py-2.5 mb-4 text-[12.5px] font-bold text-ok">
          <Icon name="user" size={14} />
          Signed in as {user.email}
        </div>
      )}

      {/* Saved address card */}
      {useSaved && !showForm && (
        <div className="bg-brand-light border-[1.5px] border-brand rounded-xl p-4 mb-4 flex gap-3">
          <span className="w-10 h-10 rounded-xl bg-surface text-brand flex items-center justify-center shrink-0">
            <Icon name="mapPin" size={17} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-muted mb-1">Delivering to</div>
            <div className="text-[13.5px] font-extrabold text-ink mb-1">{useSaved.name}</div>
            <div className="text-[12.5px] text-ink-2 font-medium leading-snug">
              {useSaved.street}, {useSaved.area}, {useSaved.city}, {useSaved.province}
            </div>
            <div className="text-[12px] text-muted font-semibold mt-1">📞 {useSaved.phone}</div>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setForm({
                name: useSaved.name,
                email: user?.email || '',
                phone: useSaved.phone,
                province: useSaved.province,
                city: useSaved.city,
                area: useSaved.area,
                street: useSaved.street,
              });
            }}
            className="self-start text-[11.5px] font-extrabold text-brand bg-surface border border-brand-lighter px-3 py-1.5 rounded-lg hover:bg-brand hover:text-white transition"
          >
            Edit
          </button>
        </div>
      )}

      {/* Address form */}
      {showForm && (
        <div>
          <input type="text" value={form.name} onChange={(e) => upd('name', e.target.value)} placeholder="Full name *" className="form-input mb-2.5" />
          <input type="email" value={form.email} onChange={(e) => upd('email', e.target.value)} disabled={!!user} placeholder="Email address *" className={`form-input mb-2.5 ${user ? 'bg-surface-2 cursor-not-allowed' : ''}`} />
          <input type="tel" value={form.phone} onChange={(e) => upd('phone', e.target.value)} placeholder="Phone (03XX-XXXXXXX) *" className="form-input mb-2.5" />
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
          <input type="text" value={form.area} onChange={(e) => upd('area', e.target.value)} placeholder="Area / Sector / Town *" className="form-input mb-2.5" />
          <textarea value={form.street} onChange={(e) => upd('street', e.target.value)} placeholder="House #, street, landmark *" rows={2} className="form-input mb-2.5 resize-vertical font-[inherit]" />
          {useSaved && (
            <button onClick={() => setShowForm(false)} className="w-full py-3 rounded-xl border border-line text-[12.5px] font-extrabold text-ink-2 hover:bg-surface-2 transition mb-2">
              ← Use saved address
            </button>
          )}
        </div>
      )}

      {/* VOUCHER */}
      <div className="rounded-2xl border border-line bg-surface-2/40 p-3.5 mb-4">
        <div className="flex items-center gap-2.5 mb-2.5">
          <span className="w-7 h-7 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0">
            <Icon name="ticket" size={13} />
          </span>
          <div className="text-[12.5px] font-black">Voucher</div>
        </div>

        {appliedVoucher ? (
          <div className="flex items-center justify-between gap-2 bg-ok/10 border border-ok/30 rounded-xl px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <div className="font-mono font-extrabold text-ok text-[13px]">{appliedVoucher.code}</div>
              <div className="text-[11px] text-muted font-medium">
                Saving {fmt(discount)} on this order
              </div>
            </div>
            <button onClick={removeVoucher} className="btn-glass-danger text-xs py-1.5 px-3">Remove</button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={voucherInput}
                onChange={(e) => { setVoucherInput(e.target.value.toUpperCase()); setVoucherError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyVoucher(); } }}
                placeholder="Enter voucher code"
                className="form-input mb-0 font-mono font-extrabold flex-1"
              />
              <button
                onClick={() => applyVoucher()}
                disabled={!voucherInput.trim() || checkingVoucher}
                className="btn-primary px-4 shrink-0 disabled:opacity-50"
              >
                {checkingVoucher ? '...' : 'Apply'}
              </button>
            </div>

            {voucherError && (
              <div className="text-[11.5px] text-bad font-semibold mt-2">{voucherError}</div>
            )}

            {/* Available collected vouchers */}
            {availableVouchers.length > 0 && (
              <div className="mt-2.5">
                <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1.5">
                  Your collected vouchers
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableVouchers.map((v) => {
                    const qualifies = subtotal >= (v.min_spend || 0);
                    return (
                      <button
                        key={v.id}
                        onClick={() => qualifies && applyVoucher(v.code)}
                        disabled={!qualifies}
                        className={`text-[11.5px] font-mono font-extrabold px-3 py-1.5 rounded-lg border transition ${
                          qualifies
                            ? 'border-brand/40 bg-brand-light/60 text-brand hover:bg-brand hover:text-white'
                            : 'border-line bg-surface-2 text-muted cursor-not-allowed opacity-60'
                        }`}
                        title={qualifies ? `Apply ${v.code}` : `Min spend Rs. ${Number(v.min_spend).toLocaleString('en-PK')}`}
                      >
                        {v.code} · {v.discount_pct}%
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment */}
      <div className="text-[11px] uppercase tracking-[0.8px] font-extrabold text-muted mt-4 mb-2.5">
        Payment Method
      </div>
      <div className="space-y-2.5 mb-4">
        {[
          { id: 'cod', icon: 'creditCard', title: 'Cash on Delivery', sub: 'Pay when your order arrives' },
          { id: 'bank', icon: 'wallet', title: 'Bank Transfer', sub: 'Transfer now, upload receipt' },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setMethod(p.id)}
            className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border-[1.5px] transition-all text-left ${
              method === p.id ? 'border-brand bg-brand-light' : 'border-line bg-surface hover:border-brand-lighter'
            }`}
          >
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition ${method === p.id ? 'bg-brand text-white' : 'bg-surface-2 text-ink-2'}`}>
              <Icon name={p.icon} size={17} />
            </span>
            <div className="flex-1 min-w-0">
              <div className={`text-[13.5px] font-extrabold ${method === p.id ? 'text-brand' : 'text-ink'}`}>{p.title}</div>
              <div className="text-[11.5px] text-muted font-medium">{p.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Bank details */}
      {method === 'bank' && (
        <div>
          <div className="bg-gradient-to-br from-[#08091F] to-[#1A1F47] text-white rounded-2xl p-4 mb-3 relative overflow-hidden">
            <div className="absolute -top-1/2 -right-1/4 w-48 h-48 bg-[radial-gradient(circle,rgba(255,204,0,0.3),transparent_65%)] rounded-full" />
            <div className="relative">
              <div className="text-[10.5px] font-extrabold tracking-[1.2px] opacity-70 mb-2.5">TRANSFER TO</div>
              {[
                ['Bank', 'Meezan Bank Ltd'],
                ['Title', 'Tech Markaz (Pvt) Ltd'],
                ['Account #', '0210 1234 5678 9012'],
                ['IBAN', 'PK36MEZN0002101234567890'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 text-[12.5px]">
                  <span className="opacity-70 font-semibold">{k}</span>
                  <span className="font-extrabold text-right">{v}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-2 border-t border-dashed border-white/25">
                <span className="text-[10.5px] uppercase font-extrabold opacity-75">Amount to Transfer</span>
                <span className="text-[20px] font-black">{fmt(total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-warn/10 border border-warn/40 rounded-xl p-3 text-[12px] text-warn font-medium mb-3">
            Transfer the exact amount, then upload a screenshot of your confirmation below.
          </div>

          {!proof ? (
            <label className="block border-2 border-dashed border-line rounded-xl p-4 text-center cursor-pointer hover:border-brand hover:bg-brand-light transition bg-surface-2 mb-2.5">
              <input type="file" accept="image/*" onChange={onProof} className="hidden" />
              <Icon name="upload" size={22} className="mx-auto text-brand mb-1.5" />
              <div className="font-extrabold text-[13px] text-ink">Tap to upload screenshot</div>
              <div className="text-[11px] text-muted font-medium">JPG or PNG · Max 2 MB</div>
            </label>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-ok/10 border border-ok/40 rounded-xl mb-2.5">
              <img src={proof.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-bold text-ink truncate">{proof.name}</div>
                <div className="text-[11px] text-muted">{(proof.size / 1024).toFixed(1)} KB</div>
              </div>
              <button onClick={() => setProof(null)} className="text-[11.5px] font-extrabold text-bad px-2.5 py-1 rounded hover:bg-bad/10">
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Totals */}
      <div className="bg-surface-2 rounded-xl p-4 mt-4 mb-3 space-y-2">
        <div className="flex justify-between text-[13px]">
          <span className="text-muted font-semibold">Subtotal</span>
          <span className="font-extrabold">{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-muted font-semibold">Shipping</span>
          <span className="font-extrabold">{fmt(SHIPPING)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-[13px]">
            <span className="text-ok font-semibold">Voucher ({appliedVoucher?.code})</span>
            <span className="font-extrabold text-ok">− {fmt(discount)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-line text-[15px]">
          <span className="font-extrabold">Total</span>
          <span className="font-black text-brand">{fmt(total)}</span>
        </div>
      </div>

      <button onClick={placeOrder} disabled={busy} className="btn-primary w-full">
        {busy ? 'Placing Order...' : 'Place Order'}
        {!busy && <Icon name="arrowRight" size={15} color="white" strokeWidth={2.6} />}
      </button>
    </Modal>
  );
}



