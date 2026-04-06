'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Check, Clock, Scissors, User,
  Calendar, Phone, Mail, MapPin, Star, Loader2, X,
  CalendarPlus, Share2, AlertCircle, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, isBefore, isAfter, parseISO, isSameDay } from 'date-fns'

// ── Prop types ────────────────────────────────────────────────────────────

export interface PublicService {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
  category: string
  colour: string
}

export interface PublicStaff {
  id: string
  name: string
  bio: string | null
  avatar_url: string | null
  role: string
  colour: string
}

export interface PublicShop {
  id: string
  name: string
  phone: string | null
  address: string | null
  city: string | null
  postcode: string | null
  currency: string
  cancellation_hours: number
  no_show_fee: number
  opening_hours: Record<string, { open: string; close: string; closed: boolean }>
}

interface Props {
  shop:     PublicShop
  services: PublicService[]
  staff:    PublicStaff[]
}

// ── Helpers ───────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5

const STEP_LABELS = ['Service', 'Barber', 'Date & Time', 'Details', 'Confirm']

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function fmtCur(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
}

function fmtDuration(mins: number) {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function fmtTime12h(t: string) {
  const [h, m] = t.split(':').map(Number)
  const d = new Date(); d.setHours(h, m, 0)
  return format(d, 'h:mm a')
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function isShopOpenOnDate(
  date: Date,
  openingHours: Record<string, { open: string; close: string; closed: boolean }>,
): boolean {
  const dayKey = DAY_KEYS[date.getDay()]
  const h = openingHours[dayKey]
  return !!h && !h.closed
}

// ── Step indicator ────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-xs mx-auto">
      {STEP_LABELS.map((label, i) => {
        const n       = (i + 1) as Step
        const done    = n < current
        const active  = n === current
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                done   ? 'bg-[#c9a84c] text-[#0a0a0a]'
                : active ? 'bg-[#c9a84c]/20 text-[#c9a84c] border-2 border-[#c9a84c]'
                : 'bg-white/[0.05] text-zinc-600 border-2 border-white/[0.08]'
              )}>
                {done ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <span className={cn('text-[9px] font-medium tracking-wide whitespace-nowrap hidden xs:block',
                active ? 'text-[#c9a84c]' : 'text-zinc-600')}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={cn('h-px w-5 xs:w-7 sm:w-8 mx-0.5 mb-4 xs:mb-5 transition-colors',
                done ? 'bg-[#c9a84c]' : 'bg-white/[0.08]')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: Service ───────────────────────────────────────────────────────

function Step1Service({
  services, selected, currency, onSelect,
}: {
  services: PublicService[]
  selected: PublicService | null
  currency: string
  onSelect: (s: PublicService) => void
}) {
  const categories = [...new Set(services.map(s => s.category))].sort()
  const [activeTab, setActiveTab] = useState(categories[0] ?? '')
  const filtered   = services.filter(s => s.category === activeTab)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Choose a service</h2>
        <p className="text-sm text-zinc-500 mt-0.5">What would you like today?</p>
      </div>

      {/* Category tabs */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat} type="button"
              onClick={() => setActiveTab(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                activeTab === cat
                  ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30'
                  : 'bg-white/[0.03] text-zinc-500 border-white/[0.08] hover:text-zinc-300'
              )}>{cat}</button>
          ))}
        </div>
      )}

      {/* Service cards */}
      <div className="space-y-2.5">
        {filtered.map(svc => {
          const scopeClass = `svc-pub-${svc.id.replace(/-/g, '').slice(0, 10)}`
          return (
            <div key={svc.id}>
              <style>{`.${scopeClass}{--svc-c:${svc.colour}}`}</style>
              <button type="button"
                onClick={() => onSelect(svc)}
                className={cn(
                  'w-full text-left flex items-center gap-4 p-4 rounded-2xl border transition-all',
                  selected?.id === svc.id
                    ? 'bg-[#1a1a1a] border-[#c9a84c]/40 ring-1 ring-[#c9a84c]/20'
                    : 'bg-[#111111] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#161616]'
                )}>
                {/* Colour dot */}
                <div className={cn('w-1 self-stretch rounded-full flex-shrink-0', scopeClass,
                  '[background:var(--svc-c,#c9a84c)]')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white text-sm">{svc.name}</span>
                    <span className="font-bold text-[#c9a84c] text-sm flex-shrink-0">
                      {fmtCur(svc.price, currency)}
                    </span>
                  </div>
                  {svc.description && (
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{svc.description}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-zinc-600" />
                    <span className="text-[11px] text-zinc-600">{fmtDuration(svc.duration_minutes)}</span>
                  </div>
                </div>
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                  selected?.id === svc.id
                    ? 'bg-[#c9a84c] border-[#c9a84c]'
                    : 'border-white/[0.15]'
                )}>
                  {selected?.id === svc.id && <Check className="w-3 h-3 text-[#0a0a0a]" />}
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 2: Barber ────────────────────────────────────────────────────────

function Step2Staff({
  staff, selected, onSelect,
}: {
  staff: PublicStaff[]
  selected: PublicStaff | 'any' | null
  onSelect: (s: PublicStaff | 'any') => void
}) {
  const AVATAR_BG = ['bg-[#c9a84c]/20 text-[#c9a84c]', 'bg-indigo-500/20 text-indigo-400',
    'bg-emerald-500/20 text-emerald-400', 'bg-rose-500/20 text-rose-400',
    'bg-violet-500/20 text-violet-400', 'bg-blue-500/20 text-blue-400']

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Choose your barber</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Pick a specific barber or let us assign one</p>
      </div>

      <div className="space-y-2.5">
        {/* Any barber option */}
        <button type="button" onClick={() => onSelect('any')}
          className={cn(
            'w-full text-left flex items-center gap-4 p-4 rounded-2xl border transition-all',
            selected === 'any'
              ? 'bg-[#1a1a1a] border-[#c9a84c]/40 ring-1 ring-[#c9a84c]/20'
              : 'bg-[#111111] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#161616]'
          )}>
          <div className="w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">Any available barber</p>
            <p className="text-xs text-zinc-500 mt-0.5">We&apos;ll assign the first available</p>
          </div>
          <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
            selected === 'any' ? 'bg-[#c9a84c] border-[#c9a84c]' : 'border-white/[0.15]')}>
            {selected === 'any' && <Check className="w-3 h-3 text-[#0a0a0a]" />}
          </div>
        </button>

        {/* Individual staff */}
        {staff.map((s, i) => {
          const isSelected = typeof selected === 'object' && selected?.id === s.id
          return (
            <button key={s.id} type="button" onClick={() => onSelect(s)}
              className={cn(
                'w-full text-left flex items-center gap-4 p-4 rounded-2xl border transition-all',
                isSelected
                  ? 'bg-[#1a1a1a] border-[#c9a84c]/40 ring-1 ring-[#c9a84c]/20'
                  : 'bg-[#111111] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#161616]'
              )}>
              {s.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.avatar_url} alt={s.name}
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${AVATAR_BG[i % AVATAR_BG.length]}`}>
                  {getInitials(s.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{s.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5 capitalize">{s.role}</p>
                {s.bio && <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">{s.bio}</p>}
              </div>
              <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                isSelected ? 'bg-[#c9a84c] border-[#c9a84c]' : 'border-white/[0.15]')}>
                {isSelected && <Check className="w-3 h-3 text-[#0a0a0a]" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 3: Date & Time ───────────────────────────────────────────────────

type SlotInfo = { time: string; end_time: string; available: boolean; staffId: string | null }

function MiniCalendar({
  selectedDate, onSelect, openingHours,
}: {
  selectedDate: string | null
  onSelect: (d: string) => void
  openingHours: Record<string, { open: string; close: string; closed: boolean }>
}) {
  const today   = new Date(); today.setHours(0, 0, 0, 0)
  const maxDate = addDays(today, 30)
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const monthStart = startOfMonth(viewMonth)
  const monthEnd   = endOfMonth(viewMonth)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: gridStart, end: endOfMonth(monthEnd) })
  // Pad to 6 weeks if needed
  while (days.length < 42) days.push(addDays(days[days.length - 1], 1))
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const canPrev = isBefore(today, viewMonth) && viewMonth.getMonth() !== today.getMonth()
  const canNext = isAfter(maxDate, addDays(monthEnd, 1))

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Month header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <button type="button" onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          disabled={!canPrev} aria-label="Previous month"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-white">{format(viewMonth, 'MMMM yyyy')}</span>
        <button type="button" onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          disabled={!canNext} aria-label="Next month"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 px-2 pt-2 pb-1">
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-zinc-600 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="px-2 pb-3">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              const dateStr    = format(day, 'yyyy-MM-dd')
              const inMonth    = day.getMonth() === viewMonth.getMonth()
              const isPast     = isBefore(day, today)
              const isTooFar   = isAfter(day, maxDate)
              const isShopOpen = isShopOpenOnDate(day, openingHours)
              const isToday    = isSameDay(day, new Date())
              const isSelected = selectedDate === dateStr
              const disabled   = isPast || isTooFar || !isShopOpen || !inMonth

              return (
                <div key={di} className="aspect-square p-0.5 min-h-[36px] xs:min-h-[40px]">
                  <button type="button"
                    disabled={disabled}
                    onClick={() => onSelect(dateStr)}
                    className={cn(
                      'w-full h-full rounded-lg text-xs font-medium transition-all min-h-[36px]',
                      disabled && 'opacity-25 cursor-not-allowed',
                      !disabled && 'hover:bg-white/[0.06] cursor-pointer',
                      isSelected && 'bg-[#c9a84c] text-[#0a0a0a] font-bold hover:bg-[#c9a84c]',
                      isToday && !isSelected && 'ring-1 ring-[#c9a84c]/40 text-[#c9a84c]',
                      !isSelected && !disabled && 'text-zinc-300',
                    )}>
                    {format(day, 'd')}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function Step3DateTime({
  shopId, serviceId, staffId, selectedDate, selectedTime, openingHours,
  onDateSelect, onTimeSelect,
}: {
  shopId: string; serviceId: string; staffId: string
  selectedDate: string | null; selectedTime: string | null
  openingHours: Record<string, { open: string; close: string; closed: boolean }>
  onDateSelect: (d: string) => void
  onTimeSelect: (slot: SlotInfo) => void
}) {
  const [slots, setSlots]       = useState<SlotInfo[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  useEffect(() => {
    if (!selectedDate) { setSlots([]); return }
    setSlotsLoading(true)
    const params = new URLSearchParams({
      shop_id: shopId, service_id: serviceId,
      staff_id: staffId, date: selectedDate,
    })
    fetch(`/api/public/availability?${params}`)
      .then(r => r.json())
      .then((json: { slots?: SlotInfo[] }) => setSlots(json.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [shopId, serviceId, staffId, selectedDate])

  const availableSlots = slots.filter(s => s.available)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Pick a date</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Available times will appear once you pick a date</p>
      </div>

      <MiniCalendar
        selectedDate={selectedDate}
        onSelect={onDateSelect}
        openingHours={openingHours}
      />

      {selectedDate && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300">
            {format(parseISO(selectedDate), 'EEEE, d MMMM')}
          </h3>

          {slotsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="flex items-center gap-2.5 bg-yellow-400/[0.06] border border-yellow-400/15 rounded-xl px-4 py-3 text-sm text-yellow-400/80">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              No available slots on this date. Please try another day.
            </div>
          ) : (
            <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map(slot => (
                <button key={slot.time} type="button"
                  onClick={() => onTimeSelect(slot)}
                  className={cn(
                    'py-3 xs:py-3.5 rounded-xl text-sm font-medium border transition-all min-h-[44px]',
                    selectedTime === slot.time
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
    </div>
  )
}

// ── Step 4: Client details ────────────────────────────────────────────────

interface ClientDetails {
  name: string; email: string; phone: string; notes: string; agreed: boolean
}

function Step4Details({
  shop, details, onChange, errors,
}: {
  shop: PublicShop
  details: ClientDetails
  onChange: (d: ClientDetails) => void
  errors: Partial<Record<keyof ClientDetails, string>>
}) {
  const INPUT = 'w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20'

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Your details</h2>
        <p className="text-sm text-zinc-500 mt-0.5">We&apos;ll send your confirmation here</p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="pub-name" className="text-xs font-medium text-zinc-400">
            Full name <span className="text-red-400">*</span>
          </label>
          <input id="pub-name" type="text" placeholder="John Smith" autoComplete="name"
            value={details.name} onChange={e => onChange({ ...details, name: e.target.value })}
            className={cn(INPUT, errors.name && 'border-red-500/50')} />
          {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="pub-email" className="text-xs font-medium text-zinc-400">
            Email address <span className="text-red-400">*</span>
          </label>
          <input id="pub-email" type="email" placeholder="john@example.com" autoComplete="email"
            value={details.email} onChange={e => onChange({ ...details, email: e.target.value })}
            className={cn(INPUT, errors.email && 'border-red-500/50')} />
          {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label htmlFor="pub-phone" className="text-xs font-medium text-zinc-400">
            Phone number <span className="text-red-400">*</span>
          </label>
          <input id="pub-phone" type="tel" placeholder="+44 7700 900000" autoComplete="tel"
            value={details.phone} onChange={e => onChange({ ...details, phone: e.target.value })}
            className={cn(INPUT, errors.phone && 'border-red-500/50')} />
          {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label htmlFor="pub-notes" className="text-xs font-medium text-zinc-400">Notes (optional)</label>
          <textarea id="pub-notes" rows={3} placeholder="Any preferences or requests…"
            value={details.notes} onChange={e => onChange({ ...details, notes: e.target.value })}
            className={cn(INPUT, 'resize-none')} />
        </div>

        {/* Cancellation policy + checkbox */}
        {shop.cancellation_hours > 0 && (
          <div className="bg-[#1a1a1a] border border-white/[0.06] rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-300">Cancellation policy</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Please cancel at least <strong className="text-zinc-300">{shop.cancellation_hours} hours</strong> before
              your appointment.
              {shop.no_show_fee > 0 && (
                <> A <strong className="text-zinc-300">{fmtCur(shop.no_show_fee, shop.currency)}</strong> fee applies for no-shows.</>
              )}
            </p>
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer group">
          <button type="button"
            role="checkbox"
            aria-checked={details.agreed ? 'true' : 'false'}
            onClick={() => onChange({ ...details, agreed: !details.agreed })}
            className={cn(
              'mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all',
              details.agreed ? 'bg-[#c9a84c] border-[#c9a84c]' : 'bg-transparent border-white/20 group-hover:border-[#c9a84c]/50',
              errors.agreed && 'border-red-500'
            )}>
            {details.agreed && <Check className="w-3 h-3 text-[#0a0a0a]" />}
          </button>
          <span className="text-xs text-zinc-400 leading-relaxed">
            I agree to the cancellation policy and understand that my details will be used to manage my booking.
          </span>
        </label>
        {errors.agreed && <p className="text-xs text-red-400 -mt-3">{errors.agreed}</p>}
      </div>
    </div>
  )
}

// ── Step 5: Confirm ───────────────────────────────────────────────────────

function Step5Confirm({
  shop, service, staffName, date, time, details,
}: {
  shop: PublicShop; service: PublicService; staffName: string
  date: string; time: string; details: ClientDetails
}) {
  const rows = [
    { label: 'Service',  value: service.name },
    { label: 'Barber',   value: staffName },
    { label: 'Date',     value: format(parseISO(date), 'EEEE, d MMMM yyyy') },
    { label: 'Time',     value: fmtTime12h(time) },
    { label: 'Duration', value: fmtDuration(service.duration_minutes) },
    { label: 'Price',    value: fmtCur(service.price, shop.currency) },
    { label: 'Name',     value: details.name },
    { label: 'Email',    value: details.email },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Confirm your booking</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Everything looks right? Tap confirm below.</p>
      </div>

      <div className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl overflow-hidden">
        {rows.map(({ label, value }, i) => (
          <div key={label} className={cn('flex items-center justify-between px-4 py-3 gap-4',
            i < rows.length - 1 && 'border-b border-white/[0.04]')}>
            <span className="text-xs text-zinc-500 flex-shrink-0">{label}</span>
            <span className="text-sm text-zinc-200 text-right">{value}</span>
          </div>
        ))}
        {/* Total */}
        <div className="bg-[#c9a84c]/[0.06] px-4 py-3.5 flex items-center justify-between border-t border-[#c9a84c]/15">
          <span className="text-sm font-bold text-zinc-300">Total</span>
          <span className="text-lg font-black text-[#c9a84c]">{fmtCur(service.price, shop.currency)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Success screen ────────────────────────────────────────────────────────

function SuccessScreen({
  bookingId, service, staffName, date, time, shopName, shopPhone, currency,
  shopSlug,
}: {
  bookingId: string; service: PublicService; staffName: string
  date: string; time: string; shopName: string; shopPhone: string | null
  currency: string; shopSlug: string
}) {
  const ref    = bookingId.slice(0, 8).toUpperCase()
  const dateObj = parseISO(date)
  const [h, m] = time.split(':').map(Number)
  const endH   = h + Math.floor((m + service.duration_minutes) / 60)
  const endM   = (m + service.duration_minutes) % 60
  const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`

  // Calendar links
  const title = encodeURIComponent(`${service.name} at ${shopName}`)
  const dtStart = `${date.replace(/-/g, '')}T${time.replace(':', '')}00`
  const dtEnd   = `${date.replace(/-/g, '')}T${endTime.replace(':', '')}00`
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dtStart}/${dtEnd}`
  const icsContent = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${decodeURIComponent(title)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n')
  const icsBlob = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/booking/${shopSlug}`

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: `Book at ${shopName}`, url: shareUrl }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareUrl).catch(() => {})
    }
  }

  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      {/* Checkmark */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center">
          <Check className="w-9 h-9 text-[#c9a84c]" />
        </div>
        <div className="absolute inset-0 rounded-full bg-[#c9a84c]/5 animate-ping" />
      </div>

      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Booking Confirmed!</h2>
        <p className="text-zinc-500 text-sm mt-1">A confirmation email is on its way to you.</p>
      </div>

      {/* Booking ref */}
      <div className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl px-6 py-4 space-y-1 w-full max-w-xs">
        <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Booking reference</p>
        <p className="text-2xl font-black text-[#c9a84c] tracking-widest">{ref}</p>
      </div>

      {/* Details summary */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-2xl overflow-hidden w-full text-left">
        {[
          [service.name, fmtDuration(service.duration_minutes)],
          [staffName, 'Your barber'],
          [format(dateObj, 'EEEE, d MMMM yyyy'), fmtTime12h(time)],
          [fmtCur(service.price, currency), 'Total'],
        ].map(([a, b], i) => (
          <div key={i} className={cn('flex items-center justify-between px-4 py-3',
            i < 3 && 'border-b border-white/[0.04]')}>
            <span className="text-sm text-zinc-200">{a}</span>
            <span className="text-xs text-zinc-500">{b}</span>
          </div>
        ))}
      </div>

      {/* Add to calendar */}
      <div className="w-full space-y-2">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Add to calendar</p>
        <div className="flex gap-2 justify-center flex-wrap">
          <a href={googleUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#1a1a1a] border border-white/[0.08] hover:border-white/[0.15] rounded-xl px-4 py-2.5 text-xs text-zinc-300 transition-colors">
            <CalendarPlus className="w-3.5 h-3.5" /> Google Calendar
          </a>
          <a href={icsBlob} download="booking.ics"
            className="flex items-center gap-1.5 bg-[#1a1a1a] border border-white/[0.08] hover:border-white/[0.15] rounded-xl px-4 py-2.5 text-xs text-zinc-300 transition-colors">
            <CalendarPlus className="w-3.5 h-3.5" /> Apple / Outlook
          </a>
        </div>
      </div>

      {/* Share */}
      <button type="button" onClick={handleShare}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
        <Share2 className="w-3.5 h-3.5" /> Share this booking page
      </button>

      {shopPhone && (
        <p className="text-xs text-zinc-600">
          Need to cancel or reschedule?{' '}
          <a href={`tel:${shopPhone}`} className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">
            Call us
          </a>
        </p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function PublicBookingFlow({ shop, services, staff }: Props) {
  const [step, setStep]             = useState<Step>(1)
  const [service, setService]       = useState<PublicService | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<PublicStaff | 'any' | null>(null)
  const [date, setDate]             = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null)
  const [details, setDetails]       = useState<ClientDetails>({
    name: '', email: '', phone: '', notes: '', agreed: false,
  })
  const [detailErrors, setDetailErrors] = useState<Partial<Record<keyof ClientDetails, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id: string; staffName: string
  } | null>(null)

  // Reset time when date or staff changes
  useEffect(() => { setSelectedSlot(null) }, [date, selectedStaff])
  useEffect(() => { setSelectedSlot(null); setDate(null) }, [selectedStaff])

  const resolvedStaffId = selectedStaff === 'any' ? 'any'
    : typeof selectedStaff === 'object' ? selectedStaff?.id ?? 'any' : 'any'

  const resolvedStaffName = selectedStaff === 'any' ? 'Any available barber'
    : typeof selectedStaff === 'object' ? selectedStaff?.name ?? '' : ''

  // ── Navigation ──────────────────────────────────────────────────────────
  function canAdvance(): boolean {
    if (step === 1) return !!service
    if (step === 2) return selectedStaff !== null
    if (step === 3) return !!date && !!selectedSlot
    if (step === 4) return true // validated on attempt
    return true
  }

  function advance() {
    if (step === 4) { if (!validateDetails()) return }
    if (step < 5) setStep((s => (s + 1) as Step)(step))
  }

  function back() {
    if (step > 1) setStep((s => (s - 1) as Step)(step))
  }

  // ── Validation ──────────────────────────────────────────────────────────
  function validateDetails(): boolean {
    const errs: Partial<Record<keyof ClientDetails, string>> = {}
    if (!details.name.trim()) errs.name = 'Name is required'
    if (!details.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) errs.email = 'Invalid email address'
    if (!details.phone.trim()) errs.phone = 'Phone number is required'
    if (!details.agreed) errs.agreed = 'Please agree to the cancellation policy'
    setDetailErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!service || !selectedSlot || !date) return
    setSubmitting(true)
    setSubmitError(null)

    // If "any barber", the slot already has the assigned staffId from the availability API
    const finalStaffId = selectedStaff === 'any'
      ? (selectedSlot.staffId ?? staff[0]?.id)
      : (selectedStaff as PublicStaff).id

    if (!finalStaffId) {
      setSubmitError('No staff available for this slot.')
      setSubmitting(false)
      return
    }

    try {
      const res  = await fetch('/api/public/bookings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id:      shop.id,
          service_id:   service.id,
          staff_id:     finalStaffId,
          date,
          start_time:   selectedSlot.time,
          end_time:     selectedSlot.end_time,
          client_name:  details.name.trim(),
          client_email: details.email.trim(),
          client_phone: details.phone.trim() || undefined,
          notes:        details.notes.trim() || undefined,
        }),
      })
      const json = await res.json() as { data?: { id: string; staff_name: string }; error?: string }

      if (!res.ok) {
        setSubmitError(json.error ?? 'Something went wrong. Please try again.')
        return
      }

      setConfirmedBooking({
        id:        json.data!.id,
        staffName: json.data!.staff_name ?? resolvedStaffName,
      })
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (confirmedBooking && service && date && selectedSlot) {
    return (
      <SuccessScreen
        bookingId={confirmedBooking.id}
        service={service}
        staffName={confirmedBooking.staffName}
        date={date}
        time={selectedSlot.time}
        shopName={shop.name}
        shopPhone={shop.phone}
        currency={shop.currency}
        shopSlug={typeof window !== 'undefined' ? window.location.pathname.split('/').pop() ?? '' : ''}
      />
    )
  }

  // ── Main flow ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <StepIndicator current={step} />

      {/* Step content */}
      <div className="min-h-[320px]">
        {step === 1 && (
          <Step1Service
            services={services} selected={service}
            currency={shop.currency} onSelect={s => { setService(s); setStep(2) }}
          />
        )}
        {step === 2 && (
          <Step2Staff
            staff={staff} selected={selectedStaff}
            onSelect={s => { setSelectedStaff(s) }}
          />
        )}
        {step === 3 && service && (
          <Step3DateTime
            shopId={shop.id} serviceId={service.id}
            staffId={resolvedStaffId}
            selectedDate={date} selectedTime={selectedSlot?.time ?? null}
            openingHours={shop.opening_hours}
            onDateSelect={setDate}
            onTimeSelect={s => setSelectedSlot(s)}
          />
        )}
        {step === 4 && (
          <Step4Details
            shop={shop} details={details}
            onChange={setDetails} errors={detailErrors}
          />
        )}
        {step === 5 && service && selectedSlot && date && (
          <Step5Confirm
            shop={shop} service={service}
            staffName={resolvedStaffName}
            date={date} time={selectedSlot.time}
            details={details}
          />
        )}
      </div>

      {/* Error banner */}
      {submitError && (
        <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{submitError}
        </div>
      )}

      {/* Navigation — sticky on mobile */}
      <div className="flex items-center gap-3 sticky bottom-0 bg-[#0a0a0a] pt-3 pb-4 -mx-0 xs:-mx-0">
        {step > 1 && (
          <button type="button" onClick={back}
            className="flex items-center gap-1.5 px-5 py-3.5 min-h-[48px] rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}

        {step < 5 ? (
          <button type="button" onClick={advance} disabled={!canAdvance()}
            className="flex-1 flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl py-3.5 min-h-[48px] text-sm transition-colors">
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button type="button" onClick={handleConfirm} disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl py-3.5 min-h-[48px] text-sm transition-colors">
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" />Confirming…</>
              : <>Confirm Booking <Check className="w-4 h-4" /></>
            }
          </button>
        )}
      </div>
    </div>
  )
}
