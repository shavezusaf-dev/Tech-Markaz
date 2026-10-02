import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAIL } from '../lib/constants';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const ensureCustomerRow = async (u) => {
    try {
      await supabase
        .from('customers')
        .upsert({ id: u.id, full_name: (u.email || 'Customer').split('@')[0], email: u.email }, { onConflict: 'id' });
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      if (!cancelled) {
        setUser(u);
        setLoading(false);
        if (u) ensureCustomerRow(u);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      if (!cancelled) {
        setUser(u);
        if (u) ensureCustomerRow(u);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (error) throw error;
    if (data.user) await ensureCustomerRow(data.user);
    return data.user;
  };

  const signUp = async (email, password) => {
    const clean = email.toLowerCase().trim();
    if (clean === ADMIN_EMAIL.toLowerCase()) throw new Error('This email is reserved.');
    const { data, error } = await supabase.auth.signUp({
      email: clean,
      password,
      options: { data: { role: 'customer' } },
    });
    if (error) throw error;
    if (data.user) await ensureCustomerRow(data.user);
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
