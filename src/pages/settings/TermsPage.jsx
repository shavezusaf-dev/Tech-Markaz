import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import Reveal from '../../components/ui/Reveal';

const SECTIONS = [
  { title: '1. Use of Service', body: 'Tech Markaz provides an online marketplace connecting buyers with verified sellers. You agree to use the service lawfully and not for any prohibited purpose.' },
  { title: '2. Account Responsibilities', body: 'You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately of any unauthorized access.' },
  { title: '3. Orders & Payment', body: 'All orders are subject to acceptance and availability. We accept Cash on Delivery and Bank Transfer. Prices are in Pakistani Rupees.' },
  { title: '4. Shipping & Delivery', body: 'Standard delivery takes 2-4 business days nationwide. Timelines may vary based on location and product availability.' },
  { title: '5. Returns & Refunds', body: 'Products may be returned within 7 days of delivery if unopened and in original packaging. Refer to our Returns Policy for details.' },
  { title: '6. Privacy', body: 'We collect only the information necessary to process your orders. We never sell your data to third parties.' },
];

export default function TermsPage() {
  return (
    <div className="max-w-[820px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account/settings" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div>
            <h1 className="text-[20px] md:text-[24px] font-black">Legal Terms</h1>
            <p className="text-[12.5px] text-muted font-semibold">Terms of Service · Last updated Jan 2026</p>
          </div>
        </div>
      </Reveal>

      <Reveal direction="up" delay={80}>
        <div className="glass-tile rounded-2xl p-6 md:p-8">
          <div className="relative z-10">
            <div className="rounded-2xl bg-brand-light/60 border border-brand-lighter p-4 text-[13px] font-semibold text-brand mb-5">
              By using Tech Markaz, you agree to these terms. Please read carefully.
            </div>
            {SECTIONS.map((s) => (
              <div key={s.title} className="mb-4">
                <h3 className="text-[14px] font-black mb-2">{s.title}</h3>
                <p className="text-[13px] leading-relaxed text-ink-2 font-medium">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
