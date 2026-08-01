import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import { releaseSubscriptionSchedule } from '@/lib/stripe/schedule'

/**
 * POST /api/stripe/cancel-scheduled-change
 *
 * Undoes a pending plan change scheduled via /api/stripe/change-plan — releases the
 * Stripe Subscription Schedule and/or un-sets cancel_at_period_end, whichever is
 * pending, and clears the scheduling columns on the DB row.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }
    if (!sub.scheduled_plan && !sub.cancel_at_period_end) {
      return NextResponse.json({ error: 'No pending plan change to cancel' }, { status: 400 })
    }

    const stripe = getStripe()

    if (sub.stripe_schedule_id) {
      await releaseSubscriptionSchedule(stripe, sub.stripe_schedule_id).catch(() => {})
    }
    if (sub.cancel_at_period_end) {
      await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: false })
    }

    await supabase.from('subscriptions').update({
      scheduled_plan:       null,
      scheduled_price_id:   null,
      stripe_schedule_id:   null,
      cancel_at_period_end: false,
      updated_at:           new Date().toISOString(),
    }).eq('id', sub.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[stripe/cancel-scheduled-change]', error)
    const msg = error instanceof Error ? error.message : 'Failed to cancel scheduled change'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
