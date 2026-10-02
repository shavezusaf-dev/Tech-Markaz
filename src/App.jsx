import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from './components/layout/CustomerLayout';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AccountPage from './pages/AccountPage';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';
import SettingsPage from './pages/SettingsPage';
import InfoPage from './pages/settings/InfoPage';
import AddressesPage from './pages/settings/AddressesPage';
import NotificationsPage from './pages/settings/NotificationsPage';
import LanguagePage from './pages/settings/LanguagePage';
import PasswordPage from './pages/settings/PasswordPage';
import AboutPage from './pages/settings/AboutPage';
import TermsPage from './pages/settings/TermsPage';
import ReturnsPage from './pages/settings/ReturnsPage';
import DeletePage from './pages/settings/DeletePage';
import PaymentsPage from './pages/settings/PaymentsPage';
import SecurityPage from './pages/settings/SecurityPage';
import PrivacyPage from './pages/settings/PrivacyPage';
import AppPage from './pages/settings/AppPage';
import SellerApp from './seller/SellerApp';
import SupportPage from './pages/SupportPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

export default function App() {
  return (
    <Routes>
      <Route path="/seller/*" element={<SellerApp />} />`n      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="product/:id" element={<ProductDetailPage />} />`n        <Route path="support" element={<SupportPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="account/orders" element={<OrdersPage />} />
        <Route path="account/wishlist" element={<WishlistPage />} />
        <Route path="account/settings" element={<SettingsPage />} />
        <Route path="account/settings/info" element={<InfoPage />} />
        <Route path="account/settings/addresses" element={<AddressesPage />} />
        <Route path="account/settings/notifications" element={<NotificationsPage />} />
        <Route path="account/settings/language" element={<LanguagePage />} />
        <Route path="account/settings/password" element={<PasswordPage />} />
        <Route path="account/settings/about" element={<AboutPage />} />
        <Route path="account/settings/terms" element={<TermsPage />} />
        <Route path="account/settings/returns" element={<ReturnsPage />} />
        <Route path="account/settings/payments" element={<PaymentsPage />} />`n        <Route path="account/settings/security" element={<SecurityPage />} />`n        <Route path="account/settings/privacy" element={<PrivacyPage />} />`n        <Route path="account/settings/app" element={<AppPage />} />`n        <Route path="account/settings/delete" element={<DeletePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}



