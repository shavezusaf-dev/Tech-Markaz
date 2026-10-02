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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAnnouncements();
        if (!cancelled && data.length) {
          setMessages(data.map((a) => a.message));
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  if (!messages.length) return null;

  return (
    <div className="bg-gradient-to-r from-brand via-brand-deep to-brand text-white text-[12.5px] font-medium py-2.5 overflow-hidden">
      <div className="flex gap-12 animate-marquee whitespace-nowrap">
        {[...messages, ...messages, ...messages].map((msg, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {msg}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          to { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 50s linear infinite;
        }
      `}</style>
    </div>
  );
}
