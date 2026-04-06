'use client'

import { useEffect, useRef, useState } from 'react'
import {
  format, startOfWeek, endOfWeek, addDays, isToday,
} from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Loader2, TrendingUp } from 'lucide-react'
import type { BookingStatus } from '@/types/database'

// ── Types ─────────────────────────────────────────────────────────────────
interface DaySummary {
  date:       string
  total:      number
  revenue:    number
  pending:    number
  confirmed:  number
  completed:  number
  cancelled:  number
  [key: string]: number | string
}

interface BookingsWeekViewProps {
  shopId:       string
  weekStart:    Date    // Monday of the week to display
  currency:     string
  onDayClick?:  (date: string) => void
}

// ── Status stacked bar — heights/widths set via ref (no inline style=) ──
function StatusStackBar({ summary, barH }: {
  summary: DaySummary
  barH:    number
}) {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const compRef  = useRef<HTMLDivElement>(null)
  const confRef  = useRef<HTMLDivElement>(null)
  const pendRef  = useRef<HTMLDivElement>(null)
  const cancRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = `${Math.max(6, barH)}px`
    wrapRef.current?.style.setProperty('height', h)
    if (compRef.current) compRef.current.style.width = `${(summary.completed / summary.total) * 100}%`
    if (confRef.current) confRef.current.style.width = `${(summary.confirmed / summary.total) * 100}%`
    if (pendRef.current) pendRef.current.style.width = `${(summary.pending  / summary.total) * 100}%`
    if (cancRef.current) cancRef.current.style.width = `${(summary.cancelled / summary.total) * 100}%`
  }, [barH, summary])

  return (
    <div
      ref={wrapRef}
      className="flex gap-0.5 rounded-full overflow-hidden w-full bg-white/[0.05] max-h-20 transition-all"
      aria-label={`${summary.total} bookings`}
    >
      {summary.completed > 0 && <div ref={compRef} className="bg-emerald-500 transition-all" />}
      {summary.confirmed > 0 && <div ref={confRef} className="bg-blue-500 transition-all" />}
      {summary.pending   > 0 && <div ref={pendRef} className="bg-yellow-500 transition-all" />}
      {summary.cancelled > 0 && <div ref={cancRef} className="bg-red-500/50 transition-all" />}
    </div>
  )
}

// ── Status mini-bar colours ───────────────────────────────────────────────
const STATUS_BG: Record<BookingStatus, string> = {
  pending:   'bg-yellow-500',
  confirmed: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  no_show:   'bg-zinc-500',
}

// ── Component ─────────────────────────────────────────────────────────────
export function BookingsWeekView({ shopId, weekStart, currency, onDayClick }: BookingsWeekViewProps) {
  const [summaries, setSummaries] = useState<Map<string, DaySummary>>(new Map())
  const [loading,   setLoading]   = useState(true)

  const days       = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekStartS = format(startOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEndS   = format(endOfWeek(weekStart,   { weekStartsOn: 1 }), 'yyyy-MM-dd')

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    supabase.from('bookings')
      .select('date, status, price')
      .eq('shop_id', shopId)
      .gte('date', weekStartS)
      .lte('date', weekEndS)
      .then(({ data }) => {
        const map = new Map<string, DaySummary>()

        // Initialise all 7 days
        days.forEach((d) => {
          const ds = format(d, 'yyyy-MM-dd')
          map.set(ds, { date: ds, total: 0, revenue: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 })
        })

        for (const row of data ?? []) {
          const day = map.get(row.date)
          if (!day) continue
          day.total += 1
          if (row.status !== 'cancelled' && row.status !== 'no_show') day.revenue += row.price ?? 0
          if (row.status in day) (day as Record<string, number>)[row.status] += 1
        }

        setSummaries(map)
        setLoading(false)
      })
  }, [shopId, weekStartS, weekEndS])

  const maxBookings = Math.max(1, ...Array.from(summaries.values()).map((s) => s.total))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#111111] border border-white/[0.06] rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-7 border-b border-white/[0.06]">
        {days.map((day) => (
          <div key={day.toISOString()} className={cn(
            'py-2 text-center border-r border-white/[0.04] last:border-r-0',
            isToday(day) ? 'bg-[#c9a84c]/[0.05]' : ''
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

      {/* Day cards */}
      <div className="grid grid-cols-7 divide-x divide-white/[0.04] min-h-[280px]">
        {days.map((day) => {
          const ds      = format(day, 'yyyy-MM-dd')
          const summary = summaries.get(ds) ?? { date: ds, total: 0, revenue: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
          const today   = isToday(day)
          const barH    = summary.total > 0 ? Math.round((summary.total / maxBookings) * 80) : 0
          const price   = new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(summary.revenue)

          return (
            <button
              key={ds}
              type="button"
              onClick={() => onDayClick?.(ds)}
              className={cn(
                'flex flex-col p-3 text-left transition-colors hover:bg-white/[0.03]',
                today ? 'bg-[#c9a84c]/[0.03]' : ''
              )}
            >
              {/* Booking count */}
              <div className="flex items-end gap-1 mb-3 flex-1">
                {/* Status breakdown bar */}
                {summary.total > 0 ? (
                  <div className="w-full">
                    <StatusStackBar summary={summary} barH={barH} />
                  </div>
                ) : (
                  <div className="w-full h-8 rounded bg-white/[0.02] flex items-center justify-center">
                    <span className="text-[9px] text-zinc-700">No bookings</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <span className={cn('text-xl font-bold leading-tight', today ? 'text-[#c9a84c]' : 'text-white')}>
                    {summary.total}
                  </span>
                  {summary.total > 0 && (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  )}
                </div>
                {summary.revenue > 0 && (
                  <p className="text-[10px] text-zinc-500 font-medium">{price}</p>
                )}
              </div>

              {/* Status pills */}
              {summary.total > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {(['confirmed', 'pending', 'completed', 'cancelled'] as BookingStatus[]).map((s) => {
                    const count = (summary as Record<string, number>)[s]
                    if (!count) return null
                    return (
                      <div key={s} className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_BG[s])} title={`${count} ${s}`} />
                    )
                  })}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/[0.04]">
        {(['confirmed', 'pending', 'completed', 'cancelled'] as BookingStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', STATUS_BG[s])} />
            <span className="text-[10px] text-zinc-500 capitalize">{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
