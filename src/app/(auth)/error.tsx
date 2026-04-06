'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AuthError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center p-6">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold text-white">Something went wrong</p>
        <p className="text-xs text-zinc-500">{error.message || 'Please try again.'}</p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold rounded-xl px-4 py-2 text-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
        <Link
          href="/login"
          className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white rounded-xl px-4 py-2 text-sm transition-colors"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}
