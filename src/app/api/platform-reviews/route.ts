import { NextResponse } from 'next/server'
import { getUser, getShop, getSubscription, createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('platform_reviews')
    .select('id, shop_name, plan, rating, comment, created_at')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(12)

  if (error) {
    console.error('[platform-reviews] fetch error:', error)
    return NextResponse.json({ reviews: [] })
  }

  return NextResponse.json({ reviews: data ?? [] })
}

export async function POST(request: Request) {
  const { user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shop = await getShop()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const subscription = await getSubscription()
  const plan = subscription?.plan ?? 'free'

  let body: { rating?: number; comment?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { rating, comment } = body
  if (!rating || rating < 1 || rating > 5 || !comment?.trim() || comment.trim().length < 20) {
    return NextResponse.json(
      { error: 'A rating (1–5) and a comment of at least 20 characters are required' },
      { status: 400 },
    )
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('platform_reviews').select('id').eq('owner_id', user.id).maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'You have already submitted a review' }, { status: 409 })
  }

  const { error } = await supabase.from('platform_reviews').insert({
    owner_id:  user.id,
    shop_name: shop.name,
    plan,
    rating,
    comment:   comment.trim(),
  })

  if (error) {
    console.error('[platform-reviews] insert error:', error)
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
