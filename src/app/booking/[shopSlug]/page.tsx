import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata, Viewport } from 'next'
import { buildPwaConfig } from '@/lib/pwa/manifest'
import { PLANS } from '@/lib/stripe/plans'
import { PwaInstallBanner } from '@/components/booking/PwaInstallBanner'
import { ServiceWorkerRegistrar } from '@/components/booking/ServiceWorkerRegistrar'
import { MapPin, Phone, CalendarCheck, MessageCircle, Navigation, Star } from 'lucide-react'
import { getPreset, HERO_PRESETS } from '@/lib/hero-presets'
import {
  PublicBookingFlow,
  type PublicShop,
  type PublicService,
  type PublicStaff,
  type PublicStyle,
} from '@/components/booking/PublicBookingFlow'
import { ShareButton } from '@/components/booking/ShareButton'

interface Props {
  params: Promise<{ shopSlug: string }>
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatTime12h(t: string) {
  const [h, m] = t.split(':').map(Number)
  const p  = h >= 12 ? 'pm' : 'am'
  const hr = h % 12 || 12
  return m ? `${hr}:${String(m).padStart(2, '0')}${p}` : `${hr}${p}`
}

function getOpeningStatus(
  openingHours: Record<string, { open: string; close: string; closed: boolean }>,
  timezone: string,
): { isOpen: boolean; label: string; colour: string } {
  try {
    const tz      = timezone || 'Europe/London'
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

    const localDay  = new Intl.DateTimeFormat('en', { timeZone: tz, weekday: 'long' }).format(new Date()).toLowerCase()
    const localTime = new Intl.DateTimeFormat('en', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
    const [lh, lm]  = localTime.split(':').map(Number)
    const nowMins   = lh * 60 + lm
    const todayIdx  = dayKeys.indexOf(localDay)
    const todayHrs  = openingHours[localDay]

    function nextOpen(fromIdx: number) {
      for (let i = 1; i <= 7; i++) {
        const key = dayKeys[(fromIdx + i) % 7]
        const hrs = openingHours[key]
        if (hrs && !hrs.closed) {
          const label = i === 1 ? 'tomorrow' : key.charAt(0).toUpperCase() + key.slice(1)
          return `Opens ${label} at ${formatTime12h(hrs.open)}`
        }
      }
      return 'Opening hours unavailable'
    }

    if (!todayHrs || todayHrs.closed) {
      return { isOpen: false, label: `Closed · ${nextOpen(todayIdx)}`, colour: 'text-red-400' }
    }

    const [oh, om] = todayHrs.open.split(':').map(Number)
    const [ch, cm] = todayHrs.close.split(':').map(Number)
    const openMins  = oh * 60 + om
    const closeMins = ch * 60 + cm

    if (nowMins < openMins)   return { isOpen: false, label: `Opens today at ${formatTime12h(todayHrs.open)}`, colour: 'text-yellow-400' }
    if (nowMins >= closeMins) return { isOpen: false, label: `Closed · ${nextOpen(todayIdx)}`, colour: 'text-red-400' }
    return { isOpen: true,  label: `Open · Closes ${formatTime12h(todayHrs.close)}`, colour: 'text-emerald-400' }
  } catch {
    return { isOpen: false, label: '', colour: 'text-zinc-500' }
  }
}

function buildWhatsAppUrl(phone: string, shopName: string) {
  const digits = phone.replace(/\D/g, '')
  const intl   = digits.startsWith('0') ? '44' + digits.slice(1) : digits
  return `https://wa.me/${intl}?text=${encodeURIComponent(`Hi ${shopName}, I'd like to book an appointment`)}`
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={i <= rating ? 'text-[#c9a84c]' : 'text-zinc-700'} width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ── SEO ───────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shopSlug } = await params
  const supabase     = await createClient()

  const { data: shop } = await supabase
    .from('shops')
    .select('name, description, address, city, postcode, logo_url, pwa_accent_color, pwa_apple_touch_icon')
    .eq('slug', shopSlug)
    .single()

  if (!shop) return { title: 'Book Appointment' }

  const location = [shop.city, shop.postcode].filter(Boolean).join(', ')
  const title    = `Book at ${shop.name}${location ? ` — ${location}` : ''}`
  const desc     = shop.description
    ?? `Book your appointment at ${shop.name} online. Fast, easy, no account required.`

  const pwa          = buildPwaConfig({ name: shop.name, slug: shopSlug, logo_url: shop.logo_url ?? null })
  const touchIconUrl = shop.pwa_apple_touch_icon ?? shop.logo_url ?? '/icon.png'

  return {
    title,
    description: desc,
    openGraph: { title, description: desc, type: 'website' },
    // PWA manifest link — each barber gets their own branded manifest
    manifest: `/manifest/${shopSlug}`,
    // iOS home screen meta
    appleWebApp: {
      capable:         true,
      title:           pwa.shortName,
      statusBarStyle:  'black',
    },
    icons: {
      apple: [{ url: touchIconUrl, sizes: '180x180', type: 'image/png' }],
    },
  }
}

/**
 * generateViewport — sets the browser toolbar colour to each shop's theme.
 * In Next.js 15+ themeColor lives here, not in generateMetadata.
 */
export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { shopSlug } = await params
  const supabase     = await createClient()

  const { data: shop } = await supabase
    .from('shops')
    .select('pwa_theme_color')
    .eq('slug', shopSlug)
    .single()

  return {
    themeColor:    shop?.pwa_theme_color ?? '#0d0d0d',
    width:         'device-width',
    initialScale:  1,
    maximumScale:  1,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function PublicBookingPage({ params }: Props) {
  const { shopSlug } = await params
  const supabase     = await createClient()

  const { data: shopRaw } = await supabase
    .from('shops')
    .select('id, owner_id, name, slug, logo_url, cover_url, description, phone, address, city, postcode, currency, cancellation_hours, no_show_fee, opening_hours, timezone, pwa_enabled, pwa_theme_color, pwa_accent_color, pwa_icon_192, pwa_icon_512, pwa_apple_touch_icon')
    .eq('slug', shopSlug)
    .single()

  if (!shopRaw) notFound()

  // Service role client bypasses the owner-scoped RLS on subscriptions —
  // the booking page is public (no auth.uid()) so the anon client always
  // gets zero rows back, making every shop look like it's on the free plan.
  const serviceSupabase = await createServiceClient()

  const [svcRes, stfRes, subRes, revRes, stylesRes] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, description, duration_minutes, price, category, colour')
      .eq('shop_id', shopRaw.id)
      .eq('is_active', true)
      .order('category')
      .order('name'),

    supabase
      .from('staff')
      .select('id, name, bio, avatar_url, role, colour, blocked_dates')
      .eq('shop_id', shopRaw.id)
      .eq('is_active', true)
      .order('name'),

    serviceSupabase
      .from('subscriptions')
      .select('plan')
      .eq('owner_id', shopRaw.owner_id)
      .in('status', ['active', 'trialing'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('reviews')
      .select('id, client_name, rating, comment, created_at')
      .eq('shop_id', shopRaw.id)
      .eq('is_public', true)
      .not('rating', 'is', null)
      .not('comment', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('haircut_styles')
      .select('id, title, description, image_url, tags, barber_ids')
      .eq('shop_id', shopRaw.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false }),
  ])

  const services   = (svcRes.data ?? []) as PublicService[]
  const staff      = (stfRes.data ?? []) as PublicStaff[]
  const styles     = (stylesRes.data ?? []) as PublicStyle[]
  const plan       = subRes.data?.plan ?? 'free'
  const isFreePlan = plan === 'free'
  const reviews    = revRes.data ?? []

  // PWA Personal Booking App Shortcut — Pro/Empire feature
  const pwaEnabled = PLANS[plan as keyof typeof PLANS].limits.pwa_shortcut === true
  const pwaConfig  = buildPwaConfig({
    name:                shopRaw.name,
    slug:                shopSlug,
    logo_url:            shopRaw.logo_url            ?? null,
    pwa_enabled:         shopRaw.pwa_enabled         ?? null,
    pwa_theme_color:     shopRaw.pwa_theme_color     ?? null,
    pwa_accent_color:    shopRaw.pwa_accent_color    ?? null,
    pwa_icon_192:        shopRaw.pwa_icon_192        ?? null,
    pwa_icon_512:        shopRaw.pwa_icon_512        ?? null,
    pwa_apple_touch_icon: shopRaw.pwa_apple_touch_icon ?? null,
  })

  const shop: PublicShop = {
    id:                 shopRaw.id,
    name:               shopRaw.name,
    logo_url:           shopRaw.logo_url     ?? null,
    phone:              shopRaw.phone        ?? null,
    address:            shopRaw.address      ?? null,
    city:               shopRaw.city         ?? null,
    postcode:           shopRaw.postcode     ?? null,
    currency:           shopRaw.currency     ?? 'GBP',
    cancellation_hours: shopRaw.cancellation_hours ?? 24,
    no_show_fee:        shopRaw.no_show_fee   ?? 0,
    opening_hours:      (shopRaw.opening_hours ?? {}) as PublicShop['opening_hours'],
  }

  const location  = [shop.address, shop.city, shop.postcode].filter(Boolean).join(', ')
  const initials  = shop.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.com'
  const bookingUrl = `${APP_URL}/booking/${shopSlug}`
  const openStatus = getOpeningStatus(
    shopRaw.opening_hours as Record<string, { open: string; close: string; closed: boolean }> ?? {},
    shopRaw.timezone ?? 'Europe/London',
  )
  const mapsUrl    = location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : null
  const waUrl      = shop.phone ? buildWhatsAppUrl(shop.phone, shop.name) : null

  // Average review rating
  const avgRating = reviews.length
    ? Math.round(reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length)
    : null

  // Hero style: bb-preset → gradient theme, real URL → photo, null → default gradient
  const heroPreset  = getPreset(shopRaw.cover_url) ?? HERO_PRESETS[0]
  const isPhotoHero = !!shopRaw.cover_url && !shopRaw.cover_url.startsWith('bb-preset:')

  // JSON-LD
  const jsonLd = {
    '@context':   'https://schema.org',
    '@type':      'HairSalon',
    name:         shop.name,
    url:          bookingUrl,
    telephone:    shop.phone ?? undefined,
    address:      shop.address ? {
      '@type':         'PostalAddress',
      streetAddress:   shop.address,
      addressLocality: shop.city  ?? undefined,
      postalCode:      shop.postcode ?? undefined,
      addressCountry:  'GB',
    } : undefined,
    makesOffer: services.map(s => ({
      '@type':       'Offer',
      name:          s.name,
      description:   s.description ?? undefined,
      priceCurrency: shop.currency,
      price:         s.price,
    })),
    ...(avgRating ? {
      aggregateRating: {
        '@type':       'AggregateRating',
        ratingValue:   avgRating,
        reviewCount:   reviews.length,
      }
    } : {}),
  }

  const currencyFmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: shop.currency, maximumFractionDigits: 0 })

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20 sm:pb-0" data-pwa-plan={plan} data-pwa-enabled={String(pwaEnabled)}>
      {/* Early capture: beforeinstallprompt fires before React useEffect on return visits.
          This inline script runs during HTML parsing and stores the event so the hook
          can pick it up synchronously on mount. */}
      <script dangerouslySetInnerHTML={{ __html: `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaInstallPrompt=e;});` }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── 1. STICKY HEADER ─────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#111111]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">

          {/* Logo — links back to page top, resetting the booking flow */}
          <a href={`/booking/${shopSlug}`} aria-label={`${shop.name} — back to top`} className="flex-shrink-0">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={`${shop.name} logo`}
                className="w-11 h-11 rounded-xl object-cover bg-[#1a1a1a] hover:opacity-80 transition-opacity" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#a8873a] flex items-center justify-center hover:opacity-80 transition-opacity">
                <span className="text-base font-black text-black">{initials}</span>
              </div>
            )}
          </a>

          {/* Name + location + phone + opening status */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white truncate leading-tight">{shop.name}</h1>
            {location && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                <p className="text-xs text-zinc-400 truncate">{location}</p>
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {shop.phone && (
                <a href={`tel:${shop.phone}`} className="inline-flex items-center gap-1 group">
                  <Phone className="w-3 h-3 text-[#c9a84c] flex-shrink-0" />
                  <span className="text-xs text-[#c9a84c] font-medium group-hover:text-[#e2bf6a] transition-colors">{shop.phone}</span>
                </a>
              )}
              {openStatus.label && (
                <span className={`text-[10px] font-semibold ${openStatus.colour}`}>
                  {openStatus.label}
                </span>
              )}
            </div>
          </div>

          {/* Book Now CTA */}
          <a href="#booking"
            className="flex-shrink-0 flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-xs rounded-xl px-3 py-2 transition-colors">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Book Now</span>
          </a>
        </div>
      </header>

      {/* ── 2. HERO ──────────────────────────────────────────────── */}
      <section className="relative h-56 sm:h-72 overflow-hidden">
        {/* Background: uploaded photo OR gradient theme */}
        {isPhotoHero ? (
          <img
            src={shopRaw.cover_url!}
            alt={`${shop.name} cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: heroPreset.background }} />
            <div
              className="absolute inset-0"
              style={{ background: `radial-gradient(ellipse at 25% 45%, ${heroPreset.glowColor}2a 0%, transparent 65%)` }}
            />
          </>
        )}
        {/* Bottom fade into page */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/25 to-transparent" />
        {/* Content overlay */}
        <div className="absolute bottom-0 inset-x-0 px-4 pb-5 max-w-2xl mx-auto">
          <p className="text-2xl sm:text-3xl font-black text-white drop-shadow-sm leading-tight">{shop.name}</p>
          {shopRaw.description && (
            <p className="text-sm text-zinc-300/90 mt-1 line-clamp-2 drop-shadow">{shopRaw.description}</p>
          )}
          {/* Floating stat badges */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {avgRating && (
              <div className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-full px-2.5 py-1">
                <StarRow rating={avgRating} />
                <span className="text-[11px] text-zinc-200 font-semibold">{avgRating}.0 · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            {services.length > 0 && (
              <span className="inline-flex items-center bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-full px-2.5 py-1 text-[11px] text-zinc-200 font-medium">
                {services.length} service{services.length !== 1 ? 's' : ''}
              </span>
            )}
            {staff.length > 0 && (
              <span className="inline-flex items-center bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-full px-2.5 py-1 text-[11px] text-zinc-200 font-medium">
                {staff.length} barber{staff.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. CONTACT ACTION BAR ────────────────────────────────── */}
      <section className="border-b border-white/[0.06] bg-[#0d0d0d] mt-4">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {shop.phone && (
            <a href={`tel:${shop.phone}`}
              className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white transition-all flex-shrink-0 min-w-[64px]">
              <Phone className="w-4 h-4 text-[#c9a84c]" />
              <span className="text-[10px] font-medium">Call</span>
            </a>
          )}
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white transition-all flex-shrink-0 min-w-[64px]">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-medium">WhatsApp</span>
            </a>
          )}
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white transition-all flex-shrink-0 min-w-[64px]">
              <Navigation className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-medium">Directions</span>
            </a>
          )}
          <ShareButton url={bookingUrl} title={`Book at ${shop.name}`} />
        </div>
      </section>

      {/* ── 4. SERVICES PREVIEW ──────────────────────────────────── */}
      {services.length > 0 && (
        <section className="border-b border-white/[0.06] py-5">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-4 mb-3">Services</h2>
            <div className="flex gap-3 px-4 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
              {services.slice(0, 8).map(s => (
                <a key={s.id} href="#booking"
                  className="flex-shrink-0 w-36 bg-[#111111] hover:bg-[#161616] border border-white/[0.06] hover:border-[#c9a84c]/30 rounded-2xl p-3 transition-all group">
                  <div className="w-6 h-1 rounded-full mb-2.5 transition-all" style={{ backgroundColor: s.colour }} />
                  <p className="text-xs font-semibold text-white leading-tight line-clamp-2 group-hover:text-[#c9a84c] transition-colors">{s.name}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">{s.duration_minutes} min</p>
                  <p className="text-sm font-bold text-[#c9a84c] mt-1">{currencyFmt.format(s.price)}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 5. BARBER PROFILES ───────────────────────────────────── */}
      {staff.length > 0 && (
        <section className="border-b border-white/[0.06] py-5">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
              {staff.length === 1 ? 'Your Barber' : 'Meet the Team'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {staff.map(s => {
                const sInitials = s.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                return (
                  <a key={s.id} href="#booking"
                    className="flex flex-col items-center gap-2 bg-[#111111] hover:bg-[#161616] border border-white/[0.06] hover:border-[#c9a84c]/30 rounded-2xl py-4 px-3 transition-all text-center group">
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt={s.name}
                        className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black text-white"
                        style={{ backgroundColor: s.colour + '33', border: `2px solid ${s.colour}55` }}>
                        {sInitials}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-[#c9a84c] transition-colors leading-tight">{s.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{s.role}</p>
                    </div>
                    {s.bio && (
                      <p className="text-[10px] text-zinc-600 line-clamp-2 leading-relaxed">{s.bio}</p>
                    )}
                  </a>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. CLIENT REVIEWS ────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="border-b border-white/[0.06] py-5">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">What Clients Say</h2>
              {avgRating && (
                <div className="flex items-center gap-1.5">
                  <StarRow rating={avgRating} />
                  <span className="text-xs text-zinc-400">{avgRating}.0</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {reviews.map((r) => (
                <div key={r.id} className="bg-[#111111] border border-white/[0.06] rounded-2xl px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StarRow rating={r.rating ?? 0} />
                        <span className="text-[10px] text-zinc-600">
                          {new Date(r.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3">{r.comment}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-2 font-medium">{r.client_name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 7. BOOKING FORM ──────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-1">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest whitespace-nowrap">Book Your Appointment</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>
      </div>

      <main id="booking" className="max-w-2xl mx-auto px-4 py-6 scroll-mt-16">
        <PublicBookingFlow shop={shop} services={services} staff={staff} styles={styles} />
      </main>

      {/* ── Powered-by badge (free plan only) ────────────────────── */}
      {isFreePlan && (
        <footer className="py-8 text-center">
          <a href="https://barberboost.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Powered by <span className="font-semibold text-[#c9a84c]">BarberBoost</span>
          </a>
        </footer>
      )}

      {/* ── 8. STICKY MOBILE BOOK NOW BAR ────────────────────────── */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/[0.06] px-4 py-3">
        <a href="#booking"
          className="flex items-center justify-center gap-2 w-full bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-sm rounded-xl py-3 transition-colors">
          <CalendarCheck className="w-4 h-4" />
          Book an Appointment
        </a>
      </div>

      {/* ── 9. PWA "SAVE TO PHONE" BANNER (Pro/Empire only) ──────── */}
      {/* Sits above the Book Now bar (bottom-[72px]) on mobile only. */}
      {/* ServiceWorkerRegistrar is required for Android's beforeinstallprompt. */}
      {pwaEnabled && (
        <>
          <ServiceWorkerRegistrar />
          <PwaInstallBanner shopSlug={shopSlug} pwa={pwaConfig} />
        </>
      )}
    </div>
  )
}
