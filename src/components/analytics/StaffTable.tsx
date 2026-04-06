'use client'

import { getInitials } from '@/lib/utils'
import type { StaffRow } from '@/lib/analytics'

interface Props {
  data:     StaffRow[]
  currency: string
}

function fmtCur(v: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v)
}

const AVATAR_COLOURS = [
  'bg-[#c9a84c]/20 text-[#c9a84c]',
  'bg-indigo-500/20 text-indigo-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-rose-500/20 text-rose-400',
  'bg-violet-500/20 text-violet-400',
  'bg-blue-500/20 text-blue-400',
]

export function StaffTable({ data, currency }: Props) {
  if (!data.length) {
    return <p className="text-sm text-zinc-600 py-12 text-center">No completed bookings in this period</p>
  }

  const maxRev = data[0]?.revenue || 1

  return (
    <div className="space-y-2">
      {data.map((row, i) => {
        const pct = Math.round((row.revenue / maxRev) * 100)
        const barW = pct >= 100 ? 'w-full' : pct >= 90 ? 'w-[90%]' : pct >= 80 ? 'w-4/5'
          : pct >= 70 ? 'w-[70%]' : pct >= 60 ? 'w-3/5' : pct >= 50 ? 'w-1/2'
          : pct >= 40 ? 'w-2/5' : pct >= 30 ? 'w-[30%]' : pct >= 20 ? 'w-1/5'
          : pct >= 10 ? 'w-[10%]' : 'w-[5%]'

        return (
          <div key={row.id} className="flex items-center gap-3 py-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLOURS[i % AVATAR_COLOURS.length]}`}>
              {getInitials(row.name)}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-zinc-200 truncate">{row.name}</span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-zinc-500">{row.bookings} bkgs</span>
                  <span className="text-sm font-semibold text-white">{fmtCur(row.revenue, currency)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden" role="presentation" aria-hidden="true">
                <div className={`h-full bg-[#c9a84c] rounded-full ${barW}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
