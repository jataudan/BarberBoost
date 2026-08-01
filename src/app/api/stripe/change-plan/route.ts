import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import { PLANS, PLAN_ORDER, type PlanId } from '@/lib/stripe/plans'
import { checkDowngradeLimits } from '@/lib/stripe/downgrade-guard'
import { scheduleSubscriptionPriceChange, releaseSubscriptionSchedule } from '@/lib/stripe/schedule'

/**
 * POST /api/stripe/change-plan
 * Body: { planId: PlanId }
 *
 * Schedules a plan change (up or down, including down to Free) to take effect at
 * the current billing period's renewal — no immediate charge or proration. Paid↔paid
 * changes use a Stripe Subscription Schedule; a change down to Free cancels the
 * subscription at period end instead. Downgrades are blocked if current usage
 * exceeds the target plan's limits.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId } = await request.json() as { planId: PlanId }
    if (!planId || !(planId in PLANS)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shopId = (shop as any)?.id as string | undefined
    if (!shopId) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

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

    const currentPlanId = sub.plan as PlanId
    if (planId === currentPlanId) {
      return NextResponse.json({ error: 'You are already on this plan' }, { status: 400 })
    }

    const isDowngrade = PLAN_ORDER.indexOf(planId) < PLAN_ORDER.indexOf(currentPlanId)

    if (isDowngrade) {
      const violations = await checkDowngradeLimits(supabase, shopId, planId)
      if (violations.length > 0) {
        return NextResponse.json({
          error: `You're over the ${PLANS[planId].name} plan's limits. Reduce usage before downgrading.`,
          code: 'PLAN_LIMIT_EXCEEDED',
          violations,
        }, { status: 403 })
      }
    }

    const stripe = getStripe()

    if (planId === 'free') {
      if (sub.stripe_schedule_id) {
        await releaseSubscriptionSchedule(stripe, sub.stripe_schedule_id).catch(() => {})
      }
      await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true })

      await supabase.from('subscriptions').update({
        cancel_at_period_end: true,
        scheduled_plan:       'free',
        scheduled_price_id:   null,
        stripe_schedule_id:   null,
        updated_at:           new Date().toISOString(),
      }).eq('id', sub.id)

      return NextResponse.json({ success: true, scheduledPlan: 'free', effectiveAt: sub.current_period_end })
    }

    // Paid <-> paid change — resolve the price matching the subscription's current billing interval
    const currentPlan = PLANS[currentPlanId as Exclude<PlanId, 'free'>]
    const targetPlan  = PLANS[planId as Exclude<PlanId, 'free'>]
    const isAnnual    = sub.stripe_price_id != null && sub.stripe_price_id === currentPlan.annualPriceId
    const newPriceId  = isAnnual
      ? (targetPlan.annualPriceId ?? targetPlan.priceId)
      : (targetPlan.priceId ?? targetPlan.annualPriceId)
    if (!newPriceId) return NextResponse.json({ error: 'Plan not configured' }, { status: 400 })

    if (sub.cancel_at_period_end) {
      await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: false })
    }

    const schedule = await scheduleSubscriptionPriceChange(stripe, sub.stripe_subscription_id, newPriceId)

    await supabase.from('subscriptions').update({
      scheduled_plan:       planId,
      scheduled_price_id:   newPriceId,
      stripe_schedule_id:   schedule.id,
      cancel_at_period_end: false,
      updated_at:           new Date().toISOString(),
    }).eq('id', sub.id)

    return NextResponse.json({ success: true, scheduledPlan: planId, effectiveAt: sub.current_period_end })
  } catch (error) {
    console.error('[stripe/change-plan]', error)
    const msg = error instanceof Error ? error.message : 'Failed to change plan'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
