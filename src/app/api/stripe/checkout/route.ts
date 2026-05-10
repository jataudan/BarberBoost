import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe/plans'

const VALID_PRICE_IDS = new Set(
  Object.values(PLANS).map(p => p.priceId).filter(Boolean) as string[]
)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body    = await request.formData()
    const priceId = body.get('priceId') as string
    if (!priceId) return NextResponse.json({ error: 'Price ID required' }, { status: 400 })
    if (!VALID_PRICE_IDS.has(priceId)) return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 })

    // Get shop for metadata
    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()

    const session = await getStripe().checkout.sessions.create({
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items:           [{ price: priceId, quantity: 1 }],
      success_url:          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url:           `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
      customer_email:       user.email,
      metadata: {
        userId: user.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        shopId: (shop as any)?.id ?? '',
      },
    })

    return NextResponse.redirect(session.url!, 303)
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
