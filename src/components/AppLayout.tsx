'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session && !isLoginPage) {
          router.push('/login');
        } else if (session && isLoginPage) {
          router.push('/');
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }
    };

    const timeout = setTimeout(() => {
      setLoading(false);
      console.warn('Sessão demorando muito para carregar, liberando interface...');
    }, 5000);

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && !isLoginPage) {
        router.push('/login');
      } else if (event === 'SIGNED_IN' && isLoginPage) {
        router.push('/');
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [isLoginPage, router]);

  // Evita problemas de hidratação e garante que o tema seja aplicado corretamente
  if (!mounted) return null;

  if (loading && !isLoginPage) {
    return (
      <div className="flex flex-1 items-center justify-center h-screen bg-zinc-50 dark:bg-[#0a0c10] transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium animate-pulse">Carregando Sistema...</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return (
      <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-[#0a0c10]">
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden w-full bg-zinc-50 dark:bg-[#0a0c10] transition-colors">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6 scroll-smooth">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
