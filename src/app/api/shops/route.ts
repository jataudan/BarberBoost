import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET — fetch the authenticated user's shop ─────────────────────────────
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

// ── PATCH — update shop fields ────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Confirm the shop belongs to the caller
  const { data: existing } = await supabase.from('shops').select('id').eq('owner_id', user.id).single()
  if (!existing) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const body = await request.json()
  // Strip fields that must not be updated via this route
  const { id: _id, owner_id: _owner, created_at: _ca, updated_at: _ua, ...updates } = body

  const { data, error } = await supabase
    .from('shops')
    .update(updates)
    .eq('id', existing.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
