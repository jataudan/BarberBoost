'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { PLANS, type PlanId } from '@/lib/stripe/plans'
import { cn } from '@/lib/utils'

const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'empire']

const PLAN_STYLES: Record<PlanId, { border: string; headerText: string; cta: string; ring: string }> = {
  free:    { border: 'border-[#1e1e1e]',     headerText: 'text-zinc-300',    cta: 'bg-zinc-800 hover:bg-zinc-700 text-white',         ring: '' },
  starter: { border: 'border-indigo-500/30', headerText: 'text-indigo-300',  cta: 'bg-indigo-600 hover:bg-indigo-500 text-white',     ring: '' },
  pro:     { border: 'border-[#c9a84c]/40',  headerText: 'text-[#c9a84c]',   cta: 'bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a]', ring: 'ring-1 ring-[#c9a84c]/30' },
  empire:  { border: 'border-emerald-500/30',headerText: 'text-emerald-300', cta: 'bg-emerald-600 hover:bg-emerald-500 text-white',   ring: '' },
}

/** Monthly price × 10 = annual total (2 months free) */
function annualMonthlyEquivalent(monthlyPrice: number) {
  return Math.floor((monthlyPrice * 10) / 12 * 100) / 100
}

export function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="space-y-12">
      {/* Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm font-medium transition-colors ${!annual ? 'text-white' : 'text-zinc-500'}`}>
          Monthly
        </span>
        <button
          type="button"
          onClick={() => setAnnual((v) => !v)}
          className={cn(
            'relative w-12 h-6 rounded-full transition-colors',
            annual ? 'bg-[#c9a84c]' : 'bg-zinc-700',
          )}
          aria-pressed={annual ? 'true' : 'false'}
          aria-label="Toggle annual billing"
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
              annual ? 'translate-x-6' : 'translate-x-0',
            )}
          />
        </button>
        <span className={`text-sm font-medium transition-colors flex items-center gap-2 ${annual ? 'text-white' : 'text-zinc-500'}`}>
          Annual
          <span className="text-[10px] font-bold bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/25 px-2 py-0.5 rounded-full">
            2 months free
          </span>
        </span>
      </div>

      {/* Plan cards — horizontal swipe on mobile, 2-col sm, 4-col xl */}
      <div className="flex sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-5 overflow-x-auto snap-x snap-mandatory pt-5 pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId]
          const styles = PLAN_STYLES[planId]
          const isPaid = plan.price > 0
          const displayPrice = isPaid && annual
            ? annualMonthlyEquivalent(plan.price)
            : plan.price
          const annualTotal = isPaid ? plan.price * 10 : 0
          const saving = isPaid ? plan.price * 2 : 0

          return (
            <div
              key={planId}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-[#111111] p-6 gap-5',
                'snap-center flex-shrink-0 w-[80vw] xs:w-[72vw] sm:w-auto',
                styles.border,
                styles.ring,
              )}
            >
              {/* Popular badge */}
              {'badge' in plan && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#c9a84c] text-[#0a0a0a] text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
                    {(plan as typeof PLANS['starter']).badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div>
                <p className={cn('font-[family-name:var(--font-heading)] text-2xl tracking-widest', styles.headerText)}>
                  {plan.name.toUpperCase()}
                </p>
                <p className="text-xs text-zinc-600 mt-1 leading-snug">{plan.description}</p>
              </div>

              {/* Price */}
              <div>
                <div className="flex items-baseline gap-1">
                  {plan.price === 0 ? (
                    <span className="font-[family-name:var(--font-heading)] text-4xl text-white tracking-wide">Free</span>
                  ) : (
                    <>
                      <span className="font-[family-name:var(--font-heading)] text-4xl text-white tracking-wide">
                        £{displayPrice % 1 === 0 ? displayPrice : displayPrice.toFixed(2)}
                      </span>
                      <span className="text-zinc-600 text-sm">/mo</span>
                    </>
                  )}
                </div>
                {isPaid && annual && (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-zinc-600">
                      Billed £{annualTotal}/year
                    </p>
                    <p className="text-xs text-[#c9a84c] font-medium">
                      Save £{saving}/year
                    </p>
                  </div>
                )}
                {isPaid && !annual && (
                  <p className="text-xs text-zinc-700 mt-1">
                    Or £{annualMonthlyEquivalent(plan.price).toFixed(2)}/mo billed annually
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-[#c9a84c] shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.price === 0 ? '/signup' : `/signup?plan=${planId}${annual ? '&billing=annual' : ''}`}
                className={cn(
                  'block text-center font-bold rounded-xl px-4 py-3 text-sm transition-all tracking-wide',
                  styles.cta,
                )}
              >
                {plan.price === 0 ? 'Start Free' : `Get ${plan.name}`}
              </Link>
            </div>
          )
        })}
      </div>

      <p className="text-center text-sm text-zinc-600">
        All plans include a public booking page · Cancel any time · No hidden fees
      </p>
    </div>
  )
}
