'use client'

import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  X, Loader2, AlertCircle, User, Mail, Phone, Percent,
  AlignLeft, Upload, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Staff } from '@/types/database'

// ── Schema ────────────────────────────────────────────────────────────────
const staffSchema = z.object({
  name:            z.string().min(1, 'Name is required').max(80),
  email:           z.string().email('Invalid email').optional().or(z.literal('')),
  phone:           z.string().max(30).optional().or(z.literal('')),
  role:            z.string().min(1, 'Role is required').max(50),
  colour:          z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid colour'),
  commission_rate: z.coerce.number().min(0).max(100),
  bio:             z.string().max(400).optional().or(z.literal('')),
  avatar_url:      z.string().url().optional().or(z.literal('')),
  working_hours:   z.record(z.string(), z.object({
    open:   z.string(),
    close:  z.string(),
    closed: z.boolean(),
  })),
})

type StaffFormValues = z.infer<typeof staffSchema>

// ── Constants ─────────────────────────────────────────────────────────────
const ROLES = ['Barber', 'Senior Barber', 'Master Barber', 'Apprentice', 'Manager', 'Owner']

const PRESET_COLOURS = [
  '#c9a84c', '#6366f1', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#06b6d4', '#f97316',
  '#ec4899', '#84cc16', '#64748b', '#e2e8f0',
]

const DAYS = [
  { key: 'monday',    label: 'Mon' },
  { key: 'tuesday',   label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday',  label: 'Thu' },
  { key: 'friday',    label: 'Fri' },
  { key: 'saturday',  label: 'Sat' },
  { key: 'sunday',    label: 'Sun' },
] as const

const DEFAULT_HOURS = { open: '09:00', close: '18:00', closed: false }

const DEFAULT_WORKING_HOURS = Object.fromEntries(
  DAYS.map(({ key }) => [key, key === 'sunday' ? { ...DEFAULT_HOURS, closed: true } : DEFAULT_HOURS])
)

const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 22; h++) {
  for (const m of [0, 30]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}

const INPUT = 'w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20'

// ── Props ─────────────────────────────────────────────────────────────────
export interface StaffModalProps {
  shopId:       string
  open:         boolean
  onOpenChange: (open: boolean) => void
  editStaff?:   Staff | null
  onSuccess?:   (staff: Staff) => void
}

// ── Component ─────────────────────────────────────────────────────────────
export function StaffModal({ shopId, open, onOpenChange, editStaff, onSuccess }: StaffModalProps) {
  const isEdit       = !!editStaff
  const fileRef      = useRef<HTMLInputElement>(null)
  const [uploadErr,  setUploadErr]  = useState<string | null>(null)
  const [uploading,  setUploading]  = useState(false)

  const {
    register, handleSubmit, control, reset, watch,
    formState: { errors, isSubmitting },
    setError: setFormError, setValue,
  } = useForm<StaffFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(staffSchema) as any,
    defaultValues: {
      name: '', email: '', phone: '', role: 'Barber',
      colour: '#c9a84c', commission_rate: 0, bio: '', avatar_url: '',
      working_hours: DEFAULT_WORKING_HOURS,
    },
  })

  const watchedColour    = watch('colour')
  const watchedWH        = watch('working_hours')
  const watchedAvatarUrl = watch('avatar_url')

  useEffect(() => {
    if (editStaff) {
      reset({
        name:            editStaff.name,
        email:           editStaff.email           ?? '',
        phone:           editStaff.phone           ?? '',
        role:            editStaff.role,
        colour:          editStaff.colour,
        commission_rate: editStaff.commission_rate,
        bio:             editStaff.bio             ?? '',
        avatar_url:      editStaff.avatar_url      ?? '',
        working_hours:   (editStaff.working_hours && Object.keys(editStaff.working_hours).length > 0)
          ? (editStaff.working_hours as StaffFormValues['working_hours'])
          : DEFAULT_WORKING_HOURS,
      })
    } else {
      reset({
        name: '', email: '', phone: '', role: 'Barber',
        colour: '#c9a84c', commission_rate: 0, bio: '', avatar_url: '',
        working_hours: DEFAULT_WORKING_HOURS,
      })
    }
  }, [editStaff, open, reset])

  // Avatar upload via Supabase Storage
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !shopId) return

    if (file.size > 2 * 1024 * 1024) {
      setUploadErr('Image must be under 2 MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadErr('Only JPG, PNG or WebP images are supported')
      return
    }

    setUploadErr(null)
    setUploading(true)
    const sb   = createClient()
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `staff/${shopId}/${Date.now()}.${ext}`
    const { error } = await sb.storage.from('avatars').upload(path, file, { upsert: true })
    setUploading(false)

    if (error) {
      setUploadErr(`Upload failed: ${error.message}`)
      return
    }
    const { data } = sb.storage.from('avatars').getPublicUrl(path)
    setValue('avatar_url', data.publicUrl)
  }

  async function onSubmit(values: StaffFormValues) {
    const url    = '/api/staff'
    const method = isEdit ? 'PATCH' : 'POST'
    const body   = isEdit
      ? JSON.stringify({ id: editStaff!.id, ...values })
      : JSON.stringify({ shop_id: shopId, ...values })

    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body })
    const json = await res.json() as { data?: Staff; error?: string }

    if (!res.ok) {
      setFormError('root', { message: json.error ?? 'Something went wrong' })
      return
    }
    if (json.data) onSuccess?.(json.data)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className={cn(
            'fixed top-0 right-0 h-full w-full max-w-lg bg-[#111111] border-l border-white/[0.06] z-50 flex flex-col shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
            'duration-300'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] flex-shrink-0">
            <div>
              <Dialog.Title className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">
                {isEdit ? 'EDIT STAFF' : 'ADD STAFF'}
              </Dialog.Title>
              {isEdit && <p className="text-xs text-zinc-500 mt-0.5">{editStaff?.name}</p>}
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close"
                className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {errors.root && (
              <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {errors.root.message}
              </div>
            )}

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                {watchedAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={watchedAvatarUrl} alt="Avatar preview" className="w-16 h-16 rounded-full object-cover border-2 border-white/[0.08]" />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold border-2 border-white/[0.08]"
                    style={{ backgroundColor: `${watchedColour}20`, color: watchedColour }}
                  >
                    {watch('name')?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  aria-label="Upload avatar"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#c9a84c] text-[#0a0a0a] flex items-center justify-center shadow-lg hover:bg-[#e2bf6a] transition-colors disabled:opacity-50"
                >
                  {uploading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Upload className="w-3 h-3" />}
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs text-zinc-400">Profile photo</p>
                <p className="text-[10px] text-zinc-600">JPG, PNG or WebP · max 2 MB</p>
                {uploadErr && (
                  <p className="text-[10px] text-red-400">{uploadErr}</p>
                )}
                {watchedAvatarUrl && !uploading && (
                  <button type="button" onClick={() => { setValue('avatar_url', ''); setUploadErr(null) }}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors">
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="staff-name" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <User className="w-3 h-3" />Name <span className="text-red-400">*</span>
              </label>
              <input id="staff-name" type="text" placeholder="James Carter"
                className={cn(INPUT, errors.name && 'border-red-500/50')} {...register('name')} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="staff-email" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Mail className="w-3 h-3" />Email
                </label>
                <input id="staff-email" type="email" placeholder="james@shop.com" className={cn(INPUT, errors.email && 'border-red-500/50')} {...register('email')} />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="staff-phone" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Phone className="w-3 h-3" />Phone
                </label>
                <input id="staff-phone" type="tel" placeholder="+44 7700 000000" className={INPUT} {...register('phone')} />
              </div>
            </div>

            {/* Role + Commission row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="staff-role" className="text-xs font-medium text-zinc-400">Role</label>
                <div className="relative">
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <select id="staff-role" value={field.value} onChange={(e) => field.onChange(e.target.value)}
                        aria-label="Role" title="Role"
                        className={cn(INPUT, 'appearance-none pr-8 cursor-pointer')}>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        <option value="custom">Custom…</option>
                      </select>
                    )}
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="staff-commission" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Percent className="w-3 h-3" />Commission %
                </label>
                <input id="staff-commission" type="number" min="0" max="100" step="1" placeholder="0"
                  className={INPUT} {...register('commission_rate')} />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label htmlFor="staff-bio" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <AlignLeft className="w-3 h-3" />Bio
              </label>
              <textarea id="staff-bio" rows={2} placeholder="A few words about this team member…"
                className={cn(INPUT, 'resize-none')} {...register('bio')} />
            </div>

            {/* Colour picker */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Colour</label>
              <div className="flex items-center gap-2 flex-wrap">
                <Controller
                  name="colour"
                  control={control}
                  render={({ field }) => (
                    <>
                      {PRESET_COLOURS.map((c) => (
                        <button key={c} type="button" onClick={() => field.onChange(c)}
                          title={c} aria-label={`Select colour ${c}`}
                          className={cn(
                            'w-7 h-7 rounded-full transition-all border-2',
                            field.value === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <div className="flex items-center gap-2 ml-1">
                        <div className="w-7 h-7 rounded-full border-2 border-white/20 flex-shrink-0"
                          style={{ backgroundColor: field.value }} />
                        <input type="text" value={field.value}
                          onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) field.onChange(v) }}
                          placeholder="#c9a84c" aria-label="Custom colour hex"
                          className="w-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1 text-xs text-white font-mono outline-none focus:border-[#c9a84c]/60" />
                      </div>
                    </>
                  )}
                />
              </div>
              {errors.colour && <p className="text-xs text-red-400">{errors.colour.message}</p>}
            </div>

            {/* Working hours */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-zinc-400">Working hours</p>
              <div className="space-y-2">
                {DAYS.map(({ key, label }) => {
                  const day    = watchedWH?.[key] ?? DEFAULT_HOURS
                  const closed = day.closed

                  return (
                    <div key={key} className="flex items-center gap-3">
                      {/* Day toggle */}
                      <button
                        type="button"
                        onClick={() => setValue(`working_hours.${key}.closed`, !closed)}
                        aria-label={`Toggle ${label}`}
                        className={cn(
                          'w-10 h-6 rounded-full border relative flex-shrink-0 transition-colors',
                          !closed ? 'bg-[#c9a84c] border-[#c9a84c]' : 'bg-zinc-700 border-zinc-600'
                        )}
                      >
                        <span className={cn(
                          'absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform',
                          !closed ? 'translate-x-4' : 'translate-x-0'
                        )} />
                      </button>

                      <span className={cn('text-xs w-7 font-medium flex-shrink-0', closed ? 'text-zinc-600' : 'text-zinc-300')}>
                        {label}
                      </span>

                      {closed ? (
                        <span className="text-xs text-zinc-600 italic">Closed</span>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <Controller
                            name={`working_hours.${key}.open`}
                            control={control}
                            render={({ field }) => (
                              <select value={field.value} onChange={(e) => field.onChange(e.target.value)}
                                aria-label={`${label} open time`} title={`${label} open time`}
                                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#c9a84c]/60 cursor-pointer">
                                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                            )}
                          />
                          <span className="text-xs text-zinc-600">–</span>
                          <Controller
                            name={`working_hours.${key}.close`}
                            control={control}
                            render={({ field }) => (
                              <select value={field.value} onChange={(e) => field.onChange(e.target.value)}
                                aria-label={`${label} close time`} title={`${label} close time`}
                                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#c9a84c]/60 cursor-pointer">
                                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.06] flex-shrink-0 bg-[#0d0d0d]">
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-4 py-3 text-sm transition-colors"
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? 'Saving…' : 'Adding…'}</>
                : isEdit ? 'Save Changes' : 'Add Staff Member'
              }
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
