'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  format, parseISO, startOfWeek, endOfWeek, addDays, isToday,
  startOfMonth, endOfMonth, subMonths,
} from 'date-fns'
import {
  ArrowLeft, Edit, Loader2, AlertCircle,
  Phone, Mail, TrendingUp, Star, Percent,
  Calendar, CheckCircle2, Clock, ChevronLeft, ChevronRight,
  Scissors, DollarSign, Plus, Ban, RefreshCw, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { StaffModal }   from '@/components/staff/StaffModal'
import { BookingModal } from '@/components/bookings/BookingModal'
import type { Staff, Booking, Service, BookingWithRelations } from '@/types/database'

// ── localStorage helpers ──────────────────────────────────────────────────
function stored(key: string, fallback = '') {
  return typeof window !== 'undefined' ? (localStorage.getItem(key) ?? fallback) : fallback
}

// ── Types ─────────────────────────────────────────────────────────────────
interface BookingRow extends Booking {
  service?: Pick<Service, 'id' | 'name' | 'colour'> | null
  client_name: string
}

interface PerformanceData {
  totalBookings:    number
  completedBookings:number
  totalRevenue:     number
  topServices:      { name: string; count: number; revenue: number }[]
  retentionClients: number
  totalClients:     number
}

// ── Status colours ────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  confirmed: 'bg-blue-500',
  completed: 'bg-emerald-500',
  pending:   'bg-yellow-500',
  cancelled: 'bg-red-500/60',
  no_show:   'bg-zinc-500',
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent = false }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; accent?: boolean
}) {
  return (
    <div className={cn(
      'bg-[#111111] border rounded-xl p-4 space-y-2',
      accent ? 'border-[#c9a84c]/20' : 'border-white/[0.06]'
    )}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{label}</p>
        <div className={accent ? 'text-[#c9a84c]' : 'text-zinc-600'}>{icon}</div>
      </div>
      <p className={cn('text-2xl font-bold', accent ? 'text-[#c9a84c]' : 'text-white')}>{value}</p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}

// ── Week schedule ─────────────────────────────────────────────────────────
function WeekSchedule({ bookings, weekStart, currency }: {
  bookings:  BookingRow[]
  weekStart: Date
  currency:  string
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-white/[0.06]">
        {days.map((day) => (
          <div key={day.toISOString()} className={cn(
            'py-2 text-center border-r border-white/[0.04] last:border-r-0',
            isToday(day) && 'bg-[#c9a84c]/[0.04]'
          )}>
            <p className={cn('text-[10px] uppercase tracking-wider', isToday(day) ? 'text-[#c9a84c]' : 'text-zinc-500')}>
              {format(day, 'EEE')}
            </p>
            <p className={cn('text-sm font-bold', isToday(day) ? 'text-[#c9a84c]' : 'text-zinc-300')}>
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-white/[0.04] min-h-[120px]">
        {days.map((day) => {
          const ds      = format(day, 'yyyy-MM-dd')
          const dayBkgs = bookings.filter((b) => b.date === ds)
          const revenue = dayBkgs.reduce((sum, b) => b.status !== 'cancelled' && b.status !== 'no_show' ? sum + (b.price ?? 0) : sum, 0)
          const fmt     = new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 })

          return (
            <div key={ds} className={cn('p-2 flex flex-col gap-1', isToday(day) && 'bg-[#c9a84c]/[0.02]')}>
              {dayBkgs.length === 0 ? (
                <div className="h-8 rounded bg-white/[0.02] flex items-center justify-center">
                  <span className="text-[9px] text-zinc-700">—</span>
                </div>
              ) : (
                <>
                  <span className="text-lg font-bold text-white leading-tight">{dayBkgs.length}</span>
                  {revenue > 0 && <span className="text-[10px] text-zinc-500">{fmt.format(revenue)}</span>}
                  <div className="flex gap-0.5 flex-wrap mt-auto">
                    {dayBkgs.slice(0, 4).map((b) => (
                      <div
                        key={b.id}
                        className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', STATUS_DOT[b.status] ?? 'bg-zinc-500')}
                        title={`${b.client_name} · ${b.start_time?.slice(0, 5)}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Commission calculator ─────────────────────────────────────────────────
function CommissionCalc({ staffId, shopId, currency, commissionRate }: {
  staffId:        string
  shopId:         string
  currency:       string
  commissionRate: number
}) {
  const [period,  setPeriod]  = useState<'this_month' | 'last_month'>('this_month')
  const [revenue, setRevenue] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now    = new Date()
    const ref    = period === 'this_month' ? now : subMonths(now, 1)
    const mStart = format(startOfMonth(ref), 'yyyy-MM-dd')
    const mEnd   = format(endOfMonth(ref),   'yyyy-MM-dd')

    setLoading(true)
    const supabase = createClient()
    supabase
      .from('bookings')
      .select('price, status')
      .eq('shop_id', shopId)
      .eq('staff_id', staffId)
      .eq('status', 'completed')
      .gte('date', mStart)
      .lte('date', mEnd)
      .then(({ data }) => {
        const total = (data ?? []).reduce((s, b) => s + (b.price ?? 0), 0)
        setRevenue(total)
        setLoading(false)
      })
  }, [period, staffId, shopId])

  const fmt        = new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 2 })
  const commission = revenue != null ? (revenue * commissionRate) / 100 : null

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#c9a84c]" aria-hidden="true" />
          <p className="text-sm font-semibold text-white">Commission Calculator</p>
        </div>
        <div className="flex items-center bg-[#1a1a1a] border border-white/[0.06] rounded-lg p-0.5">
          {(['this_month', 'last_month'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1 text-xs rounded-md transition-colors',
                period === p ? 'bg-[#c9a84c]/10 text-[#c9a84c]' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {p === 'this_month' ? 'This month' : 'Last month'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Revenue</p>
          <p className="text-xl font-bold text-white">
            {loading ? '—' : fmt.format(revenue ?? 0)}
          </p>
          <p className="text-[10px] text-zinc-600">completed bookings</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Rate</p>
          <p className="text-xl font-bold text-white">{commissionRate}%</p>
          <p className="text-[10px] text-zinc-600">commission rate</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Earnings</p>
          <p className="text-xl font-bold text-[#c9a84c]">
            {loading ? '—' : fmt.format(commission ?? 0)}
          </p>
          <p className="text-[10px] text-zinc-600">owed to barber</p>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function StaffDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const staffId = params.id as string

  const [shopId]   = useState(() => stored('bb_shop_id'))
  const [currency] = useState(() => stored('bb_currency', 'GBP'))

  const [staff,      setStaff]      = useState<Staff | null>(null)
  const [bookings,   setBookings]   = useState<BookingRow[]>([])
  const [perfData,   setPerfData]   = useState<PerformanceData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [tab,              setTab]              = useState<'schedule' | 'performance' | 'commission' | 'availability'>('schedule')
  const [editOpen,         setEditOpen]         = useState(false)
  const [weekStart,        setWeekStart]        = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [bookingModalDate, setBookingModalDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [blockedDates,     setBlockedDates]     = useState<string[]>([])
  const [avViewMonth,      setAvViewMonth]      = useState(() => new Date())
  const [savingBlocked,    setSavingBlocked]    = useState(false)
  const [saveBlockedMsg,   setSaveBlockedMsg]   = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!staffId) return
    setLoading(true)

    fetch(`/api/staff?id=${staffId}`)
      .then((r) => r.json())
      .then(async ({ data, error: err }) => {
        if (err || !data) { setError(err ?? 'Staff not found'); setLoading(false); return }
        const staffData = data as Staff
        setStaff(staffData)
        setBlockedDates(staffData.blocked_dates ?? [])

        const supabase = createClient()

        // All-time bookings for performance
        const { data: allBkgs } = await supabase
          .from('bookings')
          .select('*, service:service_id(id,name,colour), client_name, status, price, date, start_time')
          .eq('staff_id', staffId)
          .order('date', { ascending: false })
          .limit(200)

        const rows = (allBkgs ?? []) as BookingRow[]
        setBookings(rows)

        // Build performance data
        const completed = rows.filter((b) => b.status === 'completed')
        const revenue   = completed.reduce((s, b) => s + (b.price ?? 0), 0)

        // Top services
        const svcMap = new Map<string, { name: string; count: number; revenue: number }>()
        for (const b of completed) {
          const name = (b.service as Pick<Service, 'name'> | null)?.name ?? 'Unknown'
          const cur  = svcMap.get(name) ?? { name, count: 0, revenue: 0 }
          cur.count += 1
          cur.revenue += b.price ?? 0
          svcMap.set(name, cur)
        }
        const topServices = [...svcMap.values()].sort((a, b) => b.count - a.count).slice(0, 5)

        // Retention: clients with >1 completed booking
        const clientCounts = new Map<string, number>()
        for (const b of completed) {
          const cid = b.client_id ?? b.client_name
          clientCounts.set(cid, (clientCounts.get(cid) ?? 0) + 1)
        }
        const totalClients     = clientCounts.size
        const retentionClients = [...clientCounts.values()].filter((c) => c > 1).length

        setPerfData({ totalBookings: rows.length, completedBookings: completed.length, totalRevenue: revenue, topServices, retentionClients, totalClients })
        setLoading(false)
      })
      .catch((e) => { setError((e as Error).message); setLoading(false) })
  }, [staffId])

  const weekEnd      = endOfWeek(weekStart, { weekStartsOn: 1 })
  const weekBookings = bookings.filter((b) => b.date >= format(weekStart, 'yyyy-MM-dd') && b.date <= format(weekEnd, 'yyyy-MM-dd'))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
    </div>
  )

  if (error || !staff) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle className="w-8 h-8 text-red-400 opacity-60" />
      <p className="text-sm text-zinc-400">{error ?? 'Staff not found'}</p>
      <Link href="/staff" className="text-xs text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">
        Back to staff
      </Link>
    </div>
  )

  const fmt         = new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 })
  const retentionPct = perfData && perfData.totalClients > 0
    ? Math.round((perfData.retentionClients / perfData.totalClients) * 100)
    : 0

  return (
    <div className="space-y-5 max-w-4xl">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <button type="button" onClick={() => router.back()} aria-label="Go back"
          className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors flex-shrink-0 mt-1">
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-start gap-4">
          {/* Avatar */}
          {staff.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={staff.avatar_url} alt={staff.name}
              className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border-2 border-white/[0.08]" />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 border-2 border-white/[0.08]"
              style={{ backgroundColor: `${staff.colour}20`, color: staff.colour }}
            >
              {getInitials(staff.name)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">
              {staff.name.toUpperCase()}
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">{staff.role}</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {staff.phone && (
                <a href={`tel:${staff.phone}`} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  <Phone className="w-3 h-3" />{staff.phone}
                </a>
              )}
              {staff.email && (
                <a href={`mailto:${staff.email}`} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  <Mail className="w-3 h-3" />{staff.email}
                </a>
              )}
              <span className="flex items-center gap-1 text-xs text-zinc-600">
                <Percent className="w-3 h-3" />{staff.commission_rate}% commission
              </span>
            </div>
          </div>

          <button type="button" onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl px-3 py-2 transition-colors flex-shrink-0">
            <Edit className="w-3.5 h-3.5" />Edit
          </button>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      {perfData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total bookings" value={perfData.totalBookings}
            sub={`${perfData.completedBookings} completed`} icon={<Calendar className="w-4 h-4" />} />
          <StatCard label="Total revenue" value={fmt.format(perfData.totalRevenue)}
            icon={<TrendingUp className="w-4 h-4" />} accent />
          <StatCard label="Clients served" value={perfData.totalClients}
            icon={<Star className="w-4 h-4" />} />
          <StatCard label="Retention rate" value={`${retentionPct}%`}
            sub="clients who returned" icon={<CheckCircle2 className="w-4 h-4" />} />
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] pb-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {(['schedule', 'availability', 'performance', 'commission'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize whitespace-nowrap',
              tab === t ? 'bg-[#c9a84c]/10 text-[#c9a84c]' : 'text-zinc-500 hover:text-zinc-300'
            )}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Schedule tab ─────────────────────────────────────────────── */}
      {tab === 'schedule' && (
        <div className="space-y-4">
          {/* Week navigator */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setWeekStart((d) => addDays(d, -7))} aria-label="Previous week"
              className="w-7 h-7 rounded-lg bg-[#111111] border border-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm text-zinc-300 flex-1 text-center">
              {format(weekStart, 'd MMM')} – {format(addDays(weekStart, 6), 'd MMM yyyy')}
            </p>
            <button type="button" onClick={() => setWeekStart((d) => addDays(d, 7))} aria-label="Next week"
              className="w-7 h-7 rounded-lg bg-[#111111] border border-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingModalDate(format(weekStart, 'yyyy-MM-dd'))
                setBookingModalOpen(true)
              }}
              className="flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-xs rounded-lg px-3 py-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />New Booking
            </button>
          </div>
          <WeekSchedule bookings={weekBookings} weekStart={weekStart} currency={currency} />

          {/* This week's bookings list */}
          {weekBookings.length > 0 && (
            <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  This week — {weekBookings.length} booking{weekBookings.length !== 1 ? 's' : ''}
                </p>
              </div>
              {weekBookings.sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)).map((b) => {
                const style = { confirmed: 'text-blue-400', completed: 'text-emerald-400', pending: 'text-yellow-400', cancelled: 'text-red-400', no_show: 'text-zinc-500' }
                const sName = (b.service as Pick<Service, 'name'> | null)?.name ?? 'Service'
                return (
                  <div key={b.id} className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.025] transition-colors">
                    <div className="text-center w-10 flex-shrink-0">
                      <p className="text-[10px] text-zinc-600 uppercase">{format(parseISO(b.date), 'EEE')}</p>
                      <p className="text-base font-bold text-white leading-tight">{format(parseISO(b.date), 'd')}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{b.client_name}</p>
                      <p className="text-xs text-zinc-500">{sName} · {b.start_time?.slice(0, 5)}</p>
                    </div>
                    <span className={cn('text-xs font-medium capitalize hidden sm:block', style[b.status as keyof typeof style] ?? 'text-zinc-400')}>
                      {b.status.replace('_', ' ')}
                    </span>
                    <p className="text-sm font-medium text-zinc-300 flex-shrink-0">
                      {new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(b.price ?? 0)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Availability tab ─────────────────────────────────────────── */}
      {tab === 'availability' && (() => {
        const today    = new Date(); today.setHours(0, 0, 0, 0)
        const maxDate  = new Date(today); maxDate.setDate(today.getDate() + 90)
        const monthStart = new Date(avViewMonth.getFullYear(), avViewMonth.getMonth(), 1)
        const monthEnd   = new Date(avViewMonth.getFullYear(), avViewMonth.getMonth() + 1, 0)
        // Build grid (Mon-first)
        const gridStart = new Date(monthStart)
        const startDay  = (gridStart.getDay() + 6) % 7  // 0=Mon
        gridStart.setDate(gridStart.getDate() - startDay)
        const days: Date[] = []
        const cur = new Date(gridStart)
        while (cur <= monthEnd || days.length % 7 !== 0) {
          days.push(new Date(cur))
          cur.setDate(cur.getDate() + 1)
          if (days.length > 42) break
        }

        async function saveBlockedDates(newDates: string[]) {
          setSavingBlocked(true)
          setSaveBlockedMsg(null)
          const res  = await fetch('/api/staff', {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: staffId, blocked_dates: newDates }),
          })
          setSavingBlocked(false)
          if (res.ok) {
            setSaveBlockedMsg({ ok: true, text: 'Availability saved' })
            setTimeout(() => setSaveBlockedMsg(null), 3000)
          } else {
            const j = await res.json() as { error?: string }
            setSaveBlockedMsg({ ok: false, text: j.error ?? 'Failed to save' })
          }
        }

        function toggleDate(dateStr: string) {
          setBlockedDates(prev =>
            prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
          )
        }

        const canPrev = avViewMonth.getFullYear() > today.getFullYear() ||
          avViewMonth.getMonth() > today.getMonth()

        return (
          <div className="space-y-4">
            {/* Info banner */}
            <div className="flex items-start gap-3 bg-[#c9a84c]/[0.06] border border-[#c9a84c]/15 rounded-xl px-4 py-3">
              <Ban className="w-4 h-4 text-[#c9a84c] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-zinc-200">Manage {staff.name}&apos;s availability</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tap any date to block or unblock it. Blocked dates prevent online bookings and clients see a clear
                  &ldquo;not available&rdquo; notice. Save when done.
                </p>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
              {/* Month header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <button type="button"
                  disabled={!canPrev}
                  onClick={() => setAvViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                  aria-label="Previous month"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-white">
                  {avViewMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </span>
                <button type="button"
                  onClick={() => setAvViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                  aria-label="Next month"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day-of-week header */}
              <div className="grid grid-cols-7 px-2 pt-2 pb-1">
                {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-zinc-600 py-1">{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="px-2 pb-3">
                {Array.from({ length: Math.ceil(days.length / 7) }).map((_, wi) => (
                  <div key={wi} className="grid grid-cols-7">
                    {days.slice(wi * 7, wi * 7 + 7).map((day, di) => {
                      const dateStr  = format(day, 'yyyy-MM-dd')
                      const inMonth  = day.getMonth() === avViewMonth.getMonth()
                      const isPast   = day < today
                      const isTooFar = day > maxDate
                      const isBlocked = blockedDates.includes(dateStr)
                      const isToday_ = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
                      const disabled = isPast || isTooFar || !inMonth

                      return (
                        <div key={di} className="aspect-square p-0.5 min-h-[38px]">
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleDate(dateStr)}
                            title={isBlocked ? `Unblock ${dateStr}` : `Block ${dateStr}`}
                            className={cn(
                              'w-full h-full rounded-lg text-xs font-medium transition-all min-h-[38px] relative',
                              disabled ? 'opacity-20 cursor-not-allowed text-zinc-600'
                                : isBlocked ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                                : isToday_ ? 'ring-1 ring-[#c9a84c]/40 text-[#c9a84c] hover:bg-white/[0.06]'
                                : 'text-zinc-300 hover:bg-white/[0.06]'
                            )}
                          >
                            {format(day, 'd')}
                            {isBlocked && inMonth && !disabled && (
                              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" />
                Blocked — no bookings
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-white/[0.04] border border-white/[0.08]" />
                Available
              </div>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={savingBlocked}
                onClick={() => void saveBlockedDates(blockedDates)}
                className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-5 py-2.5 text-sm transition-colors"
              >
                {savingBlocked
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                  : <>Save availability</>
                }
              </button>
              <button
                type="button"
                onClick={() => setBlockedDates(staff.blocked_dates ?? [])}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />Reset
              </button>
              {saveBlockedMsg && (
                <span className={cn('text-xs', saveBlockedMsg.ok ? 'text-emerald-400' : 'text-red-400')}>
                  {saveBlockedMsg.text}
                </span>
              )}
            </div>

            {/* Blocked dates list */}
            {blockedDates.length > 0 && (
              <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                  {blockedDates.length} blocked date{blockedDates.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[...blockedDates].sort().map(d => (
                    <div key={d} className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1">
                      <span className="text-xs text-red-400 font-medium">
                        {new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <button type="button" onClick={() => toggleDate(d)} aria-label={`Unblock ${d}`}
                        className="text-red-500 hover:text-red-300 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Performance tab ───────────────────────────────────────────── */}
      {tab === 'performance' && perfData && (
        <div className="space-y-4">
          {perfData.topServices.length > 0 ? (
            <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Top services</p>
              </div>
              {perfData.topServices.map((svc, i) => (
                <div key={svc.name} className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.04] last:border-b-0">
                  <span className="text-xs text-zinc-600 w-4 flex-shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      <Scissors className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" aria-hidden="true" />
                      {svc.name}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400">{svc.count}×</span>
                  <span className="text-sm font-medium text-zinc-300 w-20 text-right">
                    {fmt.format(svc.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-zinc-600">
              <p className="text-sm">No completed bookings yet</p>
            </div>
          )}

          {/* Retention */}
          <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Client retention</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {perfData.retentionClients} of {perfData.totalClients} clients returned for a second booking
              </p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{retentionPct}%</p>
          </div>

          {/* Bio */}
          {staff.bio && (
            <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">About</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{staff.bio}</p>
            </div>
          )}

          {/* Working hours summary */}
          <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Working hours</p>
            </div>
            {(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const).map((day) => {
              const wh    = (staff.working_hours ?? {}) as Record<string, { open?: string; close?: string; closed?: boolean }>
              const hours = wh[day]
              const off   = !hours || hours.closed
              return (
                <div key={day} className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] last:border-b-0">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', off ? 'bg-zinc-700' : 'bg-emerald-500')} />
                    <p className={cn('text-xs capitalize', off ? 'text-zinc-600' : 'text-zinc-300')}>{day}</p>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {off ? 'Day off' : `${hours.open} – ${hours.close}`}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Commission tab ────────────────────────────────────────────── */}
      {tab === 'commission' && shopId && (
        <div className="space-y-4">
          <CommissionCalc
            staffId={staffId}
            shopId={shopId}
            currency={currency}
            commissionRate={staff.commission_rate}
          />
          <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 flex items-start gap-3">
            <Clock className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-zinc-500">
              Commission is calculated on <span className="text-zinc-300">completed bookings only</span>.
              Cancelled and no-show bookings are excluded. Adjust the commission rate by editing this staff member.
            </p>
          </div>
        </div>
      )}

      {/* ── New booking modal ────────────────────────────────────────── */}
      {shopId && (
        <BookingModal
          shopId={shopId}
          shopCurrency={currency}
          initialDate={bookingModalDate}
          initialStaffId={staffId}
          open={bookingModalOpen}
          onOpenChange={setBookingModalOpen}
          onSuccess={(_booking: BookingWithRelations) => setBookingModalOpen(false)}
        />
      )}

      {/* ── Edit modal ───────────────────────────────────────────────── */}
      <StaffModal
        shopId={shopId}
        open={editOpen}
        onOpenChange={setEditOpen}
        editStaff={staff}
        onSuccess={(updated) => setStaff(updated)}
      />
    </div>
  )
}
