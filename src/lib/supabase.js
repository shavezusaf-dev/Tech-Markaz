import { createClient } from '@supabase/supabase-js';

// Fallback values — Vite bakes VITE_* vars into the bundle at build time,
// so these are equally public. The fallback guarantees the app works
// even if Vercel's env var propagation fails.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://puvaduscqeqbtcjwcwep.supabase.co';

const supabaseKey =
  import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_eDu0YDi5fvlbHgqjh7PH0Q_RFSSm1B2';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials missing');
}

export const supabase = createClient(supabaseUrl, supabaseKey);