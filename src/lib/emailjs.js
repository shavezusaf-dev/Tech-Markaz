import emailjs from '@emailjs/browser';

emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

const SERVICE = import.meta.env.VITE_EMAILJS_SERVICE;
const TPL_ORDER = import.meta.env.VITE_EMAILJS_TPL_ORDER;

// Reliable PNG logo — works in every email client
const TM_LOGO = 'https://placehold.co/240x240/0047FF/FFFFFF/png?text=TECH%0AMARKAZ&font=roboto';

export async function sendOrderConfirmation(order) {
  try {
    await emailjs.send(
      SERVICE,
      TPL_ORDER,
      {
        to_email: order.guest_email,
        customer_name: order.guest_name || 'Customer',
        order_number: order.order_number,
        items_summary: order.items_summary,
        total_amount: Number(order.total_amount || 0).toLocaleString('en-PK'),
        payment_method: order.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Cash on Delivery',
        delivery_info: order.pickup_location || 'Home Delivery',
        company_name: 'Tech Markaz',
        logo_url: TM_LOGO,
        reply_to: 'admin.techmarkaz@gmail.com',
      }
    );
    return true;
  } catch (err) {
    console.warn('EmailJS failed:', err);
    return false;
  }
}

export async function sendSellerWelcome({ email, fullName, password, storeLogoUrl }) {
  try {
    const SERVICE = import.meta.env.VITE_EMAILJS_SERVICE;
    const TEMPLATE = import.meta.env.VITE_EMAILJS_TPL_WELCOME || 'template_eowpqyk';
    const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!SERVICE || !TEMPLATE || !PUBLIC_KEY) {
      console.warn('[emailjs] Missing env vars');
      return false;
    }

    // Prefer the seller's uploaded store logo if it's a valid HTTPS URL
    // Fallback to our reliable TM PNG
    const isGoodStoreLogo =
      storeLogoUrl && /^https:\/\//.test(storeLogoUrl) && !/\.svg(\?|$)/i.test(storeLogoUrl);
    const logoToSend = isGoodStoreLogo ? storeLogoUrl : TM_LOGO;

    const r = await emailjs.send(
      SERVICE,
      TEMPLATE,
      {
        to_email: email,
        email,
        seller_email: email,
        seller_name: fullName,
        name: fullName,
        seller_password: password,
        password,
        company_name: 'Tech Markaz',
        logo_url: TM_LOGO,                       // brand logo — always the TM PNG
        store_logo_url: logoToSend,              // seller's store logo (or TM fallback)
        reply_to: 'admin.techmarkaz@gmail.com',
        support_phone: '0300-TECHMARKAZ',
        support_email: 'admin.techmarkaz@gmail.com',
        marketplace_url: 'https://techmarkaz.vercel.app',
      },
      PUBLIC_KEY
    );
    console.log('[emailjs] Welcome email sent:', r);
    return true;
  } catch (err) {
    console.error('[emailjs] Welcome email error:', err);
    return false;
  }
}
