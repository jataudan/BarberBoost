import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { BarChart2, TrendingUp, TrendingDown, Minus, Calendar, Users, AlertCircle, Scissors } from 'lucide-react'
import { getShop, getSubscription } from '@/lib/supabase/server'
import { parsePeriod, fetchAnalyticsData } from '@/lib/analytics'
import type { PlanId } from '@/lib/stripe/plans'
import { PLANS } from '@/lib/stripe/plans'
import { PlanGate } from '@/components/shared/PlanGate'
import { DateRangeSelector } from '@/components/analytics/DateRangeSelector'
import { RevenueLineChart } from '@/components/analytics/RevenueLineChart'
import { StatusDonutChart } from '@/components/analytics/StatusDonutChart'
import { ServicesRevenueChart } from '@/components/analytics/ServicesRevenueChart'
import { StaffTable } from '@/components/analytics/StaffTable'
import { BusiestHoursHeatmap } from '@/components/analytics/BusiestHoursHeatmap'
import { ClientInsightsPanel } from '@/components/analytics/ClientInsightsPanel'
import { FinancialSummaryPanel } from '@/components/analytics/FinancialSummaryPanel'
import { ExportButton } from '@/components/analytics/ExportButton'

// ── Types ─────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}

// ── Helpers ───────────────────────────────────────────────────────────────

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return cur > 0 ? 100 : null
  return ((cur - prev) / prev) * 100
}

function fmtCur(v: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v)
}

function KpiCard({
  label, value, changePct, icon, accent = false,
}: {
  label: string; value: string; changePct: number | null; icon: React.ReactNode; accent?: boolean
}) {
  const pos = changePct !== null && changePct > 0
  const neg = changePct !== null && changePct < 0
  return (
    <div className={`bg-[#111111] border rounded-xl p-5 space-y-3 ${accent ? 'border-[#c9a84c]/20' : 'border-white/[0.06]'}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">{label}</p>
        <div className={accent ? 'text-[#c9a84c]' : 'text-zinc-600'}>{icon}</div>
      </div>
      <p className={`text-3xl font-black tracking-tight ${accent ? 'text-[#c9a84c]' : 'text-white'}`}>{value}</p>
      {changePct !== null ? (
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1 text-xs font-semibold rounded-md px-1.5 py-0.5 ${
            pos ? 'bg-emerald-500/10 text-emerald-400'
            : neg ? 'bg-red-500/10 text-red-400'
            : 'bg-zinc-700/40 text-zinc-400'}`}>
            {pos ? <TrendingUp className="w-3 h-3" />
              : neg ? <TrendingDown className="w-3 h-3" />
              : <Minus className="w-3 h-3" />}
            {pos ? '+' : ''}{changePct.toFixed(1)}%
          </div>
          <span className="text-[10px] text-zinc-600">vs prior period</span>
        </div>
      ) : (
        <div className="h-5" />
      )}
    </div>
  )
}

function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        {icon && <div className="text-zinc-500">{icon}</div>}
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">{title}</p>
      </div>
      {children}
    </div>
  )
}

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-[#1a1a1a] rounded-xl animate-pulse ${className}`} />
}

// ── Page ─────────────────────────────────────────────────────────────────

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const [shop, sub, params] = await Promise.all([
    getShop(),
    getSubscription(),
    searchParams,
  ])
  if (!shop) redirect('/login')

  const plan     = ((sub?.plan ?? 'free') as PlanId) satisfies PlanId
  const currency = shop.currency ?? 'GBP'
  const range    = parsePeriod(params)
  const data     = await fetchAnalyticsData(shop.id, range, plan)

  const isProPlus = (['pro', 'empire'] as PlanId[]).includes(plan)

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white leading-none">
            ANALYTICS
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Track your shop&apos;s performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<Skeleton className="w-36 h-9" />}>
            <DateRangeSelector activePeriod={range.key} activeFrom={params.from} activeTo={params.to} />
          </Suspense>
          {/* Export — Pro+ only */}
          {isProPlus && (
            <ExportButton data={data} currency={currency} period={range.key} />
          )}
          {!isProPlus && (
            <div className="flex items-center gap-1.5 bg-[#111111] border border-white/[0.06] rounded-xl px-4 py-2 text-sm text-zinc-600 cursor-not-allowed select-none">
              <AlertCircle className="w-3.5 h-3.5" />
              Export (Pro+)
            </div>
          )}
        </div>
      </div>

      {/* ── Row 1: KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total revenue" value={fmtCur(data.kpis.revenue, currency)}
          changePct={pctChange(data.kpis.revenue, data.kpis.prevRevenue)}
          icon={<TrendingUp className="w-4 h-4" />} accent />
        <KpiCard label="Total bookings" value={String(data.kpis.bookings)}
          changePct={pctChange(data.kpis.bookings, data.kpis.prevBookings)}
          icon={<Calendar className="w-4 h-4" />} />
        <KpiCard label="New clients" value={String(data.kpis.newClients)}
          changePct={pctChange(data.kpis.newClients, data.kpis.prevClients)}
          icon={<Users className="w-4 h-4" />} />
        <KpiCard label="No-show rate" value={`${data.kpis.noShowRate.toFixed(1)}%`}
          changePct={data.kpis.prevNoShowRate !== 0
            ? pctChange(data.kpis.noShowRate, data.kpis.prevNoShowRate) : null}
          icon={<AlertCircle className="w-4 h-4" />} />
      </div>

      {/* ── Row 2: Revenue chart ─────────────────────────────────────── */}
      <SectionCard title="Revenue & bookings">
        <RevenueLineChart data={data.revenueChart} currency={currency} />
      </SectionCard>

      {/* ── Rows 3–4: Standard+ (starter plan gate) ──────────────────── */}
      <PlanGate requiredPlan="starter" currentPlan={plan}>
        {/* Row 3: Top Services + Status Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Top services by revenue" icon={<Scissors className="w-4 h-4" />}>
            <ServicesRevenueChart data={data.topServices} currency={currency} />
          </SectionCard>
          <SectionCard title="Bookings by status">
            <StatusDonutChart data={data.statusBreakdown} />
          </SectionCard>
        </div>

        {/* Row 4: Top Staff + Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <SectionCard title="Top performing staff" icon={<Users className="w-4 h-4" />}>
            <StaffTable data={data.staffRows} currency={currency} />
          </SectionCard>
          <SectionCard title="Busiest hours" icon={<BarChart2 className="w-4 h-4" />}>
            <BusiestHoursHeatmap data={data.heatmap} />
          </SectionCard>
        </div>
      </PlanGate>

      {/* ── Row 5: Client Insights (Pro+) ────────────────────────────── */}
      <PlanGate requiredPlan="pro" currentPlan={plan}>
        <SectionCard title="Client insights">
          {data.clientInsights ? (
            <ClientInsightsPanel data={data.clientInsights} currency={currency} />
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}
        </SectionCard>
      </PlanGate>

      {/* ── Row 6: Financial Summary (Empire) ─────────────────────────── */}
      <PlanGate requiredPlan="empire" currentPlan={plan}>
        <SectionCard title="Financial summary">
          {data.categoryRevenue && data.commissions && data.momRows ? (
            <FinancialSummaryPanel
              categoryRevenue={data.categoryRevenue}
              commissions={data.commissions}
              momRows={data.momRows}
              currency={currency}
            />
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}
        </SectionCard>
      </PlanGate>
    </div>
  )
}
