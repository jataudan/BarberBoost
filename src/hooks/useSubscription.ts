'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PLANS, type PlanId, type PlanLimits } from '@/lib/stripe/plans'
import { type Database } from '@/types/database'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

type LimitKey = keyof PlanLimits

function checkAccess(limits: PlanLimits, feature: LimitKey): boolean {
  const value = limits[feature]
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  // string (analytics tier) — always present at some level
  return true
}

export function useSubscription(shopId: string | undefined) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!shopId) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    supabase
      .from('subscriptions')
      .select('*')
      .eq('shop_id', shopId)
      .in('status', ['active', 'trialing'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        setSubscription(data?.[0] ?? null)
        setLoading(false)
      })
  }, [shopId])

  const plan = ((subscription?.plan as PlanId | null) ?? 'free') satisfies PlanId
  const planData = PLANS[plan]
  const limits = planData.limits as PlanLimits
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  function canAccess(feature: LimitKey): boolean {
    return checkAccess(limits, feature)
  }

  return { subscription, plan, planData, limits, isActive, loading, canAccess }
}
