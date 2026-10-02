import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';
import Icon from '../ui/Icon';
import { fmt } from '../../lib/format';

export default function TrackOrderModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const onOpen = () => { setOpen(true); setQuery(''); setOrders([]); setSearched(false); };
    document.addEventListener('open-track', onOpen);
    return () => document.removeEventListener('open-track', onOpen);
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setBusy(true);
    setSearched(true);
    let found = [];

    try {
      if (query.toUpperCase().startsWith('TM-')) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', query.toUpperCase())
          .limit(5);
        found = data || [];
      }
      if (!found.length && query.includes('@')) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('guest_email', query.toLowerCase())
          .order('created_at', { ascending: false })
          .limit(10);
        found = data || [];
      }
      if (!found.length) {
        const digits = query.replace(/\D/g, '');
        if (digits.length >= 10) {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(30);
          found = (data || []).filter((o) => {
            const op = (o.guest_phone || '').replace(/\D/g, '');
            return op.includes(digits) || digits.includes(op);
          });
        }
      }
    } catch {}

    setOrders(found);
    setBusy(false);
  };

  const steps = (o) => [
    { label: 'Order Placed', done: true, time: o.created_at },
    { label: 'Dispatched', done: o.status === 'Dispatched' || o.status === 'Delivered', time: o.dispatched_at },
    { label: 'Delivered', done: o.status === 'Delivered', time: o.delivered_at },
  ];

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Track Your Order" maxWidth="max-w-[600px]">
      <p className="text-[13px] text-muted -mt-2 mb-4">
        Enter your order number, email, or phone number.
      </p>

      <div className="flex gap-2 mb-5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="TM-XXXX or email or phone"
          className="form-input flex-1 mb-0"
        />
        <button onClick={search} disabled={busy} className="btn-primary px-5 shrink-0">
          {busy ? '...' : <Icon name="search" size={16} color="white" />}
        </button>
      </div>

      {searched && orders.length === 0 && !busy && (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">📦</div>
          <div className="font-extrabold text-ink mb-1">Order not found</div>
          <div className="text-[12.5px] text-muted">Double-check your details and try again.</div>
        </div>
      )}

      {orders.map((o) => (
        <div key={o.id} className="bg-surface-2 rounded-2xl p-5 mb-3 border border-line">
          <div className="flex justify-between items-center gap-3 mb-3 flex-wrap">
            <span className="font-mono font-extrabold text-brand text-[13.5px]">
              #{o.order_number || o.id.split('-')[0].toUpperCase()}
            </span>
            <span className="bg-brand-light text-brand px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase">
              {o.status}
            </span>
          </div>
          <div className="text-[12.5px] text-muted font-medium mb-4">
            {o.items_summary || '—'}
          </div>
          <div className="text-[15px] font-black text-ink mb-4">{fmt(o.total_amount)}</div>
          <div className="relative pl-8">
            {steps(o).map((s, i, arr) => (
              <div key={s.label} className="relative pb-5 last:pb-0">
                <div
                  className={`absolute -left-8 top-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-black border-2 ${
                    s.done ? 'bg-ok border-ok text-white' : 'bg-surface border-line text-muted'
                  }`}
                >
                  {s.done && <Icon name="check" size={11} color="white" strokeWidth={3} />}
                </div>
                {i < arr.length - 1 && (
                  <div
                    className={`absolute -left-[21px] top-[22px] bottom-0 w-[2px] ${
                      s.done ? 'bg-ok' : 'bg-line'
                    }`}
                  />
                )}
                <div className={`text-[13.5px] font-extrabold ${s.done ? 'text-ok' : 'text-ink'}`}>
                  {s.label}
                </div>
                {s.time && (
                  <div className="text-[11.5px] text-muted font-medium mt-0.5">
                    {new Date(s.time).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  );
}
