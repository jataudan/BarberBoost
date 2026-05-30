'use client'

import { useState, useEffect, useCallback } from 'react'

// Chrome's BeforeInstallPromptEvent is not in the standard TS lib
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface UsePwaInstallPromptReturn {
  /** Android/Chrome: a native install prompt is available to trigger */
  canInstall:    boolean
  /** The device is iOS Safari — manual share-sheet instructions required */
  isIos:         boolean
  /** The page is already running as an installed standalone PWA */
  isStandalone:  boolean
  /** Whether to show the install banner (false if dismissed, installed, or standalone) */
  showBanner:    boolean
  /** Android: triggers the native install prompt. No-op on iOS. */
  handleInstall: () => Promise<void>
  /** Stores a dismissal timestamp; banner won't reappear for 7 days */
  handleDismiss: () => void
}

// localStorage key helpers — scoped per barber slug so each shop's
// banner state is tracked independently on shared devices
const dismissedKey = (slug: string) => `barberboost_install_dismissed_${slug}`
const installedKey = (slug: string) => `barberboost_install_installed_${slug}`

const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * usePwaInstallPrompt — Personal Booking App Shortcut
 *
 * Encapsulates the full Android + iOS install prompt lifecycle:
 *
 *   Android Chrome / Edge / Samsung Internet:
 *     1. Captures `beforeinstallprompt` and suppresses the browser mini-infobar
 *     2. Sets canInstall = true → banner is shown
 *     3. handleInstall() triggers the native prompt dialog
 *     4. On 'accepted', marks as installed in localStorage
 *
 *   iOS Safari:
 *     1. Detects iOS + Safari user agent (no automatic prompt available)
 *     2. Sets isIos = true → banner is shown with manual instructions
 *     3. handleInstall() is a no-op (the IosInstallModal handles the UX)
 *
 *   Suppression rules (banner will NOT show if):
 *     - Already running in standalone/installed mode
 *     - User previously installed (localStorage installed key present)
 *     - User dismissed within the last 7 days
 */
export function usePwaInstallPrompt(shopSlug: string): UsePwaInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall,   setCanInstall]   = useState(false)
  const [isIos,        setIsIos]        = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showBanner,   setShowBanner]   = useState(false)

  useEffect(() => {
    // ── 1. Standalone detection ───────────────────────────────────────────
    // Both Android PWAs and iOS home screen apps run in standalone mode.
    // If we're already installed, there's nothing to prompt.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS-specific property (non-standard but widely used)
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    setIsStandalone(standalone)
    if (standalone) return

    // ── 2. Already-installed / dismissed guard ────────────────────────────
    if (localStorage.getItem(installedKey(shopSlug))) return

    const dismissedAt = localStorage.getItem(dismissedKey(shopSlug))
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10)
      if (elapsed < DISMISS_TTL_MS) return
      // 7-day cooldown has passed — clear the flag so the banner can reappear
      localStorage.removeItem(dismissedKey(shopSlug))
    }

    // ── 3. iOS Safari detection ───────────────────────────────────────────
    // iOS devices running Safari (not Chrome/Firefox wrappers) need the
    // manual "Share → Add to Home Screen" flow.
    const ua        = navigator.userAgent
    const isIosUA   = /iphone|ipad|ipod/i.test(ua)
    // Exclude Chrome for iOS (CriOS), Firefox for iOS (FxiOS), etc.
    const isSafari  = /safari/i.test(ua) && !/chrome|crios|fxios|opios|edgios/i.test(ua)

    if (isIosUA && isSafari) {
      setIsIos(true)
      setShowBanner(true)
      return
    }

    // ── 4. Android / Chrome install prompt ───────────────────────────────
    // `beforeinstallprompt` fires when the browser determines the page meets
    // PWA installability criteria (HTTPS + manifest + service worker with
    // fetch handler). Calling preventDefault() suppresses the browser's own
    // mini-infobar so we can show our branded banner instead.
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setCanInstall(true)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [shopSlug])

  // ── handleInstall ─────────────────────────────────────────────────────
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem(installedKey(shopSlug), String(Date.now()))
    }
    setDeferredPrompt(null)
    setShowBanner(false)
  }, [deferredPrompt, shopSlug])

  // ── handleDismiss ─────────────────────────────────────────────────────
  const handleDismiss = useCallback(() => {
    localStorage.setItem(dismissedKey(shopSlug), String(Date.now()))
    setShowBanner(false)
  }, [shopSlug])

  return { canInstall, isIos, isStandalone, showBanner, handleInstall, handleDismiss }
}
