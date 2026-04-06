import type { Metadata } from 'next'
import { Hero } from '@/components/marketing/Hero'
import { SocialProof } from '@/components/marketing/SocialProof'
import { Features } from '@/components/marketing/Features'
import { PricingTable } from '@/components/marketing/PricingTable'
import { Testimonials } from '@/components/marketing/Testimonials'
import { FAQ } from '@/components/marketing/FAQ'

export const metadata: Metadata = {
  title: 'BarberBoost — Run Your Barbershop Like a Boss',
  description:
    'The all-in-one platform UK barbers use to book more clients, reduce no-shows, and grow their business. Online bookings, client management, marketing & more.',
}

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <SocialProof />
      <Features />
      <Testimonials />
      <PricingTable />
      <FAQ />
    </main>
  )
}
