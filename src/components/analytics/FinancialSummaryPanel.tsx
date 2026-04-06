'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer, type TooltipContentProps,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CategoryRevenue, CommissionRow, MoMRow } from '@/lib/analytics'

interface Props {
  categoryRevenue: CategoryRevenue[]
  commissions:     CommissionRow[]
  momRows:         MoMRow[]
  currency:        string
}

const CAT_COLOURS = ['#c9a84c', '#e2bf6a', '#6366f1', '#10b981', '#f59e0b', '#ef4444']

function fmtCur(v: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v)
}

function CatTooltip({ active, payload, label, currency }: TooltipContentProps<number, string> & { currency: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 shadow-2xl space-y-1">
      <p className="text-[11px] text-zinc-500">{label}</p>
      <p className="text-sm font-bold text-[#c9a84c]">{fmtCur((payload[0]?.value as number) ?? 0, currency)}</p>
    </div>
  )
}

export function FinancialSummaryPanel({ categoryRevenue, commissions, momRows, currency }: Props) {
  return (
    <div className="space-y-6">
      {/* Revenue by category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-white/[0.05] rounded-xl p-5 space-y-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Revenue by service category</p>
          {categoryRevenue.length === 0 ? (
            <p className="text-sm text-zinc-600 py-8 text-center">No data</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryRevenue} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false}
                    tick={{ fill: '#52525b', fontSize: 10 }}
                    tickFormatter={v => {
                      const sym = { GBP: '£', USD: '$', EUR: '€' }[currency] ?? ''
                      return `${sym}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                    }} />
                  <YAxis type="category" dataKey="category" tickLine={false} axisLine={false}
                    tick={{ fill: '#a1a1aa', fontSize: 11 }} width={100}
                    tickFormatter={(v: string) => v.length > 13 ? v.slice(0, 12) + '…' : v} />
                  <Tooltip content={(p) => <CatTooltip {...(p as TooltipContentProps<number, string>)} currency={currency} />}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {categoryRevenue.map((_, i) => <Cell key={i} fill={CAT_COLOURS[i % CAT_COLOURS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Staff commission summary */}
        <div className="bg-[#1a1a1a] border border-white/[0.05] rounded-xl p-5 space-y-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Staff commissions</p>
          {commissions.length === 0 ? (
            <p className="text-sm text-zinc-600 py-8 text-center">No commissions in this period</p>
          ) : (
            <div className="space-y-0 divide-y divide-white/[0.04]">
              {commissions.map(row => (
                <div key={row.staffId} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm text-zinc-200">{row.name}</p>
                    <p className="text-[10px] text-zinc-600">{row.commissionRate}% rate · {fmtCur(row.revenue, currency)} revenue</p>
                  </div>
                  <p className="text-sm font-semibold text-[#c9a84c]">{fmtCur(row.commission, currency)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3">
                <p className="text-xs font-semibold text-zinc-400">Total commissions</p>
                <p className="text-sm font-bold text-white">
                  {fmtCur(commissions.reduce((s, r) => s + r.commission, 0), currency)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Month-over-month growth table */}
      <div className="bg-[#1a1a1a] border border-white/[0.05] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Month-over-month growth</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500">Month</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500">Revenue</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500">Bookings</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {momRows.map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-zinc-300">{row.month}</td>
                  <td className="px-5 py-3 text-right text-white font-medium">{fmtCur(row.revenue, currency)}</td>
                  <td className="px-5 py-3 text-right text-zinc-400">{row.bookings}</td>
                  <td className="px-5 py-3 text-right">
                    {row.growth === null ? (
                      <span className="text-zinc-600 text-xs">—</span>
                    ) : (
                      <span className={cn('flex items-center justify-end gap-1 text-xs font-semibold',
                        row.growth > 0 ? 'text-emerald-400' : row.growth < 0 ? 'text-red-400' : 'text-zinc-400')}>
                        {row.growth > 0 ? <TrendingUp className="w-3 h-3" /> :
                          row.growth < 0 ? <TrendingDown className="w-3 h-3" /> :
                          <Minus className="w-3 h-3" />}
                        {row.growth > 0 ? '+' : ''}{row.growth.toFixed(1)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
