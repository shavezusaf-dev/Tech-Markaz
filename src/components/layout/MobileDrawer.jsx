import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Brand from '../ui/Brand';
import Icon from '../ui/Icon';

const CATEGORIES = [
  { label: 'Smartphones', slug: 'Smartphone' },
  { label: 'Audio', slug: 'Audio' },
  { label: 'Smart TVs', slug: 'Smart TV' },
  { label: 'Projectors', slug: 'Projector' },
  { label: 'Washers', slug: 'Washing Machine' },
  { label: 'Watches', slug: 'Smart Watch' },
  { label: 'Tablets', slug: 'Tablet' },
  { label: 'All Products', slug: 'All' },
];

export default function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const { dark, toggleDark } = useTheme();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    document.addEventListener('open-drawer', onOpen);
    return () => document.removeEventListener('open-drawer', onOpen);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  if (!open) return null;
  const close = () => setOpen(false);

  return (
    <div className="fixed inset-0 z-[4500]">
      <div className="absolute inset-0 bg-[#050814]/55 backdrop-blur-sm" onClick={close} />
      <aside className="absolute top-0 left-0 bottom-0 w-[310px] max-w-[88vw] bg-surface/90 backdrop-blur-2xl border-r border-line/60 flex flex-col shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-surface/90 backdrop-blur-xl px-5 py-4 border-b border-line flex items-center justify-between z-10">
          <Brand size="sm" />
          <button
            onClick={close}
            className="w-9 h-9 rounded-lg bg-surface-2 text-muted hover:bg-bad/10 hover:text-bad flex items-center justify-center transition"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Account section */}
        <div className="p-5 border-b border-line">
          <h4 className="text-[10.5px] font-extrabold text-muted uppercase tracking-[1px] mb-3">
            Account
          </h4>
          {user ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-dark text-ink flex items-center justify-center font-extrabold text-[14px] shrink-0">
                  {user.email[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-extrabold truncate">
                    {user.email.split('@')[0]}
                  </div>
                  <div className="text-[11px] text-muted truncate">{user.email}</div>
                </div>
              </div>
              <Link to="/account" onClick={close} className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-[13.5px] font-semibold text-ink hover:bg-surface-2 hover:text-brand transition mb-0.5">
                <Icon name="user" size={17} /> My Account
              </Link>
              <Link to="/account/orders" onClick={close} className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-[13.5px] font-semibold text-ink hover:bg-surface-2 hover:text-brand transition mb-0.5">
                <Icon name="package" size={17} /> My Orders
              </Link>
              <Link to="/account/wishlist" onClick={close} className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-[13.5px] font-semibold text-ink hover:bg-surface-2 hover:text-brand transition mb-0.5">
                <Icon name="heart" size={17} /> Wishlist
              </Link>
              <Link to="/account/settings" onClick={close} className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-[13.5px] font-semibold text-ink hover:bg-surface-2 hover:text-brand transition mb-0.5">
                <Icon name="settings" size={17} /> Settings
              </Link>
              <button
                onClick={() => { signOut(); close(); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-[13.5px] font-semibold text-bad hover:bg-bad/10 transition"
              >
                <Icon name="logout" size={17} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { close(); document.dispatchEvent(new Event('open-auth')); }}
                className="w-full bg-brand text-white font-extrabold text-[13.5px] py-3 rounded-xl mb-2 flex items-center justify-center gap-2 hover:bg-brand-dark transition"
              >
                <Icon name="user" size={15} color="white" /> Sign In / Create Account
              </button>
              <Link
                to="/account/orders"
                onClick={close}
                className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-[13.5px] font-semibold text-ink hover:bg-surface-2 hover:text-brand transition mb-0.5"
              >
                <Icon name="package" size={17} /> Track My Order
              </Link>
            </>
          )}
        </div>

        {/* Categories */}
        <div className="p-5 border-b border-line">
          <h4 className="text-[10.5px] font-extrabold text-muted uppercase tracking-[1px] mb-3">
            Categories
          </h4>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/shop?category=${encodeURIComponent(cat.slug)}`}
              onClick={close}
              className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-[13.5px] font-semibold text-ink hover:bg-surface-2 hover:text-brand transition mb-0.5"
            >
              <Icon name="grid" size={17} />
              {cat.label}
            </Link>
          ))}
        </div>

        {/* Preferences */}
        <div className="p-5">
          <h4 className="text-[10.5px] font-extrabold text-muted uppercase tracking-[1px] mb-3">
            Preferences
          </h4>
          <div className="flex items-center justify-between px-3.5 py-3">
            <span className="flex items-center gap-3 text-[13.5px] font-semibold">
              <Icon name={dark ? 'sun' : 'moon'} size={17} />
              Dark Mode
            </span>
            <button
              onClick={toggleDark}
              className={`w-11 h-6 rounded-full relative transition ${dark ? 'bg-brand' : 'bg-line'}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  dark ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
