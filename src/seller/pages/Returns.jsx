import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { useToast } from '../../contexts/ToastContext';
import { fmt } from '../../lib/format';
import Icon from '../../components/ui/Icon';

export default function Returns() {
  const { user, isAdmin } = useSeller();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      let q = supabase.from('return_requests').select('*').order('created_at', { ascending: false });
      if (!isAdmin) q = q.eq('seller_id', user.id);
      const { data } = await q;
      setItems(data || []);
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, isAdmin]);

  const update = async (id, status) => {
    const { error } = await supabase.from('return_requests').update({ status }).eq('id', id);
    if (error) return toast(error.message, 'err');
    toast(`Return ${status}`, 'ok');
    load();
  };

  return (
    <div className="glass-tile-flat rounded-2xl overflow-hidden">
      <div className="relative z-10 px-5 py-4 border-b border-line/60 flex justify-between items-center">
        <div>
          <h3 className="font-black text-[15px]">Return Requests</h3>
          <p className="text-[11.5px] text-muted font-semibold mt-0.5">
            {loading ? 'Loading...' : `${items.length} request${items.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <button onClick={load} className="btn-ghost text-xs py-2.5 px-3.5">Refresh</button>
      </div>

      <div className="relative z-10">
        {loading ? (
          <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-surface-2/60 animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-light text-brand flex items-center justify-center mx-auto mb-3">
              <Icon name="rotate" size={22} />
            </div>
            <div className="text-[13.5px] font-extrabold text-ink mb-1">No return requests</div>
            <div className="text-[12px] text-muted">Returns will appear here.</div>
          </div>
        ) : (
          items.map((r) => (
            <div key={r.id} className="flex items-start gap-3.5 px-5 py-3.5 border-t border-line/30">
              <span className="w-10 h-10 rounded-xl bg-warn/15 text-warn flex items-center justify-center shrink-0">
                <Icon name="rotate" size={17} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-mono font-extrabold text-brand">
                  #{r.order_id?.split('-')[0].toUpperCase() || '—'}
                </div>
                <div className="text-[12px] text-ink-2 font-medium mt-0.5">{r.reason || 'No reason'}</div>
                <div className="text-[11px] text-muted font-semibold mt-1">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''} · {fmt(r.amount)}
                </div>
              </div>
              <div className="shrink-0">
                {r.status === 'pending' && isAdmin ? (
                  <div className="flex gap-1.5">
                    <button onClick={() => update(r.id, 'approved')} className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg bg-ok/15 text-ok hover:bg-ok/25">
                      Approve
                    </button>
                    <button onClick={() => update(r.id, 'rejected')} className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg bg-bad/15 text-bad hover:bg-bad/25">
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase ${
                    r.status === 'approved' ? 'bg-ok/15 text-ok'
                    : r.status === 'rejected' ? 'bg-bad/15 text-bad'
                    : 'bg-warn/15 text-warn'
                  }`}>{r.status}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

