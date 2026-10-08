import { useEffect, useState } from 'react';
import Icon from '../../components/ui/Icon';

const STORAGE_KEY = 'tm_seller_install_dismissed_at';
const DISMISS_DAYS = 5;

export default function SellerInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Skip if already installed as standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    const dismissedAt = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 24 * 3600 * 1000) return;

    const onPrompt = (e) => {
      e.preventDefault();
      setPromptEvent(e);
      setTimeout(() => setShow(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS Safari fallback
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent);
    let iosTimer;
    if (isIOS && isSafari) {
      iosTimer = setTimeout(() => setShow(true), 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setShow(false);
  };

  const install = async () => {
    if (promptEvent) {
      setInstalling(true);
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setShow(false);
          localStorage.setItem(STORAGE_KEY, String(Date.now()));
        }
      } catch {}
      setInstalling(false);
      setPromptEvent(null);
    } else {
      alert(
        'To install Tech Markaz Seller on your iPhone:\n\n' +
        '1. Tap the Share button (square with arrow)\n' +
        '2. Scroll down and tap "Add to Home Screen"\n' +
        '3. Tap "Add" in the top right'
      );
      dismiss();
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-[400px] z-[5500]"
      style={{ animation: 'installSlide 0.4s cubic-bezier(.16,1,.3,1)' }}
    >
      <div className="glass-tile rounded-2xl p-4 shadow-xl">
        <div className="relative z-10 flex items-start gap-3">
          <img src="/seller-icon.svg" alt="" className="w-14 h-14 rounded-xl shrink-0 shadow-md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="text-[14px] font-black text-ink">Install Seller App</div>
              <span className="text-[9px] font-extrabold bg-accent text-ink px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                Seller
              </span>
            </div>
            <div className="text-[11.5px] text-muted font-medium leading-snug mb-3">
              Add Tech Markaz Seller Center to your home screen for quick access to orders, chats, and products.
            </div>
            <div className="flex gap-2">
              <button onClick={install} disabled={installing} className="btn-primary text-xs py-2 px-3.5 flex-1">
                <Icon name="upload" size={12} color="white" strokeWidth={2.6} />
                {installing ? 'Installing...' : 'Install Seller App'}
              </button>
              <button onClick={dismiss} className="btn-glass text-xs py-2 px-3.5">
                Later
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="w-7 h-7 rounded-lg hover:bg-bad/10 hover:text-bad text-muted flex items-center justify-center transition shrink-0"
          >
            <Icon name="x" size={13} />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes installSlide {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
