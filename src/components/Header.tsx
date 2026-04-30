"use client"

import { Bell, Search, Sun, Moon, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase"

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    fetchUser();
  }, [])

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-[#0f1117]/80 backdrop-blur-xl px-6 border-b border-[#1e2130]">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center bg-[#1a1d27] px-4 py-2.5 rounded-xl border border-[#2a2d3a] group focus-within:border-emerald-500/50 transition-all w-80">
          <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="PESQUISAR..." 
            className="bg-transparent border-none outline-none text-sm ml-3 w-full text-zinc-200 placeholder:text-zinc-600 placeholder:font-medium placeholder:text-xs placeholder:tracking-widest"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2.5 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-zinc-400 hover:text-white hover:border-zinc-600 transition-all active:scale-95">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
        </button>

        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-zinc-400 hover:text-white hover:border-zinc-600 transition-all active:scale-95"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Divider */}
        <div className="h-8 w-px bg-[#2a2d3a] mx-1"></div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'admin'}`} 
              alt="Avatar" 
              className="h-full w-full object-cover rounded-xl"
            />
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-zinc-200 leading-tight">
              {user?.user_metadata?.full_name || 'Administrator'}
            </p>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Pousada Veral</p>
          </div>
        </div>
      </div>
    </header>
  )
}
