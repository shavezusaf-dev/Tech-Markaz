import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

const TILES = [
  {
    img: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=1200&q=85',
    kicker: 'Premium Phones',
    title: 'Flagship Smartphones',
    slug: 'Smartphone',
    big: true,
  },
  {
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=85',
    kicker: 'Sound',
    title: 'Audio Gear',
    slug: 'Audio',
  },
  {
    img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=900&q=85',
    kicker: 'Smart TVs',
    title: '4K & OLED',
    slug: 'Smart TV',
  },
];

export default function ShowcaseGrid() {
  return (
    <section className="px-[4%] md:px-[5%] py-6 max-w-[1560px] mx-auto w-full">
      <div className="flex justify-between items-end mb-5">
        <div>
          <h2 className="text-[18px] md:text-[22px] font-black flex items-center gap-3">
            <span className="w-[5px] h-[18px] md:h-[22px] bg-gradient-to-b from-brand to-accent rounded-full" />
            Shop by Category
          </h2>
          <div className="text-[12px] md:text-[13px] text-muted ml-[17px] mt-1">
            Curated collections for every need
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr] gap-3.5 md:h-[400px]">
        {TILES.map((t) => (
          <Link
            key={t.slug}
            to={`/shop?category=${encodeURIComponent(t.slug)}`}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-2 to-surface-3 group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ring-1 ring-white/60 ${
              t.big ? 'h-[220px] md:h-full' : 'h-[220px] md:h-full'
            }`}
          >
            <img
              src={t.img}
              alt={t.title}
              className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08091F]/90 via-transparent to-transparent flex flex-col justify-end p-5 md:p-6 text-white">
              <div className="text-[10.5px] font-extrabold tracking-[1.4px] uppercase text-accent mb-1.5">
                {t.kicker}
              </div>
              <h3 className="text-[18px] md:text-[clamp(18px,2vw,26px)] font-black tracking-tight mb-3 leading-[1.1]">
                {t.title}
              </h3>
              <span className="bg-white !text-[#08091F] px-3.5 py-2 rounded-[10px] font-extrabold text-[12px] inline-flex items-center gap-1.5 w-fit transition-all group-hover:bg-accent group-hover:!text-[#08091F] group-hover:translate-x-1 shadow-sm">
                Explore
                <Icon name="arrowRight" size={13} strokeWidth={2.6} color="#08091F" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
