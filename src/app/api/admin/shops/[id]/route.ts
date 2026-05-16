import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import type { AdminStatus } from '@/types/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const supabase = await createServiceClient()

  const { data: shop, error: shopErr } = await supabase
    .from('shops').select('*').eq('id', id).single()
  if (shopErr || !shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const [
    { data: subscription },
    { count: bookingCount },
    { count: clientCount },
  ] = await Promise.all([
    supabase.from('subscriptions').select('*')
      .eq('shop_id', id).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('shop_id', id),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('shop_id', id),
  ])

  return NextResponse.json({
    shop,
    subscription,
    stats: { bookings: bookingCount ?? 0, clients: clientCount ?? 0 },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  let body: { admin_status?: AdminStatus }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { admin_status } = body
  if (!admin_status || !(['active', 'suspended', 'disabled'] as AdminStatus[]).includes(admin_status)) {
    return NextResponse.json({ error: 'Valid admin_status required' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { error } = await supabase.from('shops').update({ admin_status }).eq('id', id)

  if (error) {
    console.error('[admin/shops/id] patch error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
