import { type NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/config'

export const runtime    = 'nodejs'
export const maxDuration = 60

/** Same grace window used by getEntitlement() — keep these in sync. */
const PAST_DUE_GRACE_DAYS = 7

/**
 * GET /api/cron/past-due-sweep — runs daily.
 *
 * Finds subscriptions that have been past_due/incomplete/unpaid for more
 * than the grace window and actively cancels them in Stripe, rather than
 * just leaving our app read-only while Stripe keeps quietly retrying a dead
 * card in the background. This route never writes subscription state itself
 * — cancelling fires `customer.subscription.deleted`, and the webhook
 * handler is the only thing that mirrors the resulting status into our DB.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth       = request.headers.get('authorization') ?? ''
  if (!cronSecret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const expected = Buffer.from(`Bearer ${cronSecret}`)
  const actual   = Buffer.from(auth)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const stripe    = getStripe()

  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id, stripe_subscription_id, status, current_period_end, created_at')
    .in('status', ['past_due', 'incomplete', 'unpaid'])
    .not('stripe_subscription_id', 'is', null)

  if (error) {
    console.error('[cron/past-due-sweep] fetch error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const now = Date.now()
  const results = { checked: subs?.length ?? 0, cancelled: 0, errors: 0 }

  for (const sub of subs ?? []) {
    const anchor      = new Date(sub.current_period_end ?? sub.created_at)
    const graceCutoff = anchor.getTime() + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000
    if (now <= graceCutoff) continue

    try {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id as string)
      results.cancelled++
    } catch (err) {
      console.error(`[cron/past-due-sweep] cancel error for ${sub.stripe_subscription_id}:`, err)
      results.errors++
    }
  }

  console.log(`[cron/past-due-sweep] done — checked: ${results.checked}, cancelled: ${results.cancelled}, errors: ${results.errors}`)
  return NextResponse.json(results)
}
