"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, CalendarDays, BedDouble, Users, Wallet, CheckSquare, UserCircle, Settings, LogOut, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

const navigation = [
  { name: "DASHBOARD", href: "/", icon: LayoutDashboard },
  { name: "AGENDA", href: "/agenda", icon: CalendarDays },
  { name: "RESERVAS", href: "/reservas", icon: CheckSquare },
  { name: "QUARTOS", href: "/quartos", icon: BedDouble },
  { name: "HÓSPEDES", href: "/hospedes", icon: Users },
  { name: "FINANCEIRO", href: "/financeiro", icon: Wallet },
  { name: "PERFIL", href: "/perfil", icon: UserCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // Forçamos o reload da página inteira para limpar o cache de rotas do Next.js e da sessão
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      window.location.href = '/login'
    }
  }

  return (
    <div className="hidden md:flex h-full w-64 flex-col bg-[#0f1117] border-r border-[#1e2130] transition-all duration-500">
      {/* Logo */}
      <div className="flex h-20 items-center px-6">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative h-10 w-10 flex items-center justify-center bg-[#1a1d27] rounded-xl border border-[#2a2d3a] overflow-hidden transition-transform group-hover:scale-105 duration-300">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="max-w-[75%] max-h-[75%] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50?text=V';
              }}
            />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">Pousada</h1>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">Vovó Maria</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                isActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "text-zinc-400 hover:text-white hover:bg-[#1a1d27]",
                "group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200"
              )}
            >
              <item.icon
                className={cn(
                  isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300",
                  "mr-3 flex-shrink-0 h-5 w-5 transition-colors"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 space-y-1 border-t border-[#1e2130]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="mr-3 h-5 w-5" />
          SAIR
        </button>
      </div>
    </div>
  )
}
