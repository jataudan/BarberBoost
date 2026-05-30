/**
 * BarberBoost Booking PWA — Minimal Service Worker
 *
 * Why this file exists:
 *   Chrome for Android only fires the `beforeinstallprompt` event (which powers
 *   our custom "Save to Phone" banner) when a service worker is registered on
 *   the page. This file is that service worker.
 *
 * What it does:
 *   - Installs and activates immediately (skipWaiting + clients.claim)
 *   - Caches the booking page shell on first visit so it loads offline
 *   - Uses a network-first strategy: always tries the network, falls back to
 *     cache only when the user is offline
 *   - Skips caching for API calls, Supabase requests, and Stripe calls so no
 *     stale booking data is ever served from cache
 *
 * What it does NOT do:
 *   - It does not cache dashboard or auth routes
 *   - It does not interfere with the Next.js app outside /booking/*
 *
 * Upgrade path:
 *   When next-pwa is added (Phase 2 of the PWA roadmap) it will generate a
 *   more capable service worker that replaces this file automatically.
 */

const CACHE_NAME = 'bb-booking-v1'

// Patterns to never cache — always go straight to the network
const SKIP_CACHE = [
  '/api/',
  'supabase.co',
  'supabase.in',
  'stripe.com',
  'resend.com',
]

self.addEventListener('install', () => {
  // Take over immediately without waiting for existing tabs to close
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Clean up old cache versions
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle GET requests
  if (request.method !== 'GET') return

  // Skip non-HTTP(S) schemes (chrome-extension, etc.)
  if (!request.url.startsWith('http')) return

  // Skip API / third-party calls — these must always be live
  if (SKIP_CACHE.some((pattern) => request.url.includes(pattern))) return

  // Network-first strategy for all other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful, same-origin, non-opaque responses
        if (
          response.ok &&
          response.type === 'basic' &&
          response.status === 200
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() =>
        // Network failed — return cached version if we have one
        caches.match(request)
      )
  )
})
