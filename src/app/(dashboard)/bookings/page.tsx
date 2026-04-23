'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  format, addDays, subDays, startOfWeek, parseISO, isToday, isValid,
} from 'date-fns'
import { ChevronLeft, ChevronRight, List, Grid2x2, CalendarDays, Plus, CalendarCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BookingsList }     from '@/components/bookings/BookingsList'
import { BookingsDayView }  from '@/components/bookings/BookingsDayView'
import { BookingsWeekView } from '@/components/bookings/BookingsWeekView'
import { BookingModal }     from '@/components/bookings/BookingModal'
import type { BookingWithRelations } from '@/types/database'

// ── Types ─────────────────────────────────────────────────────────────────
type ViewMode = 'list' | 'day' | 'week'

// These come from the DashboardShell context — hard-code reasonable defaults
// and let the parent layout inject them via URL or global state if needed.
// For simplicity we read from localStorage on mount.
const SHOP_ID_KEY  = 'bb_shop_id'
const CURRENCY_KEY = 'bb_currency'

function getStoredShopId():  string { return typeof window !== 'undefined' ? (localStorage.getItem(SHOP_ID_KEY) ?? '') : '' }
function getStoredCurrency(): string { return typeof window !== 'undefined' ? (localStorage.getItem(CURRENCY_KEY) ?? 'GBP') : 'GBP' }

// ── View toggle button ────────────────────────────────────────────────────
function ViewBtn({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
        active
          ? 'bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20'
          : 'text-zinc-400 hover:text-white border border-transparent hover:border-white/[0.06]'
      )}
    >
      {icon}
      <span className="hidden sm:block">{label}</span>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const [view,    setView]    = useState<ViewMode>('list')
  const [date,    setDate]    = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [, startTransition]   = useTransition()

  // Modal state
  const [modalOpen,      setModalOpen]      = useState(false)
  const [modalInitTime,  setModalInitTime]  = useState<string | undefined>()
  const [modalInitStaff, setModalInitStaff] = useState<string | undefined>()

  // Populated after mount to avoid SSR/client hydration mismatch
  const [shopId,   setShopId]   = useState('')
  const [currency, setCurrency] = useState('GBP')

  useEffect(() => {
    setShopId(getStoredShopId())
    setCurrency(getStoredCurrency())
  }, [])

  const parsedDate = parseISO(date)
  const weekStart  = isValid(parsedDate) ? startOfWeek(parsedDate, { weekStartsOn: 1 }) : startOfWeek(new Date(), { weekStartsOn: 1 })
  const todayDate  = format(new Date(), 'yyyy-MM-dd')
  const isThisDate = date === todayDate

  function prevPeriod() {
    startTransition(() =>
      setDate((d) => format(view === 'week' ? addDays(parseISO(d), -7) : subDays(parseISO(d), 1), 'yyyy-MM-dd'))
    )
  }
  function nextPeriod() {
    startTransition(() =>
      setDate((d) => format(view === 'week' ? addDays(parseISO(d), 7) : addDays(parseISO(d), 1), 'yyyy-MM-dd'))
    )
  }
  function goToday() {
    startTransition(() => setDate(todayDate))
  }

  function periodLabel() {
    if (view === 'week') {
      return `${format(weekStart, 'd MMM')} – ${format(addDays(weekStart, 6), 'd MMM yyyy')}`
    }
    if (view === 'day') {
      return isToday(parseISO(date)) ? 'Today' : format(parseISO(date), 'EEEE, d MMMM yyyy')
    }
    return 'All Bookings'
  }

  function handleSlotClick(staffId: string, time: string) {
    setModalInitStaff(staffId)
    setModalInitTime(time)
    setModalOpen(true)
  }

  function handleDayClick(d: string) {
    setDate(d)
    setView('day')
  }

  function handleNewBooking() {
    setModalInitStaff(undefined)
    setModalInitTime(undefined)
    setModalOpen(true)
  }

  function handleBookingCreated(_booking: BookingWithRelations) {
    // Nothing to do — views reload on next interaction or via refetch
  }

  return (
    <div className="space-y-5 max-w-[1600px]">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left: date navigator */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-0.5 bg-[#111111] border border-white/[0.06] rounded-xl p-1">
            <button
              type="button"
              onClick={prevPeriod}
              aria-label="Previous period"
              className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={goToday}
              className={cn(
                'px-2 xs:px-3 py-1 rounded-lg text-xs xs:text-sm font-medium transition-colors whitespace-nowrap max-w-[140px] xs:max-w-none truncate',
                isThisDate && view !== 'list'
                  ? 'text-[#c9a84c]'
                  : 'text-white hover:bg-white/[0.04]'
              )}
            >
              {periodLabel()}
            </button>

            <button
              type="button"
              onClick={nextPeriod}
              aria-label="Next period"
              className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Today shortcut */}
          {!isThisDate && view !== 'list' && (
            <button
              type="button"
              onClick={goToday}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors border border-white/[0.06]"
            >
              Today
            </button>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
          {/* View toggle — hide week on mobile */}
          <div className="flex items-center gap-0.5 bg-[#111111] border border-white/[0.06] rounded-xl p-1">
            <ViewBtn active={view === 'list'} onClick={() => setView('list')} icon={<List className="w-3.5 h-3.5" />}      label="List" />
            <ViewBtn active={view === 'day'}  onClick={() => setView('day')}  icon={<CalendarDays className="w-3.5 h-3.5" />} label="Day" />
            <span className="hidden sm:contents">
              <ViewBtn active={view === 'week'} onClick={() => setView('week')} icon={<Grid2x2 className="w-3.5 h-3.5" />} label="Week" />
            </span>
          </div>

          {/* New booking */}
          <button
            type="button"
            onClick={handleNewBooking}
            className="flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-sm rounded-xl px-3 xs:px-4 py-2 min-h-[36px] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:block">New Booking</span>
          </button>
        </div>
      </div>

      {/* ── View content ──────────────────────────────────────────────── */}
      {shopId ? (
        <div className={cn('transition-all duration-200')}>
          {view === 'list' && (
            <BookingsList
              shopId={shopId}
              currency={currency}
            />
          )}
          {view === 'day' && (
            <BookingsDayView
              shopId={shopId}
              date={date}
              currency={currency}
              onSlotClick={handleSlotClick}
            />
          )}
          {view === 'week' && (
            <BookingsWeekView
              shopId={shopId}
              weekStart={weekStart}
              currency={currency}
              onDayClick={handleDayClick}
            />
          )}
        </div>
      ) : (
        <NoShopState />
      )}

      {/* ── Booking modal ─────────────────────────────────────────────── */}
      <BookingModal
        shopId={shopId}
        shopCurrency={currency}
        initialDate={date}
        initialStaffId={modalInitStaff}
        initialTime={modalInitTime}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleBookingCreated}
      />
    </div>
  )
}

// ── No-shop fallback ──────────────────────────────────────────────────────
function NoShopState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-600">
      <CalendarCheck className="w-10 h-10 opacity-30" />
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-400">Shop not loaded</p>
        <p className="text-xs mt-1">Try refreshing the page.</p>
      </div>
    </div>
  )
}
