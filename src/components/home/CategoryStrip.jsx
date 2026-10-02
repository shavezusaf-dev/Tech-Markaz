import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

const CATS = [
  { label: 'Smartphones', slug: 'Smartphone', icon: 'smartphone', grad: 'from-[#FFE9A8] to-[#FFCC00]', fg: 'text-ink' },
  { label: 'Smart TVs', slug: 'Smart TV', icon: 'tv', grad: 'from-[#B8CDFF] to-[#0047FF]', fg: 'text-white' },
  { label: 'Audio', slug: 'Audio', icon: 'headphone', grad: 'from-[#C7EEDC] to-[#10B981]', fg: 'text-white' },
  { label: 'Watches', slug: 'Smart Watch', icon: 'watch', grad: 'from-[#E4D0FF] to-[#7C3AED]', fg: 'text-white' },
  { label: 'Tablets', slug: 'Tablet', icon: 'tablet', grad: 'from-[#FFD0D0] to-[#EF4444]', fg: 'text-white' },
  { label: 'Washers', slug: 'Washing Machine', icon: 'washing', grad: 'from-[#B8F0FF] to-[#00D4FF]', fg: 'text-ink' },
  { label: 'Projectors', slug: 'Projector', icon: 'projector', grad: 'from-[#FFD4B0] to-[#F97316]', fg: 'text-white' },
  { label: 'All Products', slug: 'All', icon: 'grid', grad: 'from-[#D8DAFF] to-[#6366F1]', fg: 'text-white' },
];

export default function CategoryStrip() {
  return (
    <div className="px-[4%] md:px-[5%] max-w-[1560px] mx-auto w-full">
      <div className="flex gap-3.5 overflow-x-auto pb-2 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATS.map((c, i) => (
          <Link
            key={c.slug}
            to={`/shop?category=${encodeURIComponent(c.slug)}`}
            className="glass-tile group flex flex-col items-center gap-2.5 shrink-0 w-[86px] md:w-[104px] px-2.5 py-3.5 rounded-2xl"
            style={{ animation: `catIn 0.5s cubic-bezier(.16,1,.3,1) ${i * 0.04}s both` }}
          >
            <div
              className={`relative z-10 w-16 h-16 md:w-[72px] md:h-[72px] rounded-[22px] bg-gradient-to-br ${c.grad} ${c.fg} flex items-center justify-center transition-all duration-300 group-hover:rotate-[-8deg] group-hover:scale-110 shadow-md`}
            >
              <Icon name={c.icon} size={28} strokeWidth={1.8} />
            </div>
            <span className="relative z-10 text-[11.5px] font-bold text-ink text-center whitespace-nowrap max-w-full overflow-hidden text-ellipsis group-hover:text-brand transition">
              {c.label}
            </span>
          </Link>
        ))}
      </div>

      <style>{`
        @keyframes catIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
