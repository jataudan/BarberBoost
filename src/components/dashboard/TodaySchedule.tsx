'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, Loader2, CalendarX } from 'lucide-react'
import type { BookingWithRelations, BookingStatus } from '@/types/database'

// ── Helpers ───────────────────────────────────────────────────────────────
function formatTime(timeStr: string) {
  // "HH:MM:SS" → "9:30 AM"
  const [h, m] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m, 0, 0)
  return format(date, 'h:mm a')
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  no_show:   'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  completed: 'Done',
  cancelled: 'Cancelled',
  no_show:   'No-show',
}

// ── Props ─────────────────────────────────────────────────────────────────
interface TodayScheduleProps {
  bookings: BookingWithRelations[]
  currency?: string
}

// ── Component ─────────────────────────────────────────────────────────────
export function TodaySchedule({ bookings: initial, currency = 'GBP' }: TodayScheduleProps) {
  const router  = useRouter()
  const [bookings, setBookings] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [actingId, setActingId]   = useState<string | null>(null)

  const today = format(new Date(), 'EEEE, d MMMM')

  async function updateStatus(id: string, status: BookingStatus) {
    setActingId(id)
    // Optimistic update
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    )
    const supabase = createClient()
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)

    if (error) {
      // Revert on failure
      setBookings(initial)
    } else {
      startTransition(() => {
        router.refresh()
      })
    }
    setActingId(null)
  }

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <h2 className="font-semibold text-white text-sm">Today&apos;s Schedule</h2>
        <p className="text-xs text-zinc-500">{today}</p>
      </div>

      {/* Empty state */}
      {bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-zinc-600">
          <CalendarX className="w-8 h-8" />
          <p className="text-sm">No bookings today</p>
        </div>
      )}

      {/* Booking list */}
      {bookings.length > 0 && (
        <ul className="divide-y divide-white/[0.04]">
          {bookings.map((booking) => {
            const isActing  = actingId === booking.id
            const isDone    = booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'no_show'
            const staffColour = booking.staff?.colour ?? '#6366f1'

            return (
              <li
                key={booking.id}
                className={cn(
                  'flex items-start gap-4 px-5 py-4 transition-colors',
                  isDone ? 'opacity-50' : 'hover:bg-white/[0.02]'
                )}
              >
                {/* Staff colour bar */}
                <div
                  className="w-1 h-full rounded-full flex-shrink-0 self-stretch min-h-[48px]"
                  style={{ backgroundColor: staffColour }}
                />

                {/* Time */}
                <div className="w-16 flex-shrink-0 text-center pt-0.5">
                  <p className="text-sm font-mono text-white leading-tight">
                    {formatTime(booking.start_time)}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {booking.service.duration_minutes}m
                  </p>
                </div>

                {/* Client + service */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{booking.client_name}</p>
                  <p className="text-xs text-zinc-500 truncate">
                    {booking.service.name} · {booking.staff.name}
                  </p>
                  <p className="text-xs text-[#c9a84c] font-medium mt-0.5">
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(booking.price)}
                  </p>
                </div>

                {/* Status badge */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                      STATUS_STYLES[booking.status]
                    )}
                  >
                    {STATUS_LABELS[booking.status]}
                  </span>

                  {/* Action buttons — only for actionable statuses */}
                  {!isDone && (
                    <div className="flex items-center gap-1">
                      {booking.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(booking.id, 'confirmed')}
                          disabled={isActing || pending}
                          title="Confirm booking"
                          className="text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors"
                        >
                          {isActing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(booking.id, 'completed')}
                          disabled={isActing || pending}
                          title="Mark as complete"
                          className="text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors"
                        >
                          {isActing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => updateStatus(booking.id, 'cancelled')}
                        disabled={isActing || pending}
                        title="Cancel booking"
                        className="text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
                      >
                        {isActing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────
export function TodayScheduleSkeleton() {
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden animate-pulse">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="h-4 w-32 bg-white/[0.06] rounded" />
        <div className="h-3 w-24 bg-white/[0.06] rounded" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-white/[0.04]">
          <div className="w-1 h-12 bg-white/[0.06] rounded-full" />
          <div className="w-14 space-y-1.5">
            <div className="h-4 bg-white/[0.06] rounded" />
            <div className="h-3 w-8 bg-white/[0.06] rounded" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-28 bg-white/[0.06] rounded" />
            <div className="h-3 w-40 bg-white/[0.06] rounded" />
          </div>
          <div className="h-5 w-16 bg-white/[0.06] rounded-full" />
        </div>
      ))}
    </div>
  )
}
