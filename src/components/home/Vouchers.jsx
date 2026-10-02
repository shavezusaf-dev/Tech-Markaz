import { useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { fetchHomeVouchers } from '../../lib/homeContent';
import Icon from '../ui/Icon';

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const end = new Date(dateStr).getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / (24 * 3600 * 1000)));
}

export default function Vouchers() {
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collected, setCollected] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tm_vouchers') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchHomeVouchers();
        if (!cancelled) setVouchers(data);
      } catch {}
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    localStorage.setItem('tm_vouchers', JSON.stringify(collected));
  }, [collected]);

  const collect = (code) => {
    if (collected.includes(code)) return;
    setCollected((c) => [...c, code]);
    toast(`Voucher ${code} collected`, 'ok', 'Voucher');
  };

  if (!loading && vouchers.length === 0) return null;

  return (
    <section className="px-[4%] md:px-[5%] py-6 max-w-[1560px] mx-auto w-full">
      <div className="flex justify-between items-end mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-[18px] md:text-[22px] font-black flex items-center gap-3">
            <span className="w-[5px] h-[18px] md:h-[22px] bg-gradient-to-b from-brand to-accent rounded-full" />
            Collect Vouchers
          </h2>
          <div className="text-[12px] md:text-[13px] text-muted ml-[17px] mt-1">
            Extra savings when you check out
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 w-[270px] md:w-[300px] glass-tile rounded-2xl h-[200px] animate-pulse" />
          ))
        ) : (
          vouchers.map((v) => {
            const isCollected = collected.includes(v.code);
            const days = daysLeft(v.expires_at);
            const expired = days === 0;
            return (
              <div
                key={v.id}
                onClick={() => !expired && collect(v.code)}
                className={`shrink-0 w-[270px] md:w-[300px] glass-tile rounded-2xl relative overflow-hidden cursor-pointer ${
                  isCollected ? 'ring-2 ring-ok/60' : expired ? 'opacity-60' : ''
                }`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isCollected
                    ? 'bg-gradient-to-b from-ok to-[#059669]'
                    : expired
                    ? 'bg-line'
                    : 'bg-gradient-to-b from-brand to-accent'
                }`} />

                <div className="pt-4 px-5 pb-3 flex justify-between items-start relative z-10">
                  <div className={`text-[10px] font-extrabold tracking-[1px] uppercase flex items-center gap-1.5 ${
                    isCollected ? 'text-ok' : 'text-brand'
                  }`}>
                    <Icon name="tag" size={11} />
                    {v.brand_label || 'Tech Markaz'}
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isCollected ? 'bg-ok/15 text-ok' : 'bg-brand-light text-brand'
                  }`}>
                    <Icon name={isCollected ? 'check' : 'flame'} size={16} strokeWidth={2.4} />
                  </div>
                </div>

                <div className="px-5 pb-3.5 relative z-10">
                  <div className={`text-[38px] md:text-[42px] font-black leading-none tracking-[-2px] mb-1.5 ${
                    isCollected ? 'text-ok' : 'text-brand'
                  }`}>
                    {v.discount_pct}
                    <span className="text-[20px] md:text-[22px] tracking-[-1px]">%</span>
                  </div>
                  <div className="text-[12px] text-muted font-semibold">
                    Min. Spend Rs. {Number(v.min_spend || 0).toLocaleString('en-PK')}
                  </div>
                </div>

                <div className="relative h-4 mx-5 border-t-2 border-dashed border-line z-10">
                  <span className="absolute -top-2.5 -left-[29px] w-[18px] h-[18px] rounded-full bg-bg" />
                  <span className="absolute -top-2.5 -right-[29px] w-[18px] h-[18px] rounded-full bg-bg" />
                </div>

                <div className="px-5 pt-3 pb-4 flex justify-between items-center gap-3 relative z-10">
                  <button
                    disabled={isCollected || expired}
                    className={`px-5 py-2.5 rounded-[10px] font-extrabold text-[12.5px] flex items-center gap-1.5 transition-all ${
                      isCollected
                        ? 'bg-ok text-white cursor-default'
                        : expired
                        ? 'bg-surface-2 text-muted cursor-not-allowed'
                        : 'bg-brand text-white hover:bg-brand-dark hover:-translate-y-0.5 hover:shadow-md'
                    }`}
                  >
                    {isCollected ? (
                      <>Collected <Icon name="check" size={13} color="white" strokeWidth={3} /></>
                    ) : expired ? (
                      'Expired'
                    ) : (
                      <>Collect <Icon name="arrowRight" size={13} color="white" strokeWidth={3} /></>
                    )}
                  </button>
                  <div className="text-[10.5px] text-muted text-right leading-tight font-semibold">
                    {v.expires_at && (
                      <>
                        <b className="block text-ink-2 font-extrabold mb-0.5">
                          Use by {new Date(v.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </b>
                        <span>{days} day{days === 1 ? '' : 's'} left</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
