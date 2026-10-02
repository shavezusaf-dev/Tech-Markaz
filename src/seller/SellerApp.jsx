import { Routes, Route, Navigate } from 'react-router-dom';
import { SellerProvider, useSeller } from './contexts/SellerContext';
import SellerAuth from './SellerAuth';
import SellerLayout from './SellerLayout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Messages from './pages/Messages';
import Payments from './pages/Payments';
import Returns from './pages/Returns';
import Inventory from './pages/Inventory';
import BulkUpload from './pages/BulkUpload';
import Flash from './pages/Flash';
import Vouchers from './pages/Vouchers';
import Pickups from './pages/Pickups';
import Reviews from './pages/Reviews';
import Tickets from './pages/Tickets';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Sellers from './pages/admin/Sellers';
import Customers from './pages/admin/Customers';
import Announcements from './pages/admin/Announcements';
import Banners from './pages/admin/Banners';
import HomeContent from './pages/content/HomeContent';

export default function SellerApp() {
  return (
    <SellerProvider>
      <SellerRoutes />
    </SellerProvider>
  );
}

function SellerRoutes() {
  const { user, loading } = useSeller();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <SellerAuth />;

  return (
    <Routes>
      <Route element={<SellerLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="messages" element={<Messages />} />
        <Route path="payments" element={<Payments />} />
        <Route path="returns" element={<Returns />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="upload" element={<BulkUpload />} />
        <Route path="flash" element={<Flash />} />
        <Route path="vouchers" element={<Vouchers />} />
        <Route path="pickups" element={<Pickups />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin/sellers" element={<Sellers />} />
        <Route path="admin/customers" element={<Customers />} />
        <Route path="admin/announcements" element={<Announcements />} />
        <Route path="admin/banners" element={<Banners />} />`n        <Route path="content" element={<HomeContent />} />
        <Route path="*" element={<Navigate to="/seller" replace />} />
      </Route>
    </Routes>
  );
}

