import { Link } from 'react-router-dom';
import Icon from './Icon';

export default function Brand({ size = 'md', link = true }) {
  const sizes = {
    sm: { mark: 36, icon: 16, name: 'text-sm', tag: 'text-[7px]' },
    md: { mark: 42, icon: 19, name: 'text-base', tag: 'text-[7.5px]' },
    lg: { mark: 48, icon: 22, name: 'text-lg', tag: 'text-[8px]' },
  };
  const s = sizes[size];

  const inner = (
    <div className="flex items-center gap-2.5">
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
      <div className="flex flex-col leading-none">
        <div className={`${s.name} font-black tracking-tight`}>
          TECH <span className="text-brandOrange">MARKAZ</span>
        </div>
        <div className={`${s.tag} font-extrabold tracking-[1.4px] text-muted mt-1 uppercase`}>
          Premium Electronics Marketplace
        </div>
      </div>
    </div>
  );

  return link ? <Link to="/">{inner}</Link> : inner;
}
