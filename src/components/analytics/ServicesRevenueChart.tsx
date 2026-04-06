'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, type TooltipContentProps,
} from 'recharts'
import type { TopService } from '@/lib/analytics'

const BAR_COLOURS = ['#c9a84c', '#e2bf6a', '#b8963d', '#d4aa55', '#a8872e', '#c9a84c']

interface Props {
  data:     TopService[]
  currency: string
}

function fmtCur(v: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v)
}

function CustomTooltip({ active, payload, label, currency }: TooltipContentProps<number, string> & { currency: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 shadow-2xl space-y-1">
      <p className="text-[11px] text-zinc-500 mb-1 font-medium">{label}</p>
      <p className="text-sm font-bold text-[#c9a84c]">{fmtCur((payload[0]?.value as number) ?? 0, currency)}</p>
      {payload[1] && <p className="text-xs text-zinc-400">{payload[1]?.value} bookings</p>}
    </div>
  )
}

export function ServicesRevenueChart({ data, currency }: Props) {
  if (!data.length) {
    return <p className="text-sm text-zinc-600 py-12 text-center">No data for this period</p>
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false}
            tick={{ fill: '#52525b', fontSize: 10 }}
            tickFormatter={v => {
              const sym = { GBP: '£', USD: '$', EUR: '€' }[currency] ?? currency
              return `${sym}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
            }} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false}
            tick={{ fill: '#a1a1aa', fontSize: 11 }} width={110}
            tickFormatter={(v: string) => v.length > 15 ? v.slice(0, 14) + '…' : v} />
          <Tooltip content={(p) => <CustomTooltip {...(p as TooltipContentProps<number, string>)} currency={currency} />}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={BAR_COLOURS[i % BAR_COLOURS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
