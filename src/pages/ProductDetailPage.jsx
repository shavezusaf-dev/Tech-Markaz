import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProduct } from '../hooks/useProduct';
import { useProductRating } from '../hooks/useProductRating';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { fmt, finalPrice, parseImgs } from '../lib/format';
import Icon from '../components/ui/Icon';
import RatingStars from '../components/product/RatingStars';
import Reveal from '../components/ui/Reveal';
import ProductGrid from '../components/product/ProductGrid';
import SellerCard from '../components/product/SellerCard';
import ReviewsSection from '../components/product/ReviewsSection';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { product, loading, error } = useProduct(id);
  const { addToCart } = useCart();
  const { wishlist, toggleWish } = useWishlist();
  const { toast } = useToast();

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState([]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const { rating, reviewCount } = useProductRating(product?.id, product?.rating);

  const imgs = product ? parseImgs(product.images) : [];
  const images = imgs.length ? imgs : ['https://via.placeholder.com/600x600?text=No+Image'];
  const disc = product ? parseFloat(product.discount_percent) || 0 : 0;
  const fp = product ? finalPrice(product) : 0;
  const stock = product?.stock_count || 0;
  const stockOut = stock <= 0;
  const isWished = product ? wishlist.includes(product.id) : false;

  const total = images.length;
  const nextImg = () => setActiveImg((i) => (i + 1) % total);
  const prevImg = () => setActiveImg((i) => (i - 1 + total) % total);

  // Keyboard arrows
  useEffect(() => {
    if (!product || total < 2) return;
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); nextImg(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prevImg(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, total]);

  // Touch swipe
  const onTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };
  const onTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50 && total > 1) {
      if (diff > 0) nextImg();
      else prevImg();
    }
  };

  useEffect(() => {
    if (!product) return;
    try {
      const raw = JSON.parse(localStorage.getItem('tm_recent') || '[]');
      const next = [product.id, ...raw.filter((x) => x !== product.id)].slice(0, 10);
      localStorage.setItem('tm_recent', JSON.stringify(next));
    } catch {}
  }, [product]);

  useEffect(() => {
    if (!product?.category_name) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category_name', product.category_name)
        .eq('status', 'active')
        .neq('id', product.id)
        .limit(4);
      if (!cancelled) setRelated(data || []);
    })();
    return () => { cancelled = true; };
  }, [product?.id, product?.category_name]);

  if (loading) {
    return (
      <div className="max-w-[1560px] mx-auto px-[4%] md:px-[5%] py-12">
        <div className="glass-tile rounded-2xl h-[500px] animate-pulse" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-[560px] mx-auto px-6 py-20 text-center">
        <div className="glass-tile rounded-2xl p-10">
          <div className="relative z-10">
            <div className="text-5xl mb-4">?</div>
            <h2 className="text-xl font-black mb-2">Product not found</h2>
            <p className="text-[13px] text-muted mb-6">
              It may have been removed or the link is incorrect.
            </p>
            <button className="btn-primary" onClick={() => navigate('/shop')}>
              Back to Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  const onAdd = () => {
    if (stockOut) return;
    addToCart(product, qty);
    toast(`${product.title.slice(0, 40)} added to cart`, 'ok', 'Added');
  };

  const onBuyNow = () => {
    if (stockOut) return;
    addToCart(product, qty);
    setTimeout(() => document.dispatchEvent(new Event('open-checkout')), 150);
  };

  const specs =
    product.specs && typeof product.specs === 'object' && !Array.isArray(product.specs)
      ? product.specs
      : (() => {
          try { return JSON.parse(product.specs || '{}'); } catch { return {}; }
        })();
  const specKeys = Object.keys(specs).filter((k) => specs[k]);

  const reviewLabel = reviewCount > 0
    ? `${reviewCount} review${reviewCount === 1 ? '' : 's'}`
    : 'No reviews yet';

  return (
    <div className="max-w-[1560px] mx-auto px-[4%] md:px-[5%] py-5 md:py-8">
      <div className="mb-4 flex items-center gap-2 text-[12.5px] font-semibold flex-wrap">
        <Link to="/" className="text-muted hover:text-brand transition">Home</Link>
        <span className="text-muted">/</span>
        <Link to="/shop" className="text-muted hover:text-brand transition">Shop</Link>
        {product.category_name && (
          <>
            <span className="text-muted">/</span>
            <Link
              to={`/shop?category=${encodeURIComponent(product.category_name)}`}
              className="text-muted hover:text-brand transition"
            >
              {product.category_name}
            </Link>
          </>
        )}
        <span className="text-muted">/</span>
        <span className="text-ink truncate max-w-[240px]">{product.title}</span>
      </div>

      <Reveal direction="up">
        <div className="glass-tile rounded-3xl p-5 md:p-7 grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-6 md:gap-8 mb-6">
          {/* Gallery with arrows + swipe */}
          <div className="relative z-10 flex flex-col">
            <div
              className="relative rounded-2xl bg-white/40 dark:bg-white/[0.03] border border-white/60 dark:border-white/10 p-5 flex items-center justify-center aspect-square overflow-hidden flex-1 select-none"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={images[activeImg]}
                alt={product.title}
                draggable={false}
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/600x600'; }}
                className="w-full h-full object-contain transition-transform duration-300"
              />

              {imgs.length > 1 && (
                <>
                  <button
                    onClick={prevImg}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-[#0E1322]/90 backdrop-blur border border-line shadow-lg flex items-center justify-center text-ink hover:bg-white dark:hover:bg-[#0E1322] hover:scale-110 transition-all z-10"
                  >
                    <Icon name="chevronLeft" size={20} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={nextImg}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-[#0E1322]/90 backdrop-blur border border-line shadow-lg flex items-center justify-center text-ink hover:bg-white dark:hover:bg-[#0E1322] hover:scale-110 transition-all z-10"
                  >
                    <Icon name="chevronRight" size={20} strokeWidth={2.5} />
                  </button>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        aria-label={`Image ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          i === activeImg
                            ? 'w-6 bg-brand'
                            : 'w-1.5 bg-ink/25 hover:bg-ink/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {imgs.length > 1 && (
              <div className="flex gap-2.5 mt-3.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {images.map((u, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`shrink-0 w-16 h-16 md:w-[70px] md:h-[70px] rounded-xl border-2 overflow-hidden transition-all p-1.5 bg-white/60 dark:bg-white/[0.04] ${
                      i === activeImg
                        ? 'border-brand shadow-md scale-[1.03]'
                        : 'border-white/60 dark:border-white/10 hover:border-brand-lighter'
                    }`}
                  >
                    <img src={u} alt={`thumb ${i + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            <div className="text-[11px] uppercase tracking-[1.4px] font-extrabold text-brand">
              {product.brand || product.category_name || 'Tech Markaz'}
            </div>

            <h1 className="text-[20px] md:text-[26px] font-black tracking-tight leading-[1.2]">
              {product.title}
            </h1>

            <div className="flex items-center gap-3 flex-wrap">
              <RatingStars value={rating} size={14} />
              <span className="text-[12px] text-muted font-semibold">{reviewLabel}</span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-[28px] md:text-[34px] font-black tracking-tight text-ink">
                {fmt(fp)}
              </span>
              {disc > 0 && (
                <>
                  <span className="text-[15px] md:text-[17px] text-muted line-through font-semibold">
                    {fmt(product.price)}
                  </span>
                  <span className="bg-ok/15 text-ok px-2.5 py-1 rounded-full text-[11.5px] font-extrabold">
                    Save {disc}%
                  </span>
                </>
              )}
            </div>

            <div>
              {stockOut ? (
                <span className="inline-flex items-center gap-2 bg-bad/15 text-bad px-3.5 py-1.5 rounded-full text-[12px] font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-bad" />
                  Out of Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 bg-ok/15 text-ok px-3.5 py-1.5 rounded-full text-[12px] font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
                  In Stock · {stock} available
                </span>
              )}
            </div>

            <div className="flex gap-2.5 flex-wrap">
              {!stockOut && (
                <div className="flex items-center bg-surface/60 dark:bg-white/[0.04] border border-line rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-brand hover:text-white transition"
                  >
                    <Icon name="minus" size={14} />
                  </button>
                  <span className="w-10 text-center font-extrabold text-[14.5px]">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(stock, q + 1))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-brand hover:text-white transition"
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </div>
              )}

              <button
                disabled={stockOut}
                onClick={onAdd}
                className="flex-1 min-w-[140px] bg-brand text-white font-extrabold text-[13.5px] py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-dark hover:-translate-y-0.5 hover:shadow-lg disabled:bg-surface-3 disabled:text-muted disabled:cursor-not-allowed transition-all"
              >
                <Icon name="cart" size={16} color="currentColor" />
                {stockOut ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                disabled={stockOut}
                onClick={onBuyNow}
                className="flex-1 min-w-[120px] bg-accent text-ink font-extrabold text-[13.5px] py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-accent-dark hover:-translate-y-0.5 hover:shadow-lg disabled:bg-surface-3 disabled:text-muted disabled:cursor-not-allowed transition-all"
              >
                <Icon name="zap" size={16} color="currentColor" strokeWidth={2.6} />
                {stockOut ? 'Out of Stock' : 'Buy Now'}
              </button>

              <button
                onClick={() => toggleWish(product.id)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                  isWished
                    ? 'bg-bad/10 border-bad text-bad'
                    : 'bg-surface/60 dark:bg-white/[0.04] border-line text-muted hover:border-bad hover:text-bad'
                }`}
              >
                <Icon name="heart" size={18} color="currentColor" strokeWidth={2.2} className={isWished ? 'fill-current' : 'fill-none'} />
              </button>
            </div>

            <div className="rounded-2xl bg-surface/40 dark:bg-white/[0.03] border border-line/60 p-3.5 mt-1">
              <div className="text-[10px] uppercase tracking-[1.2px] font-extrabold text-muted mb-2.5">
                Delivery & Returns
              </div>
              <div className="space-y-2">
                {[
                  { icon: 'truck', label: 'Standard Delivery', value: 'Rs. 200 · 2-4 days' },
                  { icon: 'creditCard', label: 'Cash on Delivery', value: 'Available' },
                  { icon: 'rotate', label: '14-Day Returns', value: 'Free' },
                  { icon: 'shield', label: 'Warranty', value: specs.warranty || '1 Year Official' },
                ].map((r) => (
                  <div key={r.label} className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0">
                      <Icon name={r.icon} size={13} />
                    </span>
                    <span className="text-[12px] font-bold text-ink-2 flex-1">{r.label}</span>
                    <span className="text-[11.5px] font-extrabold text-ink">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {product.seller_id && (
              <SellerCard
                sellerId={product.seller_id}
                productId={product.id}
                product={product}
              />
            )}
          </div>
        </div>
      </Reveal>

      {(product.description || specKeys.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5 mb-6">
          {product.description && (
            <div className="glass-tile rounded-2xl p-6">
              <div className="relative z-10">
                <h2 className="text-[15px] font-black mb-3 flex items-center gap-2.5">
                  <span className="w-[4px] h-[16px] bg-gradient-to-b from-brand to-accent rounded-full" />
                  Product Description
                </h2>
                <p className="text-[13.5px] leading-[1.75] text-ink-2 font-medium whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </div>
          )}

          {specKeys.length > 0 && (
            <div className="glass-tile rounded-2xl p-6">
              <div className="relative z-10">
                <h2 className="text-[15px] font-black mb-4 flex items-center gap-2.5">
                  <span className="w-[4px] h-[16px] bg-gradient-to-b from-brand to-accent rounded-full" />
                  Specifications
                </h2>
                <div className="space-y-0 max-h-[400px] overflow-y-auto pr-1">
                  {specKeys.map((k, i) => (
                    <div
                      key={k}
                      className={`flex justify-between gap-4 py-2.5 ${
                        i < specKeys.length - 1 ? 'border-b border-line/40' : ''
                      }`}
                    >
                      <span className="text-[11.5px] uppercase tracking-wider font-extrabold text-muted">
                        {k.replace(/[-_]/g, ' ')}
                      </span>
                      <span className="text-[12.5px] font-bold text-ink text-right">
                        {String(specs[k])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-6">
        <ReviewsSection productId={product.id} fallbackRating={rating} />
      </div>

      {related.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[18px] md:text-[22px] font-black flex items-center gap-3 mb-5">
            <span className="w-[5px] h-[18px] md:h-[22px] bg-gradient-to-b from-brand to-accent rounded-full" />
            You may also like
          </h2>
          <ProductGrid products={related} />
        </div>
      )}
    </div>
  );
}



