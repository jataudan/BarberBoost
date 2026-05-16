'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Store, Star, UserPlus, Menu, X, LogOut, Scissors,
} from 'lucide-react'

const NAV = [
  { label: 'Overview',  href: '/admin',          icon: LayoutDashboard },
  { label: 'Shops',     href: '/admin/shops',     icon: Store },
  { label: 'Reviews',   href: '/admin/reviews',   icon: Star },
  { label: 'Signups',   href: '/admin/signups',   icon: UserPlus },
]

interface AdminShellProps {
  email:    string
  children: React.ReactNode
}

export function AdminShell({ email, children }: AdminShellProps) {
  const pathname     = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-60 bg-[#111] border-r border-white/10 z-30 flex flex-col
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold leading-none">BarberBoost</div>
            <div className="text-[10px] text-orange-400 font-semibold uppercase tracking-widest mt-0.5">Admin</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'}
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="text-xs text-white/40 truncate mb-3">{email}</div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#111]">
          <button onClick={() => setOpen(true)} className="text-white/60 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center">
              <Scissors className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold">Admin</span>
          </div>
          <button onClick={() => setOpen(false)} className={open ? 'text-white' : 'invisible'}>
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
