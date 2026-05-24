import { getShop, getSubscription } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe/plans'
import type { PlanId } from '@/lib/stripe/plans'
import { StylesClient } from './_StylesClient'

export default async function StylesPage() {
  const [shop, subscription] = await Promise.all([getShop(), getSubscription()])

  const plan   = ((subscription?.plan as PlanId | undefined) ?? 'free') satisfies PlanId
  const shopId = shop?.id ?? ''

  // Validate plan is a known key (guards against stale DB data)
  const safePlan: PlanId = plan in PLANS ? plan : 'free'
  const maxStyles = (PLANS[safePlan].limits as Record<string, unknown>).styles as number

  return <StylesClient shopId={shopId} plan={safePlan} maxStyles={maxStyles} />
}
