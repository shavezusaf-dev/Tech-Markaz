import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../ui/Icon';
import RatingStars from './RatingStars';

export default function ReviewsSection({ productId, fallbackRating = 4.5 }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(50);
      setReviews(data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const submit = async () => {
    if (!user) {
      toast('Please sign in to leave a review', 'warn');
      document.dispatchEvent(new Event('open-auth'));
      return;
    }
    if (!form.comment.trim()) return toast('Please write a comment', 'warn');
    setBusy(true);
    try {
      const { error } = await supabase.from('reviews').insert([{
        product_id: productId,
        customer_id: user.id,
        customer_name: user.email.split('@')[0],
        rating: form.rating,
        comment: form.comment.trim(),
      }]);
      if (error) throw error;
      toast('Thanks for your review!', 'ok');
      setForm({ rating: 5, comment: '' });
      setShowForm(false);
      load();
    } catch (e) {
      toast(e.message || 'Failed to submit', 'err');
    } finally {
      setBusy(false);
    }
  };

  const count = reviews.length;
  const avg = count
    ? reviews.reduce((s, r) => s + (parseFloat(r.rating) || 0), 0) / count
    : parseFloat(fallbackRating) || 4.5;

  const breakdown = [5, 4, 3, 2, 1].map((star) => {
    const c = reviews.filter((r) => Math.round(parseFloat(r.rating) || 0) === star).length;
    return { star, count: c, pct: count ? (c / count) * 100 : 0 };
  });

  return (
    <div className="glass-tile-flat rounded-2xl p-6">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-[15px] font-black flex items-center gap-2.5">
            <span className="w-[4px] h-[16px] bg-gradient-to-b from-brand to-accent rounded-full" />
            Reviews & Ratings
          </h2>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-xs py-2 px-3.5">
              <Icon name="star" size={12} color="white" strokeWidth={2.6} />
              Write a Review
            </button>
          )}
        </div>

        {/* Write form */}
        {showForm && (
          <div className="rounded-2xl bg-brand-light/40 border border-brand-lighter p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] font-black">Your Review</div>
              <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-lg hover:bg-bad/10 hover:text-bad text-muted flex items-center justify-center">
                <Icon name="x" size={13} />
              </button>
            </div>
            <div className="mb-3">
              <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1.5">Your Rating</div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setForm((f) => ({ ...f, rating: i }))}
                    className="transition-transform hover:scale-110"
                  >
                    <svg viewBox="0 0 24 24" width={26} height={26} fill={i <= form.rating ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth={1.8}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1.5">Comment</div>
              <textarea
                rows={3}
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="Share your experience with this product..."
                className="form-input mb-0 resize-vertical font-[inherit]"
              />
            </div>
            <button onClick={submit} disabled={busy} className="btn-primary w-full">
              {busy ? 'Submitting...' : 'Submit Review'}
              {!busy && <Icon name="arrowRight" size={14} color="white" strokeWidth={2.6} />}
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 pb-5 mb-5 border-b border-line/60">
          <div className="text-center md:border-r border-line/60 md:pr-6">
            <div className="text-[46px] font-black text-brand leading-none tracking-tight">
              {avg.toFixed(1)}
            </div>
            <div className="mt-2 flex justify-center">
              <RatingStars value={avg} size={16} showNumber={false} />
            </div>
            <div className="text-[11.5px] text-muted font-semibold mt-2">
              {count} review{count === 1 ? '' : 's'}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-2">
            {breakdown.map((b) => (
              <div key={b.star} className="flex items-center gap-2.5">
                <span className="text-[11.5px] font-extrabold text-muted w-6 text-right">{b.star}★</span>
                <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-accent to-[#F59E0B] rounded-full transition-all duration-500" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="text-[11.5px] font-bold text-ink-2 w-8">{b.count}</span>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="bg-surface-2 rounded-xl h-20 animate-pulse" />)}</div>
        ) : count === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">💬</div>
            <div className="font-extrabold text-ink mb-1">No reviews yet</div>
            <div className="text-[12.5px] text-muted">Be the first to review this product.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.slice(0, 5).map((r) => {
              const name = r.customer_name || 'Verified Buyer';
              const initial = name.charAt(0).toUpperCase();
              const when = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
              return (
                <div key={r.id} className="bg-surface-2/60 border border-line/60 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-dark text-white flex items-center justify-center font-extrabold text-[13px] shrink-0">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-extrabold text-ink truncate">{name}</div>
                      <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                        <RatingStars value={r.rating || 5} size={11} showNumber={false} />
                        <span className="text-[11px] text-muted font-medium">{when}</span>
                      </div>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-[13px] leading-relaxed text-ink-2 font-medium pl-12 whitespace-pre-line">{r.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
