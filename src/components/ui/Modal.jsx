import { useEffect } from 'react';
import Icon from './Icon';

export default function Modal({
  open,
  onClose,
  children,
  title,
  maxWidth = 'max-w-[460px]',
  noScroll = false,
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[5000] bg-[#050814]/75 backdrop-blur-md flex items-center justify-center p-5 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-surface rounded-2xl w-full ${maxWidth} ${
          noScroll ? '' : 'max-h-[92vh] overflow-y-auto'
        } shadow-2xl border border-line animate-fade-up`}
      >
        <div className="sticky top-0 bg-surface px-6 pt-5 pb-4 flex justify-between items-start z-10">
          <h2 className="text-xl font-black">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-bad/10 text-muted hover:text-bad flex items-center justify-center transition"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
