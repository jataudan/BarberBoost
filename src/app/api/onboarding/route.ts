import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingStatus } from '@/lib/onboarding'

export type { OnboardingStatus } from '@/lib/onboarding'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const status = await getOnboardingStatus(shop.id)
  return NextResponse.json({ data: status })
}
