import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';

export default function Reviews() {
  const { user, isAdmin } = useSeller();
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      // Get seller's product ids, then reviews for those
      let pq = supabase.from('products').select('id,title');
      if (!isAdmin) pq = pq.eq('seller_id', user.id);
      const { data: prods } = await pq;
      const pids = (prods || []).map((p) => p.id);
      const pMap = Object.fromEntries((prods || []).map((p) => [p.id, p.title]));

      if (pids.length === 0) { setReviews([]); return; }
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .in('product_id', pids)
        .order('created_at', { ascending: false })
        .limit(100);
      setReviews((data || []).map((r) => ({ ...r, product_title: pMap[r.product_id] || '—' })));
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, isAdmin]);

  const stars = (n) => {
    n = Math.max(0, Math.min(5, parseInt(n) || 0));
    return Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} viewBox="0 0 24 24" width={12} height={12} fill={i < n ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ));
  };

  return (
    <div className="glass-tile-flat rounded-2xl overflow-hidden">
      <div className="relative z-10 px-5 py-4 border-b border-line/60 flex justify-between items-center">
        <div>
          <h3 className="font-black text-[15px]">Reviews</h3>
          <p className="text-[11.5px] text-muted font-semibold mt-0.5">
            {loading ? 'Loading...' : `${reviews.length} review${reviews.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <button onClick={load} className="btn-ghost text-xs py-2.5 px-3.5">Refresh</button>
      </div>

      <div className="relative z-10">
        {loading ? (
          <div className="p-4 space-y-2">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-surface-2/60 animate-pulse" />)}</div>
        ) : reviews.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-light text-brand flex items-center justify-center mx-auto mb-3">
              <Icon name="star" size={22} />
            </div>
            <div className="text-[13.5px] font-extrabold text-ink mb-1">No reviews yet</div>
            <div className="text-[12px] text-muted">Customer reviews will appear here.</div>
          </div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="px-5 py-4 border-t border-line/30">
              <div className="flex justify-between items-start gap-3 mb-1.5 flex-wrap">
                <div className="text-[12.5px] font-extrabold text-ink">{r.product_title}</div>
                <div className="flex gap-0.5 text-[#F59E0B]">{stars(r.rating)}</div>
              </div>
              <div className="text-[12.5px] text-ink-2 font-medium">{r.comment || '(no comment)'}</div>
              <div className="text-[10.5px] text-muted font-semibold mt-1.5">
                {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

