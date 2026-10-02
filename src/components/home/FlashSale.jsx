import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import ProductGrid from '../product/ProductGrid';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function FlashSale({ products = [], loading }) {
  // 24h rolling countdown ending at midnight today+1
  const [endAt] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const flash = products.filter((p) => (parseFloat(p.discount_percent) || 0) >= 20).slice(0, 8);
  if (!loading && flash.length === 0) return null;

  const diff = Math.max(0, endAt - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  return (
    <section className="px-[4%] md:px-[5%] py-6 max-w-[1560px] mx-auto w-full">
      <div className="bg-gradient-to-br from-[#08091F] via-[#1A1F47] to-[#08091F] rounded-2xl md:rounded-[20px] p-5 md:p-6 mb-5 flex items-center gap-4 md:gap-6 flex-wrap relative overflow-hidden shadow-lg">
        <div className="absolute -top-1/3 -right-10 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(255,204,0,0.18),transparent_65%)] rounded-full" />
        <div className="absolute -bottom-1/2 -left-10 w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(0,71,255,0.30),transparent_65%)] rounded-full" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-ink shadow-lg shrink-0">
            <Icon name="flame" size={24} strokeWidth={2.4} />
          </div>
          <div>
            <h3 className="text-[18px] md:text-[20px] font-black text-white tracking-tight">
              Flash Sale
            </h3>
            <p className="text-[11.5px] md:text-[12.5px] text-white/70 font-medium mt-0.5">
              Limited stock · Grab them before they're gone
            </p>
          </div>
        </div>

        <div className="flex gap-2 ml-auto relative z-10">
          {[
            { n: h, l: 'Hours' },
            { n: m, l: 'Minutes' },
            { n: s, l: 'Seconds' },
          ].map((t) => (
            <div
              key={t.l}
              className="rounded-xl px-3.5 py-2.5 min-w-[58px] md:min-w-[62px] text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)", border: "1px solid rgba(255,255,255,0.20)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.30), 0 6px 16px rgba(0,0,0,0.30)", backdropFilter: "blur(20px) saturate(180%)" }}
            >
              <div className="text-[20px] md:text-[22px] font-black text-white leading-none tabular-nums tracking-tight">
                {pad(t.n)}
              </div>
              <div className="text-[9px] md:text-[9.5px] uppercase text-white/60 tracking-[0.8px] mt-1 font-extrabold">
                {t.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ProductGrid products={flash} loading={loading} />
    </section>
  );
}

