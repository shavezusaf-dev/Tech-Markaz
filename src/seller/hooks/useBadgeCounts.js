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
        let oq = supabase.from('orders').select('id,payment_method,payment_status').eq('status', 'Un-processed');
        if (!isAdmin) oq = oq.eq('seller_id', user.id);
        const { data: orders } = await oq;

        const visibleOrders = isAdmin
          ? orders || []
          : (orders || []).filter((o) => !o.payment_method || o.payment_method === 'cod' || (o.payment_method === 'bank_transfer' && o.payment_status === 'verified'));

        // Payments badge (admin only)
        let paymentsCount = 0;
        if (isAdmin) {
          const { data: payments } = await supabase.from('orders').select('id,payment_status').eq('payment_method', 'bank_transfer');
          paymentsCount = (payments || []).filter((p) => !p.payment_status || p.payment_status === 'awaiting_verification').length;
        }

        // ─── Messages badge ───
        // For seller: their own customer↔seller + admin_seller conversations
        // For admin: all admin_seller conversations + all support conversations
        let messagesCount = 0;
        let supportCount = 0;

        if (isAdmin) {
          // Admin receives from: admin_seller chats (seller replied) + support chats (customer wrote)
          const { data: adminSellerConvs } = await supabase
            .from('conversations').select('id').eq('kind', 'admin_seller');
          const { data: supportConvs } = await supabase
            .from('conversations').select('id').eq('kind', 'support');

          const adminSellerIds = (adminSellerConvs || []).map((c) => c.id);
          const supportIds = (supportConvs || []).map((c) => c.id);
          const allIds = [...adminSellerIds, ...supportIds];

          if (allIds.length) {
            const { data: msgs } = await supabase
              .from('chat_messages').select('conversation_id, sender_id')
              .in('conversation_id', allIds).is('read_at', null);
            const unread = (msgs || []).filter((m) => m.sender_id !== user.id);
            messagesCount = unread.length;
            supportCount = unread.filter((m) => supportIds.includes(m.conversation_id)).length;
          }
        } else {
          // Seller sees only their own conversations
          const { data: convs } = await supabase
            .from('conversations').select('id').eq('seller_id', user.id);
          const ids = (convs || []).map((c) => c.id);
          if (ids.length) {
            const { data: msgs } = await supabase
              .from('chat_messages').select('id, sender_id')
              .in('conversation_id', ids).is('read_at', null);
            const unread = (msgs || []).filter((m) => m.sender_id !== user.id);
            messagesCount = unread.length;
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
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user, isAdmin]);

  return counts;
}
