import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

const TILES = [
  {
    img: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=1400&q=85',
    kicker: 'Premium Phones',
    title: 'Flagship Smartphones',
    slug: 'Smartphone',
  },
  {
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&q=85',
    kicker: 'Sound',
    title: 'Audio Gear',
    slug: 'Audio',
  },
  {
    img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1400&q=85',
    kicker: 'Smart TVs',
    title: '4K & OLED',
    slug: 'Smart TV',
  },
];

export default function ShowcaseGrid() {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % TILES.length), 5000);
    return () => clearInterval(t);
  }, [idx]);

  const goTo = (i) => setIdx(i);

  const onTouchStart = (e) => { touchStartX.current = e.changedTouches[0].screenX; };
  const onTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setIdx((i) => (i + 1) % TILES.length);
      else setIdx((i) => (i - 1 + TILES.length) % TILES.length);
    }
  };

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

      {/* Carousel */}
      <div
        className="relative h-[300px] md:h-[400px] rounded-2xl md:rounded-3xl overflow-hidden select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {TILES.map((t, i) => (
          <div
            key={t.slug}
            className={`absolute inset-0 transition-all duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] ${
              i === idx
                ? 'opacity-100 translate-x-0 scale-100 z-10'
                : i < idx || (idx === 0 && i === TILES.length - 1)
                ? 'opacity-0 -translate-x-6 scale-[0.98] z-0 pointer-events-none'
                : 'opacity-0 translate-x-6 scale-[0.98] z-0 pointer-events-none'
            }`}
          >
            <Link to={`/shop?category=${encodeURIComponent(t.slug)}`} className="block w-full h-full relative">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${t.img})`,
                  transform: i === idx ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 6s ease',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08091F]/95 via-[#08091F]/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-white">
                <div
                  className={`text-[10.5px] font-extrabold tracking-[1.4px] uppercase text-accent mb-1.5 transition-all duration-700 ${
                    i === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
                  style={{ transitionDelay: i === idx ? '200ms' : '0ms' }}
                >
                  {t.kicker}
                </div>
                <h3
                  className={`text-[24px] md:text-[40px] font-black tracking-tight leading-[1.05] mb-4 transition-all duration-700 ${
                    i === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
                  style={{ transitionDelay: i === idx ? '300ms' : '0ms' }}
                >
                  {t.title}
                </h3>
                <span
                  className={`bg-white text-[#08091F] px-4 py-2.5 rounded-xl font-extrabold text-[12.5px] inline-flex items-center gap-2 transition-all duration-700 hover:bg-accent ${
                    i === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
                  style={{ transitionDelay: i === idx ? '400ms' : '0ms' }}
                >
                  Explore
                  <Icon name="arrowRight" size={14} color="#08091F" strokeWidth={2.6} />
                </span>
              </div>
            </Link>
          </div>
        ))}

        {/* Left/right arrows (desktop) */}
        <button
          onClick={() => setIdx((i) => (i - 1 + TILES.length) % TILES.length)}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/85 backdrop-blur items-center justify-center text-ink hover:bg-white hover:scale-110 transition z-20 shadow-lg"
          aria-label="Previous"
        >
          <Icon name="chevronLeft" size={20} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => setIdx((i) => (i + 1) % TILES.length)}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/85 backdrop-blur items-center justify-center text-ink hover:bg-white hover:scale-110 transition z-20 shadow-lg"
          aria-label="Next"
        >
          <Icon name="chevronRight" size={20} strokeWidth={2.5} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 right-6 z-20 flex gap-1.5">
          {TILES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? 'w-7 bg-accent' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
