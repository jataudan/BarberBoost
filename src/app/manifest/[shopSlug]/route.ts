import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildPwaConfig } from '@/lib/pwa/manifest'

/**
 * GET /manifest/[shopSlug]
 *
 * Returns a per-shop Web App Manifest (application/manifest+json).
 * Referenced by the booking page via <link rel="manifest" href="/manifest/[slug]">.
 *
 * Each barber's installed PWA gets their own:
 *   - App name and short name
 *   - Theme colour (browser toolbar + splash)
 *   - Icons (shop logo or BarberBoost default)
 *   - Scoped start URL (/booking/[slug]) so the installed app only
 *     shows the booking page, not the wider BarberBoost app
 *
 * This route is intentionally public (no auth check) — manifests must be
 * fetchable by the browser without credentials.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shopSlug: string }> },
) {
  const { shopSlug } = await params

  const supabase = await createClient()

  const { data: shop, error } = await supabase
    .from('shops')
    .select(
      'name, slug, logo_url, pwa_enabled, pwa_theme_color, pwa_accent_color, pwa_icon_192, pwa_icon_512, pwa_apple_touch_icon'
    )
    .eq('slug', shopSlug)
    .single()

  if (error || !shop) {
    return NextResponse.json(
      { error: 'Shop not found' },
      { status: 404 },
    )
  }

  const pwa = buildPwaConfig(shop)

  const manifest = {
    name:             pwa.appName,
    short_name:       pwa.shortName,
    description:      `Book an appointment at ${pwa.appName}`,
    start_url:        pwa.startUrl,
    scope:            pwa.scope,
    display:          'standalone',
    orientation:      'portrait-primary',
    theme_color:      pwa.themeColor,
    background_color: pwa.themeColor,
    categories:       ['lifestyle', 'health & beauty'],
    icons: [
      {
        src:     pwa.icon192,
        sizes:   '192x192',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     pwa.icon512,
        sizes:   '512x512',
        type:    'image/png',
        // 'maskable' allows Android to crop the icon into a circle/squircle
        // adaptive shape. Falls back to 'any' on devices that don't support it.
        purpose: 'any maskable',
      },
    ],
    // Share target allows the PWA to appear in the system share sheet
    share_target: {
      action: pwa.startUrl,
      method: 'GET',
      params: { title: 'title', text: 'text', url: 'url' },
    },
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type':  'application/manifest+json',
      // Cache for 1 hour in production; revalidated on next request
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
