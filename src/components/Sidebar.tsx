"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CalendarDays, BedDouble, Users, Wallet, CheckSquare, UserCircle, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { logout } from "@/app/actions/auth"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Agenda", href: "/agenda", icon: CalendarDays },
  { name: "Reservas", href: "/reservas", icon: CheckSquare },
  { name: "Quartos", href: "/quartos", icon: BedDouble },
  { name: "Hóspedes", href: "/hospedes", icon: Users },
  { name: "Financeiro", href: "/financeiro", icon: Wallet },
  { name: "Perfil", href: "/perfil", icon: UserCircle },
]

export function Sidebar() {
  const pathname = usePathname()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="hidden md:flex h-full w-64 flex-col bg-[#1c1c1c] border-r border-[#2e2e2e] transition-all duration-300">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-[#2e2e2e]">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative h-9 w-9 flex items-center justify-center bg-[#232323] rounded-lg border border-[#2e2e2e] overflow-hidden transition-transform group-hover:scale-105 duration-200">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="max-w-[70%] max-h-[70%] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50?text=V';
              }}
            />
          </div>
          <div>
            <h1 className="text-[13px] font-semibold tracking-tight text-[#ededed] leading-tight">Pousada</h1>
            <h1 className="text-[13px] font-semibold tracking-tight text-[#ededed] leading-tight">Vovó Maria</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                isActive
                  ? "bg-[#232323] text-[#3ecf8e] border border-[#2e2e2e]"
                  : "text-[#707070] hover:text-[#ededed] hover:bg-[#232323] border border-transparent",
                "group flex items-center rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150"
              )}
            >
              <item.icon
                className={cn(
                  isActive ? "text-[#3ecf8e]" : "text-[#555555] group-hover:text-[#707070]",
                  "mr-3 flex-shrink-0 h-[18px] w-[18px] transition-colors"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-[#2e2e2e]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#707070] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150"
        >
          <LogOut className="mr-3 h-[18px] w-[18px]" />
          Sair
        </button>
      </div>
    </div>
  )
}
