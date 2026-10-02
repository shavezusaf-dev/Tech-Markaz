import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';

const SECTIONS = [
  {
    section: 'Personal',
    rows: [
      { to: '/account/settings/info', icon: 'user', label: 'Your Information', sub: 'Name, phone, city, DOB' },
      { to: '/account/settings/addresses', icon: 'mapPin', label: 'Address Book', sub: 'Delivery addresses' },
    ],
  },
  {
    section: 'Preferences',
    rows: [
      { to: '/account/settings/notifications', icon: 'bell', label: 'Notifications', sub: 'Order updates, promos, alerts' },
      { to: '/account/settings/language', icon: 'globe', label: 'Language', sub: 'English · Urdu · Roman' },
      { to: '/account/settings/payments', icon: 'creditCard', label: 'Payment Methods', sub: 'Manage saved payment info' },
    ],
  },
  {
    section: 'Security & Privacy',
    rows: [
      { to: '/account/settings/password', icon: 'lock', label: 'Change Password', sub: 'Keep your account secure' },
      { to: '/account/settings/security', icon: 'shield', label: 'Security & Sessions', sub: '2FA, active devices, logout all' },
      { to: '/account/settings/privacy', icon: 'eye', label: 'Privacy & Data', sub: 'Download or delete your data' },
    ],
  },
  {
    section: 'Support & Legal',
    rows: [
      { to: '/account/settings/about', icon: 'message', label: 'About Tech Markaz', sub: 'Our story & mission' },
      { to: '/account/settings/terms', icon: 'shield', label: 'Terms & Privacy', sub: 'Legal policies' },
      { to: '/account/settings/returns', icon: 'rotate', label: 'Returns & Refunds', sub: 'Hassle-free policy' },
    ],
  },
  {
    section: 'App',
    rows: [
      { to: '/account/settings/app', icon: 'sparkle', label: 'App Settings', sub: 'Install, notifications, cache' },
    ],
  },
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { dark, toggleDark } = useTheme();

  if (!user) {
    return (
      <div className="max-w-[560px] mx-auto px-[5%] py-16 text-center">
        <div className="glass-tile rounded-3xl p-10">
          <div className="relative z-10">
            <h1 className="text-xl font-black mb-2">Sign in required</h1>
            <p className="text-[13px] text-muted mb-5">Please sign in to view settings.</p>
            <button
              onClick={() => document.dispatchEvent(new Event('open-auth'))}
              className="btn-primary"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[820px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div>
            <h1 className="text-[22px] md:text-[26px] font-black">Settings</h1>
            <p className="text-[12.5px] text-muted font-semibold">Manage your account</p>
          </div>
        </div>
      </Reveal>

      <div className="space-y-4">
        {SECTIONS.map((grp, gi) => (
          <Reveal key={grp.section} direction="up" delay={gi * 50}>
            <div className="glass-tile-flat rounded-2xl overflow-hidden">
              <div className="relative z-10 px-5 pt-4 pb-2">
                <div className="text-[10.5px] uppercase tracking-[1.2px] font-extrabold text-muted">
                  {grp.section}
                </div>
              </div>
              <div className="relative z-10">
                {grp.rows.map((r) => (
                  <Link
                    key={r.to}
                    to={r.to}
                    className="flex items-center gap-3.5 px-5 py-3.5 border-t border-line/40 hover:bg-brand-light/40 transition-all group"
                  >
                    <span className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                      <Icon name={r.icon} size={17} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-extrabold text-ink">{r.label}</div>
                      <div className="text-[11.5px] text-muted font-semibold truncate">{r.sub}</div>
                    </div>
                    <Icon name="chevronRight" size={15} className="text-muted group-hover:text-brand group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        ))}

        <Reveal direction="up" delay={280}>
          <div className="glass-tile-flat rounded-2xl p-5 flex items-center gap-3.5">
            <span className="relative z-10 w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
              <Icon name={dark ? 'sun' : 'moon'} size={17} />
            </span>
            <div className="relative z-10 flex-1">
              <div className="text-[13.5px] font-extrabold text-ink">Dark Mode</div>
              <div className="text-[11.5px] text-muted font-semibold">Toggle theme</div>
            </div>
            <button
              onClick={toggleDark}
              className={`relative z-10 w-11 h-6 rounded-full transition ${dark ? 'bg-brand' : 'bg-line'}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  dark ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </Reveal>

        <Reveal direction="up" delay={340}>
          <div className="glass-tile-flat rounded-2xl overflow-hidden">
            <Link
              to="/account/settings/delete"
              className="relative z-10 flex items-center gap-3.5 px-5 py-3.5 hover:bg-bad/5 transition-all group"
            >
              <span className="w-10 h-10 rounded-xl bg-bad/15 text-bad flex items-center justify-center shrink-0">
                <Icon name="trash" size={17} />
              </span>
              <div className="flex-1">
                <div className="text-[13.5px] font-extrabold text-bad">Delete Account</div>
                <div className="text-[11.5px] text-muted font-semibold">Permanent action</div>
              </div>
              <Icon name="chevronRight" size={15} className="text-bad" />
            </Link>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3.5 px-5 py-3.5 border-t border-line/40 hover:bg-bad/5 transition-all text-left"
            >
              <span className="w-10 h-10 rounded-xl bg-bad/15 text-bad flex items-center justify-center shrink-0">
                <Icon name="logout" size={17} />
              </span>
              <div className="flex-1">
                <div className="text-[13.5px] font-extrabold text-bad">Sign Out</div>
                <div className="text-[11.5px] text-muted font-semibold">End this session</div>
              </div>
            </button>
          </div>
        </Reveal>
      </div>

      <div className="text-center text-muted text-[11.5px] mt-6 font-medium">
        Tech Markaz — Version 10.0
      </div>
    </div>
  );
}
