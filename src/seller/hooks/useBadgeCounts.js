import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';

export function useBadgeCounts() {
  const { user, isAdmin } = useSeller();
  const [counts, setCounts] = useState({ orders: 0, payments: 0, messages: 0, support: 0 });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      try {
        // Orders badge
        let oq = supabase
          .from('orders')
          .select('id,payment_method,payment_status')
          .eq('status', 'Un-processed');
        if (!isAdmin) oq = oq.eq('seller_id', user.id);
        const { data: orders } = await oq;

        const visibleOrders = isAdmin
          ? orders || []
          : (orders || []).filter(
              (o) =>
                !o.payment_method ||
                o.payment_method === 'cod' ||
                (o.payment_method === 'bank_transfer' && o.payment_status === 'verified')
            );

        // Payments badge (admin only)
        let paymentsCount = 0;
        if (isAdmin) {
          const { data: payments } = await supabase
            .from('orders')
            .select('id,payment_status')
            .eq('payment_method', 'bank_transfer');
          paymentsCount = (payments || []).filter(
            (p) => !p.payment_status || p.payment_status === 'awaiting_verification'
          ).length;
        }

        // Messages badge — customer↔seller conversations
        let messagesCount = 0;
        let convQ = supabase
          .from('conversations')
          .select('id')
          .eq('kind', 'customer_seller');
        if (!isAdmin) convQ = convQ.eq('seller_id', user.id);
        const { data: convs } = await convQ;
        const convIds = (convs || []).map((c) => c.id);
        if (convIds.length > 0) {
          const { data: msgs } = await supabase
            .from('chat_messages')
            .select('conversation_id')
            .in('conversation_id', convIds)
            .eq('sender_type', 'customer')
            .is('read_at', null);
          messagesCount = new Set((msgs || []).map((m) => m.conversation_id)).size;
        }

        // Support badge (admin only)
        let supportCount = 0;
        if (isAdmin) {
          const { data: supportConvs } = await supabase
            .from('conversations')
            .select('id')
            .eq('kind', 'support');
          const sids = (supportConvs || []).map((c) => c.id);
          if (sids.length > 0) {
            const { data: sMsgs } = await supabase
              .from('chat_messages')
              .select('conversation_id')
              .in('conversation_id', sids)
              .eq('sender_type', 'customer')
              .is('read_at', null);
            supportCount = new Set((sMsgs || []).map((m) => m.conversation_id)).size;
          }
        }

        if (!cancelled) {
          setCounts({
            orders: visibleOrders.length,
            payments: paymentsCount,
            messages: messagesCount,
            support: supportCount,
          });
        }
      } catch (e) {
        console.warn('[badges]', e);
      }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, isAdmin]);

  return counts;
}
