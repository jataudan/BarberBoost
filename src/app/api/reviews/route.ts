import { NextResponse } from 'next/server'
import { getUser, getShop, createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shop = await getShop()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const url    = new URL(request.url)
  const page   = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit  = 20
  const offset = (page - 1) * limit

  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[reviews] fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }

  return NextResponse.json({ reviews: data ?? [], total: count ?? 0 })
}

export async function PATCH(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shop = await getShop()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  let body: { id?: string; is_public?: boolean }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id, is_public } = body
  if (!id || typeof is_public !== 'boolean') {
    return NextResponse.json({ error: 'id and is_public are required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Verify review belongs to this shop before updating
  const { data: review } = await supabase
    .from('reviews').select('id').eq('id', id).eq('shop_id', shop.id).maybeSingle()
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  const { error } = await supabase.from('reviews').update({ is_public }).eq('id', id)
  if (error) {
    console.error('[reviews] update error:', error)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
