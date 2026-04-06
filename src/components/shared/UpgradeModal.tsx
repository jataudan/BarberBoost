'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X, Check, Minus, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { PLANS, type PlanId } from '@/lib/stripe/plans'

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requiredPlan: PlanId
  currentPlan?: PlanId
}

const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'empire']

const PLAN_ACCENT: Record<PlanId, { ring: string; badge: string; cta: string; text: string }> = {
  free:    { ring: 'ring-slate-400/40',   badge: 'bg-slate-400/10 text-slate-300',   cta: 'bg-slate-500 hover:bg-slate-400',   text: 'text-slate-400'   },
  starter: { ring: 'ring-indigo-500/40',  badge: 'bg-indigo-500/10 text-indigo-300', cta: 'bg-indigo-500 hover:bg-indigo-400', text: 'text-indigo-400'  },
  pro:     { ring: 'ring-amber-400/40',   badge: 'bg-amber-400/10 text-amber-300',   cta: 'bg-amber-400 hover:bg-amber-300',   text: 'text-amber-400'   },
  empire:  { ring: 'ring-emerald-500/40', badge: 'bg-emerald-500/10 text-emerald-300', cta: 'bg-emerald-500 hover:bg-emerald-400', text: 'text-emerald-400' },
}

// Show the required plan + the one above it (if any); always show at least 2 plans
function plansToShow(requiredPlan: PlanId): PlanId[] {
  const idx = PLAN_ORDER.indexOf(requiredPlan)
  const start = Math.max(0, idx - 1)
  return PLAN_ORDER.slice(start, start + 3)
}

export function UpgradeModal({ open, onOpenChange, requiredPlan, currentPlan = 'free' }: UpgradeModalProps) {
  const shown = plansToShow(requiredPlan)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <Dialog.Title className="font-bold text-lg text-white leading-tight">
                  Upgrade to {PLANS[requiredPlan].name}
                </Dialog.Title>
                <Dialog.Description className="text-zinc-400 text-sm">
                  {PLANS[requiredPlan].description}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors rounded-lg p-1 hover:bg-zinc-800">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          {/* Plan cards */}
          <div className="p-6">
            <div className={`grid gap-4 ${shown.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {shown.map((planId) => {
                const plan = PLANS[planId]
                const accent = PLAN_ACCENT[planId]
                const isRequired = planId === requiredPlan
                const isCurrent = planId === currentPlan

                return (
                  <div
                    key={planId}
                    className={`relative rounded-xl border p-4 flex flex-col gap-3 transition-all ${
                      isRequired
                        ? `border-zinc-700 ring-2 ${accent.ring} bg-zinc-900`
                        : 'border-zinc-800 bg-zinc-900/50'
                    }`}
                  >
                    {/* Plan badge / current indicator */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className={`font-bold text-base ${isRequired ? 'text-white' : 'text-zinc-300'}`}>
                          {plan.name}
                        </p>
                        <p className="text-zinc-500 text-xs mt-0.5">{plan.description}</p>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300 shrink-0">
                          Current
                        </span>
                      )}
                      {'badge' in plan && isRequired && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${accent.badge}`}>
                          {(plan as typeof PLANS['starter']).badge}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      {plan.price === 0 ? (
                        <span className="text-2xl font-black text-white">Free</span>
                      ) : (
                        <>
                          <span className="text-2xl font-black text-white">£{plan.price}</span>
                          <span className="text-zinc-500 text-xs">/mo</span>
                        </>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-1.5 flex-1">
                      {plan.features.slice(0, 5).map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-xs text-zinc-300">
                          <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${accent.text}`} />
                          {feat}
                        </li>
                      ))}
                      {plan.notIncluded.slice(0, 2).map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-xs text-zinc-600">
                          <Minus className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    {isRequired && (
                      <Link
                        href="/settings/billing"
                        onClick={() => onOpenChange(false)}
                        className={`mt-2 flex items-center justify-center gap-1.5 w-full rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors ${accent.cta}`}
                      >
                        Upgrade to {plan.name}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>

            <p className="text-center text-zinc-600 text-xs mt-4">
              Cancel anytime · No hidden fees · Instant activation
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
