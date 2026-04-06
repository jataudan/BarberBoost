import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(shop as any)?.id) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('shop_id', (shop as any).id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(subscription as any)?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customer: (subscription as any).stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    })

    return NextResponse.redirect(portalSession.url, 303)
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json({ error: 'Failed to open billing portal' }, { status: 500 })
  }
}
