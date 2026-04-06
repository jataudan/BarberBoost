'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronDown, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PeriodKey } from '@/lib/analytics'

const PRESETS: { value: PeriodKey; label: string }[] = [
  { value: 'today',  label: 'Today'        },
  { value: 'week',   label: 'This Week'    },
  { value: 'month',  label: 'This Month'   },
  { value: '30d',    label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
]

interface DateRangeSelectorProps {
  activePeriod: PeriodKey
  activeFrom?:  string
  activeTo?:    string
}

export function DateRangeSelector({ activePeriod, activeFrom, activeTo }: DateRangeSelectorProps) {
  const router     = useRouter()
  const pathname   = usePathname()
  const sp         = useSearchParams()
  const [open, setOpen]     = useState(false)
  const [from, setFrom]     = useState(activeFrom ?? '')
  const [to,   setTo]       = useState(activeTo   ?? '')
  const [custom, setCustom] = useState(activePeriod === 'custom')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function navigate(period: PeriodKey, f?: string, t?: string) {
    const params = new URLSearchParams(sp.toString())
    params.set('period', period)
    if (period === 'custom' && f && t) {
      params.set('from', f)
      params.set('to', t)
    } else {
      params.delete('from')
      params.delete('to')
    }
    router.push(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  function handleCustomApply() {
    if (!from || !to || from > to) return
    navigate('custom', from, to)
  }

  const activeLabel = activePeriod === 'custom' && activeFrom && activeTo
    ? `${activeFrom} – ${activeTo}`
    : (PRESETS.find(p => p.value === activePeriod)?.label ?? 'Last 30 Days')

  return (
    <div ref={ref} className="relative">
      <button type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-[#111111] border border-white/[0.06] hover:border-white/[0.12] rounded-xl pl-3.5 pr-3 py-2 text-sm text-zinc-300 transition-colors">
        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
        {activeLabel}
        <ChevronDown className={cn('w-3.5 h-3.5 text-zinc-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[#111111] border border-[#2a2a2a] rounded-xl shadow-2xl z-30 overflow-hidden">
          {PRESETS.filter(p => p.value !== 'custom').map(p => (
            <button key={p.value} type="button"
              onClick={() => { setCustom(false); navigate(p.value) }}
              className={cn(
                'w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.04]',
                activePeriod === p.value && !custom
                  ? 'text-[#c9a84c] bg-[#c9a84c]/[0.06]'
                  : 'text-zinc-300'
              )}>{p.label}</button>
          ))}

          {/* Custom range */}
          <div className="border-t border-[#2a2a2a]">
            <button type="button"
              onClick={() => setCustom(v => !v)}
              className={cn(
                'w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.04]',
                activePeriod === 'custom' ? 'text-[#c9a84c] bg-[#c9a84c]/[0.06]' : 'text-zinc-300'
              )}>
              Custom Range
            </button>
            {custom && (
              <div className="px-4 pb-4 space-y-2">
                <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#c9a84c]/60" />
                <input type="date" value={to} onChange={e => setTo(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#c9a84c]/60" />
                <button type="button" onClick={handleCustomApply}
                  disabled={!from || !to || from > to}
                  className="w-full bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 text-[#0a0a0a] font-bold rounded-lg py-1.5 text-xs transition-colors">
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
