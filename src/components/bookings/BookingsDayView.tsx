'use client'

import { useEffect, useRef, useState } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { Staff, BookingWithRelations } from '@/types/database'

// ── Constants ─────────────────────────────────────────────────────────────
const START_HOUR  = 8
const END_HOUR    = 20
const HOUR_HEIGHT = 64   // px — matches cal-grid
const TOTAL_H     = (END_HOUR - START_HOUR) * HOUR_HEIGHT   // 768px
const HOURS       = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

const HOUR_TOP: Record<number, string> = {
  8: 'top-0',   9: 'top-[64px]',  10: 'top-[128px]', 11: 'top-[192px]',
  12: 'top-[256px]', 13: 'top-[320px]', 14: 'top-[384px]', 15: 'top-[448px]',
  16: 'top-[512px]', 17: 'top-[576px]', 18: 'top-[640px]', 19: 'top-[704px]',
}

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number); return h * 60 + m
}
function topPx(startTime: string) {
  return Math.max(0, (timeToMin(startTime) - START_HOUR * 60) / 60 * HOUR_HEIGHT)
}
function heightPx(durationMin: number) {
  return Math.max(22, durationMin / 60 * HOUR_HEIGHT)
}
function hexToRgba20(hex: string): string {
  const c = hex.replace('#', '')
  if (c.length !== 6) return 'rgba(99,102,241,0.2)'
  return `rgba(${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)},0.2)`
}
function format12h(t: string) {
  const [h, m] = t.split(':').map(Number)
  const d = new Date(); d.setHours(h, m)
  return format(d, 'h:mm a')
}

// ── Props ─────────────────────────────────────────────────────────────────
interface BookingsDayViewProps {
  shopId:       string
  date:         string   // "YYYY-MM-DD"
  currency:     string
  onSlotClick?: (staffId: string, time: string) => void
  onBookingClick?: (booking: BookingWithRelations) => void
}

// ── Per-booking block (CSS vars via ref) ──────────────────────────────────
function BookingBlock({ booking, currency, onClick }: {
  booking: BookingWithRelations
  currency: string
  onClick: () => void
}) {
  const ref    = useRef<HTMLDivElement>(null)
  const service = booking.service as { name: string; duration_minutes: number; price: number } | null
  const staff   = booking.staff   as { name: string; colour: string } | null
  const colour  = staff?.colour ?? '#6366f1'
  const top     = topPx(booking.start_time)
  const height  = heightPx(service?.duration_minutes ?? 30)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--cal-top',    `${top}px`)
    el.style.setProperty('--cal-height', `${height}px`)
    el.style.setProperty('--cal-color',  colour)
    el.style.setProperty('--cal-bg',     hexToRgba20(colour))
  }, [top, height, colour])

  const isCancelled = booking.status === 'cancelled' || booking.status === 'no_show'
  const price = new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(booking.price)

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`${booking.client_name} — ${service?.name}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className={cn('cal-booking group', isCancelled ? 'opacity-30' : '')}
    >
      {height >= 22 && (
        <div className="px-1.5 py-1 overflow-hidden">
          <p className="cal-booking-text text-[10px] font-bold leading-tight truncate">
            {booking.client_name}
          </p>
          {height >= 38 && (
            <p className="text-[9px] text-zinc-400 truncate leading-tight">
              {service?.name}
            </p>
          )}
          {height >= 54 && (
            <p className="text-[9px] text-zinc-500 truncate leading-tight">
              {format12h(booking.start_time)} · {price}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Empty slot (click to create) ──────────────────────────────────────────
function EmptySlot({ hour, staffId, onClick }: { hour: number; staffId: string; onClick: (staffId: string, time: string) => void }) {
  const time = `${String(hour).padStart(2,'0')}:00:00`
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Book at ${hour < 12 ? hour + 'am' : hour === 12 ? '12pm' : (hour - 12) + 'pm'}`}
      onClick={() => onClick(staffId, time)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(staffId, time) }}
      className={cn('absolute w-full h-16 border-t border-white/[0.03] cursor-pointer group hover:bg-[#c9a84c]/[0.04] transition-colors', HOUR_TOP[hour])}
    >
      <span className="hidden group-hover:block text-[9px] text-[#c9a84c]/60 pl-1.5 pt-0.5">+ book</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export function BookingsDayView({ shopId, date, currency, onSlotClick, onBookingClick }: BookingsDayViewProps) {
  const [staff,    setStaff]    = useState<Staff[]>([])
  const [bookings, setBookings] = useState<BookingWithRelations[]>([])
  const [loading,  setLoading]  = useState(true)

  // Dynamic grid columns set via ref so no inline style= needed
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef   = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const cols = `48px repeat(${staff.length}, 1fr)`
    headerRef.current?.style.setProperty('grid-template-columns', cols)
    gridRef.current?.style.setProperty('grid-template-columns', cols)
  }, [staff.length])

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    Promise.all([
      supabase.from('staff').select('*').eq('shop_id', shopId).eq('is_active', true),
      supabase.from('bookings').select(`
        *, service:services(id,name,duration_minutes,price,colour),
        staff:staff(id,name,avatar_url,colour),
        client:clients(id,name,email,phone)
      `).eq('shop_id', shopId).eq('date', date).order('start_time'),
    ]).then(([{ data: staffData }, { data: bookingData }]) => {
      setStaff((staffData ?? []) as Staff[])
      setBookings((bookingData ?? []) as BookingWithRelations[])
      setLoading(false)
    })
  }, [shopId, date])

  const parsedDate = parseISO(date)
  const dateLabel  = isValid(parsedDate) ? format(parsedDate, 'EEEE, d MMMM yyyy') : date

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#111111] border border-white/[0.06] rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (staff.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-[#111111] border border-white/[0.06] rounded-xl text-zinc-500 text-sm">
        No active staff found. Add staff in the Staff section.
      </div>
    )
  }

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header row: date + staff columns — grid cols set via ref */}
      <div ref={headerRef} className="grid border-b border-white/[0.06]">
        <div className="border-r border-white/[0.04] py-3 px-2 text-center">
          <p className="text-[9px] text-zinc-600 uppercase tracking-wider">
            {isValid(parsedDate) ? format(parsedDate, 'MMM') : ''}
          </p>
          <p className="text-lg font-bold text-white leading-tight">{isValid(parsedDate) ? format(parsedDate, 'd') : ''}</p>
          <p className="text-[9px] text-zinc-600">{isValid(parsedDate) ? format(parsedDate, 'EEE') : ''}</p>
        </div>
        {staff.map((s) => (
          <div key={s.id} className="py-3 px-3 border-r border-white/[0.04] last:border-r-0 text-center">
            <StaffAvatarHeader staff={s} />
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
        <div ref={gridRef} className="grid cal-grid">
          {/* Time axis */}
          <div className="relative border-r border-white/[0.04]">
            {HOURS.map((h) => (
              <div key={h} className={cn('absolute w-full pr-2 text-right -translate-y-2.5', HOUR_TOP[h])}>
                <span className="text-[9px] text-zinc-600">
                  {h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                </span>
              </div>
            ))}
          </div>

          {/* Staff columns */}
          {staff.map((s) => {
            const colBookings = bookings.filter((b) => b.staff_id === s.id)
            return (
              <div key={s.id} className="relative border-r border-white/[0.04] last:border-r-0">
                {/* Hour slots (empty = clickable) */}
                {onSlotClick && HOURS.map((h) => (
                  <EmptySlot key={h} hour={h} staffId={s.id} onClick={onSlotClick} />
                ))}
                {/* Bookings */}
                {colBookings.map((b) => (
                  <BookingBlock
                    key={b.id}
                    booking={b}
                    currency={currency}
                    onClick={() => onBookingClick?.(b)}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Date caption */}
      <div className="px-4 py-2 border-t border-white/[0.04] text-xs text-zinc-600 text-center">
        {dateLabel}
      </div>
    </div>
  )
}

// ── Staff avatar header — CSS var via ref ─────────────────────────────────
function StaffAvatarHeader({ staff }: { staff: Staff }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.style.setProperty('--staff-colour', staff.colour)
  }, [staff.colour])
  return (
    <div className="flex flex-col items-center gap-1">
      <div ref={ref} className="staff-avatar w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
        {staff.name.slice(0, 2).toUpperCase()}
      </div>
      <p className="text-xs font-medium text-white truncate max-w-[80px]">{staff.name}</p>
      <p className="text-[10px] text-zinc-500 capitalize">{staff.role}</p>
    </div>
  )
}
