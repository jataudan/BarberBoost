import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anon'
  const { allowed } = rateLimit(`pub-review:${ip}`, 5, 300)
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  let body: { shop_id?: string; booking_id?: string; client_name?: string; rating?: number; comment?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { shop_id, booking_id, client_name, rating, comment } = body

  if (!shop_id || !client_name?.trim() || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'shop_id, client_name, and rating (1–5) are required' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { data: shop } = await supabase.from('shops').select('id').eq('id', shop_id).single()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  if (booking_id) {
    const { data: existing } = await supabase
      .from('reviews').select('id').eq('booking_id', booking_id).maybeSingle()
    if (existing) return NextResponse.json({ error: 'Review already submitted for this booking' }, { status: 409 })
  }

  const { error } = await supabase.from('reviews').insert({
    shop_id,
    booking_id: booking_id ?? null,
    client_id:  null,
    client_name: client_name.trim(),
    rating,
    comment:   comment?.trim() ?? null,
    is_public: false,
  })

  if (error) {
    console.error('[public/reviews] insert error:', error)
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
