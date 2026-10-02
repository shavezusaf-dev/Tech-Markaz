import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import Reveal from '../../components/ui/Reveal';

export default function AboutPage() {
  return (
    <div className="max-w-[820px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account/settings" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div>
            <h1 className="text-[20px] md:text-[24px] font-black">About Tech Markaz</h1>
            <p className="text-[12.5px] text-muted font-semibold">Our story & mission</p>
          </div>
        </div>
      </Reveal>

      <Reveal direction="up" delay={80}>
        <div className="glass-tile rounded-2xl p-6 md:p-8">
          <div className="relative z-10 space-y-5">
            <div>
              <h2 className="text-[18px] font-black mb-2">Pakistan's Premium Electronics Marketplace</h2>
              <p className="text-[13.5px] leading-relaxed text-ink-2 font-medium">
                Tech Markaz connects buyers with verified sellers of electronics and appliances
                across Pakistan. Every seller is vetted, every product is verified.
              </p>
            </div>

            <div className="rounded-2xl bg-brand-light/60 border border-brand-lighter p-4 text-[13px] font-semibold text-brand">
              Over 200+ verified sellers · 50,000+ products · Nationwide delivery in 2-4 days
            </div>

            <div>
              <h3 className="text-[15px] font-black mb-3">What we stand for</h3>
              <ul className="space-y-2 text-[13.5px] leading-relaxed text-ink-2 font-medium">
                <li className="flex gap-2"><span className="text-brand font-black">·</span> Genuine products only — every seller is verified</li>
                <li className="flex gap-2"><span className="text-brand font-black">·</span> Fast nationwide shipping — from Karachi to Gilgit</li>
                <li className="flex gap-2"><span className="text-brand font-black">·</span> Fair prices — direct from sellers, no markup</li>
                <li className="flex gap-2"><span className="text-brand font-black">·</span> Real support — real humans, 24/7</li>
              </ul>
            </div>

            <div>
              <h3 className="text-[15px] font-black mb-3">Contact</h3>
              <div className="space-y-2">
                {[
                  { icon: 'phone', text: '0300-TECHMARKAZ · Mon-Sun 9am-11pm' },
                  { icon: 'mail', text: 'admin.techmarkaz@gmail.com' },
                  { icon: 'mapPin', text: 'Karachi, Pakistan' },
                ].map((c) => (
                  <div key={c.text} className="flex items-center gap-3 text-[13px] font-semibold text-ink-2">
                    <Icon name={c.icon} size={15} className="text-brand shrink-0" />
                    {c.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
