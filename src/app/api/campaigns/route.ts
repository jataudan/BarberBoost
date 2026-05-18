import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe/plans'
import type { PlanId } from '@/lib/stripe/plans'

// ── GET ───────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp     = request.nextUrl.searchParams
  const shopId = sp.get('shop_id')
  if (!shopId) return NextResponse.json({ error: 'shop_id required' }, { status: 400 })

  const { data: shop } = await supabase.from('shops').select('id').eq('id', shopId).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error, count } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact' })
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, meta: { total: count ?? 0 } })
}

// ── POST ──────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { shop_id, name, type, subject, content, target_segment, scheduled_at } = body

  if (!shop_id || !name?.trim()) {
    return NextResponse.json({ error: 'shop_id and name are required' }, { status: 400 })
  }

  const { data: shop } = await supabase.from('shops').select('id').eq('id', shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Plan limit check (campaigns per month)
  const { data: sub } = await supabase.from('subscriptions').select('plan')
    .eq('owner_id', user.id).in('status', ['active', 'trialing']).single()
  const plan         = ((sub?.plan as PlanId | null) ?? 'free') satisfies PlanId
  const maxCampaigns = PLANS[plan].limits.campaigns

  if (maxCampaigns === 0) {
    return NextResponse.json({ error: `Marketing campaigns require at least the Starter plan.`, code: 'PLAN_LIMIT_EXCEEDED', plan }, { status: 403 })
  }

  if (maxCampaigns !== -1) {
    // Count campaigns created this month
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const { count } = await supabase.from('campaigns').select('*', { count: 'exact', head: true })
      .eq('shop_id', shop_id).gte('created_at', monthStart.toISOString())
    if ((count ?? 0) >= maxCampaigns) {
      return NextResponse.json(
        { error: `Monthly campaign limit reached (${maxCampaigns} on ${PLANS[plan].name} plan).`, code: 'PLAN_LIMIT_EXCEEDED', plan, limit: maxCampaigns },
        { status: 403 }
      )
    }
  }

  const { data, error } = await supabase.from('campaigns').insert({
    shop_id, name: name.trim(),
    type:           type           || 'email',
    subject:        subject        || null,
    content:        content        || null,
    target_segment: target_segment || 'all',
    status:         scheduled_at ? 'scheduled' : 'draft',
    scheduled_at:   scheduled_at   || null,
    sent_count:     0,
    open_rate:      null,
    sent_at:        null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

// ── PATCH ─────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: existing } = await supabase.from('campaigns').select('shop_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: shop } = await supabase.from('shops').select('id').eq('id', existing.shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Explicit whitelist — prevents mass-assignment of shop_id, created_at, etc.
  const ALLOWED = ['name', 'type', 'subject', 'content', 'target_segment', 'status', 'scheduled_at', 'sent_count', 'open_rate', 'sent_at']
  const safeUpdates: Record<string, unknown> = {}
  for (const key of ALLOWED) {
    if (Object.prototype.hasOwnProperty.call(body, key)) safeUpdates[key] = body[key]
  }

  const { data, error } = await supabase.from('campaigns').update(safeUpdates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// ── DELETE ────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: existing } = await supabase.from('campaigns').select('shop_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: shop } = await supabase.from('shops').select('id').eq('id', existing.shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
