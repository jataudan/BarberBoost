import { type NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanId } from '@/lib/stripe/plans'

const PAID_PLAN_IDS: PlanId[] = ['starter', 'pro', 'empire']

const VALID_PRICE_IDS = new Set([
  ...Object.values(PLANS).map(p => p.priceId),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...Object.values(PLANS).map(p => (p as any).annualPriceId),
].filter(Boolean) as string[])

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.app'

async function buildSession(priceId: string, userId: string, email: string | undefined, shopId: string) {
  return getStripe().checkout.sessions.create({
    mode:                 'subscription',
    payment_method_types: ['card'],
    line_items:           [{ price: priceId, quantity: 1 }],
    success_url:          `${APP_URL}/dashboard?upgraded=true`,
    cancel_url:           `${APP_URL}/settings/billing?canceled=true`,
    customer_email:       email,
    metadata:             { userId, shopId },
  })
}

/**
 * GET /api/stripe/checkout?plan=starter
 * Called from the auth callback after email confirmation for paid-plan signups.
 * Creates a Stripe Checkout session and redirects the user directly to Stripe.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    const planId = request.nextUrl.searchParams.get('plan') as PlanId | null
    if (!planId || !PAID_PLAN_IDS.includes(planId)) {
      return NextResponse.redirect(new URL('/settings/billing', request.url))
    }

    const isAnnual = request.nextUrl.searchParams.get('billing') === 'annual'
    const plan     = PLANS[planId]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const annualId = (plan as any).annualPriceId as string | undefined
    // Prefer the billing-matching price; fall back to whichever is configured
    const priceId  = isAnnual
      ? (annualId ?? plan.priceId)
      : (plan.priceId ?? annualId)
    if (!priceId) return NextResponse.redirect(new URL('/settings/billing?error=price_not_configured', request.url))

    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await buildSession(priceId, user.id, user.email, (shop as any)?.id ?? '')
    return NextResponse.redirect(session.url!, 303)
  } catch (err) {
    console.error('[stripe/checkout GET]', err)
    return NextResponse.redirect(new URL('/settings/billing?error=checkout_failed', request.url))
  }
}

/**
 * POST /api/stripe/checkout
 * Body (JSON): { planId: 'starter' | 'pro' | 'empire' }
 * Returns JSON { url } — client navigates to the Stripe Checkout URL.
 * Creates the shop row if the DB trigger hasn't fired yet.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Accept JSON body (new) or formData (legacy)
    const contentType = request.headers.get('content-type') ?? ''
    let planIdParam: string | null = null
    let rawPriceId:  string | null = null

    if (contentType.includes('application/json')) {
      const json = await request.json() as { planId?: string; priceId?: string }
      planIdParam = json.planId ?? null
      rawPriceId  = json.priceId ?? null
    } else {
      const body  = await request.formData()
      planIdParam = body.get('planId') as string | null
      rawPriceId  = body.get('priceId') as string | null
    }

    let priceId: string | null = null
    if (planIdParam && PAID_PLAN_IDS.includes(planIdParam as PlanId)) {
      const plan = PLANS[planIdParam as PlanId]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      priceId = plan.priceId ?? (plan as any).annualPriceId ?? null
    } else if (rawPriceId && VALID_PRICE_IDS.has(rawPriceId)) {
      priceId = rawPriceId
    }

    if (!priceId) return NextResponse.json({ error: 'Plan not configured — contact support.' }, { status: 400 })

    // Ensure the shop row exists (safeguard if DB trigger hasn't fired)
    let shopId = ''
    const { data: existingShop } = await supabase.from('shops').select('id').eq('owner_id', user.id).maybeSingle()
    if (existingShop) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shopId = (existingShop as any).id
    } else {
      const rawName = 'My Barbershop'
      const slug    = 'shop-' + user.id.slice(0, 8)
      const { data: newShop } = await supabase
        .from('shops')
        .insert({ owner_id: user.id, name: rawName, slug, email: user.email ?? null })
        .select('id')
        .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shopId = (newShop as any)?.id ?? ''
      if (shopId) {
        await supabase.from('subscriptions').insert({
          shop_id: shopId, owner_id: user.id, plan: 'free', status: 'active',
        })
      }
    }

    const session = await buildSession(priceId, user.id, user.email, shopId)

    // Return JSON so the client can navigate; also handle legacy form submissions
    if (contentType.includes('application/json')) {
      return NextResponse.json({ url: session.url })
    }
    return NextResponse.redirect(session.url!, 303)
  } catch (error) {
    console.error('[stripe/checkout POST]', error)
    const msg = error instanceof Error ? error.message : 'Failed to create checkout session'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
