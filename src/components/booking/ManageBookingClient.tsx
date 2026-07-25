'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, Clock, Scissors, User, Loader2, X, Check,
  AlertCircle, CalendarClock, ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ManageBlockReason } from '@/lib/manage-booking'

// ── Types ───────────────────────────────────────────────────────────────────

interface InitialBooking {
  bookingRef:      string | null
  status:          string
  clientName:      string
  serviceName:     string
  staffName:       string
  durationMinutes: number
  price:           number
  currency:        string
  shopPhone:       string | null
  shopSlug:        string | null
  date:            string
  startTime:       string
  dateFormatted:   string
  timeFormatted:   string
  manageable:      boolean
  blockReason:     ManageBlockReason
}

interface Props {
  token:     string
  shopId:    string
  serviceId: string
  staffId:   string
  initial:   InitialBooking
}

type SlotInfo = { time: string; end_time: string; available: boolean; staffId: string | null }
type View = 'overview' | 'reschedule' | 'cancel' | 'cancelled' | 'rescheduled'

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtTime12h(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const p  = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${p}`
}

function fmtCur(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function maxDateStr(): string {
  const d = new Date(); d.setDate(d.getDate() + 60)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const BLOCK_COPY: Record<NonNullable<ManageBlockReason>, string> = {
  cancelled: 'This booking has already been cancelled.',
  completed: 'This appointment has already taken place.',
  no_show:   'This appointment is marked as a no-show.',
  past:      'This appointment date has already passed.',
}

// ── Component ───────────────────────────────────────────────────────────────

export function ManageBookingClient({ token, shopId, serviceId, staffId, initial }: Props) {
  const [view, setView]       = useState<View>('overview')
  const [booking, setBooking] = useState(initial)
  const [error, setError]     = useState<string | null>(null)
  const [busy, setBusy]       = useState(false)

  // Reschedule picker state
  const [pickDate, setPickDate]   = useState('')
  const [slots, setSlots]         = useState<SlotInfo[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [pickTime, setPickTime]   = useState('')

  // Deep-link straight into an action from the email links.
  useEffect(() => {
    if (!initial.manageable) return
    const action = new URLSearchParams(window.location.search).get('action')
    if (action === 'reschedule') setView('reschedule')
    else if (action === 'cancel') setView('cancel')
  }, [initial.manageable])

  // Fetch availability whenever a reschedule date is chosen.
  useEffect(() => {
    if (view !== 'reschedule' || !pickDate) { setSlots([]); return }
    setSlotsLoading(true)
    setPickTime('')
    const params = new URLSearchParams({ shop_id: shopId, service_id: serviceId, staff_id: staffId, date: pickDate })
    fetch(`/api/public/availability?${params}`)
      .then(r => r.json())
      .then((json: { slots?: SlotInfo[]; blocked?: boolean }) => {
        setSlots(json.blocked ? [] : (json.slots ?? []))
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [view, pickDate, shopId, serviceId, staffId])

  const availableSlots = slots.filter(s => s.available)

  const doCancel = useCallback(async () => {
    setBusy(true); setError(null)
    try {
      const res  = await fetch(`/api/public/manage/${token}/cancel`, { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Could not cancel your booking.'); return }
      setBooking(b => ({ ...b, status: 'cancelled' }))
      setView('cancelled')
    } catch {
      setError('Something went wrong. Please try again or call the shop.')
    } finally {
      setBusy(false)
    }
  }, [token])

  const doReschedule = useCallback(async () => {
    if (!pickDate || !pickTime) return
    setBusy(true); setError(null)
    try {
      const res  = await fetch(`/api/public/manage/${token}/reschedule`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ date: pickDate, start_time: pickTime }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Could not reschedule your booking.'); return }
      setBooking(b => ({
        ...b,
        date:          json.data?.date ?? pickDate,
        startTime:     json.data?.start_time ?? pickTime,
        dateFormatted: json.data?.dateFormatted ?? b.dateFormatted,
        timeFormatted: json.data?.timeFormatted ?? b.timeFormatted,
      }))
      setView('rescheduled')
    } catch {
      setError('Something went wrong. Please try again or call the shop.')
    } finally {
      setBusy(false)
    }
  }, [token, pickDate, pickTime])

  // ── Card shell ────────────────────────────────────────────────────────────
  const card = 'bg-[#141414] border border-white/[0.08] rounded-2xl p-6'

  // Booking summary block (reused across views)
  const summary = (
    <div className="space-y-2.5 text-sm">
      <div className="flex items-center gap-3 text-zinc-300"><Scissors className="w-4 h-4 text-zinc-500" />{booking.serviceName}</div>
      <div className="flex items-center gap-3 text-zinc-300"><User className="w-4 h-4 text-zinc-500" />{booking.staffName}</div>
      <div className="flex items-center gap-3 text-zinc-300"><Calendar className="w-4 h-4 text-zinc-500" />{booking.dateFormatted}</div>
      <div className="flex items-center gap-3 text-zinc-300"><Clock className="w-4 h-4 text-zinc-500" />{booking.timeFormatted} · {booking.durationMinutes} min</div>
    </div>
  )

  // ── Not manageable ──────────────────────────────────────────────────────────
  if (!initial.manageable && view === 'overview') {
    return (
      <div className={card}>
        <div className="flex items-center gap-2.5 bg-yellow-400/[0.06] border border-yellow-400/15 rounded-xl px-4 py-3 text-sm text-yellow-400/80 mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {booking.blockReason ? BLOCK_COPY[booking.blockReason] : 'This booking can no longer be changed online.'}
        </div>
        {summary}
        {booking.shopPhone && (
          <p className="text-xs text-zinc-500 mt-5 text-center">
            Need help? Call us on <a href={`tel:${booking.shopPhone}`} className="text-[#c9a84c]">{booking.shopPhone}</a>.
          </p>
        )}
        {booking.shopSlug && (
          <a href={`/booking/${booking.shopSlug}`} className="block text-center mt-4 text-sm text-[#c9a84c] font-medium">
            Make a new booking →
          </a>
        )}
      </div>
    )
  }

  // ── Cancelled success ───────────────────────────────────────────────────────
  if (view === 'cancelled') {
    return (
      <div className={cn(card, 'text-center')}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 mb-4">
          <X className="w-6 h-6 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Booking Cancelled</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Your appointment on {booking.dateFormatted} has been cancelled. We&apos;ve let {booking.staffName} know.
        </p>
        {booking.shopSlug && (
          <a href={`/booking/${booking.shopSlug}`} className="block mt-6 text-sm text-[#c9a84c] font-medium">
            Book again →
          </a>
        )}
      </div>
    )
  }

  // ── Rescheduled success ─────────────────────────────────────────────────────
  if (view === 'rescheduled') {
    return (
      <div className={cn(card, 'text-center')}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#c9a84c]/12 border border-[#c9a84c]/25 mb-4">
          <Check className="w-6 h-6 text-[#c9a84c]" />
        </div>
        <h1 className="text-xl font-bold text-white">Booking Rescheduled</h1>
        <p className="text-sm text-zinc-400 mt-2">Your appointment has been moved to:</p>
        <p className="text-base font-semibold text-[#c9a84c] mt-3">{booking.dateFormatted}</p>
        <p className="text-sm text-zinc-300">{booking.timeFormatted}</p>
        <p className="text-xs text-zinc-500 mt-4">We&apos;ve let {booking.staffName} know.</p>
      </div>
    )
  }

  // ── Cancel confirm ──────────────────────────────────────────────────────────
  if (view === 'cancel') {
    return (
      <div className={card}>
        <button type="button" onClick={() => { setView('overview'); setError(null) }} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-lg font-bold text-white mb-1">Cancel this booking?</h1>
        <p className="text-sm text-zinc-400 mb-5">This cannot be undone. You&apos;d need to make a new booking if you change your mind.</p>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-5">{summary}</div>
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={() => setView('overview')} disabled={busy}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-white/[0.1] text-zinc-300 hover:text-white disabled:opacity-50">
            Keep booking
          </button>
          <button type="button" onClick={doCancel} disabled={busy}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, cancel'}
          </button>
        </div>
      </div>
    )
  }

  // ── Reschedule picker ─────────────────────────────────────────────────────
  if (view === 'reschedule') {
    return (
      <div className={card}>
        <button type="button" onClick={() => { setView('overview'); setError(null) }} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-lg font-bold text-white mb-1">Reschedule</h1>
        <p className="text-sm text-zinc-400 mb-5">
          Pick a new date and time for your <span className="text-zinc-200">{booking.serviceName}</span> with {booking.staffName}.
        </p>

        <label htmlFor="reschedule-date" className="block text-xs font-medium text-zinc-400 mb-1.5">New date</label>
        <input
          id="reschedule-date"
          type="date"
          aria-label="New booking date"
          min={todayStr()}
          max={maxDateStr()}
          value={pickDate}
          onChange={e => setPickDate(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-zinc-100 mb-5 [color-scheme:dark]"
        />

        {pickDate && (
          <div className="mb-5">
            <label className="block text-xs font-medium text-zinc-400 mb-2">Available times</label>
            {slotsLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-zinc-500" /></div>
            ) : availableSlots.length === 0 ? (
              <div className="flex items-center gap-2.5 bg-yellow-400/[0.06] border border-yellow-400/15 rounded-xl px-4 py-3 text-sm text-yellow-400/80">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> No available slots on this date. Please try another day.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map(slot => (
                  <button key={slot.time} type="button" onClick={() => setPickTime(slot.time)}
                    className={cn(
                      'py-3 rounded-xl text-sm font-medium border transition-all min-h-[44px]',
                      pickTime === slot.time
                        ? 'bg-[#c9a84c] text-[#0a0a0a] font-bold border-[#c9a84c]'
                        : 'bg-white/[0.03] text-zinc-300 border-white/[0.08] hover:border-[#c9a84c]/40 hover:text-white'
                    )}>
                    {fmtTime12h(slot.time)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        <button type="button" onClick={doReschedule} disabled={busy || !pickDate || !pickTime}
          className="w-full py-3.5 rounded-xl text-sm font-bold bg-[#c9a84c] text-[#0a0a0a] hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CalendarClock className="w-4 h-4" /> Confirm new time</>}
        </button>
      </div>
    )
  }

  // ── Overview (default) ──────────────────────────────────────────────────────
  return (
    <div className={card}>
      <div className="text-center mb-5">
        <h1 className="text-xl font-bold text-white">Your Booking</h1>
        {booking.bookingRef && (
          <p className="text-xs text-zinc-500 mt-1 font-mono tracking-wider">{booking.bookingRef}</p>
        )}
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-3">{summary}</div>
      <div className="flex items-center justify-between text-sm px-1 mb-6">
        <span className="text-zinc-500">Total</span>
        <span className="font-semibold text-white">{fmtCur(booking.price, booking.currency)}</span>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => setView('reschedule')}
          className="flex-1 py-3.5 rounded-xl text-sm font-bold bg-[#c9a84c] text-[#0a0a0a] hover:brightness-105 flex items-center justify-center gap-2">
          <CalendarClock className="w-4 h-4" /> Reschedule
        </button>
        <button type="button" onClick={() => setView('cancel')}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold border border-white/[0.1] text-zinc-300 hover:text-white hover:border-white/20">
          Cancel
        </button>
      </div>

      {booking.shopPhone && (
        <p className="text-xs text-zinc-500 mt-5 text-center">
          Prefer to talk to us? Call <a href={`tel:${booking.shopPhone}`} className="text-[#c9a84c]">{booking.shopPhone}</a>.
        </p>
      )}
    </div>
  )
}
