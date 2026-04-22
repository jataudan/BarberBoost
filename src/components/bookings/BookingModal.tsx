'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { format, parseISO, startOfDay, isValid } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useBookings, type CreateBookingPayload } from '@/hooks/useBookings'
import { cn } from '@/lib/utils'
import {
  X, ChevronLeft, ChevronRight, Check, Loader2, AlertCircle,
  Search, UserPlus, Calendar, Clock, Scissors, User, CreditCard,
} from 'lucide-react'
import type { Staff, Service, Client, BookingWithRelations } from '@/types/database'

// ── Types ─────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5

export interface BookingModalProps {
  shopId:          string
  shopCurrency:    string
  initialDate?:    string
  initialStaffId?: string
  initialTime?:    string
  open:            boolean
  onOpenChange:    (open: boolean) => void
  onSuccess?:      (booking: BookingWithRelations) => void
}

// ── Time helpers ──────────────────────────────────────────────────────────
function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function minutesToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`
}
function format12h(t: string | null | undefined) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return t
  const d = new Date(); d.setHours(h, m)
  return format(d, 'h:mm a')
}

function generateSlots(
  openTime: string,
  closeTime: string,
  durationMin: number,
  existingBookings: { start_time: string; end_time: string }[]
): string[] {
  const open = timeToMinutes(openTime), close = timeToMinutes(closeTime)
  const slots: string[] = []
  for (let t = open; t + durationMin <= close; t += 30) {
    const clash = existingBookings.some((b) =>
      t < timeToMinutes(b.end_time) && t + durationMin > timeToMinutes(b.start_time)
    )
    if (!clash) slots.push(minutesToTime(t))
  }
  return slots
}

// ── Shared input style ────────────────────────────────────────────────────
const INPUT = 'w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20'

// ── Step indicator ────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {([1,2,3,4,5] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1">
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all',
            s < current  ? 'bg-emerald-500 text-white' :
            s === current ? 'bg-[#c9a84c] text-[#0a0a0a]' :
                            'bg-white/[0.06] text-zinc-500'
          )}>
            {s < current ? <Check className="w-3 h-3" /> : s}
          </div>
          {i < 4 && <div className={cn('flex-1 h-px', s < current ? 'bg-emerald-500' : 'bg-white/[0.06]')} />}
        </div>
      ))}
    </div>
  )
}

// ── Staff picker card — colour set via CSS custom prop on ref ─────────────
function StaffCard({ staff, selected, onClick }: { staff: Staff; selected: boolean; onClick: () => void }) {
  const avatarRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    avatarRef.current?.style.setProperty('--staff-colour', staff.colour)
  }, [staff.colour])
  return (
    <button type="button" onClick={onClick} className={cn(
      'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
      selected ? 'border-[#c9a84c]/50 bg-[#c9a84c]/[0.06]' : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-zinc-600'
    )}>
      <div
        ref={avatarRef}
        className="staff-avatar w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
      >
        {staff.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate">{staff.name}</p>
        <p className="text-xs text-zinc-500 capitalize">{staff.role}</p>
      </div>
      {selected && <Check className="w-4 h-4 text-[#c9a84c] ml-auto flex-shrink-0" />}
    </button>
  )
}

// ── Service picker card — colour bar set via CSS custom prop on ref ────────
function ServiceCard({ service, selected, currency, onClick }: {
  service: Service; selected: boolean; currency: string; onClick: () => void
}) {
  const barRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    barRef.current?.style.setProperty('--service-colour', service.colour)
  }, [service.colour])
  const price = new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(service.price)
  return (
    <button type="button" onClick={onClick} className={cn(
      'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
      selected ? 'border-[#c9a84c]/50 bg-[#c9a84c]/[0.06]' : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-zinc-600'
    )}>
      <div ref={barRef} className="service-colour-bar w-2 self-stretch rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{service.name}</p>
        <p className="text-xs text-zinc-500">{service.duration_minutes} min · {price}</p>
      </div>
      {selected && <Check className="w-4 h-4 text-[#c9a84c] flex-shrink-0" />}
    </button>
  )
}

// ── Summary row ───────────────────────────────────────────────────────────
function SummaryRow({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-zinc-600 flex-shrink-0">{icon}</span>
      <span className="text-sm text-white">{label}</span>
      {sub && <span className="text-xs text-zinc-500 ml-auto">{sub}</span>}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export function BookingModal({
  shopId, shopCurrency, initialDate, initialStaffId, initialTime,
  open, onOpenChange, onSuccess,
}: BookingModalProps) {
  const { createBooking } = useBookings()
  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [selectedDate,    setSelectedDate]    = useState(initialDate ?? format(new Date(), 'yyyy-MM-dd'))
  const [selectedStaffId, setSelectedStaffId] = useState(initialStaffId ?? '')
  const [staff, setStaff] = useState<Staff[]>([])

  // Step 2
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [services, setServices] = useState<Service[]>([])

  // Step 3
  const [selectedTime,   setSelectedTime]   = useState(initialTime ?? '')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots,   setLoadingSlots]   = useState(false)

  // Step 4
  const [clientName,      setClientName]      = useState('')
  const [clientEmail,     setClientEmail]     = useState('')
  const [clientPhone,     setClientPhone]     = useState('')
  const [clientId,        setClientId]        = useState<string | null>(null)
  const [clientSearch,    setClientSearch]    = useState('')
  const [clientResults,   setClientResults]   = useState<Client[]>([])
  const [searchingClient, setSearchingClient] = useState(false)

  // Step 5
  const [depositEnabled, setDepositEnabled] = useState(false)
  const [notes,          setNotes]          = useState('')
  const [submitting,     setSubmitting]     = useState(false)
  const [submitError,    setSubmitError]    = useState<string | null>(null)

  // ── Load staff ────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    createClient().from('staff').select('*').eq('shop_id', shopId).eq('is_active', true)
      .then(({ data }) => setStaff((data ?? []) as Staff[]))
  }, [open, shopId])

  // ── Load services ─────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2) return
    createClient().from('services').select('*').eq('shop_id', shopId).eq('is_active', true)
      .then(({ data }) => setServices((data ?? []) as Service[]))
  }, [step, shopId])

  // ── Load available slots ──────────────────────────────────────────
  useEffect(() => {
    if (step !== 3 || !selectedStaffId || !selectedDate || !selectedServiceId) return
    const service    = services.find((s) => s.id === selectedServiceId)
    const staffMember = staff.find((s) => s.id === selectedStaffId)
    if (!service || !staffMember) return

    const dow   = format(parseISO(selectedDate), 'EEEE').toLowerCase() as keyof typeof staffMember.working_hours
    const hours = staffMember.working_hours?.[dow]
    setAvailableSlots([])
    if (!hours || hours.closed) return

    setLoadingSlots(true)
    createClient()
      .from('bookings')
      .select('start_time, end_time')
      .eq('shop_id', shopId).eq('staff_id', selectedStaffId).eq('date', selectedDate).neq('status', 'cancelled')
      .then(({ data }) => {
        setAvailableSlots(generateSlots(hours.open, hours.close, service.duration_minutes,
          (data ?? []) as { start_time: string; end_time: string }[]))
        setLoadingSlots(false)
      })
  }, [step, selectedStaffId, selectedDate, selectedServiceId, services, staff, shopId])

  // ── Client search ─────────────────────────────────────────────────
  const searchClients = useCallback(async (q: string) => {
    if (q.length < 2) { setClientResults([]); return }
    setSearchingClient(true)
    const { data } = await createClient().from('clients').select('id,name,email,phone').eq('shop_id', shopId)
      .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`).limit(6)
    setClientResults((data ?? []) as Client[])
    setSearchingClient(false)
  }, [shopId])

  useEffect(() => {
    const t = setTimeout(() => searchClients(clientSearch), 300)
    return () => clearTimeout(t)
  }, [clientSearch, searchClients])

  // ── Helpers ───────────────────────────────────────────────────────
  const selectedService = services.find((s) => s.id === selectedServiceId)
  const selectedStaff   = staff.find((s) => s.id === selectedStaffId)
  const depositAmount   = depositEnabled && selectedService ? selectedService.price * 0.3 : 0

  const canAdvance: Record<Step, boolean> = {
    1: !!(selectedDate && selectedStaffId),
    2: !!selectedServiceId,
    3: !!selectedTime,
    4: clientName.trim().length >= 2,
    5: true,
  }

  function reset() {
    setStep(1); setSelectedStaffId(''); setSelectedServiceId(''); setSelectedTime('')
    setClientName(''); setClientEmail(''); setClientPhone(''); setClientId(null)
    setClientSearch(''); setClientResults([]); setNotes(''); setDepositEnabled(false); setSubmitError(null)
  }

  async function handleSubmit() {
    if (!selectedService) return
    setSubmitting(true); setSubmitError(null)
    const endTime = minutesToTime(timeToMinutes(selectedTime) + selectedService.duration_minutes)
    const payload: CreateBookingPayload = {
      shop_id: shopId, staff_id: selectedStaffId, service_id: selectedServiceId,
      client_name: clientName, client_email: clientEmail || null,
      client_phone: clientPhone || null, client_id: clientId,
      date: selectedDate, start_time: selectedTime, end_time: endTime,
      price: selectedService.price, deposit_amount: depositAmount,
      payment_method: 'cash', notes: notes || null, source: 'dashboard',
    }
    const result = await createBooking(payload)
    setSubmitting(false)
    if (result.error) { setSubmitError(result.error); return }
    if (result.data) onSuccess?.(result.data)
    onOpenChange(false); reset()
  }

  // ── Step titles ───────────────────────────────────────────────────
  const STEP_TITLES: Record<Step, string> = {
    1: 'Date & Barber', 2: 'Choose Service', 3: 'Pick a Time',
    4: 'Client Details', 5: 'Review & Confirm',
  }

  // Lazy — only the active step's JSX is evaluated each render
  function renderStepContent(): React.ReactNode {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="booking-date" className="block text-xs font-medium text-zinc-400">Date</label>
              <input id="booking-date" type="date" value={selectedDate}
                min={format(startOfDay(new Date()), 'yyyy-MM-dd')}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime('') }}
                className={INPUT} />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400">Barber</label>
              {staff.length === 0
                ? <p className="text-xs text-zinc-500 py-2">No active staff found.</p>
                : staff.map((s) => <StaffCard key={s.id} staff={s} selected={selectedStaffId === s.id} onClick={() => setSelectedStaffId(s.id)} />)
              }
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 mb-3">Select a service</label>
            {services.length === 0
              ? <p className="text-xs text-zinc-500 py-2">No active services found.</p>
              : services.map((s) => <ServiceCard key={s.id} service={s} selected={selectedServiceId === s.id} currency={shopCurrency} onClick={() => setSelectedServiceId(s.id)} />)
            }
          </div>
        )
      case 3: {
        const parsedD = parseISO(selectedDate)
        const dateStr = isValid(parsedD) ? format(parsedD, 'd MMMM yyyy') : selectedDate
        return (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500">
              {selectedStaff?.name} · {dateStr}
              {selectedService && ` · ${selectedService.duration_minutes} min`}
            </p>
            {loadingSlots && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              </div>
            )}
            {!loadingSlots && availableSlots.length === 0 && (
              <div className="py-10 text-center text-zinc-500 space-y-2">
                <Clock className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-sm">No available slots on this date.</p>
                <p className="text-xs">Try a different date or barber.</p>
              </div>
            )}
            {!loadingSlots && availableSlots.length > 0 && (
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {availableSlots.map((slot) => (
                  <button key={slot} type="button" onClick={() => setSelectedTime(slot)}
                    className={cn(
                      'py-2.5 rounded-xl text-sm font-medium transition-all border',
                      selectedTime === slot
                        ? 'bg-[#c9a84c] text-[#0a0a0a] border-[#c9a84c] font-bold'
                        : 'bg-[#1a1a1a] border-[#2a2a2a] text-zinc-300 hover:border-zinc-500'
                    )}>
                    {format12h(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      }
      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-400">Search existing client</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Name, email or phone…" className={cn(INPUT, 'pl-10')} />
                {searchingClient && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />}
              </div>
              {clientResults.length > 0 && (
                <div className="border border-[#2a2a2a] rounded-xl overflow-hidden mt-1">
                  {clientResults.map((c) => (
                    <button key={c.id} type="button" onClick={() => {
                      setClientId(c.id); setClientName(c.name)
                      setClientEmail(c.email ?? ''); setClientPhone(c.phone ?? '')
                      setClientSearch(''); setClientResults([])
                    }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] border-b border-[#2a2a2a] last:border-b-0 text-left">
                      <div className="w-7 h-7 rounded-full bg-[#c9a84c]/20 flex items-center justify-center text-[10px] font-bold text-[#c9a84c] flex-shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{c.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{c.email ?? c.phone ?? '—'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#2a2a2a]" />
              <span className="text-[11px] text-zinc-600 flex items-center gap-1"><UserPlus className="w-3 h-3" />or add new</span>
              <div className="flex-1 h-px bg-[#2a2a2a]" />
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400">Full Name *</label>
                <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Marcus Williams" className={INPUT} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400">Email (optional)</label>
                <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="marcus@example.com" className={INPUT} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400">Phone (optional)</label>
                <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+44 7700 000000" className={INPUT} />
              </div>
            </div>
          </div>
        )
      case 5: {
        const price   = new Intl.NumberFormat('en-GB', { style: 'currency', currency: shopCurrency }).format(selectedService?.price ?? 0)
        const dep     = new Intl.NumberFormat('en-GB', { style: 'currency', currency: shopCurrency }).format(depositAmount)
        const endTime = selectedTime ? minutesToTime(timeToMinutes(selectedTime) + (selectedService?.duration_minutes ?? 0)) : ''
        const parsedD = parseISO(selectedDate)
        const dateLabel = isValid(parsedD) ? format(parsedD, 'EEEE, d MMMM yyyy') : selectedDate
        return (
          <div className="space-y-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 space-y-2.5">
              <SummaryRow icon={<Calendar className="w-3.5 h-3.5" />} label={dateLabel} />
              <SummaryRow icon={<Clock className="w-3.5 h-3.5" />}    label={`${format12h(selectedTime)}${endTime ? ` – ${format12h(endTime)}` : ''}`} />
              <SummaryRow icon={<Scissors className="w-3.5 h-3.5" />} label={selectedService?.name ?? '—'} sub={`${selectedService?.duration_minutes ?? 0} min`} />
              <SummaryRow icon={<User className="w-3.5 h-3.5" />}     label={selectedStaff?.name ?? '—'} />
              <SummaryRow icon={<User className="w-3.5 h-3.5 opacity-0" />} label={clientName} sub={clientEmail || clientPhone || undefined} />
              <div className="pt-1.5 border-t border-[#2a2a2a] flex items-center justify-between">
                <span className="text-xs text-zinc-500">Total</span>
                <span className="text-sm font-bold text-[#c9a84c]">{price}</span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
              <div>
                <p className="text-sm font-medium text-white">Require 30% deposit</p>
                <p className="text-xs text-zinc-500 mt-0.5">Charge {dep} upfront to reduce no-shows</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={depositEnabled}
                aria-label="Require deposit"
                onClick={() => setDepositEnabled((v) => !v)}
                className={cn('w-10 h-6 rounded-full border relative flex-shrink-0 mt-0.5 transition-colors',
                  depositEnabled ? 'bg-[#c9a84c] border-[#c9a84c]' : 'bg-zinc-700 border-zinc-600')}
              >
                <span className={cn('absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform',
                  depositEnabled ? 'translate-x-4' : 'translate-x-0')} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-400">Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special requests…" rows={2} className={cn(INPUT, 'resize-none')} />
            </div>

            {submitError && (
              <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {submitError}
              </div>
            )}
          </div>
        )
      }
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[90dvh] flex flex-col bg-[#111111] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] flex-shrink-0">
            <div>
              <Dialog.Title className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">
                {STEP_TITLES[step]}
              </Dialog.Title>
              <p className="text-xs text-zinc-500 mt-0.5">Step {step} of 5</p>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <StepIndicator current={step} />
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] flex-shrink-0 bg-[#0d0d0d]">
            <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1) as Step)} disabled={step === 1}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />Back
            </button>

            {step < 5 ? (
              <button type="button" onClick={() => setStep((s) => Math.min(5, s + 1) as Step)} disabled={!canAdvance[step]}
                className="flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold text-sm rounded-xl px-5 py-2.5 transition-colors">
                Next<ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0a] font-bold text-sm rounded-xl px-5 py-2.5 transition-colors">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : <><CreditCard className="w-4 h-4" />Confirm Booking</>}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
