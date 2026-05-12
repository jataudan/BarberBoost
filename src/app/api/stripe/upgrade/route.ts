import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanId } from '@/lib/stripe/plans'

const PAID_PLAN_IDS: PlanId[] = ['starter', 'pro', 'empire']

/**
 * POST /api/stripe/upgrade
 * Body: { planId: 'pro' | 'empire' | 'starter' }
 *
 * Updates an existing Stripe subscription to a new price in-place,
 * with proration. Updates the DB subscription row immediately.
 * Used for paid-plan → higher paid-plan upgrades from the billing page.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId } = await request.json() as { planId: PlanId }
    if (!planId || !PAID_PLAN_IDS.includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const plan = PLANS[planId]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newPriceId = plan.priceId ?? (plan as any).annualPriceId as string | undefined
    if (!newPriceId) return NextResponse.json({ error: 'Plan not configured' }, { status: 400 })

    // Get shop
    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shopId = (shop as any)?.id as string | undefined
    if (!shopId) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    // Get subscription with a Stripe subscription ID
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('shop_id', shopId)
      .not('stripe_subscription_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = subs?.[0] as any
    if (!sub?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Update the Stripe subscription in-place (handles proration automatically)
    const stripe = getStripe()
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
    const currentItem = stripeSub.items.data[0]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      items: [{ id: currentItem.id, price: newPriceId }],
      proration_behavior: 'create_prorations',
    }) as any

    // Mirror the change in the DB immediately (webhook will also fire as a backup)
    await supabase.from('subscriptions').update({
      plan:                 planId,
      stripe_price_id:      newPriceId,
      status:               updated.status,
      current_period_start: new Date(updated.current_period_start * 1000).toISOString(),
      current_period_end:   new Date(updated.current_period_end   * 1000).toISOString(),
      updated_at:           new Date().toISOString(),
    }).eq('id', sub.id)

    return NextResponse.json({ success: true, plan: planId })
  } catch (error) {
    console.error('[stripe/upgrade]', error)
    const msg = error instanceof Error ? error.message : 'Failed to upgrade plan'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
