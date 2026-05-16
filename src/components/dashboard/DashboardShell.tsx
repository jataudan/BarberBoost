'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, XCircle } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import type { Shop, Subscription } from '@/types/database'
import type { User } from '@supabase/supabase-js'
import type { PlanId } from '@/lib/stripe/plans'

interface DashboardShellProps {
  user:              User
  shop:              Shop | null
  subscription:      Subscription | null
  notificationCount: number
  children:          React.ReactNode
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
  subscription,
  notificationCount,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const plan = ((subscription?.plan as PlanId | undefined) ?? 'free') satisfies PlanId

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
        {/* Subscription health banners */}
        {subscription?.status === 'past_due' && (
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
        {(subscription?.status === 'canceled' || subscription?.status === 'inactive') && subscription.plan !== 'free' && (
          <div className="flex items-center gap-3 bg-red-500/[0.08] border-b border-red-500/20 px-4 py-3 text-sm text-red-300 flex-shrink-0">
            <XCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span className="flex-1">
              Your subscription has ended. Your account has been downgraded to the free plan.
            </span>
            <Link href="/settings/billing"
              className="flex-shrink-0 bg-red-500 hover:bg-red-400 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors">
              Reactivate
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
