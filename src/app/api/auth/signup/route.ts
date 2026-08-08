import { type NextRequest, NextResponse } from 'next/server'
import { welcomeEmail, newSignupAlert } from '@/lib/email/templates'
import { rateLimit } from '@/lib/rate-limit'
import { createServiceClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/config'
import { PLANS, TRIAL_PLAN_ID } from '@/lib/stripe/plans'
import { normaliseEmailForAbuseCheck } from '@/lib/trial'

const FROM   = process.env.RESEND_FROM_EMAIL ?? 'BarberBoost <noreply@barberboost.app>'
const NOTIFY = process.env.NOTIFY_EMAIL      ?? 'barberboost.app@gmail.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.app'

/**
 * Creates the Stripe Customer + 30-day trialing Subscription for a new
 * signup and mirrors the returned IDs onto the subscription row the
 * `handle_new_user()` trigger already created. Never throws — a Stripe
 * failure here must never block signup; the shop is simply left on the
 * trigger's placeholder row (no stripe_customer_id) until the nurture cron's
 * retry sweep picks it up.
 *
 * Returns { trialGranted, reason? } for the frontend to act on.
 */
async function startTrialForShop(userId: string, email: string, fullName: string) {
  const supabase = await createServiceClient()

  const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', userId).maybeSingle()
  if (!shop) {
    console.error('[api/auth/signup] startTrial: shop not found for userId', userId)
    return { trialGranted: false, reason: 'shop_not_found' as const }
  }
  const shopId = shop.id as string

  // Trial abuse guard — one trial per (normalised) email, ever.
  const normalisedEmail = normaliseEmailForAbuseCheck(email)
  const { data: priorTrial } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('trial_email_normalised', normalisedEmail)
    .not('trial_start', 'is', null)
    .maybeSingle()
  if (priorTrial) {
    console.warn('[api/auth/signup] startTrial: repeat trial blocked for', normalisedEmail)
    return { trialGranted: false, reason: 'trial_already_used' as const }
  }

  const priceId = PLANS[TRIAL_PLAN_ID].priceId
  if (!priceId) {
    console.error('[api/auth/signup] startTrial: no priceId configured for', TRIAL_PLAN_ID)
    return { trialGranted: false, reason: 'plan_not_configured' as const }
  }

  try {
    const stripe = getStripe()

    const customer = await stripe.customers.create(
      { email, name: fullName, metadata: { shop_id: shopId } },
      { idempotencyKey: `trial-customer-${shopId}` }
    )

    const subscription = await stripe.subscriptions.create(
      {
        customer: customer.id,
        items: [{ price: priceId }],
        trial_period_days: 30,
        trial_settings: { end_behavior: { missing_payment_method: 'pause' } },
      },
      { idempotencyKey: `trial-sub-${shopId}` }
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = subscription as any

    const { error: updateErr } = await supabase.from('subscriptions').update({
      stripe_customer_id:      customer.id,
      stripe_subscription_id:  sub.id,
      stripe_price_id:         priceId,
      plan:                    TRIAL_PLAN_ID,
      status:                  'trialing',
      trial_start:             new Date().toISOString(),
      trial_end:               sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      trial_email_normalised:  normalisedEmail,
      updated_at:              new Date().toISOString(),
    }).eq('shop_id', shopId)

    if (updateErr) {
      console.error('[api/auth/signup] startTrial: DB update error', updateErr)
      return { trialGranted: false, reason: 'db_update_failed' as const }
    }

    return { trialGranted: true as const }
  } catch (err) {
    console.error('[api/auth/signup] startTrial: Stripe error', err)
    return { trialGranted: false, reason: 'stripe_error' as const }
  }
}

/**
 * POST /api/auth/signup
 *
 * Sends the welcome email to the new user and an internal signup alert to
 * the BarberBoost team. The user is already created by the client calling
 * supabase.auth.signUp() — this endpoint only handles email dispatch, plus
 * (when startTrial is set) provisioning the 30-day no-card trial.
 *
 * Body: { email, fullName, shopName, plan?, shopSlug?, userId?, startTrial? }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`auth_signup:${ip}`, 10, 60)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
    )
  }

  try {
    const body = await request.json()
    const { email, fullName, shopName, plan, shopSlug, userId, startTrial } = body

    if (!email || !fullName || !shopName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let trialResult: Awaited<ReturnType<typeof startTrialForShop>> | null = null
    if (startTrial && userId) {
      trialResult = await startTrialForShop(userId, email, fullName)
    }

    const { Resend: ResendClient } = await import('resend')
    const resend = new ResendClient(process.env.RESEND_API_KEY)

    const slug        = shopSlug ?? ''
    const signedUpAt  = new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/London', dateStyle: 'full', timeStyle: 'short',
    })

    // Welcome email → new user
    const welcomeTmpl = welcomeEmail({
      ownerName:      fullName,
      shopName,
      bookingPageUrl: `${APP_URL}/booking/${slug}`,
      dashboardUrl:   `${APP_URL}/dashboard`,
      supportEmail:   process.env.SUPPORT_EMAIL ?? 'support@barberboost.app',
    })
    resend.emails.send({
      from: FROM, to: email,
      subject: welcomeTmpl.subject, html: welcomeTmpl.html, text: welcomeTmpl.text,
    }).catch((err: unknown) => console.error('[api/auth/signup] welcome email error:', err))

    // Internal alert → BarberBoost team
    const alertTmpl = newSignupAlert({ ownerName: fullName, shopName, email, signedUpAt })
    resend.emails.send({ from: FROM, to: NOTIFY, ...alertTmpl })
      .catch((err: unknown) => console.error('[api/auth/signup] alert email error:', err))

    return NextResponse.json({ success: true, ...trialResult })
  } catch (err) {
    console.error('[api/auth/signup]', err)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}
