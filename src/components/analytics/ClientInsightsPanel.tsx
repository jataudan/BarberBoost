'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, type TooltipContentProps,
} from 'recharts'
import { Users, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClientInsightsData } from '@/lib/analytics'

interface Props {
  data:     ClientInsightsData
  currency: string
}

function fmtCur(v: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v)
}

function fmtDate(d: string | null) {
  if (!d) return 'Never'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ChartTooltip({ active, payload, label }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 shadow-2xl">
      <p className="text-[11px] text-zinc-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-semibold text-white">
          {p.dataKey === 'new' ? 'New' : 'Returning'}: {p.value}
        </p>
      ))}
    </div>
  )
}

export function ClientInsightsPanel({ data, currency }: Props) {
  const chartData = [
    { label: 'Clients', new: data.newCount, returning: data.returningCount },
  ]

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] border border-white/[0.05] rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-zinc-500" />
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">New clients</p>
          </div>
          <p className="text-2xl font-bold text-white">{data.newCount}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-white/[0.05] rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Returning</p>
          </div>
          <p className="text-2xl font-bold text-white">{data.returningCount}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-white/[0.05] rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Retention rate</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{data.retentionRate.toFixed(1)}%</p>
        </div>
        <div className="bg-[#1a1a1a] border border-white/[0.05] rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Avg lifetime value</span>
          </div>
          <p className="text-2xl font-bold text-[#c9a84c]">{fmtCur(data.avgLifetimeValue, currency)}</p>
        </div>
      </div>

      {/* New vs Returning chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-white/[0.05] rounded-xl p-5 space-y-3">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">New vs Returning</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ label: 'This period', new: data.newCount, returning: data.returningCount }]}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#52525b', fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#52525b', fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={(p) => <ChartTooltip {...(p as TooltipContentProps<number, string>)} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="new"       fill="#c9a84c" radius={[4, 4, 0, 0]} maxBarSize={48} name="New" />
                <Bar dataKey="returning" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={48} name="Returning" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c9a84c]" />
              <span className="text-xs text-zinc-500">New</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-xs text-zinc-500">Returning</span>
            </div>
          </div>
        </div>

        {/* At-risk clients */}
        <div className="bg-[#1a1a1a] border border-white/[0.05] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">At-risk clients</p>
            <span className="text-[10px] text-zinc-600">(60+ days no visit)</span>
          </div>
          {data.atRiskClients.length === 0 ? (
            <p className="text-sm text-zinc-600 py-6 text-center">No at-risk clients — great retention!</p>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {data.atRiskClients.map(c => (
                <div key={c.id} className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm text-zinc-200">{c.name}</p>
                    <p className="text-[10px] text-zinc-600 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      Last visit: {fmtDate(c.lastVisit)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#c9a84c] font-medium">{fmtCur(c.totalSpent, currency)}</p>
                    <p className="text-[9px] text-zinc-600">lifetime</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
