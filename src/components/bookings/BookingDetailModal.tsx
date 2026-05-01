'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { format, parseISO, isValid } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  X, Edit, CheckCircle, XCircle, Clock, User, Mail, Phone,
  Calendar, Scissors, CreditCard, FileText, Loader2, ChevronLeft,
  AlertTriangle,
} from 'lucide-react'
import type { BookingWithRelations, BookingStatus, PaymentMethod } from '@/types/database'

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

const INPUT = 'w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20'

export interface BookingDetailModalProps {
  booking:      BookingWithRelations | null
  open:         boolean
  currency:     string
  onOpenChange: (open: boolean) => void
  onSuccess:    () => void
}

function format12h(t: string | null | undefined) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return t
  const d = new Date(); d.setHours(h, m)
  return format(d, 'h:mm a')
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  const parsed = parseISO(d)
  return isValid(parsed) ? format(parsed, 'EEEE, d MMMM yyyy') : '—'
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
        <div className="text-sm text-white mt-0.5">{value}</div>
      </div>
    </div>
  )
}

export function BookingDetailModal({ booking, open, currency, onOpenChange, onSuccess }: BookingDetailModalProps) {
  const [mode,    setMode]    = useState<'view' | 'edit'>('view')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [local,   setLocal]   = useState<BookingWithRelations | null>(null)

  // Edit form fields
  const [clientName,    setClientName]    = useState('')
  const [clientEmail,   setClientEmail]   = useState('')
  const [clientPhone,   setClientPhone]   = useState('')
  const [notes,         setNotes]         = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [isPaid,        setIsPaid]        = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')

  // Sync local copy when booking changes
  useEffect(() => {
    if (booking) setLocal(booking)
  }, [booking])

  // Reset to view mode when closed
  function handleOpenChange(val: boolean) {
    if (!val) { setMode('view'); setError(null) }
    onOpenChange(val)
  }

  function openEdit() {
    if (!local) return
    setClientName(local.client_name)
    setClientEmail(local.client_email ?? '')
    setClientPhone(local.client_phone ?? '')
    setNotes(local.notes ?? '')
    setInternalNotes(local.internal_notes ?? '')
    setIsPaid(local.is_paid)
    setPaymentMethod(local.payment_method)
    setError(null)
    setMode('edit')
  }

  async function handleStatusAction(status: BookingStatus) {
    if (!local) return
    setSaving(true); setError(null)
    const res = await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: local.id, status }),
    })
    const json = await res.json() as { error?: string }
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Failed to update'); return }
    setLocal((prev) => prev ? { ...prev, status } : prev)
    onSuccess()
  }

  async function handleSaveEdit() {
    if (!local) return
    setSaving(true); setError(null)
    const res = await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:             local.id,
        client_name:    clientName.trim() || local.client_name,
        client_email:   clientEmail.trim() || null,
        client_phone:   clientPhone.trim() || null,
        notes:          notes.trim() || null,
        internal_notes: internalNotes.trim() || null,
        is_paid:        isPaid,
        payment_method: paymentMethod,
      }),
    })
    const json = await res.json() as { error?: string }
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Failed to save'); return }
    setLocal((prev) => prev ? {
      ...prev,
      client_name:    clientName.trim() || prev.client_name,
      client_email:   clientEmail.trim() || null,
      client_phone:   clientPhone.trim() || null,
      notes:          notes.trim() || null,
      internal_notes: internalNotes.trim() || null,
      is_paid:        isPaid,
      payment_method: paymentMethod,
    } : prev)
    setMode('view')
    onSuccess()
  }

  if (!local) return null

  const service = local.service as { name: string; duration_minutes: number; price: number; colour: string } | null
  const staff   = local.staff   as { name: string; colour: string } | null
  const isDone  = local.status === 'completed' || local.status === 'cancelled' || local.status === 'no_show'

  const fmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency })
  const price   = fmt.format(local.price)
  const deposit = fmt.format(local.deposit_amount ?? 0)

  const paymentLabel: Record<PaymentMethod, string> = {
    cash:          'Cash',
    card:          'Card',
    bank_transfer: 'Bank transfer',
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
          'w-full max-w-lg max-h-[90vh] flex flex-col',
          'bg-[#111111] border border-white/[0.08] rounded-2xl shadow-2xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          'duration-200',
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-3">
              {mode === 'edit' && (
                <button type="button" onClick={() => { setMode('view'); setError(null) }}
                  className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors flex items-center justify-center">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <Dialog.Title className="font-[family-name:var(--font-heading)] text-xl tracking-widest text-white leading-none">
                {mode === 'edit' ? 'EDIT BOOKING' : 'BOOKING DETAILS'}
              </Dialog.Title>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-full border', STATUS_STYLES[local.status])}>
                {STATUS_LABELS[local.status]}
              </span>
              <Dialog.Close asChild>
                <button type="button" aria-label="Close"
                  className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
              </div>
            )}

            {mode === 'view' ? (
              <>
                {/* Appointment */}
                <div className="bg-[#0d0d0d] border border-white/[0.05] rounded-xl p-4 space-y-3.5">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Appointment</p>
                  <DetailRow
                    icon={<Calendar className="w-3.5 h-3.5 text-zinc-500" />}
                    label="Date"
                    value={formatDate(local.date)}
                  />
                  <DetailRow
                    icon={<Clock className="w-3.5 h-3.5 text-zinc-500" />}
                    label="Time"
                    value={`${format12h(local.start_time)} – ${format12h(local.end_time)}${service ? ` (${service.duration_minutes} min)` : ''}`}
                  />
                  <DetailRow
                    icon={<Scissors className="w-3.5 h-3.5 text-zinc-500" />}
                    label="Service"
                    value={service?.name ?? '—'}
                  />
                  <DetailRow
                    icon={<User className="w-3.5 h-3.5 text-zinc-500" />}
                    label="Barber"
                    value={
                      <span className="flex items-center gap-2">
                        {staff?.colour && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: staff.colour }} />}
                        {staff?.name ?? '—'}
                      </span>
                    }
                  />
                </div>

                {/* Client */}
                <div className="bg-[#0d0d0d] border border-white/[0.05] rounded-xl p-4 space-y-3.5">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Client</p>
                  <DetailRow
                    icon={<User className="w-3.5 h-3.5 text-zinc-500" />}
                    label="Name"
                    value={local.client_name}
                  />
                  {local.client_email && (
                    <DetailRow
                      icon={<Mail className="w-3.5 h-3.5 text-zinc-500" />}
                      label="Email"
                      value={<a href={`mailto:${local.client_email}`} className="text-[#c9a84c] hover:underline">{local.client_email}</a>}
                    />
                  )}
                  {local.client_phone && (
                    <DetailRow
                      icon={<Phone className="w-3.5 h-3.5 text-zinc-500" />}
                      label="Phone"
                      value={<a href={`tel:${local.client_phone}`} className="text-[#c9a84c] hover:underline">{local.client_phone}</a>}
                    />
                  )}
                </div>

                {/* Payment */}
                <div className="bg-[#0d0d0d] border border-white/[0.05] rounded-xl p-4 space-y-3.5">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Payment</p>
                  <DetailRow
                    icon={<CreditCard className="w-3.5 h-3.5 text-zinc-500" />}
                    label="Total"
                    value={<span className="text-[#c9a84c] font-bold text-base">{price}</span>}
                  />
                  {(local.deposit_amount ?? 0) > 0 && (
                    <DetailRow
                      icon={<CreditCard className="w-3.5 h-3.5 text-zinc-500" />}
                      label="Deposit"
                      value={deposit}
                    />
                  )}
                  <DetailRow
                    icon={<CreditCard className="w-3.5 h-3.5 text-zinc-500" />}
                    label="Method"
                    value={paymentLabel[local.payment_method]}
                  />
                  <DetailRow
                    icon={<CheckCircle className="w-3.5 h-3.5 text-zinc-500" />}
                    label="Paid"
                    value={
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', local.is_paid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700/40 text-zinc-400')}>
                        {local.is_paid ? 'Paid' : 'Unpaid'}
                      </span>
                    }
                  />
                </div>

                {/* Notes */}
                {(local.notes || local.internal_notes) && (
                  <div className="bg-[#0d0d0d] border border-white/[0.05] rounded-xl p-4 space-y-3.5">
                    {local.notes && (
                      <DetailRow
                        icon={<FileText className="w-3.5 h-3.5 text-zinc-500" />}
                        label="Client notes"
                        value={<span className="text-zinc-300 whitespace-pre-wrap text-xs leading-relaxed">{local.notes}</span>}
                      />
                    )}
                    {local.internal_notes && (
                      <DetailRow
                        icon={<FileText className="w-3.5 h-3.5 text-[#c9a84c]/60" />}
                        label="Internal notes"
                        value={<span className="text-zinc-300 whitespace-pre-wrap text-xs leading-relaxed">{local.internal_notes}</span>}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Edit form */
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Client details</p>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5"><User className="w-3 h-3" />Name</label>
                    <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className={INPUT} placeholder="Client name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5"><Mail className="w-3 h-3" />Email</label>
                    <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={INPUT} placeholder="client@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5"><Phone className="w-3 h-3" />Phone</label>
                    <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className={INPUT} placeholder="+44 7700 900000" />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Notes</p>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5"><FileText className="w-3 h-3" />Client notes</label>
                    <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(INPUT, 'resize-none')} placeholder="Special requests, preferences…" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5"><FileText className="w-3 h-3 text-[#c9a84c]/60" />Internal notes</label>
                    <textarea rows={2} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} className={cn(INPUT, 'resize-none')} placeholder="Staff-only notes…" />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Payment</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Method</label>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className={INPUT}>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank transfer</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Paid?</label>
                      <button type="button" onClick={() => setIsPaid((v) => !v)}
                        className={cn(
                          'w-full px-4 py-3 rounded-xl text-sm font-medium border transition-colors text-left',
                          isPaid
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-[#1a1a1a] border-[#2a2a2a] text-zinc-500 hover:text-white'
                        )}>
                        {isPaid ? '✓ Paid' : 'Unpaid'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.06] flex-shrink-0 bg-[#0d0d0d]">
            {mode === 'view' ? (
              <div className="flex flex-wrap gap-2">
                {!isDone && (
                  <button type="button" onClick={openEdit}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-zinc-300 bg-white/[0.06] hover:bg-white/[0.10] rounded-xl transition-colors">
                    <Edit className="w-3.5 h-3.5" />Edit
                  </button>
                )}
                {local.status === 'pending' && (
                  <button type="button" onClick={() => handleStatusAction('confirmed')} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-colors disabled:opacity-50">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                    Approve
                  </button>
                )}
                {local.status === 'confirmed' && (
                  <button type="button" onClick={() => handleStatusAction('completed')} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-colors disabled:opacity-50">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Complete
                  </button>
                )}
                {!isDone && (
                  <button type="button" onClick={() => handleStatusAction('cancelled')} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors disabled:opacity-50 ml-auto">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <button type="button" onClick={handleSaveEdit} disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-4 py-3 text-sm transition-colors">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save Changes'}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
