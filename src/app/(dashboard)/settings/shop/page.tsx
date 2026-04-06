'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle, CheckCircle2, Store, Clock, ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Shop, DayHours } from '@/types/database'

// ── Schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  name:        z.string().min(1, 'Name is required').max(100),
  slug:        z.string().min(1, 'Slug is required').max(80).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  phone:       z.string().max(30).optional().or(z.literal('')),
  email:       z.string().email('Invalid email').optional().or(z.literal('')),
  address:     z.string().max(150).optional().or(z.literal('')),
  city:        z.string().max(60).optional().or(z.literal('')),
  postcode:    z.string().max(20).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  website:     z.string().max(150).optional().or(z.literal('')),
  instagram:   z.string().max(100).optional().or(z.literal('')),
  facebook:    z.string().max(100).optional().or(z.literal('')),
  currency:    z.string().length(3, 'Must be a 3-letter currency code'),
  timezone:    z.string().min(1),
})
type FormValues = z.infer<typeof schema>

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
type DayKey = typeof DAYS[number]

const TIME_OPTIONS = Array.from({ length: 33 }, (_, i) => {
  const total = 6 * 60 + i * 30
  const hh = String(Math.floor(total / 60)).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
})

const DEFAULT_HOURS: DayHours = { open: '09:00', close: '18:00', closed: false }
const SUNDAY_CLOSED: DayHours = { open: '09:00', close: '18:00', closed: true }

const INPUT = 'w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20'

const CURRENCIES = [
  { code: 'GBP', label: '£ GBP — British Pound' },
  { code: 'USD', label: '$ USD — US Dollar' },
  { code: 'EUR', label: '€ EUR — Euro' },
  { code: 'NGN', label: '₦ NGN — Nigerian Naira' },
  { code: 'GHS', label: '₵ GHS — Ghanaian Cedi' },
  { code: 'ZAR', label: 'R ZAR — South African Rand' },
  { code: 'CAD', label: '$ CAD — Canadian Dollar' },
  { code: 'AUD', label: '$ AUD — Australian Dollar' },
]

const TIMEZONES = [
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Africa/Lagos',
  'Africa/Accra', 'Africa/Nairobi', 'America/New_York', 'America/Chicago',
  'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'Australia/Sydney',
]

export default function ShopSettingsPage() {
  const [shop, setShop]             = useState<Shop | null>(null)
  const [loading, setLoading]       = useState(true)
  const [saved, setSaved]           = useState(false)
  const [logoUrl, setLogoUrl]       = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError]   = useState<string | null>(null)
  const fileInputRef                = useRef<HTMLInputElement | undefined>(undefined)
  const [hours, setHours]           = useState<Record<DayKey, DayHours>>({
    monday:    { ...DEFAULT_HOURS },
    tuesday:   { ...DEFAULT_HOURS },
    wednesday: { ...DEFAULT_HOURS },
    thursday:  { ...DEFAULT_HOURS },
    friday:    { ...DEFAULT_HOURS },
    saturday:  { ...DEFAULT_HOURS },
    sunday:    { ...SUNDAY_CLOSED },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty }, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', phone: '', email: '', address: '', city: '', postcode: '', description: '', website: '', instagram: '', facebook: '', currency: 'GBP', timezone: 'Europe/London' },
  })

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/shops')
        const json = await res.json() as { data?: Shop }
        if (json.data) {
          setShop(json.data)
          setLogoUrl(json.data.logo_url ?? null)
          reset({
            name:        json.data.name,
            slug:        json.data.slug,
            phone:       json.data.phone        ?? '',
            email:       json.data.email        ?? '',
            address:     json.data.address      ?? '',
            city:        json.data.city         ?? '',
            postcode:    json.data.postcode     ?? '',
            description: json.data.description  ?? '',
            website:     json.data.website      ?? '',
            instagram:   json.data.instagram    ?? '',
            facebook:    json.data.facebook     ?? '',
            currency:    json.data.currency     || 'GBP',
            timezone:    json.data.timezone     || 'Europe/London',
          })
          // Merge saved opening hours into local state
          if (json.data.opening_hours) {
            setHours(prev => {
              const next = { ...prev }
              for (const day of DAYS) {
                const saved = (json.data!.opening_hours as Record<string, DayHours>)[day]
                if (saved) next[day] = saved
              }
              return next
            })
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [reset])

  async function handleLogoUpload(file: File) {
    setLogoUploading(true)
    setLogoError(null)
    try {
      if (file.size > 2 * 1024 * 1024) { setLogoError('Image must be under 2 MB'); return }
      const supabase = createClient()
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${shop?.id ?? 'tmp'}/logo.${ext}`
      const { error: upErr } = await supabase.storage.from('shop-logos').upload(path, file, { upsert: true })
      if (upErr) { setLogoError(upErr.message); return }
      const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(path)
      // Save logo_url to shop
      const res  = await fetch('/api/shops', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo_url: publicUrl }) })
      const json = await res.json() as { data?: Shop; error?: string }
      if (!res.ok) { setLogoError(json.error ?? 'Failed to save logo'); return }
      setLogoUrl(publicUrl)
      if (json.data) setShop(json.data)
    } finally {
      setLogoUploading(false)
    }
  }

  async function removeLogo() {
    const res  = await fetch('/api/shops', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo_url: null }) })
    const json = await res.json() as { data?: Shop; error?: string }
    if (res.ok) { setLogoUrl(null); if (json.data) setShop(json.data) }
  }

  async function onSubmit(values: FormValues) {
    setSaved(false)
    const res  = await fetch('/api/shops', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, opening_hours: hours }),
    })
    const json = await res.json() as { data?: Shop; error?: string }
    if (!res.ok) { setError('root', { message: json.error ?? 'Something went wrong' }); return }
    if (json.data) setShop(json.data)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function updateHours(day: DayKey, field: keyof DayHours, value: string | boolean) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
    </div>
  )

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white leading-none">SHOP SETTINGS</h1>
        <p className="text-zinc-500 text-sm mt-1">Update your shop details and opening hours</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
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

        {/* Logo upload */}
        <section className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <ImagePlus className="w-4 h-4 text-[#c9a84c]" />Shop logo
          </h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl
                ? <img src={logoUrl} alt="Shop logo" className="w-full h-full object-cover" />
                : <Store className="w-8 h-8 text-zinc-700" />
              }
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={logoUploading}
                  className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] disabled:opacity-50 text-zinc-300 hover:text-white text-xs font-medium rounded-xl px-3 py-2 transition-colors">
                  {logoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                  {logoUrl ? 'Change logo' : 'Upload logo'}
                </button>
                {logoUrl && (
                  <button type="button" onClick={removeLogo}
                    className="flex items-center gap-1.5 bg-red-500/[0.08] hover:bg-red-500/[0.15] text-red-400 text-xs font-medium rounded-xl px-3 py-2 transition-colors">
                    <X className="w-3.5 h-3.5" />Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-600">PNG, JPG or WebP · Max 2 MB · Recommended: 200×200 px</p>
              {logoError && <p className="text-xs text-red-400">{logoError}</p>}
            </div>
            <input ref={el => { fileInputRef.current = el ?? undefined }} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
              title="Upload shop logo" aria-label="Upload shop logo"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }} />
          </div>
        </section>

        {/* Basic info */}
        <section className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Store className="w-4 h-4 text-[#c9a84c]" />Basic information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="s-name" className="text-xs font-medium text-zinc-400">
                Shop name <span className="text-red-400">*</span>
              </label>
              <input id="s-name" type="text" placeholder="Fresh Cuts Barbershop"
                className={cn(INPUT, errors.name && 'border-red-500/50')} {...register('name')} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="s-slug" className="text-xs font-medium text-zinc-400">
                URL slug <span className="text-red-400">*</span>
              </label>
              <input id="s-slug" type="text" placeholder="fresh-cuts"
                className={cn(INPUT, errors.slug && 'border-red-500/50')} {...register('slug')} />
              {errors.slug
                ? <p className="text-xs text-red-400">{errors.slug.message}</p>
                : <p className="text-[10px] text-zinc-600">Your booking page: /booking/{shop?.slug ?? 'your-slug'}</p>
              }
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="s-desc" className="text-xs font-medium text-zinc-400">Description</label>
            <textarea id="s-desc" rows={3} placeholder="Premium cuts in a relaxed atmosphere…"
              className={cn(INPUT, 'resize-none')} {...register('description')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="s-phone" className="text-xs font-medium text-zinc-400">Phone</label>
              <input id="s-phone" type="tel" placeholder="+44 7700 900000"
                className={INPUT} {...register('phone')} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="s-email" className="text-xs font-medium text-zinc-400">Email</label>
              <input id="s-email" type="email" placeholder="hello@freshcuts.com"
                className={cn(INPUT, errors.email && 'border-red-500/50')} {...register('email')} />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-zinc-300">Address</h2>
          <div className="space-y-1.5">
            <label htmlFor="s-addr" className="text-xs font-medium text-zinc-400">Street address</label>
            <input id="s-addr" type="text" placeholder="123 High Street"
              className={INPUT} {...register('address')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="s-city" className="text-xs font-medium text-zinc-400">City</label>
              <input id="s-city" type="text" placeholder="London"
                className={INPUT} {...register('city')} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="s-post" className="text-xs font-medium text-zinc-400">Postcode</label>
              <input id="s-post" type="text" placeholder="EC1A 1BB"
                className={INPUT} {...register('postcode')} />
            </div>
          </div>
        </section>

        {/* Social & web */}
        <section className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-zinc-300">Social & web</h2>
          <div className="space-y-1.5">
            <label htmlFor="s-web" className="text-xs font-medium text-zinc-400">Website</label>
            <input id="s-web" type="text" placeholder="https://freshcuts.com"
              className={INPUT} {...register('website')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="s-ig" className="text-xs font-medium text-zinc-400">Instagram handle</label>
              <input id="s-ig" type="text" placeholder="@freshcuts"
                className={INPUT} {...register('instagram')} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="s-fb" className="text-xs font-medium text-zinc-400">Facebook page</label>
              <input id="s-fb" type="text" placeholder="FreshCutsBarbershop"
                className={INPUT} {...register('facebook')} />
            </div>
          </div>
        </section>

        {/* Regional */}
        <section className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-zinc-300">Regional settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="s-cur" className="text-xs font-medium text-zinc-400">Currency</label>
              <div className="relative">
                <select id="s-cur" aria-label="Currency" title="Currency"
                  className={cn(INPUT, 'appearance-none cursor-pointer')} {...register('currency')}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
              {errors.currency && <p className="text-xs text-red-400">{errors.currency.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="s-tz" className="text-xs font-medium text-zinc-400">Timezone</label>
              <div className="relative">
                <select id="s-tz" aria-label="Timezone" title="Timezone"
                  className={cn(INPUT, 'appearance-none cursor-pointer')} {...register('timezone')}>
                  {TIMEZONES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Opening hours */}
        <section className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Clock className="w-4 h-4 text-[#c9a84c]" />Opening hours
          </h2>
          <div className="space-y-2">
            {DAYS.map(day => {
              const h = hours[day]
              return (
                <div key={day} className="flex items-center gap-3">
                  {/* Day label + closed toggle */}
                  <div className="w-24 flex items-center gap-2">
                    <button type="button"
                      title={h.closed ? `Mark ${day} as open` : `Mark ${day} as closed`}
                      aria-label={h.closed ? `Mark ${day} as open` : `Mark ${day} as closed`}
                      onClick={() => updateHours(day, 'closed', !h.closed)}
                      className={cn(
                        'w-8 h-4 rounded-full transition-colors relative flex-shrink-0',
                        h.closed ? 'bg-zinc-700' : 'bg-[#c9a84c]'
                      )}>
                      <span className={cn(
                        'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform shadow-sm',
                        h.closed ? 'translate-x-0.5' : 'translate-x-4'
                      )} />
                    </button>
                    <span className="text-xs text-zinc-400 capitalize">{day.slice(0, 3)}</span>
                  </div>

                  {h.closed ? (
                    <span className="text-xs text-zinc-600 italic">Closed</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select aria-label={`${day} open time`} title={`${day} open time`}
                        value={h.open}
                        onChange={e => updateHours(day, 'open', e.target.value)}
                        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#c9a84c]/60 cursor-pointer">
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="text-zinc-600 text-xs">–</span>
                      <select aria-label={`${day} close time`} title={`${day} close time`}
                        value={h.close}
                        onChange={e => updateHours(day, 'close', e.target.value)}
                        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#c9a84c]/60 cursor-pointer">
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Submit */}
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
