import { Link } from 'react-router-dom';
import Icon from './Icon';

export default function Brand({ size = 'md', link = true }) {
  const sizes = {
    sm: { mark: 34, icon: 15, name: 'text-[13px]', tag: 'hidden' },
    md: { mark: 40, icon: 18, name: 'text-[14px] md:text-base', tag: 'hidden md:block text-[7.5px]' },
    lg: { mark: 48, icon: 22, name: 'text-lg', tag: 'text-[8px]' },
  };
  const s = sizes[size];

  const inner = (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className="rounded-xl bg-brand flex items-center justify-center text-white relative shrink-0 shadow-md"
        style={{ width: s.mark, height: s.mark }}
      >
        <Icon name="home" size={s.icon} />
        <span
          className="absolute rounded-full bg-brandOrange border-[1.5px] border-brand"
          style={{
            width: s.mark / 4.4,
            height: s.mark / 4.4,
            top: s.mark / 9,
            right: s.mark / 9,
          }}
        />
      </div>
      <div className="flex flex-col leading-none min-w-0">
        <div className={`${s.name} font-black tracking-tight whitespace-nowrap`}>
          TECH <span className="text-brandOrange">MARKAZ</span>
        </div>
        {s.tag !== 'hidden' && (
          <div className={`${s.tag} font-extrabold tracking-[1.4px] text-muted mt-1 uppercase whitespace-nowrap`}>
            Premium Electronics Marketplace
          </div>
        )}
      </div>
    </div>
  );

  return link ? <Link to="/" className="shrink-0">{inner}</Link> : inner;
}
