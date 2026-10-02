import Icon from '../ui/Icon';

const SERVICES = [
  { title: 'Fast Delivery', sub: '2-4 days nationwide', icon: 'truck', tone: 'green' },
  { title: '7-Day Returns', sub: 'Easy & hassle-free', icon: 'rotate', tone: 'orange' },
  { title: 'Cash on Delivery', sub: 'Pay when you receive', icon: 'creditCard', tone: 'blue' },
  { title: '100% Genuine', sub: 'Verified sellers only', icon: 'shield', tone: 'purple' },
];

const TONE = {
  green: 'bg-gradient-to-br from-[#E7F8F1] to-[#C7EEDC] text-[#10B981]',
  orange: 'bg-gradient-to-br from-[#FEF3E2] to-[#FCE0B8] text-[#F59E0B]',
  blue: 'bg-gradient-to-br from-[#EBF0FF] to-[#D6E1FF] text-[#0047FF]',
  purple: 'bg-gradient-to-br from-[#F3E8FF] to-[#E4D0FF] text-[#7C3AED]',
};

export default function ServiceRow() {
  return (
    <div className="px-[4%] md:px-[5%] py-4 max-w-[1560px] mx-auto w-full grid grid-cols-2 md:grid-cols-4 gap-3">
      {SERVICES.map((s) => (
        <div
          key={s.title}
          className="glass-tile rounded-2xl px-4 md:px-5 py-4 flex items-center gap-3"
        >
          <div
            className={`relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${TONE[s.tone]}`}
          >
            <Icon name={s.icon} size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 relative z-10">
            <div className="text-[12.5px] md:text-[13.5px] font-extrabold text-ink truncate">
              {s.title}
            </div>
            <div className="text-[11px] md:text-[11.5px] text-muted font-medium truncate">
              {s.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
