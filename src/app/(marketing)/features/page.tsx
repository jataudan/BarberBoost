import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Features } from '@/components/marketing/Features'

export const metadata: Metadata = {
  title: 'Features — BarberBoost',
  description:
    'Online bookings, client management, staff scheduling, marketing campaigns, inventory, and analytics — everything your barbershop needs in one place.',
}

export default function FeaturesPage() {
  return (
    <main className="bg-[#0a0a0a]">

      {/* Hero header */}
      <section className="pt-20 pb-4 px-4 sm:px-6 text-center space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">
          Platform Features
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,7vw,5.5rem)] leading-none tracking-widest text-white">
          EVERYTHING YOUR<br />SHOP NEEDS
        </h1>
        <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
          One platform. Zero spreadsheets. More time behind the chair.
        </p>
      </section>

      {/* Features grid */}
      <Features />

      {/* CTA banner */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-widest text-white">
            READY TO LEVEL UP?
          </h2>
          <p className="text-zinc-500">
            Start free — no credit card needed. Add your first service and take a booking in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold px-8 py-4 rounded-xl transition-all tracking-wide shadow-lg shadow-[#c9a84c]/20 hover:scale-[1.02]"
            >
              Start Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/pricing"
              className="text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-8 py-4 rounded-xl transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
