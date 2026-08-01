import type { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanId } from './plans'

export interface DowngradeViolation {
  resource: string
  label:    string
  count:    number
  limit:    number
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

const CHECKS: Array<{ resource: string; label: string; table: string; activeOnly: boolean }> = [
  { resource: 'staff',    label: 'barbers',         table: 'staff',          activeOnly: true  },
  { resource: 'clients',  label: 'client profiles', table: 'clients',       activeOnly: false },
  { resource: 'services', label: 'services',        table: 'services',       activeOnly: false },
  { resource: 'styles',   label: 'haircut styles',  table: 'haircut_styles', activeOnly: true  },
]

/**
 * Checks current resource usage against a target (lower) plan's limits. Only checks
 * persistent resources that the owner would need to actively reduce — monthly-rolling
 * counters (campaigns, bookings) are excluded since they reset naturally right when
 * a scheduled downgrade takes effect at period end.
 */
export async function checkDowngradeLimits(
  supabase: SupabaseServerClient,
  shopId:   string,
  targetPlan: PlanId,
): Promise<DowngradeViolation[]> {
  const limits = PLANS[targetPlan].limits as unknown as Record<string, number>
  const violations: DowngradeViolation[] = []

  for (const check of CHECKS) {
    const limit = limits[check.resource] ?? -1
    if (limit === -1) continue

    let query = supabase.from(check.table).select('*', { count: 'exact', head: true }).eq('shop_id', shopId)
    if (check.activeOnly) query = query.eq('is_active', true)
    const { count } = await query

    if ((count ?? 0) > limit) {
      violations.push({ resource: check.resource, label: check.label, count: count ?? 0, limit })
    }
  }

  return violations
}
