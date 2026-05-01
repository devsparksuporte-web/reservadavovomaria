'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { useEffect, useState } from 'react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Evita problemas de hidratação e garante que o tema seja aplicado corretamente
  if (!mounted) return null;

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
