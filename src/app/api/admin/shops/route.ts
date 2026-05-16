import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url         = new URL(request.url)
  const page        = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit       = 20
  const offset      = (page - 1) * limit
  const search      = url.searchParams.get('q') ?? ''
  const plan        = url.searchParams.get('plan') ?? ''
  const adminStatus = url.searchParams.get('admin_status') ?? ''

  const supabase = await createServiceClient()

  // Plan filter: resolve shop IDs via subscriptions
  let shopIdFilter: string[] | null = null
  if (plan) {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('shop_id')
      .eq('plan', plan)
    shopIdFilter = subs?.map(s => s.shop_id) ?? []
    if (shopIdFilter.length === 0) return NextResponse.json({ shops: [], total: 0 })
  }

  let query = supabase
    .from('shops')
    .select('id, name, slug, email, phone, city, admin_status, created_at, owner_id, subscriptions(plan, status)', { count: 'exact' })

  if (search)      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`)
  if (adminStatus) query = query.eq('admin_status', adminStatus)
  if (shopIdFilter !== null) query = query.in('id', shopIdFilter)

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('[admin/shops] fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 })
  }

  return NextResponse.json({ shops: data ?? [], total: count ?? 0 })
}
