import { useEffect, useState } from 'react';
import { fetchAnnouncements } from '../../lib/homeContent';

const FALLBACK = [
  'Free delivery on orders over Rs. 3,000',
  '7-day easy returns policy',
  'Cash on Delivery available nationwide',
  'Call 0300-TECHMARKAZ for support',
];

export default function AnnouncementBar() {
  const [messages, setMessages] = useState(FALLBACK);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAnnouncements();
        if (!cancelled && data.length) setMessages(data.map((a) => a.message));
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (messages.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), 4000);
    return () => clearInterval(t);
  }, [messages.length]);

  if (!messages.length) return null;

  return (
    <div className="bg-gradient-to-r from-brand via-brand-deep to-brand text-white py-2.5 px-4">
      <div className="max-w-[1560px] mx-auto flex items-center justify-center gap-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
        <span
          key={idx}
          className="text-[11.5px] md:text-[12.5px] font-semibold truncate text-center"
          style={{ animation: 'tmFadeSlide 0.5s ease' }}
        >
          {messages[idx]}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
      </div>
      <style>{`
        @keyframes tmFadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
