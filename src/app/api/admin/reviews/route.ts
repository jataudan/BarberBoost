import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url    = new URL(request.url)
  const page   = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit  = 20
  const offset = (page - 1) * limit

  const supabase = await createServiceClient()
  const { data, error, count } = await supabase
    .from('platform_reviews')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[admin/reviews] fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }

  return NextResponse.json({ reviews: data ?? [], total: count ?? 0 })
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { id?: string; is_approved?: boolean }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id, is_approved } = body
  if (!id || typeof is_approved !== 'boolean') {
    return NextResponse.json({ error: 'id and is_approved are required' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('platform_reviews')
    .update({ is_approved })
    .eq('id', id)

  if (error) {
    console.error('[admin/reviews] update error:', error)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
