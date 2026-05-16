'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Store, TrendingUp, UserPlus, AlertTriangle, PauseCircle, XCircle } from 'lucide-react'

interface Metrics {
  totalShops:     number
  mrr:            number
  planCounts:     Record<string, number>
  pastDueCount:   number
  recentSignups:  number
  suspendedCount: number
  disabledCount:  number
}

const PLAN_COLOURS: Record<string, string> = {
  free:    'bg-slate-500',
  starter: 'bg-indigo-500',
  pro:     'bg-amber-500',
  empire:  'bg-emerald-500',
}

const PLAN_PRICES: Record<string, number> = { free: 0, starter: 19, pro: 39, empire: 79 }

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then(r => r.json())
      .then(setMetrics)
      .finally(() => setLoading(false))
  }, [])

  const cards = metrics ? [
    {
      label:   'Total Shops',
      value:   metrics.totalShops,
      icon:    Store,
      colour:  'text-indigo-400',
      bg:      'bg-indigo-500/10',
      href:    '/admin/shops',
    },
    {
      label:   'Monthly Revenue',
      value:   `£${metrics.mrr.toLocaleString()}`,
      icon:    TrendingUp,
      colour:  'text-emerald-400',
      bg:      'bg-emerald-500/10',
      href:    null,
    },
    {
      label:   'New This Week',
      value:   metrics.recentSignups,
      icon:    UserPlus,
      colour:  'text-sky-400',
      bg:      'bg-sky-500/10',
      href:    '/admin/signups',
    },
    {
      label:   'Past Due',
      value:   metrics.pastDueCount,
      icon:    AlertTriangle,
      colour:  'text-amber-400',
      bg:      'bg-amber-500/10',
      href:    '/admin/shops?admin_status=active&sub_status=past_due',
    },
    {
      label:   'Suspended',
      value:   metrics.suspendedCount,
      icon:    PauseCircle,
      colour:  'text-orange-400',
      bg:      'bg-orange-500/10',
      href:    '/admin/shops?admin_status=suspended',
    },
    {
      label:   'Disabled',
      value:   metrics.disabledCount,
      icon:    XCircle,
      colour:  'text-red-400',
      bg:      'bg-red-500/10',
      href:    '/admin/shops?admin_status=disabled',
    },
  ] : []

  const totalPaid = metrics
    ? (metrics.planCounts.starter ?? 0) + (metrics.planCounts.pro ?? 0) + (metrics.planCounts.empire ?? 0)
    : 0

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Overview</h1>
      <p className="text-white/40 text-sm mb-8">Platform health at a glance</p>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-white/40">Loading…</div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
            {cards.map(({ label, value, icon: Icon, colour, bg, href }) => {
              const content = (
                <div className={`rounded-xl border border-white/10 p-5 ${href ? 'hover:border-white/20 transition-colors cursor-pointer' : ''}`}>
                  <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${colour}`} />
                  </div>
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs text-white/40 mt-1">{label}</div>
                </div>
              )
              return href ? (
                <Link key={label} href={href}>{content}</Link>
              ) : (
                <div key={label}>{content}</div>
              )
            })}
          </div>

          {/* Plan distribution */}
          <div className="rounded-xl border border-white/10 p-6 mb-6">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-5">
              Plan Distribution
            </h2>
            <div className="space-y-3">
              {(['free', 'starter', 'pro', 'empire'] as const).map(plan => {
                const count  = metrics?.planCounts[plan] ?? 0
                const total  = metrics?.totalShops ?? 1
                const pct    = total > 0 ? Math.round((count / total) * 100) : 0
                const price  = PLAN_PRICES[plan]
                return (
                  <div key={plan} className="flex items-center gap-3">
                    <div className="w-16 text-xs text-white/60 capitalize">{plan}</div>
                    <div className="flex-1 h-2 rounded-full bg-white/5">
                      <div
                        className={`h-2 rounded-full ${PLAN_COLOURS[plan]} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-8 text-xs text-white/60 text-right">{count}</div>
                    <div className="w-14 text-xs text-white/40 text-right">
                      {price > 0 ? `£${price}/mo` : 'Free'}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-white/30 mt-4">
              {totalPaid} paying shop{totalPaid !== 1 ? 's' : ''}
              {' · '}
              {((totalPaid / (metrics?.totalShops || 1)) * 100).toFixed(0)}% conversion
            </p>
          </div>

          {/* Quick links */}
          <div className="flex gap-3 flex-wrap">
            <Link href="/admin/shops"   className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors">View all shops</Link>
            <Link href="/admin/reviews" className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors">Review approvals</Link>
            <Link href="/admin/signups" className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors">Recent signups</Link>
          </div>
        </>
      )}
    </div>
  )
}
