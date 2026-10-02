import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import Icon from '../ui/Icon';

export default function BottomNav() {
  const location = useLocation();
  const { count } = useCart();
  const path = location.pathname;

  const isActive = (p) => path === p;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-line z-[600] flex justify-around items-end py-2 px-0 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(8,9,31,0.06)]">
      <Link
        to="/"
        className={`flex flex-col items-center gap-1 flex-1 py-1.5 text-[10.5px] font-bold transition ${
          isActive('/') ? 'text-brand' : 'text-muted'
        }`}
      >
        <Icon name="grid" size={22} />
        <span>Home</span>
      </Link>

      <Link
        to="/account/wishlist"
        className={`flex flex-col items-center gap-1 flex-1 py-1.5 text-[10.5px] font-bold transition ${
          isActive('/account/wishlist') ? 'text-brand' : 'text-muted'
        }`}
      >
        <Icon name="heart" size={22} />
        <span>Wishlist</span>
      </Link>

      <button
        onClick={() => document.dispatchEvent(new Event('open-cart'))}
        className="flex flex-col items-center flex-1 relative"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand to-brand-dark text-white flex items-center justify-center -translate-y-5 shadow-xl border-4 border-surface">
          <Icon name="cart" size={24} color="white" />
        </div>
        {count > 0 && (
          <span className="absolute top-0 right-[calc(50%-22px)] bg-bad text-white text-[9.5px] font-extrabold min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center border-2 border-surface">
            {count}
          </span>
        )}
      </button>

      <Link
        to="/account/orders"
        className={`flex flex-col items-center gap-1 flex-1 py-1.5 text-[10.5px] font-bold transition ${
          isActive('/account/orders') ? 'text-brand' : 'text-muted'
        }`}
      >
        <Icon name="package" size={22} />
        <span>Orders</span>
      </Link>

      <Link
        to="/account"
        className={`flex flex-col items-center gap-1 flex-1 py-1.5 text-[10.5px] font-bold transition ${
          isActive('/account') ? 'text-brand' : 'text-muted'
        }`}
      >
        <Icon name="user" size={22} />
        <span>Account</span>
      </Link>
    </div>
  );
}
