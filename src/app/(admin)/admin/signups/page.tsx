'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'

interface SignupRow {
  id:           string
  name:         string
  email:        string | null
  city:         string | null
  admin_status: string
  created_at:   string
  subscriptions: { plan: string; status: string }[] | null
}

const PLAN_BADGE: Record<string, string> = {
  free:    'bg-slate-500/15 text-slate-400',
  starter: 'bg-indigo-500/15 text-indigo-400',
  pro:     'bg-amber-500/15 text-amber-400',
  empire:  'bg-emerald-500/15 text-emerald-400',
}

export default function AdminSignupsPage() {
  const [shops, setShops]     = useState<SignupRow[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)

  const limit = 20

  const load = useCallback(async (p: number) => {
    setLoading(true)
    const res  = await fetch(`/api/admin/shops?page=${p}`)
    const data = await res.json()
    setShops(data.shops ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { load(page) }, [load, page])

  const totalPages = Math.ceil(total / limit)

  const getSubPlan = (shop: SignupRow) => {
    const subs = Array.isArray(shop.subscriptions) ? shop.subscriptions : []
    return subs[0]?.plan ?? 'free'
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7)  return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Signups</h1>
      <p className="text-white/40 text-sm mb-8">All shops, most recent first · {total} total</p>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-white/40">Loading…</div>
      ) : shops.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-12 text-center text-white/30">
          No shops yet
        </div>
      ) : (
        <div className="space-y-3">
          {shops.map(shop => {
            const plan = getSubPlan(shop)
            return (
              <div
                key={shop.id}
                className="flex items-center gap-4 rounded-xl border border-white/10 px-5 py-4 hover:border-white/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm truncate">{shop.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${PLAN_BADGE[plan] ?? PLAN_BADGE.free}`}>
                      {plan}
                    </span>
                  </div>
                  <div className="text-xs text-white/40">
                    {[shop.email, shop.city].filter(Boolean).join(' · ')}
                  </div>
                </div>

                <div className="text-xs text-white/30 flex-shrink-0">{timeAgo(shop.created_at)}</div>

                <Link
                  href={`/admin/shops/${shop.id}`}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors flex-shrink-0"
                >
                  View <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 text-sm">
          <span className="text-white/40">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
