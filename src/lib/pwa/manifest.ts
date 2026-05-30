/**
 * PWA Manifest helpers — Personal Booking App Shortcut
 *
 * This module is the single source of truth for per-shop PWA configuration.
 * It derives a PwaConfig from the shop's existing Supabase fields today, and
 * is forward-compatible with dedicated PWA columns once the Supabase migration
 * (see bottom of this file) is applied.
 *
 * Plan gating: pwa_shortcut is a Pro/Empire feature. The booking page checks
 * plan before rendering the install banner, but the manifest route itself is
 * open so that browsers can always resolve the linked manifest.
 *
 * ── How to configure for a new barber ─────────────────────────────────────
 * Out of the box every shop gets:
 *   - App name  : shop.name
 *   - Short name: first word of shop.name (truncated to 12 chars)
 *   - Theme     : #0d0d0d (near-black)
 *   - Accent    : #c9a84c (BarberBoost gold)
 *   - Icons     : shop.logo_url → falls back to /icon.png (BarberBoost default)
 *
 * For a fully branded experience, apply the Supabase migration at the bottom
 * of this file and populate the pwa_* columns via the admin panel or
 * directly in the database. The builder below will pick them up automatically.
 */

// ── Public PWA configuration shape ────────────────────────────────────────

export interface PwaConfig {
  /** Whether the install banner and manifest are enabled for this shop */
  enabled: boolean
  /** Full app name shown on the home screen and splash screen */
  appName: string
  /** Short name (≤12 chars) shown under the home screen icon on some devices */
  shortName: string
  /** Hex colour used for the browser toolbar / splash background */
  themeColor: string
  /** Accent colour used in the install banner UI */
  accentColor: string
  /** Icon URL for 192×192 (Android home screen) */
  icon192: string
  /** Icon URL for 512×512 (Android splash + Play Store) */
  icon512: string
  /** Icon URL for 180×180 Apple touch icon (iOS home screen) */
  appleTouchIcon: string
  /** The URL the PWA opens to — always /booking/[slug] */
  startUrl: string
  /** PWA navigation scope — prevents the installed app leaving the booking page */
  scope: string
}

// ── Minimal shop fields required by the builder ────────────────────────────

export interface ShopPwaInput {
  name: string
  slug: string
  logo_url: string | null
  // Optional columns added by the Supabase migration below.
  // All are safe to omit — defaults are applied when absent.
  pwa_enabled?:           boolean | null
  pwa_theme_color?:       string | null
  pwa_accent_color?:      string | null
  pwa_icon_192?:          string | null
  pwa_icon_512?:          string | null
  pwa_apple_touch_icon?:  string | null
}

// ── Config builder ─────────────────────────────────────────────────────────

const DEFAULT_THEME  = '#0d0d0d'
const DEFAULT_ACCENT = '#c9a84c'
const FALLBACK_ICON  = '/icon.png'  // BarberBoost default — always present in /public

/**
 * Derives a complete PwaConfig from a shop row.
 * Safe to call server-side (manifest route) and client-side (banner props).
 */
export function buildPwaConfig(shop: ShopPwaInput): PwaConfig {
  const themeColor  = shop.pwa_theme_color  ?? DEFAULT_THEME
  const accentColor = shop.pwa_accent_color ?? DEFAULT_ACCENT

  // Use shop logo for icons when available; fall back to BarberBoost default.
  // Note: for a production-quality PWA, upload properly cropped 192×192 and
  // 512×512 PNGs via the admin panel once the migration is applied.
  const logoUrl       = shop.logo_url ?? FALLBACK_ICON
  const icon192       = shop.pwa_icon_192          ?? logoUrl
  const icon512       = shop.pwa_icon_512          ?? logoUrl
  const appleTouchIcon = shop.pwa_apple_touch_icon ?? logoUrl

  // Short name: first word of shop name, capped at 12 characters
  const shortName = (shop.name.split(' ')[0] ?? shop.name).slice(0, 12)

  return {
    enabled:       shop.pwa_enabled ?? true,
    appName:       shop.name,
    shortName,
    themeColor,
    accentColor,
    icon192,
    icon512,
    appleTouchIcon,
    startUrl: `/booking/${shop.slug}`,
    scope:    `/booking/${shop.slug}`,
  }
}

// ── Supabase migration (apply when full CMS control is needed) ─────────────
//
// Run this SQL in the Supabase SQL editor to unlock per-barber PWA branding:
//
// ALTER TABLE shops
//   ADD COLUMN IF NOT EXISTS pwa_enabled           boolean     DEFAULT true,
//   ADD COLUMN IF NOT EXISTS pwa_theme_color        text        DEFAULT '#0d0d0d',
//   ADD COLUMN IF NOT EXISTS pwa_accent_color       text        DEFAULT '#c9a84c',
//   ADD COLUMN IF NOT EXISTS pwa_icon_192           text,
//   ADD COLUMN IF NOT EXISTS pwa_icon_512           text,
//   ADD COLUMN IF NOT EXISTS pwa_apple_touch_icon   text;
//
// After applying the migration, update the manifest route's SELECT query to
// include these columns and they will be picked up automatically.
