import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import Reveal from '../../components/ui/Reveal';

export default function PaymentsPage() {
  return (
    <div className="max-w-[820px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account/settings" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div>
            <h1 className="text-[20px] md:text-[24px] font-black">Payment Methods</h1>
            <p className="text-[12.5px] text-muted font-semibold">Manage how you pay</p>
          </div>
        </div>
      </Reveal>

      <div className="space-y-3">
        <Reveal direction="up" delay={80}>
          <div className="glass-tile-flat rounded-2xl p-5 flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-brand-light text-brand flex items-center justify-center shrink-0">
              <Icon name="creditCard" size={20} />
            </span>
            <div className="flex-1">
              <div className="text-[14px] font-extrabold text-ink">Cash on Delivery</div>
              <div className="text-[12px] text-muted font-medium">Default payment method · available nationwide</div>
            </div>
            <span className="bg-ok/15 text-ok text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">Default</span>
          </div>
        </Reveal>

        <Reveal direction="up" delay={120}>
          <div className="glass-tile-flat rounded-2xl p-5 flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-brand-light text-brand flex items-center justify-center shrink-0">
              <Icon name="wallet" size={20} />
            </span>
            <div className="flex-1">
              <div className="text-[14px] font-extrabold text-ink">Bank Transfer</div>
              <div className="text-[12px] text-muted font-medium">Meezan Bank · verified within 24 hours</div>
            </div>
            <span className="bg-brand-light text-brand text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">Available</span>
          </div>
        </Reveal>

        <Reveal direction="up" delay={160}>
          <div className="glass-tile-flat rounded-2xl p-5 flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-surface-2 text-muted flex items-center justify-center shrink-0">
              <Icon name="creditCard" size={20} />
            </span>
            <div className="flex-1">
              <div className="text-[14px] font-extrabold text-ink">Saved Cards</div>
              <div className="text-[12px] text-muted font-medium">Coming soon — save cards for faster checkout</div>
            </div>
            <span className="bg-surface-2 text-muted text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">Soon</span>
          </div>
        </Reveal>

        <Reveal direction="up" delay={200}>
          <div className="glass-tile-flat rounded-2xl p-5 flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-surface-2 text-muted flex items-center justify-center shrink-0">
              <Icon name="tag" size={20} />
            </span>
            <div className="flex-1">
              <div className="text-[14px] font-extrabold text-ink">EMI & Installments</div>
              <div className="text-[12px] text-muted font-medium">Coming soon — pay in easy monthly installments</div>
            </div>
            <span className="bg-surface-2 text-muted text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">Soon</span>
          </div>
        </Reveal>
      </div>

      <div className="rounded-2xl bg-brand-light/40 border border-brand-lighter p-4 text-[12.5px] text-brand font-semibold mt-5">
        <b>Tip:</b> Save up to Rs. 3,000 in delivery charges per year by choosing COD for orders under Rs. 3,000.
      </div>
    </div>
  );
}
