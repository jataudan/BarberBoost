import Link from 'next/link'
import type { Metadata } from 'next'
import { Home, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: '404 — Page Not Found | BarberBoost',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Decorative number */}
        <div className="relative flex justify-center">
          <span
            className="font-[family-name:var(--font-heading)] text-[160px] leading-none select-none"
            style={{
              background: 'linear-gradient(180deg, rgba(201,168,76,0.15) 0%, transparent 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </span>
        </div>

        {/* Scissors illustration */}
        <div className="flex justify-center -mt-8">
          <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle cx="18" cy="22" r="8" fill="rgba(201,168,76,0.1)" stroke="rgba(201,168,76,0.25)" strokeWidth="1.5"/>
            <circle cx="18" cy="22" r="4" fill="rgba(201,168,76,0.2)"/>
            <circle cx="18" cy="44" r="8" fill="rgba(201,168,76,0.1)" stroke="rgba(201,168,76,0.25)" strokeWidth="1.5"/>
            <circle cx="18" cy="44" r="4" fill="rgba(201,168,76,0.2)"/>
            <line x1="24" y1="26" x2="50" y2="12" stroke="rgba(201,168,76,0.4)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="24" y1="40" x2="50" y2="54" stroke="rgba(201,168,76,0.4)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="38" y1="32" x2="50" y2="32" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white">
            PAGE NOT FOUND
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            This page has been cut — just like a bad haircut, it&apos;s gone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold rounded-xl px-5 py-2.5 text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 hover:text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
