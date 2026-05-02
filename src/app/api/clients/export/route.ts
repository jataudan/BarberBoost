import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function escapeCSV(value: string | null | undefined): string {
  const s = value ?? ''
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shopId = request.nextUrl.searchParams.get('shop_id')
  if (!shopId) return NextResponse.json({ error: 'shop_id is required' }, { status: 400 })

  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_id', user.id)
    .single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: clients, error } = await supabase
    .from('clients')
    .select('name, email, phone, notes, tags, total_visits, total_spent, created_at')
    .eq('shop_id', shopId)
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (clients ?? []).map((c) => [
    escapeCSV(c.name),
    escapeCSV(c.email),
    escapeCSV(c.phone),
    escapeCSV(c.notes),
    escapeCSV((c.tags as string[] ?? []).join('; ')),
    String(c.total_visits ?? 0),
    String(c.total_spent ?? 0),
    escapeCSV(c.created_at ? new Date(c.created_at).toISOString().slice(0, 10) : ''),
  ].join(','))

  const header = 'name,email,phone,notes,tags,total_visits,total_spent,created_at'
  const csv    = [header, ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv',
      'Content-Disposition': 'attachment; filename="clients.csv"',
    },
  })
}
