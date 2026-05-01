import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Scissors, Heart, Zap, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About — BarberBoost',
  description: 'Built for UK barbers, by people who care. Learn about our mission and the story behind BarberBoost.',
}

const VALUES = [
  {
    icon: Scissors,
    title: 'Built for barbers',
    description: 'Every feature is shaped by real barbershop owners. We don\'t build what sounds clever — we build what saves time behind the chair.',
  },
  {
    icon: Zap,
    title: 'Speed over complexity',
    description: 'Your tools should get out of the way. BarberBoost is designed to be fast to learn, faster to use, and never in your way.',
  },
  {
    icon: Shield,
    title: 'Honest pricing',
    description: 'No hidden fees, no surprise charges. You know what you\'re paying and what you\'re getting before you ever enter a card number.',
  },
  {
    icon: Heart,
    title: 'Long-term partnership',
    description: 'We\'re not building for an exit. We want to be the platform UK barbershops rely on for the next decade — and that means earning trust every month.',
  },
]

const STATS = [
  { value: '1,200+', label: 'Barbershops using BarberBoost' },
  { value: '£4.2M+', label: 'Revenue processed monthly' },
  { value: '98.9%', label: 'Platform uptime' },
  { value: '4.8★', label: 'Average customer rating' },
]

export default function AboutPage() {
  return (
    <main className="bg-[#0a0a0a]">
      {/* Hero */}
      <section className="pt-20 pb-16 px-4 sm:px-6 text-center space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">
          Our Story
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,7vw,5.5rem)] leading-none tracking-widest text-white">
          BUILT FOR THE<br />PEOPLE BEHIND<br />THE CHAIR
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
          BarberBoost started with a simple observation: UK barbers run incredible businesses on sheer skill and reputation — and then manage everything else with WhatsApp, paper diaries, and gut instinct.
        </p>
      </section>

      {/* Story */}
      <section className="py-16 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Why we exist</p>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3.2rem)] leading-none tracking-widest text-white">
              THE PROBLEM WE SET OUT TO SOLVE
            </h2>
            <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
              <p>
                The UK barbershop industry is worth over £1 billion annually, yet most shops still rely on outdated booking methods — or none at all. Clients phone to book, no-shows go untracked, and growth relies entirely on word of mouth.
              </p>
              <p>
                The existing software options were either built for salons (wrong workflow entirely), priced for enterprises (way out of reach), or so complex they required a training course to use.
              </p>
              <p>
                So we built something different. BarberBoost is purpose-built for barbershops: the right features, priced for independents and small chains, and simple enough to set up in an afternoon.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-2 hover:border-[#c9a84c]/15 transition-colors"
              >
                <p className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-[#c9a84c] leading-none">
                  {value}
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">What we stand for</p>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest text-white">
              OUR VALUES
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-4 hover:border-[#c9a84c]/20 hover:bg-[#131313] transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#c9a84c]/8 border border-[#c9a84c]/15 flex items-center justify-center group-hover:bg-[#c9a84c]/12 transition-colors">
                  <Icon className="w-5 h-5 text-[#c9a84c]" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team teaser */}
      <section className="py-16 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">The team</p>
          <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] leading-none tracking-widest text-white">
            SMALL TEAM.<br />BIG AMBITION.
          </h2>
          <p className="text-zinc-500 leading-relaxed">
            We're a focused team of builders, designers, and barber-industry insiders based in the UK. We keep the team lean so every decision gets made fast and every customer feels like they matter — because they do.
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-[#c9a84c] hover:text-[#e2bf6a] text-sm font-medium transition-colors"
          >
            We're growing — come join us
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] leading-none tracking-widest text-white">
            READY TO TRY IT?
          </h2>
          <p className="text-zinc-500">
            Free plan available. No credit card required. Set up in under 5 minutes.
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
              href="/contact"
              className="text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-8 py-4 rounded-xl transition-all"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
