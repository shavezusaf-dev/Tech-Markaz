// Specific KB entries — ordered so longer phrases win
export const QUICK_TOPICS = [
  { label: 'Track my order', text: 'How do I track my order?' },
  { label: 'Delivery time', text: 'How long does delivery take?' },
  { label: 'Returns', text: 'What is your return policy?' },
  { label: 'Payment methods', text: 'What payment methods do you accept?' },
  { label: 'Refund status', text: 'When will I get my refund?' },
  { label: 'Warranty', text: 'Do products come with warranty?' },
  { label: 'Chat with seller', text: 'How do I contact the seller?' },
  { label: 'Talk to agent', action: 'handoff' },
];

const HANDOFF_TRIGGERS = [
  'agent', 'human', 'person', 'representative', 'real person',
  'talk to someone', 'speak to someone', 'support team', 'manager',
  'supervisor', 'customer service',
];

// NOTE: keep keywords SPECIFIC. "when" / "long" / "days" are too generic.
const KB = [
  {
    id: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'salam', 'assalam', 'aoa'],
    phrases: ['good morning', 'good evening'],
    reply: "Hi there! I'm the **Markaz Assistant**. I can help with orders, delivery, returns, payments, and more.\n\nWhat would you like to know?",
    followups: [
      { label: 'Track my order', text: 'How do I track my order?' },
      { label: 'Delivery info', text: 'How long does delivery take?' },
      { label: 'Returns', text: 'What is your return policy?' },
    ],
  },
  {
    id: 'track_order',
    keywords: ['track', 'tracking', 'status', 'parcel', 'package', 'shipped', 'dispatched'],
    phrases: ['track my order', 'where is my order', 'order status', 'order number', 'my order'],
    reply: "You can track your order in **3 ways**:\n\n**1. My Orders page** — Account → My Orders → tap the order → Track Order\n**2. Footer** — click 'Track Your Order'\n**3. Right here** — type your **TM-XXXX** order number and I'll look it up for you.",
    followups: [
      { label: 'My order is late', text: 'My order has not arrived yet' },
      { label: 'Talk to agent', action: 'handoff' },
    ],
  },
  {
    id: 'delivery_time',
    keywords: ['delivery', 'shipping', 'courier', 'arrive', 'receive'],
    phrases: ['how long does delivery', 'how many days', 'delivery time', 'delivery take', 'when will i receive', 'when will it arrive', 'when will i get my order'],
    reply: "**Standard delivery: 2-4 business days** nationwide — from Karachi to Gilgit.\n\n• Karachi, Lahore, Islamabad: usually 2 days\n• Smaller cities: 3-4 days\n• Remote areas: up to 5 days\n\nYou'll get an SMS/email when your order ships.",
    followups: [
      { label: 'Delivery charges?', text: 'What are the delivery charges?' },
      { label: 'Track my order', text: 'How do I track my order?' },
    ],
  },
  {
    id: 'delivery_charges',
    keywords: ['charge', 'charges', 'cost', 'fee'],
    phrases: ['delivery charges', 'shipping cost', 'how much is delivery', 'delivery free', 'free delivery'],
    reply: "**Delivery charges:**\n\n• Flat **Rs. 200** on every order\n• **FREE** on orders over **Rs. 3,000**\n\nCharges are added at checkout automatically.",
    followups: [
      { label: 'Delivery time?', text: 'How long does delivery take?' },
      { label: 'Payment methods', text: 'What payment methods do you accept?' },
    ],
  },
  {
    id: 'cod',
    keywords: ['cod'],
    phrases: ['cash on delivery', 'pay on delivery', 'cod available'],
    reply: "Yes! **Cash on Delivery** is available **nationwide**.\n\nYou pay in cash to the rider when your order arrives. No advance payment needed.\n\nCOD is the default payment option at checkout.",
    followups: [
      { label: 'Bank transfer', text: 'How do I pay via bank transfer?' },
      { label: 'Delivery charges', text: 'What are delivery charges?' },
    ],
  },
  {
    id: 'bank_transfer',
    keywords: ['bank', 'transfer', 'iban', 'meezan', 'proof', 'verify', 'screenshot'],
    phrases: ['bank transfer', 'pay via bank'],
    reply: "**Bank Transfer** — here's how it works:\n\n**1.** Choose 'Bank Transfer' at checkout\n**2.** Transfer to:\n   Meezan Bank Ltd\n   Account: 0210 1234 5678 9012\n   IBAN: PK36MEZN0002101234567890\n**3.** Upload a screenshot of your transfer\n**4.** Our team verifies within **24 hours** and dispatches your order",
    followups: [
      { label: 'Payment pending', text: 'My payment verification is pending' },
      { label: 'Talk to agent', action: 'handoff' },
    ],
  },
  {
    id: 'refund_status',
    keywords: ['refund', 'money back', 'refunded'],
    phrases: ['when will i get my refund', 'refund status', 'where is my refund', 'how long refund', 'when will i get refund', 'get my refund'],
    reply: "**Refunds take 5-7 business days** after approval.\n\n• COD orders → refunded as **store credit** or **bank transfer** (your choice)\n• Bank transfer orders → refunded to the **same account**\n\nYou'll get an email when your refund is processed.",
    followups: [
      { label: 'Return policy', text: 'What is your return policy?' },
      { label: 'Talk to agent', action: 'handoff' },
    ],
  },
  {
    id: 'returns',
    keywords: ['return', 'exchange'],
    phrases: ['return policy', 'can i return', 'how to return', 'want to return', 'return an item'],
    reply: "**7-day return policy** — hassle-free.\n\n**You can return:**\n• Unopened products in original packaging\n• Products with manufacturing defects\n• Items that don't match the description\n• Damaged items received in shipping\n\n**How:** My Orders → select order → Request Return → upload photos → our team reviews within 24 hours.",
    followups: [
      { label: 'Refund time?', text: 'When will I get my refund?' },
      { label: 'Talk to agent', action: 'handoff' },
    ],
  },
  {
    id: 'warranty',
    keywords: ['warranty', 'guarantee', 'repair', 'broken', 'defect', 'faulty'],
    phrases: ['is there warranty', 'comes with warranty', 'product warranty', 'warranty period'],
    reply: "**Warranty depends on the product** — most smartphones come with **1 year official warranty** from the manufacturer.\n\nCheck the product page under 'Delivery & Returns' to see the exact warranty for that item.\n\nIf a product arrives defective, it's also covered under our 7-day return policy.",
    followups: [
      { label: 'Return policy', text: 'What is your return policy?' },
      { label: 'Talk to agent', action: 'handoff' },
    ],
  },
  {
    id: 'genuine',
    keywords: ['genuine', 'authentic', 'original', 'fake', 'counterfeit', 'duplicate'],
    phrases: ['is it original', 'original product', 'genuine products'],
    reply: "**100% genuine products only.**\n\nEvery seller on Tech Markaz is verified before they can list products. We verify their business, CNIC, bank details, and product authenticity samples.\n\nIf you ever receive a counterfeit, we refund you 100% and take action against the seller.",
    followups: [
      { label: 'Warranty info', text: 'Do products come with warranty?' },
      { label: 'Talk to agent', action: 'handoff' },
    ],
  },
  {
    id: 'pta',
    keywords: ['pta'],
    phrases: ['pta approved', 'is it pta', 'pta tax'],
    reply: "Yes! **All our phones are PTA approved** unless the product page says otherwise.\n\nCheck the 'Specifications' section of any phone to see its PTA status. PTA-approved phones work with all Pakistani SIM cards.",
    followups: [
      { label: 'Warranty info', text: 'Do products come with warranty?' },
      { label: 'Browse phones', text: 'Show me smartphones' },
    ],
  },
  {
    id: 'cancel_order',
    keywords: ['cancel'],
    phrases: ['cancel my order', 'want to cancel'],
    reply: "**You can cancel** if the order hasn't been dispatched yet.\n\n**How:** My Orders → select order → Cancel. If the button isn't there, the order has already shipped.\n\nOnce shipped, you'll need to wait for delivery and then return it. I can connect you with an agent to speed this up.",
    followups: [
      { label: 'Talk to agent', action: 'handoff' },
      { label: 'Return policy', text: 'What is your return policy?' },
    ],
  },
  {
    id: 'change_address',
    keywords: ['address', 'moved', 'location'],
    phrases: ['change address', 'wrong address', 'update address'],
    reply: "**Changing your address** — contact our team as soon as possible.\n\n• If the order hasn't shipped → we update it for free\n• If already shipped → we reroute (may add 1-2 days)\n\nI can connect you with an agent to update it right now.",
    followups: [
      { label: 'Talk to agent', action: 'handoff' },
      { label: 'Track my order', text: 'How do I track my order?' },
    ],
  },
  {
    id: 'contact_seller',
    keywords: ['seller', 'store', 'vendor'],
    phrases: ['contact seller', 'chat with seller', 'message seller', 'talk to seller'],
    reply: "**Chat with the seller directly:**\n\n**1.** Open the product page\n**2.** Scroll to the 'Sold by' box\n**3.** Tap **Chat Now**\n\nYou can ask about stock, price, delivery, or send them the product itself. Sellers usually reply within a few hours.",
    followups: [
      { label: 'Talk to Tech Markaz', action: 'handoff' },
      { label: 'Browse shop', text: 'Show me products' },
    ],
  },
  {
    id: 'contact_info',
    keywords: ['contact', 'helpline'],
    phrases: ['contact number', 'phone number', 'how to contact', 'email address', 'phone'],
    reply: "**Tech Markaz contact details:**\n\n• Phone: **0300-TECHMARKAZ**\n• Email: **admin.techmarkaz@gmail.com**\n• Hours: Mon-Sun, 9am-11pm\n\nFor the fastest response, leave a message here and our team will get back to you.",
    followups: [
      { label: 'Leave a message', action: 'handoff' },
      { label: 'Track my order', text: 'How do I track my order?' },
    ],
  },
  {
    id: 'account_help',
    keywords: ['login', 'signup', 'password'],
    phrases: ['forgot password', 'cant login', 'reset password', 'create account'],
    reply: "**Account help:**\n\n**Sign in / Sign up:** Tap 'Sign In' in the header.\n**Forgot password:** Click 'Forgot password?' on the sign-in screen.\n**Wrong email?** Sign out and create a new account with the correct email.",
    followups: [
      { label: 'Talk to agent', action: 'handoff' },
      { label: 'Contact info', text: 'How do I contact Tech Markaz?' },
    ],
  },
  {
    id: 'payment_failed',
    keywords: ['declined'],
    phrases: ['payment failed', 'payment not working', 'card declined'],
    reply: "Sorry to hear that! Try these:\n\n• **Use Cash on Delivery** — works everywhere\n• **Bank transfer** — smooth and verified within 24h\n• **Clear your browser cache** and retry\n\nIf it keeps failing, leave a message for our team and we'll help within a few hours.",
    followups: [
      { label: 'Leave a message', action: 'handoff' },
      { label: 'Payment methods', text: 'What payment methods do you accept?' },
    ],
  },
  {
    id: 'bulk_order',
    keywords: ['bulk', 'wholesale', 'dealer', 'reseller', 'corporate'],
    phrases: ['bulk order', 'wholesale price', 'corporate order'],
    reply: "**Bulk orders?** We'd love to help!\n\n• 10+ units → special pricing\n• 50+ units → dedicated account manager\n• 100+ units → custom invoicing and delivery\n\nLeave a message with your requirements and our team will contact you within 24 hours.",
    followups: [{ label: 'Leave a message', action: 'handoff' }],
  },
  {
    id: 'emi',
    keywords: ['emi', 'installment'],
    phrases: ['do you offer emi', 'installment plan', 'monthly payment'],
    reply: "**EMI is not available yet** — we're working on it.\n\nFor now, we accept:\n• Cash on Delivery\n• Bank Transfer (with proof)",
    followups: [
      { label: 'Payment methods', text: 'What payment methods do you accept?' },
      { label: 'Talk to agent', action: 'handoff' },
    ],
  },
  {
    id: 'browse',
    keywords: ['products', 'shop', 'browse', 'category'],
    phrases: ['show me', 'browse products', 'what do you sell'],
    reply: "**We sell across 8 categories:**\n\n• Smartphones · Smart TVs · Audio · Tablets\n• Smart Watches · Projectors · Washing Machines\n• Today's Deals\n\nTap a category in the top navbar or use search to find what you need.",
    followups: [
      { label: 'Smartphones', text: 'Smartphones' },
      { label: 'Today deals', text: 'Deals' },
    ],
  },
  {
    id: 'thanks',
    keywords: ['thank', 'shukriya', 'awesome', 'okay', 'ok'],
    phrases: ['thank you', 'thanks a lot', 'very helpful'],
    reply: "You're welcome! Let me know if there's anything else. Have a great day!",
    followups: [{ label: 'Ask another question', text: '' }],
  },
];

function scoreEntry(text, entry) {
  let score = 0;
  const clean = text.replace(/[^\w\s]/g, ' ').toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);

  // Phrases weighted highest — longest phrase wins
  (entry.phrases || []).forEach((p) => {
    if (clean.includes(p)) {
      score += 10 + p.split(' ').length * 2;
    }
  });

  // Keywords — each found once = 3
  (entry.keywords || []).forEach((k) => {
    if (words.includes(k)) score += 3;
    else if (clean.includes(k)) score += 1;
  });

  return score;
}

function wantsHandoff(text) {
  const clean = text.toLowerCase();
  return HANDOFF_TRIGGERS.some((t) => clean.includes(t));
}

async function lookupOrder(userText, supabaseRef) {
  const match = userText.match(/TM-[A-Z0-9]{4,}/i);
  if (!match) return null;
  const orderNum = match[0].toUpperCase();
  try {
    const { data } = await supabaseRef
      .from('orders')
      .select('*')
      .eq('order_number', orderNum)
      .maybeSingle();
    return { order: data, orderNum };
  } catch {
    return null;
  }
}

export async function getBotReply(userText, history = [], supabaseRef) {
  const text = userText.toLowerCase().trim();
  if (!text) return null;

  if (wantsHandoff(text)) {
    return {
      type: 'handoff',
      text: "Of course — I'll connect you with a real agent. Please describe your issue below and our team will reply as soon as possible.\n\nInclude your **order number** or **email** so we can help faster.",
    };
  }

  if (supabaseRef) {
    const orderLookup = await lookupOrder(userText, supabaseRef);
    if (orderLookup) {
      const { order, orderNum } = orderLookup;
      if (order) {
        const statusEmoji = {
          'Un-processed': '[pending]',
          'Dispatched': '[shipped]',
          'Delivered': '[delivered]',
          'Cancelled': '[cancelled]',
        }[order.status] || '[order]';
        return {
          type: 'answer',
          text: `Found your order **${orderNum}** ${statusEmoji}\n\n**Status:** ${order.status}\n**Amount:** Rs. ${Number(order.total_amount || 0).toLocaleString('en-PK')}\n**Placed:** ${new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n${order.items_summary ? `**Items:** ${order.items_summary}\n\n` : '\n'}See the full timeline in My Orders.`,
          followups: [
            { label: 'My order is late', text: 'My order has not arrived yet' },
            { label: 'Talk to agent', action: 'handoff' },
          ],
        };
      }
      return {
        type: 'answer',
        text: `I couldn't find an order with number **${orderNum}**. Please double check — order numbers start with **TM-**.`,
        followups: [
          { label: 'Talk to agent', action: 'handoff' },
        ],
      };
    }
  }

  let best = null;
  let bestScore = 0;
  KB.forEach((entry) => {
    const score = scoreEntry(text, entry);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  });

  if (best && bestScore >= 3) {
    return { type: 'answer', text: best.reply, followups: best.followups || [] };
  }

  const failCount = history.filter((m) => m.role === 'bot' && m.isFallback).length;
  if (failCount >= 2) {
    return {
      type: 'handoff',
      text: "I'm having trouble understanding. Let me connect you with a real agent who can help better.\n\nPlease describe your issue below and we'll get back to you as soon as possible.",
    };
  }

  return {
    type: 'fallback',
    isFallback: true,
    text: "Hmm, I'm not sure I understood that. Could you try rephrasing? Or pick a topic below — or talk to a real agent anytime.",
    followups: [
      { label: 'Track my order', text: 'How do I track my order?' },
      { label: 'Return policy', text: 'What is your return policy?' },
      { label: 'Talk to agent', action: 'handoff' },
    ],
  };
}
