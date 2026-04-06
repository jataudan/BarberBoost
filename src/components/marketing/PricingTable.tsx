import Link from 'next/link'
import { Check, Minus } from 'lucide-react'
import { PLANS, type PlanId } from '@/lib/stripe/plans'
import { cn } from '@/lib/utils'

const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'empire']

const PLAN_STYLES: Record<PlanId, { border: string; headerText: string; cta: string; glow: string }> = {
  free:    { border: 'border-[#1e1e1e]',        headerText: 'text-zinc-300',    cta: 'bg-zinc-800 hover:bg-zinc-700 text-white',                       glow: '' },
  starter: { border: 'border-indigo-500/30',     headerText: 'text-indigo-300',  cta: 'bg-indigo-600 hover:bg-indigo-500 text-white',                   glow: 'shadow-indigo-500/10' },
  pro:     { border: 'border-[#c9a84c]/40',      headerText: 'text-[#c9a84c]',   cta: 'bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a]',               glow: 'shadow-[#c9a84c]/15' },
  empire:  { border: 'border-emerald-500/30',    headerText: 'text-emerald-300', cta: 'bg-emerald-600 hover:bg-emerald-500 text-white',                 glow: 'shadow-emerald-500/10' },
}

const TABLE_ROWS = [
  { label: 'Bookings / month',  key: 'bookings_per_month', format: (v: number | boolean | string) => v === -1 ? 'Unlimited' : String(v) },
  { label: 'Client profiles',   key: 'clients',            format: (v: number | boolean | string) => v === -1 ? 'Unlimited' : String(v) },
  { label: 'Barbers / staff',   key: 'staff',              format: (v: number | boolean | string) => v === -1 ? 'Unlimited' : String(v) },
  { label: 'Services',          key: 'services',           format: (v: number | boolean | string) => v === -1 ? 'Unlimited' : String(v) },
  { label: 'Campaigns / month', key: 'campaigns',          format: (v: number | boolean | string) => v === -1 ? 'Unlimited' : v === 0 ? null : String(v) },
  { label: 'Inventory control', key: 'inventory',          format: (v: number | boolean | string) => typeof v === 'boolean' ? v : null },
  { label: 'Automated reminders', key: 'reminders',        format: (v: number | boolean | string) => typeof v === 'boolean' ? v : null },
  { label: 'Public booking page', key: 'public_booking_page', format: (v: number | boolean | string) => typeof v === 'boolean' ? v : null },
  { label: 'Multi-location',    key: 'multi_location',     format: (v: number | boolean | string) => typeof v === 'boolean' ? v : null },
  { label: 'API access',        key: 'api_access',         format: (v: number | boolean | string) => typeof v === 'boolean' ? v : null },
  { label: 'Priority support',  key: 'priority_support',   format: (v: number | boolean | string) => typeof v === 'boolean' ? v : null },
  { label: 'Analytics',         key: 'analytics',          format: (v: number | boolean | string) => typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1) : null },
]

type LimitValue = number | boolean | string

function CellValue({ raw }: { raw: LimitValue }) {
  if (typeof raw === 'boolean') {
    return raw
      ? <Check className="w-4 h-4 text-[#c9a84c] mx-auto" aria-label="Included" />
      : <Minus className="w-4 h-4 text-zinc-700 mx-auto" aria-label="Not included" />
  }
  return <span>{String(raw)}</span>
}

export function PricingTable({ compact = false }: { compact?: boolean }) {
  return (
    <section className={cn('px-4 sm:px-6 bg-[#0a0a0a]', compact ? 'py-0' : 'py-24')}>
      <div className="max-w-7xl mx-auto">
        {!compact && (
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">
              Pricing
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,6vw,4.5rem)] leading-none tracking-widest text-white">
              SIMPLE, TRANSPARENT PLANS
            </h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              Start free. Upgrade when you&apos;re ready. No hidden fees.
            </p>
          </div>
        )}

        {/* Plan cards — mobile friendly column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-12">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId]
            const styles = PLAN_STYLES[planId]
            const isPro = planId === 'pro'

            return (
              <div
                key={planId}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-[#111111] p-6 gap-5',
                  styles.border,
                  isPro && 'ring-1 ring-[#c9a84c]/30',
                  styles.glow && `shadow-xl ${styles.glow}`,
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
                <div className="flex items-baseline gap-1">
                  {plan.price === 0 ? (
                    <span className="font-[family-name:var(--font-heading)] text-4xl text-white tracking-wide">Free</span>
                  ) : (
                    <>
                      <span className="font-[family-name:var(--font-heading)] text-4xl text-white tracking-wide">£{plan.price}</span>
                      <span className="text-zinc-600 text-sm">/mo</span>
                    </>
                  )}
                </div>

                {/* Feature list */}
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
                  href={plan.price === 0 ? '/signup' : `/signup?plan=${planId}`}
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

        {/* Comparison table — hidden on small screens */}
        <div className="hidden lg:block overflow-hidden rounded-2xl border border-[#1e1e1e]">
          {/* Table header */}
          <div className="grid grid-cols-5 bg-[#111111] border-b border-[#1e1e1e]">
            <div className="px-5 py-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Feature</span>
            </div>
            {PLAN_ORDER.map((planId) => {
              const styles = PLAN_STYLES[planId]
              return (
                <div key={planId} className="px-4 py-4 text-center">
                  <p className={cn('font-[family-name:var(--font-heading)] text-lg tracking-widest', styles.headerText)}>
                    {PLANS[planId].name.toUpperCase()}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {PLANS[planId].price === 0 ? 'Free' : `£${PLANS[planId].price}/mo`}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Table rows */}
          {TABLE_ROWS.map(({ label, key, format }, rowIdx) => (
            <div
              key={key}
              className={cn(
                'grid grid-cols-5 border-b border-[#161616] last:border-0',
                rowIdx % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a]',
              )}
            >
              <div className="px-5 py-3.5 flex items-center text-sm text-zinc-400">{label}</div>
              {PLAN_ORDER.map((planId) => {
                const rawValue = PLANS[planId].limits[key as keyof typeof PLANS[typeof planId]['limits']] as LimitValue
                const formatted = format(rawValue)

                return (
                  <div key={planId} className="px-4 py-3.5 flex items-center justify-center text-sm text-zinc-300">
                    {formatted === null ? (
                      <Minus className="w-4 h-4 text-zinc-700" aria-label="Not available" />
                    ) : typeof formatted === 'boolean' ? (
                      <CellValue raw={formatted} />
                    ) : (
                      <span className={formatted === 'Unlimited' ? 'text-[#c9a84c] font-medium' : ''}>
                        {formatted}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
