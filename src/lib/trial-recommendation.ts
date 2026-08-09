import { createAdminClient } from './supabase/admin'
import { PLANS, type PlanId } from './stripe/plans'

export interface TrialRecommendation {
  plan:          Exclude<PlanId, 'free'>
  reason:        string
  staffCount:    number
  bookingsCount: number
}

/**
 * Recommends a paid plan from the shop's actual trial usage (chairs staffed,
 * bookings taken since the trial started) rather than just defaulting to
 * whichever plan the trial happened to run on.
 */
export async function getTrialRecommendation(shopId: string, trialStart: string | null): Promise<TrialRecommendation> {
  const supabase = createAdminClient()

  const [{ count: staffCount }, { count: bookingsCount }] = await Promise.all([
    supabase.from('staff').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).eq('is_active', true),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('shop_id', shopId)
      .gte('created_at', trialStart ?? '1970-01-01'),
  ])

  const staff    = staffCount ?? 0
  const bookings = bookingsCount ?? 0
  const chairWord = staff === 1 ? 'chair' : 'chairs'
  const bookingWord = bookings === 1 ? 'booking' : 'bookings'

  const fitsStarter = staff <= PLANS.starter.limits.staff && bookings <= PLANS.starter.limits.bookings_per_month
  const fitsPro      = staff <= PLANS.pro.limits.staff // Pro's bookings/services/clients are already unlimited

  if (fitsStarter) {
    return {
      plan: 'starter', staffCount: staff, bookingsCount: bookings,
      reason: `You've taken ${bookings} ${bookingWord} across ${staff} ${chairWord} — Starter covers this comfortably.`,
    }
  }
  if (fitsPro) {
    return {
      plan: 'pro', staffCount: staff, bookingsCount: bookings,
      reason: `You've taken ${bookings} ${bookingWord} across ${staff} ${chairWord} — Pro fits you.`,
    }
  }
  return {
    plan: 'empire', staffCount: staff, bookingsCount: bookings,
    reason: `With ${staff} ${chairWord} and ${bookings} ${bookingWord}, Empire gives you room to keep growing.`,
  }
}
