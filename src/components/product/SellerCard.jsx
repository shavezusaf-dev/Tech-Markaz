import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Icon from '../ui/Icon';

export default function SellerCard({ sellerId, productId, product }) {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [stats, setStats] = useState({ products: 0, reviews: 0, rating: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      const [sellerRes, prodRes] = await Promise.all([
        supabase.from('sellers').select('*').eq('id', sellerId).maybeSingle(),
        supabase
          .from('products')
          .select('id, rating')
          .eq('seller_id', sellerId)
          .eq('status', 'active'),
      ]);

      const products = prodRes.data || [];
      const productIds = products.map((p) => p.id);

      let reviewCount = 0;
      let ratingAvg = null;
      if (productIds.length > 0) {
        const { data: revs } = await supabase
          .from('reviews')
          .select('rating')
          .in('product_id', productIds);
        if (revs && revs.length > 0) {
          reviewCount = revs.length;
          ratingAvg =
            revs.reduce((s, r) => s + (parseFloat(r.rating) || 0), 0) / revs.length;
        }
      }

      if (!cancelled) {
        setSeller(sellerRes.data);
        setStats({
          products: products.length,
          reviews: reviewCount,
          rating: ratingAvg ? Math.round(ratingAvg * 10) / 10 : null,
        });
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [sellerId]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface/40 border border-line/60 p-4 h-[180px] animate-pulse" />
    );
  }
  if (!seller) return null;

  const name = seller.store_name || seller.full_name || 'Tech Markaz Seller';
  const initial = name.charAt(0).toUpperCase();
  const since = seller.created_at
    ? new Date(seller.created_at).getFullYear()
    : new Date().getFullYear();
  const isNewSeller = stats.reviews === 0 && stats.products < 3;

  const openChat = () =>
    document.dispatchEvent(
      new CustomEvent('open-chat', { detail: { name, sellerId, productId, product } })
    );
  const visitStore = () => navigate(`/shop?seller=${sellerId}`);

  return (
    <div className="glass-tile rounded-2xl p-4">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10.5px] uppercase tracking-[1.2px] font-extrabold text-muted">
            Sold by
          </div>
          <span className="inline-flex items-center gap-1 bg-ok/15 text-ok text-[9.5px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
            <Icon name="check" size={9} strokeWidth={3.5} />
            Verified
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white flex items-center justify-center font-black text-[17px] shrink-0 shadow-md">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-black text-ink truncate">{name}</div>
            <div className="text-[11px] text-muted font-semibold">
              {stats.products} product{stats.products === 1 ? '' : 's'} · since {since}
            </div>
          </div>
        </div>

        {/* Real stats — no fake numbers */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-surface/50 dark:bg-white/[0.04] rounded-xl px-2 py-2.5 text-center border border-line/60">
            <div className="text-[14px] font-black text-brand leading-none mb-1">
              {stats.reviews > 0 ? stats.reviews : '—'}
            </div>
            <div className="text-[9px] uppercase tracking-wider font-extrabold text-muted leading-tight">
              Reviews
            </div>
          </div>
          <div className="bg-surface/50 dark:bg-white/[0.04] rounded-xl px-2 py-2.5 text-center border border-line/60">
            <div className="text-[14px] font-black text-brand leading-none mb-1">
              {stats.rating != null ? `${stats.rating}★` : '—'}
            </div>
            <div className="text-[9px] uppercase tracking-wider font-extrabold text-muted leading-tight">
              Rating
            </div>
          </div>
          <div className="bg-surface/50 dark:bg-white/[0.04] rounded-xl px-2 py-2.5 text-center border border-line/60">
            <div className="text-[14px] font-black text-brand leading-none mb-1">
              {/* Chat reply time — will be dynamic once real messaging is live */}
              {'—'}
            </div>
            <div className="text-[9px] uppercase tracking-wider font-extrabold text-muted leading-tight">
              Chat Reply
            </div>
          </div>
        </div>

        {isNewSeller && (
          <div className="text-[10.5px] text-muted text-center mb-3 font-medium">
            New seller on Tech Markaz
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={visitStore}
            className="bg-brand text-white text-[12.5px] font-extrabold py-2.5 rounded-xl hover:bg-brand-dark transition flex items-center justify-center gap-1.5"
          >
            <Icon name="store" size={13} />
            Visit Store
          </button>
          <button
            onClick={openChat}
            className="bg-surface/60 dark:bg-white/[0.06] border border-line text-[12.5px] font-extrabold py-2.5 rounded-xl hover:bg-brand-light hover:border-brand-lighter hover:text-brand transition flex items-center justify-center gap-1.5"
          >
            <Icon name="message" size={13} />
            Chat Now
          </button>
        </div>
      </div>
    </div>
  );
}


