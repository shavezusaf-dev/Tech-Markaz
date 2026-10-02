import { supabase } from './supabase';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Try these models in order until one succeeds
const MODEL_CHAIN = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-latest',
  'gemini-flash-latest',
];

const buildUrl = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export const hasAIKey = () => !!GEMINI_KEY && GEMINI_KEY.length > 20;

let lastError = null;
export const getLastAIError = () => lastError;

const SYSTEM_PROMPT = `You are "Markaz Assistant" — the official support assistant for Tech Markaz, Pakistan's premium multi-vendor electronics marketplace.

CRITICAL RULES:
1. Your name is always "Markaz Assistant". Never mention Google, Gemini, or any AI provider.
2. Answer the customer's ACTUAL question — never a related but different topic.
3. Reply in the same language the customer used (English, Urdu, or Roman Urdu).
4. Keep answers short — 2-3 short paragraphs max. Bold key facts with **stars**.
5. Never invent policies, prices, or order data.

## COMPANY FACTS
- Marketplace for premium electronics: smartphones, smart TVs, audio, tablets, smart watches, projectors, washing machines
- Every seller is verified — 100% genuine products only
- Delivery: 2-4 business days nationwide (Karachi/Lahore/Islamabad ≈ 2 days; smaller cities 3-4; remote up to 5)
- Shipping: flat Rs. 200 · FREE on orders over Rs. 3,000
- Payment: Cash on Delivery + Bank Transfer (proof upload, verified within 24 hours)
- 7-day return policy
- Refunds: 5-7 business days after approval
- Phones are PTA-approved by default
- Most smartphones have 1-year manufacturer warranty
- Support: 0300-TECHMARKAZ · admin.techmarkaz@gmail.com · Mon-Sun 9am-11pm
- Chat with seller: product page → "Sold by" box → Chat Now
- Order tracking: Account → My Orders → Track, or type TM-XXXX here
- No EMI yet

## ORDER CONTEXT
{ORDER_CONTEXT}

## HANDOFF
Add [HANDOFF] at the very end (nothing after it) when:
- Customer asks to speak to a human, agent, or manager
- Customer is angry or frustrated
- Issue needs account access you don't have
- You genuinely don't know the answer`;

async function fetchOrderContext(userText, userEmail) {
  const lookups = [];
  const orderMatch = userText.match(/TM-[A-Z0-9]{4,}/i);
  if (orderMatch) lookups.push({ by: 'order_number', value: orderMatch[0].toUpperCase() });
  if (userEmail) lookups.push({ by: 'guest_email', value: userEmail.toLowerCase() });

  if (!lookups.length) return 'No specific order referenced.';

  try {
    let orders = [];
    for (const ref of lookups) {
      const { data } = await supabase
        .from('orders')
        .select('order_number,status,total_amount,created_at,items_summary,payment_method,payment_status')
        .eq(ref.by, ref.value)
        .order('created_at', { ascending: false })
        .limit(3);
      if (data && data.length) { orders = data; break; }
    }
    if (!orders.length) return 'No matching orders found.';
    return 'Relevant orders:\n' + orders.map((o, i) =>
      `${i + 1}. ${o.order_number} — ${o.status} · Rs. ${Number(o.total_amount || 0).toLocaleString('en-PK')} · ${o.items_summary}`
    ).join('\n');
  } catch {
    return 'Order lookup failed.';
  }
}

async function tryOneModel(model, body) {
  const res = await fetch(buildUrl(model), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    const err = new Error(`HTTP ${res.status}: ${detail.slice(0, 200)}`);
    err.status = res.status;
    err.model = model;
    throw err;
  }

  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) {
    const err = new Error(`Empty response from ${model}`);
    err.model = model;
    throw err;
  }
  return reply;
}

export async function getAIReply(history, userEmail) {
  lastError = null;

  if (!hasAIKey()) {
    lastError = 'No API key set in .env.local';
    throw new Error('NO_AI_KEY');
  }

  const lastUser = [...history].reverse().find((m) => m.role === 'user')?.text || '';
  const orderContext = await fetchOrderContext(lastUser, userEmail);
  const systemPrompt = SYSTEM_PROMPT.replace('{ORDER_CONTEXT}', orderContext);

  const trimmed = history.filter((m) => m.text).slice(-14);
  const contents = trimmed.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  while (contents.length && contents[0].role !== 'user') contents.shift();
  if (!contents.length) {
    lastError = 'No user message';
    throw new Error('No user message');
  }

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 700, topP: 0.95 },
  };

  // Try models in order until one works
  const errors = [];
  for (const model of MODEL_CHAIN) {
    try {
      console.log(`[assistant] trying ${model}...`);
      const reply = await tryOneModel(model, body);
      console.log(`[assistant] ${model} succeeded`);

      const handoff = /\[HANDOFF\]/.test(reply);
      const clean = reply.replace(/\s*\[HANDOFF\]\s*/g, '').trim();
      return { text: clean, handoff, model };
    } catch (err) {
      errors.push(`${model}: ${err.message}`);
      console.warn(`[assistant] ${model} failed — ${err.message}`);

      // If it's a 404 (model doesn't exist) or 503 (overloaded), try the next one.
      // If it's 400/401/403 (bad key/request), stop — no point retrying.
      if (err.status && ![404, 429, 503].includes(err.status)) {
        lastError = err.message;
        throw err;
      }
    }
  }

  // All models failed
  lastError = `All models overloaded. Last errors:\n${errors.slice(-2).join('\n')}`;
  throw new Error(lastError);
}

export async function saveChatSession({ sessionId, customerId, guestEmail, messages, status = 'active' }) {
  try {
    const { error } = await supabase
      .from('support_chats')
      .upsert({
        session_id: sessionId,
        customer_id: customerId || null,
        guest_email: guestEmail || null,
        messages,
        status,
        last_message_at: new Date().toISOString(),
      }, { onConflict: 'session_id' });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[chat-save] failed', e);
    return false;
  }
}

export async function loadChatSessions({ customerId, guestEmail }) {
  try {
    let q = supabase
      .from('support_chats')
      .select('session_id,messages,status,last_message_at,created_at')
      .order('last_message_at', { ascending: false })
      .limit(20);
    if (customerId) q = q.eq('customer_id', customerId);
    else if (guestEmail) q = q.eq('guest_email', guestEmail);
    else return [];
    const { data } = await q;
    return data || [];
  } catch {
    return [];
  }
}

export async function saveSupportTicket({ name, email, phone, message, orderRef }) {
  try {
    const subject = 'Customer support request' + (orderRef ? ` · ${orderRef}` : '');
    const { data, error } = await supabase
      .from('support_tickets')
      .insert([{
        subject,
        message,
        seller_id: null,
        status: 'open',
        customer_name: name || null,
        customer_email: email || null,
        customer_phone: phone || null,
      }])
      .select()
      .single();
    if (error) throw error;
    return { ok: true, ticket: data };
  } catch (err) {
    console.error('[support] save ticket failed:', err);
    return { ok: false, error: err.message };
  }
}
