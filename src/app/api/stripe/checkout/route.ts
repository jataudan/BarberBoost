import { type NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanId } from '@/lib/stripe/plans'

const PAID_PLAN_IDS: PlanId[] = ['starter', 'pro', 'empire']

const VALID_PRICE_IDS = new Set(
  Object.values(PLANS).map(p => p.priceId).filter(Boolean) as string[]
)

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
    const priceId  = (isAnnual && (plan as any).annualPriceId) ? (plan as any).annualPriceId : plan.priceId
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
 * POST /api/stripe/checkout (form submission from billing settings)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body    = await request.formData()
    const priceId = body.get('priceId') as string
    if (!priceId) return NextResponse.json({ error: 'Price ID required' }, { status: 400 })
    if (!VALID_PRICE_IDS.has(priceId)) return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 })

    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await buildSession(priceId, user.id, user.email, (shop as any)?.id ?? '')
    return NextResponse.redirect(session.url!, 303)
  } catch (error) {
    console.error('[stripe/checkout POST]', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
