import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { format, subDays, startOfDay, endOfDay, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { Calendar, Users, PoundSterling, TrendingUp } from 'lucide-react'
import { createClient, getShop } from '@/lib/supabase/server'
import { StatsCard, StatsCardSkeleton } from '@/components/dashboard/StatsCard'
import { TodaySchedule, TodayScheduleSkeleton } from '@/components/dashboard/TodaySchedule'
import { RevenueChart, RevenueChartSkeleton, type RevenueDataPoint } from '@/components/dashboard/RevenueChart'
import { TopServices, TopServicesSkeleton, type ServiceDataPoint } from '@/components/dashboard/TopServices'
import { BookingCalendar, BookingCalendarSkeleton } from '@/components/dashboard/BookingCalendar'
import { UpgradedBanner } from '@/components/dashboard/UpgradedBanner'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'
import { WelcomeBanner } from '@/components/onboarding/WelcomeBanner'
import { HeroStyleNudge } from '@/components/onboarding/HeroStyleNudge'
import type { BookingWithRelations } from '@/types/database'

// ── Helpers ───────────────────────────────────────────────────────────────
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}

// ── Stats Section (async server component) ────────────────────────────────
async function StatsSection({ shopId }: { shopId: string }) {
  const supabase = await createClient()
  const now      = new Date()

  const todayStart    = startOfDay(now).toISOString()
  const todayEnd      = endOfDay(now).toISOString()
  const yesterdayStart = startOfDay(subDays(now, 1)).toISOString()
  const yesterdayEnd   = endOfDay(subDays(now, 1)).toISOString()

  const [
    { data: todayBookings },
    { data: yesterdayBookings },
    { data: monthClients },
    { data: prevMonthClients },
    { data: monthRevenue },
    { data: prevMonthRevenue },
  ] = await Promise.all([
    supabase.from('bookings').select('id').eq('shop_id', shopId)
      .gte('created_at', todayStart).lte('created_at', todayEnd)
      .neq('status', 'cancelled'),
    supabase.from('bookings').select('id').eq('shop_id', shopId)
      .gte('created_at', yesterdayStart).lte('created_at', yesterdayEnd)
      .neq('status', 'cancelled'),
    supabase.from('clients').select('id').eq('shop_id', shopId)
      .gte('created_at', startOfDay(subDays(now, 30)).toISOString()),
    supabase.from('clients').select('id').eq('shop_id', shopId)
      .gte('created_at', startOfDay(subDays(now, 60)).toISOString())
      .lte('created_at', startOfDay(subDays(now, 30)).toISOString()),
    supabase.from('bookings').select('price').eq('shop_id', shopId)
      .eq('status', 'completed')
      .gte('date', format(subDays(now, 30), 'yyyy-MM-dd')),
    supabase.from('bookings').select('price').eq('shop_id', shopId)
      .eq('status', 'completed')
      .gte('date', format(subDays(now, 60), 'yyyy-MM-dd'))
      .lte('date', format(subDays(now, 30), 'yyyy-MM-dd')),
  ])

  const todayCount   = todayBookings?.length ?? 0
  const yestCount    = yesterdayBookings?.length ?? 0
  const newClients   = monthClients?.length ?? 0
  const prevClients  = prevMonthClients?.length ?? 0
  const revenue      = (monthRevenue ?? []).reduce((s, b) => s + (b.price ?? 0), 0)
  const prevRevenue  = (prevMonthRevenue ?? []).reduce((s, b) => s + (b.price ?? 0), 0)
  const avgValue     = todayCount > 0
    ? (todayBookings ?? []).reduce((s: number, _: unknown) => s, 0) / todayCount
    : 0

  const currency = 'GBP'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Today's Bookings"
        value={String(todayCount)}
        changePct={pctChange(todayCount, yestCount)}
        changeLabel="vs yesterday"
        icon={<Calendar className="w-4 h-4" />}
      />
      <StatsCard
        title="New Clients (30d)"
        value={String(newClients)}
        changePct={pctChange(newClients, prevClients)}
        changeLabel="vs prev 30d"
        icon={<Users className="w-4 h-4" />}
      />
      <StatsCard
        title="Revenue (30d)"
        value={new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(revenue)}
        changePct={pctChange(revenue, prevRevenue)}
        changeLabel="vs prev 30d"
        icon={<PoundSterling className="w-4 h-4" />}
      />
      <StatsCard
        title="Avg Booking Value"
        value={new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(avgValue)}
        changePct={null}
        changeLabel=""
        icon={<TrendingUp className="w-4 h-4" />}
      />
    </div>
  )
}

// ── Today's schedule section ──────────────────────────────────────────────
async function ScheduleSection({ shopId, currency }: { shopId: string; currency: string }) {
  const supabase = await createClient()
  const today    = format(new Date(), 'yyyy-MM-dd')

  const { data } = await supabase
    .from('bookings')
    .select(`
      *,
      service:services ( id, name, duration_minutes, price, colour ),
      staff:staff ( id, name, avatar_url, colour ),
      client:clients ( id, name, email, phone )
    `)
    .eq('shop_id', shopId)
    .eq('date', today)
    .order('start_time', { ascending: true })

  const bookings = (data ?? []) as BookingWithRelations[]
  return <TodaySchedule bookings={bookings} currency={currency} />
}

// ── Revenue chart section ─────────────────────────────────────────────────
async function RevenueSection({ shopId, currency }: { shopId: string; currency: string }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bookings')
    .select('date, price')
    .eq('shop_id', shopId)
    .eq('status', 'completed')
    .gte('date', format(subDays(new Date(), 29), 'yyyy-MM-dd'))
    .order('date', { ascending: true })

  // Aggregate by date
  const map = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    map.set(format(subDays(new Date(), i), 'yyyy-MM-dd'), 0)
  }
  for (const row of data ?? []) {
    map.set(row.date, (map.get(row.date) ?? 0) + (row.price ?? 0))
  }

  const chartData: RevenueDataPoint[] = Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue }))
  return <RevenueChart data={chartData} currency={currency} />
}

// ── Top services section ──────────────────────────────────────────────────
async function TopServicesSection({ shopId }: { shopId: string }) {
  const supabase = await createClient()
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd   = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const { data } = await supabase
    .from('bookings')
    .select('service:services ( name )')
    .eq('shop_id', shopId)
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .neq('status', 'cancelled')

  // Count by service name
  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const svc = row.service as { name: string } | { name: string }[] | null
    const name = (Array.isArray(svc) ? svc[0]?.name : svc?.name) ?? 'Unknown'
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  const chartData: ServiceDataPoint[] = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, bookings]) => ({ name, bookings }))

  return <TopServices data={chartData} />
}

// ── Weekly calendar section ───────────────────────────────────────────────
async function CalendarSection({ shopId }: { shopId: string }) {
  const supabase  = await createClient()
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd   = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const { data } = await supabase
    .from('bookings')
    .select(`
      *,
      service:services ( id, name, duration_minutes, price, colour ),
      staff:staff ( id, name, avatar_url, colour ),
      client:clients ( id, name, email, phone )
    `)
    .eq('shop_id', shopId)
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .order('start_time', { ascending: true })

  const bookings = (data ?? []) as BookingWithRelations[]
  return <BookingCalendar bookings={bookings} />
}

// ── Stat card skeletons row ───────────────────────────────────────────────
function StatSkeletons() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const shop = await getShop()
  if (!shop) redirect('/login')

  const currency = shop.currency ?? 'GBP'

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Welcome banner (first login after signup) */}
      <Suspense>
        <WelcomeBanner />
      </Suspense>

      {/* Hero style nudge (existing shops with no cover set) */}
      <HeroStyleNudge />

      {/* Upgrade success banner */}
      <Suspense>
        <UpgradedBanner />
      </Suspense>

      {/* Onboarding checklist (dismissible, auto-hides when all complete) */}
      <OnboardingChecklist />

      {/* KPI stats */}
      <Suspense fallback={<StatSkeletons />}>
        <StatsSection shopId={shop.id} />
      </Suspense>

      {/* Today's schedule */}
      <Suspense fallback={<TodayScheduleSkeleton />}>
        <ScheduleSection shopId={shop.id} currency={currency} />
      </Suspense>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <Suspense fallback={<RevenueChartSkeleton />}>
            <RevenueSection shopId={shop.id} currency={currency} />
          </Suspense>
        </div>
        <div className="lg:col-span-2">
          <Suspense fallback={<TopServicesSkeleton />}>
            <TopServicesSection shopId={shop.id} />
          </Suspense>
        </div>
      </div>

      {/* Weekly calendar */}
      <Suspense fallback={<BookingCalendarSkeleton />}>
        <CalendarSection shopId={shop.id} />
      </Suspense>
    </div>
  )
}
