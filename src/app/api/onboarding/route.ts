import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface OnboardingStatus {
  hasServices:      boolean
  hasStaff:         boolean
  hasOpeningHours:  boolean
  hasBookings:      boolean
  hasClients:       boolean
  shopSlug:         string | null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: shop } = await supabase
    .from('shops')
    .select('id, slug, opening_hours')
    .eq('owner_id', user.id)
    .single()

  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const [
    { count: svcCount },
    { count: staffCount },
    { count: bookCount },
    { count: clientCount },
  ] = await Promise.all([
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id),
    supabase.from('staff').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id),
  ])

  const hours = shop.opening_hours as Record<string, { closed?: boolean }> | null
  const hasOpeningHours = hours != null && Object.values(hours).some(d => !d.closed)

  const status: OnboardingStatus = {
    hasServices:     (svcCount   ?? 0) > 0,
    hasStaff:        (staffCount ?? 0) > 0,
    hasOpeningHours,
    hasBookings:     (bookCount   ?? 0) > 0,
    hasClients:      (clientCount ?? 0) > 0,
    shopSlug:        shop.slug ?? null,
  }

  return NextResponse.json({ data: status })
}
