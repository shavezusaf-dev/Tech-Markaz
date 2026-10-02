import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { fmt, calcPayout } from '../../lib/format';
import Icon from '../../components/ui/Icon';

export default function Dashboard() {
  const { user, isAdmin } = useSeller();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    netRevenue: 0,
    orders: 0,
    pending: 0,
    products: 0,
    activeProducts: 0,
    lowStock: 0,
    adminSellers: 0,
    adminOrdersToday: 0,
    adminOrdersTodayAmount: 0,
    adminProducts: 0,
    adminPendingPayments: 0,
    adminVisitorsToday: 0,
  });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        let pq = supabase.from('products').select('id,stock_count,status');
        let oq = supabase.from('orders').select('id,total_amount,status,created_at,seller_id,payment_method,payment_status');
        if (!isAdmin) {
          pq = pq.eq('seller_id', user.id);
          oq = oq.eq('seller_id', user.id);
        }
        const [pRes, oRes] = await Promise.all([pq, oq]);
        const P = pRes.data || [];
        let O = oRes.data || [];

        if (!isAdmin) {
          O = O.filter((o) =>
            !o.payment_method ||
            o.payment_method === 'cod' ||
            (o.payment_method === 'bank_transfer' && o.payment_status === 'verified')
          );
        }

        // Net revenue — only delivered/non-cancelled orders, after fees
        const netRevenue = O
          .filter((o) => o.status !== 'Cancelled')
          .reduce((s, o) => s + calcPayout(o.total_amount).net, 0);

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
          adminPendingPayments = (payR.data || []).filter(
            (o) => !o.payment_status || o.payment_status === 'awaiting_verification'
          ).length;

          // Unique visitors today
          const views = await supabase
            .from('page_views')
            .select('viewer_id')
            .gte('created_at', todayStart.toISOString());
          adminVisitorsToday = new Set((views.data || []).map((v) => v.viewer_id)).size;
        }

        if (!cancelled) {
          setStats({
            netRevenue,
            orders: O.length,
            pending: O.filter((o) => o.status === 'Un-processed').length,
            products: P.length,
            activeProducts: P.filter((p) => (p.status || 'active') === 'active').length,
            lowStock: P.filter((p) => (p.stock_count || 0) < 5 && (p.stock_count || 0) > 0).length,
            adminSellers,
            adminOrdersToday: adminOrdersToday.length,
            adminOrdersTodayAmount,
            adminProducts,
            adminPendingPayments,
            adminVisitorsToday,
          });
          setRecent(
            O.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, isAdmin]);

  // ─── Stat cards (admin uses platform-wide, seller uses own) ───
  const cards = isAdmin
    ? [
        { label: 'Sellers', value: stats.adminSellers, sub: 'total registered', icon: 'users', tone: 'blue', to: '/seller/admin/sellers' },
        { label: 'Orders Today', value: stats.adminOrdersToday, sub: fmt(stats.adminOrdersTodayAmount), icon: 'package', tone: 'green', to: '/seller/orders' },
        { label: 'Total Products', value: stats.adminProducts, sub: 'across all sellers', icon: 'tag', tone: 'yellow', to: '/seller/inventory' },
        { label: 'Visitors Today', value: stats.adminVisitorsToday, sub: 'unique visitors', icon: 'eye', tone: 'pink', to: '/seller' },
        { label: 'Pending Payments', value: stats.adminPendingPayments, sub: 'awaiting verification', icon: 'creditCard', tone: 'purple', to: '/seller/payments' },
        { label: 'Net Revenue', value: fmt(stats.netRevenue), sub: 'after fees & tax', icon: 'wallet', tone: 'pink', to: '/seller/wallet' },
      ]
    : [
        { label: 'Net Revenue', value: fmt(stats.netRevenue), sub: 'after fees & tax', icon: 'wallet', tone: 'blue', to: '/seller/wallet' },
        { label: 'Orders', value: stats.orders, sub: `${stats.pending} pending`, icon: 'package', tone: 'green', to: '/seller/orders' },
        { label: 'Products', value: stats.activeProducts, sub: `${stats.products} total`, icon: 'tag', tone: 'yellow', to: '/seller/inventory' },
        { label: 'Low Stock', value: stats.lowStock, sub: 'Restock soon', icon: 'flame', tone: 'purple', to: '/seller/inventory' },
      ];

  const toneClass = {
    blue: 'bg-gradient-to-br from-[#EBF0FF] to-[#D6E1FF] text-[#0047FF]',
    green: 'bg-gradient-to-br from-[#E7F8F1] to-[#C7EEDC] text-[#10B981]',
    yellow: 'bg-gradient-to-br from-[#FFF8DB] to-[#FFEDB0] text-[#E6B800]',
    purple: 'bg-gradient-to-br from-[#F3E8FF] to-[#E4D0FF] text-[#7C3AED]',
    pink: 'bg-gradient-to-br from-[#FDF2F8] to-[#FBD5EA] text-[#DB2777]',
  };

  const quickActions = [
    { label: '+ Add Product', icon: 'plus', to: '/seller/inventory' },
    { label: 'Bulk Import', icon: 'upload', to: '/seller/upload' },
    { label: 'New Voucher', icon: 'ticket', to: '/seller/vouchers' },
    { label: 'New Flash Sale', icon: 'flame', to: '/seller/flash' },
  ];

  return (
    <div className="space-y-5">
      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => navigate(c.to)}
            className="glass-tile rounded-2xl p-5 text-left hover:!translate-y-[-4px] transition-transform"
          >
            <div className="relative z-10">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${toneClass[c.tone]}`}>
                <Icon name={c.icon} size={20} />
              </div>
              <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1.5">
                {c.label}
              </div>
              <div className="text-[22px] md:text-[24px] font-black leading-none mb-1.5">
                {loading ? '—' : c.value}
              </div>
              <div className="text-[11px] text-muted font-semibold">{c.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Recent orders */}
      <div className="glass-tile-flat rounded-2xl overflow-hidden">
        <div className="relative z-10 px-5 py-4 border-b border-line/60 flex justify-between items-center">
          <h3 className="font-black text-[15px]">Recent Orders</h3>
          <Link to="/seller/orders" className="text-brand text-[12.5px] font-extrabold hover:underline">
            View All
          </Link>
        </div>
        <div className="relative z-10">
          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-surface-2/60 animate-pulse" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-[13.5px] font-extrabold text-ink mb-1">No orders yet</div>
              <div className="text-[12px] text-muted">Orders will show up here as customers buy.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase ${
                          o.status === 'Delivered' ? 'bg-ok/15 text-ok'
                          : o.status === 'Dispatched' ? 'bg-brand-light text-brand'
                          : o.status === 'Cancelled' ? 'bg-bad/15 text-bad'
                          : 'bg-warn/15 text-warn'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="glass-tile-flat rounded-2xl overflow-hidden">
        <div className="relative z-10 px-5 py-4 border-b border-line/60">
          <h3 className="font-black text-[15px]">Quick Actions</h3>
        </div>
        <div className="relative z-10 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-line bg-surface/50 hover:bg-brand-light hover:border-brand-lighter hover:text-brand transition-all font-extrabold text-[12.5px] text-ink-2"
            >
              <Icon name={a.icon} size={14} />
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


