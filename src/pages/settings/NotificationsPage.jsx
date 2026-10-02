import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import Reveal from '../../components/ui/Reveal';

const DEFAULT = { orders: true, promos: true, newsletter: false, restock: true };

const ROWS = [
  { key: 'orders', icon: 'package', title: 'Order Updates', sub: 'Dispatch, delivery & cancellation alerts' },
  { key: 'promos', icon: 'flame', title: 'Promotions & Deals', sub: 'Flash sales, discount codes & offers' },
  { key: 'restock', icon: 'upload', title: 'Back in Stock Alerts', sub: 'Get notified when saved items are back' },
  { key: 'newsletter', icon: 'mail', title: 'Weekly Newsletter', sub: 'Curated product picks & tech news' },
];

export default function NotificationsPage() {
  const [state, setState] = useState(() => {
    try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem('tm_notifs') || '{}') }; }
    catch { return DEFAULT; }
  });

  useEffect(() => {
    localStorage.setItem('tm_notifs', JSON.stringify(state));
  }, [state]);

  const toggle = (k) => setState((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="max-w-[820px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account/settings" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div>
            <h1 className="text-[20px] md:text-[24px] font-black">Notifications</h1>
            <p className="text-[12.5px] text-muted font-semibold">Choose what to hear about</p>
          </div>
        </div>
      </Reveal>

      <Reveal direction="up" delay={80}>
        <div className="glass-tile rounded-2xl overflow-hidden">
          {ROWS.map((r, i) => (
            <div
              key={r.key}
              className={`relative z-10 flex items-center gap-3.5 px-5 py-4 ${
                i > 0 ? 'border-t border-line/40' : ''
              }`}
            >
              <span className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                <Icon name={r.icon} size={17} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-extrabold text-ink">{r.title}</div>
                <div className="text-[11.5px] text-muted font-semibold">{r.sub}</div>
              </div>
              <button
                onClick={() => toggle(r.key)}
                className={`w-11 h-6 rounded-full relative transition shrink-0 ${state[r.key] ? 'bg-brand' : 'bg-line'}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                    state[r.key] ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
