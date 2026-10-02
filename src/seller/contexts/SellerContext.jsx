import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ADMIN_EMAIL } from '../../lib/constants';

const SellerContext = createContext();

export function SellerProvider({ children }) {
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const safety = setTimeout(() => { if (!cancelled) setLoading(false); }, 3000);

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (!session) {
          if (!cancelled) setLoading(false);
          return;
        }
        const u = session.user;
        const emailLower = (u.email || '').toLowerCase();
        const isAdminUser = emailLower === ADMIN_EMAIL.toLowerCase();

        if (isAdminUser) {
          try {
            await supabase.from('sellers').upsert(
              { id: u.id, full_name: 'Administrator', store_name: 'Tech Markaz', status: 'active', email: u.email },
              { onConflict: 'id' }
            );
          } catch {}
        }

        const { data: sellerRow } = await supabase
          .from('sellers')
          .select('*')
          .eq('id', u.id)
          .maybeSingle();

        if (!cancelled) {
          if (isAdminUser) {
            setUser(u);
            setSeller(sellerRow || { id: u.id, full_name: 'Administrator', store_name: 'Tech Markaz' });
          } else if (sellerRow && sellerRow.status !== 'suspended') {
            setUser(u);
            setSeller(sellerRow);
          } else {
            // Logged in but not a seller — sign out
            console.warn('[seller] no active seller profile');
            try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('SellerContext init error:', err);
        if (!cancelled) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSeller(null);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(safety);
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch {}
    setUser(null);
    setSeller(null);
    window.location.href = '/seller';
  };

  return (
    <SellerContext.Provider value={{ user, seller, loading, isSeller: !!user, isAdmin, signOut }}>
      {children}
    </SellerContext.Provider>
  );
}

export const useSeller = () => useContext(SellerContext);
