import { type NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { executeCampaignSend } from '@/lib/campaigns'
import type { Campaign } from '@/types/database'

export const runtime     = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth       = request.headers.get('authorization') ?? ''
  if (!cronSecret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const expected = Buffer.from(`Bearer ${cronSecret}`)
  const actual   = Buffer.from(auth)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now      = new Date().toISOString()

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)

  if (error) {
    console.error('[cron/campaigns] fetch error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!campaigns?.length) {
    return NextResponse.json({ sent: 0, message: 'No scheduled campaigns due' })
  }

  const shopIds = [...new Set(campaigns.map((c: Campaign) => c.shop_id))]
  const { data: shops } = await supabase
    .from('shops')
    .select('id, name, phone')
    .in('id', shopIds)

  const shopMap = new Map((shops ?? []).map((s: { id: string; name: string; phone: string | null }) => [s.id, s]))

  const results = { sent: 0, errors: 0 }

  for (const campaign of campaigns as Campaign[]) {
    const shop = shopMap.get(campaign.shop_id)
    if (!shop) {
      console.error(`[cron/campaigns] shop not found for campaign ${campaign.id}`)
      results.errors++
      continue
    }
    try {
      const result = await executeCampaignSend(campaign, { name: shop.name, phone: shop.phone })
      console.log(`[cron/campaigns] campaign ${campaign.id} sent to ${result.sentCount} recipients`)
      results.sent++
    } catch (err) {
      console.error(`[cron/campaigns] campaign ${campaign.id} failed:`, err)
      results.errors++
    }
  }

  console.log(`[cron/campaigns] done — sent: ${results.sent}, errors: ${results.errors}`)
  return NextResponse.json(results)
}
