'use client'

import { cn } from '@/lib/utils'
import type { HeatmapCell } from '@/lib/analytics'

interface Props {
  data: HeatmapCell[]
}

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)  // 8–20

function intensityClass(count: number, max: number): string {
  if (max === 0 || count === 0) return 'bg-white/[0.03]'
  const ratio = count / max
  if (ratio >= 0.8) return 'bg-[#c9a84c]'
  if (ratio >= 0.6) return 'bg-[#c9a84c]/80'
  if (ratio >= 0.4) return 'bg-[#c9a84c]/55'
  if (ratio >= 0.2) return 'bg-[#c9a84c]/30'
  return 'bg-[#c9a84c]/15'
}

export function BusiestHoursHeatmap({ data }: Props) {
  const max = Math.max(...data.map(c => c.count), 1)

  function cell(day: number, hour: number) {
    return data.find(c => c.day === day && c.hour === hour)
  }

  return (
    <div className="space-y-2 overflow-x-auto">
      {/* Hour labels */}
      <div className="flex gap-0.5 pl-8">
        {HOURS.map(h => (
          <div key={h} className="flex-1 text-center text-[9px] text-zinc-600 min-w-[1.6rem]">
            {h % 2 === 0 ? `${h}h` : ''}
          </div>
        ))}
      </div>

      {/* Grid */}
      {DAYS.map((day, di) => (
        <div key={day} className="flex items-center gap-0.5">
          <span className="w-7 text-[10px] text-zinc-600 flex-shrink-0 text-right pr-1">{day}</span>
          {HOURS.map(h => {
            const c = cell(di, h)
            return (
              <div key={h}
                title={c && c.count > 0 ? `${day} ${h}:00 — ${c.count} booking${c.count !== 1 ? 's' : ''}` : undefined}
                className={cn(
                  'flex-1 min-w-[1.6rem] h-5 rounded-sm transition-all cursor-default',
                  intensityClass(c?.count ?? 0, max)
                )} />
            )
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-1.5 pt-1 pl-8">
        <span className="text-[9px] text-zinc-600 mr-1">Less</span>
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((r) => (
          <div key={r}
            className={cn('w-3.5 h-3.5 rounded-sm', intensityClass(Math.round(r * max), max))} />
        ))}
        <span className="text-[9px] text-zinc-600 ml-1">More</span>
      </div>
    </div>
  )
}
