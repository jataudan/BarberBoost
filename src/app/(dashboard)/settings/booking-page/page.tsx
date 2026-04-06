'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle, CheckCircle2, Globe, Clock, ShieldX, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Shop } from '@/types/database'

const INPUT = 'w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20'

const schema = z.object({
  slug:                 z.string().min(1, 'Slug is required').max(80).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  booking_notice_hours: z.coerce.number().int().min(0).max(168),
  cancellation_hours:   z.coerce.number().int().min(0).max(168),
  no_show_fee:          z.coerce.number().min(0).max(999),
})
type FormValues = z.infer<typeof schema>

export default function BookingPageSettingsPage() {
  const [shop, setShop]       = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved]     = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty }, setError } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { slug: '', booking_notice_hours: 1, cancellation_hours: 24, no_show_fee: 0 },
  })

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/shops')
        const json = await res.json() as { data?: Shop }
        if (json.data) {
          setShop(json.data)
          reset({
            slug:                 json.data.slug,
            booking_notice_hours: json.data.booking_notice_hours ?? 1,
            cancellation_hours:   json.data.cancellation_hours   ?? 24,
            no_show_fee:          json.data.no_show_fee           ?? 0,
          })
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [reset])

  async function onSubmit(values: FormValues) {
    setSaved(false)
    const res  = await fetch('/api/shops', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const json = await res.json() as { data?: Shop; error?: string }
    if (!res.ok) { setError('root', { message: json.error ?? 'Something went wrong' }); return }
    if (json.data) setShop(json.data)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
    </div>
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const publicUrl = `${appUrl}/booking/${shop?.slug ?? ''}`

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white leading-none">BOOKING PAGE</h1>
        <p className="text-zinc-500 text-sm mt-1">Customise your public booking experience</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {errors.root && (
          <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{errors.root.message}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2.5 bg-emerald-400/[0.08] border border-emerald-400/20 rounded-xl px-4 py-3 text-sm text-emerald-400">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />Changes saved successfully.
          </div>
        )}

        {/* Public URL */}
        <section className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Globe className="w-4 h-4 text-[#c9a84c]" />Public booking URL
          </h2>
          <div className="space-y-1.5">
            <label htmlFor="bp-slug" className="text-xs font-medium text-zinc-400">
              URL slug <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-[#2a2a2a] focus-within:border-[#c9a84c]/60 focus-within:ring-1 focus-within:ring-[#c9a84c]/20 transition-all">
              <span className="bg-[#1a1a1a] px-3 py-2.5 text-sm text-zinc-600 border-r border-[#2a2a2a] whitespace-nowrap">
                /booking/
              </span>
              <input id="bp-slug" type="text" placeholder="your-shop-name"
                className={cn('flex-1 bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none', errors.slug && 'border-red-500/50')}
                {...register('slug')} />
            </div>
            {errors.slug
              ? <p className="text-xs text-red-400">{errors.slug.message}</p>
              : shop?.slug && (
                <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#c9a84c] hover:text-[#e2bf6a] transition-colors mt-1">
                  <ExternalLink className="w-3 h-3" />{publicUrl}
                </a>
              )
            }
          </div>
        </section>

        {/* Booking policy */}
        <section className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Clock className="w-4 h-4 text-[#c9a84c]" />Booking policy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="bp-notice" className="text-xs font-medium text-zinc-400">Minimum notice (hours)</label>
              <input id="bp-notice" type="number" min="0" max="168" placeholder="1"
                className={INPUT} {...register('booking_notice_hours')} />
              <p className="text-[11px] text-zinc-600">How far in advance clients must book (0 = same-day ok)</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="bp-cancel" className="text-xs font-medium text-zinc-400">Cancellation window (hours)</label>
              <input id="bp-cancel" type="number" min="0" max="168" placeholder="24"
                className={INPUT} {...register('cancellation_hours')} />
              <p className="text-[11px] text-zinc-600">Clients must cancel at least this many hours before</p>
            </div>
          </div>
        </section>

        {/* No-show protection */}
        <section className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <ShieldX className="w-4 h-4 text-[#c9a84c]" />No-show protection
          </h2>
          <div className="space-y-1.5 max-w-xs">
            <label htmlFor="bp-noshowfee" className="text-xs font-medium text-zinc-400">No-show fee (£)</label>
            <input id="bp-noshowfee" type="number" min="0" step="0.01" placeholder="0.00"
              className={INPUT} {...register('no_show_fee')} />
            <p className="text-[11px] text-zinc-600">Fee charged when a client misses an appointment. Set to 0 to disable.</p>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <button type="submit" disabled={isSubmitting || (!isDirty && !saved)}
            className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-6 py-3 text-sm transition-colors">
            {isSubmitting
              ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
              : saved
              ? <><CheckCircle2 className="w-4 h-4" />Saved</>
              : 'Save Changes'
            }
          </button>
        </div>
      </form>
    </div>
  )
}
