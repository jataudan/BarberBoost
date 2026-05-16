import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createServiceClient()

  const [
    { count: totalShops },
    { data: planData },
    { count: pastDueCount },
    { count: recentSignups },
    { count: suspendedCount },
    { count: disabledCount },
  ] = await Promise.all([
    supabase.from('shops').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('plan').in('status', ['active', 'trialing']),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'past_due'),
    supabase.from('shops').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('admin_status', 'suspended'),
    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('admin_status', 'disabled'),
  ])

  const planCounts = { free: 0, starter: 0, pro: 0, empire: 0 } as Record<string, number>
  ;(planData ?? []).forEach(s => {
    if (s.plan in planCounts) planCounts[s.plan]++
  })

  // Shops not on any active subscription are on the free plan
  const paidShops = planCounts.starter + planCounts.pro + planCounts.empire
  planCounts.free = Math.max(0, (totalShops ?? 0) - paidShops)

  const mrr = planCounts.starter * 19 + planCounts.pro * 39 + planCounts.empire * 79

  return NextResponse.json({
    totalShops:     totalShops     ?? 0,
    mrr,
    planCounts,
    pastDueCount:   pastDueCount   ?? 0,
    recentSignups:  recentSignups  ?? 0,
    suspendedCount: suspendedCount ?? 0,
    disabledCount:  disabledCount  ?? 0,
  })
}
