import { type NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { attemptNurtureSend, unsubscribeUrl } from '@/lib/nurture'
import { getOnboardingStatus, isSetupComplete } from '@/lib/onboarding'
import { getTrialStats } from '@/lib/trial-stats'
import { getTrialRecommendation } from '@/lib/trial-recommendation'
import { PLANS } from '@/lib/stripe/plans'
import * as templates from '@/lib/email/templates'

export const runtime    = 'nodejs'
export const maxDuration = 60

const DAY_MS  = 24 * 60 * 60 * 1000
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.app'
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@barberboost.app'

interface ShopContext {
  shopId:       string
  shopName:     string
  ownerName:    string
  ownerEmail:   string
  currency:     string
  daysSince:    number
  trialStart:   string
}

type Template = { subject: string; html: string; text?: string }

interface Attempt {
  key:   string
  minDay: number
  build: () => Promise<Template | null> | Template | null
}

/**
 * Attempts each eligible key in schedule order, stopping at the first send,
 * the first 'too_recent'/'opted_out'/'converted' suppression (nothing later
 * would pass either), or the end of the list. This is what makes the 48h
 * spacing rule work without separate catch-up bookkeeping. The per-(shop,key)
 * suppression/claim/send/mark pipeline itself lives in attemptNurtureSend()
 * — shared with the webhook's event-driven sends.
 */
async function runSchedule(ctx: ShopContext, attempts: Attempt[]) {
  const results: Array<{ key: string; sent: boolean; reason?: string }> = []

  for (const attempt of attempts) {
    if (ctx.daysSince < attempt.minDay) continue

    const result = await attemptNurtureSend(ctx.shopId, ctx.ownerEmail, attempt.key, attempt.build)
    results.push({ key: attempt.key, ...result })

    if (result.sent) break // one lifecycle email per shop per run
    // too_recent/opted_out/converted mean every later key would fail the
    // same way this run — stop instead of burning DB round-trips checking them.
    if (result.reason === 'too_recent' || result.reason === 'opted_out' || result.reason === 'converted') break
  }

  return results
}

function trialAttempts(ctx: ShopContext): Attempt[] {
  const base = { shopName: ctx.shopName, ownerName: ctx.ownerName, dashboardUrl: `${APP_URL}/dashboard`, unsubscribeUrl: unsubscribeUrl(ctx.shopId) }
  const billingUrl = `${APP_URL}/settings/billing`

  return [
    {
      key: 'welcome', minDay: 0,
      build: async () => {
        const [status, shopRow] = await Promise.all([
          getOnboardingStatus(ctx.shopId),
          createAdminClient().from('shops').select('slug').eq('id', ctx.shopId).single(),
        ])
        const steps: templates.SetupGuideStep[] = [
          { label: 'Add your services',      href: `${APP_URL}/services`,      done: status.hasServices },
          { label: 'Add a barber',           href: `${APP_URL}/staff`,         done: status.hasStaff },
          { label: 'Set your opening hours', href: `${APP_URL}/settings/shop`, done: status.hasOpeningHours },
        ]
        const bookingPageUrl = `${APP_URL}/booking/${shopRow.data?.slug ?? ''}`
        return templates.trialWelcome({ ...base, steps, bookingPageUrl })
      },
    },
    {
      key: 'setup_nudge', minDay: 2,
      build: async () => {
        const status = await getOnboardingStatus(ctx.shopId)
        if (isSetupComplete(status)) return null
        const missing: string[] = []
        if (!status.hasServices)     missing.push('Add your first service')
        if (!status.hasStaff)        missing.push('Add a barber')
        if (!status.hasOpeningHours) missing.push('Set your opening hours')
        return templates.setupNudge({ ...base, missing })
      },
    },
    {
      key: 'booking_link', minDay: 4,
      build: async () => {
        const supabase = createAdminClient()
        const { data: shop } = await supabase.from('shops').select('slug').eq('id', ctx.shopId).single()
        const { count } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('shop_id', ctx.shopId)
        return templates.bookingLinkNudge({ ...base, bookingPageUrl: `${APP_URL}/booking/${shop?.slug ?? ''}`, hasBookings: (count ?? 0) > 0 })
      },
    },
    {
      key: 'reminders_feature', minDay: 7,
      build: async () => {
        const stats = await getTrialStats(ctx.shopId, ctx.trialStart)
        return templates.remindersFeatureNudge({ ...base, noShowCount: stats.noShowCount })
      },
    },
    {
      key: 'midtrial_active', minDay: 12,
      build: async () => {
        const alreadySentEither = await midtrialAlreadySent(ctx.shopId)
        if (alreadySentEither) return null
        const stats = await getTrialStats(ctx.shopId, ctx.trialStart)
        if (stats.bookingsCount === 0) return null // stalled — handled by the other key
        return templates.midtrialActive({ ...base, bookingsCount: stats.bookingsCount })
      },
    },
    {
      key: 'midtrial_stalled', minDay: 12,
      build: async () => {
        const alreadySentEither = await midtrialAlreadySent(ctx.shopId)
        if (alreadySentEither) return null
        const stats = await getTrialStats(ctx.shopId, ctx.trialStart)
        if (stats.bookingsCount > 0) return null // active — handled by the other key
        return templates.midtrialStalled(base)
      },
    },
    {
      key: 'value_recap', minDay: 16,
      build: async () => {
        const stats = await getTrialStats(ctx.shopId, ctx.trialStart)
        return templates.valueRecap({ ...base, bookingsCount: stats.bookingsCount, hoursSaved: stats.hoursSaved, revenueBooked: stats.revenueBooked, currency: ctx.currency })
      },
    },
    {
      key: 'plan_guide', minDay: 21,
      build: () => templates.planGuide({ ...base, trialDaysRemaining: Math.max(0, 30 - ctx.daysSince) }),
    },
    {
      key: 'recommendation', minDay: 25,
      build: async () => {
        const rec = await getTrialRecommendation(ctx.shopId, ctx.trialStart)
        return templates.recommendationEmail({ ...base, recommendedPlan: PLANS[rec.plan].name, reason: rec.reason, billingUrl })
      },
    },
  ]
}

/** midtrial_active and midtrial_stalled are mutually exclusive branches of the same day-12 touchpoint — only one should ever go out. */
async function midtrialAlreadySent(shopId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { count } = await supabase.from('email_sends').select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId).in('email_key', ['midtrial_active', 'midtrial_stalled'])
  return (count ?? 0) > 0
}

function pausedAttempts(ctx: ShopContext): Attempt[] {
  const base = { shopName: ctx.shopName, ownerName: ctx.ownerName, dashboardUrl: `${APP_URL}/dashboard`, unsubscribeUrl: unsubscribeUrl(ctx.shopId) }
  const billingUrl = `${APP_URL}/settings/billing`

  return [
    {
      key: 'winback_1', minDay: 34,
      build: async () => {
        const stats = await getTrialStats(ctx.shopId, ctx.trialStart)
        return templates.winback1({ ...base, bookingsCount: stats.bookingsCount, revenueBooked: stats.revenueBooked, currency: ctx.currency, billingUrl })
      },
    },
    {
      key: 'winback_2', minDay: 45,
      build: () => templates.winback2({ ...base, billingUrl, supportEmail: SUPPORT_EMAIL }),
    },
  ]
}

// ── GET — invoked hourly by Vercel Cron ────────────────────────────────────
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth       = request.headers.get('authorization') ?? ''
  if (!cronSecret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const expected = Buffer.from(`Bearer ${cronSecret}`)
  const actual   = Buffer.from(auth)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Only shops that actually had a trial and haven't converted — a shop that
  // paid via direct Checkout never has trial_start set, so it's naturally excluded.
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('shop_id, owner_id, status, trial_start')
    .in('status', ['trialing', 'paused'])
    .not('trial_start', 'is', null)
    .is('converted_at', null)

  if (error) {
    console.error('[cron/nurture] fetch error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const summary: Array<{ shopId: string; results: Array<{ key: string; sent: boolean; reason?: string }> }> = []

  for (const sub of subs ?? []) {
    if (!sub.trial_start) continue

    const [{ data: shop }, { data: userRes }] = await Promise.all([
      supabase.from('shops').select('id, name, currency').eq('id', sub.shop_id).single(),
      supabase.auth.admin.getUserById(sub.owner_id),
    ])
    if (!shop) continue
    const ownerEmail = userRes?.user?.email
    if (!ownerEmail) continue

    const ctx: ShopContext = {
      shopId:     shop.id,
      shopName:   shop.name,
      ownerName:  (userRes?.user?.user_metadata?.full_name as string | undefined) ?? 'there',
      ownerEmail,
      currency:   shop.currency ?? 'GBP',
      daysSince:  Math.floor((Date.now() - new Date(sub.trial_start).getTime()) / DAY_MS),
      trialStart: sub.trial_start,
    }

    const attempts = sub.status === 'trialing' ? trialAttempts(ctx) : pausedAttempts(ctx)
    const results = await runSchedule(ctx, attempts)
    if (results.length) summary.push({ shopId: shop.id, results })
  }

  const sentCount = summary.reduce((n, s) => n + s.results.filter(r => r.sent).length, 0)
  console.log(`[cron/nurture] done — checked: ${subs?.length ?? 0}, sent: ${sentCount}`)
  return NextResponse.json({ checked: subs?.length ?? 0, sent: sentCount, summary })
}
