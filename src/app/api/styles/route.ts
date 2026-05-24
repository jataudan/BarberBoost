import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe/plans'
import type { PlanId } from '@/lib/stripe/plans'

// ── GET — list haircut styles for a shop ─────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = request.nextUrl.searchParams.get('shop_id')
  if (!shopId) return NextResponse.json({ error: 'shop_id is required' }, { status: 400 })

  const { data: shop } = await supabase
    .from('shops').select('id').eq('id', shopId).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('haircut_styles')
    .select('*')
    .eq('shop_id', shopId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// ── POST — create a haircut style ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    shop_id: string
    title: string
    description?: string
    image_url: string
    tags?: string[]
    barber_ids?: string[]
    display_order?: number
  }

  const { shop_id, title, description, image_url, tags, barber_ids, display_order } = body

  if (!shop_id || !title?.trim() || !image_url?.trim()) {
    return NextResponse.json({ error: 'shop_id, title, and image_url are required' }, { status: 400 })
  }

  const { data: shop } = await supabase
    .from('shops').select('id').eq('id', shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Plan limit check
  const { data: sub } = await supabase
    .from('subscriptions').select('plan')
    .eq('owner_id', user.id).in('status', ['active', 'trialing']).single()
  const plan      = ((sub?.plan as PlanId | null) ?? 'free') satisfies PlanId
  const maxStyles = (PLANS[plan].limits as Record<string, unknown>).styles as number ?? 0

  if (maxStyles === 0) {
    return NextResponse.json(
      { error: 'Haircut styles require Starter plan or above. Upgrade to unlock this feature.', code: 'PLAN_LIMIT_EXCEEDED', plan },
      { status: 403 }
    )
  }

  if (maxStyles !== -1) {
    const { count } = await supabase
      .from('haircut_styles').select('*', { count: 'exact', head: true })
      .eq('shop_id', shop_id).eq('is_active', true)
    if ((count ?? 0) >= maxStyles) {
      return NextResponse.json(
        { error: `Style limit reached (${maxStyles} on ${PLANS[plan].name} plan). Upgrade to add more.`, code: 'PLAN_LIMIT_EXCEEDED', plan, limit: maxStyles },
        { status: 403 }
      )
    }
  }

  const { data, error } = await supabase
    .from('haircut_styles')
    .insert({
      shop_id,
      title:         title.trim(),
      description:   description?.trim() || null,
      image_url:     image_url.trim(),
      tags:          tags          ?? [],
      barber_ids:    barber_ids    ?? [],
      display_order: display_order ?? 0,
      is_active:     true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

// ── PATCH — update a haircut style ────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as Record<string, unknown>
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  // Ownership via shop join
  const { data: existing } = await supabase
    .from('haircut_styles').select('shop_id').eq('id', id as string).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: shop } = await supabase
    .from('shops').select('id').eq('id', existing.shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Sanitise text fields if present
  if (typeof updates.title === 'string') updates.title = updates.title.trim()
  if (typeof updates.description === 'string') updates.description = updates.description.trim() || null

  const { data, error } = await supabase
    .from('haircut_styles').update(updates).eq('id', id as string).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// ── DELETE — remove a haircut style ──────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('haircut_styles').select('shop_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: shop } = await supabase
    .from('shops').select('id').eq('id', existing.shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('haircut_styles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
