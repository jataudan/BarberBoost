'use client'

import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, AlertCircle, Clock, Tag, Type, AlignLeft, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Service } from '@/types/database'

// ── Zod schema ────────────────────────────────────────────────────────────
const serviceSchema = z.object({
  name:             z.string().min(1, 'Name is required').max(80),
  category:         z.string().min(1, 'Category is required'),
  description:      z.string().max(300).optional().or(z.literal('')),
  duration_minutes: z.coerce.number().int().min(5).max(480),
  price:            z.coerce.number().min(0).max(9999),
  colour:           z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid colour'),
  is_active:        z.boolean(),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

// ── Constants ─────────────────────────────────────────────────────────────
export const SERVICE_CATEGORIES = [
  'Haircut', 'Beard', 'Colour', 'Kids', 'Treatment', 'Shave', 'Combo', 'Other',
] as const

const DURATION_OPTIONS = [
  {  value: 15,  label: '15 min'  },
  {  value: 20,  label: '20 min'  },
  {  value: 30,  label: '30 min'  },
  {  value: 45,  label: '45 min'  },
  {  value: 60,  label: '1 hr'    },
  {  value: 75,  label: '1 hr 15' },
  {  value: 90,  label: '1 hr 30' },
  {  value: 105, label: '1 hr 45' },
  {  value: 120, label: '2 hrs'   },
  {  value: 150, label: '2 hrs 30'},
  {  value: 180, label: '3 hrs'   },
]

const PRESET_COLOURS = [
  '#c9a84c', '#6366f1', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#06b6d4', '#f97316',
  '#ec4899', '#84cc16', '#64748b', '#ffffff',
]

const INPUT = 'w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20'

// ── Props ─────────────────────────────────────────────────────────────────
export interface ServiceModalProps {
  shopId:        string
  open:          boolean
  onOpenChange:  (open: boolean) => void
  editService?:  Service | null
  onSuccess?:    (service: Service) => void
}

// ── Component ─────────────────────────────────────────────────────────────
export function ServiceModal({ shopId, open, onOpenChange, editService, onSuccess }: ServiceModalProps) {
  const isEdit = !!editService

  const {
    register, handleSubmit, control, reset, watch,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<ServiceFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: {
      name:             '',
      category:         'Haircut',
      description:      '',
      duration_minutes: 30,
      price:            0,
      colour:           '#c9a84c',
      is_active:        true,
    },
  })

  const watchedColour = watch('colour')
  const watchedActive = watch('is_active')

  useEffect(() => {
    if (editService) {
      reset({
        name:             editService.name,
        category:         editService.category,
        description:      editService.description ?? '',
        duration_minutes: editService.duration_minutes,
        price:            editService.price,
        colour:           editService.colour,
        is_active:        editService.is_active,
      })
    } else {
      reset({
        name: '', category: 'Haircut', description: '',
        duration_minutes: 30, price: 0, colour: '#c9a84c', is_active: true,
      })
    }
  }, [editService, open, reset])

  async function onSubmit(values: ServiceFormValues) {
    const url    = '/api/services'
    const method = isEdit ? 'PATCH' : 'POST'
    const body   = isEdit
      ? JSON.stringify({ id: editService!.id, ...values })
      : JSON.stringify({ shop_id: shopId, ...values })

    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body })
    const json = await res.json() as { data?: Service; error?: string; code?: string }

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
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Panel */}
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col bg-[#111111] shadow-2xl',
            'rounded-t-2xl border-t border-white/[0.06] max-h-[92dvh]',
            'md:inset-x-auto md:right-0 md:top-0 md:h-full md:w-full md:max-w-md',
            'md:rounded-none md:border-t-0 md:border-l md:max-h-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out duration-300',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            'md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right',
            'md:data-[state=closed]:[--tw-exit-translate-y:0%] md:data-[state=open]:[--tw-enter-translate-y:0%]',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] flex-shrink-0">
            <div>
              <Dialog.Title className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">
                {isEdit ? 'EDIT SERVICE' : 'ADD SERVICE'}
              </Dialog.Title>
              {isEdit && <p className="text-xs text-zinc-500 mt-0.5">{editService?.name}</p>}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Root error */}
            {errors.root && (
              <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {errors.root.message}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="svc-name" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Type className="w-3 h-3" />Name <span className="text-red-400">*</span>
              </label>
              <input id="svc-name" type="text" placeholder="Classic Haircut" className={cn(INPUT, errors.name && 'border-red-500/50')} {...register('name')} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label htmlFor="svc-category" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Tag className="w-3 h-3" />Category
              </label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => field.onChange(cat)}
                        className={cn(
                          'text-xs font-medium px-3 py-1.5 rounded-full border transition-all',
                          field.value === cat
                            ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/25'
                            : 'bg-white/[0.04] text-zinc-500 border-white/[0.06] hover:text-zinc-300 hover:border-zinc-600'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="svc-desc" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <AlignLeft className="w-3 h-3" />Description
              </label>
              <textarea id="svc-desc" rows={2} placeholder="Optional service description…" className={cn(INPUT, 'resize-none')} {...register('description')} />
              {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
            </div>

            {/* Duration + Price row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="svc-duration" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Clock className="w-3 h-3" />Duration
                </label>
                <div className="relative">
                  <Controller
                    name="duration_minutes"
                    control={control}
                    render={({ field }) => (
                      <select
                        id="svc-duration"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        aria-label="Duration"
                        title="Duration"
                        className={cn(INPUT, 'appearance-none pr-8 cursor-pointer')}
                      >
                        {DURATION_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="svc-price" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <DollarSign className="w-3 h-3" />Price (£)
                </label>
                <input
                  id="svc-price"
                  type="number"
                  step="0.50"
                  min="0"
                  placeholder="25.00"
                  className={cn(INPUT, errors.price && 'border-red-500/50')}
                  {...register('price')}
                />
                {errors.price && <p className="text-xs text-red-400">{errors.price.message}</p>}
              </div>
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
                        <button
                          key={c}
                          type="button"
                          onClick={() => field.onChange(c)}
                          title={c}
                          aria-label={`Select colour ${c}`}
                          className={cn(
                            'w-7 h-7 rounded-full transition-all border-2',
                            field.value === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      {/* Custom hex input */}
                      <div className="flex items-center gap-2 ml-1">
                        <div className="w-7 h-7 rounded-full border-2 border-white/20 flex-shrink-0" style={{ backgroundColor: field.value }} />
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => {
                            const v = e.target.value
                            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) field.onChange(v)
                          }}
                          placeholder="#c9a84c"
                          aria-label="Custom colour hex"
                          className="w-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1 text-xs text-white font-mono outline-none focus:border-[#c9a84c]/60"
                        />
                      </div>
                    </>
                  )}
                />
              </div>
              {errors.colour && <p className="text-xs text-red-400">{errors.colour.message}</p>}
            </div>

            {/* Active toggle */}
            <div className="flex items-start justify-between gap-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
              <div>
                <p className="text-sm font-medium text-white">Active</p>
                <p className="text-xs text-zinc-500 mt-0.5">Service is bookable by clients</p>
              </div>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    aria-label="Toggle active"
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'w-10 h-6 rounded-full border relative flex-shrink-0 mt-0.5 transition-colors',
                      field.value ? 'bg-[#c9a84c] border-[#c9a84c]' : 'bg-zinc-700 border-zinc-600'
                    )}
                  >
                    <span className={cn(
                      'absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform',
                      field.value ? 'translate-x-4' : 'translate-x-0'
                    )} />
                  </button>
                )}
              />
            </div>

            {/* Preview swatch */}
            <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
              <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ backgroundColor: watchedColour }} />
              <div>
                <p className="text-sm font-semibold text-white">{watch('name') || 'Service name'}</p>
                <p className="text-xs text-zinc-500">
                  {watch('duration_minutes')} min ·{' '}
                  £{Number(watch('price')).toFixed(2)} ·{' '}
                  <span className={watchedActive ? 'text-emerald-400' : 'text-zinc-500'}>
                    {watchedActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
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
                : isEdit ? 'Save Changes' : 'Add Service'
              }
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
