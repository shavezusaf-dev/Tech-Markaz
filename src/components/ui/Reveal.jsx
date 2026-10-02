import { useEffect, useRef, useState } from 'react';

export default function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const hidden = {
    up:    'opacity-0 translate-y-10',
    down:  'opacity-0 -translate-y-10',
    left:  'opacity-0 -translate-x-10',
    right: 'opacity-0 translate-x-10',
    zoom:  'opacity-0 translate-y-6',
    fade:  'opacity-0',
  }[direction];

  const shown = 'opacity-100 translate-x-0 translate-y-0';

  return (
    <div
      ref={ref}
      className={`transform-gpu transition-[opacity,transform] duration-[600ms] ease-[cubic-bezier(.22,1,.36,1)] ${
        visible ? shown : hidden
      } ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        willChange: visible ? 'auto' : 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
}
