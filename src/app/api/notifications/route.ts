import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET — list notifications for the shop ────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const sp      = request.nextUrl.searchParams
  const unread  = sp.get('unread') === 'true'
  const limit   = Math.min(parseInt(sp.get('limit') ?? '30', 10), 100)

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unread) query = query.eq('is_read', false)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

// ── PATCH — mark notification(s) as read ─────────────────────────────────
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const body = await request.json() as { id?: string; all?: boolean }

  if (body.all) {
    await supabase.from('notifications').update({ is_read: true }).eq('shop_id', shop.id).eq('is_read', false)
    return NextResponse.json({ success: true })
  }

  if (body.id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', body.id).eq('shop_id', shop.id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'id or all required' }, { status: 400 })
}
