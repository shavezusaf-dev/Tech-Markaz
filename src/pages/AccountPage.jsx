import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAddresses } from '../contexts/AddressContext';
import { useProducts } from '../hooks/useProducts';
import { fmt, finalPrice, parseImgs } from '../lib/format';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';

export default function AccountPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wishlist } = useWishlist();
  const { addresses } = useAddresses();
  const { products } = useProducts();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .or(`customer_id.eq.${user.id},guest_email.eq.${user.email}`)
          .order('created_at', { ascending: false });
        if (!cancelled) setOrders(data || []);
      } catch {}
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user]);

  const recentIds = (() => {
    try { return JSON.parse(localStorage.getItem('tm_recent') || '[]').slice(0, 8); }
    catch { return []; }
  })();
  const recentProducts = recentIds.map((id) => products.find((p) => p.id === id)).filter(Boolean);

  const def = addresses.find((a) => a.isDefault) || addresses[0];

  const counts = {
    all: orders.length,
    pay: orders.filter((o) => o.payment_status === 'awaiting_verification' || o.payment_status === 'pending').length,
    ship: orders.filter((o) => o.status === 'Un-processed').length,
    recv: orders.filter((o) => o.status === 'Dispatched').length,
  };

  if (!user) {
    return (
      <div className="max-w-[560px] mx-auto px-[5%] py-16">
        <Reveal direction="zoom">
          <div className="glass-tile rounded-3xl p-10 text-center">
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-5">
                <Icon name="user" size={34} />
              </div>
              <h1 className="text-2xl font-black mb-2">Welcome to Tech Markaz</h1>
              <p className="text-[13px] text-muted mb-6">
                Sign in to see your orders, wishlist, and addresses.
              </p>
              <button
                onClick={() => document.dispatchEvent(new Event('open-auth'))}
                className="btn-primary w-full max-w-[260px] mx-auto"
              >
                Sign In / Create Account
                <Icon name="arrowRight" size={15} color="white" strokeWidth={2.6} />
              </button>
              <Link
                to="/account/orders"
                className="block mt-3 text-[13px] font-extrabold text-brand hover:underline"
              >
                Track an order as guest
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    );
  }

  const name = user.email.split('@')[0];
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="max-w-[1200px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="zoom">
        <div className="glass-tile rounded-3xl p-6 md:p-8 mb-5 relative overflow-hidden">
          <div className="absolute -top-24 -right-16 w-72 h-72 bg-[radial-gradient(circle,rgba(0,71,255,0.28),transparent_65%)] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-[radial-gradient(circle,rgba(255,204,0,0.22),transparent_65%)] rounded-full pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4 flex-wrap">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-accent to-accent-dark text-ink flex items-center justify-center font-black text-[26px] shadow-md shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[20px] md:text-[24px] font-black truncate">{name}</div>
              <div className="text-[12.5px] text-muted truncate">{user.email}</div>
            </div>
            <Link
              to="/account/settings"
              className="glass-icon-btn"
              title="Settings"
            >
              <Icon name="settings" size={18} />
            </Link>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        <div className="space-y-5">
          {/* Orders tiles */}
          <Reveal direction="up">
            <div className="glass-tile rounded-2xl overflow-hidden">
              <div className="relative z-10 px-6 py-4 border-b border-line/60 flex items-center justify-between">
                <h3 className="font-black text-[15px] flex items-center gap-2.5">
                  <Icon name="package" size={16} className="text-brand" />
                  My Orders
                </h3>
                <Link to="/account/orders" className="text-brand text-[12.5px] font-extrabold hover:underline">
                  View all
                </Link>
              </div>
              <div className="relative z-10 grid grid-cols-4 gap-2 p-4">
                {[
                  { label: 'All', count: counts.all, tone: 'brand' },
                  { label: 'To Pay', count: counts.pay, tone: 'warn' },
                  { label: 'To Ship', count: counts.ship, tone: 'accent' },
                  { label: 'To Recv', count: counts.recv, tone: 'ok' },
                ].map((t) => (
                  <Link
                    key={t.label}
                    to="/account/orders"
                    className="flex flex-col items-center gap-2 py-3 rounded-xl hover:bg-brand-light/50 transition"
                  >
                    <span
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-[15px] font-black ${
                        t.tone === 'brand' ? 'bg-brand-light text-brand'
                        : t.tone === 'warn' ? 'bg-warn/15 text-warn'
                        : t.tone === 'accent' ? 'bg-accent/20 text-accent-dark'
                        : 'bg-ok/15 text-ok'
                      }`}
                    >
                      {t.count}
                    </span>
                    <span className="text-[11.5px] font-extrabold text-ink-2">{t.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Recent orders */}
          <Reveal direction="up" delay={80}>
            <div className="glass-tile rounded-2xl overflow-hidden">
              <div className="relative z-10 px-6 py-4 border-b border-line/60">
                <h3 className="font-black text-[15px] flex items-center gap-2.5">
                  <Icon name="clock" size={16} className="text-brand" />
                  Recent Activity
                </h3>
              </div>
              <div className="relative z-10 p-4">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-14 rounded-xl bg-surface-2 animate-pulse" />
                    <div className="h-14 rounded-xl bg-surface-2 animate-pulse" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">-</div>
                    <div className="text-[13.5px] font-extrabold text-ink mb-1">No orders yet</div>
                    <div className="text-[12px] text-muted mb-4">Start shopping to see orders here.</div>
                    <button onClick={() => navigate('/shop')} className="btn-ghost text-xs py-2.5 px-4">
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 3).map((o) => (
                      <Link
                        key={o.id}
                        to="/account/orders"
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-light/40 transition"
                      >
                        <span className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                          <Icon name="package" size={16} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-mono font-extrabold text-brand truncate">
                            #{o.order_number || o.id.split('-')[0].toUpperCase()}
                          </div>
                          <div className="text-[11.5px] text-muted truncate">
                            {o.items_summary}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[13px] font-black">{fmt(o.total_amount)}</div>
                          <span
                            className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              o.status === 'Delivered' ? 'bg-ok/15 text-ok'
                              : o.status === 'Dispatched' ? 'bg-brand-light text-brand'
                              : o.status === 'Cancelled' ? 'bg-bad/15 text-bad'
                              : 'bg-warn/15 text-warn'
                            }`}
                          >
                            {o.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        <div className="space-y-5">
          {/* Address */}
          <Reveal direction="right">
            <div className="glass-tile rounded-2xl overflow-hidden">
              <div className="relative z-10 px-6 py-4 border-b border-line/60 flex items-center justify-between">
                <h3 className="font-black text-[15px] flex items-center gap-2.5">
                  <Icon name="mapPin" size={16} className="text-brand" />
                  Address Book
                </h3>
                <Link to="/account/settings/addresses" className="text-brand text-[12.5px] font-extrabold hover:underline">
                  Manage
                </Link>
              </div>
              <div className="relative z-10 p-4">
                {def ? (
                  <div className="p-3.5 rounded-xl bg-brand-light/60 border border-brand-lighter">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[13px] font-black text-ink">{def.name}</span>
                      {def.isDefault && (
                        <span className="bg-accent text-ink text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-ink-2 leading-snug font-medium">
                      {def.street}, {def.area}<br />
                      {def.city}, {def.province}
                    </div>
                    <div className="text-[11.5px] text-muted font-semibold mt-1.5">{def.phone}</div>
                  </div>
                ) : (
                  <Link
                    to="/account/settings/addresses"
                    className="block p-3.5 rounded-xl border-2 border-dashed border-line text-center hover:border-brand hover:bg-brand-light/40 transition"
                  >
                    <div className="text-[13px] font-extrabold text-brand">+ Add Address</div>
                    <div className="text-[11.5px] text-muted mt-0.5">Faster checkout next time</div>
                  </Link>
                )}
              </div>
            </div>
          </Reveal>

          {/* Wishlist shortcut */}
          <Reveal direction="right" delay={80}>
            <Link
              to="/account/wishlist"
              className="glass-tile rounded-2xl p-4 flex items-center gap-3.5 hover:-translate-y-1 transition-transform"
            >
              <span className="relative z-10 w-11 h-11 rounded-2xl bg-bad/15 text-bad flex items-center justify-center shrink-0">
                <Icon name="heart" size={18} />
              </span>
              <div className="relative z-10 flex-1 min-w-0">
                <div className="text-[14px] font-black">Wishlist</div>
                <div className="text-[11.5px] text-muted font-semibold">
                  {wishlist.length} product{wishlist.length === 1 ? '' : 's'} saved
                </div>
              </div>
              <Icon name="chevronRight" size={16} className="relative z-10 text-muted" />
            </Link>
          </Reveal>

          {/* Recently viewed */}
          <Reveal direction="right" delay={160}>
            <div className="glass-tile rounded-2xl overflow-hidden">
              <div className="relative z-10 px-6 py-4 border-b border-line/60">
                <h3 className="font-black text-[15px] flex items-center gap-2.5">
                  <Icon name="clock" size={16} className="text-brand" />
                  Recently Viewed
                </h3>
              </div>
              <div className="relative z-10 p-4">
                {recentProducts.length === 0 ? (
                  <div className="text-[12.5px] text-muted text-center py-6 font-medium">
                    No recently viewed products.
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {recentProducts.slice(0, 5).map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        className="shrink-0 w-[80px] text-center group"
                      >
                        <div className="w-[80px] h-[80px] rounded-xl bg-white/60 dark:bg-white/[0.04] border border-line/60 flex items-center justify-center p-1.5 mb-1.5 group-hover:border-brand transition">
                          <img src={parseImgs(p.images)[0]} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-[10.5px] font-semibold text-ink-2 line-clamp-2 leading-tight">
                          {p.title}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
