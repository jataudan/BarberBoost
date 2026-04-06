'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-9 h-9 text-red-400" />
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-3">
          <h1 className="font-[family-name:var(--font-heading)] text-4xl tracking-widest text-white">
            SOMETHING WENT WRONG
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            An unexpected error occurred. Our team has been notified.
            {error.digest && (
              <span className="block text-xs text-zinc-700 mt-2 font-mono">
                Error ID: {error.digest}
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold rounded-xl px-5 py-2.5 text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 hover:text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
