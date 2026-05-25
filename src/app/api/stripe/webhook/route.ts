import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe/config'
import { createServiceClient } from '@/lib/supabase/server'
import { getPlanByPriceId, PLANS } from '@/lib/stripe/plans'
import { subscriptionActivated } from '@/lib/email/templates'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

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

  const supabase = await createServiceClient()

  console.log(`[webhook] event: ${event.type} id=${event.id}`)

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

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub     = event.data.object as any
      const priceId = sub.items.data[0].price.id
      const plan    = getPlanByPriceId(priceId)

      console.log(`[webhook] ${event.type} subId=${sub.id} priceId=${priceId} resolved plan=${plan} status=${sub.status}`)

      // IMPORTANT: if the price ID is not in our plan map (e.g. env vars mismatch),
      // do NOT fall back to 'free' — that would silently downgrade paying customers.
      // Only update the plan when we can positively identify it.
      const planUpdate = plan ? { plan } : {}

      const { error: subUpdateErr } = await supabase.from('subscriptions').update({
        ...planUpdate,
        status:               sub.status,
        stripe_price_id:      priceId,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      }).eq('stripe_subscription_id', sub.id)

      if (subUpdateErr) console.error(`[webhook] ${event.type} update error:`, subUpdateErr)
      else if (!plan) console.warn(`[webhook] ${event.type}: priceId ${priceId} not in PLANS — status updated but plan left unchanged`)
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
  }

  return NextResponse.json({ received: true })
}
