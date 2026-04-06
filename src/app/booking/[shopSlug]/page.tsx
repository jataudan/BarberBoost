import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MapPin, Phone } from 'lucide-react'
import {
  PublicBookingFlow,
  type PublicShop,
  type PublicService,
  type PublicStaff,
} from '@/components/booking/PublicBookingFlow'

interface Props {
  params: Promise<{ shopSlug: string }>
}

// ── SEO ───────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shopSlug } = await params
  const supabase     = await createClient()

  const { data: shop } = await supabase
    .from('shops')
    .select('name, description, address, city, postcode')
    .eq('slug', shopSlug)
    .single()

  if (!shop) return { title: 'Book Appointment' }

  const location = [shop.city, shop.postcode].filter(Boolean).join(', ')
  const title    = `Book at ${shop.name}${location ? ` — ${location}` : ''}`
  const desc     = shop.description
    ?? `Book your appointment at ${shop.name} online. Fast, easy, no account required.`

  return {
    title,
    description: desc,
    openGraph: { title, description: desc, type: 'website' },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function PublicBookingPage({ params }: Props) {
  const { shopSlug } = await params
  const supabase     = await createClient()

  // Step 1 — fetch shop by slug
  const { data: shopRaw } = await supabase
    .from('shops')
    .select('id, owner_id, name, phone, address, city, postcode, currency, cancellation_hours, no_show_fee, opening_hours')
    .eq('slug', shopSlug)
    .single()

  if (!shopRaw) notFound()

  // Step 2 — fetch services, staff, and subscription in parallel
  const [svcRes, stfRes, subRes] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, description, duration_minutes, price, category, colour')
      .eq('shop_id', shopRaw.id)
      .eq('is_active', true)
      .order('category')
      .order('name'),

    supabase
      .from('staff')
      .select('id, name, bio, avatar_url, role, colour')
      .eq('shop_id', shopRaw.id)
      .eq('is_active', true)
      .order('name'),

    supabase
      .from('subscriptions')
      .select('plan')
      .eq('owner_id', shopRaw.owner_id)
      .in('status', ['active', 'trialing'])
      .single(),
  ])

  const services   = (svcRes.data ?? []) as PublicService[]
  const staff      = (stfRes.data ?? []) as PublicStaff[]
  const plan       = subRes.data?.plan ?? 'free'
  const isFreePlan = plan === 'free'

  const shop: PublicShop = {
    id:                 shopRaw.id,
    name:               shopRaw.name,
    phone:              shopRaw.phone        ?? null,
    address:            shopRaw.address      ?? null,
    city:               shopRaw.city         ?? null,
    postcode:           shopRaw.postcode     ?? null,
    currency:           shopRaw.currency     ?? 'GBP',
    cancellation_hours: shopRaw.cancellation_hours ?? 24,
    no_show_fee:        shopRaw.no_show_fee   ?? 0,
    opening_hours:      (shopRaw.opening_hours ?? {}) as PublicShop['opening_hours'],
  }

  const location = [shop.address, shop.city, shop.postcode].filter(Boolean).join(', ')
  const initials = shop.name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // ── JSON-LD Structured Data ───────────────────────────────────────────────
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.com'
  const jsonLd = {
    '@context':   'https://schema.org',
    '@type':      'HairSalon',
    name:         shop.name,
    url:          `${APP_URL}/booking/${shopSlug}`,
    telephone:    shop.phone ?? undefined,
    address:      shop.address ? {
      '@type':         'PostalAddress',
      streetAddress:   shop.address,
      addressLocality: shop.city ?? undefined,
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
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── JSON-LD ──────────────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Shop header ─────────────────────────────────────────────── */}
      <header className="bg-[#111111] border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-4">
          {/* Logo / initials avatar */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c9a84c] to-[#a8873a] flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-black text-black">{initials}</span>
          </div>

          {/* Name + location */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{shop.name}</h1>
            {location && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                <p className="text-sm text-zinc-400 truncate">{location}</p>
              </div>
            )}
          </div>

          {/* Call Us button */}
          {shop.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="flex items-center gap-2 bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 border border-[#c9a84c]/30 text-[#c9a84c] rounded-xl px-4 py-2 text-sm font-medium transition-colors flex-shrink-0"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Call Us</span>
            </a>
          )}
        </div>
      </header>

      {/* ── Booking flow ────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <PublicBookingFlow shop={shop} services={services} staff={staff} />
      </main>

      {/* ── Powered-by badge (free plan only) ───────────────────────── */}
      {isFreePlan && (
        <footer className="py-8 text-center">
          <a
            href="https://barberboost.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Powered by <span className="font-semibold text-[#c9a84c]">BarberBoost</span>
          </a>
        </footer>
      )}
    </div>
  )
}
