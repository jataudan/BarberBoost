import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanId } from '@/lib/stripe/plans'

const PAID_PLANS: PlanId[] = ['starter', 'pro', 'empire']
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.app'

/**
 * POST /api/stripe/convert-trial
 * Body: { planId: 'starter' | 'pro' | 'empire' }
 *
 * The subscription already exists (created trialing at signup) — this is not
 * a new-subscription flow, it's card capture (Checkout in `mode: 'setup'`)
 * plus a price change. The actual price change + trial preservation happens
 * in the checkout.session.completed webhook once the card is attached, so
 * this route only ever creates the Checkout session.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId } = await request.json() as { planId: PlanId }
    if (!planId || !PAID_PLANS.includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('shop_id', shop.id)
      .order('updated_at', { ascending: false })
      .limit(1)
    const sub = subs?.[0]

    if (!sub?.stripe_customer_id || !sub?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No trial subscription found to convert' }, { status: 404 })
    }

    if (sub.status !== 'trialing' && sub.status !== 'paused') {
      return NextResponse.json(
        { error: 'This shop already has an active subscription — use the plan cards or Manage Billing instead.' },
        { status: 400 }
      )
    }

    const newPriceId = PLANS[planId].priceId
    if (!newPriceId) return NextResponse.json({ error: 'Plan not configured' }, { status: 400 })

    const flow = sub.status === 'paused' ? 'reactivate' : 'convert'

    const session = await getStripe().checkout.sessions.create({
      mode:                 'setup',
      customer:              sub.stripe_customer_id,
      payment_method_types: ['card'],
      success_url:          `${APP_URL}/dashboard?${flow === 'reactivate' ? 'reactivated' : 'converted'}=true`,
      cancel_url:            `${APP_URL}/settings/billing?canceled=true`,
      metadata:              { userId: user.id, shopId: shop.id, planId, flow },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[stripe/convert-trial]', error)
    const msg = error instanceof Error ? error.message : 'Failed to start checkout'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
