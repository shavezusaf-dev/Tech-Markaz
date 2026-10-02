import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/ui/Icon';
import Reveal from '../../components/ui/Reveal';

export default function DeletePage() {
  const { signOut } = useAuth();
  const { toast } = useToast();

  const del = () => {
    if (!confirm('Are you absolutely sure? This cannot be undone.')) return;
    toast('Account deletion requested. Contact support to confirm.', 'info');
  };

  return (
    <div className="max-w-[820px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <Reveal direction="up">
        <div className="mb-5 flex items-center gap-3">
          <Link to="/account/settings" className="glass-icon-btn">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <div>
            <h1 className="text-[20px] md:text-[24px] font-black">Delete Account</h1>
            <p className="text-[12.5px] text-muted font-semibold">This action is permanent</p>
          </div>
        </div>
      </Reveal>

      <Reveal direction="up" delay={80}>
        <div className="glass-tile rounded-2xl p-6 md:p-8 ring-2 ring-bad/30">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-12 h-12 rounded-2xl bg-bad/15 text-bad flex items-center justify-center">
                <Icon name="trash" size={22} />
              </span>
              <h2 className="text-[16px] font-black text-bad">Delete Your Account Permanently</h2>
            </div>

            <p className="text-[13.5px] leading-relaxed text-ink-2 font-medium mb-4">
              Before you proceed, please understand what happens:
            </p>

            <ul className="space-y-2 mb-6 text-[13px] leading-relaxed text-ink-2 font-medium">
              <li className="flex gap-2"><span className="text-bad font-black">·</span> All order history will be permanently deleted</li>
              <li className="flex gap-2"><span className="text-bad font-black">·</span> Wishlist and saved addresses removed</li>
              <li className="flex gap-2"><span className="text-bad font-black">·</span> Store credits and vouchers forfeited</li>
              <li className="flex gap-2"><span className="text-bad font-black">·</span> You'll be signed out immediately</li>
              <li className="flex gap-2"><span className="text-bad font-black">·</span> This action cannot be undone</li>
            </ul>

            <button onClick={del} className="btn-primary bg-bad hover:bg-[#DC2626] w-full">
              I understand — Delete My Account
            </button>
            <button onClick={() => signOut()} className="btn-ghost w-full mt-2.5">
              Just Sign Out Instead
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
