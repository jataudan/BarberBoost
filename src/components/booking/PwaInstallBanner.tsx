'use client'

import { useState } from 'react'
import { X, Download } from 'lucide-react'
import { usePwaInstallPrompt } from '@/hooks/usePwaInstallPrompt'
import { IosInstallModal } from './IosInstallModal'
import type { PwaConfig } from '@/lib/pwa/manifest'

interface PwaInstallBannerProps {
  shopSlug: string
  pwa: PwaConfig
}

/**
 * PwaInstallBanner — Personal Booking App Shortcut
 *
 * Premium Pro/Empire feature. Renders a branded "Save to Phone" banner at the
 * bottom of the booking page, above the sticky "Book an Appointment" bar.
 *
 * Platform behaviour:
 *   Android (Chrome / Edge / Samsung Internet):
 *     Shows banner → user taps "Save to Phone" → native install dialog appears.
 *
 *   iOS Safari:
 *     Shows banner → user taps "Save to Phone" → IosInstallModal with step-by-
 *     step Share → Add to Home Screen instructions slides up.
 *
 *   Desktop / unsupported browsers:
 *     Banner is hidden entirely via `sm:hidden` — the feature is mobile-only.
 *
 *   Already installed / dismissed:
 *     usePwaInstallPrompt handles suppression; this component renders nothing.
 */
export function PwaInstallBanner({ shopSlug, pwa }: PwaInstallBannerProps) {
  const {
    canInstall,
    isIos,
    showBanner,
    handleInstall,
    handleDismiss,
  } = usePwaInstallPrompt(shopSlug)

  const [iosModalOpen, setIosModalOpen] = useState(false)

  // Don't render on desktop or when there's nothing to show
  if (!showBanner) return null
  // Must be either an Android prompt or an iOS device
  if (!canInstall && !isIos) return null

  function handleSaveClick() {
    if (isIos) {
      setIosModalOpen(true)
    } else {
      handleInstall()
    }
  }

  function handleIosModalClose() {
    setIosModalOpen(false)
    // Treat modal open as engagement — dismiss the banner once user has seen instructions
    handleDismiss()
  }

  return (
    <>
      {/*
       * Banner — fixed above the "Book an Appointment" sticky bar (bottom-[72px]).
       * Hidden on sm+ (tablet/desktop) because the feature targets mobile only.
       *
       * z-index 39 keeps it below the existing z-40 "Book Now" bar and any
       * modals/drawers that sit at z-50+.
       */}
      <div
        className="sm:hidden fixed bottom-[72px] inset-x-0 z-[39] px-3 pb-1"
        role="complementary"
        aria-label="Save to phone banner"
      >
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl border"
          style={{
            background:   '#111111',
            borderColor:  `${pwa.accentColor}30`,
            boxShadow:    `0 -4px 32px rgba(0,0,0,0.6), 0 0 0 1px ${pwa.accentColor}18`,
          }}
        >
          {/* Shop icon */}
          <div className="flex-shrink-0">
            {pwa.appleTouchIcon && pwa.appleTouchIcon !== '/icon.png' ? (
              <img
                src={pwa.appleTouchIcon}
                alt={`${pwa.appName} logo`}
                className="w-11 h-11 rounded-xl object-cover"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-black text-sm"
                style={{ background: `linear-gradient(135deg, ${pwa.accentColor}, #a8873a)` }}
              >
                {pwa.shortName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Copy */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white leading-tight truncate">
              Add {pwa.appName} to your phone
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
              Book faster next time with one tap.
            </p>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSaveClick}
            aria-label={`Save ${pwa.appName} to your phone`}
            className="flex items-center gap-1.5 flex-shrink-0 rounded-xl px-3 py-2 text-[12px] font-bold transition-opacity active:opacity-75"
            style={{ background: pwa.accentColor, color: '#000' }}
          >
            <Download className="w-3.5 h-3.5" />
            Save
          </button>

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Not now — dismiss install prompt"
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* "Not now" text link — extra escape hatch below the banner */}
        <p className="text-center mt-1.5">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Not now
          </button>
        </p>
      </div>

      {/* iOS manual instructions modal */}
      {isIos && (
        <IosInstallModal
          shopName={pwa.appName}
          logoUrl={pwa.appleTouchIcon !== '/icon.png' ? pwa.appleTouchIcon : null}
          accentColor={pwa.accentColor}
          open={iosModalOpen}
          onClose={handleIosModalClose}
        />
      )}
    </>
  )
}
