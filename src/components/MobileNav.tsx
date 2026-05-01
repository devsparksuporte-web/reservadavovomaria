"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CalendarDays, BedDouble, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Agenda", href: "/agenda", icon: CalendarDays },
  { name: "Quartos", href: "/quartos", icon: BedDouble },
  { name: "Hóspedes", href: "/hospedes", icon: Users },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1c1c1c]/95 backdrop-blur-md border-t border-[#2e2e2e] pb-safe">
      <nav className="flex justify-around items-center px-2 py-2.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href === '/hospedes' && pathname === '/perfil');
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 w-full"
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-[#3ecf8e]" : "text-[#555555]"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span 
                className={cn(
                  "text-[9px] font-semibold tracking-wider",
                  isActive ? "text-[#3ecf8e]" : "text-[#555555]"
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
