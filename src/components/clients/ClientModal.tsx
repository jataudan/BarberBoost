'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient as supabaseClient } from '@/lib/supabase/client'
import { useClients, type CreateClientPayload } from '@/hooks/useClients'
import type { Client, Staff } from '@/types/database'

// ── Constants ─────────────────────────────────────────────────────────────
const ALL_TAGS = ['New', 'Regular', 'VIP', 'At-risk'] as const
type BuiltInTag = typeof ALL_TAGS[number]

const TAG_STYLES: Record<BuiltInTag, string> = {
  New:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  Regular:  'bg-blue-500/10 text-blue-400 border-blue-500/25',
  VIP:      'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/25',
  'At-risk':'bg-red-500/10 text-red-400 border-red-500/25',
}

const INPUT = 'w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20'

// ── Props ─────────────────────────────────────────────────────────────────
export interface ClientModalProps {
  shopId:      string
  open:        boolean
  onOpenChange: (open: boolean) => void
  editClient?: Client | null
  onSuccess?:  (client: Client) => void
}

// ── Component ─────────────────────────────────────────────────────────────
export function ClientModal({ shopId, open, onOpenChange, editClient, onSuccess }: ClientModalProps) {
  const { createClient, updateClient } = useClients()

  const [name,            setName]            = useState('')
  const [email,           setEmail]           = useState('')
  const [phone,           setPhone]           = useState('')
  const [dob,             setDob]             = useState('')
  const [preferredBarber, setPreferredBarber] = useState('')
  const [selectedTags,    setSelectedTags]    = useState<string[]>(['New'])
  const [notes,           setNotes]           = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [staff,           setStaff]           = useState<Staff[]>([])
  const [submitting,      setSubmitting]      = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  const isEdit = !!editClient

  // Populate form when editing
  useEffect(() => {
    if (editClient) {
      setName(editClient.name)
      setEmail(editClient.email ?? '')
      setPhone(editClient.phone ?? '')
      setDob(editClient.date_of_birth ?? '')
      setPreferredBarber(editClient.preferred_barber_id ?? '')
      setSelectedTags((editClient.tags as string[] | null) ?? [])
      setNotes(editClient.notes ?? '')
      setMarketingConsent(editClient.marketing_consent ?? false)
    } else {
      reset()
    }
  }, [editClient, open])

  // Load staff for preferred barber dropdown
  useEffect(() => {
    if (!open) return
    supabaseClient().from('staff').select('id,name,role').eq('shop_id', shopId).eq('is_active', true)
      .then(({ data }) => setStaff((data ?? []) as Staff[]))
  }, [open, shopId])

  function reset() {
    setName(''); setEmail(''); setPhone(''); setDob(''); setPreferredBarber('')
    setSelectedTags(['New']); setNotes(''); setMarketingConsent(false); setError(null)
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSubmitting(true); setError(null)

    if (isEdit && editClient) {
      const result = await updateClient(editClient.id, {
        name: name.trim(), email: email || null, phone: phone || null,
        date_of_birth: dob || null, preferred_barber_id: preferredBarber || null,
        tags: selectedTags, notes: notes || null, marketing_consent: marketingConsent,
      })
      setSubmitting(false)
      if (result.error) { setError(result.error); return }
      if (result.data) onSuccess?.(result.data)
      onOpenChange(false)
    } else {
      const payload: CreateClientPayload = {
        shop_id: shopId, name: name.trim(),
        email: email || null, phone: phone || null,
        date_of_birth: dob || null, preferred_barber_id: preferredBarber || null,
        tags: selectedTags, notes: notes || null, marketing_consent: marketingConsent,
      }
      const result = await createClient(payload)
      setSubmitting(false)
      if (result.error) { setError(result.error); return }
      if (result.data) onSuccess?.(result.data)
      onOpenChange(false)
      reset()
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Drawer — bottom sheet on mobile, right panel on md+ */}
      <div
        className={cn(
          'fixed z-50 flex flex-col bg-[#111111] shadow-2xl transition-transform duration-300',
          // Mobile: bottom sheet
          'inset-x-0 bottom-0 rounded-t-2xl border-t border-white/[0.06] max-h-[92dvh]',
          // Mobile open/close: vertical slide
          !open && 'translate-y-full',
          // Desktop: right side panel (resets Y, uses X)
          'md:inset-x-auto md:right-0 md:top-0 md:h-full md:w-full md:max-w-md',
          'md:rounded-none md:border-t-0 md:border-l md:max-h-none',
          'md:translate-y-0',
          open ? 'md:translate-x-0' : 'md:translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Edit client' : 'Add client'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] flex-shrink-0">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">
              {isEdit ? 'EDIT CLIENT' : 'ADD CLIENT'}
            </h2>
            {isEdit && <p className="text-xs text-zinc-500 mt-0.5">{editClient?.name}</p>}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close drawer"
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="client-name" className="block text-xs font-medium text-zinc-400">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input id="client-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Marcus Williams" autoComplete="name" required className={INPUT} />
          </div>

          {/* Email + Phone row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="client-email" className="block text-xs font-medium text-zinc-400">Email</label>
              <input id="client-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="marcus@email.com" autoComplete="email" className={INPUT} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="client-phone" className="block text-xs font-medium text-zinc-400">Phone</label>
              <input id="client-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 7700 000000" autoComplete="tel" className={INPUT} />
            </div>
          </div>

          {/* Date of birth */}
          <div className="space-y-1.5">
            <label htmlFor="client-dob" className="block text-xs font-medium text-zinc-400">Date of Birth</label>
            <input id="client-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={INPUT} />
          </div>

          {/* Preferred barber */}
          <div className="space-y-1.5">
            <label htmlFor="client-barber" className="block text-xs font-medium text-zinc-400">Preferred Barber</label>
            <div className="relative">
              <select
                id="client-barber"
                value={preferredBarber}
                onChange={(e) => setPreferredBarber(e.target.value)}
                className={cn(INPUT, 'appearance-none pr-10')}
              >
                <option value="">No preference</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400">Tags</label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'text-xs font-semibold px-3 py-1.5 rounded-full border transition-all',
                    selectedTags.includes(tag)
                      ? TAG_STYLES[tag]
                      : 'bg-white/[0.04] text-zinc-500 border-white/[0.06] hover:border-zinc-500'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label htmlFor="client-notes" className="block text-xs font-medium text-zinc-400">Notes</label>
            <textarea
              id="client-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Prefers fade on sides, allergic to…"
              rows={3}
              className={cn(INPUT, 'resize-none')}
            />
          </div>

          {/* Marketing consent */}
          <div className="flex items-start justify-between gap-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <div>
              <p className="text-sm font-medium text-white">Marketing consent</p>
              <p className="text-xs text-zinc-500 mt-0.5">Client agrees to receive promotional messages</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={marketingConsent}
              aria-label="Toggle marketing consent"
              onClick={() => setMarketingConsent((v) => !v)}
              className={cn(
                'w-10 h-6 rounded-full border relative flex-shrink-0 mt-0.5 transition-colors',
                marketingConsent ? 'bg-[#c9a84c] border-[#c9a84c]' : 'bg-zinc-700 border-zinc-600'
              )}
            >
              <span className={cn(
                'absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform',
                marketingConsent ? 'translate-x-4' : 'translate-x-0'
              )} />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex-shrink-0 bg-[#0d0d0d]">
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-4 py-3 text-sm transition-colors"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? 'Saving…' : 'Adding…'}</>
            ) : (
              isEdit ? 'Save Changes' : 'Add Client'
            )}
          </button>
        </div>
      </div>
    </>
  )
}
