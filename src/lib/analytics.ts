/**
 * src/lib/analytics.ts
 * Server-side aggregation helpers for the analytics dashboard.
 * All functions use the server Supabase client and must only be
 * imported from Server Components or Server Actions.
 */

import { createClient } from '@/lib/supabase/server'
import {
  format, eachDayOfInterval, parseISO, getDay,
  startOfWeek, startOfMonth, subDays, subMonths,
  differenceInDays,
} from 'date-fns'
import type { PlanId } from '@/lib/stripe/plans'

// ── Period / date range ───────────────────────────────────────────────────

export type PeriodKey = 'today' | 'week' | 'month' | '30d' | 'custom'

export interface DateRange {
  start:     string   // 'yyyy-MM-dd'
  end:       string
  prevStart: string
  prevEnd:   string
  key:       PeriodKey
}

export function parsePeriod(
  params: { period?: string; from?: string; to?: string },
): DateRange {
  const now   = new Date()
  const today = format(now, 'yyyy-MM-dd')

  switch (params.period) {
    case 'today': {
      const yest = format(subDays(now, 1), 'yyyy-MM-dd')
      return { start: today, end: today, prevStart: yest, prevEnd: yest, key: 'today' }
    }
    case 'week': {
      const wkStart  = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const pwkEnd   = format(subDays(parseISO(wkStart), 1), 'yyyy-MM-dd')
      const pwkStart = format(startOfWeek(parseISO(pwkEnd), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      return { start: wkStart, end: today, prevStart: pwkStart, prevEnd: pwkEnd, key: 'week' }
    }
    case 'month': {
      const mStart  = format(startOfMonth(now), 'yyyy-MM-dd')
      const pmEnd   = format(subDays(parseISO(mStart), 1), 'yyyy-MM-dd')
      const pmStart = format(startOfMonth(parseISO(pmEnd)), 'yyyy-MM-dd')
      return { start: mStart, end: today, prevStart: pmStart, prevEnd: pmEnd, key: 'month' }
    }
    case 'custom': {
      if (params.from && params.to) {
        const startD = parseISO(params.from)
        const dur    = Math.max(1, differenceInDays(parseISO(params.to), startD))
        const pEnd   = format(subDays(startD, 1), 'yyyy-MM-dd')
        const pStart = format(subDays(startD, dur), 'yyyy-MM-dd')
        return { start: params.from, end: params.to, prevStart: pStart, prevEnd: pEnd, key: 'custom' }
      }
      // fall through to default
    }
    default: { // '30d'
      const start = format(subDays(now, 29), 'yyyy-MM-dd')
      const pEnd  = format(subDays(now, 30), 'yyyy-MM-dd')
      const pSt   = format(subDays(now, 59), 'yyyy-MM-dd')
      return { start, end: today, prevStart: pSt, prevEnd: pEnd, key: '30d' }
    }
  }
}

// ── Output types ──────────────────────────────────────────────────────────

export interface KpiData {
  revenue:        number
  prevRevenue:    number
  bookings:       number
  prevBookings:   number
  newClients:     number
  prevClients:    number
  noShowRate:     number   // 0–100
  prevNoShowRate: number
}

export interface RevenuePoint {
  date:     string
  revenue:  number
  bookings: number
}

export interface StatusBreakdown {
  status: string
  count:  number
}

export interface TopService {
  name:     string
  revenue:  number
  bookings: number
}

export interface StaffRow {
  id:       string
  name:     string
  bookings: number
  revenue:  number
}

export interface HeatmapCell {
  day:   number  // 0=Mon … 6=Sun
  hour:  number  // 8–20
  count: number
}

export interface ClientInsightsData {
  newCount:         number
  returningCount:   number
  retentionRate:    number   // 0–100
  avgLifetimeValue: number
  atRiskClients:    { id: string; name: string; lastVisit: string | null; totalSpent: number }[]
}

export interface CategoryRevenue {
  category: string
  revenue:  number
  bookings: number
}

export interface CommissionRow {
  staffId:        string
  name:           string
  revenue:        number
  commissionRate: number
  commission:     number
}

export interface MoMRow {
  month:    string
  revenue:  number
  bookings: number
  growth:   number | null  // % vs previous month
}

export interface AnalyticsData {
  kpis:            KpiData
  revenueChart:    RevenuePoint[]
  statusBreakdown: StatusBreakdown[]
  topServices:     TopService[]
  staffRows:       StaffRow[]
  heatmap:         HeatmapCell[]
  // Pro+
  clientInsights:  ClientInsightsData | null
  // Empire
  categoryRevenue: CategoryRevenue[] | null
  commissions:     CommissionRow[] | null
  momRows:         MoMRow[] | null
}

// ── Main aggregation ──────────────────────────────────────────────────────

export async function fetchAnalyticsData(
  shopId: string,
  range:  DateRange,
  plan:   PlanId,
): Promise<AnalyticsData> {
  const supabase = await createClient()
  const isToday  = range.key === 'today'

  // ── Core bookings queries (parallel) ───────────────────────────────────
  const [
    { data: curBkgs  },
    { data: prvBkgs  },
    { data: curCli   },
    { data: prvCli   },
    { data: staffList },
    { data: svcList  },
  ] = await Promise.all([
    supabase.from('bookings')
      .select('id,date,start_time,price,status,service_id,staff_id,client_id')
      .eq('shop_id', shopId)
      .gte('date', range.start)
      .lte('date', range.end),
    supabase.from('bookings')
      .select('price,status')
      .eq('shop_id', shopId)
      .gte('date', range.prevStart)
      .lte('date', range.prevEnd),
    supabase.from('clients')
      .select('id')
      .eq('shop_id', shopId)
      .gte('created_at', range.start)
      .lte('created_at', `${range.end}T23:59:59Z`),
    supabase.from('clients')
      .select('id')
      .eq('shop_id', shopId)
      .gte('created_at', range.prevStart)
      .lte('created_at', `${range.prevEnd}T23:59:59Z`),
    supabase.from('staff').select('id,name,commission_rate').eq('shop_id', shopId),
    supabase.from('services').select('id,name,category').eq('shop_id', shopId),
  ])

  const bkgs     = curBkgs  ?? []
  const prev     = prvBkgs  ?? []
  const staff    = staffList ?? []
  const services = svcList  ?? []

  const staffMap   = new Map(staff.map(s => [s.id, s]))
  const serviceMap = new Map(services.map(s => [s.id, s]))

  // ── KPIs ───────────────────────────────────────────────────────────────
  function aggKpis(rows: typeof prev) {
    const completed = rows.filter(b => b.status === 'completed')
    const active    = rows.filter(b => b.status !== 'cancelled')
    const noShows   = rows.filter(b => b.status === 'no_show')
    const revenue   = completed.reduce((s, b) => s + (b.price ?? 0), 0)
    return {
      revenue,
      bookings:   active.length,
      noShowRate: active.length > 0 ? (noShows.length / active.length) * 100 : 0,
    }
  }
  const c  = aggKpis(bkgs)
  const p  = aggKpis(prev)
  const kpis: KpiData = {
    revenue: c.revenue, prevRevenue: p.revenue,
    bookings: c.bookings, prevBookings: p.bookings,
    newClients: curCli?.length ?? 0, prevClients: prvCli?.length ?? 0,
    noShowRate: c.noShowRate, prevNoShowRate: p.noShowRate,
  }

  // ── Revenue chart ──────────────────────────────────────────────────────
  let revenueChart: RevenuePoint[]
  const completed = bkgs.filter(b => b.status === 'completed')

  if (isToday) {
    // Hourly 0–23
    const revByHour = new Map<number, number>()
    const bkgByHour = new Map<number, number>()
    for (const b of bkgs) {
      if (!b.start_time) continue
      const h = parseInt(b.start_time.slice(0, 2), 10)
      if (b.status === 'completed') revByHour.set(h, (revByHour.get(h) ?? 0) + (b.price ?? 0))
      if (b.status !== 'cancelled') bkgByHour.set(h, (bkgByHour.get(h) ?? 0) + 1)
    }
    revenueChart = Array.from({ length: 24 }, (_, h) => ({
      date:     `${String(h).padStart(2, '0')}:00`,
      revenue:  revByHour.get(h) ?? 0,
      bookings: bkgByHour.get(h) ?? 0,
    })).filter(pt => pt.revenue > 0 || pt.bookings > 0)
  } else {
    const days = eachDayOfInterval({ start: parseISO(range.start), end: parseISO(range.end) })
    const revMap = new Map<string, number>()
    const bkgMap = new Map<string, number>()
    for (const b of completed) revMap.set(b.date, (revMap.get(b.date) ?? 0) + (b.price ?? 0))
    for (const b of bkgs.filter(x => x.status !== 'cancelled'))
      bkgMap.set(b.date, (bkgMap.get(b.date) ?? 0) + 1)

    // Reduce density for longer ranges
    const step = days.length > 90 ? 7 : days.length > 60 ? 3 : 1
    revenueChart = days
      .filter((_, i) => i % step === 0)
      .map(d => {
        const k = format(d, 'yyyy-MM-dd')
        // For weekly grouping, sum up the 7-day window
        if (step >= 7) {
          let rev = 0, bkg = 0
          for (let j = 0; j < step; j++) {
            const dk = format(new Date(d.getTime() + j * 86400000), 'yyyy-MM-dd')
            rev += revMap.get(dk) ?? 0
            bkg += bkgMap.get(dk) ?? 0
          }
          return { date: format(d, 'd MMM'), revenue: rev, bookings: bkg }
        }
        return { date: format(d, 'd MMM'), revenue: revMap.get(k) ?? 0, bookings: bkgMap.get(k) ?? 0 }
      })
  }

  // ── Status breakdown ───────────────────────────────────────────────────
  const statusCount = new Map<string, number>()
  for (const b of bkgs) {
    statusCount.set(b.status, (statusCount.get(b.status) ?? 0) + 1)
  }
  const statusBreakdown: StatusBreakdown[] = [...statusCount.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  // ── Top services by revenue ────────────────────────────────────────────
  const svcRevMap = new Map<string, { revenue: number; bookings: number }>()
  for (const b of completed) {
    if (!b.service_id) continue
    const svc  = serviceMap.get(b.service_id)
    const name = svc?.name ?? 'Unknown'
    const cur  = svcRevMap.get(name) ?? { revenue: 0, bookings: 0 }
    svcRevMap.set(name, { revenue: cur.revenue + (b.price ?? 0), bookings: cur.bookings + 1 })
  }
  const topServices: TopService[] = [...svcRevMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)

  // ── Staff table ────────────────────────────────────────────────────────
  const staffRevMap = new Map<string, { revenue: number; bookings: number }>()
  for (const b of completed) {
    if (!b.staff_id) continue
    const cur = staffRevMap.get(b.staff_id) ?? { revenue: 0, bookings: 0 }
    staffRevMap.set(b.staff_id, { revenue: cur.revenue + (b.price ?? 0), bookings: cur.bookings + 1 })
  }
  const staffRows: StaffRow[] = [...staffRevMap.entries()]
    .map(([id, v]) => ({ id, name: staffMap.get(id)?.name ?? 'Staff', ...v }))
    .sort((a, b) => b.revenue - a.revenue)

  // ── Heatmap (7 days × hours 8–20) ─────────────────────────────────────
  const heatCounts = new Map<string, number>()
  for (const b of bkgs) {
    if (!b.start_time || b.status === 'cancelled') continue
    const hour = parseInt(b.start_time.slice(0, 2), 10)
    if (hour < 8 || hour > 20) continue
    // getDay: 0=Sun, 1=Mon...6=Sat → normalise to 0=Mon, 6=Sun
    const rawDay = getDay(parseISO(b.date))
    const day    = rawDay === 0 ? 6 : rawDay - 1
    const key    = `${day}-${hour}`
    heatCounts.set(key, (heatCounts.get(key) ?? 0) + 1)
  }
  const heatmap: HeatmapCell[] = []
  for (let day = 0; day < 7; day++) {
    for (let hour = 8; hour <= 20; hour++) {
      heatmap.push({ day, hour, count: heatCounts.get(`${day}-${hour}`) ?? 0 })
    }
  }

  // ── Client insights (Pro+) ─────────────────────────────────────────────
  let clientInsights: ClientInsightsData | null = null
  const planOrder = ['free', 'starter', 'pro', 'empire'] as const
  const isPro = planOrder.indexOf(plan) >= planOrder.indexOf('pro')

  if (isPro) {
    const [{ data: allClients }, { data: periodBkgs }, { data: prevPeriodBkgs }] = await Promise.all([
      supabase.from('clients')
        .select('id,name,last_visit,total_spent,created_at')
        .eq('shop_id', shopId)
        .order('last_visit', { ascending: true }),
      supabase.from('bookings').select('client_id')
        .eq('shop_id', shopId).gte('date', range.start).lte('date', range.end)
        .neq('status', 'cancelled'),
      supabase.from('bookings').select('client_id')
        .eq('shop_id', shopId).gte('date', range.prevStart).lte('date', range.prevEnd)
        .neq('status', 'cancelled'),
    ])

    const clients         = allClients ?? []
    const curClientIds    = new Set((periodBkgs ?? []).map(b => b.client_id).filter(Boolean))
    const prevClientIds   = new Set((prevPeriodBkgs ?? []).map(b => b.client_id).filter(Boolean))

    const newInPeriod     = clients.filter(c => c.created_at >= range.start && c.created_at <= `${range.end}T23:59:59Z`)
    const returningInPeriod = [...curClientIds].filter(id => {
      const c = clients.find(x => x.id === id)
      return c && c.created_at < range.start
    })

    // Retention: % of prev-period active clients who also booked in current period
    const retainedCount   = [...prevClientIds].filter(id => curClientIds.has(id)).length
    const retentionRate   = prevClientIds.size > 0 ? (retainedCount / prevClientIds.size) * 100 : 0

    const avgLifetimeValue = clients.length > 0
      ? clients.reduce((s, c) => s + (c.total_spent ?? 0), 0) / clients.length
      : 0

    const sixtyDaysAgo = format(subDays(new Date(), 60), 'yyyy-MM-dd')
    const atRiskClients = clients
      .filter(c => !c.last_visit || c.last_visit < sixtyDaysAgo)
      .slice(0, 10)
      .map(c => ({ id: c.id, name: c.name, lastVisit: c.last_visit, totalSpent: c.total_spent ?? 0 }))

    clientInsights = {
      newCount:         newInPeriod.length,
      returningCount:   returningInPeriod.length,
      retentionRate,
      avgLifetimeValue,
      atRiskClients,
    }
  }

  // ── Financial summary (Empire) ─────────────────────────────────────────
  let categoryRevenue: CategoryRevenue[] | null = null
  let commissions:     CommissionRow[]     | null = null
  let momRows:         MoMRow[]            | null = null

  if (plan === 'empire') {
    // Revenue by service category
    const catRevMap = new Map<string, { revenue: number; bookings: number }>()
    for (const b of completed) {
      if (!b.service_id) continue
      const svc      = serviceMap.get(b.service_id)
      const category = svc?.category ?? 'Uncategorised'
      const cur      = catRevMap.get(category) ?? { revenue: 0, bookings: 0 }
      catRevMap.set(category, { revenue: cur.revenue + (b.price ?? 0), bookings: cur.bookings + 1 })
    }
    categoryRevenue = [...catRevMap.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.revenue - a.revenue)

    // Staff commissions
    commissions = [...staffRevMap.entries()].map(([id, v]) => {
      const s    = staffMap.get(id)
      const rate = s?.commission_rate ?? 0
      return { staffId: id, name: s?.name ?? 'Staff', revenue: v.revenue, commissionRate: rate, commission: v.revenue * (rate / 100) }
    }).sort((a, b) => b.commission - a.commission)

    // Month-over-month (last 6 months)
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i))
    const momBkgsRes = await supabase.from('bookings')
      .select('date,price,status')
      .eq('shop_id', shopId)
      .gte('date', format(subMonths(now, 6), 'yyyy-MM-dd'))
      .lte('date', format(now, 'yyyy-MM-dd'))
    const momBkgs = momBkgsRes.data ?? []

    const monthData = months.map(m => {
      const key       = format(m, 'yyyy-MM')
      const mBkgs     = momBkgs.filter(b => b.date.startsWith(key))
      const mComplete = mBkgs.filter(b => b.status === 'completed')
      return {
        month:    format(m, 'MMM yyyy'),
        revenue:  mComplete.reduce((s, b) => s + (b.price ?? 0), 0),
        bookings: mBkgs.filter(b => b.status !== 'cancelled').length,
      }
    })

    momRows = monthData.map((row, i) => ({
      ...row,
      growth: i === 0 ? null : monthData[i - 1].revenue === 0
        ? null
        : ((row.revenue - monthData[i - 1].revenue) / monthData[i - 1].revenue) * 100,
    }))
  }

  return {
    kpis, revenueChart, statusBreakdown, topServices, staffRows, heatmap,
    clientInsights, categoryRevenue, commissions, momRows,
  }
}
