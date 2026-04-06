'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[MarketingError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">Something went wrong</p>
          <p className="text-xs text-zinc-500">{error.message || 'Please try refreshing the page.'}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 mx-auto bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold rounded-xl px-5 py-2.5 text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    </div>
  )
}
