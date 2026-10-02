import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { fmt } from '../../lib/format';
import Icon from '../../components/ui/Icon';

export default function Wallet() {
  const { user, isAdmin } = useSeller();
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        let q = supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false });
        if (!isAdmin) q = q.eq('seller_id', user.id);
        const { data } = await q;
        const list = data || [];

        let bal = 0;
        if (!isAdmin) {
          const sr = await supabase.from('sellers').select('wallet_balance').eq('id', user.id).maybeSingle();
          bal = Number(sr.data?.wallet_balance) || 0;
        } else {
          bal = list.reduce((s, t) => s + (t.type === 'credit' ? Number(t.amount || 0) : -Number(t.amount || 0)), 0);
        }

        if (!cancelled) { setTxs(list); setBalance(bal); }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, isAdmin]);

  return (
    <div className="space-y-5">
      <div className="glass-tile rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-32 -right-20 w-80 h-80 bg-[radial-gradient(circle,rgba(0,71,255,0.35),transparent_65%)] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="text-[11px] font-extrabold text-muted uppercase tracking-[1.2px] mb-2">
            Available Balance
          </div>
          <div className="text-[38px] md:text-[46px] font-black text-brand leading-none tracking-tight mb-2">
            {loading ? '—' : fmt(balance)}
          </div>
          <div className="text-[12.5px] text-muted font-semibold mb-5">
            Earned from completed orders · Platform fee 5% + Tax 2%
          </div>
          <button className="btn-ghost text-xs py-2.5 px-4">
            Request Payout
          </button>
        </div>
      </div>

      <div className="glass-tile-flat rounded-2xl overflow-hidden">
        <div className="relative z-10 px-5 py-4 border-b border-line/60">
          <h3 className="font-black text-[15px]">Transactions</h3>
          <p className="text-[11.5px] text-muted font-semibold mt-0.5">
            Gross → Fees & Tax → Net payout
          </p>
        </div>
        <div className="relative z-10">
          {loading ? (
            <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-surface-2/60 animate-pulse" />)}</div>
          ) : txs.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-[13.5px] font-extrabold text-ink mb-1">No transactions yet</div>
              <div className="text-[12px] text-muted">Earnings appear when orders are delivered.</div>
            </div>
          ) : (
            txs.map((t) => {
              const isCredit = t.type === 'credit';
              return (
                <div key={t.id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-line/30 last:border-0">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isCredit ? 'bg-ok/15 text-ok' : 'bg-bad/15 text-bad'
                  }`}>
                    <Icon name={isCredit ? 'arrowRight' : 'arrowLeft'} size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-extrabold">{t.type === 'credit' ? 'Credit' : 'Debit'}</div>
                    <div className="text-[11px] text-muted font-medium truncate">{t.description || '-'}</div>
                  </div>
                  <div className={`text-[14px] font-black text-right ${isCredit ? 'text-ok' : 'text-bad'}`}>
                    {isCredit ? '+' : '-'}{fmt(t.amount)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

