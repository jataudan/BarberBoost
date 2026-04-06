'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
} from 'recharts'
import { format, parseISO } from 'date-fns'

export interface RevenueDataPoint {
  date: string   // "YYYY-MM-DD"
  revenue: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
  currency?: string
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

function CustomTooltip({ active, payload, label, currency }: TooltipContentProps<number, string> & { currency: string }) {
  if (!active || !payload?.length) return null
  const value = (payload[0]?.value as number) ?? 0
  return (
    <div className="bg-[#1a1a1a] border border-white/[0.1] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[11px] text-zinc-500 mb-0.5">
        {label ? format(parseISO(String(label)), 'd MMM') : ''}
      </p>
      <p className="text-sm font-bold text-[#c9a84c]">{formatCurrency(value, currency)}</p>
    </div>
  )
}

export function RevenueChart({ data, currency = 'GBP' }: RevenueChartProps) {
  const total = data.reduce((sum, d) => sum + d.revenue, 0)

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Revenue (30 days)</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(total, currency)}</p>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c9a84c" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#c9a84c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#52525b', fontSize: 10 }}
              tickFormatter={(v) => format(parseISO(v), 'd MMM')}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#52525b', fontSize: 10 }}
              tickFormatter={(v) => `${currency === 'GBP' ? '£' : '$'}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              content={(props) => <CustomTooltip {...(props as TooltipContentProps<number, string>)} currency={currency} />}
              cursor={{ stroke: 'rgba(201,168,76,0.2)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#c9a84c"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#c9a84c', stroke: '#0a0a0a', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function RevenueChartSkeleton() {
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-4 animate-pulse">
      <div className="space-y-1.5">
        <div className="h-3 w-28 bg-white/[0.06] rounded" />
        <div className="h-7 w-24 bg-white/[0.06] rounded" />
      </div>
      <div className="h-48 bg-white/[0.03] rounded-lg" />
    </div>
  )
}
