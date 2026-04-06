'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, AlertCircle, Type, AlignLeft, Users, ChevronDown, Sparkles, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlanGate } from '@/components/shared/PlanGate'
import type { Campaign } from '@/types/database'
import type { PlanId } from '@/lib/stripe/plans'
import type { AICopyResponse } from '@/app/api/ai-copy/route'

// ── Schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  name:           z.string().min(1, 'Name is required').max(80),
  type:           z.enum(['email', 'sms', 'push']),
  subject:        z.string().max(150).optional().or(z.literal('')),
  content:        z.string().max(2000).optional().or(z.literal('')),
  target_segment: z.string().min(1),
  scheduled_at:   z.string().optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

const SEGMENTS = [
  { value: 'all',      label: 'All clients'          },
  { value: 'vip',      label: 'VIP clients'          },
  { value: 'regular',  label: 'Regular clients'      },
  { value: 'at_risk',  label: 'At-risk clients'      },
  { value: 'new',      label: 'New clients'          },
  { value: 'inactive', label: 'Inactive (60+ days)'  },
]

const TONES = [
  { value: 'friendly',     label: 'Friendly'     },
  { value: 'professional', label: 'Professional' },
  { value: 'urgent',       label: 'Urgent'       },
  { value: 'exclusive',    label: 'Exclusive'    },
] as const
type Tone = typeof TONES[number]['value']

const INPUT = 'w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20'

export interface CampaignModalProps {
  shopId:        string
  shopName?:     string
  plan?:         PlanId
  open:          boolean
  onOpenChange:  (open: boolean) => void
  editCampaign?: Campaign | null
  onSuccess?:    (campaign: Campaign) => void
}

export function CampaignModal({ shopId, shopName = 'Your Shop', plan = 'free', open, onOpenChange, editCampaign, onSuccess }: CampaignModalProps) {
  const isEdit = !!editCampaign

  const { register, handleSubmit, reset, control, watch, setValue,
    formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { name: '', type: 'email', subject: '', content: '', target_segment: 'all', scheduled_at: '' },
  })

  const watchedType    = watch('type')
  const watchedSegment = watch('target_segment')

  // ── AI Copy state ────────────────────────────────────────────────────────
  const [tone, setTone]               = useState<Tone>('friendly')
  const [aiLoading, setAiLoading]     = useState(false)
  const [aiError, setAiError]         = useState<string | null>(null)
  const [aiResult, setAiResult]       = useState<AICopyResponse | null>(null)
  const [chosenSubject, setChosenSubject] = useState<string | null>(null)

  useEffect(() => {
    if (editCampaign) {
      reset({
        name:           editCampaign.name,
        type:           (editCampaign.type as FormValues['type']) ?? 'email',
        subject:        editCampaign.subject        ?? '',
        content:        editCampaign.content        ?? '',
        target_segment: editCampaign.target_segment,
        scheduled_at:   editCampaign.scheduled_at   ?? '',
      })
    } else {
      reset({ name: '', type: 'email', subject: '', content: '', target_segment: 'all', scheduled_at: '' })
    }
    setAiResult(null)
    setAiError(null)
    setChosenSubject(null)
  }, [editCampaign, open, reset])

  async function generateWithAI() {
    setAiLoading(true)
    setAiError(null)
    setAiResult(null)
    setChosenSubject(null)
    try {
      const res  = await fetch('/api/ai-copy', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          type:           watchedType,
          shopName,
          targetAudience: watchedSegment,
          tone,
        }),
      })
      const json = await res.json() as { data?: AICopyResponse; error?: string }
      if (!res.ok) { setAiError(json.error ?? 'Generation failed. Please try again.'); return }
      if (json.data) {
        setAiResult(json.data)
        // Auto-populate body with email body or SMS depending on type
        const body = watchedType === 'sms' ? json.data.smsMessage : json.data.emailBody
        setValue('content', body, { shouldDirty: true })
      }
    } catch {
      setAiError('Network error. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  function applySubject(subject: string) {
    setChosenSubject(subject)
    setValue('subject', subject, { shouldDirty: true })
  }

  async function onSubmit(values: FormValues) {
    const body = isEdit
      ? JSON.stringify({ id: editCampaign!.id, ...values, subject: values.subject || null, content: values.content || null, scheduled_at: values.scheduled_at || null })
      : JSON.stringify({ shop_id: shopId, ...values, subject: values.subject || null, content: values.content || null, scheduled_at: values.scheduled_at || null })

    const res  = await fetch('/api/campaigns', { method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body })
    const json = await res.json() as { data?: Campaign; error?: string }
    if (!res.ok) { setError('root', { message: json.error ?? 'Something went wrong' }); return }
    if (json.data) onSuccess?.(json.data)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className={cn(
          // Mobile: bottom sheet — slides up from bottom, rounded top, max 92% height
          'fixed inset-x-0 bottom-0 z-50 flex flex-col bg-[#111111] shadow-2xl',
          'rounded-t-2xl border-t border-white/[0.06] max-h-[92dvh]',
          // Desktop (md+): right side panel — full height, slides from right
          'md:inset-x-auto md:right-0 md:top-0 md:h-full md:w-full md:max-w-lg',
          'md:rounded-none md:border-t-0 md:border-l md:max-h-none',
          // Animation — bottom slide mobile, right slide desktop
          'data-[state=open]:animate-in data-[state=closed]:animate-out duration-300',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          'md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right',
          'md:data-[state=closed]:[--tw-exit-translate-y:0%] md:data-[state=open]:[--tw-enter-translate-y:0%]',
        )}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] flex-shrink-0">
            <Dialog.Title className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">
              {isEdit ? 'EDIT CAMPAIGN' : 'NEW CAMPAIGN'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close"
                className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {errors.root && (
              <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{errors.root.message}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="camp-name" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Type className="w-3 h-3" />Campaign name <span className="text-red-400">*</span>
              </label>
              <input id="camp-name" type="text" placeholder="Spring offer — VIP clients"
                className={cn(INPUT, errors.name && 'border-red-500/50')} {...register('name')} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            {/* Type selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Type</label>
              <Controller name="type" control={control} render={({ field }) => (
                <div className="flex gap-2">
                  {(['email', 'sms', 'push'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => { field.onChange(t); setAiResult(null) }}
                      className={cn(
                        'flex-1 py-2 text-xs font-semibold rounded-xl border transition-all uppercase tracking-wider',
                        field.value === t
                          ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/25'
                          : 'bg-white/[0.03] text-zinc-500 border-white/[0.06] hover:text-zinc-300'
                      )}>{t}</button>
                  ))}
                </div>
              )} />
            </div>

            {/* Target segment */}
            <div className="space-y-1.5">
              <label htmlFor="camp-seg" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Users className="w-3 h-3" />Target segment
              </label>
              <div className="relative">
                <select id="camp-seg" aria-label="Target segment" title="Target segment"
                  className={cn(INPUT, 'appearance-none pr-9 cursor-pointer')} {...register('target_segment')}>
                  {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* ── AI Copy panel ───────────────────────────────────────── */}
            <PlanGate requiredPlan="empire" currentPlan={plan}>
              <div className="bg-gradient-to-br from-emerald-950/40 to-[#111111] border border-emerald-500/20 rounded-2xl p-4 space-y-4">
                {/* Header row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-300">AI Copy Assistant</p>
                      <p className="text-[10px] text-emerald-600">Powered by Claude</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 uppercase tracking-wider">Empire</span>
                </div>

                {/* Tone selector */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-zinc-500">Tone</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {TONES.map(t => (
                      <button key={t.value} type="button" onClick={() => setTone(t.value)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-medium border transition-all',
                          tone === t.value
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-white/[0.03] text-zinc-500 border-white/[0.06] hover:text-zinc-300'
                        )}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate button */}
                <button type="button" onClick={generateWithAI} disabled={aiLoading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/25 text-emerald-300 rounded-xl py-2.5 text-sm font-semibold transition-all">
                  {aiLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
                    : <><Sparkles className="w-4 h-4" />Generate with AI</>
                  }
                </button>

                {/* AI error */}
                {aiError && (
                  <div className="flex items-start gap-2 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3 py-2.5 text-xs text-red-400">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{aiError}
                  </div>
                )}

                {/* AI results */}
                {aiResult && (
                  <div className="space-y-3 pt-1 border-t border-white/[0.06]">
                    {/* Subject chips */}
                    {watchedType === 'email' && aiResult.subjects.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium text-zinc-500">Subject lines — click to use</p>
                        <div className="space-y-1.5">
                          {aiResult.subjects.map((s, i) => (
                            <button key={i} type="button" onClick={() => applySubject(s)}
                              className={cn(
                                'w-full text-left px-3 py-2 rounded-xl border text-xs transition-all',
                                chosenSubject === s
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                                  : 'bg-white/[0.02] border-white/[0.06] text-zinc-300 hover:bg-white/[0.05] hover:border-white/[0.1]'
                              )}>
                              <span className="flex items-center gap-2">
                                {chosenSubject === s && <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                                {s}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SMS preview chip */}
                    {watchedType === 'sms' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-medium text-zinc-500">Generated SMS</p>
                          <span className={cn(
                            'text-[10px] font-semibold',
                            aiResult.smsMessage.length > 140 ? 'text-yellow-400' : 'text-zinc-600'
                          )}>
                            {aiResult.smsMessage.length}/160
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">Content field has been populated below.</p>
                      </div>
                    )}

                    {watchedType === 'push' && (
                      <p className="text-xs text-zinc-500">Email body has been used as push notification text below.</p>
                    )}
                  </div>
                )}
              </div>
            </PlanGate>

            {/* Subject (email only) */}
            {watchedType === 'email' && (
              <div className="space-y-1.5">
                <label htmlFor="camp-subj" className="text-xs font-medium text-zinc-400">Email subject</label>
                <input id="camp-subj" type="text" placeholder="You're invited — exclusive offer inside 🔑"
                  className={INPUT} {...register('subject')} />
              </div>
            )}

            {/* Content */}
            <div className="space-y-1.5">
              <label htmlFor="camp-body" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <AlignLeft className="w-3 h-3" />Message content
              </label>
              <textarea id="camp-body" rows={6}
                placeholder={watchedType === 'sms'
                  ? "Hi {name}, you've got a special offer waiting…"
                  : "Write your campaign message here…"}
                className={cn(INPUT, 'resize-none')} {...register('content')} />
              <p className="text-[10px] text-zinc-600">Use {'{name}'} to personalise with the client&apos;s first name.</p>
            </div>

            {/* Schedule */}
            <div className="space-y-1.5">
              <label htmlFor="camp-sched" className="text-xs font-medium text-zinc-400">Schedule (optional)</label>
              <input id="camp-sched" type="datetime-local" className={INPUT} {...register('scheduled_at')} />
              <p className="text-[10px] text-zinc-600">Leave blank to save as draft.</p>
            </div>
          </form>

          <div className="px-6 py-4 border-t border-white/[0.06] flex-shrink-0 bg-[#0d0d0d]">
            <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-4 py-3 text-sm transition-colors">
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? 'Saving…' : 'Creating…'}</>
                : isEdit ? 'Save Changes' : 'Create Campaign'
              }
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
