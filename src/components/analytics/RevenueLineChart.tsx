'use client'

import { useState } from 'react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, type TooltipContentProps,
} from 'recharts'
import type { RevenuePoint } from '@/lib/analytics'

interface Props {
  data:     RevenuePoint[]
  currency: string
}

function fmtCur(v: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v)
}

function CustomTooltip({ active, payload, label, currency }: TooltipContentProps<number, string> & { currency: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 shadow-2xl space-y-1.5">
      <p className="text-[11px] text-zinc-500">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.dataKey === 'revenue' ? 'bg-[#c9a84c]' : 'bg-indigo-400'}`} />
          <span className="text-xs text-zinc-400">{p.dataKey === 'revenue' ? 'Revenue' : 'Bookings'}:</span>
          <span className="text-xs font-semibold text-white">
            {p.dataKey === 'revenue' ? fmtCur((p.value as number) ?? 0, currency) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RevenueLineChart({ data, currency }: Props) {
  const [showBookings, setShowBookings] = useState(false)
  const currSymbol = ['GBP','USD','EUR'].includes(currency)
    ? { GBP: '£', USD: '$', EUR: '€' }[currency] ?? currency
    : currency

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Revenue over time</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs text-zinc-500">Show bookings</span>
          <button type="button" role="switch" aria-checked={showBookings ? 'true' : 'false'}
            onClick={() => setShowBookings(v => !v)}
            className={`relative w-8 h-4 rounded-full transition-colors ${showBookings ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${showBookings ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </label>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: showBookings ? 40 : 4, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c9a84c" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#c9a84c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false}
              tick={{ fill: '#52525b', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis yAxisId="rev" tickLine={false} axisLine={false}
              tick={{ fill: '#52525b', fontSize: 10 }}
              tickFormatter={v => `${currSymbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
            {showBookings && (
              <YAxis yAxisId="bkg" orientation="right" tickLine={false} axisLine={false}
                tick={{ fill: '#52525b', fontSize: 10 }} allowDecimals={false} />
            )}
            <Tooltip content={(p) => <CustomTooltip {...(p as TooltipContentProps<number, string>)} currency={currency} />}
              cursor={{ stroke: 'rgba(201,168,76,0.15)', strokeWidth: 1 }} />
            <Line yAxisId="rev" type="monotone" dataKey="revenue"
              stroke="#c9a84c" strokeWidth={2} dot={false}
              activeDot={{ r: 4, fill: '#c9a84c', stroke: '#0a0a0a', strokeWidth: 2 }} />
            {showBookings && (
              <Bar yAxisId="bkg" dataKey="bookings" fill="rgba(99,102,241,0.25)"
                radius={[2, 2, 0, 0]} maxBarSize={16} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
