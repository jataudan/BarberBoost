'use client'

import { useEffect } from 'react'

/**
 * ServiceWorkerRegistrar
 *
 * Registers /sw.js when the browser supports service workers.
 * Mounted in the booking page so the SW is only active on booking pages,
 * not the dashboard or marketing pages.
 *
 * The service worker is a prerequisite for Chrome's `beforeinstallprompt`
 * event — without it, the "Save to Phone" banner will never appear on Android.
 *
 * Uses a 'load' event listener so registration happens after the page has
 * painted, not during initial render, avoiding any impact on LCP/FCP.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    function register() {
      navigator.serviceWorker
        .register('/sw.js', {
          // SW scope covers all of /booking/* — the same scope as our manifests
          scope: '/',
          // updateViaCache: 'none' ensures the browser always checks for a
          // new SW version rather than serving the cached copy, which is
          // important so future next-pwa upgrades roll out immediately.
          updateViaCache: 'none',
        })
        .then((registration) => {
          // Check for updates in the background — will apply on next page load
          registration.update().catch(() => {})
        })
        .catch(() => {
          // Silent failure — feature degrades gracefully if SW registration
          // fails (e.g. private browsing, strict browser settings)
        })
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
    }
  }, [])

  return null
}
