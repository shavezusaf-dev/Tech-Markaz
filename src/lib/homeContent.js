import { supabase } from './supabase';

// ─── Fetch (customer side) ────────────────────────
export async function fetchAnnouncements() {
  const { data } = await supabase
    .from('home_announcements')
    .select('*')
    .eq('active', true)
    .order('position', { ascending: true });
  return data || [];
}

export async function fetchHomeVouchers() {
  const { data } = await supabase
    .from('home_vouchers')
    .select('*')
    .eq('active', true)
    .order('position', { ascending: true });
  return data || [];
}

export async function fetchHeroSlides() {
  const { data } = await supabase
    .from('home_hero_slides')
    .select('*')
    .eq('active', true)
    .order('position', { ascending: true });
  return data || [];
}

// ─── Admin CRUD ───────────────────────────────────
export const announcementAPI = {
  async list() {
    const { data } = await supabase
      .from('home_announcements')
      .select('*')
      .order('position', { ascending: true });
    return data || [];
  },
  async create(payload) {
    const { error } = await supabase.from('home_announcements').insert([payload]);
    if (error) throw error;
  },
  async update(id, payload) {
    const { error } = await supabase.from('home_announcements').update(payload).eq('id', id);
    if (error) throw error;
  },
  async remove(id) {
    const { error } = await supabase.from('home_announcements').delete().eq('id', id);
    if (error) throw error;
  },
};

export const voucherAPI = {
  async list() {
    const { data } = await supabase
      .from('home_vouchers')
      .select('*')
      .order('position', { ascending: true });
    return data || [];
  },
  async create(payload) {
    const { error } = await supabase.from('home_vouchers').insert([payload]);
    if (error) throw error;
  },
  async update(id, payload) {
    const { error } = await supabase.from('home_vouchers').update(payload).eq('id', id);
    if (error) throw error;
  },
  async remove(id) {
    const { error } = await supabase.from('home_vouchers').delete().eq('id', id);
    if (error) throw error;
  },
};

export const heroAPI = {
  async list() {
    const { data } = await supabase
      .from('home_hero_slides')
      .select('*')
      .order('position', { ascending: true });
    return data || [];
  },
  async create(payload) {
    const { error } = await supabase.from('home_hero_slides').insert([payload]);
    if (error) throw error;
  },
  async update(id, payload) {
    const { error } = await supabase.from('home_hero_slides').update(payload).eq('id', id);
    if (error) throw error;
  },
  async remove(id) {
    const { error } = await supabase.from('home_hero_slides').delete().eq('id', id);
    if (error) throw error;
  },
};

// Upload a banner image → returns public URL
export async function uploadBannerImage(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `home-banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from('chat-media')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
  return data.publicUrl;
}
