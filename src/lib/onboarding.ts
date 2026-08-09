import { createAdminClient } from './supabase/admin'

export interface OnboardingStatus {
  hasServices:     boolean
  hasStaff:        boolean
  hasOpeningHours: boolean
  hasBookings:     boolean
  hasClients:      boolean
  shopSlug:        string | null
}

/**
 * Shared by GET /api/onboarding (dashboard checklist) and the nurture cron
 * (setup_nudge condition) — takes a shopId directly rather than resolving one
 * from a session, since the cron has no user session to work with.
 */
export async function getOnboardingStatus(shopId: string): Promise<OnboardingStatus> {
  const supabase = createAdminClient()

  const [{ data: shop }, { count: svcCount }, { count: staffCount }, { count: bookCount }, { count: clientCount }] =
    await Promise.all([
      supabase.from('shops').select('slug, opening_hours').eq('id', shopId).single(),
      supabase.from('services').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
      supabase.from('staff').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
    ])

  const hours = (shop?.opening_hours ?? null) as Record<string, { closed?: boolean }> | null
  const hasOpeningHours = hours != null && Object.values(hours).some(d => !d.closed)

  return {
    hasServices:     (svcCount    ?? 0) > 0,
    hasStaff:        (staffCount  ?? 0) > 0,
    hasOpeningHours,
    hasBookings:     (bookCount   ?? 0) > 0,
    hasClients:      (clientCount ?? 0) > 0,
    shopSlug:        shop?.slug ?? null,
  }
}

/** The core "can this shop actually take a booking" steps — not usage milestones like hasBookings/hasClients. */
export function isSetupComplete(status: OnboardingStatus): boolean {
  return status.hasServices && status.hasStaff && status.hasOpeningHours
}
