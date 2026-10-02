import { supabase } from './supabase';

export function getGuestId() {
  let id = localStorage.getItem('tm_guest_id');
  if (!id) {
    id = 'guest-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('tm_guest_id', id);
  }
  return id;
}

// ─── Customer ↔ Seller ────────────────────────────────
export async function getOrCreateConversation({ customerId, guestEmail, guestName, sellerId, productId }) {
  if (!sellerId) throw new Error('No seller for this product');

  let q = supabase
    .from('conversations')
    .select('*')
    .eq('kind', 'customer_seller')
    .eq('seller_id', sellerId);
  if (customerId) q = q.eq('customer_id', customerId);
  else q = q.eq('guest_email', guestEmail).is('customer_id', null);

  const { data: existing } = await q.maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('conversations')
    .insert([{
      kind: 'customer_seller',
      customer_id: customerId || null,
      guest_email: guestEmail || null,
      guest_name: guestName || null,
      seller_id: sellerId,
      product_id: productId || null,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Admin ↔ Seller ─────────────────────────────────
export async function getOrCreateAdminSellerConversation(sellerId) {
  if (!sellerId) throw new Error('No seller');

  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('kind', 'admin_seller')
    .eq('seller_id', sellerId)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('conversations')
    .insert([{
      kind: 'admin_seller',
      customer_id: null,
      guest_email: '__admin__',
      guest_name: 'Tech Markaz Admin',
      seller_id: sellerId,
      product_id: null,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Customer ↔ Admin Support ────────────────────────
export async function getOrCreateSupportConversation({ customerId, guestEmail, guestName }) {
  let q = supabase.from('conversations').select('*').eq('kind', 'support');
  if (customerId) q = q.eq('customer_id', customerId);
  else q = q.eq('guest_email', guestEmail).is('customer_id', null);

  const { data: existing } = await q.maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('conversations')
    .insert([{
      kind: 'support',
      customer_id: customerId || null,
      guest_email: guestEmail || null,
      guest_name: guestName || 'Customer',
      seller_id: null,
      product_id: null,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSupportConversationForUser(customerId, guestEmail) {
  let q = supabase.from('conversations').select('*').eq('kind', 'support');
  if (customerId) q = q.eq('customer_id', customerId);
  else q = q.eq('guest_email', guestEmail).is('customer_id', null);

  const { data } = await q.order('last_message_at', { ascending: false }).limit(1).maybeSingle();
  return data || null;
}

export async function getAllSupportConversations() {
  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('kind', 'support')
    .order('last_message_at', { ascending: false });
  return data || [];
}

export function isAdminConversation(conv) {
  if (!conv) return false;
  if (conv.kind) return conv.kind === 'admin_seller';
  return conv.guest_email === '__admin__';
}

export function isSupportConversation(conv) {
  return conv?.kind === 'support';
}

// ─── Messages ──────────────────────────────────────
export async function fetchMessages(conversationId, limit = 100) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function uploadChatMedia(file, kind) {
  const ext = (file.name && file.name.split('.').pop()) || (kind === 'audio' ? 'webm' : 'jpg');
  const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from('chat-media')
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
  return data.publicUrl;
}

export async function sendChatMessage({
  conversationId, senderType, senderId, body, imageUrl, audioUrl, durationSeconds, productRef,
}) {
  let preview = body || '';
  if (!preview) {
    if (productRef) preview = 'Product: ' + productRef.title;
    else if (imageUrl) preview = 'Photo';
    else if (audioUrl) preview = 'Voice message';
  }

  const row = {
    conversation_id: conversationId,
    sender_type: senderType,
    sender_id: senderId || null,
    body: body || null,
    image_url: imageUrl || null,
    audio_url: audioUrl || null,
    duration_seconds: durationSeconds || null,
  };
  if (productRef) {
    row.product_ref_id = productRef.id;
    row.product_ref_title = productRef.title;
    row.product_ref_price = productRef.price;
    row.product_ref_image = productRef.image;
  }

  const { data, error } = await supabase.from('chat_messages').insert([row]).select().single();
  if (error) throw error;

  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: preview,
    })
    .eq('id', conversationId);

  return data;
}

export function subscribeToMessages(conversationId, onChange) {
  const channel = supabase
    .channel(`chat:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, (payload) => onChange(payload.new))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function deleteConversation(conversationId) {
  if (!conversationId) return;
  const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
  if (error) throw error;
}
