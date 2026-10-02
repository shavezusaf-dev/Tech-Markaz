import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { fmt, finalPrice, parseImgs } from '../../lib/format';
import Icon from '../ui/Icon';

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, count, subtotal, changeQty, removeFromCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    document.addEventListener('open-cart', onOpen);
    document.addEventListener('close-cart', onClose);
    return () => {
      document.removeEventListener('open-cart', onOpen);
      document.removeEventListener('close-cart', onClose);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  if (!open) return null;

  const close = () => setOpen(false);

  return (
    <div className="fixed inset-0 z-[4000]">
      <div className="absolute inset-0 bg-[#050814]/50 backdrop-blur-sm animate-fade-up" onClick={close} />
      <aside className="absolute top-0 right-0 bottom-0 w-full sm:w-[460px] bg-surface flex flex-col shadow-2xl animate-slide-left">
        <div className="px-6 py-5 border-b border-line flex justify-between items-center shrink-0">
          <h3 className="text-[17px] font-black flex items-center gap-2.5">
            Your Cart
            <span className="bg-brand text-white text-[11.5px] font-black px-2.5 py-1 rounded-full">
              {count}
            </span>
          </h3>
          <button
            onClick={close}
            className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center hover:bg-bad/10 hover:text-bad transition"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <Icon name="cart" size={56} className="mx-auto text-line mb-4" />
              <h3 className="text-base font-black mb-2">Your cart is empty</h3>
              <p className="text-[13px] text-muted mb-6">Add products to get started.</p>
              <button
                className="btn-primary"
                onClick={() => { close(); navigate('/shop'); }}
              >
                Browse Products
              </button>
            </div>
          ) : (
            items.map((it) => (
              <CartItem
                key={it.product.id}
                item={it}
                onQty={changeQty}
                onRemove={removeFromCart}
              />
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-line bg-surface-2 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-muted font-semibold">Subtotal</span>
              <b className="text-xl font-black">{fmt(subtotal)}</b>
            </div>
            <button
              className="btn-primary w-full"
              onClick={() => { close(); document.dispatchEvent(new Event('open-checkout')); }}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

function CartItem({ item, onQty, onRemove }) {
  const { product, qty } = item;
  const imgs = parseImgs(product.images);
  const thumb = imgs[0] || 'https://via.placeholder.com/56';
  const fp = finalPrice(product);

  return (
    <div className="flex gap-3.5 py-3.5 border-b border-line last:border-0 items-center">
      <img
        src={thumb}
        alt={product.title}
        className="w-16 h-16 object-contain rounded-xl border border-line p-1.5 shrink-0 bg-white"
      />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold line-clamp-1 mb-1">{product.title}</div>
        <div className="text-[11.5px] text-muted font-semibold mb-2">
          {product.category_name} · {fmt(fp)} each
        </div>
        <div className="inline-flex items-center bg-surface-2 rounded-lg p-0.5 border border-line">
          <button
            onClick={() => onQty(product.id, -1)}
            className="w-7 h-7 rounded-md hover:bg-brand hover:text-white flex items-center justify-center transition"
          >
            <Icon name="minus" size={12} />
          </button>
          <span className="font-extrabold text-[13.5px] px-2.5">{qty}</span>
          <button
            onClick={() => onQty(product.id, 1)}
            className="w-7 h-7 rounded-md hover:bg-brand hover:text-white flex items-center justify-center transition"
          >
            <Icon name="plus" size={12} />
          </button>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-black text-[15px]">{fmt(fp * qty)}</div>
        <button
          onClick={() => onRemove(product.id)}
          className="text-[11.5px] text-bad font-extrabold mt-2 hover:underline"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

