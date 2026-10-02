import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { finalPrice } from '../lib/format';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tm_cart') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('tm_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, qty = 1) => {
    setCart((c) => {
      const existing = c[product.id];
      return {
        ...c,
        [product.id]: existing
          ? { ...existing, qty: existing.qty + qty }
          : { product, qty },
      };
    });
  };

  const changeQty = (id, delta) => {
    setCart((c) => {
      const item = c[id];
      if (!item) return c;
      const next = item.qty + delta;
      if (next <= 0) {
        const { [id]: _, ...rest } = c;
        return rest;
      }
      if (next > (item.product.stock_count || 0)) return c;
      return { ...c, [id]: { ...item, qty: next } };
    });
  };

  const removeFromCart = (id) => {
    setCart((c) => {
      const { [id]: _, ...rest } = c;
      return rest;
    });
  };

  const clearCart = () => setCart({});

  const items = useMemo(() => Object.values(cart), [cart]);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + finalPrice(i.product) * i.qty, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        count,
        subtotal,
        addToCart,
        changeQty,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);