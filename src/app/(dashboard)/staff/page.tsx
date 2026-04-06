'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus, Users, AlertCircle, Edit, Trash2,
  Calendar, TrendingUp, Percent, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { StaffModal } from '@/components/staff/StaffModal'
import { UpgradeModal } from '@/components/shared/UpgradeModal'
import { PLANS } from '@/lib/stripe/plans'
import type { PlanId } from '@/lib/stripe/plans'
import type { Staff } from '@/types/database'

// ── localStorage helpers ──────────────────────────────────────────────────
function stored(key: string, fallback = '') {
  return typeof window !== 'undefined' ? (localStorage.getItem(key) ?? fallback) : fallback
}

// ── Staff stats ───────────────────────────────────────────────────────────
interface StaffStats {
  todayBookings: number
  monthRevenue:  number
}

async function fetchStaffStats(shopId: string, staffIds: string[]): Promise<Record<string, StaffStats>> {
  if (!staffIds.length) return {}
  const supabase = createClient()
  const today    = format(new Date(), 'yyyy-MM-dd')
  const mStart   = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const mEnd     = format(endOfMonth(new Date()),   'yyyy-MM-dd')

  const { data } = await supabase
    .from('bookings')
    .select('staff_id, date, price, status')
    .eq('shop_id', shopId)
    .in('staff_id', staffIds)
    .gte('date', mStart)
    .lte('date', mEnd)

  const stats: Record<string, StaffStats> = {}
  for (const id of staffIds) stats[id] = { todayBookings: 0, monthRevenue: 0 }

  for (const b of data ?? []) {
    if (!b.staff_id) continue
    if (b.date === today && b.status !== 'cancelled' && b.status !== 'no_show') {
      stats[b.staff_id].todayBookings += 1
    }
    if ((b.status === 'completed' || b.status === 'confirmed') && b.price) {
      stats[b.staff_id].monthRevenue += b.price
    }
  }
  return stats
}

// ── Working hours summary ─────────────────────────────────────────────────
function workingDaysLabel(wh: Staff['working_hours']): string {
  if (!wh || !Object.keys(wh).length) return 'Hours not set'
  const days   = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const active = days.filter((d) => !(wh as Record<string, { closed?: boolean }>)[d]?.closed)
  if (!active.length) return 'All days off'
  if (active.length === 7) return '7 days / week'
  return `${active.length} days / week`
}

// ── Delete confirm ────────────────────────────────────────────────────────
function DeleteConfirm({ staff, onConfirm, onCancel }: {
  staff: Staff; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Remove staff member?</p>
            <p className="text-sm text-zinc-400 mt-0.5">
              <span className="text-white">{staff.name}</span> will be permanently removed.
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
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Staff card ────────────────────────────────────────────────────────────
function StaffCard({ staff, currency, stats, onEdit, onDelete }: {
  staff:    Staff
  currency: string
  stats:    StaffStats | undefined
  onEdit:   (s: Staff) => void
  onDelete: (s: Staff) => void
}) {
  const scopeClass = `stf-${staff.id.replace(/-/g, '').slice(0, 12)}`
  const revenue    = new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 })
    .format(stats?.monthRevenue ?? 0)

  return (
    <>
      <style>{`.${scopeClass}{--stf-colour:${staff.colour}}`}</style>
      <div className={cn(
        scopeClass,
        'group relative bg-[#111111] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-3',
        'hover:[border-color:color-mix(in_srgb,var(--stf-colour)_40%,transparent)]',
        'transition-all duration-300',
        !staff.is_active && 'opacity-60'
      )}>
        {/* Actions */}
        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => onEdit(staff)} aria-label="Edit staff"
            className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-zinc-400 hover:text-white flex items-center justify-center transition-colors">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(staff)} aria-label="Delete staff"
            className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Avatar + name */}
        <Link href={`/staff/${staff.id}`} className="flex items-center gap-3">
          {staff.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={staff.avatar_url} alt={staff.name}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 [border-color:color-mix(in_srgb,var(--stf-colour)_30%,transparent)]" />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border-2 [border-color:color-mix(in_srgb,var(--stf-colour)_30%,transparent)] [background-color:color-mix(in_srgb,var(--stf-colour)_15%,transparent)] [color:var(--stf-colour)]">
              {getInitials(staff.name)}
            </div>
          )}
          <div className="min-w-0 pr-8">
            <p className="font-semibold text-white truncate group-hover:[color:var(--stf-colour)] transition-colors">
              {staff.name}
            </p>
            <p className="text-xs text-zinc-500">{staff.role}</p>
          </div>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/[0.03] rounded-lg px-3 py-2 space-y-0.5">
            <div className="flex items-center gap-1 text-[10px] text-zinc-600 uppercase tracking-wider">
              <Calendar className="w-3 h-3" aria-hidden="true" />Today
            </div>
            <p className="text-lg font-bold text-white leading-tight">{stats?.todayBookings ?? 0}</p>
            <p className="text-[10px] text-zinc-600">bookings</p>
          </div>
          <div className="bg-white/[0.03] rounded-lg px-3 py-2 space-y-0.5">
            <div className="flex items-center gap-1 text-[10px] text-zinc-600 uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" aria-hidden="true" />Month
            </div>
            <p className="text-sm font-bold text-white leading-tight">{revenue}</p>
            <p className="text-[10px] text-zinc-600">revenue</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 pt-1 border-t border-white/[0.05]">
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Percent className="w-3 h-3" aria-hidden="true" />
            <span>{staff.commission_rate}% comm.</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Clock className="w-3 h-3" aria-hidden="true" />
            <span>{workingDaysLabel(staff.working_hours)}</span>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const [shopId]   = useState(() => stored('bb_shop_id'))
  const [currency] = useState(() => stored('bb_currency', 'GBP'))
  const [plan]     = useState<PlanId>(() => (stored('bb_plan', 'free') as PlanId))

  const [staffList,    setStaffList]    = useState<Staff[]>([])
  const [stats,        setStats]        = useState<Record<string, StaffStats>>({})
  const [loading,      setLoading]      = useState(true)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editStaff,    setEditStaff]    = useState<Staff | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null)
  const [upgradeOpen,  setUpgradeOpen]  = useState(false)

  const activeStaff = staffList.filter((s) => s.is_active)
  const maxStaff    = PLANS[plan].limits.staff
  const atLimit     = maxStaff !== -1 && activeStaff.length >= maxStaff

  const load = useCallback(async () => {
    if (!shopId) { setLoading(false); return }
    setLoading(true)
    const res  = await fetch(`/api/staff?shop_id=${shopId}`)
    const json = await res.json() as { data?: Staff[] }
    const list = json.data ?? []
    setStaffList(list)
    if (list.length) {
      const statsMap = await fetchStaffStats(shopId, list.map((s) => s.id))
      setStats(statsMap)
    }
    setLoading(false)
  }, [shopId])

  useEffect(() => { load() }, [load])

  function openAdd() {
    if (atLimit) { setUpgradeOpen(true); return }
    setEditStaff(null)
    setModalOpen(true)
  }

  function handleEdit(staff: Staff) {
    setEditStaff(staff)
    setModalOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    await fetch('/api/staff', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: deleteTarget.id }),
    })
    setStaffList((prev) => prev.filter((s) => s.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  function handleSuccess(staff: Staff) {
    setStaffList((prev) => {
      const idx = prev.findIndex((s) => s.id === staff.id)
      if (idx !== -1) { const next = [...prev]; next[idx] = staff; return next }
      return [...prev, staff].sort((a, b) => a.name.localeCompare(b.name))
    })
    if (shopId) fetchStaffStats(shopId, [staff.id])
      .then((s) => setStats((prev) => ({ ...prev, ...s })))
  }

  const limitPct = maxStaff !== -1 ? Math.min(100, Math.round((activeStaff.length / maxStaff) * 100)) : 0

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white leading-none">
            STAFF
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {loading ? 'Loading…' : `${staffList.length} team member${staffList.length !== 1 ? 's' : ''}`}
            {maxStaff !== -1 && !loading && ` · ${maxStaff - activeStaff.length} slots remaining`}
          </p>
        </div>
        <button type="button" onClick={openAdd}
          className="flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-sm rounded-xl px-4 py-2.5 transition-colors">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:block">Add Staff</span>
        </button>
      </div>

      {/* ── Plan limit bar ───────────────────────────────────────────── */}
      {maxStaff !== -1 && activeStaff.length > 0 && !loading && (
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-4">
          <Users className="w-4 h-4 text-zinc-500 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Staff slots — {activeStaff.length} / {maxStaff} used</span>
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
                limitPct >= 100 ? 'w-full' : limitPct >= 75 ? 'w-3/4' :
                limitPct >= 50 ? 'w-1/2'  : limitPct >= 25 ? 'w-1/4' : 'w-[10%]',
              )} />
            </div>
          </div>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      {!shopId ? (
        <EmptyShopState />
      ) : loading ? (
        <LoadingSkeleton />
      ) : staffList.length === 0 ? (
        <EmptyState onAdd={openAdd} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {staffList.map((s) => (
            <StaffCard key={s.id} staff={s} currency={currency} stats={stats[s.id]}
              onEdit={handleEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <StaffModal
        shopId={shopId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        editStaff={editStaff}
        onSuccess={handleSuccess}
      />

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        requiredPlan={plan === 'free' ? 'starter' : plan === 'starter' ? 'pro' : 'empire'}
        currentPlan={plan}
      />

      {deleteTarget && (
        <DeleteConfirm staff={deleteTarget} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-52 bg-[#111111] border border-white/[0.06] rounded-xl" />
      ))}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-white/[0.06] flex items-center justify-center">
        <Users className="w-7 h-7 text-zinc-700" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-400">No staff members yet</p>
        <p className="text-xs text-zinc-600 mt-1">Add your team to assign bookings and track performance.</p>
      </div>
      <button type="button" onClick={onAdd}
        className="flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-sm rounded-xl px-4 py-2 transition-colors">
        <Plus className="w-4 h-4" /> Add First Staff Member
      </button>
    </div>
  )
}

function EmptyShopState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Users className="w-10 h-10 text-zinc-700" />
      <p className="text-sm text-zinc-400">Shop not loaded — try refreshing.</p>
    </div>
  )
}
