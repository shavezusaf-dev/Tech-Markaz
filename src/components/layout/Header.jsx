import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { fmt, finalPrice, parseImgs } from '../../lib/format';
import Brand from '../ui/Brand';
import Icon from '../ui/Icon';

export default function Header() {
  const { user, signOut } = useAuth();
  const { count } = useCart();
  const { wishlist } = useWishlist();
  const { dark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);

  const searchRef = useRef(null);
  const suggestRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (
        suggestRef.current && !suggestRef.current.contains(e.target) &&
        searchRef.current && !searchRef.current.contains(e.target)
      ) {
        setShowSuggest(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    const q = search.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggest(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('id,title,brand,category_name,images,price,discount_percent')
          .eq('status', 'active')
          .or(`title.ilike.%${q}%,brand.ilike.%${q}%`)
          .limit(6);
        setSuggestions(data || []);
        setShowSuggest(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timerRef.current);
  }, [search]);

  const onSearch = (e) => {
    e.preventDefault();
    setShowSuggest(false);
    if (!search.trim()) return;
    navigate(`/shop?q=${encodeURIComponent(search.trim())}`);
  };

  const pickSuggestion = (id) => {
    setShowSuggest(false);
    setSearch('');
    navigate(`/product/${id}`);
  };

  const iconBtn = 'glass-icon-btn shrink-0';

  return (
    <header className="sticky top-0 z-[900] border-b border-line/60 backdrop-blur-xl bg-surface/75">
      {/* Row 1: Menu | Brand | Icons */}
      <div className="max-w-[1560px] mx-auto flex items-center gap-2 px-3 md:px-[5%] py-2.5">
        <button
          className={`${iconBtn} md:hidden`}
          onClick={() => document.dispatchEvent(new Event('open-drawer'))}
          aria-label="Menu"
        >
          <Icon name="menu" size={18} strokeWidth={2.2} />
        </button>

        <Brand size="md" />

        <div className="flex items-center gap-1.5 md:gap-2 ml-auto">
          {/* Desktop search (inline) */}
          <div className="hidden md:flex flex-1 max-w-[720px] relative" ref={searchRef}>
            <form
              onSubmit={onSearch}
              className="w-full flex h-12 relative rounded-full border border-line/70 bg-surface-2/70 backdrop-blur-xl overflow-hidden transition-all focus-within:border-brand focus-within:bg-surface focus-within:ring-4 focus-within:ring-brand-light/50"
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => search.trim().length >= 2 && suggestions.length > 0 && setShowSuggest(true)}
                placeholder="Search for smartphones, audio, TVs..."
                className="flex-1 bg-transparent border-none outline-none px-5 text-sm text-ink placeholder:text-muted"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 w-11 bg-brand text-white rounded-full flex items-center justify-center hover:bg-brand-dark transition"
                aria-label="Search"
              >
                <Icon name="search" size={18} color="white" strokeWidth={2.2} />
              </button>
            </form>

            {showSuggest && suggestions.length > 0 && (
              <div
                ref={suggestRef}
                className="absolute top-full left-0 right-0 mt-2 bg-surface/95 backdrop-blur-2xl rounded-2xl border border-line/70 shadow-xl overflow-hidden z-50 max-h-[420px] overflow-y-auto"
              >
                {suggestions.map((s) => {
                  const img = parseImgs(s.images)[0] || '';
                  return (
                    <button
                      key={s.id}
                      onClick={() => pickSuggestion(s.id)}
                      className="w-full text-left px-4 py-2.5 hover:bg-brand-light/40 transition flex items-center gap-3 border-b border-line/30 last:border-0"
                    >
                      {img ? (
                        <img src={img} alt="" className="w-11 h-11 rounded-lg object-contain bg-white p-1 border border-line shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-surface-2 border border-line shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-bold text-ink truncate">{s.title}</div>
                        <div className="text-[10.5px] text-muted font-semibold truncate">
                          {s.brand} · {s.category_name}
                        </div>
                      </div>
                      <div className="text-[12.5px] font-extrabold text-brand shrink-0">
                        {fmt(finalPrice(s))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Icon row (mobile + desktop) */}
          <Link to="/support" className={iconBtn} title="Support">
            <Icon name="headphone" size={18} strokeWidth={2.2} />
          </Link>

          <button onClick={toggleDark} className={iconBtn} title="Theme">
            <Icon name={dark ? 'sun' : 'moon'} size={18} strokeWidth={2.2} />
          </button>

          <Link to="/account/wishlist" className={`${iconBtn} relative hidden sm:flex`} title="Wishlist">
            <Icon name="heart" size={18} strokeWidth={2.2} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-bad text-white text-[10px] font-extrabold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-surface">
                {wishlist.length}
              </span>
            )}
          </Link>

          <button
            onClick={() => document.dispatchEvent(new Event('open-cart'))}
            className={`${iconBtn} relative hidden sm:flex`}
            title="Cart"
          >
            <Icon name="cart" size={18} strokeWidth={2.2} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-bad text-white text-[10px] font-extrabold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-surface">
                {count}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                className={`${iconBtn} !w-auto !px-1.5 gap-2`}
                title={user.email}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent-dark text-ink flex items-center justify-center font-extrabold text-[11px] shrink-0">
                  {user.email[0].toUpperCase()}
                </div>
                <span className="hidden md:inline text-[12.5px] font-extrabold text-ink whitespace-nowrap pr-1">
                  {user.email.split('@')[0]}
                </span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute top-full right-0 mt-3 glass-tile rounded-2xl min-w-[260px] z-50 animate-fade-up overflow-hidden">
                    <div className="relative z-10 p-4 border-b border-line/60">
                      <div className="font-extrabold text-sm text-ink">{user.email.split('@')[0]}</div>
                      <div className="text-xs text-muted mt-0.5">{user.email}</div>
                    </div>
                    <Link to="/account" onClick={() => setMenuOpen(false)} className="relative z-10 block px-4 py-3 text-sm font-semibold text-ink-2 hover:bg-brand-light hover:text-brand transition">My Account</Link>
                    <Link to="/account/orders" onClick={() => setMenuOpen(false)} className="relative z-10 block px-4 py-3 text-sm font-semibold text-ink-2 hover:bg-brand-light hover:text-brand transition">My Orders</Link>
                    <Link to="/account/wishlist" onClick={() => setMenuOpen(false)} className="relative z-10 block px-4 py-3 text-sm font-semibold text-ink-2 hover:bg-brand-light hover:text-brand transition">Wishlist</Link>
                    <button onClick={() => { signOut(); setMenuOpen(false); }} className="relative z-10 w-full text-left px-4 py-3 text-sm font-semibold text-bad hover:bg-bad/10 transition">Sign Out</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => document.dispatchEvent(new Event('open-auth'))}
              className={`${iconBtn} !w-auto !px-1.5 gap-2`}
              title="Sign In"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent-dark text-ink flex items-center justify-center shrink-0">
                <Icon name="user" size={13} strokeWidth={2.4} />
              </div>
              <span className="hidden md:inline text-[12.5px] font-extrabold text-ink whitespace-nowrap pr-1">
                Sign In
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2 (mobile only): Search */}
      <form onSubmit={onSearch} className="md:hidden px-3 pb-2.5">
        <div className="flex h-11 relative rounded-full border border-line/70 bg-surface-2/70 backdrop-blur-xl overflow-hidden">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-ink placeholder:text-muted"
          />
          <button type="submit" className="absolute right-1 top-1 bottom-1 w-9 bg-brand text-white rounded-full flex items-center justify-center">
            <Icon name="search" size={16} color="white" strokeWidth={2.4} />
          </button>
        </div>
      </form>
    </header>
  );
}
