'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

interface ShopRow {
  id:           string
  name:         string
  slug:         string
  email:        string | null
  phone:        string | null
  city:         string | null
  admin_status: string
  created_at:   string
  subscriptions: { plan: string; status: string }[] | null
}

const ADMIN_STATUS_BADGE: Record<string, string> = {
  active:    'bg-emerald-500/15 text-emerald-400',
  suspended: 'bg-amber-500/15 text-amber-400',
  disabled:  'bg-red-500/15 text-red-400',
}

const PLAN_BADGE: Record<string, string> = {
  free:    'bg-slate-500/15 text-slate-400',
  starter: 'bg-indigo-500/15 text-indigo-400',
  pro:     'bg-amber-500/15 text-amber-400',
  empire:  'bg-emerald-500/15 text-emerald-400',
}

export default function AdminShopsPage() {
  const [shops, setShops]         = useState<ShopRow[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [planFilter, setPlan]     = useState('')
  const [statusFilter, setStatus] = useState('')

  const limit = 20

  const load = useCallback(async (p: number, q: string, plan: string, adminStatus: string) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (q)           params.set('q', q)
    if (plan)        params.set('plan', plan)
    if (adminStatus) params.set('admin_status', adminStatus)
    const res  = await fetch(`/api/admin/shops?${params}`)
    const data = await res.json()
    setShops(data.shops ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { load(page, search, planFilter, statusFilter) }, [load, page, search, planFilter, statusFilter])

  const totalPages = Math.ceil(total / limit)

  const getSubPlan = (shop: ShopRow) => {
    const subs = Array.isArray(shop.subscriptions) ? shop.subscriptions : []
    return subs[0]?.plan ?? 'free'
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shops</h1>
          <p className="text-white/40 text-sm">{total} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search name, email, city…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>

        <select
          value={planFilter}
          onChange={e => { setPlan(e.target.value); setPage(1) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="empire">Empire</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-4 py-3 text-white/40 font-medium">Shop</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium hidden sm:table-cell">City</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium">Plan</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium hidden md:table-cell">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-white/30">Loading…</td>
              </tr>
            ) : shops.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-white/30">No shops found</td>
              </tr>
            ) : shops.map(shop => {
              const plan = getSubPlan(shop)
              return (
                <tr key={shop.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{shop.name}</div>
                    {shop.email && <div className="text-xs text-white/40">{shop.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-white/60 hidden sm:table-cell">
                    {shop.city ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${PLAN_BADGE[plan] ?? PLAN_BADGE.free}`}>
                      {plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${ADMIN_STATUS_BADGE[shop.admin_status] ?? ADMIN_STATUS_BADGE.active}`}>
                      {shop.admin_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs hidden md:table-cell">
                    {new Date(shop.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/shops/${shop.id}`}
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-white/40">
            Page {page} of {totalPages}
          </span>
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
