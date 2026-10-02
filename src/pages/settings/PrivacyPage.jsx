import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';
import Reveal from '../../components/ui/Reveal';

export default function PrivacyPage() {
  const { toast } = useToast();

  const download = () => {
    toast('Data export will be emailed to you within 24 hours', 'ok');
  };

  return (
    <div className="max-w-[820px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account/settings" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div>
            <h1 className="text-[20px] md:text-[24px] font-black">Privacy & Data</h1>
            <p className="text-[12.5px] text-muted font-semibold">Control your data</p>
          </div>
        </div>
      </Reveal>

      <div className="space-y-4">
        <Reveal direction="up" delay={80}>
          <div className="glass-tile-flat rounded-2xl p-5">
            <div className="relative z-10">
              <h3 className="text-[15px] font-black mb-1.5">Your data, your control</h3>
              <p className="text-[13px] text-ink-2 font-medium leading-relaxed mb-3">
                We collect only what's needed to run your account and process orders. We never sell your data.
              </p>
              <ul className="space-y-1.5 text-[12.5px] text-ink-2 font-medium">
                <li className="flex gap-2"><span className="text-brand font-black">·</span> Account info (name, email, phone, addresses)</li>
                <li className="flex gap-2"><span className="text-brand font-black">·</span> Order history and delivery addresses</li>
                <li className="flex gap-2"><span className="text-brand font-black">·</span> Wishlist and preferences</li>
                <li className="flex gap-2"><span className="text-brand font-black">·</span> Chat history with sellers and support</li>
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal direction="up" delay={120}>
          <div className="glass-tile-flat rounded-2xl overflow-hidden">
            <button
              onClick={download}
              className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-brand-light/40 transition text-left"
            >
              <span className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                <Icon name="upload" size={16} />
              </span>
              <div className="flex-1">
                <div className="text-[13.5px] font-extrabold text-ink">Download my data</div>
                <div className="text-[11.5px] text-muted font-semibold">Get a copy of everything we have on you</div>
              </div>
              <Icon name="chevronRight" size={15} className="text-muted" />
            </button>
            <Link
              to="/account/settings/delete"
              className="flex items-center gap-3.5 px-5 py-3.5 border-t border-line/40 hover:bg-bad/5 transition"
            >
              <span className="w-10 h-10 rounded-xl bg-bad/15 text-bad flex items-center justify-center shrink-0">
                <Icon name="trash" size={16} />
              </span>
              <div className="flex-1">
                <div className="text-[13.5px] font-extrabold text-bad">Delete my account</div>
                <div className="text-[11.5px] text-muted font-semibold">Permanently remove everything</div>
              </div>
              <Icon name="chevronRight" size={15} className="text-bad" />
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
