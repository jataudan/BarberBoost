import type { Metadata } from 'next'
import { PricingSection } from '@/components/marketing/PricingSection'
import { PricingTable } from '@/components/marketing/PricingTable'
import { FAQ, BILLING_FAQS } from '@/components/marketing/FAQ'

export const metadata: Metadata = {
  title: 'Pricing — BarberBoost',
  description:
    'Simple, transparent pricing for every barbershop. Start free. Upgrade when you\'re ready. No hidden fees.',
}

export default function PricingPage() {
  return (
    <main className="bg-[#0a0a0a]">

      {/* Hero header */}
      <section className="pt-20 pb-4 px-4 sm:px-6 text-center space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">
          Pricing
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,7vw,5.5rem)] leading-none tracking-widest text-white">
          PLANS FOR EVERY BARBER
        </h1>
        <p className="text-zinc-500 text-lg max-w-xl mx-auto">
          Start free, no card needed. Upgrade as you grow — downgrade any time.
        </p>
      </section>

      {/* Toggle + cards (client component) */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <PricingSection />
        </div>
      </section>

      {/* Comparison table */}
      <section className="pb-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <h2 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white">
              FULL COMPARISON
            </h2>
            <p className="text-sm text-zinc-600">See exactly what&apos;s included in each plan</p>
          </div>
          <PricingTable compact />
        </div>
      </section>

      {/* Guarantee banner */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#111111] border border-[#c9a84c]/15 rounded-2xl px-8 py-10 text-center space-y-4">
            <div className="text-4xl">🛡️</div>
            <h3 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white">
              14-DAY MONEY BACK GUARANTEE
            </h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
              Not happy within 14 days of your first paid subscription? We&apos;ll refund you in full.
              No questions asked. No hoops to jump through.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="text-[#c9a84c]">✓</span> Cancel any time
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#c9a84c]">✓</span> No lock-in contracts
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#c9a84c]">✓</span> Export your data
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#c9a84c]">✓</span> GDPR compliant
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Billing FAQ */}
      <FAQ
        items={BILLING_FAQS}
        title="BILLING & PAYMENTS"
        subtitle="Common questions about subscriptions, charges, and cancellations."
      />
    </main>
  )
}
