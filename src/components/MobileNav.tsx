"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CalendarDays, BedDouble, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "DASHBOARD", href: "/", icon: LayoutDashboard },
  { name: "AGENDA", href: "/agenda", icon: CalendarDays },
  { name: "ROOMS", href: "/quartos", icon: BedDouble },
  { name: "GUESTS", href: "/hospedes", icon: Users },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#12141c] border-t border-[#1e2130] pb-safe">
      <nav className="flex justify-around items-center px-2 py-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href === '/hospedes' && pathname === '/perfil'); // Ajuste temporário caso perfil seja hospede
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 w-full"
            >
              <item.icon
                className={cn(
                  "h-6 w-6 transition-colors",
                  isActive ? "text-emerald-400" : "text-zinc-500"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span 
                className={cn(
                  "text-[10px] font-bold tracking-wider",
                  isActive ? "text-emerald-400" : "text-zinc-500"
                )}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
