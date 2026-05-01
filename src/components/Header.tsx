"use client"

import { useEffect, useState, useRef } from "react"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { User, Calendar, Search, Bell, Sun, Moon } from "lucide-react"

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ guests: any[], reservations: any[] }>({ guests: [], reservations: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    fetchUser();

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch(searchQuery)
      } else {
        setSearchResults({ guests: [], reservations: [] })
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const handleSearch = async (query: string) => {
    setIsSearching(true)
    setShowResults(true)

    try {
      // Search Guests
      const { data: guests } = await supabase
        .from('hospedes')
        .select('*')
        .ilike('nome', `%${query}%`)
        .limit(3)

      // Search Reservations (joining with hospedes to filter by name)
      const { data: reservations } = await supabase
        .from('reservas')
        .select('*, hospedes(nome), quartos(numero)')
        .or(`status.ilike.%${query}%,hospedes.nome.ilike.%${query}%`)
        .limit(3)

      setSearchResults({
        guests: guests || [],
        reservations: reservations || []
      })
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-white/80 dark:bg-[#0f1117]/80 backdrop-blur-xl px-6 border-b border-zinc-200 dark:border-[#1e2130]">
      {/* Search */}
      <div className="flex items-center gap-4 relative" ref={searchRef}>
        <div className="hidden md:flex items-center bg-zinc-50 dark:bg-[#1a1d27] px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-[#2a2d3a] group focus-within:border-emerald-500/50 transition-all w-80">
          <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder="PESQUISAR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            className="bg-transparent border-none outline-none text-sm ml-3 w-full text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 placeholder:font-medium placeholder:text-xs placeholder:tracking-widest"
          />
          {isSearching && (
            <div className="h-3 w-3 border border-emerald-500 border-t-transparent rounded-full animate-spin ml-2"></div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (searchQuery.length >= 2) && (
          <div className="absolute top-full mt-2 left-0 w-80 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="p-2 space-y-4">
              {/* Guests Section */}
              <div>
                <p className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Hóspedes</p>
                <div className="mt-1 space-y-1">
                  {searchResults.guests.length > 0 ? searchResults.guests.map(guest => (
                    <Link
                      key={guest.id}
                      href={`/hospedes?id=${guest.id}`}
                      onClick={() => setShowResults(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-emerald-500/10 group transition-colors"
                    >
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-emerald-400 transition-colors">{guest.nome}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{guest.email || guest.telefone}</p>
                      </div>
                    </Link>
                  )) : (
                    <p className="px-3 py-2 text-xs text-zinc-600 italic">Nenhum hóspede encontrado</p>
                  )}
                </div>
              </div>

              {/* Reservations Section */}
              <div>
                <p className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Reservas</p>
                <div className="mt-1 space-y-1">
                  {searchResults.reservations.length > 0 ? searchResults.reservations.map(res => (
                    <Link
                      key={res.id}
                      href={`/reservas?id=${res.id}`}
                      onClick={() => setShowResults(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-500/10 group transition-colors"
                    >
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-blue-400 transition-colors">Quarto {res.quartos?.numero} - {res.hospedes?.nome}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{res.status} · {res.data_checkin}</p>
                      </div>
                    </Link>
                  )) : (
                    <p className="px-3 py-2 text-xs text-zinc-600 italic">Nenhuma reserva encontrada</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#14161f] p-2 border-t border-[#2a2d3a]">
              <p className="text-[9px] text-center text-zinc-600">Mostrando resultados principais para "{searchQuery}"</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2.5 bg-white dark:bg-[#1a1d27] border border-zinc-200 dark:border-[#2a2d3a] rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 transition-all active:scale-95">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
        </button>

        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 bg-white dark:bg-[#1a1d27] border border-zinc-200 dark:border-[#2a2d3a] rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 transition-all active:scale-95"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Divider */}
        <div className="h-8 w-px bg-zinc-200 dark:bg-[#2a2d3a] mx-1"></div>

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
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 leading-tight">
              {user?.user_metadata?.full_name || 'Administrator'}
            </p>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Pousada Vovó Maria</p>
          </div>
        </div>
      </div>
    </header>
  )
}
