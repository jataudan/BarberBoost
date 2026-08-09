'use client'

import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import Link from 'next/link'
import { X, ArrowRight, Sparkles, CalendarCheck, TrendingUp, ShieldCheck } from 'lucide-react'

const STORAGE_KEY = 'bb_trial_modal_v1'
const FALLBACK_DELAY_MS = 20_000

const PERKS = [
  { icon: CalendarCheck, text: 'Unlimited bookings on Pro, on us' },
  { icon: TrendingUp,    text: 'Cut no-shows with automatic reminders' },
  { icon: ShieldCheck,   text: 'No card, no contract — cancel any time' },
]

/**
 * Homepage-only conversion modal for the 30-day trial. Fires on exit-intent
 * (mouse leaving toward the top of the viewport) on pointer-fine devices, or
 * a 20s fallback timer everywhere else (mobile has no exit-intent signal).
 * Shown at most once per visitor via localStorage.
 */
export function TrialSignupModal() {
  const [open, setOpen] = useState(false)
  const shownRef = useRef(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return

    function trigger() {
      if (shownRef.current) return
      shownRef.current = true
      localStorage.setItem(STORAGE_KEY, '1')
      setOpen(true)
    }

    const isPointerFine = window.matchMedia('(pointer: fine)').matches
    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0) trigger()
    }
    if (isPointerFine) document.addEventListener('mouseleave', handleMouseLeave)

    const timer = setTimeout(trigger, FALLBACK_DELAY_MS)

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      clearTimeout(timer)
    }
  }, [])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md
                     data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0
                     data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                     data-[state=open]:slide-in-from-bottom-4 duration-300"
        >
          <div className="relative overflow-hidden rounded-2xl border border-[#c9a84c]/25 bg-[#0a0a0a] shadow-2xl shadow-black/60">
            {/* Decorative glow, matching the hero */}
            <div className="absolute inset-0 pointer-events-none hero-glow" aria-hidden="true" />
            <div className="absolute -top-24 -right-20 w-56 h-56 rounded-full bg-[#c9a84c]/10 blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#c9a84c]/[0.06] blur-3xl pointer-events-none" aria-hidden="true" />

            <Dialog.Close className="absolute top-4 right-4 z-10 text-zinc-500 hover:text-white transition-colors rounded-lg p-1.5 hover:bg-white/5">
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>

            <div className="relative px-7 pt-9 pb-8 text-center">
              <div className="inline-flex items-center gap-2 bg-[#c9a84c]/8 border border-[#c9a84c]/25 text-[#c9a84c] text-[11px] font-bold px-3.5 py-1.5 rounded-full tracking-widest uppercase mb-5">
                <Sparkles className="w-3 h-3" />
                For new shops only
              </div>

              <Dialog.Title className="font-[family-name:var(--font-heading)] leading-[0.95] tracking-wide text-[clamp(2rem,7vw,2.75rem)]">
                <span className="block text-white">30 DAYS.</span>
                <span className="block text-[#c9a84c]">ZERO RISK.</span>
                <span className="block text-white">ALL BOSS.</span>
              </Dialog.Title>

              <Dialog.Description className="text-zinc-400 text-sm mt-4 max-w-sm mx-auto leading-relaxed">
                Try every Pro feature free for 30 days — no card, no contract. See why 500+ UK
                barbershops run on BarberBoost before you commit to a thing.
              </Dialog.Description>

              <ul className="mt-6 space-y-2.5 text-left max-w-xs mx-auto">
                {PERKS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#c9a84c]/10 text-[#c9a84c] shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="group mt-7 flex items-center justify-center gap-2 w-full bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold px-6 py-4 rounded-xl transition-all duration-200 text-sm tracking-wide shadow-lg shadow-[#c9a84c]/20 hover:shadow-[#c9a84c]/30 hover:scale-[1.02]"
              >
                Start My Free Trial
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Dialog.Close asChild>
                <button
                  type="button"
                  className="mt-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Maybe later
                </button>
              </Dialog.Close>

              <p className="mt-4 text-[11px] text-zinc-600">
                No credit card required · Full 30 days · Cancel any time
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
