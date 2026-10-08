import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function AppManifest() {
  const { pathname } = useLocation();
  const isSellerHost =
    typeof window !== 'undefined' && window.location.hostname.startsWith('seller.');
  const isSeller = isSellerHost || pathname.startsWith('/seller');

  useEffect(() => {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogImage = document.querySelector('meta[property="og:image"]');

    if (manifestLink) manifestLink.setAttribute('href', isSeller ? '/seller-manifest.webmanifest' : '/manifest.webmanifest');
    if (appleIcon) appleIcon.setAttribute('href', isSeller ? '/seller-icon.svg' : '/icon.svg');
    if (appleTitle) appleTitle.setAttribute('content', isSeller ? 'TM Seller' : 'Tech Markaz');
    if (themeColor) themeColor.setAttribute('content', isSeller ? '#0029A3' : '#0047FF');
    if (ogTitle) ogTitle.setAttribute('content', isSeller ? 'Tech Markaz Seller Center' : 'Tech Markaz — Premium Electronics Marketplace');
    if (ogImage) ogImage.setAttribute('content', isSeller ? '/seller-icon.svg' : '/icon.svg');

    document.title = isSeller ? 'Tech Markaz Seller Center' : 'Tech Markaz — Premium Electronics Marketplace';
  }, [isSeller]);

  return null;
}
