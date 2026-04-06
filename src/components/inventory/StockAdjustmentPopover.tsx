'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Minus, Plus, X, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InventoryItem } from '@/types/database'

const REASONS = ['Received', 'Sold', 'Damaged', 'Counted', 'Returned', 'Other'] as const
type Reason = typeof REASONS[number]

interface Props {
  item:      InventoryItem
  open:      boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (updated: InventoryItem) => void
}

export function StockAdjustmentPopover({ item, open, onOpenChange, onSuccess }: Props) {
  const [delta,     setDelta]     = useState<number>(0)
  const [reason,    setReason]    = useState<Reason>('Received')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const newQty   = Math.max(0, item.quantity + delta)
  const isNeg    = delta < 0
  const isZero   = delta === 0
  const isCrit   = newQty <= item.low_stock_threshold
  const wasOk    = item.quantity > item.low_stock_threshold

  function nudge(n: number) {
    setDelta(d => d + n)
    setError(null)
  }

  function handleInput(raw: string) {
    const v = parseInt(raw, 10)
    setDelta(isNaN(v) ? 0 : v)
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next) { setDelta(0); setReason('Received'); setError(null) }
    onOpenChange(next)
  }

  async function handleSave() {
    if (isZero) { handleOpenChange(false); return }
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/inventory', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: item.id, adjust: true, delta, reason }),
      })
      const json = await res.json() as { data?: InventoryItem; error?: string }
      if (!res.ok) { setError(json.error ?? 'Adjustment failed'); return }
      if (json.data) onSuccess(json.data)
      handleOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs bg-[#141414] border border-white/[0.08] rounded-2xl shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <div>
              <Dialog.Title className="text-sm font-semibold text-white">Adjust Stock</Dialog.Title>
              <Dialog.Description className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">
                {item.name}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close"
                className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-white flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="px-5 py-5 space-y-5">
            {/* Current → New quantity display */}
            <div className="flex items-center justify-between bg-[#1a1a1a] rounded-xl px-4 py-3">
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-0.5">Current</p>
                <p className="text-2xl font-black text-white">{item.quantity}</p>
              </div>
              <div className="flex items-center gap-1 text-zinc-600">
                {isNeg ? <TrendingDown className="w-4 h-4 text-red-400" /> : <TrendingUp className="w-4 h-4 text-emerald-400" />}
                <span className={cn('text-sm font-semibold', isZero ? 'text-zinc-600' : isNeg ? 'text-red-400' : 'text-emerald-400')}>
                  {isZero ? '±0' : isNeg ? delta : `+${delta}`}
                </span>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-0.5">New</p>
                <p className={cn('text-2xl font-black', isCrit ? 'text-red-400' : 'text-white')}>{newQty}</p>
              </div>
            </div>

            {/* Low-stock warning if transition would cross threshold */}
            {wasOk && isCrit && !isZero && (
              <p className="text-xs text-amber-400 bg-amber-400/[0.06] border border-amber-400/20 rounded-lg px-3 py-2">
                ⚠️ This will trigger a low-stock alert email to the shop owner.
              </p>
            )}

            {/* Delta control */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Change by</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => nudge(-10)}
                  className="w-9 h-9 rounded-xl bg-red-500/[0.08] hover:bg-red-500/[0.15] text-red-400 hover:text-red-300 flex items-center justify-center transition-colors font-bold text-xs">
                  −10
                </button>
                <button type="button" onClick={() => nudge(-1)}
                  className="w-9 h-9 rounded-xl bg-red-500/[0.08] hover:bg-red-500/[0.15] text-red-400 hover:text-red-300 flex items-center justify-center transition-colors">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  value={delta}
                  onChange={e => handleInput(e.target.value)}
                  className="flex-1 text-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm font-semibold text-white outline-none focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button type="button" onClick={() => nudge(1)}
                  className="w-9 h-9 rounded-xl bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15] text-emerald-400 hover:text-emerald-300 flex items-center justify-center transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => nudge(10)}
                  className="w-9 h-9 rounded-xl bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15] text-emerald-400 hover:text-emerald-300 flex items-center justify-center transition-colors font-bold text-xs">
                  +10
                </button>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Reason</label>
              <div className="grid grid-cols-3 gap-1.5">
                {REASONS.map(r => (
                  <button key={r} type="button" onClick={() => setReason(r)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      reason === r
                        ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30'
                        : 'bg-white/[0.03] text-zinc-500 border-white/[0.05] hover:text-zinc-300 hover:border-white/10'
                    )}>{r}</button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 bg-red-500/[0.07] border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Dialog.Close asChild>
                <button type="button"
                  className="flex-1 bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
                  Cancel
                </button>
              </Dialog.Close>
              <button type="button" onClick={handleSave} disabled={loading || isZero}
                className="flex-1 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl py-2.5 text-sm transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
