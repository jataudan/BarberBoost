'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, Plus } from 'lucide-react'
import { NotificationsBell } from './NotificationsBell'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':  'Overview',
  '/bookings':   'Bookings',
  '/clients':    'Clients',
  '/services':   'Services',
  '/staff':      'Staff',
  '/analytics':  'Analytics',
  '/marketing':  'Marketing',
  '/inventory':  'Inventory',
  '/settings':   'Settings',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(prefix + '/')) return title
  }
  return 'Dashboard'
}

interface HeaderProps {
  shopId:            string
  notificationCount: number
  onMenuOpen:        () => void
}

export function Header({ shopId, notificationCount, onMenuOpen }: HeaderProps) {
  const pathname = usePathname()
  const title    = getPageTitle(pathname)

  return (
    <header className="h-14 flex-shrink-0 border-b border-white/[0.06] bg-[#111111] flex items-center justify-between px-4 lg:px-6 gap-4">
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Open navigation"
          className="lg:hidden text-zinc-400 hover:text-white transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-[family-name:var(--font-heading)] text-xl lg:text-2xl tracking-widest text-white leading-none truncate">
          {title}
        </h1>
      </div>

      {/* Right: quick-add + notifications */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Quick-add booking */}
        <Link
          href="/bookings"
          className="hidden sm:flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] text-xs font-bold rounded-lg px-3 py-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Booking
        </Link>
        <Link
          href="/bookings"
          aria-label="New booking"
          className="sm:hidden w-8 h-8 rounded-lg bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] flex items-center justify-center transition-colors"
        >
          <Plus className="w-4 h-4" />
        </Link>

        {/* Notifications bell with realtime dropdown */}
        <NotificationsBell shopId={shopId} initialCount={notificationCount} />
      </div>
    </header>
  )
}
