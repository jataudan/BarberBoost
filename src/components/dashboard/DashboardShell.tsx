'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Clock, Lock } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import type { Shop } from '@/types/database'
import type { User } from '@supabase/supabase-js'
import type { PlanId } from '@/lib/stripe/plans'
import type { Entitlement } from '@/lib/entitlement'

interface DashboardShellProps {
  user:              User
  shop:              Shop | null
  entitlement:       Entitlement | null
  notificationCount: number
  children:          React.ReactNode
}

/** neutral until day 20, amber from day 23, red from day 27 of a 30-day trial */
function trialBannerTone(daysRemaining: number): 'neutral' | 'amber' | 'red' {
  if (daysRemaining <= 3) return 'red'
  if (daysRemaining <= 7) return 'amber'
  return 'neutral'
}

const READ_ONLY_COPY: Record<NonNullable<Entitlement['readOnlyReason']>, { message: string; cta: string }> = {
  paused:           { message: 'Your trial ended without a payment method. Your data is safe — add a card to reactivate.', cta: 'Reactivate' },
  canceled:         { message: 'Your subscription has ended. Your data is safe and read-only until you resubscribe.',      cta: 'Reactivate' },
  past_due_expired: { message: 'Your account is read-only after a failed payment. Update your card to restore access.',   cta: 'Update Card' },
}

function deriveInitials(text: string): string {
  const parts = text.split(/[\s@.]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase()
  return 'BB'
}

export function DashboardShell({
  user,
  shop,
  entitlement,
  notificationCount,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const plan = (entitlement?.plan ?? 'free') satisfies PlanId

  // Persist shop context to localStorage so client-only pages (bookings, etc.) can read it
  useEffect(() => {
    if (shop) {
      localStorage.setItem('bb_shop_id',   shop.id)
      localStorage.setItem('bb_currency',  shop.currency ?? 'GBP')
      localStorage.setItem('bb_shop_name', shop.name ?? 'Your Shop')
    }
    localStorage.setItem('bb_plan', plan)
  }, [shop, plan])
  const rawName: string =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    'Barber'
  const initials = deriveInitials(rawName)
  const shopName = shop?.name ?? 'My Shop'

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        plan={plan}
        shopName={shopName}
        displayName={rawName}
        initials={initials}
        email={user.email ?? ''}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header
          shopId={shop?.id ?? ''}
          notificationCount={notificationCount}
          onMenuOpen={() => setMobileOpen(true)}
        />
        {/* Subscription health banners — driven entirely by getEntitlement(), no scattered status checks */}
        {entitlement?.state === 'trialing' && entitlement.trialDaysRemaining != null && (() => {
          const tone = trialBannerTone(entitlement.trialDaysRemaining)
          const toneClasses = {
            neutral: 'bg-white/[0.04] border-white/10 text-zinc-300',
            amber:   'bg-amber-400/[0.08] border-amber-400/20 text-amber-300',
            red:     'bg-red-500/[0.08] border-red-500/20 text-red-300',
          }[tone]
          const btnClasses = {
            neutral: 'bg-white/10 hover:bg-white/15 text-white',
            amber:   'bg-amber-400 hover:bg-amber-300 text-[#0a0a0a]',
            red:     'bg-red-500 hover:bg-red-400 text-white',
          }[tone]
          return (
            <div className={`flex items-center gap-3 border-b px-4 py-3 text-sm flex-shrink-0 ${toneClasses}`}>
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">
                {entitlement.trialDaysRemaining === 0
                  ? 'Your free trial ends today.'
                  : `${entitlement.trialDaysRemaining} day${entitlement.trialDaysRemaining === 1 ? '' : 's'} left in your free trial.`}
              </span>
              <Link href="/settings/billing"
                className={`flex-shrink-0 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors ${btnClasses}`}>
                Choose your plan
              </Link>
            </div>
          )
        })()}

        {entitlement?.state === 'past_due' && (
          <div className="flex items-center gap-3 bg-yellow-400/[0.08] border-b border-yellow-400/20 px-4 py-3 text-sm text-yellow-300 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-yellow-400" />
            <span className="flex-1">
              Your last payment failed. Update your payment method to avoid losing access to paid features.
            </span>
            <Link href="/settings/billing"
              className="flex-shrink-0 bg-yellow-400 hover:bg-yellow-300 text-[#0a0a0a] font-bold text-xs px-3 py-1.5 rounded-lg transition-colors">
              Fix Now
            </Link>
          </div>
        )}

        {entitlement?.isReadOnly && entitlement.readOnlyReason && (
          <div className="flex items-center gap-3 bg-red-500/[0.08] border-b border-red-500/20 px-4 py-3 text-sm text-red-300 flex-shrink-0">
            <Lock className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span className="flex-1">
              {READ_ONLY_COPY[entitlement.readOnlyReason].message}
            </span>
            <Link href="/settings/billing"
              className="flex-shrink-0 bg-red-500 hover:bg-red-400 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors">
              {READ_ONLY_COPY[entitlement.readOnlyReason].cta}
            </Link>
          </div>
        )}

        {/* Extra bottom padding on mobile so content clears the bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6 bg-[#0a0a0a]">
          {children}
        </main>
      </div>

      {/* Fixed bottom navigation — mobile only */}
      <BottomNav />
    </div>
  )
}
