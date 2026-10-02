import { createContext, useContext, useEffect, useState } from 'react';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tm_wish') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('tm_wish', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWish = (id) => {
    setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  };

  const isWished = (id) => wishlist.includes(id);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWish, isWished }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);