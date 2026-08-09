import { createAdminClient } from './supabase/admin'

export interface TrialStats {
  bookingsCount: number
  revenueBooked: number
  hoursSaved:    number
  noShowCount:   number
}

/**
 * Real usage numbers for a shop since its trial started — used by
 * value_recap and the win-back emails. Deliberately simple: bookings taken,
 * revenue booked, a defensible (not precision) hours-saved estimate, and
 * no-show count.
 */
export async function getTrialStats(shopId: string, trialStart: string | null): Promise<TrialStats> {
  const supabase = createAdminClient()
  const since = trialStart ?? '1970-01-01'

  const { data } = await supabase
    .from('bookings')
    .select('price, status')
    .eq('shop_id', shopId)
    .gte('created_at', since)

  const rows = data ?? []
  const counted = rows.filter(b => b.status !== 'cancelled')
  const bookingsCount = counted.length
  const revenueBooked = counted.reduce((sum, b) => sum + (b.price ?? 0), 0)
  const noShowCount = rows.filter(b => b.status === 'no_show').length

  // Simple, defensible estimate: each online booking saves ~5 minutes of
  // phone/admin time versus taking it manually. Not a precision metric.
  const hoursSaved = Math.round((bookingsCount * 5 / 60) * 10) / 10

  return { bookingsCount, revenueBooked, hoursSaved, noShowCount }
}
