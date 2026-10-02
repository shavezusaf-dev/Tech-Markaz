import { supabase } from './supabase';

export async function validateVoucher(code) {
  if (!code) return null;
  try {
    const { data } = await supabase
      .from('home_vouchers')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('active', true)
      .maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

export function computeDiscount(voucher, subtotal) {
  if (!voucher) return 0;
  if (subtotal < (voucher.min_spend || 0)) return 0;
  const pct = parseInt(voucher.discount_pct) || 0;
  if (pct <= 0) return 0;
  return Math.round((subtotal * pct) / 100);
}

export function isVoucherExpired(voucher) {
  if (!voucher?.expires_at) return false;
  return new Date(voucher.expires_at) < new Date();
}

export function getCollectedVouchers() {
  try {
    return JSON.parse(localStorage.getItem('tm_vouchers') || '[]');
  } catch {
    return [];
  }
}
