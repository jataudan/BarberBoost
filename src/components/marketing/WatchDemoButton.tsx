'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, X } from 'lucide-react'

function DemoModal({ onClose }: { onClose: () => void }) {
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

          {/* Video */}
          <div className="relative bg-[#0a0a0a] mx-5 mt-5 rounded-2xl overflow-hidden aspect-video border border-white/[0.06]">
            <video
              src="/videos/walkthrough.webm"
              controls
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
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
                See It In Action
              </p>
            </div>

            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
              A real walkthrough — booking a client, confirming appointments, and running the dashboard.
            </p>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {/* Actions */}
            <div className="pt-1">
              <a
                href="/signup"
                className="flex items-center justify-center gap-2 w-full bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-sm px-5 py-3 rounded-xl transition-colors"
              >
                Try It Free
              </a>
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

      {open && <DemoModal onClose={() => setOpen(false)} />}
    </>
  )
}
