import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { fmt, calcPayout } from '../../lib/format';
import Icon from '../../components/ui/Icon';

function MiniChart({ data = [], height = 60 }) {
  if (!data.length) return <div className="h-[60px] rounded-lg bg-surface-2/40" />;
  const max = Math.max(...data.map((d) => d.v), 1);
  const w = 100; // percentage width units
  const step = w / (data.length - 1 || 1);
  const pts = data.map((d, i) => `${i * step},${height - (d.v / max) * height}`);
  const path = 'M' + pts.join(' L');
  const areaPath = `${path} L${w},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full h-[60px]">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0047FF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0047FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#chartFill)" />
      <path d={path} stroke="#0047FF" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useSeller();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    netRevenue: 0, orders: 0, pending: 0, products: 0, activeProducts: 0, lowStock: 0,
    adminSellers: 0, adminOrdersToday: 0, adminOrdersTodayAmount: 0, adminProducts: 0,
    adminPendingPayments: 0, adminVisitorsToday: 0,
  });
  const [recent, setRecent] = useState([]);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        let pq = supabase.from('products').select('id,stock_count,status');
        let oq = supabase.from('orders').select('id,total_amount,status,created_at,seller_id,payment_method,payment_status,items_summary,order_number');
        if (!isAdmin) {
          pq = pq.eq('seller_id', user.id);
          oq = oq.eq('seller_id', user.id);
        }
        const [pRes, oRes] = await Promise.all([pq, oq]);
        const P = pRes.data || [];
        let O = oRes.data || [];
        if (!isAdmin) {
          O = O.filter((o) => !o.payment_method || o.payment_method === 'cod' || (o.payment_method === 'bank_transfer' && o.payment_status === 'verified'));
        }

        const netRevenue = O.filter((o) => o.status !== 'Cancelled').reduce((s, o) => s + calcPayout(o.total_amount).net, 0);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const adminOrdersToday = isAdmin ? O.filter((o) => new Date(o.created_at) >= todayStart) : [];
        const adminOrdersTodayAmount = adminOrdersToday.reduce((s, o) => s + Number(o.total_amount || 0), 0);

        let adminSellers = 0, adminProducts = 0, adminPendingPayments = 0, adminVisitorsToday = 0;
        if (isAdmin) {
          const sr = await supabase.from('sellers').select('id', { count: 'exact', head: true });
          adminSellers = sr.count || 0;
          const pr = await supabase.from('products').select('id', { count: 'exact', head: true });
          adminProducts = pr.count || 0;
          const payR = await supabase.from('orders').select('payment_status').eq('payment_method', 'bank_transfer');
          adminPendingPayments = (payR.data || []).filter((o) => !o.payment_status || o.payment_status === 'awaiting_verification').length;
          const views = await supabase.from('page_views').select('viewer_id').gte('created_at', todayStart.toISOString());
          adminVisitorsToday = new Set((views.data || []).map((v) => v.viewer_id)).size;
        }

        // Build 7-day revenue chart
        const days = [];
        for (let d = 6; d >= 0; d--) {
          const start = new Date();
          start.setDate(start.getDate() - d);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setHours(23, 59, 59, 999);
          const dayRevenue = O
            .filter((o) => o.status !== 'Cancelled' && new Date(o.created_at) >= start && new Date(o.created_at) <= end)
            .reduce((s, o) => s + Number(o.total_amount || 0), 0);
          days.push({ d: d, v: dayRevenue, label: start.toLocaleDateString('en-US', { weekday: 'short' }) });
        }

        if (!cancelled) {
          setStats({
            netRevenue, orders: O.length,
            pending: O.filter((o) => o.status === 'Un-processed').length,
            products: P.length,
            activeProducts: P.filter((p) => (p.status || 'active') === 'active').length,
            lowStock: P.filter((p) => (p.stock_count || 0) < 5 && (p.stock_count || 0) > 0).length,
            adminSellers, adminOrdersToday: adminOrdersToday.length, adminOrdersTodayAmount,
            adminProducts, adminPendingPayments, adminVisitorsToday,
          });
          setChart(days);
          setRecent(O.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, isAdmin]);

  const cards = isAdmin
    ? [
        { label: 'Sellers', value: stats.adminSellers, icon: 'users', tone: 'blue', to: '/seller/admin/sellers' },
        { label: 'Visitors', value: stats.adminVisitorsToday, icon: 'eye', tone: 'pink', to: '/seller' },
        { label: 'Orders', value: stats.adminOrdersToday, icon: 'package', tone: 'green', to: '/seller/orders' },
        { label: 'Products', value: stats.adminProducts, icon: 'tag', tone: 'yellow', to: '/seller/inventory' },
        { label: 'Pending', value: stats.adminPendingPayments, icon: 'creditCard', tone: 'purple', to: '/seller/payments' },
        { label: 'Revenue', value: fmt(stats.netRevenue), icon: 'wallet', tone: 'cyan', to: '/seller/wallet' },
      ]
    : [
        { label: 'Revenue', value: fmt(stats.netRevenue), icon: 'wallet', tone: 'blue', to: '/seller/wallet' },
        { label: 'Orders', value: stats.orders, icon: 'package', tone: 'green', to: '/seller/orders' },
        { label: 'Pending', value: stats.pending, icon: 'clock', tone: 'yellow', to: '/seller/orders' },
        { label: 'Products', value: stats.activeProducts, icon: 'tag', tone: 'purple', to: '/seller/inventory' },
        { label: 'Low Stock', value: stats.lowStock, icon: 'flame', tone: 'pink', to: '/seller/inventory' },
        { label: 'Net', value: fmt(stats.netRevenue), icon: 'creditCard', tone: 'cyan', to: '/seller/wallet' },
      ];

  const toneClass = {
    blue: 'bg-gradient-to-br from-[#EBF0FF] to-[#D6E1FF] text-[#0047FF]',
    green: 'bg-gradient-to-br from-[#E7F8F1] to-[#C7EEDC] text-[#10B981]',
    yellow: 'bg-gradient-to-br from-[#FFF8DB] to-[#FFEDB0] text-[#E6B800]',
    purple: 'bg-gradient-to-br from-[#F3E8FF] to-[#E4D0FF] text-[#7C3AED]',
    pink: 'bg-gradient-to-br from-[#FDF2F8] to-[#FBD5EA] text-[#DB2777]',
    cyan: 'bg-gradient-to-br from-[#ECFEFF] to-[#CFFAFE] text-[#0891B2]',
  };

  const statusCls = (s) =>
    s === 'Delivered' ? 'bg-ok/15 text-ok'
    : s === 'Dispatched' ? 'bg-brand-light text-brand'
    : s === 'Cancelled' ? 'bg-bad/15 text-bad'
    : 'bg-warn/15 text-warn';

  const quickActions = [
    { label: 'Add', icon: 'plus', to: '/seller/inventory' },
    { label: 'Bulk', icon: 'upload', to: '/seller/upload' },
    { label: 'Voucher', icon: 'ticket', to: '/seller/vouchers' },
    { label: 'Flash', icon: 'flame', to: '/seller/flash' },
  ];

  // Chart total
  const chartTotal = chart.reduce((s, d) => s + d.v, 0);

  return (
    <div className="space-y-3 min-w-0">
      {/* Stat grid — 3 cols on mobile, 6 on desktop */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => navigate(c.to)}
            className="glass-tile rounded-xl md:rounded-2xl p-2.5 md:p-4 text-left min-w-0"
          >
            <div className="relative z-10">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center mb-2 ${toneClass[c.tone]}`}>
                <Icon name={c.icon} size={14} />
              </div>
              <div className="text-[9px] md:text-[10px] uppercase tracking-wider font-extrabold text-muted mb-1 truncate">
                {c.label}
              </div>
              <div className="text-[14px] md:text-[19px] font-black leading-none truncate">
                {loading ? '—' : c.value}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Chart card */}
      <div className="glass-tile-flat rounded-2xl overflow-hidden min-w-0">
        <div className="relative z-10 px-4 md:px-5 py-3 md:py-4 border-b border-line/60 flex items-center justify-between">
          <div>
            <h3 className="font-black text-[13px] md:text-[15px]">Revenue · Last 7 Days</h3>
            <p className="text-[11px] md:text-[11.5px] text-muted font-semibold mt-0.5">
              {fmt(chartTotal)} total
            </p>
          </div>
          <span className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider bg-brand-light text-brand px-2 py-1 rounded-md">
            {isAdmin ? 'All sellers' : 'Your store'}
          </span>
        </div>
        <div className="relative z-10 px-4 md:px-5 py-4">
          <MiniChart data={chart} />
          <div className="flex justify-between mt-2.5">
            {chart.map((d, i) => (
              <div key={i} className="text-[9.5px] md:text-[10px] font-extrabold text-muted uppercase text-center flex-1">
                {d.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders — compact cards */}
      <div className="glass-tile-flat rounded-2xl overflow-hidden min-w-0">
        <div className="relative z-10 px-4 md:px-5 py-3 md:py-4 border-b border-line/60 flex justify-between items-center">
          <h3 className="font-black text-[13px] md:text-[15px]">Recent Orders</h3>
          <Link to="/seller/orders" className="text-brand text-[11.5px] font-extrabold hover:underline">
            View All
          </Link>
        </div>
        <div className="relative z-10 min-w-0">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-surface-2/60 animate-pulse" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-[12.5px] font-extrabold text-ink mb-1">No orders yet</div>
              <div className="text-[11px] text-muted">Orders will show up here.</div>
            </div>
          ) : (
            <>
              {/* Mobile compact rows */}
              <div className="md:hidden">
                {recent.map((o) => (
                  <Link
                    key={o.id}
                    to="/seller/orders"
                    className="flex items-center gap-2.5 px-4 py-2.5 border-b border-line/30 last:border-b-0 hover:bg-surface-2/40"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-brand font-extrabold text-[11.5px] truncate">
                        #{o.order_number || o.id.split('-')[0].toUpperCase()}
                      </div>
                      <div className="text-[11px] text-ink-2 font-semibold truncate">
                        {o.items_summary || '—'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[12.5px] font-black">{fmt(o.total_amount)}</div>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${statusCls(o.status)}`}>
                        {o.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-2/60 text-[10.5px] uppercase text-muted font-extrabold tracking-wider">
                    <tr>
                      <th className="p-3 text-left">Order</th>
                      <th className="p-3 text-left">Items</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((o) => (
                      <tr key={o.id} className="border-t border-line/30 hover:bg-surface-2/40">
                        <td className="p-3">
                          <span className="font-mono text-brand font-extrabold text-[12.5px]">
                            #{o.order_number || o.id.split('-')[0].toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-[12px] text-ink-2 font-semibold max-w-[280px] truncate">
                          {o.items_summary || '—'}
                        </td>
                        <td className="p-3 font-extrabold text-[13px]">{fmt(o.total_amount)}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase ${statusCls(o.status)}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick actions — 4 cols on mobile */}
      <div className="glass-tile-flat rounded-2xl overflow-hidden">
        <div className="relative z-10 px-4 md:px-5 py-3 md:py-4 border-b border-line/60">
          <h3 className="font-black text-[13px] md:text-[15px]">Quick Actions</h3>
        </div>
        <div className="relative z-10 p-2.5 md:p-4 grid grid-cols-4 gap-2">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl border border-line bg-surface/50 hover:bg-brand-light hover:border-brand-lighter hover:text-brand transition-all font-extrabold text-[11px] text-ink-2 text-center min-w-0"
            >
              <Icon name={a.icon} size={15} />
              <span className="truncate w-full">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
