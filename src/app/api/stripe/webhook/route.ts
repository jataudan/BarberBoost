import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Resend } from 'resend'
import { stripe } from '@/lib/stripe/config'
import { createServiceClient } from '@/lib/supabase/server'
import { getPlanByPriceId } from '@/lib/stripe/plans'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

function getResend() {
  return { resend: new Resend(process.env.RESEND_API_KEY), FROM: process.env.RESEND_FROM_EMAIL! }
}

// ── Billing email helpers ─────────────────────────────────────────────────

function fmtAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(amount / 100)
}

function sendPaymentFailedEmail(to: string, amount: number, currency: string, nextRetry: string | null) {
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
  const { resend, FROM } = getResend()
  resend.emails.send({ from: FROM, to, subject: '⚠️ BarberBoost payment failed — action required', html }).catch(() => {})
}

function sendPaymentReceiptEmail(to: string, amount: number, currency: string, invoiceUrl: string | null) {
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
  const { resend, FROM } = getResend()
  resend.emails.send({ from: FROM, to, subject: 'BarberBoost payment receipt', html }).catch(() => {})
}

// ── Webhook handler ───────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body        = await request.text()
  const headersList = await headers()
  const signature   = headersList.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session      = event.data.object as any
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub          = subscription as any
      const priceId      = sub.items.data[0].price.id
      const plan         = getPlanByPriceId(priceId)

      const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', session.metadata?.userId).single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((shop as any)?.id && plan) {
        await supabase.from('subscriptions').upsert({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          shop_id:                 (shop as any).id,
          owner_id:                session.metadata?.userId,
          stripe_customer_id:      session.customer as string,
          stripe_subscription_id:  sub.id,
          stripe_price_id:         priceId,
          plan,
          status:                  sub.status,
          current_period_start:    new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end:      new Date(sub.current_period_end   * 1000).toISOString(),
          cancel_at_period_end:    sub.cancel_at_period_end,
          trial_end:               sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        })
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub     = event.data.object as any
      const priceId = sub.items.data[0].price.id
      const plan    = getPlanByPriceId(priceId)
      await supabase.from('subscriptions').update({
        status:               sub.status,
        plan:                 plan ?? 'free',
        stripe_price_id:      priceId,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      }).eq('stripe_subscription_id', sub.id)
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
        sendPaymentFailedEmail(customerEmail, inv.amount_due as number, inv.currency as string, nextRetry)
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
        sendPaymentReceiptEmail(customerEmail, inv.amount_paid as number, inv.currency as string, inv.hosted_invoice_url as string | null)
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
