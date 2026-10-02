import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1920&q=85',
    kicker: 'New Arrivals',
    title: (
      <>
        Flagship Phones,
        <br />
        Straight to Your <span className="text-accent relative">Door</span>
      </>
    ),
    desc: 'Latest Samsung, Apple, Xiaomi & more — genuine warranty and fastest delivery across Pakistan.',
    cta: { label: 'Shop Smartphones', to: '/shop?category=Smartphone' },
    ghost: { label: 'Browse All', to: '/shop?category=All' },
  },
  {
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1920&q=85',
    kicker: 'Audio Week',
    title: (
      <>
        Sound That
        <br />
        <span className="text-accent">Moves You</span> Forward
      </>
    ),
    desc: 'Studio-grade headphones, wireless earbuds, and premium speakers curated for true audiophiles.',
    cta: { label: 'Explore Audio', to: '/shop?category=Audio' },
  },
  {
    image: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=1920&q=85',
    kicker: 'Home Cinema',
    title: (
      <>
        Cinema-Grade
        <br />
        <span className="text-accent">Projectors</span> at Home
      </>
    ),
    desc: 'Bring the theatre experience home with 4K laser projectors up to 300 inches.',
    cta: { label: 'View Projectors', to: '/shop?category=Projector' },
  },
];

const SLIDE_DURATION = 6000;

export default function Hero() {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const progressKey = useRef(0);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setIdx((i) => (i + 1) % SLIDES.length);
      progressKey.current++;
    }, SLIDE_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [idx]);

  const goTo = (i) => {
    setIdx(i);
    progressKey.current++;
  };

  return (
    <section className="px-[4%] md:px-[5%] pt-4 md:pt-5 pb-2 max-w-[1560px] mx-auto w-full">
      <div className="relative h-[380px] md:h-[520px] rounded-2xl md:rounded-3xl overflow-hidden bg-[#050814]">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <div
              className="absolute -inset-1 bg-cover bg-center transition-transform duration-[9000ms]"
              style={{
                backgroundImage: `url(${s.image})`,
                transform: i === idx ? 'scale(1.14)' : 'scale(1)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050814]/95 via-[#050814]/70 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(0,71,255,0.28),transparent_55%)]" />

            <div className="relative z-10 h-full flex flex-col justify-center px-7 md:px-[68px] max-w-[680px] text-white">
              <div
                className={`inline-flex items-center gap-2 bg-accent/15 border border-accent/40 text-accent rounded-full px-4 py-1.5 text-[10.5px] md:text-[11px] font-extrabold tracking-[1.4px] uppercase mb-4 md:mb-5 w-fit backdrop-blur transition-all duration-700 ${
                  i === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <Icon name="sparkle" size={13} />
                {s.kicker}
              </div>
              <h1
                className={`text-[26px] md:text-[clamp(30px,4.2vw,54px)] font-black leading-[1.05] tracking-[-1px] md:tracking-[-1.8px] mb-3 md:mb-5 transition-all duration-700 delay-100 ${
                  i === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                {s.title}
              </h1>
              <p
                className={`text-[13px] md:text-[15.5px] leading-relaxed opacity-85 mb-5 md:mb-8 max-w-[480px] transition-all duration-700 delay-200 ${
                  i === idx ? 'opacity-85 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                {s.desc}
              </p>
              <div
                className={`flex gap-2.5 md:gap-3.5 flex-wrap items-center transition-all duration-700 delay-300 ${
                  i === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <Link
                  to={s.cta.to}
                  className="bg-accent text-ink px-5 md:px-8 py-3 md:py-4 rounded-xl font-extrabold text-[13px] md:text-sm inline-flex items-center gap-2 md:gap-2.5 hover:bg-[#FFD633] hover:-translate-y-0.5 hover:shadow-xl transition-all"
                >
                  {s.cta.label}
                  <Icon name="arrowRight" size={15} strokeWidth={2.6} />
                </Link>
                {s.ghost && (
                  <Link
                    to={s.ghost.to}
                    className="bg-white/10 text-white border-[1.5px] border-white/30 px-5 md:px-7 py-3 md:py-4 rounded-xl font-bold text-[13px] md:text-sm inline-flex items-center gap-2 backdrop-blur hover:bg-white/20 hover:border-white/50 hover:-translate-y-0.5 transition-all"
                  >
                    {s.ghost.label}
                    <Icon name="arrowRight" size={15} strokeWidth={2.6} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Progress indicators */}
        <div className="absolute bottom-4 md:bottom-6 right-5 md:right-8 z-20 flex gap-2 bg-black/35 backdrop-blur rounded-full px-2.5 md:px-3 py-2 border border-white/10">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1 rounded-full transition-all duration-200 relative overflow-hidden ${
                i === idx
                  ? 'w-10 md:w-14 bg-white/25'
                  : 'w-5 md:w-8 bg-white/25 hover:bg-white/40'
              }`}
            >
              {i === idx && (
                <span
                  key={progressKey.current}
                  className="absolute inset-y-0 left-0 bg-accent rounded-full"
                  style={{ animation: `progressFill ${SLIDE_DURATION}ms linear forwards` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes progressFill {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
