import { useEffect, useState } from 'react';
import Icon from './Icon';

const STORAGE_KEY = 'tm_install_dismissed_at';
const DISMISS_DAYS = 7;

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone) or recently dismissed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    const dismissedAt = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 24 * 3600 * 1000) return;

    // Only show on mobile/touch devices
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    const onPrompt = (e) => {
      e.preventDefault();
      setPromptEvent(e);
      // Small delay so the user sees the page first
      setTimeout(() => setShow(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS Safari fallback — show manual instructions
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setTimeout(() => setShow(true), 2500);
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
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
        }
      } catch {}
      setInstalling(false);
      setPromptEvent(null);
    } else {
      // iOS — show manual instructions
      alert(
        'To install Tech Markaz on your iPhone:\n\n' +
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
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-[380px] z-[5500]"
      style={{ animation: 'installSlide 0.4s cubic-bezier(.16,1,.3,1)' }}
    >
      <div className="glass-tile rounded-2xl p-4 shadow-xl">
        <div className="relative z-10 flex items-start gap-3">
          <img src="/icon.svg" alt="" className="w-12 h-12 rounded-xl shrink-0 shadow-md" />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-black text-ink mb-0.5">Install Tech Markaz</div>
            <div className="text-[11.5px] text-muted font-medium leading-snug mb-3">
              Add the app to your home screen for faster shopping and instant notifications.
            </div>
            <div className="flex gap-2">
              <button
                onClick={install}
                disabled={installing}
                className="btn-primary text-xs py-2 px-3.5 flex-1"
              >
                <Icon name="upload" size={12} color="white" strokeWidth={2.6} />
                {installing ? 'Installing...' : 'Install App'}
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
