'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type TooltipContentProps } from 'recharts'
import type { StatusBreakdown } from '@/lib/analytics'

const STATUS_COLOURS: Record<string, string> = {
  completed:  '#c9a84c',
  confirmed:  '#6366f1',
  pending:    '#f59e0b',
  cancelled:  '#ef4444',
  no_show:    '#71717a',
}

// Tailwind-safe classes for legend dots (must be static strings)
const STATUS_DOT_CLASS: Record<string, string> = {
  completed: 'bg-[#c9a84c]',
  confirmed: 'bg-indigo-500',
  pending:   'bg-amber-500',
  cancelled: 'bg-red-500',
  no_show:   'bg-zinc-500',
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  confirmed: 'Confirmed',
  pending:   'Pending',
  cancelled: 'Cancelled',
  no_show:   'No-show',
}

interface Props {
  data: StatusBreakdown[]
}

function CustomTooltip({ active, payload }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null
  const item  = payload[0]
  const name  = item.name as string
  const value = item.value as number
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs font-semibold text-white">{STATUS_LABELS[name] ?? name}</p>
      <p className="text-sm font-bold mt-0.5" style={{ color: STATUS_COLOURS[name] ?? '#c9a84c' }}>
        {value} bookings
      </p>
    </div>
  )
}

export function StatusDonutChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (!data.length || total === 0) {
    return <p className="text-sm text-zinc-600 py-12 text-center">No bookings in this period</p>
  }

  return (
    <div className="space-y-4">
      <div className="h-52 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.map(d => ({ name: d.status, value: d.count }))}
              cx="50%" cy="50%" innerRadius="55%" outerRadius="80%"
              dataKey="value" strokeWidth={2} stroke="#0a0a0a">
              {data.map((d, i) => (
                <Cell key={i} fill={STATUS_COLOURS[d.status] ?? '#52525b'} />
              ))}
            </Pie>
            <Tooltip content={(p) => <CustomTooltip {...(p as TooltipContentProps<number, string>)} />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-black text-white">{total}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">total</p>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-3">
        {data.map(d => (
          <div key={d.status} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT_CLASS[d.status] ?? 'bg-zinc-500'}`} />
            <span className="text-xs text-zinc-400 truncate">{STATUS_LABELS[d.status] ?? d.status}</span>
            <span className="text-xs text-zinc-500 ml-auto">{((d.count / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
