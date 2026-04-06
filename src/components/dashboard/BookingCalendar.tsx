'use client'

import { useState, useRef, useEffect } from 'react'
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  isToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BookingWithRelations } from '@/types/database'

// ── Calendar constants ────────────────────────────────────────────────────
const START_HOUR   = 8   // 08:00
const END_HOUR     = 20  // 20:00
const HOUR_HEIGHT  = 64  // px — must match .cal-grid height / (END_HOUR - START_HOUR)
const HOURS        = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

// Static lookup: hour → Tailwind top class (top = (h - 8) * 64px)
// Using arbitrary values because only top-0, top-16 (64px), top-32 … exist in scale.
const HOUR_TOP_CLASS: Record<number, string> = {
  8:  'top-0',
  9:  'top-[64px]',
  10: 'top-[128px]',
  11: 'top-[192px]',
  12: 'top-[256px]',
  13: 'top-[320px]',
  14: 'top-[384px]',
  15: 'top-[448px]',
  16: 'top-[512px]',
  17: 'top-[576px]',
  18: 'top-[640px]',
  19: 'top-[704px]',
}

// ── Time helpers ──────────────────────────────────────────────────────────
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

/** Pixel offset from top of the grid */
function bookingTopPx(startTime: string): number {
  const offsetMin = timeToMinutes(startTime) - START_HOUR * 60
  return Math.max(0, (offsetMin / 60) * HOUR_HEIGHT)
}

/** Pixel height — minimum 20px so very short bookings are still visible */
function bookingHeightPx(durationMinutes: number): number {
  return Math.max(20, (durationMinutes / 60) * HOUR_HEIGHT)
}

/** Convert a 6-digit hex colour to rgba with 20% opacity */
function hexToRgba20(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return 'rgba(99,102,241,0.2)'
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r},${g},${b},0.2)`
}

// ── Props ─────────────────────────────────────────────────────────────────
interface BookingCalendarProps {
  bookings: BookingWithRelations[]
  /** ISO date string for the initial Monday of the displayed week */
  initialWeekStart?: string
}

// ── Component ─────────────────────────────────────────────────────────────
export function BookingCalendar({ bookings, initialWeekStart }: BookingCalendarProps) {
  const defaultStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const [weekStart, setWeekStart] = useState<Date>(
    initialWeekStart ? parseISO(initialWeekStart) : defaultStart
  )

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function prevWeek() { setWeekStart((d) => addDays(d, -7)) }
  function nextWeek() { setWeekStart((d) => addDays(d, 7)) }
  function goToday()  { setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 })) }

  const weekLabel = `${format(weekStart, 'd MMM')} – ${format(addDays(weekStart, 6), 'd MMM yyyy')}`

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-white text-sm">Weekly Calendar</h2>
          <span className="text-xs text-zinc-500 hidden sm:block">{weekLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToday}
            className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={prevWeek}
            aria-label="Previous week"
            className="w-7 h-7 rounded-lg bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextWeek}
            aria-label="Next week"
            className="w-7 h-7 rounded-lg bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Day header row */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-white/[0.06]">
            <div className="border-r border-white/[0.04]" />
            {days.map((day) => {
              const todayDay = isToday(day)
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'py-2.5 text-center border-r border-white/[0.04] last:border-r-0',
                    todayDay ? 'bg-[#c9a84c]/[0.06]' : ''
                  )}
                >
                  <p className={cn('text-[10px] uppercase tracking-wider', todayDay ? 'text-[#c9a84c]' : 'text-zinc-500')}>
                    {format(day, 'EEE')}
                  </p>
                  <p className={cn('text-sm font-bold mt-0.5', todayDay ? 'text-[#c9a84c]' : 'text-zinc-300')}>
                    {format(day, 'd')}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] cal-grid">
            {/* Time-label column */}
            <div className="relative border-r border-white/[0.04]">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className={cn('absolute w-full pr-2 text-right -translate-y-2', HOUR_TOP_CLASS[h])}
                >
                  <span className="text-[9px] text-zinc-600">
                    {h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day) => {
              const dayBookings = bookings.filter((b) => isSameDay(parseISO(b.date), day))
              const todayCol    = isToday(day)

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'relative border-r border-white/[0.04] last:border-r-0',
                    todayCol ? 'bg-[#c9a84c]/[0.02]' : ''
                  )}
                >
                  {/* Hour grid lines (static Tailwind top classes) */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className={cn('absolute w-full border-t border-white/[0.03]', HOUR_TOP_CLASS[h])}
                    />
                  ))}

                  {/* Bookings — CSS custom props set imperatively via ref to avoid style= in JSX */}
                  {dayBookings.map((booking) => (
                    <CalBookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Per-booking card — CSS vars applied via ref so JSX has no style= ─────
function CalBookingCard({ booking }: { booking: BookingWithRelations }) {
  const ref      = useRef<HTMLDivElement>(null)
  const topPx    = bookingTopPx(booking.start_time)
  const heightPx = bookingHeightPx(booking.service.duration_minutes)
  const colour   = booking.staff?.colour ?? '#6366f1'
  const isCancelled = booking.status === 'cancelled' || booking.status === 'no_show'

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--cal-top',    `${topPx}px`)
    el.style.setProperty('--cal-height', `${heightPx}px`)
    el.style.setProperty('--cal-color',  colour)
    el.style.setProperty('--cal-bg',     hexToRgba20(colour))
  }, [topPx, heightPx, colour])

  return (
    <div
      ref={ref}
      className={cn('cal-booking', isCancelled ? 'opacity-30' : '')}
      title={`${booking.client_name} · ${booking.service.name}`}
    >
      {heightPx >= 24 && (
        <div className="px-1 py-0.5 overflow-hidden">
          <p className="cal-booking-text text-[9px] font-semibold leading-tight truncate">
            {booking.client_name}
          </p>
          {heightPx >= 36 && (
            <p className="text-[8px] text-zinc-400 truncate leading-tight">
              {booking.service.name}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function BookingCalendarSkeleton() {
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden animate-pulse">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="h-4 w-36 bg-white/[0.06] rounded" />
        <div className="h-6 w-24 bg-white/[0.06] rounded" />
      </div>
      <div className="h-96 bg-white/[0.02]" />
    </div>
  )
}
