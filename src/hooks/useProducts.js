import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { isRealSellerId } from '../lib/format';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!cancelled) {
          const clean = (data || []).filter(
            (p) => isRealSellerId(p.seller_id) || p.seller_id === null
          );
          setProducts(clean);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading };
}
