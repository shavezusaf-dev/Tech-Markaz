import { useEffect, useState } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { useSeller } from '../../contexts/SellerContext';
import { announcementAPI, voucherAPI, heroAPI, uploadBannerImage } from '../../../lib/homeContent';
import Icon from '../../../components/ui/Icon';
import Modal from '../../../components/ui/Modal';

const TABS = [
  { id: 'hero', label: 'Hero Slides', icon: 'image' },
  { id: 'announcements', label: 'Announcements', icon: 'megaphone' },
  { id: 'vouchers', label: 'Vouchers', icon: 'ticket' },
];

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[1.2px] font-extrabold text-muted mb-1.5">
        {label}
        {hint && <span className="ml-2 text-[10px] font-medium normal-case tracking-normal text-muted/70">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function HomeContent() {
  const { isAdmin } = useSeller();
  const { toast } = useToast();
  const [tab, setTab] = useState('hero');
  const [loading, setLoading] = useState(true);

  const [heroSlides, setHeroSlides] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [vouchers, setVouchers] = useState([]);

  const [heroEdit, setHeroEdit] = useState(null);
  const [annEdit, setAnnEdit] = useState(null);
  const [vocEdit, setVocEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [h, a, v] = await Promise.all([heroAPI.list(), announcementAPI.list(), voucherAPI.list()]);
      setHeroSlides(h);
      setAnnouncements(a);
      setVouchers(v);
    } catch (e) { toast(e.message, 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) loadAll(); /* eslint-disable-next-line */ }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="glass-tile rounded-2xl p-10 text-center text-muted text-[13px]">
        Admins only
      </div>
    );
  }

  // ─── Hero ───
  const openHero = (slide) => setHeroEdit(slide || {
    position: heroSlides.length, image_url: '', kicker: '', title: '', subtitle: '',
    cta_label: 'Shop Now', cta_link: '/shop', cta_ghost_label: '', cta_ghost_link: '', active: true,
  });

  const saveHero = async () => {
    if (!heroEdit.image_url || !heroEdit.title) return toast('Image + title required', 'warn');
    setBusy(true);
    try {
      const payload = { ...heroEdit }; delete payload.id;
      if (heroEdit.id) await heroAPI.update(heroEdit.id, payload);
      else await heroAPI.create(payload);
      toast(heroEdit.id ? 'Slide updated' : 'Slide added', 'ok');
      setHeroEdit(null); loadAll();
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };

  const deleteHero = async (id) => {
    if (!confirm('Delete this slide?')) return;
    try { await heroAPI.remove(id); toast('Deleted', 'ok'); loadAll(); }
    catch (e) { toast(e.message, 'err'); }
  };

  const uploadHeroImage = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast('Image must be under 5 MB', 'warn');
    setUploading(true);
    try {
      const url = await uploadBannerImage(f);
      setHeroEdit((h) => ({ ...h, image_url: url }));
      toast('Image uploaded', 'ok');
    } catch (err) { toast(err.message, 'err'); } finally { setUploading(false); }
  };

  // ─── Announcement ───
  const openAnn = (a) => setAnnEdit(a || { message: '', position: announcements.length, active: true });

  const saveAnn = async () => {
    if (!annEdit.message.trim()) return toast('Message required', 'warn');
    setBusy(true);
    try {
      const payload = { message: annEdit.message.trim(), position: annEdit.position, active: annEdit.active };
      if (annEdit.id) await announcementAPI.update(annEdit.id, payload);
      else await announcementAPI.create(payload);
      toast(annEdit.id ? 'Updated' : 'Added', 'ok');
      setAnnEdit(null); loadAll();
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };

  const deleteAnn = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try { await announcementAPI.remove(id); toast('Deleted', 'ok'); loadAll(); }
    catch (e) { toast(e.message, 'err'); }
  };

  // ─── Voucher ───
  const openVoc = (v) => setVocEdit(v || {
    code: '', brand_label: 'Tech Markaz', discount_pct: 10, min_spend: 0,
    expires_at: '', position: vouchers.length, active: true,
  });

  const saveVoc = async () => {
    if (!vocEdit.code.trim()) return toast('Code required', 'warn');
    if (!vocEdit.discount_pct || vocEdit.discount_pct <= 0) return toast('Valid % required', 'warn');
    setBusy(true);
    try {
      const payload = { ...vocEdit, code: vocEdit.code.trim().toUpperCase(), expires_at: vocEdit.expires_at || null };
      delete payload.id;
      if (vocEdit.id) await voucherAPI.update(vocEdit.id, payload);
      else await voucherAPI.create(payload);
      toast(vocEdit.id ? 'Updated' : 'Added', 'ok');
      setVocEdit(null); loadAll();
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };

  const deleteVoc = async (id) => {
    if (!confirm('Delete this voucher?')) return;
    try { await voucherAPI.remove(id); toast('Deleted', 'ok'); loadAll(); }
    catch (e) { toast(e.message, 'err'); }
  };

  return (
    <div className="space-y-5">
      <div className="glass-tile-flat rounded-2xl overflow-hidden">
        <div className="relative z-10 px-5 py-4 border-b border-line/60 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="font-black text-[15px]">Homepage Content</h3>
            <p className="text-[11.5px] text-muted font-semibold mt-0.5">
              Manage hero slides, announcements & vouchers
            </p>
          </div>
          <button onClick={loadAll} className="btn-glass">Refresh</button>
        </div>

        <div className="relative z-10 p-2.5 border-b border-line/60 flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-extrabold transition flex items-center justify-center gap-1.5 ${
                tab === t.id ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon name={t.icon} size={13} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'hero' && (
          <div className="relative z-10 p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-[13px] font-extrabold">{heroSlides.length} slide{heroSlides.length === 1 ? '' : 's'}</div>
              <button onClick={() => openHero(null)} className="btn-primary text-xs py-2 px-3.5">
                <Icon name="plus" size={12} color="white" strokeWidth={2.6} />
                Add Slide
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-surface-2/60 animate-pulse" />)}</div>
            ) : heroSlides.length === 0 ? (
              <div className="p-8 text-center text-muted text-[13px]">No slides yet.</div>
            ) : (
              <div className="space-y-2">
                {heroSlides.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-line/40 hover:bg-surface-2/40">
                    <img src={s.image_url} alt="" className="w-24 h-16 rounded-lg object-cover border border-line shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-extrabold text-ink truncate">{s.title}</div>
                      <div className="text-[11.5px] text-muted font-semibold">{s.kicker} · {s.cta_label}</div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase shrink-0 ${
                      s.active ? 'bg-ok/15 text-ok' : 'bg-surface-2 text-muted'
                    }`}>{s.active ? 'Active' : 'Off'}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => openHero(s)} className="btn-glass">Edit</button>
                      <button onClick={() => deleteHero(s.id)} className="btn-glass-danger">
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'announcements' && (
          <div className="relative z-10 p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-[13px] font-extrabold">{announcements.length} message{announcements.length === 1 ? '' : 's'}</div>
              <button onClick={() => openAnn(null)} className="btn-primary text-xs py-2 px-3.5">
                <Icon name="plus" size={12} color="white" strokeWidth={2.6} />
                Add Message
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-surface-2/60 animate-pulse" />)}</div>
            ) : announcements.length === 0 ? (
              <div className="p-8 text-center text-muted text-[13px]">No announcements yet.</div>
            ) : (
              <div className="space-y-2">
                {announcements.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-line/40 hover:bg-surface-2/40">
                    <span className="w-8 h-8 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0">
                      <Icon name="megaphone" size={14} />
                    </span>
                    <div className="flex-1 min-w-0 text-[13px] font-bold text-ink truncate">{a.message}</div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase shrink-0 ${
                      a.active ? 'bg-ok/15 text-ok' : 'bg-surface-2 text-muted'
                    }`}>{a.active ? 'Active' : 'Off'}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => openAnn(a)} className="btn-glass">Edit</button>
                      <button onClick={() => deleteAnn(a.id)} className="btn-glass-danger">
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'vouchers' && (
          <div className="relative z-10 p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-[13px] font-extrabold">{vouchers.length} voucher{vouchers.length === 1 ? '' : 's'}</div>
              <button onClick={() => openVoc(null)} className="btn-primary text-xs py-2 px-3.5">
                <Icon name="plus" size={12} color="white" strokeWidth={2.6} />
                Add Voucher
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-surface-2/60 animate-pulse" />)}</div>
            ) : vouchers.length === 0 ? (
              <div className="p-8 text-center text-muted text-[13px]">No vouchers yet.</div>
            ) : (
              <div className="space-y-2">
                {vouchers.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl border border-line/40 hover:bg-surface-2/40">
                    <span className="w-9 h-9 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                      <Icon name="ticket" size={15} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-mono font-extrabold text-brand">{v.code}</div>
                      <div className="text-[11.5px] text-muted font-semibold">
                        {v.discount_pct}% off · min Rs. {Number(v.min_spend || 0).toLocaleString('en-PK')}
                        {v.expires_at && ` · expires ${new Date(v.expires_at).toLocaleDateString()}`}
                      </div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase shrink-0 ${
                      v.active ? 'bg-ok/15 text-ok' : 'bg-surface-2 text-muted'
                    }`}>{v.active ? 'Active' : 'Off'}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => openVoc(v)} className="btn-glass">Edit</button>
                      <button onClick={() => deleteVoc(v.id)} className="btn-glass-danger">
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Hero Modal ═══ */}
      <Modal open={!!heroEdit} onClose={() => setHeroEdit(null)} title={heroEdit?.id ? 'Edit Hero Slide' : 'New Hero Slide'} maxWidth="max-w-[560px]">
        {heroEdit && (
          <div className="space-y-3">
            <Field label="Banner Image" hint="JPG/PNG · under 5 MB">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/60 border border-line cursor-pointer hover:border-brand transition">
                <input type="file" accept="image/*" onChange={uploadHeroImage} className="hidden" />
                {heroEdit.image_url ? (
                  <img src={heroEdit.image_url} alt="" className="w-24 h-16 rounded-lg object-cover border border-line" />
                ) : (
                  <div className="w-24 h-16 rounded-lg bg-surface-2 border border-line flex items-center justify-center text-muted">
                    <Icon name="image" size={20} />
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-[12.5px] font-extrabold">{uploading ? 'Uploading...' : heroEdit.image_url ? 'Change image' : 'Upload image'}</div>
                  <div className="text-[11px] text-muted">Or paste a URL below</div>
                </div>
              </label>
            </Field>

            <Field label="Or Image URL">
              <input value={heroEdit.image_url} onChange={(e) => setHeroEdit((h) => ({ ...h, image_url: e.target.value }))} placeholder="https://..." className="form-input mb-0 text-[12px]" />
            </Field>

            <Field label="Kicker" hint="small label above title">
              <input value={heroEdit.kicker || ''} onChange={(e) => setHeroEdit((h) => ({ ...h, kicker: e.target.value }))} placeholder="e.g. New Arrivals" className="form-input mb-0" />
            </Field>

            <Field label="Title" hint="required">
              <input value={heroEdit.title} onChange={(e) => setHeroEdit((h) => ({ ...h, title: e.target.value }))} placeholder="e.g. Flagship Phones, Straight to Your Door" className="form-input mb-0" />
            </Field>

            <Field label="Subtitle">
              <textarea rows={2} value={heroEdit.subtitle || ''} onChange={(e) => setHeroEdit((h) => ({ ...h, subtitle: e.target.value }))} placeholder="Short description" className="form-input mb-0 resize-vertical font-[inherit]" />
            </Field>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Primary Button Label">
                <input value={heroEdit.cta_label || ''} onChange={(e) => setHeroEdit((h) => ({ ...h, cta_label: e.target.value }))} placeholder="Shop Now" className="form-input mb-0" />
              </Field>
              <Field label="Primary Button Link">
                <input value={heroEdit.cta_link || ''} onChange={(e) => setHeroEdit((h) => ({ ...h, cta_link: e.target.value }))} placeholder="/shop" className="form-input mb-0" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Secondary Button Label" hint="optional">
                <input value={heroEdit.cta_ghost_label || ''} onChange={(e) => setHeroEdit((h) => ({ ...h, cta_ghost_label: e.target.value }))} placeholder="Browse All" className="form-input mb-0" />
              </Field>
              <Field label="Secondary Button Link" hint="optional">
                <input value={heroEdit.cta_ghost_link || ''} onChange={(e) => setHeroEdit((h) => ({ ...h, cta_ghost_link: e.target.value }))} placeholder="/shop?category=All" className="form-input mb-0" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Position" hint="lower = first">
                <input type="number" value={heroEdit.position} onChange={(e) => setHeroEdit((h) => ({ ...h, position: parseInt(e.target.value) || 0 }))} className="form-input mb-0" />
              </Field>
              <Field label="Visibility">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-line h-[46px]">
                  <input type="checkbox" checked={heroEdit.active} onChange={(e) => setHeroEdit((h) => ({ ...h, active: e.target.checked }))} className="w-4 h-4 accent-brand" />
                  <span className="text-[13px] font-semibold">Active</span>
                </label>
              </Field>
            </div>

            <button onClick={saveHero} disabled={busy || uploading} className="btn-primary w-full">
              {busy ? 'Saving...' : heroEdit.id ? 'Update Slide' : 'Add Slide'}
            </button>
          </div>
        )}
      </Modal>

      {/* ═══ Announcement Modal ═══ */}
      <Modal open={!!annEdit} onClose={() => setAnnEdit(null)} title={annEdit?.id ? 'Edit Announcement' : 'New Announcement'}>
        {annEdit && (
          <div className="space-y-3">
            <Field label="Message" hint="appears in the scrolling strip">
              <input value={annEdit.message} onChange={(e) => setAnnEdit((a) => ({ ...a, message: e.target.value }))} placeholder="e.g. Free delivery on orders over Rs. 3,000" className="form-input mb-0" />
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Position" hint="lower = first">
                <input type="number" value={annEdit.position} onChange={(e) => setAnnEdit((a) => ({ ...a, position: parseInt(e.target.value) || 0 }))} className="form-input mb-0" />
              </Field>
              <Field label="Visibility">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-line h-[46px]">
                  <input type="checkbox" checked={annEdit.active} onChange={(e) => setAnnEdit((a) => ({ ...a, active: e.target.checked }))} className="w-4 h-4 accent-brand" />
                  <span className="text-[13px] font-semibold">Active</span>
                </label>
              </Field>
            </div>
            <button onClick={saveAnn} disabled={busy} className="btn-primary w-full">
              {busy ? 'Saving...' : annEdit.id ? 'Update' : 'Add'}
            </button>
          </div>
        )}
      </Modal>

      {/* ═══ Voucher Modal ═══ */}
      <Modal open={!!vocEdit} onClose={() => setVocEdit(null)} title={vocEdit?.id ? 'Edit Voucher' : 'New Voucher'}>
        {vocEdit && (
          <div className="space-y-3">
            <Field label="Voucher Code" hint="displayed on the voucher card">
              <input value={vocEdit.code} onChange={(e) => setVocEdit((v) => ({ ...v, code: e.target.value.toUpperCase() }))} placeholder="e.g. WELCOME15" className="form-input mb-0 font-mono font-extrabold" />
            </Field>

            <Field label="Brand Label" hint="small text at the top of the card">
              <input value={vocEdit.brand_label} onChange={(e) => setVocEdit((v) => ({ ...v, brand_label: e.target.value }))} placeholder="e.g. Tech Markaz · New User" className="form-input mb-0" />
            </Field>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Discount %">
                <input type="number" value={vocEdit.discount_pct} onChange={(e) => setVocEdit((v) => ({ ...v, discount_pct: parseInt(e.target.value) || 0 }))} placeholder="15" className="form-input mb-0" />
              </Field>
              <Field label="Min Spend (Rs.)">
                <input type="number" value={vocEdit.min_spend} onChange={(e) => setVocEdit((v) => ({ ...v, min_spend: parseInt(e.target.value) || 0 }))} placeholder="5000" className="form-input mb-0" />
              </Field>
            </div>

            <Field label="Expiry Date" hint="optional">
              <input type="date" value={vocEdit.expires_at || ''} onChange={(e) => setVocEdit((v) => ({ ...v, expires_at: e.target.value }))} className="form-input mb-0" />
            </Field>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Position" hint="lower = first">
                <input type="number" value={vocEdit.position} onChange={(e) => setVocEdit((v) => ({ ...v, position: parseInt(e.target.value) || 0 }))} className="form-input mb-0" />
              </Field>
              <Field label="Visibility">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-line h-[46px]">
                  <input type="checkbox" checked={vocEdit.active} onChange={(e) => setVocEdit((v) => ({ ...v, active: e.target.checked }))} className="w-4 h-4 accent-brand" />
                  <span className="text-[13px] font-semibold">Active</span>
                </label>
              </Field>
            </div>

            <button onClick={saveVoc} disabled={busy} className="btn-primary w-full">
              {busy ? 'Saving...' : vocEdit.id ? 'Update Voucher' : 'Add Voucher'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

