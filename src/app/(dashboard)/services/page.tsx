'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Scissors, AlertCircle, Clock, ToggleLeft, ToggleRight, Edit, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ServiceModal, SERVICE_CATEGORIES } from '@/components/services/ServiceModal'
import { UpgradeModal } from '@/components/shared/UpgradeModal'
import { PLANS } from '@/lib/stripe/plans'
import type { PlanId } from '@/lib/stripe/plans'
import type { Service } from '@/types/database'

// ── localStorage helpers ──────────────────────────────────────────────────
function stored(key: string, fallback = '') {
  return typeof window !== 'undefined' ? (localStorage.getItem(key) ?? fallback) : fallback
}

// ── Delete confirm dialog ─────────────────────────────────────────────────
function DeleteConfirm({ service, onConfirm, onCancel }: {
  service:   Service
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
            <p className="font-semibold text-white">Delete service?</p>
            <p className="text-sm text-zinc-400 mt-0.5">
              <span className="text-white">{service.name}</span> will be permanently removed.
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

// ── Service card ──────────────────────────────────────────────────────────
function ServiceCard({ service, currency, onEdit, onDelete, onToggle }: {
  service:  Service
  currency: string
  onEdit:   (s: Service) => void
  onDelete: (s: Service) => void
  onToggle: (s: Service) => void
}) {
  const price = new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 2 }).format(service.price)

  // Use a scoped <style> element (React 19 hoists these) to inject the
  // runtime colour as a CSS custom property — avoids any inline style= prop.
  const scopeClass = `svc-${service.id.replace(/-/g, '').slice(0, 12)}`

  return (
    <>
      <style>{`.${scopeClass}{--svc-colour:${service.colour}}`}</style>
      <div
        className={cn(
          scopeClass,
          'group relative bg-[#111111] border rounded-xl p-4 transition-all duration-300 hover:shadow-lg flex flex-col gap-3',
          service.is_active
            ? 'border-white/[0.06] hover:border-white/[0.12]'
            : 'border-white/[0.03] opacity-60'
        )}
      >
        {/* Colour stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl [background-color:var(--svc-colour)]"
          role="presentation"
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex items-start gap-3 pt-1">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 [background-color:color-mix(in_srgb,var(--svc-colour)_15%,transparent)]">
            <Scissors className="w-4 h-4 [color:var(--svc-colour)]" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate text-sm">{service.name}</p>
          {service.description && (
            <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{service.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Clock className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          {service.duration_minutes < 60
            ? `${service.duration_minutes} min`
            : `${Math.floor(service.duration_minutes / 60)}h${service.duration_minutes % 60 > 0 ? ` ${service.duration_minutes % 60}m` : ''}`
          }
        </div>
        <div className="flex-1" />
        <span className="text-base font-bold text-white">{price}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
        <button
          type="button"
          onClick={() => onToggle(service)}
          aria-label={service.is_active ? 'Deactivate service' : 'Activate service'}
          className="flex items-center gap-1.5 text-xs transition-colors"
        >
          {service.is_active
            ? <ToggleRight className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            : <ToggleLeft  className="w-4 h-4 text-zinc-600"    aria-hidden="true" />
          }
          <span className={service.is_active ? 'text-emerald-400' : 'text-zinc-600'}>
            {service.is_active ? 'Active' : 'Inactive'}
          </span>
        </button>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => onEdit(service)} aria-label="Edit service"
            className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] text-zinc-400 hover:text-white flex items-center justify-center transition-colors">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(service)} aria-label="Delete service"
            className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const [shopId]   = useState(() => stored('bb_shop_id'))
  const [currency] = useState(() => stored('bb_currency', 'GBP'))
  const [plan]     = useState<PlanId>(() => (stored('bb_plan', 'free') as PlanId))

  const [services,     setServices]     = useState<Service[]>([])
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState<string>('All')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editService,  setEditService]  = useState<Service | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [upgradeOpen,  setUpgradeOpen]  = useState(false)
  const [togglingId,   setTogglingId]   = useState<string | null>(null)

  const maxServices = PLANS[plan].limits.services
  const atLimit     = maxServices !== -1 && services.length >= maxServices

  const load = useCallback(async () => {
    if (!shopId) { setLoading(false); return }
    setLoading(true)
    const res  = await fetch(`/api/services?shop_id=${shopId}`)
    const json = await res.json() as { data?: Service[] }
    setServices(json.data ?? [])
    setLoading(false)
  }, [shopId])

  useEffect(() => { load() }, [load])

  const presentCategories = SERVICE_CATEGORIES.filter((c) => services.some((s) => s.category === c))
  const tabs = ['All', ...presentCategories]

  const filtered = activeTab === 'All'
    ? services
    : services.filter((s) => s.category === activeTab)

  function openAdd() {
    if (atLimit) { setUpgradeOpen(true); return }
    setEditService(null)
    setModalOpen(true)
  }

  function handleEdit(service: Service) {
    setEditService(service)
    setModalOpen(true)
  }

  async function handleToggle(service: Service) {
    setTogglingId(service.id)
    const res  = await fetch('/api/services', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: service.id, is_active: !service.is_active }),
    })
    const json = await res.json() as { data?: Service }
    if (json.data) setServices((prev) => prev.map((s) => s.id === service.id ? json.data! : s))
    setTogglingId(null)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    await fetch('/api/services', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: deleteTarget.id }),
    })
    setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  function handleSuccess(service: Service) {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === service.id)
      if (idx !== -1) { const next = [...prev]; next[idx] = service; return next }
      return [...prev, service].sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  const limitPct = maxServices !== -1 ? Math.min(100, Math.round((services.length / maxServices) * 100)) : 0

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white leading-none">
            SERVICES
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {loading ? 'Loading…' : `${services.length} service${services.length !== 1 ? 's' : ''}`}
            {maxServices !== -1 && !loading && ` · ${maxServices - services.length} slots remaining`}
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-sm rounded-xl px-4 py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:block">Add Service</span>
        </button>
      </div>

      {/* ── Plan limit bar ───────────────────────────────────────────── */}
      {maxServices !== -1 && services.length > 0 && !loading && (
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-4">
          <Scissors className="w-4 h-4 text-zinc-500 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Service slots — {services.length} / {maxServices} used</span>
              {atLimit && (
                <button type="button" onClick={() => setUpgradeOpen(true)}
                  className="text-xs font-semibold text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">
                  Upgrade
                </button>
              )}
            </div>
            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden" role="presentation" aria-hidden="true">
              <div className={cn(
                'h-full rounded-full transition-all',
                atLimit ? 'bg-red-400' : 'bg-[#c9a84c]',
                limitPct >= 100 ? 'w-full' : limitPct >= 80 ? 'w-4/5' :
                limitPct >= 60 ? 'w-3/5'  : limitPct >= 40 ? 'w-2/5' :
                limitPct >= 20 ? 'w-1/5'  : 'w-[10%]',
              )} />
            </div>
          </div>
        </div>
      )}

      {/* ── Category tabs ────────────────────────────────────────────── */}
      {!loading && services.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {tabs.map((tab) => {
            const count = tab === 'All' ? services.length : services.filter((s) => s.category === tab).length
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  activeTab === tab
                    ? 'bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20'
                    : 'text-zinc-400 hover:text-white border border-transparent hover:border-white/[0.06]'
                )}
              >
                {tab}
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  activeTab === tab ? 'bg-[#c9a84c]/20 text-[#c9a84c]' : 'bg-white/[0.05] text-zinc-500'
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      {!shopId ? (
        <EmptyShopState />
      ) : loading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
        activeTab === 'All' ? (
          <EmptyState onAdd={openAdd} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-zinc-500">No {activeTab} services yet</p>
            <button type="button" onClick={() => { setEditService(null); setModalOpen(true) }}
              className="text-xs text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">
              Add one
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className={cn('relative', togglingId === s.id && 'pointer-events-none')}>
              {togglingId === s.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl z-10">
                  <Loader2 className="w-4 h-4 animate-spin text-[#c9a84c]" />
                </div>
              )}
              <ServiceCard
                service={s}
                currency={currency}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onToggle={handleToggle}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <ServiceModal
        shopId={shopId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        editService={editService}
        onSuccess={handleSuccess}
      />

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        requiredPlan={plan === 'free' ? 'starter' : 'pro'}
        currentPlan={plan}
      />

      {deleteTarget && (
        <DeleteConfirm
          service={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 bg-[#111111] border border-white/[0.06] rounded-xl" />
      ))}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="w-20 h-20 rounded-3xl bg-[#141414] border border-white/[0.06] flex items-center justify-center">
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="18" cy="22" r="8" fill="rgba(201,168,76,0.1)" stroke="rgba(201,168,76,0.25)" strokeWidth="1.5"/>
          <circle cx="18" cy="22" r="4" fill="rgba(201,168,76,0.2)"/>
          <circle cx="18" cy="44" r="8" fill="rgba(201,168,76,0.1)" stroke="rgba(201,168,76,0.25)" strokeWidth="1.5"/>
          <circle cx="18" cy="44" r="4" fill="rgba(201,168,76,0.2)"/>
          <line x1="24" y1="26" x2="50" y2="12" stroke="rgba(201,168,76,0.4)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="24" y1="40" x2="50" y2="54" stroke="rgba(201,168,76,0.4)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold text-zinc-300">No services yet</p>
        <p className="text-xs text-zinc-600 leading-relaxed">
          Add your service menu so clients know what you offer and can book online.
        </p>
      </div>
      <button type="button" onClick={onAdd}
        className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-sm rounded-xl px-5 py-2.5 transition-colors">
        <Plus className="w-4 h-4" />Add First Service
      </button>
    </div>
  )
}

function EmptyShopState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-white/[0.06] flex items-center justify-center">
        <Scissors className="w-6 h-6 text-zinc-700" />
      </div>
      <p className="text-sm text-zinc-500">Shop not loaded — try refreshing.</p>
    </div>
  )
}
