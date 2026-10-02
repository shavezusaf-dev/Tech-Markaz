import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import Reveal from '../../components/ui/Reveal';

export default function ReturnsPage() {
  return (
    <div className="max-w-[820px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account/settings" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div>
            <h1 className="text-[20px] md:text-[24px] font-black">Returns & Refunds</h1>
            <p className="text-[12.5px] text-muted font-semibold">Our hassle-free policy</p>
          </div>
        </div>
      </Reveal>

      <Reveal direction="up" delay={80}>
        <div className="glass-tile rounded-2xl p-6 md:p-8">
          <div className="relative z-10">
            <div className="rounded-2xl bg-ok/10 border border-ok/30 p-4 text-[13px] font-semibold text-ok mb-5">
              7-day return window from delivery. No questions asked if unopened.
            </div>

            <h3 className="text-[14px] font-black mb-2.5">What can be returned</h3>
            <ul className="space-y-1.5 mb-5 text-[13px] leading-relaxed text-ink-2 font-medium">
              <li className="flex gap-2"><span className="text-brand font-black">·</span> Unopened products in original packaging</li>
              <li className="flex gap-2"><span className="text-brand font-black">·</span> Products with manufacturing defects</li>
              <li className="flex gap-2"><span className="text-brand font-black">·</span> Items that don't match the description</li>
              <li className="flex gap-2"><span className="text-brand font-black">·</span> Damaged items received in shipping</li>
            </ul>

            <h3 className="text-[14px] font-black mb-2.5">How to request</h3>
            <ol className="space-y-1.5 mb-5 text-[13px] leading-relaxed text-ink-2 font-medium list-inside">
              <li>1. Go to <b>My Orders</b></li>
              <li>2. Select the order and click <b>Request Return</b></li>
              <li>3. Choose a reason and upload photos</li>
              <li>4. Our team reviews within 24 hours</li>
            </ol>

            <h3 className="text-[14px] font-black mb-2.5">Refund timeline</h3>
            <p className="text-[13px] leading-relaxed text-ink-2 font-medium mb-5">
              Once approved, refunds process within 5-7 business days to your original payment method or as store credit.
            </p>

            <div className="rounded-2xl bg-surface-2 border border-line p-4 flex items-center gap-3">
              <Icon name="message" size={18} className="text-brand shrink-0" />
              <span className="text-[13px] font-semibold text-ink-2">
                Need help? Chat with us or call 0300-TECHMARKAZ
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
