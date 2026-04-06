import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe/plans'
import type { PlanId } from '@/lib/stripe/plans'

// ── GET — list services ───────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp     = request.nextUrl.searchParams
  const shopId = sp.get('shop_id')
  const id     = sp.get('id')

  if (!shopId && !id) return NextResponse.json({ error: 'shop_id or id required' }, { status: 400 })

  // Single service
  if (id) {
    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
    if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { data, error } = await supabase.from('services').select('*').eq('id', id).eq('shop_id', shop.id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ data })
  }

  // Verify ownership
  const { data: shop } = await supabase.from('shops').select('id').eq('id', shopId!).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error, count } = await supabase
    .from('services')
    .select('*', { count: 'exact' })
    .eq('shop_id', shopId!)
    .order('category', { ascending: true })
    .order('name',     { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, meta: { total: count ?? 0 } })
}

// ── POST — create service ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { shop_id, name, category, description, duration_minutes, price, colour, is_active, image_url } = body

  if (!shop_id || !name?.trim()) {
    return NextResponse.json({ error: 'shop_id and name are required' }, { status: 400 })
  }

  const { data: shop } = await supabase.from('shops').select('id').eq('id', shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Plan limit check
  const { data: sub } = await supabase.from('subscriptions').select('plan')
    .eq('owner_id', user.id).in('status', ['active', 'trialing']).single()
  const plan       = ((sub?.plan as PlanId | null) ?? 'free') satisfies PlanId
  const maxServices = PLANS[plan].limits.services

  if (maxServices !== -1) {
    const { count } = await supabase
      .from('services').select('*', { count: 'exact', head: true }).eq('shop_id', shop_id)
    if ((count ?? 0) >= maxServices) {
      return NextResponse.json(
        { error: `Service limit reached (${maxServices} on ${PLANS[plan].name} plan). Upgrade to add more.`, code: 'PLAN_LIMIT_EXCEEDED', plan, limit: maxServices },
        { status: 403 }
      )
    }
  }

  const { data, error } = await supabase.from('services').insert({
    shop_id, name: name.trim(),
    category:         category         || 'Haircut',
    description:      description      || null,
    duration_minutes: duration_minutes ?? 30,
    price:            price            ?? 0,
    colour:           colour           || '#c9a84c',
    is_active:        is_active        ?? true,
    image_url:        image_url        || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

// ── PATCH — update service ────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: existing } = await supabase.from('services').select('shop_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: shop } = await supabase.from('shops').select('id').eq('id', existing.shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase.from('services').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// ── DELETE — remove service ───────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: existing } = await supabase.from('services').select('shop_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: shop } = await supabase.from('shops').select('id').eq('id', existing.shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
