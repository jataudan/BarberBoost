import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe/plans'
import type { PlanId } from '@/lib/stripe/plans'

// ── Auto-tag logic (mirrors the spec) ────────────────────────────────────
function computeTags(
  totalVisits: number,
  totalSpent: number,
  lastVisit: string | null,
  recentVisits: number   // visits in last 90 days
): string[] {
  const tags: string[] = []
  const now = new Date()
  const daysSinceLast = lastVisit
    ? Math.floor((now.getTime() - new Date(lastVisit).getTime()) / 86_400_000)
    : 999

  if (totalVisits <= 1)   tags.push('New')
  if (recentVisits >= 5)  tags.push('Regular')
  if (totalSpent >= 500)  tags.push('VIP')
  if (daysSinceLast >= 60 && totalVisits > 1) tags.push('At-risk')

  return tags
}

// ── GET — list clients ────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp       = request.nextUrl.searchParams
  const shopId   = sp.get('shop_id')
  const search   = sp.get('search')
  const tag      = sp.get('tag')
  const page     = Math.max(1, parseInt(sp.get('page') ?? '1'))
  const limit    = Math.min(200, parseInt(sp.get('limit') ?? '100'))
  const sortBy   = sp.get('sort') ?? 'name'
  const id       = sp.get('id')

  if (!shopId && !id) return NextResponse.json({ error: 'shop_id or id required' }, { status: 400 })

  // Single client by id
  if (id) {
    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
    if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('shop_id', shop.id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ data })
  }

  // Verify ownership
  const { data: shop } = await supabase.from('shops').select('id').eq('id', shopId!).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('shop_id', shopId!)
    .range((page - 1) * limit, page * limit - 1)

  // Search
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  // Tag filter (tags is a text[] column)
  if (tag) {
    query = query.contains('tags', [tag])
  }

  // Sort
  if (sortBy === 'last_visit')   query = query.order('last_visit', { ascending: false, nullsFirst: false })
  else if (sortBy === 'spent')   query = query.order('total_spent', { ascending: false })
  else if (sortBy === 'visits')  query = query.order('total_visits', { ascending: false })
  else                           query = query.order('name', { ascending: true })

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) },
  })
}

// ── POST — create client ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { shop_id, name, email, phone, date_of_birth, preferred_barber_id,
          tags, notes, marketing_consent } = body

  if (!shop_id || !name?.trim()) {
    return NextResponse.json({ error: 'shop_id and name are required' }, { status: 400 })
  }

  // Ownership check
  const { data: shop } = await supabase.from('shops').select('id').eq('id', shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Plan limit check
  const { data: sub } = await supabase.from('subscriptions').select('plan')
    .eq('owner_id', user.id).in('status', ['active', 'trialing']).single()
  const plan     = ((sub?.plan as PlanId | null) ?? 'free') satisfies PlanId
  const maxClients = PLANS[plan].limits.clients  // -1 = unlimited

  if (maxClients !== -1) {
    const { count } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shop_id)
    if ((count ?? 0) >= maxClients) {
      return NextResponse.json(
        {
          error:   `Client limit reached (${maxClients} on the ${PLANS[plan].name} plan). Upgrade to add more clients.`,
          code:    'PLAN_LIMIT_EXCEEDED',
          plan,
          limit:   maxClients,
        },
        { status: 403 }
      )
    }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      shop_id, name: name.trim(),
      email:             email   || null,
      phone:             phone   || null,
      date_of_birth:     date_of_birth || null,
      preferred_barber_id: preferred_barber_id || null,
      tags:              tags ?? ['New'],
      notes:             notes  || null,
      marketing_consent: marketing_consent ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

// ── PATCH — update client ─────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Ownership
  const { data: existing } = await supabase.from('clients').select('shop_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: shop } = await supabase.from('shops').select('id').eq('id', existing.shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Recompute tags if stats-affecting fields changed
  if ('total_visits' in updates || 'total_spent' in updates || 'last_visit' in updates) {
    const { data: current } = await supabase.from('clients').select('total_visits,total_spent,last_visit').eq('id', id).single()
    if (current) {
      const visits = updates.total_visits ?? current.total_visits
      const spent  = updates.total_spent  ?? current.total_spent
      const last   = updates.last_visit   ?? current.last_visit

      // Count recent visits (last 90 days)
      const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      const { count: recentCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', id)
        .eq('status', 'completed')
        .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))

      updates.tags = computeTags(visits, spent, last, recentCount ?? 0)
    }
  }

  const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// ── DELETE — remove client ────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: existing } = await supabase.from('clients').select('shop_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: shop } = await supabase.from('shops').select('id').eq('id', existing.shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
