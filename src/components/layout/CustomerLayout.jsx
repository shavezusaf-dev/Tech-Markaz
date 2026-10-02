import { Outlet } from 'react-router-dom';
import Header from './Header';
import NavBar from './NavBar';
import Footer from './Footer';
import BottomNav from './BottomNav';
import MobileDrawer from './MobileDrawer';
import AnnouncementBar from './AnnouncementBar';
import CartDrawer from '../cart/CartDrawer';
import AuthModal from '../modals/AuthModal';
import CheckoutModal from '../modals/CheckoutModal';
import TrackOrderModal from '../modals/TrackOrderModal';
import SuccessModal from '../modals/SuccessModal';
import ChatModal from '../modals/ChatModal';
import SupportBubble from '../ui/SupportBubble';
import InstallPrompt from '../ui/InstallPrompt';
import PageViewTracker from '../ui/PageViewTracker';

export default function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <NavBar />
      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <MobileDrawer />
      <CartDrawer />
      <AuthModal />
      <CheckoutModal />
      <TrackOrderModal />
      <SuccessModal />
      <ChatModal />
      <SupportBubble />`n      <InstallPrompt />`n      <PageViewTracker />
    </div>
  );
}


