'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipContentProps,
} from 'recharts'

export interface ServiceDataPoint {
  name: string
  bookings: number
}

interface TopServicesProps {
  data: ServiceDataPoint[]
}

const BAR_COLOURS = ['#c9a84c', '#e2bf6a', '#b8963d', '#d4aa55', '#a8872e']

function CustomTooltip({ active, payload }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null
  const item  = payload[0]
  const value = item?.value as number | undefined
  return (
    <div className="bg-[#1a1a1a] border border-white/[0.1] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[11px] text-zinc-500 mb-0.5">{item?.name as string}</p>
      <p className="text-sm font-bold text-white">
        {value} booking{value !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// Truncate long service names for axis display
function truncate(str: string, n = 16) {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

export function TopServices({ data }: TopServicesProps) {
  const isEmpty = data.length === 0

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-4">
      <div>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Top Services</p>
        <p className="text-sm text-zinc-400 mt-0.5">Bookings this week</p>
      </div>

      {isEmpty ? (
        <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
          No bookings this week
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 8, bottom: 0, left: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#52525b', fontSize: 10 }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                tickFormatter={(v) => truncate(v)}
                width={100}
              />
              <Tooltip content={(p) => <CustomTooltip {...(p as TooltipContentProps<number, string>)} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="bookings" radius={[0, 4, 4, 0]}>
                {data.map((_, index) => (
                  <Cell key={index} fill={BAR_COLOURS[index % BAR_COLOURS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export function TopServicesSkeleton() {
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-4 animate-pulse">
      <div className="space-y-1.5">
        <div className="h-3 w-24 bg-white/[0.06] rounded" />
        <div className="h-3 w-32 bg-white/[0.06] rounded" />
      </div>
      <div className="h-48 bg-white/[0.03] rounded-lg" />
    </div>
  )
}
