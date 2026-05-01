import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Laptop, Heart, Zap, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Careers — BarberBoost',
  description: 'Join the team building the platform UK barbershops rely on. See open roles at BarberBoost.',
}

const PERKS = [
  {
    icon: Laptop,
    title: 'Remote-first',
    description: 'Work from anywhere in the UK. We have no office — just a shared commitment to doing great work.',
  },
  {
    icon: Zap,
    title: 'Small team, big impact',
    description: 'Every person owns meaningful work. No bureaucracy, no endless approval chains — just build and ship.',
  },
  {
    icon: Globe,
    title: 'Real users, real stakes',
    description: 'Barbershop owners depend on us daily. You\'ll feel the impact of your work directly, not in abstract metrics.',
  },
  {
    icon: Heart,
    title: 'Competitive pay & equity',
    description: 'Market-rate salaries with meaningful equity for early team members who want to share in what we build.',
  },
]

export default function CareersPage() {
  return (
    <main className="bg-[#0a0a0a]">
      {/* Hero */}
      <section className="pt-20 pb-16 px-4 sm:px-6 text-center space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">
          Join the team
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,7vw,5.5rem)] leading-none tracking-widest text-white">
          WORK WITH US
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
          We're building the platform that powers UK barbershops. If you want your work to matter to real business owners, we'd love to hear from you.
        </p>
      </section>

      {/* Perks */}
      <section className="py-16 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">How we work</p>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] leading-none tracking-widest text-white">
              WHY PEOPLE JOIN US
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PERKS.map(({ icon: Icon, title, description }) => (
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

      {/* Open roles */}
      <section className="py-16 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Open roles</p>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] leading-none tracking-widest text-white">
              CURRENT OPENINGS
            </h2>
          </div>

          {/* Empty state */}
          <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-14 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#c9a84c]/8 border border-[#c9a84c]/15 flex items-center justify-center mx-auto">
              <span className="text-xl">👀</span>
            </div>
            <h3 className="text-white font-semibold">No open roles right now</h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
              We're not hiring for specific roles at the moment, but we're always interested in exceptional people. If that sounds like you, send us a note.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold px-6 py-3 rounded-xl transition-colors text-sm tracking-wide mt-2"
            >
              Send a speculative application
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-center text-xs text-zinc-600 mt-6">
            Send your CV and a short note to{' '}
            <a href="mailto:careers@barberboost.app" className="text-zinc-500 hover:text-[#c9a84c] transition-colors">
              careers@barberboost.app
            </a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <h2 className="font-[family-name:var(--font-heading)] text-[clamp(1.8rem,4vw,2.8rem)] leading-none tracking-widest text-white">
            WANT TO KNOW MORE ABOUT US?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/about"
              className="group flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold px-8 py-4 rounded-xl transition-all tracking-wide"
            >
              Read our story
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
