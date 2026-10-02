import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { fmt } from '../lib/format';
import Icon from '../components/ui/Icon';
import Reveal from '../components/ui/Reveal';

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .or(`customer_id.eq.${user.id},guest_email.eq.${user.email}`)
          .order('created_at', { ascending: false });
        if (!cancelled) setOrders(data || []);
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-[560px] mx-auto px-[5%] py-16">
        <Reveal direction="zoom">
          <div className="glass-tile rounded-3xl p-10 text-center">
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-4">
                <Icon name="package" size={28} />
              </div>
              <h1 className="text-xl font-black mb-2">Sign in to see orders</h1>
              <p className="text-[13px] text-muted mb-5">Sign in or track as guest.</p>
              <button
                onClick={() => document.dispatchEvent(new Event('open-auth'))}
                className="btn-primary w-full mb-2.5"
              >
                Sign In
              </button>
              <button
                onClick={() => document.dispatchEvent(new Event('open-track'))}
                className="btn-ghost w-full"
              >
                Track Order as Guest
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <button onClick={() => navigate('/account')} className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </button>
          <div>
            <h1 className="text-[22px] md:text-[26px] font-black">My Orders</h1>
            <p className="text-[12.5px] text-muted font-semibold">
              {loading ? 'Loading...' : `${orders.length} order${orders.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
      </Reveal>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-tile rounded-2xl h-[120px] animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Reveal direction="zoom">
          <div className="glass-tile rounded-3xl p-12 text-center">
            <div className="relative z-10">
              <div className="text-5xl mb-3">-</div>
              <h2 className="text-lg font-black mb-2">No orders yet</h2>
              <p className="text-[13px] text-muted mb-5">Start shopping to see your orders.</p>
              <Link to="/shop" className="btn-primary inline-flex">
                Browse Products
              </Link>
            </div>
          </div>
        </Reveal>
      ) : (
        <div className="space-y-3">
          {orders.map((o, i) => (
            <Reveal key={o.id} direction="up" delay={i * 40}>
              <div className="glass-tile rounded-2xl p-5">
                <div className="relative z-10">
                  <div className="flex justify-between items-start gap-3 mb-3 flex-wrap">
                    <div>
                      <div className="text-[13px] font-mono font-black text-brand">
                        #{o.order_number || o.id.split('-')[0].toUpperCase()}
                      </div>
                      <div className="text-[11.5px] text-muted font-semibold">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        }) : ''}
                      </div>
                    </div>
                    <span
                      className={`text-[10.5px] font-extrabold uppercase px-3 py-1 rounded-full ${
                        o.status === 'Delivered' ? 'bg-ok/15 text-ok'
                        : o.status === 'Dispatched' ? 'bg-brand-light text-brand'
                        : o.status === 'Cancelled' ? 'bg-bad/15 text-bad'
                        : 'bg-warn/15 text-warn'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>

                  <div className="text-[12.5px] text-ink-2 font-medium leading-snug mb-3.5">
                    {o.items_summary || '-'}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-line/60">
                    <div>
                      <div className="text-[10.5px] text-muted uppercase font-extrabold tracking-wider">
                        Total
                      </div>
                      <div className="text-[16px] font-black text-ink">{fmt(o.total_amount)}</div>
                    </div>
                    <button
                      onClick={() => document.dispatchEvent(new Event('open-track'))}
                      className="btn-ghost text-xs py-2.5 px-4"
                    >
                      Track Order
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
