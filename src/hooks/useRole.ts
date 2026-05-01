'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useRole() {
  const [role, setRole] = useState<'admin' | 'staff' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setRole(null);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        setRole(profile?.role || 'staff');
      } catch (error) {
        console.error('Error fetching role:', error);
        setRole('staff');
      } finally {
        setLoading(false);
      }
    }

    getRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { role, isAdmin: role === 'admin', loading };
}
