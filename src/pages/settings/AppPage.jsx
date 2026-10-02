import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';
import Reveal from '../../components/ui/Reveal';

export default function AppPage() {
  const { toast } = useToast();
  const [notifs, setNotifs] = useState(true);
  const [cacheSize, setCacheSize] = useState('~12 MB');

  const clearCache = () => {
    if (!confirm('Clear cached data?\n\nThe app will reload and re-fetch content.')) return;
    try {
      if ('caches' in window) {
        caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))));
      }
      setCacheSize('0 MB');
      toast('Cache cleared', 'ok');
    } catch {}
  };

  const share = async () => {
    const data = {
      title: 'Tech Markaz',
      text: "Pakistan's premium electronics marketplace",
      url: window.location.origin,
    };
    if (navigator.share) {
      try { await navigator.share(data); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(data.url);
        toast('Link copied', 'ok');
      } catch {}
    }
  };

  const installPrompt = () => {
    alert(
      'To install Tech Markaz:\n\n' +
      'Android (Chrome): Tap the ⋮ menu → "Install app" or "Add to Home screen"\n\n' +
      'iPhone (Safari): Tap Share → "Add to Home Screen"\n\n' +
      'Desktop (Chrome): Click the install icon in the address bar'
    );
  };

  return (
    <div className="max-w-[820px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account/settings" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div>
            <h1 className="text-[20px] md:text-[24px] font-black">App Settings</h1>
            <p className="text-[12.5px] text-muted font-semibold">Install, notifications, cache</p>
          </div>
        </div>
      </Reveal>

      <div className="space-y-4">
        <Reveal direction="up" delay={80}>
          <div className="glass-tile-flat rounded-2xl overflow-hidden">
            <button onClick={installPrompt} className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-brand-light/40 transition text-left">
              <span className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                <Icon name="upload" size={16} />
              </span>
              <div className="flex-1">
                <div className="text-[13.5px] font-extrabold text-ink">Install Tech Markaz</div>
                <div className="text-[11.5px] text-muted font-semibold">Get the app on your home screen</div>
              </div>
              <Icon name="chevronRight" size={15} className="text-muted" />
            </button>
            <div className="flex items-center gap-3.5 px-5 py-3.5 border-t border-line/40">
              <span className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                <Icon name="bell" size={16} />
              </span>
              <div className="flex-1">
                <div className="text-[13.5px] font-extrabold text-ink">Push Notifications</div>
                <div className="text-[11.5px] text-muted font-semibold">Order updates, deals, alerts</div>
              </div>
              <button
                onClick={() => setNotifs(!notifs)}
                className={`w-11 h-6 rounded-full relative transition shrink-0 ${notifs ? 'bg-brand' : 'bg-line'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${notifs ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal direction="up" delay={120}>
          <div className="glass-tile-flat rounded-2xl overflow-hidden">
            <button onClick={share} className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-brand-light/40 transition text-left">
              <span className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                <Icon name="arrowRight" size={16} />
              </span>
              <div className="flex-1">
                <div className="text-[13.5px] font-extrabold text-ink">Share the app</div>
                <div className="text-[11.5px] text-muted font-semibold">Invite friends to Tech Markaz</div>
              </div>
              <Icon name="chevronRight" size={15} className="text-muted" />
            </button>
            <button onClick={clearCache} className="w-full flex items-center gap-3.5 px-5 py-3.5 border-t border-line/40 hover:bg-brand-light/40 transition text-left">
              <span className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                <Icon name="trash" size={16} />
              </span>
              <div className="flex-1">
                <div className="text-[13.5px] font-extrabold text-ink">Clear cache</div>
                <div className="text-[11.5px] text-muted font-semibold">Free up {cacheSize} of storage</div>
              </div>
              <Icon name="chevronRight" size={15} className="text-muted" />
            </button>
          </div>
        </Reveal>

        <Reveal direction="up" delay={160}>
          <div className="glass-tile-flat rounded-2xl p-5 text-center">
            <img src="/icon.svg" alt="" className="w-16 h-16 rounded-2xl mx-auto mb-3 shadow-md" />
            <div className="text-[15px] font-black mb-1">Tech Markaz</div>
            <div className="text-[12px] text-muted font-semibold mb-1">Version 10.0 · Build 2026.10</div>
            <div className="text-[11px] text-muted font-medium">Made with care in Pakistan 🇵🇰</div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
