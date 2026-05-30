'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface IosInstallModalProps {
  shopName:   string
  logoUrl:    string | null
  accentColor: string
  open:       boolean
  onClose:    () => void
}

/**
 * IosInstallModal — iOS "Save to Phone" instructions
 *
 * iOS Safari does not support the `beforeinstallprompt` API, so we cannot
 * trigger a native install dialog. Instead, this modal shows the user the
 * three-step manual flow: Share → Add to Home Screen → Add.
 *
 * Shown only on iOS Safari (detected by usePwaInstallPrompt).
 * Animated slide-up sheet on mobile.
 */
export function IosInstallModal({
  shopName,
  logoUrl,
  accentColor,
  open,
  onClose,
}: IosInstallModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Trap focus and prevent background scroll while modal is open
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Save ${shopName} to your iPhone`}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:max-w-sm mx-auto bg-[#111111] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">

        {/* Drag handle (mobile visual affordance) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${shopName} logo`}
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black text-sm"
                style={{ background: `linear-gradient(135deg, ${accentColor}, #a8873a)` }}
              >
                {shopName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-white leading-tight">{shopName}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Save to iPhone Home Screen</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] mx-5" />

        {/* Steps */}
        <div className="px-5 py-5 space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            To save <span className="text-white font-semibold">{shopName}</span> to your iPhone home screen:
          </p>

          <div className="space-y-3">
            <Step number={1} accentColor={accentColor}>
              Tap the{' '}
              <span className="inline-flex items-center gap-1 align-middle">
                {/* iOS Share icon approximation */}
                <ShareIcon accentColor={accentColor} />
                <span className="text-white font-semibold">Share</span>
              </span>{' '}
              icon at the bottom of your browser
            </Step>

            <Step number={2} accentColor={accentColor}>
              Scroll down and tap{' '}
              <span className="text-white font-semibold">Add to Home Screen</span>
            </Step>

            <Step number={3} accentColor={accentColor}>
              Tap{' '}
              <span className="font-semibold" style={{ color: accentColor }}>Add</span>{' '}
              in the top-right corner
            </Step>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-5 pb-6 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: accentColor, color: '#000' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

function Step({
  number,
  accentColor,
  children,
}: {
  number: number
  accentColor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 mt-0.5"
        style={{ background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44` }}
      >
        {number}
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed flex-1">{children}</p>
    </div>
  )
}

function ShareIcon({ accentColor }: { accentColor: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={accentColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}
