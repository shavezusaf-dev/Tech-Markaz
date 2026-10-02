import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import Reveal from '../../components/ui/Reveal';

const LANGS = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'roman', name: 'Roman Urdu', native: 'Roman Urdu' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'fr', name: 'French', native: 'Français' },
];

export default function LanguagePage() {
  const [current, setCurrent] = useState(() => localStorage.getItem('tm_lang') || 'en');

  const pick = (code) => {
    setCurrent(code);
    localStorage.setItem('tm_lang', code);
  };

  return (
    <div className="max-w-[820px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account/settings" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div>
            <h1 className="text-[20px] md:text-[24px] font-black">Language</h1>
            <p className="text-[12.5px] text-muted font-semibold">Select your preferred language</p>
          </div>
        </div>
      </Reveal>

      <Reveal direction="up" delay={80}>
        <div className="glass-tile rounded-2xl overflow-hidden">
          {LANGS.map((l, i) => (
            <button
              key={l.code}
              onClick={() => pick(l.code)}
              className={`w-full relative z-10 flex items-center gap-3.5 px-5 py-4 hover:bg-brand-light/40 transition-all text-left ${
                i > 0 ? 'border-t border-line/40' : ''
              } ${current === l.code ? 'bg-brand-light/60' : ''}`}
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-[11px] ${
                current === l.code ? 'bg-brand text-white' : 'bg-surface-2 text-ink-2'
              }`}>
                {l.code.toUpperCase().slice(0, 2)}
              </span>
              <div className="flex-1">
                <div className={`text-[13.5px] font-extrabold ${current === l.code ? 'text-brand' : 'text-ink'}`}>
                  {l.name}
                </div>
                <div className="text-[11.5px] text-muted font-semibold">{l.native}</div>
              </div>
              {current === l.code && <Icon name="check" size={16} className="text-brand" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
