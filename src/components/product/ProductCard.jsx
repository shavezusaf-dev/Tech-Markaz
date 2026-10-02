import { Link } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { fmt, finalPrice, parseImgs } from '../../lib/format';
import Icon from '../ui/Icon';
import RatingStars from './RatingStars';

export default function ProductCard({ product }) {
  const { wishlist, toggleWish } = useWishlist();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const imgs = parseImgs(product.images);
  const thumb = imgs[0] || 'https://via.placeholder.com/300x300?text=No+Image';
  const disc = parseFloat(product.discount_percent) || 0;
  const price = finalPrice(product);
  const stockOut = (product.stock_count || 0) <= 0;
  const isWished = wishlist.includes(product.id);
  const rating = product.rating || 4.5;
  const badge = product.badge || '';

  const onAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (stockOut) return;
    addToCart(product);
    toast(`${product.title.slice(0, 40)} added to cart`, 'ok', 'Added');
  };

  const onWish = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWish(product.id);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="glass-tile group rounded-2xl flex flex-col"
    >
      <div className="relative z-10 aspect-square flex items-center justify-center p-4 overflow-hidden rounded-t-2xl">
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {disc > 0 && (
            <span className="bg-gradient-to-br from-bad to-[#DC2626] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow">
              {disc}% OFF
            </span>
          )}
          {badge && (
            <span className="bg-gradient-to-br from-brandOrange to-[#E05E00] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow">
              {badge}
            </span>
          )}
          {stockOut && (
            <span className="bg-gradient-to-br from-[#8B96AE] to-ink-3 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md">
              Out of Stock
            </span>
          )}
        </div>

        <button
          onClick={onWish}
          aria-label="Wishlist"
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center z-10 shadow-sm transition hover:scale-110 ${
            isWished
              ? 'bg-bad text-white'
              : 'bg-white/95 dark:bg-[#0E1322]/90 text-muted'
          }`}
        >
          <Icon
            name="heart"
            size={16}
            color="currentColor"
            strokeWidth={2.2}
            className={isWished ? 'fill-current' : ''}
          />
        </button>

        <img
          src={thumb}
          alt={product.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/300x300';
          }}
          className="w-full h-full object-contain transition-transform duration-[600ms] group-hover:scale-110 group-hover:-rotate-2"
        />
      </div>

      <div className="relative z-10 p-3.5 flex flex-col flex-1">
        <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-muted mb-1">
          {product.brand || product.category_name || 'Tech Markaz'}
        </div>
        <div className="text-[13.5px] font-semibold leading-snug line-clamp-2 h-[38px] mb-2.5 text-ink group-hover:text-brand transition">
          {product.title}
        </div>
        <div className="flex items-center gap-1.5 text-[11.5px] text-muted font-semibold mb-2.5">
          <RatingStars value={rating} />
        </div>
        <div className="flex items-baseline gap-2 flex-wrap mb-3 mt-auto">
          {disc > 0 && (
            <span className="text-xs text-muted line-through">{fmt(product.price)}</span>
          )}
          <span className="text-[17px] font-black tracking-tight">{fmt(price)}</span>
        </div>
        <button
          disabled={stockOut}
          onClick={onAdd}
          className="w-full bg-brand text-white font-extrabold text-[13px] py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-dark hover:-translate-y-0.5 hover:shadow-lg disabled:bg-surface-3 disabled:text-muted disabled:cursor-not-allowed disabled:translate-y-0 transition-all"
        >
          <Icon name="cart" size={15} color="currentColor" />
          {stockOut ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}
