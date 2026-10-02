/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0047FF',
          dark: '#0033CC',
          deep: '#0029A3',
          light: '#EBF0FF',
          lighter: '#D6E1FF',
        },
        accent: { DEFAULT: '#FFCC00', dark: '#E6B800' },
        brandOrange: '#FF7A00',
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          2: 'rgb(var(--c-ink-2) / <alpha-value>)',
          3: 'rgb(var(--c-ink-3) / <alpha-value>)',
        },
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--c-surface) / <alpha-value>)',
          2: 'rgb(var(--c-surface-2) / <alpha-value>)',
          3: 'rgb(var(--c-surface-3) / <alpha-value>)',
        },
        ok: '#10B981',
        warn: '#F59E0B',
        bad: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp .5s cubic-bezier(.16,1,.3,1)',
        'toast-in': 'toastIn .4s cubic-bezier(.34,1.4,.64,1)',
        'slide-left': 'slideLeft .4s cubic-bezier(.16,1,.3,1)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateX(80px) scale(.9)' },
          to: { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        slideLeft: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
