import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useSeller } from './contexts/SellerContext';
import { useBadgeCounts } from './hooks/useBadgeCounts';
import Brand from '../components/ui/Brand';
import Icon from '../components/ui/Icon';
import { useTheme } from '../contexts/ThemeContext';
import SellerInstallPrompt from './components/SellerInstallPrompt';

const NAV_ITEMS = [
  { section: 'Overview' },
  { to: '/seller', label: 'Dashboard', icon: 'grid', end: true },
  { section: 'Commerce' },
  { to: '/seller/orders', label: 'Orders', icon: 'package', badge: 'orders' },
  { to: '/seller/messages', label: 'Messages', icon: 'message', badge: 'messages' },
  { to: '/seller/payments', label: 'Payment Verify', icon: 'creditCard', badge: 'payments', adminOnly: true },
  { to: '/seller/returns', label: 'Returns', icon: 'rotate' },
  { to: '/seller/inventory', label: 'Products', icon: 'tag' },
  { to: '/seller/upload', label: 'Bulk Upload', icon: 'upload' },
  { to: '/seller/flash', label: 'Flash Sales', icon: 'flame' },
  { section: 'Logistics' },
  { to: '/seller/pickups', label: 'Drop-off Locations', icon: 'mapPin' },
  { section: 'Customers' },
  { to: '/seller/reviews', label: 'Reviews', icon: 'star' },
  { to: '/seller/tickets', label: 'Support', icon: 'ticket' },
  { section: 'Store' },
  { to: '/seller/wallet', label: 'Wallet', icon: 'wallet' },
  { to: '/seller/profile', label: 'Store Profile', icon: 'store' },
  { to: '/seller/settings', label: 'Settings', icon: 'settings' },
  { section: 'Admin', adminOnly: true },
  { to: '/seller/content', label: 'Homepage Content', icon: 'image', adminOnly: true },
  { to: '/seller/admin/sellers', label: 'All Sellers', icon: 'users', adminOnly: true },
  { to: '/seller/admin/customers', label: 'Customers', icon: 'user', adminOnly: true },
  { to: '/seller/admin/announcements', label: 'Announcements', icon: 'megaphone', adminOnly: true },
  { to: '/seller/admin/banners', label: 'Banners', icon: 'image', adminOnly: true },
];

const TITLES = {
  '/seller': 'Dashboard',
  '/seller/orders': 'Orders',
  '/seller/messages': 'Messages',
  '/seller/payments': 'Payment Verification',
  '/seller/returns': 'Returns',
  '/seller/inventory': 'Products',
  '/seller/upload': 'Bulk Upload',
  '/seller/flash': 'Flash Sales',
  '/seller/pickups': 'Drop-off Locations',
  '/seller/reviews': 'Reviews',
  '/seller/tickets': 'Support',
  '/seller/wallet': 'Wallet',
  '/seller/profile': 'Store Profile',
  '/seller/settings': 'Settings',
  '/seller/content': 'Homepage Content',
  '/seller/admin/sellers': 'All Sellers',
  '/seller/admin/customers': 'Customers',
  '/seller/admin/announcements': 'Announcements',
  '/seller/admin/banners': 'Banners',
};

export default function SellerLayout() {
  const { user, seller, isAdmin, signOut } = useSeller();
  const { dark, toggleDark } = useTheme();
  const badges = useBadgeCounts();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const storeName = seller?.store_name || seller?.full_name || user?.email?.split('@')[0] || 'Seller';
  const initial = storeName.charAt(0).toUpperCase();
  const title = TITLES[location.pathname] || 'Seller Panel';

  const SidebarContent = () => (
    <div className="relative z-10 flex flex-col h-full">
      <div className="p-5 border-b border-line/60">
        <Brand size="sm" link={false} />
        <div className="text-[9px] font-extrabold tracking-[1.2px] text-muted uppercase mt-2">
          {isAdmin ? 'Admin Mode' : 'Seller Center'}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2.5">
        {NAV_ITEMS.map((item, i) => {
          if (item.adminOnly && !isAdmin) return null;
          if (item.section) {
            return (
              <div
                key={`s-${i}`}
                className="text-[10px] font-extrabold text-ink-3 uppercase tracking-[1.2px] px-3 pt-4 pb-2"
              >
                {item.section}
              </div>
            );
          }
          const badgeCount =
            item.badge === 'orders' ? badges.orders
            : item.badge === 'payments' ? badges.payments
            : item.badge === 'messages' ? badges.messages
            : 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition mb-0.5 ${
                  isActive
                    ? 'bg-brand-light text-brand font-extrabold relative before:absolute before:left-0 before:top-1/5 before:bottom-1/5 before:w-[3px] before:bg-brand before:rounded-r'
                    : 'text-ink font-semibold hover:bg-brand-light hover:text-brand'
                }`
              }
            >
              <Icon name={item.icon} size={16} />
              <span className="flex-1">{item.label}</span>
              {badgeCount > 0 && (
                <span className="bg-bad text-white text-[10px] font-extrabold min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center">
                  {badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3.5 border-t border-line/60 bg-surface-2/50">
        <div className="flex items-center gap-2.5 mb-3">
          {seller?.store_logo_url ? (
            <img
              src={seller.store_logo_url}
              alt=""
              className="w-9 h-9 rounded-full object-cover border border-line shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-dark text-ink flex items-center justify-center font-extrabold text-[13px] shrink-0">
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-extrabold truncate">{storeName}</div>
            <div className="text-[10.5px] text-muted truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full py-2 text-[11px] font-extrabold rounded-lg border border-line bg-surface hover:border-bad hover:text-bad transition flex items-center justify-center gap-1.5"
        >
          <Icon name="logout" size={12} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden">
      <aside className="hidden md:flex flex-col w-[260px] bg-surface/95 dark:bg-[#0E1322]/95 backdrop-blur-xl rounded-none border-r border-line shrink-0">
        <SidebarContent />
      </aside>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[5000]">
          <div className="absolute inset-0 bg-[#050814]/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute top-0 left-0 bottom-0 w-[280px] max-w-[85vw] glass-tile-flat rounded-none flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="glass-tile-flat rounded-none border-b border-line/60 px-5 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden btn-glass w-9 h-9 p-0"
            >
              <Icon name="menu" size={16} />
            </button>
            <h2 className="text-[17px] font-black truncate">{title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={toggleDark} className="btn-glass w-9 h-9 p-0" title="Theme">
              <Icon name={dark ? 'sun' : 'moon'} size={15} />
            </button>
          </div>
        </div>

        <div className="seller-content flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6">
          <Outlet />
        </div>
      </main>
      <SellerInstallPrompt />
    </div>
  );
}





