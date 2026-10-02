import { Link } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { useProducts } from '../hooks/useProducts';
import ProductGrid from '../components/product/ProductGrid';
import Reveal from '../components/ui/Reveal';
import Icon from '../components/ui/Icon';

export default function WishlistPage() {
  const { wishlist } = useWishlist();
  const { products, loading } = useProducts();

  const items = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-[1200px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div>
            <h1 className="text-[22px] md:text-[26px] font-black">My Wishlist</h1>
            <p className="text-[12.5px] text-muted font-semibold">
              {loading ? 'Loading...' : `${items.length} product${items.length === 1 ? '' : 's'} saved`}
            </p>
          </div>
        </div>
      </Reveal>

      {!loading && items.length === 0 ? (
        <Reveal direction="zoom">
          <div className="glass-tile rounded-3xl p-12 text-center">
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-bad/15 text-bad flex items-center justify-center mx-auto mb-5">
                <Icon name="heart" size={32} />
              </div>
              <h2 className="text-lg font-black mb-2">Your wishlist is empty</h2>
              <p className="text-[13px] text-muted mb-5">
                Tap the heart on any product to save it for later.
              </p>
              <Link to="/shop" className="btn-primary inline-flex">
                Browse Products
              </Link>
            </div>
          </div>
        </Reveal>
      ) : (
        <Reveal direction="up">
          <ProductGrid products={items} loading={loading} />
        </Reveal>
      )}
    </div>
  );
}
