'use client'

import { type ReactNode, useState } from 'react'
import { Lock } from 'lucide-react'
import { PLANS, type PlanId, type PlanLimits } from '@/lib/stripe/plans'
import { UpgradeModal } from './UpgradeModal'

type LimitKey = keyof PlanLimits

const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'empire']

const PLAN_STYLES: Record<PlanId, {
  border: string
  iconBg: string
  iconText: string
  btn: string
}> = {
  free:    { border: 'border-slate-400/25',   iconBg: 'bg-slate-400/10',   iconText: 'text-slate-400',   btn: 'bg-slate-400 hover:bg-slate-300'    },
  starter: { border: 'border-indigo-500/25',  iconBg: 'bg-indigo-500/10',  iconText: 'text-indigo-400',  btn: 'bg-indigo-500 hover:bg-indigo-400'  },
  pro:     { border: 'border-amber-400/25',   iconBg: 'bg-amber-400/10',   iconText: 'text-amber-400',   btn: 'bg-amber-400 hover:bg-amber-300'    },
  empire:  { border: 'border-emerald-500/25', iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-400', btn: 'bg-emerald-500 hover:bg-emerald-400' },
}

/** Find the lowest plan that has access to the given feature. */
function lowestPlanWithFeature(feature: LimitKey): PlanId {
  for (const planId of PLAN_ORDER) {
    const value = PLANS[planId].limits[feature]
    const hasAccess =
      typeof value === 'boolean' ? value :
      typeof value === 'number'  ? value !== 0 :
      true
    if (hasAccess) return planId
  }
  return 'empire'
}

interface PlanGateProps {
  children: ReactNode
  /** Gate by a specific feature key from plan limits. Preferred approach. */
  feature?: LimitKey
  /** Gate by minimum required plan (fallback / explicit override). */
  requiredPlan?: PlanId
  /** The user's current plan. */
  currentPlan?: PlanId
}

export function PlanGate({
  children,
  feature,
  requiredPlan,
  currentPlan = 'free',
}: PlanGateProps) {
  const [showUpgrade, setShowUpgrade] = useState(false)

  const minPlan: PlanId = requiredPlan ?? (feature ? lowestPlanWithFeature(feature) : 'starter')
  const hasAccess = PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(minPlan)

  if (hasAccess) return <>{children}</>

  const styles = PLAN_STYLES[minPlan]

  return (
    <>
      <div className="relative group">
        <div className="pointer-events-none select-none opacity-25 blur-[1px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`bg-zinc-900/95 border ${styles.border} rounded-xl px-6 py-4 text-center space-y-2 shadow-xl transition-transform group-hover:scale-105`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${styles.iconBg}`}>
              <Lock className={`w-4 h-4 ${styles.iconText}`} />
            </div>
            <p className="font-semibold text-white text-sm">
              {PLANS[minPlan].name} Plan Required
            </p>
            <button
              type="button"
              onClick={() => setShowUpgrade(true)}
              className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors text-white ${styles.btn}`}
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>

      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        requiredPlan={minPlan}
        currentPlan={currentPlan}
      />
    </>
  )
}
