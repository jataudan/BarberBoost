import type { Metadata } from 'next'
import { Geist, Bebas_Neue, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

// Validate env vars on server startup
import '@/lib/env'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets:  ['latin'],
  display:  'swap',
})

const bebasNeue = Bebas_Neue({
  weight:   '400',
  variable: '--font-bebas',
  subsets:  ['latin'],
  display:  'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets:  ['latin'],
  display:  'swap',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default:  'BarberBoost — The all-in-one platform for barbershops',
    template: '%s | BarberBoost',
  },
  description:
    'Online bookings, client management, analytics, marketing, and more — built for modern barbershops.',
  keywords: ['barbershop', 'barber booking', 'barbershop software', 'barber app', 'online booking'],
  authors:   [{ name: 'BarberBoost' }],
  creator:   'BarberBoost',
  openGraph: {
    type:        'website',
    siteName:    'BarberBoost',
    title:       'BarberBoost — Run Your Barbershop Like a Boss',
    description: 'The all-in-one platform UK barbers use to book more clients, reduce no-shows, and grow their business.',
    url:         APP_URL,
    images: [
      {
        url:    '/og-image.png',
        width:  1200,
        height: 630,
        alt:    'BarberBoost — Barbershop Management Software',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'BarberBoost — Run Your Barbershop Like a Boss',
    description: 'The all-in-one platform UK barbers use to book more clients, reduce no-shows, and grow their business.',
    images:      ['/og-image.png'],
  },
  robots: {
    index:           true,
    follow:          true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${bebasNeue.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white font-[family-name:var(--font-body)]">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
