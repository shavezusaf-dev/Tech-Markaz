import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function getViewerId() {
  let id = localStorage.getItem('tm_viewer_id');
  if (!id) {
    id = 'v-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('tm_viewer_id', id);
  }
  return id;
}

export default function PageViewTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Don't log seller/admin paths
    if (pathname.startsWith('/seller')) return;
    const viewer_id = getViewerId();
    supabase
      .from('page_views')
      .insert([{ viewer_id, path: pathname }])
      .then(() => {})
      .catch(() => {});
  }, [pathname]);

  return null;
}


