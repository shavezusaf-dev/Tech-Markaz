import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

const CATEGORIES = [
  { label: 'Smartphones', slug: 'Smartphone', icon: 'smartphone', columns: [
    { title: 'By Type', icon: 'layers', items: [
      { label: 'Flagship Phones', keyword: 'Flagship' },
      { label: 'Mid-Range', keyword: 'Mid-Range' },
      { label: 'Budget Phones', keyword: 'Budget' },
      { label: '5G Phones', keyword: '5G' },
    ]},
    { title: 'By Specs', icon: 'cpu', items: [
      { label: 'Snapdragon Chip', keyword: 'Snapdragon' },
      { label: '8GB+ RAM', keyword: '8GB' },
      { label: '256GB+ Storage', keyword: '256GB' },
      { label: '5000mAh+ Battery', keyword: '5000mAh' },
    ]},
    { title: 'Top Brands', icon: 'star', items: [
      { label: 'Samsung', brand: 'Samsung' },
      { label: 'Apple', brand: 'Apple' },
      { label: 'Xiaomi', brand: 'Xiaomi' },
      { label: 'Vivo', brand: 'Vivo' },
      { label: 'Infinix', brand: 'Infinix' },
      { label: 'Tecno', brand: 'Tecno' },
    ]},
  ]},
  { label: 'Audio', slug: 'Audio', icon: 'headphone', columns: [
    { title: 'By Type', icon: 'layers', items: [
      { label: 'Wireless Earbuds', keyword: 'Earbuds' },
      { label: 'Headphones', keyword: 'Headphones' },
      { label: 'Bluetooth Speakers', keyword: 'Speakers' },
      { label: 'Soundbars', keyword: 'Soundbar' },
    ]},
    { title: 'By Feature', icon: 'sparkle', items: [
      { label: 'Noise Cancelling', keyword: 'ANC' },
      { label: 'Waterproof', keyword: 'Waterproof' },
      { label: 'Long Battery', keyword: 'Battery' },
      { label: 'Gaming', keyword: 'Gaming' },
    ]},
    { title: 'Top Brands', icon: 'star', items: [
      { label: 'JBL', brand: 'JBL' },
      { label: 'Sony', brand: 'Sony' },
      { label: 'Audionic', brand: 'Audionic' },
      { label: 'Apple', brand: 'Apple' },
      { label: 'Bose', brand: 'Bose' },
    ]},
  ]},
  { label: 'Smart TVs', slug: 'Smart TV', icon: 'tv', columns: [
    { title: 'By Panel', icon: 'layers', items: [
      { label: 'OLED TVs', keyword: 'OLED' },
      { label: 'QLED TVs', keyword: 'QLED' },
      { label: 'LED TVs', keyword: 'LED' },
      { label: 'Mini-LED', keyword: 'Mini LED' },
    ]},
    { title: 'By Size', icon: 'sliders', items: [
      { label: '32" & Under', keyword: '32' },
      { label: '40" - 50"', keyword: '43' },
      { label: '55" - 65"', keyword: '55' },
      { label: '70" & Above', keyword: '75' },
    ]},
    { title: 'Top Brands', icon: 'star', items: [
      { label: 'Samsung', brand: 'Samsung' },
      { label: 'Sony', brand: 'Sony' },
      { label: 'TCL', brand: 'TCL' },
      { label: 'Haier', brand: 'Haier' },
      { label: 'LG', brand: 'LG' },
    ]},
  ]},
  { label: 'Projectors', slug: 'Projector', icon: 'projector', columns: [
    { title: 'By Type', icon: 'layers', items: [
      { label: 'Home Cinema', keyword: 'Home' },
      { label: 'Portable', keyword: 'Portable' },
      { label: '4K Laser', keyword: '4K' },
      { label: 'Business', keyword: 'Business' },
    ]},
    { title: 'By Brightness', icon: 'lightbulb', items: [
      { label: 'Under 3000 Lumens', keyword: '2000' },
      { label: '3000 - 5000 Lumens', keyword: '4000' },
      { label: '5000+ Lumens', keyword: '5000' },
    ]},
    { title: 'Top Brands', icon: 'star', items: [
      { label: 'Epson', brand: 'Epson' },
      { label: 'BenQ', brand: 'BenQ' },
      { label: 'Anker Nebula', brand: 'Nebula' },
      { label: 'Xiaomi', brand: 'Xiaomi' },
    ]},
  ]},
  { label: 'Washers', slug: 'Washing Machine', icon: 'washing', columns: [
    { title: 'By Type', icon: 'layers', items: [
      { label: 'Front Load', keyword: 'Front Load' },
      { label: 'Top Load', keyword: 'Top Load' },
      { label: 'Twin Tub', keyword: 'Twin Tub' },
      { label: 'Washer-Dryer', keyword: 'Dryer' },
    ]},
    { title: 'By Capacity', icon: 'sliders', items: [
      { label: 'Up to 7 KG', keyword: '6 KG' },
      { label: '8 - 10 KG', keyword: '9 KG' },
      { label: '11 KG & Above', keyword: '12 KG' },
    ]},
    { title: 'Top Brands', icon: 'star', items: [
      { label: 'Haier', brand: 'Haier' },
      { label: 'Samsung', brand: 'Samsung' },
      { label: 'LG', brand: 'LG' },
      { label: 'Dawlance', brand: 'Dawlance' },
    ]},
  ]},
  { label: 'Watches', slug: 'Smart Watch', icon: 'watch', columns: [
    { title: 'By Type', icon: 'layers', items: [
      { label: 'Fitness Bands', keyword: 'Fitness' },
      { label: 'Smart Watches', keyword: 'Smart Watch' },
      { label: 'Premium Wearables', keyword: 'Premium' },
      { label: 'Kids Watches', keyword: 'Kids' },
    ]},
    { title: 'By Feature', icon: 'sparkle', items: [
      { label: 'AMOLED Display', keyword: 'AMOLED' },
      { label: 'GPS Built-in', keyword: 'GPS' },
      { label: 'Heart Rate', keyword: 'Heart Rate' },
      { label: 'Call Support', keyword: 'Calling' },
    ]},
    { title: 'Top Brands', icon: 'star', items: [
      { label: 'Apple', brand: 'Apple' },
      { label: 'Samsung', brand: 'Samsung' },
      { label: 'Xiaomi', brand: 'Xiaomi' },
      { label: 'Huawei', brand: 'Huawei' },
    ]},
  ]},
  { label: 'Tablets', slug: 'Tablet', icon: 'tablet', columns: [
    { title: 'By Type', icon: 'layers', items: [
      { label: 'iPad', keyword: 'iPad' },
      { label: 'Android Tablets', keyword: 'Android' },
      { label: 'Kids Tablets', keyword: 'Kids' },
      { label: '2-in-1 Tablets', keyword: '2 in 1' },
    ]},
    { title: 'By Size', icon: 'sliders', items: [
      { label: 'Under 8"', keyword: '7' },
      { label: '8" - 10"', keyword: '10' },
      { label: '11" & Above', keyword: '12' },
    ]},
    { title: 'Top Brands', icon: 'star', items: [
      { label: 'Apple', brand: 'Apple' },
      { label: 'Samsung', brand: 'Samsung' },
      { label: 'Lenovo', brand: 'Lenovo' },
      { label: 'Xiaomi', brand: 'Xiaomi' },
    ]},
  ]},
  { label: "Today's Deals", slug: 'All', icon: 'flame', deal: true, columns: [
    { title: 'Hot Deals', icon: 'flame', items: [
      { label: 'Up to 50% Off', keyword: '' },
      { label: 'Flash Sale', keyword: '' },
      { label: 'Clearance', keyword: '' },
    ]},
    { title: 'Discount Range', icon: 'tag', items: [
      { label: '10% - 25% Off', keyword: '' },
      { label: '25% - 50% Off', keyword: '' },
      { label: '50%+ Off', keyword: '' },
    ]},
    { title: 'Shop Deals By', icon: 'grid', items: [
      { label: 'Smartphones', keyword: '' },
      { label: 'Audio', keyword: '' },
      { label: 'Smart TVs', keyword: '' },
    ]},
  ]},
];

const RIGHT_ALIGN = ['Tablets', "Today's Deals", 'Watches'];

export default function NavBar() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const diff = y - lastY.current;
        if (Math.abs(diff) > 6) {
          setHidden(y > 120 && diff > 0);
          lastY.current = y;
        }
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`hidden md:block bg-surface/85 backdrop-blur-xl border-b border-line/60 sticky top-[69px] z-[850] transition-transform duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] ${
        hidden ? '-translate-y-[150%]' : 'translate-y-0'
      }`}
    >
      <div className="max-w-[1560px] mx-auto px-[5%] flex">
        <Link
          to="/"
          className="text-[12.5px] font-bold text-ink-2 uppercase tracking-wide py-4 px-3.5 border-b-[3px] border-transparent hover:border-brand hover:text-brand transition whitespace-nowrap flex items-center gap-1.5 shrink-0"
        >
          Home
        </Link>

        {CATEGORIES.map((cat) => {
          const alignRight = RIGHT_ALIGN.includes(cat.label);
          return (
            <div key={cat.label} className="relative group">
              <Link
                to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                className={`text-[12.5px] font-bold uppercase tracking-wide py-4 px-3.5 border-b-[3px] border-transparent transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  cat.deal
                    ? 'text-bad hover:border-bad'
                    : 'text-ink-2 hover:text-brand hover:border-brand'
                }`}
              >
                <Icon
                  name={cat.icon}
                  size={14}
                  className={cat.deal ? 'text-bad' : 'text-muted group-hover:text-brand transition'}
                />
                {cat.label}
                <Icon
                  name="chevronDown"
                  size={10}
                  className="opacity-50 group-hover:rotate-180 transition-transform duration-300"
                />
              </Link>

              <div
                className={`absolute top-full min-w-[580px] bg-surface/85 backdrop-blur-2xl border border-line/70 border-t-0 shadow-2xl p-5 grid grid-cols-3 gap-5 opacity-0 invisible -translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-[900] ${
                  alignRight ? 'right-0 rounded-b-2xl' : 'left-0 rounded-b-2xl'
                }`}
              >
                {cat.columns.map((col) => (
                  <DropdownCol key={col.title} data={col} category={cat.slug} />
                ))}

                <div className="col-span-3 mt-2 pt-3 border-t border-line flex items-center justify-between">
                  <div className="text-[10.5px] text-muted font-semibold">
                    Browse the full {cat.label.toLowerCase()} collection
                  </div>
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                    className="inline-flex items-center gap-2 text-[12px] font-extrabold text-brand hover:gap-3 transition-all"
                  >
                    View all
                    <Icon name="arrowRight" size={12} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function DropdownCol({ data, category }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2 px-2.5 pb-2.5 mb-1.5 border-b border-line">
        <span className="w-5 h-5 rounded-md bg-brand-light text-brand flex items-center justify-center shrink-0">
          <Icon name={data.icon} size={11} />
        </span>
        <div className="text-[10px] font-extrabold text-ink uppercase tracking-[1.2px]">
          {data.title}
        </div>
      </div>

      {data.items.map((item) => {
        const url = item.brand
          ? `/shop?category=${encodeURIComponent(category)}&brand=${encodeURIComponent(item.brand)}`
          : `/shop?category=${encodeURIComponent(category)}&keyword=${encodeURIComponent(item.keyword || '')}`;

        return (
          <Link
            key={item.label}
            to={url}
            className="text-[12.5px] font-semibold text-ink-2 px-3 py-2 rounded-lg hover:bg-brand-light hover:text-brand hover:pl-[18px] transition-all whitespace-nowrap flex justify-between items-center group/item"
          >
            <span className="flex items-center gap-2">
              {item.brand && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand/40 group-hover/item:bg-brand transition" />
              )}
              {item.label}
            </span>
            <Icon
              name="arrowRight"
              size={13}
              className="opacity-0 group-hover/item:opacity-100 -translate-x-1 group-hover/item:translate-x-0 transition"
            />
          </Link>
        );
      })}
    </div>
  );
}
