'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-red-400" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <p className="text-sm font-semibold text-white">Something went wrong</p>
        <p className="text-xs text-zinc-500 leading-relaxed">
          {error.message || 'An unexpected error occurred loading this page.'}
        </p>
        {error.digest && (
          <p className="text-[10px] text-zinc-700 font-mono">ID: {error.digest}</p>
        )}
      </div>
      <button
        type="button"
        onClick={reset}
        className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold rounded-xl px-5 py-2.5 text-sm transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  )
}
