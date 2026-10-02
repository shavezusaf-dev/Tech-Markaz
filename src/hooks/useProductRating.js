import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Returns a stable rating for a product.
 * Priority:
 *   1. Average of real reviews in the `reviews` table
 *   2. product.rating field (from DB)
 *   3. A stable pseudo-random number derived from the product id (looks realistic)
 */
export function useProductRating(productId, productRatingFromDb) {
  const [rating, setRating] = useState(() => {
    if (productRatingFromDb) return parseFloat(productRatingFromDb);
    if (!productId) return 4.5;
    // Stable fallback derived from ID so it never changes across renders
    let h = 0;
    for (let i = 0; i < productId.length; i++) {
      h = (h * 31 + productId.charCodeAt(i)) >>> 0;
    }
    return Math.round((4.1 + ((h % 90) / 100)) * 10) / 10; // 4.1 – 5.0
  });
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('rating')
          .eq('product_id', productId);

        if (error || !data) return;

        if (!cancelled && data.length > 0) {
          const avg = data.reduce((s, r) => s + (parseFloat(r.rating) || 0), 0) / data.length;
          setRating(Math.round(avg * 10) / 10);
          setReviewCount(data.length);
        }
      } catch {}
    })();

    return () => { cancelled = true; };
  }, [productId]);

  return { rating, reviewCount };
}
