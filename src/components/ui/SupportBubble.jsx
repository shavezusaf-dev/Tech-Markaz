import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';

export default function SupportBubble() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (pathname === '/support') return null;

  return (
    <button
      onClick={() => navigate('/support')}
      title="Chat with support"
      className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[500] w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95"
      style={{
        background: 'linear-gradient(135deg, #0047FF 0%, #0033CC 100%)',
        boxShadow: '0 12px 30px rgba(0,71,255,0.42), inset 0 1px 0 rgba(255,255,255,0.35)',
      }}
    >
      <Icon name="message" size={22} color="white" strokeWidth={2.4} />
      <span
        className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-ok border-2 border-white"
        style={{ animation: 'bubblePulse 2s ease-in-out infinite' }}
      />
      <style>{`
        @keyframes bubblePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
      `}</style>
    </button>
  );
}
