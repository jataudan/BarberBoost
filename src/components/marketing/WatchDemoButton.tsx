'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, X, Bell } from 'lucide-react'

function DemoComingSoonModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md">
        {/* Glow behind card */}
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-[#c9a84c]/30 to-transparent blur-xl pointer-events-none" />

        <div className="relative bg-[#0f0f0f] border border-[#2a2a2a] rounded-3xl overflow-hidden shadow-2xl">

          {/* Gold top bar */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-zinc-400 hover:text-white transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Video placeholder area */}
          <div className="relative bg-[#0a0a0a] mx-5 mt-5 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-white/[0.06]">
            {/* Subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c]/5 via-transparent to-[#c9a84c]/3" />

            {/* Decorative scissor watermark */}
            <svg
              viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="0.8"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              className="absolute inset-0 w-full h-full text-[#c9a84c]/5 scale-150"
            >
              <circle cx="16" cy="16" r="10" />
              <circle cx="16" cy="48" r="10" />
              <line x1="24" y1="22" x2="56" y2="8" />
              <line x1="24" y1="42" x2="56" y2="56" />
            </svg>

            {/* Play button */}
            <div className="relative flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full border-2 border-[#c9a84c]/40 bg-[#c9a84c]/10 flex items-center justify-center group-hover:bg-[#c9a84c]/20 transition-colors">
                <Play className="w-6 h-6 text-[#c9a84c] fill-[#c9a84c] ml-0.5" />
              </div>
              <span className="text-[11px] text-zinc-600 font-medium tracking-widest uppercase">
                Coming Soon
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pt-5 pb-6 text-center space-y-3">
            {/* Brand badge */}
            <div className="flex items-center justify-center">
              <Image src="/logo.png" alt="BarberBoost" width={110} height={22} className="h-5 w-auto" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-tight">
                DEMO VIDEO
              </h2>
              <p className="text-[#c9a84c] font-semibold text-sm tracking-widest uppercase">
                Coming Soon
              </p>
            </div>

            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
              We&apos;re putting the finishing touches on a full walkthrough of the platform.
              Sign up free and explore it yourself in the meantime.
            </p>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-1">
              <a
                href="/signup"
                className="flex-1 flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-sm px-5 py-3 rounded-xl transition-colors"
              >
                Try It Free
              </a>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 border border-white/[0.08] hover:border-white/[0.15] text-zinc-400 hover:text-white text-sm px-5 py-3 rounded-xl transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
                Notify Me
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function WatchDemoButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-3 text-white border border-zinc-700 hover:border-[#c9a84c]/50 px-6 sm:px-8 py-4 rounded-xl transition-all duration-200 text-base hover:bg-[#c9a84c]/5"
      >
        <span className="w-8 h-8 rounded-full border border-zinc-600 flex items-center justify-center flex-shrink-0">
          <Play className="w-3 h-3 fill-white ml-0.5" />
        </span>
        Watch Demo
      </button>

      {open && <DemoComingSoonModal onClose={() => setOpen(false)} />}
    </>
  )
}
