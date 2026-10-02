export const fmt = (v) => 'Rs. ' + (parseFloat(v) || 0).toLocaleString('en-PK');

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

export const parseImgs = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  try {
    const p = typeof v === 'string' ? JSON.parse(v) : v;
    if (Array.isArray(p)) return p.filter(Boolean);
  } catch {}
  return String(v).split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
};

export const finalPrice = (p) => {
  const price = parseFloat(p?.price) || 0;
  const disc = parseFloat(p?.discount_percent) || 0;
  if (disc <= 0 || disc >= 100) return price;
  return Math.round((price * (100 - disc)) / 100 * 100) / 100;
};

export const isRealSellerId = (id) =>
  typeof id === 'string' && id.length === 36 && id.indexOf('-') > 0;

export const calcPayout = (gross) => {
  const g = Number(gross) || 0;
  const platformFee = Math.round(g * 5) / 100;
  const tax = Math.round(g * 2) / 100;
  return { gross: g, platformFee, tax, net: Math.max(0, g - platformFee - tax) };
};
