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
  /** The device is iOS — manual Share → Add to Home Screen required */
  isIos:         boolean
  /** The device is Android but beforeinstallprompt hasn't fired yet — show manual instructions */
  isAndroid:     boolean
  /** The page is already running as an installed standalone PWA */
  isStandalone:  boolean
  /** Whether to show the install banner (false if dismissed, installed, or standalone) */
  showBanner:    boolean
  /** Android Chrome: triggers the native install prompt. No-op otherwise. */
  handleInstall: () => Promise<void>
  /** Stores a dismissal timestamp; banner won't reappear for 7 days */
  handleDismiss: () => void
}

const dismissedKey = (slug: string) => `barberboost_install_dismissed_${slug}`
const installedKey = (slug: string) => `barberboost_install_installed_${slug}`

const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * usePwaInstallPrompt — Personal Booking App Shortcut
 *
 * Shows the install banner on any mobile device:
 *
 *   iOS (any browser — Safari, Chrome, Firefox):
 *     Sets isIos = true → banner shows manual Share → Add to Home Screen steps.
 *     All iOS browsers support this flow via the system share sheet.
 *
 *   Android Chrome (beforeinstallprompt fires):
 *     Sets canInstall = true → banner triggers the native install dialog.
 *
 *   Android (no beforeinstallprompt — first visit, non-Chrome, criteria not yet met):
 *     Sets isAndroid = true → banner shows manual browser menu instructions.
 *     If beforeinstallprompt fires later (second visit), canInstall upgrades to true.
 *
 *   Suppression (banner will NOT show if):
 *     - Already running as installed standalone PWA
 *     - Previously installed (localStorage key present)
 *     - Dismissed within the last 7 days
 */
export function usePwaInstallPrompt(shopSlug: string): UsePwaInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall,   setCanInstall]   = useState(false)
  const [isIos,        setIsIos]        = useState(false)
  const [isAndroid,    setIsAndroid]    = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showBanner,   setShowBanner]   = useState(false)

  useEffect(() => {
    // ── 1. Standalone detection ───────────────────────────────────────────
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    setIsStandalone(standalone)
    if (standalone) return

    // ── 2. Already-installed / dismissed guard ────────────────────────────
    if (localStorage.getItem(installedKey(shopSlug))) return

    const dismissedAt = localStorage.getItem(dismissedKey(shopSlug))
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10)
      if (elapsed < DISMISS_TTL_MS) return
      localStorage.removeItem(dismissedKey(shopSlug))
    }

    // ── 3. iOS detection (any iOS browser) ───────────────────────────────
    // All iOS browsers — Safari, Chrome (CriOS), Firefox (FxiOS), etc. —
    // support the Share → Add to Home Screen manual flow.
    const ua = navigator.userAgent
    if (/iphone|ipad|ipod/i.test(ua)) {
      setIsIos(true)
      setShowBanner(true)
      return
    }

    // ── 4. Android ────────────────────────────────────────────────────────
    const isAndroidUA = /android/i.test(ua)

    // Check if beforeinstallprompt was captured before React loaded.
    // An inline script at the top of the booking page stores the event on
    // window.__pwaInstallPrompt to avoid the race condition on return visits.
    type WinWithPrompt = Window & { __pwaInstallPrompt?: BeforeInstallPromptEvent }
    const win = window as WinWithPrompt
    if (win.__pwaInstallPrompt) {
      const early = win.__pwaInstallPrompt
      delete win.__pwaInstallPrompt
      setDeferredPrompt(early)
      setCanInstall(true)
      if (isAndroidUA) setIsAndroid(true)
      setShowBanner(true)
      return
    }

    // Listen for the prompt firing after React mounts.
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setCanInstall(true)
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // On Android, show the banner immediately even if beforeinstallprompt
    // hasn't fired (first visit, non-Chrome, or criteria not yet met).
    // The banner button shows manual "browser menu → Add to Home Screen"
    // instructions in that case, upgrading to the native dialog when/if
    // the event fires later.
    if (isAndroidUA) {
      setIsAndroid(true)
      setShowBanner(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [shopSlug])

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

  const handleDismiss = useCallback(() => {
    localStorage.setItem(dismissedKey(shopSlug), String(Date.now()))
    setShowBanner(false)
  }, [shopSlug])

  return { canInstall, isIos, isAndroid, isStandalone, showBanner, handleInstall, handleDismiss }
}
