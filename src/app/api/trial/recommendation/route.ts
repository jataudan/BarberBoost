import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrialRecommendation } from '@/lib/trial-recommendation'

/**
 * GET /api/trial/recommendation
 *
 * Returns a plan recommendation for the current shop based on actual trial
 * usage (chairs staffed, bookings taken since trial_start).
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('trial_start')
    .eq('shop_id', shop.id)
    .order('updated_at', { ascending: false })
    .limit(1)

  const recommendation = await getTrialRecommendation(shop.id, subs?.[0]?.trial_start ?? null)
  return NextResponse.json({ data: recommendation })
}
