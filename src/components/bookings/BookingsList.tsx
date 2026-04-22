'use client'

import { useState, useEffect, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useBookings, type BookingFilters } from '@/hooks/useBookings'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock,
  Loader2, Filter, RefreshCw, MoreHorizontal, Edit, Trash2, Calendar, Plus,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { Staff, Service, BookingStatus, BookingWithRelations } from '@/types/database'

// ── Status badge ──────────────────────────────────────────────────────────
const STATUS_STYLES: Record<BookingStatus, string> = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  no_show:   'bg-zinc-700/40 text-zinc-400 border-zinc-600/20',
}
const STATUS_LABELS: Record<BookingStatus, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show:   'No-show',
}
const ALL_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────
interface BookingsListProps {
  shopId:    string
  currency:  string
  dateFrom?: string
  dateTo?:   string
  onEdit?:   (booking: BookingWithRelations) => void
}

// ── Component ─────────────────────────────────────────────────────────────
export function BookingsList({ shopId, currency, dateFrom, dateTo, onEdit }: BookingsListProps) {
  const { bookings, meta, loading, error, fetchBookings, updateStatus, cancelBooking } = useBookings()

  // Filter state
  const [staffFilter,   setStaffFilter]   = useState('')
  const [statusFilter,  setStatusFilter]  = useState<BookingStatus | ''>('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [dateFromLocal, setDateFromLocal] = useState(dateFrom ?? '')
  const [dateToLocal,   setDateToLocal]   = useState(dateTo ?? '')
  const [page,          setPage]          = useState(1)
  const [showFilters,   setShowFilters]   = useState(false)

  // Data for filter dropdowns
  const [staffList,   setStaffList]   = useState<Staff[]>([])
  const [serviceList, setServiceList] = useState<Service[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('staff').select('id,name').eq('shop_id', shopId).eq('is_active', true)
      .then(({ data }) => setStaffList((data ?? []) as Staff[]))
    supabase.from('services').select('id,name').eq('shop_id', shopId).eq('is_active', true)
      .then(({ data }) => setServiceList((data ?? []) as Service[]))
  }, [shopId])

  const load = (p = page) => {
    const filters: BookingFilters = { page: p, limit: 20 }
    if (dateFromLocal) filters.date_from  = dateFromLocal
    if (dateToLocal)   filters.date_to    = dateToLocal
    if (staffFilter)   filters.staff_id   = staffFilter
    if (statusFilter)  filters.status     = statusFilter
    if (serviceFilter) filters.service_id = serviceFilter
    fetchBookings(shopId, filters)
  }

  useEffect(() => { load(1); setPage(1) }, [shopId, dateFromLocal, dateToLocal, staffFilter, statusFilter, serviceFilter])

  function formatTime12h(t: string | null | undefined) {
    if (!t) return '—'
    const [h, m] = t.split(':').map(Number)
    if (isNaN(h) || isNaN(m)) return t
    const d = new Date(); d.setHours(h, m)
    return format(d, 'h:mm a')
  }

  async function handleStatusUpdate(id: string, status: BookingStatus) {
    await updateStatus(id, status)
  }
  async function handleCancel(id: string) {
    await cancelBooking(id)
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors',
            showFilters
              ? 'bg-[#c9a84c]/10 border-[#c9a84c]/30 text-[#c9a84c]'
              : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
          )}
        >
          <Filter className="w-3 h-3" />
          Filters
          {(staffFilter || statusFilter || serviceFilter || dateFromLocal || dateToLocal) && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => load(page)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white transition-colors"
        >
          <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
          Refresh
        </button>

        {meta && (
          <p className="text-xs text-zinc-500 ml-auto">
            {meta.total} booking{meta.total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#111111] border border-white/[0.06] rounded-xl p-4">
          <div className="space-y-1">
            <label htmlFor="filter-date-from" className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider">From</label>
            <input id="filter-date-from" type="date" value={dateFromLocal} onChange={(e) => setDateFromLocal(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#c9a84c]/50" />
          </div>
          <div className="space-y-1">
            <label htmlFor="filter-date-to" className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider">To</label>
            <input id="filter-date-to" type="date" value={dateToLocal} onChange={(e) => setDateToLocal(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#c9a84c]/50" />
          </div>
          <div className="space-y-1">
            <label htmlFor="filter-barber" className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Barber</label>
            <select id="filter-barber" value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#c9a84c]/50">
              <option value="">All barbers</option>
              {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="filter-status" className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Status</label>
            <select id="filter-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BookingStatus | '')}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#c9a84c]/50">
              <option value="">All statuses</option>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
        {loading && bookings.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        )}

        {error && (
          <div className="py-10 text-center text-red-400 text-sm">{error}</div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <BookingsEmptyState hasFilters={!!(staffFilter || statusFilter || serviceFilter || dateFromLocal || dateToLocal)} />
        )}

        {bookings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Time', 'Client', 'Service', 'Barber', 'Duration', 'Price', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider first:pl-5 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const service = booking.service as { name: string; duration_minutes: number } | null
                  const staff   = booking.staff   as { name: string; colour: string }        | null
                  const price   = new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(booking.price)
                  return (
                    <tr key={booking.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-b-0">
                      <td className="px-4 py-3 pl-5">
                        <p className="text-xs font-mono text-white">{formatTime12h(booking.start_time)}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{booking.date ? format(parseISO(booking.date), 'd MMM') : '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-white truncate max-w-[130px]">{booking.client_name}</p>
                        {booking.client_email && (
                          <p className="text-[10px] text-zinc-600 truncate max-w-[130px]">{booking.client_email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-zinc-300 truncate max-w-[120px]">{service?.name ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {staff?.colour && (
                            <StaffDot colour={staff.colour} />
                          )}
                          <span className="text-sm text-zinc-300 truncate max-w-[80px]">{staff?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {service?.duration_minutes ?? '—'}m
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#c9a84c]">{price}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-3 pr-5">
                        <BookingActions
                          booking={booking}
                          onEdit={() => onEdit?.(booking)}
                          onConfirm={() => handleStatusUpdate(booking.id, 'confirmed')}
                          onComplete={() => handleStatusUpdate(booking.id, 'completed')}
                          onCancel={() => handleCancel(booking.id)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { setPage((p) => p - 1); load(page - 1) }}
              disabled={meta.page <= 1}
              aria-label="Previous page"
              className="w-8 h-8 rounded-lg bg-white/[0.05] text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => { setPage((p) => p + 1); load(page + 1) }}
              disabled={meta.page >= meta.totalPages}
              aria-label="Next page"
              className="w-8 h-8 rounded-lg bg-white/[0.05] text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Staff colour dot — CSS var via ref ────────────────────────────────────
function StaffDot({ colour }: { colour: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.style.setProperty('--staff-colour', colour)
  }, [colour])
  return <div ref={ref} className="staff-avatar w-2.5 h-2.5 rounded-full flex-shrink-0" />
}

// ── Row actions dropdown ──────────────────────────────────────────────────
function BookingActions({ booking, onEdit, onConfirm, onComplete, onCancel }: {
  booking: BookingWithRelations
  onEdit:    () => void
  onConfirm: () => void
  onComplete: () => void
  onCancel:  () => void
}) {
  const isDone = booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'no_show'
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Booking actions"
          className="w-7 h-7 rounded-lg hover:bg-white/[0.06] text-zinc-500 hover:text-white transition-colors flex items-center justify-center"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[140px] bg-[#1a1a1a] border border-white/[0.1] rounded-xl p-1 shadow-2xl"
        >
          <DropdownMenu.Item asChild>
            <button type="button" onClick={onEdit}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors text-left outline-none">
              <Edit className="w-3.5 h-3.5" />Edit
            </button>
          </DropdownMenu.Item>

          {!isDone && booking.status === 'pending' && (
            <DropdownMenu.Item asChild>
              <button type="button" onClick={onConfirm}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-white/[0.06] rounded-lg transition-colors text-left outline-none">
                <Clock className="w-3.5 h-3.5" />Confirm
              </button>
            </DropdownMenu.Item>
          )}
          {!isDone && booking.status === 'confirmed' && (
            <DropdownMenu.Item asChild>
              <button type="button" onClick={onComplete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-white/[0.06] rounded-lg transition-colors text-left outline-none">
                <CheckCircle className="w-3.5 h-3.5" />Complete
              </button>
            </DropdownMenu.Item>
          )}
          {!isDone && (
            <DropdownMenu.Item asChild>
              <button type="button" onClick={onCancel}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.06] rounded-lg transition-colors text-left outline-none">
                <XCircle className="w-3.5 h-3.5" /><Trash2 className="w-3.5 h-3.5" />Cancel
              </button>
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

// ── Bookings empty state ──────────────────────────────────────────────────
function BookingsEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center px-4">
      <div className="w-20 h-20 rounded-3xl bg-[#141414] border border-white/[0.06] flex items-center justify-center">
        <Calendar className="w-9 h-9 text-[#c9a84c]/30" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold text-zinc-300">
          {hasFilters ? 'No bookings match your filters' : 'No bookings yet'}
        </p>
        <p className="text-xs text-zinc-600 leading-relaxed">
          {hasFilters
            ? 'Try adjusting the date range, status or barber filters.'
            : 'Your schedule is clear. Add a booking manually or share your booking page so clients can book online.'}
        </p>
      </div>
      {!hasFilters && (
        <Link href="/bookings"
          className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-sm rounded-xl px-5 py-2.5 transition-colors">
          <Plus className="w-4 h-4" />Add First Booking
        </Link>
      )}
    </div>
  )
}
