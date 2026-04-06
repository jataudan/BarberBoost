'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// 5 primary destinations — full nav accessible via header hamburger
const BOTTOM_NAV_ITEMS = [
  { label: 'Overview',  href: '/dashboard', icon: LayoutDashboard },
  { label: 'Bookings',  href: '/bookings',  icon: Calendar },
  { label: 'Clients',   href: '/clients',   icon: Users },
  { label: 'Services',  href: '/services',  icon: Scissors },
  { label: 'Settings',  href: '/settings',  icon: Settings },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#111111] border-t border-white/[0.06] flex items-center justify-around"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      aria-label="Primary navigation"
    >
      {BOTTOM_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = href === '/dashboard'
          ? pathname === href
          : pathname === href || pathname.startsWith(href + '/')

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 px-4 min-w-[60px] min-h-[44px] rounded-xl transition-colors',
              active
                ? 'text-[#c9a84c]'
                : 'text-zinc-500 hover:text-zinc-300 active:text-zinc-300'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className={cn(
              'text-[9px] font-semibold tracking-wide',
              active ? 'text-[#c9a84c]' : 'text-zinc-600'
            )}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
