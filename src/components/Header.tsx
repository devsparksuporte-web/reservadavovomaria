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
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between bg-[#1c1c1c]/90 backdrop-blur-md px-5 border-b border-[#2e2e2e]">
      {/* Search */}
      <div className="flex items-center gap-4 relative" ref={searchRef}>
        <div className="hidden md:flex items-center bg-[#232323] px-3.5 py-2 rounded-lg border border-[#2e2e2e] group focus-within:border-[#3ecf8e]/40 transition-all w-72">
          <Search className="h-3.5 w-3.5 text-[#555555] group-focus-within:text-[#3ecf8e] transition-colors" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            className="bg-transparent border-none outline-none text-[13px] ml-2.5 w-full text-[#ededed] placeholder:text-[#555555] placeholder:font-normal"
          />
          {isSearching && (
            <div className="h-3 w-3 border border-[#3ecf8e] border-t-transparent rounded-full animate-spin ml-2"></div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (searchQuery.length >= 2) && (
          <div className="absolute top-full mt-2 left-0 w-80 bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg shadow-2xl shadow-black/40 overflow-hidden z-50 animate-fade-in-up">
            <div className="p-2 space-y-3">
              {/* Guests Section */}
              <div>
                <p className="px-3 py-1 text-[10px] font-semibold text-[#707070] uppercase tracking-widest">Hóspedes</p>
                <div className="mt-1 space-y-0.5">
                  {searchResults.guests.length > 0 ? searchResults.guests.map(guest => (
                    <Link
                      key={guest.id}
                      href={`/hospedes?id=${guest.id}`}
                      onClick={() => setShowResults(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#3ecf8e]/10 group transition-colors"
                    >
                      <div className="h-7 w-7 rounded-md bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-[#3ecf8e]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#ededed] truncate group-hover:text-[#3ecf8e] transition-colors">{guest.nome}</p>
                        <p className="text-[10px] text-[#555555] truncate">{guest.email || guest.telefone}</p>
                      </div>
                    </Link>
                  )) : (
                    <p className="px-3 py-2 text-xs text-[#555555] italic">Nenhum hóspede encontrado</p>
                  )}
                </div>
              </div>

              {/* Reservations Section */}
              <div>
                <p className="px-3 py-1 text-[10px] font-semibold text-[#707070] uppercase tracking-widest">Reservas</p>
                <div className="mt-1 space-y-0.5">
                  {searchResults.reservations.length > 0 ? searchResults.reservations.map(res => (
                    <Link
                      key={res.id}
                      href={`/reservas?id=${res.id}`}
                      onClick={() => setShowResults(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-500/10 group transition-colors"
                    >
                      <div className="h-7 w-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Calendar className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#ededed] truncate group-hover:text-blue-400 transition-colors">Quarto {res.quartos?.numero} - {res.hospedes?.nome}</p>
                        <p className="text-[10px] text-[#555555] truncate">{res.status} · {res.data_checkin}</p>
                      </div>
                    </Link>
                  )) : (
                    <p className="px-3 py-2 text-xs text-[#555555] italic">Nenhuma reserva encontrada</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#171717] p-2 border-t border-[#2e2e2e]">
              <p className="text-[9px] text-center text-[#555555]">Mostrando resultados para "{searchQuery}"</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* Notifications */}
        <button className="relative p-2 bg-[#232323] border border-[#2e2e2e] rounded-lg text-[#707070] hover:text-[#ededed] hover:border-[#444444] transition-all active:scale-95">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-[#3ecf8e] rounded-full"></span>
        </button>

        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 bg-[#232323] border border-[#2e2e2e] rounded-lg text-[#707070] hover:text-[#ededed] hover:border-[#444444] transition-all active:scale-95"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Divider */}
        <div className="h-7 w-px bg-[#2e2e2e] mx-1"></div>

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#3ecf8e] to-[#24b47e] flex items-center justify-center shadow-md shadow-[#3ecf8e]/15">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'admin'}`}
              alt="Avatar"
              className="h-full w-full object-cover rounded-full"
            />
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-[12px] font-medium text-[#ededed] leading-tight">
              {user?.user_metadata?.full_name || 'Administrator'}
            </p>
            <p className="text-[10px] text-[#555555] leading-tight">Pousada Vovó Maria</p>
          </div>
        </div>
      </div>
    </header>
  )
}
