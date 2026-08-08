import { NextResponse, after } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanByPriceId, PLANS } from '@/lib/stripe/plans'
import { subscriptionActivated } from '@/lib/email/templates'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

type AdminClient = ReturnType<typeof createAdminClient>

async function getResend() {
  const { Resend: ResendClient } = await import('resend')
  return { resend: new ResendClient(process.env.RESEND_API_KEY), FROM: process.env.RESEND_FROM_EMAIL! }
}

// ── Billing email helpers ─────────────────────────────────────────────────

function fmtAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(amount / 100)
}

async function sendPaymentFailedEmail(to: string, amount: number, currency: string, nextRetry: string | null) {
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:32px;background:#0f0f0f;font-family:Helvetica,Arial,sans-serif;color:#e4e4e7;">
    <div style="max-width:520px;margin:0 auto;background:#1a1a1a;border:1px solid #27272a;border-radius:12px;padding:32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:32px;margin-bottom:8px;">⚠️</div>
        <h1 style="margin:0;font-size:20px;font-weight:700;color:#ef4444;">Payment Failed</h1>
        <p style="margin:8px 0 0;font-size:14px;color:#71717a;">Your BarberBoost subscription payment could not be processed.</p>
      </div>
      <p style="font-size:14px;color:#e4e4e7;line-height:1.6;">Amount due: <strong>${fmtAmount(amount, currency)}</strong></p>
      ${nextRetry ? `<p style="font-size:13px;color:#71717a;">We will retry on ${nextRetry}.</p>` : ''}
      <p style="font-size:13px;color:#71717a;line-height:1.6;">Please update your payment method to avoid service interruption.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/billing" style="display:inline-block;margin-top:20px;background:#c9a84c;color:#000;text-decoration:none;font-weight:700;font-size:13px;padding:12px 24px;border-radius:8px;">UPDATE PAYMENT METHOD</a>
    </div>
  </body></html>`
  const { resend, FROM } = await getResend()
  resend.emails.send({ from: FROM, to, subject: '⚠️ BarberBoost payment failed — action required', html }).catch(() => {})
}

async function sendPaymentReceiptEmail(to: string, amount: number, currency: string, invoiceUrl: string | null) {
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:32px;background:#0f0f0f;font-family:Helvetica,Arial,sans-serif;color:#e4e4e7;">
    <div style="max-width:520px;margin:0 auto;background:#1a1a1a;border:1px solid #27272a;border-radius:12px;padding:32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:32px;margin-bottom:8px;">✓</div>
        <h1 style="margin:0;font-size:20px;font-weight:700;color:#e4e4e7;">Payment Received</h1>
        <p style="margin:8px 0 0;font-size:14px;color:#71717a;">Thank you — your BarberBoost subscription has been renewed.</p>
      </div>
      <p style="font-size:14px;color:#e4e4e7;line-height:1.6;">Amount paid: <strong>${fmtAmount(amount, currency)}</strong></p>
      ${invoiceUrl ? `<a href="${invoiceUrl}" style="display:inline-block;margin-top:20px;background:#c9a84c;color:#000;text-decoration:none;font-weight:700;font-size:13px;padding:12px 24px;border-radius:8px;">VIEW INVOICE</a>` : ''}
    </div>
  </body></html>`
  const { resend, FROM } = await getResend()
  resend.emails.send({ from: FROM, to, subject: 'BarberBoost payment receipt', html }).catch(() => {})
}

// ── Shared subscription field sync (used by both created + updated) ───────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncSubscriptionFromStripe(supabase: AdminClient, sub: any) {
  const priceId = sub.items.data[0].price.id
  const plan    = getPlanByPriceId(priceId)

  // IMPORTANT: if the price ID is not in our plan map (e.g. env vars mismatch),
  // do NOT fall back to 'free' — that would silently downgrade paying customers.
  const planUpdate = plan ? { plan } : {}

  // Once Stripe releases the schedule (a scheduled plan change has taken effect,
  // or it was cancelled/released outside our app), clear our pending-change columns.
  const scheduleUpdate = sub.schedule
    ? {}
    : { scheduled_plan: null, scheduled_price_id: null, stripe_schedule_id: null }

  const { error } = await supabase.from('subscriptions').update({
    ...planUpdate,
    ...scheduleUpdate,
    status:               sub.status,
    stripe_price_id:      priceId,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
  }).eq('stripe_subscription_id', sub.id)

  if (error) console.error('[webhook] subscription sync error:', error)
  else if (!plan) console.warn(`[webhook] priceId ${priceId} not in PLANS — status updated but plan left unchanged`)

  return { plan }
}

// ── Event processing (runs in after(), off the response path) ─────────────

async function processStripeEvent(event: Stripe.Event, supabase: AdminClient) {
  switch (event.type) {
    case 'checkout.session.completed': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = event.data.object as any
      const userId  = session.metadata?.userId as string | undefined
      const shopIdMeta = session.metadata?.shopId as string | undefined

      console.log(`[webhook] checkout.session.completed userId=${userId} shopId=${shopIdMeta} customer=${session.customer}`)

      if (!userId) {
        console.error('[webhook] checkout.session.completed: missing userId in metadata — plan cannot be updated')
        break
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscription = await getStripe().subscriptions.retrieve(session.subscription as string)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub          = subscription as any
      const priceId      = sub.items.data[0].price.id
      const plan         = getPlanByPriceId(priceId)

      console.log(`[webhook] checkout priceId=${priceId} resolved plan=${plan} subStatus=${sub.status}`)

      if (!plan) {
        console.error(`[webhook] checkout.session.completed: priceId ${priceId} not found in PLANS — check Stripe price IDs in Vercel env vars`)
        break
      }

      // Find shop by userId from metadata (most reliable), fall back to shopId
      let shopId = shopIdMeta
      if (!shopId) {
        const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', userId).maybeSingle()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        shopId = (shop as any)?.id
      }

      if (!shopId) {
        console.error(`[webhook] checkout.session.completed: shop not found for userId=${userId}`)
        break
      }

      const subData = {
        owner_id:               userId,
        stripe_customer_id:     session.customer as string,
        stripe_subscription_id: sub.id,
        stripe_price_id:        priceId,
        plan,
        status:                 sub.status,
        current_period_start:   new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end:     new Date(sub.current_period_end   * 1000).toISOString(),
        cancel_at_period_end:   sub.cancel_at_period_end,
        trial_end:              sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        updated_at:             new Date().toISOString(),
      }

      const { data: existingSubs } = await supabase
        .from('subscriptions').select('id').eq('shop_id', shopId)
        .order('updated_at', { ascending: false }).limit(1)
      const existingSub = existingSubs?.[0] ?? null

      if (existingSub) {
        const { error: updateErr } = await supabase.from('subscriptions').update(subData).eq('id', existingSub.id)
        if (updateErr) console.error('[webhook] subscription update error:', updateErr)
        else console.log(`[webhook] subscription updated → plan=${plan} status=${sub.status}`)
      } else {
        const { error: insertErr } = await supabase.from('subscriptions').insert({ shop_id: shopId, ...subData })
        if (insertErr) console.error('[webhook] subscription insert error:', insertErr)
        else console.log(`[webhook] subscription inserted → plan=${plan} status=${sub.status}`)
      }

      // Send subscription activated email
      const customerEmail = (session.customer_email as string | null)
        ?? await supabase.auth.admin.getUserById(userId)
            .then(({ data: u }) => u?.user?.email ?? null)
            .catch(() => null)

      if (customerEmail) {
        try {
          const { Resend: ResendClient } = await import('resend')
          const resend  = new ResendClient(process.env.RESEND_API_KEY)
          const FROM    = process.env.RESEND_FROM_EMAIL ?? 'BarberBoost <noreply@barberboost.app>'
          const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.app'
          const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const isAnnual  = Object.values(PLANS).some(p => (p as any).annualPriceId === priceId)
          const periodEnd = new Date(sub.current_period_end * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          const tmpl = subscriptionActivated({ ownerName: session.customer_details?.name ?? 'there', plan: planLabel, billing: isAnnual ? 'Annual' : 'Monthly', periodEnd, dashboardUrl: APP_URL + '/dashboard' })
          await resend.emails.send({ from: FROM, to: customerEmail, ...tmpl })
        } catch (emailEx) {
          console.error('[webhook] activation email error:', emailEx)
        }
      }
      break
    }

    case 'customer.subscription.created': {
      // Backstop: our signup route already writes the trial row synchronously
      // right after Stripe returns it, but this re-syncs from the source of
      // truth in case that write partially failed or drifted.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = event.data.object as any
      console.log(`[webhook] subscription.created subId=${sub.id} status=${sub.status}`)
      await syncSubscriptionFromStripe(supabase, sub)
      break
    }

    case 'customer.subscription.trial_will_end': {
      // Fires ~3 days before a trial ends (including trials Stripe extends).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = event.data.object as any
      console.log(`[webhook] trial_will_end subId=${sub.id} trial_end=${sub.trial_end}`)
      // TODO(Phase 5): queue the `trial_ending` lifecycle email — 3 days left,
      // what happens next, reassurance that data is kept.
      break
    }

    case 'customer.subscription.updated': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = event.data.object as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const previousStatus = (event.data as any).previous_attributes?.status as string | undefined

      console.log(`[webhook] ${event.type} subId=${sub.id} status=${previousStatus ?? '?'}→${sub.status} schedule=${sub.schedule ?? 'none'}`)

      await syncSubscriptionFromStripe(supabase, sub)

      const isConversion    = previousStatus === 'trialing' && sub.status === 'active'
      const isPausing       = previousStatus === 'trialing' && sub.status === 'paused'
      const isReactivating  = (previousStatus === 'paused' || previousStatus === 'canceled') && sub.status === 'active'

      if (isConversion || isPausing || isReactivating) {
        const lifecycleUpdate = isConversion
          ? { converted_at: new Date().toISOString() }
          : isPausing
            ? { paused_at: new Date().toISOString() }
            : { paused_at: null }

        const { error } = await supabase.from('subscriptions').update(lifecycleUpdate).eq('stripe_subscription_id', sub.id)
        if (error) console.error('[webhook] lifecycle timestamp update error:', error)
      }

      if (isConversion) {
        console.log(`[webhook] trial converted → converted_at set for subId=${sub.id}`)
        // TODO(Phase 5): fire the conversion email and cancel every remaining
        // trial/win-back nurture send queued for this shop.
      }
      if (isPausing) {
        console.log(`[webhook] trial paused (no payment method) → paused_at set for subId=${sub.id}`)
        // TODO(Phase 5): fire the `trial_ended` email — account is read-only,
        // data is safe, one click to reactivate.
      }
      if (isReactivating) {
        console.log(`[webhook] shop reactivated from ${previousStatus} for subId=${sub.id}`)
      }
      break
    }

    case 'customer.subscription.deleted': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = event.data.object as any

      console.log(`[webhook] ${event.type} subId=${sub.id} status=${sub.status}`)

      const { error: subDeleteErr } = await supabase.from('subscriptions').update({
        plan:                  'free',
        status:                sub.status,
        stripe_price_id:       null,
        cancel_at_period_end:  false,
        scheduled_plan:        null,
        scheduled_price_id:    null,
        stripe_schedule_id:    null,
        current_period_start:  new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end:    new Date(sub.current_period_end   * 1000).toISOString(),
      }).eq('stripe_subscription_id', sub.id)

      if (subDeleteErr) console.error(`[webhook] ${event.type} update error:`, subDeleteErr)
      break
    }

    case 'invoice.payment_failed': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inv         = event.data.object as any
      const customerEmail = inv.customer_email as string | null
      const nextRetry   = inv.next_payment_attempt
        ? new Date(inv.next_payment_attempt * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : null
      if (customerEmail) {
        await sendPaymentFailedEmail(customerEmail, inv.amount_due as number, inv.currency as string, nextRetry)
      }
      // Mark subscription past_due
      if (inv.subscription) {
        await supabase.from('subscriptions').update({ status: 'past_due' }).eq('stripe_subscription_id', inv.subscription as string)
      }
      break
    }

    case 'invoice.payment_succeeded': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inv         = event.data.object as any
      const customerEmail = inv.customer_email as string | null
      if (customerEmail && inv.billing_reason !== 'subscription_create') {
        // Only send receipt for renewals (not the initial charge — checkout handles that)
        await sendPaymentReceiptEmail(customerEmail, inv.amount_paid as number, inv.currency as string, inv.hosted_invoice_url as string | null)
      }
      // Ensure subscription status is active
      if (inv.subscription) {
        await supabase.from('subscriptions').update({ status: 'active' }).eq('stripe_subscription_id', inv.subscription as string)
      }
      break
    }

    case 'invoice.upcoming': {
      // Fires ~7 days before renewal — no subscription field changes here,
      // this is purely a heads-up hook.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inv = event.data.object as any
      console.log(`[webhook] invoice.upcoming subId=${inv.subscription} amountDue=${inv.amount_due}`)
      // TODO(Phase 5): fire a renewal heads-up email — most useful for the
      // annual-plan case where the upcoming charge is large.
      break
    }
  }
}

// ── Webhook handler ───────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body        = await request.text()
  const headersList = await headers()
  const signature   = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Idempotency: claim this event id before doing anything else. Stripe
  // retries deliveries, so a duplicate must be a safe no-op, not a replay.
  const { error: dedupeError } = await supabase.from('stripe_events').insert({ id: event.id, type: event.type })
  if (dedupeError) {
    if (dedupeError.code === '23505') {
      console.log(`[webhook] duplicate event ${event.id} (${event.type}) — skipping`)
      return NextResponse.json({ received: true, duplicate: true })
    }
    // Any other error (e.g. a transient DB hiccup) — log but still process;
    // losing the dedupe guarantee once is better than silently dropping a
    // real event.
    console.error('[webhook] stripe_events insert error:', dedupeError)
  }

  console.log(`[webhook] event: ${event.type} id=${event.id}`)

  // Acknowledge Stripe immediately; do the actual work after the response
  // has been sent so a slow downstream call (email, DB) never risks Stripe
  // timing out and retrying an event we already received.
  after(async () => {
    try {
      await processStripeEvent(event, supabase)
    } catch (err) {
      console.error(`[webhook] unhandled error processing ${event.type} (${event.id}):`, err)
    }
  })

  return NextResponse.json({ received: true })
}
