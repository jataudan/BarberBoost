'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, Search, Grid3x3, List, Users, X, ChevronDown,
  UserPlus, AlertCircle, Download, Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClients, type ClientFilters } from '@/hooks/useClients'
import { ClientCard }         from '@/components/clients/ClientCard'
import { ClientModal }        from '@/components/clients/ClientModal'
import { ClientImportModal }  from '@/components/clients/ClientImportModal'
import { UpgradeModal } from '@/components/shared/UpgradeModal'
import type { Client } from '@/types/database'
import type { PlanId } from '@/lib/stripe/plans'
import { PLANS } from '@/lib/stripe/plans'

// ── localStorage helpers (matches bookings page pattern) ─────────────────
const SHOP_ID_KEY  = 'bb_shop_id'
const CURRENCY_KEY = 'bb_currency'
const PLAN_KEY     = 'bb_plan'

function stored(key: string, fallback = '') {
  return typeof window !== 'undefined' ? (localStorage.getItem(key) ?? fallback) : fallback
}

// ── Constants ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'name',       label: 'Name (A–Z)'    },
  { value: 'last_visit', label: 'Last visit'    },
  { value: 'spent',      label: 'Highest spend' },
  { value: 'visits',     label: 'Most visits'   },
] as const

const TAG_OPTIONS = ['New', 'Regular', 'VIP', 'At-risk']

// ── Row view ──────────────────────────────────────────────────────────────
function ClientRow({ client, currency, onEdit, onDelete }: {
  client:   Client
  currency: string
  onEdit?:  (c: Client) => void
  onDelete?:(c: Client) => void
}) {
  const tags    = (client.tags ?? []) as string[]
  const spent   = new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(client.total_spent ?? 0)

  return (
    <a
      href={`/clients/${client.id}`}
      className="group flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#c9a84c]/15 text-[#c9a84c] text-xs font-bold flex items-center justify-center flex-shrink-0">
        {client.name.slice(0, 2).toUpperCase()}
      </div>

      {/* Name + tags */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate group-hover:text-[#c9a84c] transition-colors">
          {client.name}
        </p>
        {tags.length > 0 && (
          <div className="flex gap-1 mt-0.5">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-400">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Contact */}
      <p className="hidden md:block text-xs text-zinc-500 truncate w-40">{client.phone ?? client.email ?? '—'}</p>

      {/* Stats */}
      <p className="hidden sm:block text-xs text-zinc-400 w-16 text-right">{client.total_visits ?? 0} visits</p>
      <p className="hidden sm:block text-xs text-zinc-300 w-20 text-right font-medium">{spent}</p>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button type="button" onClick={(e) => { e.preventDefault(); onEdit?.(client) }}
          className="w-6 h-6 rounded text-zinc-500 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors text-xs">
          ✎
        </button>
        <button type="button" onClick={(e) => { e.preventDefault(); onDelete?.(client) }}
          className="w-6 h-6 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.08] flex items-center justify-center transition-colors text-xs">
          ✕
        </button>
      </div>
    </a>
  )
}

// ── Delete confirmation ───────────────────────────────────────────────────
function DeleteConfirm({ client, onConfirm, onCancel }: {
  client:    Client
  onConfirm: () => void
  onCancel:  () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Delete client?</p>
            <p className="text-sm text-zinc-400 mt-0.5">
              <span className="text-white">{client.name}</span> and all their records will be permanently removed.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.05] transition-colors">
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-400 rounded-xl transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [shopId]   = useState(() => stored(SHOP_ID_KEY))
  const [currency] = useState(() => stored(CURRENCY_KEY, 'GBP'))
  const [plan]     = useState<PlanId>(() => (stored(PLAN_KEY, 'free') as PlanId))

  const [view,      setView]      = useState<'grid' | 'list'>('grid')
  const [search,    setSearch]    = useState('')
  const [tag,       setTag]       = useState('')
  const [sort,      setSort]      = useState<ClientFilters['sort']>('name')
  const [page,      setPage]      = useState(1)

  const [modalOpen,    setModalOpen]    = useState(false)
  const [editClient,   setEditClient]   = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [upgradeOpen,  setUpgradeOpen]  = useState(false)
  const [importOpen,   setImportOpen]   = useState(false)

  const { clients, meta, loading, fetchClients, deleteClient } = useClients()
  const searchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const load = useCallback((overrides: Partial<ClientFilters> = {}) => {
    if (!shopId) return
    fetchClients(shopId, { search, tag, sort, page, limit: 48, ...overrides })
  }, [shopId, search, tag, sort, page, fetchClients])

  // Initial + filter changes
  useEffect(() => { load() }, [load])

  // Debounced search
  function handleSearch(value: string) {
    setSearch(value)
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setPage(1)
      fetchClients(shopId, { search: value, tag, sort, page: 1, limit: 48 })
    }, 350)
  }

  function handleTagFilter(t: string) {
    const next = t === tag ? '' : t
    setTag(next); setPage(1)
    fetchClients(shopId, { search, tag: next, sort, page: 1, limit: 48 })
  }

  function handleSort(s: ClientFilters['sort']) {
    setSort(s); setPage(1)
    fetchClients(shopId, { search, tag, sort: s, page: 1, limit: 48 })
  }

  async function exportCSV() {
    if (!shopId) return
    const res  = await fetch(`/api/clients/export?shop_id=${shopId}`)
    if (!res.ok) return
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'clients.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function openAdd() {
    const maxClients = PLANS[plan].limits.clients
    if (maxClients !== -1 && (meta?.total ?? 0) >= maxClients) {
      setUpgradeOpen(true)
      return
    }
    setEditClient(null)
    setModalOpen(true)
  }

  function handleEdit(client: Client) {
    setEditClient(client)
    setModalOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    await deleteClient(deleteTarget.id)
    setDeleteTarget(null)
  }

  function handleSuccess(_client: Client) {
    load()
  }

  const maxClients  = PLANS[plan].limits.clients
  const atLimit     = maxClients !== -1 && (meta?.total ?? 0) >= maxClients
  const limitPct    = maxClients !== -1 ? Math.min(100, Math.round(((meta?.total ?? 0) / maxClients) * 100)) : 0

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl xs:text-3xl tracking-widest text-white leading-none">
            CLIENTS
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {meta ? `${meta.total.toLocaleString()} client${meta.total !== 1 ? 's' : ''}` : 'Your client base'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCSV}
            title="Export clients to CSV"
            className="flex items-center gap-1.5 bg-[#111111] border border-white/[0.06] hover:border-white/[0.12] text-zinc-400 hover:text-white text-sm rounded-xl px-3.5 py-2.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:block">Export</span>
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            title="Import clients from CSV"
            className="flex items-center gap-1.5 bg-[#111111] border border-white/[0.06] hover:border-white/[0.12] text-zinc-400 hover:text-white text-sm rounded-xl px-3.5 py-2.5 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:block">Import</span>
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-sm rounded-xl px-4 py-2.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">Add Client</span>
          </button>
        </div>
      </div>

      {/* ── Plan limit bar ───────────────────────────────────────────── */}
      {maxClients !== -1 && (meta?.total ?? 0) > 0 && (
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-4">
          <Users className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Client slots — {meta?.total ?? 0} / {maxClients} used
              </span>
              {atLimit && (
                <button
                  type="button"
                  onClick={() => setUpgradeOpen(true)}
                  className="text-xs font-semibold text-[#c9a84c] hover:text-[#e2bf6a] transition-colors"
                >
                  Upgrade
                </button>
              )}
            </div>
            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all origin-left', atLimit ? 'bg-red-400' : 'bg-[#c9a84c]',
                  limitPct === 0  && 'scale-x-0',
                  limitPct <= 10  && 'w-[10%]',
                  limitPct <= 20  && limitPct > 10  && 'w-1/5',
                  limitPct <= 30  && limitPct > 20  && 'w-[30%]',
                  limitPct <= 40  && limitPct > 30  && 'w-2/5',
                  limitPct <= 50  && limitPct > 40  && 'w-1/2',
                  limitPct <= 60  && limitPct > 50  && 'w-3/5',
                  limitPct <= 70  && limitPct > 60  && 'w-[70%]',
                  limitPct <= 80  && limitPct > 70  && 'w-4/5',
                  limitPct <= 90  && limitPct > 80  && 'w-[90%]',
                  limitPct >  90  && 'w-full',
                )}
                role="presentation"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {/* Row 1: Search + sort + view toggle */}
        <div className="flex items-center gap-2">
          {/* Search — full width on mobile, capped on wider */}
          <div className="relative flex-1 min-w-0 max-w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search clients…"
              className="w-full bg-[#111111] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/20 transition-all"
            />
            {search && (
              <button type="button" onClick={() => handleSearch('')} aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative flex-shrink-0">
            <select
              value={sort}
              onChange={(e) => handleSort(e.target.value as ClientFilters['sort'])}
              aria-label="Sort clients"
              title="Sort clients"
              className="appearance-none bg-[#111111] border border-white/[0.06] rounded-xl pl-3 pr-8 py-2 text-xs text-zinc-400 outline-none focus:border-[#c9a84c]/50 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-[#111111] border border-white/[0.06] rounded-xl p-0.5 flex-shrink-0">
            <button type="button" onClick={() => setView('grid')} aria-label="Grid view" title="Grid view"
              className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                view === 'grid' ? 'bg-[#c9a84c]/10 text-[#c9a84c]' : 'text-zinc-500 hover:text-white')}>
              <Grid3x3 className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => setView('list')} aria-label="List view" title="List view"
              className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                view === 'list' ? 'bg-[#c9a84c]/10 text-[#c9a84c]' : 'text-zinc-500 hover:text-white')}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Tag filters — scrollable on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none -mx-0">
          {TAG_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTagFilter(t)}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-full border transition-all whitespace-nowrap flex-shrink-0',
                tag === t
                  ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/25'
                  : 'bg-white/[0.04] text-zinc-500 border-white/[0.06] hover:text-zinc-300 hover:border-zinc-600'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {!shopId ? (
        <EmptyShopState />
      ) : loading && clients.length === 0 ? (
        <LoadingSkeleton view={view} />
      ) : clients.length === 0 ? (
        <EmptyState hasFilters={!!(search || tag)} onAdd={openAdd} onClear={() => { handleSearch(''); setTag('') }} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clients.map((c) => (
            <ClientCard key={c.id} client={c} currency={currency} onEdit={handleEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
          {/* List header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_80px_90px_40px] gap-4 px-5 py-2.5 border-b border-white/[0.06] text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
            <span>Client</span>
            <span>Contact</span>
            <span className="text-right">Visits</span>
            <span className="text-right">Spent</span>
            <span />
          </div>
          {clients.map((c) => (
            <ClientRow key={c.id} client={c} currency={currency} onEdit={handleEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <button type="button" disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-xs bg-[#111111] border border-white/[0.06] rounded-lg text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            <button type="button" disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs bg-[#111111] border border-white/[0.06] rounded-lg text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <ClientModal
        shopId={shopId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        editClient={editClient}
        onSuccess={handleSuccess}
      />

      <ClientImportModal
        shopId={shopId}
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={load}
      />

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        requiredPlan="starter"
        currentPlan={plan}
      />

      {deleteTarget && (
        <DeleteConfirm
          client={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────
function LoadingSkeleton({ view }: { view: 'grid' | 'list' }) {
  if (view === 'list') {
    return (
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-white/[0.04] bg-white/[0.02]" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-52 bg-[#111111] border border-white/[0.06] rounded-xl" />
      ))}
    </div>
  )
}

// ── Empty states ──────────────────────────────────────────────────────────
function EmptyState({ hasFilters, onAdd, onClear }: {
  hasFilters: boolean; onAdd: () => void; onClear: () => void
}) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-white/[0.06] flex items-center justify-center">
          <Search className="w-7 h-7 text-zinc-700" />
        </div>
        <div className="space-y-1 max-w-xs">
          <p className="text-sm font-semibold text-zinc-300">No clients match your filters</p>
          <p className="text-xs text-zinc-600">Try clearing your search or tag filter.</p>
        </div>
        <button type="button" onClick={onClear}
          className="text-sm text-[#c9a84c] hover:text-[#e2bf6a] transition-colors font-medium">
          Clear filters
        </button>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="w-20 h-20 rounded-3xl bg-[#141414] border border-white/[0.06] flex items-center justify-center">
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="32" cy="22" r="12" fill="rgba(201,168,76,0.1)" stroke="rgba(201,168,76,0.25)" strokeWidth="1.5"/>
          <circle cx="32" cy="22" r="7" fill="rgba(201,168,76,0.2)"/>
          <path d="M12 54c0-11 9-18 20-18s20 7 20 18" stroke="rgba(201,168,76,0.25)" strokeWidth="1.5" strokeLinecap="round" fill="rgba(201,168,76,0.06)"/>
          <circle cx="14" cy="28" r="7" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
          <circle cx="50" cy="28" r="7" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
        </svg>
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold text-zinc-300">No clients yet</p>
        <p className="text-xs text-zinc-600 leading-relaxed">
          Add your first client to start building your client database and tracking visits.
        </p>
      </div>
      <button type="button" onClick={onAdd}
        className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-sm rounded-xl px-5 py-2.5 transition-colors">
        <Plus className="w-4 h-4" />Add First Client
      </button>
    </div>
  )
}

function EmptyShopState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-white/[0.06] flex items-center justify-center">
        <Users className="w-6 h-6 text-zinc-700" />
      </div>
      <p className="text-sm text-zinc-500">Shop not loaded — try refreshing.</p>
    </div>
  )
}
