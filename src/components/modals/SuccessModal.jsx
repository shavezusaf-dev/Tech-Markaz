import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Icon from '../ui/Icon';

export default function SuccessModal() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onOpen = (e) => { setData(e.detail); setOpen(true); };
    document.addEventListener('open-success', onOpen);
    return () => document.removeEventListener('open-success', onOpen);
  }, []);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="" maxWidth="max-w-[460px]">
      <div className="text-center -mt-3">
        <div className="w-20 h-20 rounded-full bg-ok/15 text-ok flex items-center justify-center mx-auto mb-5">
          <Icon name="check" size={38} color="currentColor" strokeWidth={3} />
        </div>

        <h2 className="text-[22px] font-black mb-3">Order Confirmed</h2>

        <p className="text-[13.5px] text-muted leading-relaxed mb-5">
          Thanks{data?.email ? `, ${data.email.split('@')[0]}` : ''}. Your order has been placed.
          {data?.method === 'bank'
            ? " We'll verify your payment and dispatch shortly."
            : " We've sent a confirmation to your email."}
        </p>

        <div className="bg-surface-2 rounded-xl p-4 mb-5">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-1">
            Order Number
          </div>
          <div className="font-mono font-black text-brand text-[18px]">
            {data?.orderNum || '—'}
          </div>
        </div>

        <button
          onClick={() => { setOpen(false); navigate('/'); }}
          className="btn-primary w-full mb-2"
        >
          Continue Shopping
        </button>
        <button
          onClick={() => { setOpen(false); navigate('/account/orders'); }}
          className="btn-ghost w-full"
        >
          View My Orders
        </button>
      </div>
    </Modal>
  );
}
