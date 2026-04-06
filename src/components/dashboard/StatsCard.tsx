import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string
  /** Numeric change as a percentage, e.g. 12.5 or -8.3 */
  changePct: number | null
  changeLabel?: string
  icon: ReactNode
  prefix?: string
  loading?: boolean
}

export function StatsCard({
  title,
  value,
  changePct,
  changeLabel,
  icon,
  loading = false,
}: StatsCardProps) {
  if (loading) return <StatsCardSkeleton />

  const positive = changePct !== null && changePct > 0
  const negative = changePct !== null && changePct < 0
  const neutral  = changePct === null || changePct === 0

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
        <div className="text-zinc-600">{icon}</div>
      </div>

      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>

      {changePct !== null && (
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold rounded-md px-1.5 py-0.5',
              positive ? 'bg-emerald-500/10 text-emerald-400' :
              negative ? 'bg-red-500/10 text-red-400' :
              'bg-zinc-700/40 text-zinc-400'
            )}
          >
            {positive ? (
              <TrendingUp className="w-3 h-3" />
            ) : negative ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {positive ? '+' : ''}{changePct.toFixed(1)}%
          </div>
          {changeLabel && (
            <span className="text-xs text-zinc-600">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-white/[0.06] rounded" />
        <div className="w-5 h-5 bg-white/[0.06] rounded" />
      </div>
      <div className="h-8 w-28 bg-white/[0.06] rounded" />
      <div className="h-5 w-20 bg-white/[0.06] rounded" />
    </div>
  )
}
