import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';

export default function Tickets() {
  const { isAdmin } = useSeller();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      setTickets(data || []);
    } catch (e) { toast(e.message, 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line */ }, [isAdmin]);

  const openInChat = (t) => {
    // Find matching support conversation by customer email
    // We just go to the support tab — admin will pick the right conversation
    navigate('/seller/messages?tab=support');
  };

  if (!isAdmin) {
    return (
      <div className="glass-tile rounded-2xl p-10 text-center text-muted text-[13px]">
        Admins only
      </div>
    );
  }

  const statusCls = (s) =>
    s === 'open' ? 'bg-warn/15 text-warn'
    : s === 'resolved' ? 'bg-ok/15 text-ok'
    : 'bg-brand-light text-brand';

  return (
    <div className="space-y-5">
      <div className="glass-tile-flat rounded-2xl overflow-hidden">
        <div className="relative z-10 px-5 py-4 border-b border-line/60 flex justify-between items-center">
          <div>
            <h3 className="font-black text-[15px]">Support Tickets</h3>
            <p className="text-[11.5px] text-muted font-semibold mt-0.5">
              {loading ? 'Loading...' : `${tickets.length} ticket${tickets.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="btn-glass">Refresh</button>
            <button onClick={() => navigate('/seller/messages?tab=support')} className="btn-glass-brand">
              <Icon name="headphone" size={13} />
              Open Support Inbox
            </button>
          </div>
        </div>

        <div className="relative z-10">
          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-surface-2/60 animate-pulse" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-light text-brand flex items-center justify-center mx-auto mb-3">
                <Icon name="headphone" size={22} />
              </div>
              <div className="text-[13.5px] font-extrabold text-ink mb-1">No support tickets</div>
              <div className="text-[12px] text-muted">Customer support requests appear here.</div>
            </div>
          ) : (
            tickets.map((t) => (
              <div key={t.id} className="flex items-center gap-3.5 px-5 py-3.5 border-t border-line/30 hover:bg-surface-2/40">
                <span className="w-10 h-10 rounded-xl bg-accent/20 text-accent-dark flex items-center justify-center shrink-0">
                  <Icon name="headphone" size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-extrabold text-ink truncate">{t.subject}</div>
                  <div className="text-[11.5px] text-muted font-medium truncate">
                    {t.customer_name ? `${t.customer_name} · ` : ''}
                    {t.customer_email || t.customer_phone || 'Anonymous'}
                  </div>
                  {t.message && (
                    <div className="text-[11.5px] text-ink-2 font-medium truncate mt-0.5">
                      {t.message.slice(0, 90)}
                    </div>
                  )}
                  <div className="text-[10.5px] text-muted font-semibold mt-0.5">
                    {t.created_at ? new Date(t.created_at).toLocaleString() : ''}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => openInChat(t)} className="btn-glass-brand">
                    <Icon name="message" size={12} />
                    Reply
                  </button>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase self-center ${statusCls(t.status)}`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

