'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OnboardingStatus } from '@/app/api/onboarding/route'

const DISMISS_KEY = 'bb_onboarding_dismissed'

// ── Confetti ──────────────────────────────────────────────────────────────
function Confetti() {
  const COLOURS = ['#c9a84c', '#e2bf6a', '#10b981', '#6366f1', '#f43f5e', '#f59e0b']
  const pieces  = Array.from({ length: 40 }, (_, i) => ({
    id:     i,
    x:      Math.random() * 100,
    delay:  Math.random() * 0.6,
    dur:    0.8 + Math.random() * 0.6,
    colour: COLOURS[i % COLOURS.length],
    size:   4 + Math.random() * 6,
    rotate: Math.random() * 360,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute top-0 animate-[confetti-fall_ease-in_forwards]"
          style={{
            left:             `${p.x}%`,
            width:            `${p.size}px`,
            height:           `${p.size}px`,
            backgroundColor:  p.colour,
            borderRadius:     p.size > 7 ? '50%' : '2px',
            transform:        `rotate(${p.rotate}deg)`,
            animationDelay:   `${p.delay}s`,
            animationDuration:`${p.dur}s`,
          }}
        />
      ))}
    </div>
  )
}

// ── Steps config ──────────────────────────────────────────────────────────
interface Step {
  id:      string
  label:   string
  hint:    string
  href:    string
  done:    (s: OnboardingStatus) => boolean
}

const STEPS: Step[] = [
  {
    id:   'account',
    label:'Create your account',
    hint: 'You\'re in — welcome to BarberBoost!',
    href: '/dashboard',
    done: () => true, // always complete
  },
  {
    id:   'service',
    label:'Add your first service',
    hint: 'Add a haircut, beard trim or any service you offer.',
    href: '/services',
    done: s => s.hasServices,
  },
  {
    id:   'staff',
    label:'Add a barber',
    hint: 'Add yourself or a team member to start taking bookings.',
    href: '/staff',
    done: s => s.hasStaff,
  },
  {
    id:   'hours',
    label:'Set your opening hours',
    hint: 'Tell clients when you\'re open.',
    href: '/settings/shop',
    done: s => s.hasOpeningHours,
  },
  {
    id:   'share',
    label:'Share your booking page',
    hint: 'Your link is ready — share it with clients.',
    href: '/settings/booking-page',
    done: s => !!s.shopSlug,
  },
  {
    id:   'booking',
    label:'Make your first booking',
    hint: 'Add a booking manually or wait for a client to book online.',
    href: '/bookings',
    done: s => s.hasBookings,
  },
  {
    id:   'client',
    label:'Add a client',
    hint: 'Build your client database — track visits and spending.',
    href: '/clients',
    done: s => s.hasClients,
  },
]

// ── Component ─────────────────────────────────────────────────────────────
export function OnboardingChecklist() {
  const [status,    setStatus]    = useState<OnboardingStatus | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [confetti,  setConfetti]  = useState(false)
  const prevAllDone               = useRef(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(DISMISS_KEY)
      if (saved === 'true') { setDismissed(true); return }
    }
    fetch('/api/onboarding')
      .then(r => r.json() as Promise<{ data?: OnboardingStatus }>)
      .then(json => { if (json.data) setStatus(json.data) })
      .catch(() => {})
  }, [])

  const completedCount = status ? STEPS.filter(s => s.done(status)).length : 0
  const allDone        = completedCount === STEPS.length

  // Fire confetti once when all steps complete
  useEffect(() => {
    if (allDone && !prevAllDone.current && status) {
      prevAllDone.current = true
      setConfetti(true)
      setTimeout(() => setConfetti(false), 2000)
    }
  }, [allDone, status])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  if (dismissed || !status) return null

  const pct = Math.round((completedCount / STEPS.length) * 100)

  return (
    <>
      {confetti && <Confetti />}
      <div className="bg-[#111111] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={() => setCollapsed(v => !v)}
            className="flex items-center gap-3 flex-1 text-left group"
          >
            <div className="relative w-9 h-9 flex-shrink-0">
              {/* Circular progress ring */}
              <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke={allDone ? '#10b981' : '#c9a84c'} strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${pct * 0.942} 94.2`}
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-zinc-400">
                {completedCount}/{STEPS.length}
              </span>
            </div>

            <div>
              <p className={cn('text-sm font-semibold', allDone ? 'text-emerald-400' : 'text-white')}>
                {allDone ? 'You\'re all set! 🎉' : 'Get started'}
              </p>
              <p className="text-xs text-zinc-500">
                {allDone ? 'Your shop is ready to take bookings' : `${STEPS.length - completedCount} step${STEPS.length - completedCount !== 1 ? 's' : ''} remaining`}
              </p>
            </div>

            <div className="ml-auto text-zinc-600 group-hover:text-zinc-400 transition-colors">
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </button>

          <button
            type="button"
            onClick={dismiss}
            title="Dismiss"
            className="ml-2 w-6 h-6 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.05] transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Steps list */}
        {!collapsed && (
          <div className="border-t border-white/[0.05]">
            {STEPS.map((step, i) => {
              const done = step.done(status)
              return (
                <Link
                  key={step.id}
                  href={done ? '#' : step.href}
                  onClick={e => { if (done) e.preventDefault() }}
                  className={cn(
                    'flex items-start gap-3 px-5 py-3 border-b border-white/[0.04] last:border-0 transition-colors',
                    done
                      ? 'cursor-default'
                      : 'hover:bg-white/[0.02] group'
                  )}
                >
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    : <Circle       className="w-4 h-4 text-zinc-700 mt-0.5 flex-shrink-0 group-hover:text-zinc-500 transition-colors" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs font-medium',
                      done ? 'text-zinc-500 line-through' : 'text-zinc-200 group-hover:text-white transition-colors'
                    )}>
                      {step.label}
                    </p>
                    {!done && (
                      <p className="text-[11px] text-zinc-600 mt-0.5">{step.hint}</p>
                    )}
                  </div>
                  {i === 0 && (
                    <Sparkles className="w-3 h-3 text-[#c9a84c] mt-0.5 flex-shrink-0" />
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
