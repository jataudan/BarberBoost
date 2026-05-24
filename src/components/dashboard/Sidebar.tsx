'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PLANS, type PlanId } from '@/lib/stripe/plans'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  UserCheck,
  BarChart2,
  Megaphone,
  Package,
  Settings,
  X,
  Zap,
  LogOut,
  Image as ImageIcon,
} from 'lucide-react'

// ── Plan-coloured Tailwind class maps ──────────────────────────────────────
const PLAN_STYLES: Record<
  PlanId,
  { badge: string; dot: string; upgrade: string; upgradeText: string }
> = {
  free: {
    badge:       'bg-slate-400/10 border-slate-400/20 text-slate-300',
    dot:         'bg-slate-400',
    upgrade:     'border-slate-400/20 bg-slate-400/10 hover:bg-slate-400/20 text-slate-300',
    upgradeText: 'text-slate-300',
  },
  starter: {
    badge:       'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
    dot:         'bg-indigo-500',
    upgrade:     'border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300',
    upgradeText: 'text-indigo-300',
  },
  pro: {
    badge:       'bg-amber-500/10 border-amber-500/20 text-amber-300',
    dot:         'bg-amber-500',
    upgrade:     'border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300',
    upgradeText: 'text-amber-300',
  },
  empire: {
    badge:       'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    dot:         'bg-emerald-500',
    upgrade:     'border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300',
    upgradeText: 'text-emerald-300',
  },
}

const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'empire']

const PLAN_LABEL_STYLES: Record<PlanId, string> = {
  free:    'text-slate-400',
  starter: 'text-indigo-400',
  pro:     'text-amber-400',
  empire:  'text-emerald-400',
}

// ── Nav definition ─────────────────────────────────────────────────────────
type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  planRequired?: PlanId
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview',  href: '/dashboard', icon: LayoutDashboard },
  { label: 'Bookings',  href: '/bookings',  icon: Calendar },
  { label: 'Clients',   href: '/clients',   icon: Users },
  { label: 'Services',  href: '/services',  icon: Scissors },
  { label: 'Staff',     href: '/staff',     icon: UserCheck },
  { label: 'Analytics', href: '/analytics', icon: BarChart2 },
  { label: 'Styles',    href: '/styles',    icon: ImageIcon, planRequired: 'starter' },
  { label: 'Marketing', href: '/marketing', icon: Megaphone, planRequired: 'starter' },
  { label: 'Inventory', href: '/inventory', icon: Package,   planRequired: 'pro' },
  { label: 'Settings',  href: '/settings',  icon: Settings },
]

// ── Props ──────────────────────────────────────────────────────────────────
interface SidebarProps {
  plan: PlanId
  shopName: string
  displayName: string
  initials: string
  email: string
  mobileOpen: boolean
  onClose: () => void
}

// ── Component ──────────────────────────────────────────────────────────────
export function Sidebar(props: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col bg-[#111111] border-r border-white/[0.06]">
        <SidebarInner {...props} />
      </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-[#111111] border-r border-white/[0.06] transition-transform duration-300 lg:hidden',
          props.mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          type="button"
          onClick={props.onClose}
          aria-label="Close sidebar"
          className="absolute top-4 right-3 p-1 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarInner {...props} />
      </aside>
    </>
  )
}

// ── Inner content (shared between desktop + mobile) ─────────────────────
function SidebarInner({
  plan,
  shopName,
  displayName,
  initials,
  email,
  onClose,
}: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const styles   = PLAN_STYLES[plan]
  const planIdx  = PLAN_ORDER.indexOf(plan)
  const isEmpire = plan === 'empire'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link href="/dashboard" onClick={onClose} className="flex flex-col gap-1">
          <Image src="/logo.png" alt="BarberBoost" width={120} height={24} className="h-6 w-auto" />
          <p className="text-[10px] text-zinc-500 truncate leading-tight">{shopName}</p>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon, planRequired }) => {
          const active  = href === '/dashboard'
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/')
          const reqIdx  = planRequired ? PLAN_ORDER.indexOf(planRequired) : -1
          const locked  = reqIdx > planIdx

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-[#c9a84c]/10 text-[#c9a84c] font-medium'
                  : locked
                    ? 'text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {locked && planRequired && (
                <span className={cn('text-[9px] font-bold uppercase tracking-wider', PLAN_LABEL_STYLES[planRequired])}>
                  {PLANS[planRequired].name}+
                </span>
              )}
              {active && !locked && (
                <div className="w-1 h-3.5 rounded-full bg-[#c9a84c]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: user + plan */}
      <div className="px-4 py-4 border-t border-white/[0.06] space-y-3">
        {/* Upgrade CTA */}
        {!isEmpire && (
          <Link
            href="/settings/billing"
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors',
              styles.upgrade
            )}
          >
            <Zap className="w-3 h-3 flex-shrink-0" />
            Upgrade Plan
          </Link>
        )}

        {/* Plan badge */}
        <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg border', styles.badge)}>
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', styles.dot)} />
          <span className="text-xs font-semibold">{PLANS[plan].name} Plan</span>
        </div>

        {/* User row */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#c9a84c]/20 border border-[#c9a84c]/30 flex items-center justify-center text-[#c9a84c] text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate leading-tight">{displayName}</p>
            <p className="text-[10px] text-zinc-500 truncate leading-tight">{email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  )
}
