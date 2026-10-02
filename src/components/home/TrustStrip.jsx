import Icon from '../ui/Icon';

const ITEMS = [
  { title: 'Secure Payments', sub: 'Bank-grade encryption', icon: 'shield' },
  { title: 'Fast Shipping', sub: 'Delivered in 2-4 days', icon: 'truck' },
  { title: '24/7 Support', sub: "We're always here to help", icon: 'message' },
  { title: 'Easy Returns', sub: '7-day return window', icon: 'rotate' },
];

export default function TrustStrip() {
  return (
    <section className="px-[4%] md:px-[5%] pb-10 max-w-[1560px] mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {ITEMS.map((it) => (
          <div
            key={it.title}
            className="glass-tile rounded-2xl p-4 md:p-5 flex items-center gap-3.5 group"
          >
            <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-light to-brand-lighter text-brand flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110">
              <Icon name={it.icon} size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 relative z-10">
              <div className="text-[13.5px] font-extrabold text-ink truncate">
                {it.title}
              </div>
              <div className="text-[11.5px] text-muted font-medium truncate">
                {it.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
