import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executeCampaignSend } from '@/lib/campaigns'
import type { Campaign } from '@/types/database'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { campaign_id } = body
  if (!campaign_id) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaign_id)
    .single()

  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, phone')
    .eq('id', campaign.shop_id)
    .eq('owner_id', user.id)
    .single()

  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!['draft', 'scheduled'].includes(campaign.status)) {
    return NextResponse.json(
      { error: `Cannot send a campaign with status "${campaign.status}"` },
      { status: 400 }
    )
  }

  try {
    const result = await executeCampaignSend(campaign as Campaign, { name: shop.name, phone: shop.phone })
    return NextResponse.json({ data: result })
  } catch (err) {
    console.error('[campaigns/send] error:', err)
    return NextResponse.json({ error: 'Failed to send campaign' }, { status: 500 })
  }
}
