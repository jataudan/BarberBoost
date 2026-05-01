import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Smartphone, MessageSquare, Clock, ListChecks, Gift, Star, CreditCard, Globe, Plug, Users, Megaphone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Roadmap — BarberBoost',
  description: 'See what the BarberBoost team is building next — upcoming features, planned improvements, and ideas under consideration.',
}

const ROADMAP = [
  {
    status: 'In Progress',
    statusColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    dotColor: 'bg-emerald-500',
    quarter: 'Q2 2026',
    items: [
      {
        icon: Smartphone,
        title: 'Mobile App — iOS & Android',
        description: 'Native apps for managing bookings, viewing your schedule, and messaging clients on the go. No browser needed.',
        tags: ['All plans'],
      },
      {
        icon: MessageSquare,
        title: 'WhatsApp Booking Reminders',
        description: 'Send automated booking confirmations and reminders via WhatsApp. Clients can confirm or cancel with a single reply.',
        tags: ['Starter+'],
      },
      {
        icon: Clock,
        title: 'Walk-in Queue Display',
        description: 'A digital queue board your waiting clients can see on a tablet. Shows estimated wait times and current position.',
        tags: ['Pro+'],
      },
    ],
  },
  {
    status: 'Planned',
    statusColor: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    dotColor: 'bg-blue-400',
    quarter: 'Q3 2026',
    items: [
      {
        icon: ListChecks,
        title: 'Waitlist System',
        description: 'When a slot opens up from a cancellation, automatically notify waitlisted clients and let them claim it in one tap.',
        tags: ['Starter+'],
      },
      {
        icon: Gift,
        title: 'Gift Cards & Vouchers',
        description: 'Sell digital gift cards through your booking page. Recipients redeem them at checkout — great for birthdays and events.',
        tags: ['Pro+'],
      },
      {
        icon: Star,
        title: 'Loyalty Points',
        description: 'Reward repeat clients with points they earn on every visit. Redeem for discounts, free services, or priority booking.',
        tags: ['Pro+'],
      },
    ],
  },
  {
    status: 'Planned',
    statusColor: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    dotColor: 'bg-blue-400',
    quarter: 'Q4 2026',
    items: [
      {
        icon: CreditCard,
        title: 'Deposits & Prepayments',
        description: 'Require upfront deposits at booking to dramatically cut no-shows. Full or partial deposit, configurable per service.',
        tags: ['Starter+'],
      },
      {
        icon: Globe,
        title: 'Multi-Currency Support',
        description: 'Accept payments in EUR, USD, CAD, and AUD in addition to GBP. Ideal for shops in international locations.',
        tags: ['Empire'],
      },
      {
        icon: Plug,
        title: 'Square POS Integration',
        description: 'Sync walk-in payments taken on Square with your BarberBoost client records and revenue dashboard.',
        tags: ['Pro+'],
      },
    ],
  },
  {
    status: 'Under Consideration',
    statusColor: 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400',
    dotColor: 'bg-zinc-500',
    quarter: 'Future',
    items: [
      {
        icon: Megaphone,
        title: 'Review Collection & Reputation Management',
        description: 'Automatically ask clients for a Google or Trustpilot review after their visit. Monitor and respond from the dashboard.',
        tags: ['All plans'],
      },
      {
        icon: Users,
        title: 'Franchise & Chain Dashboard',
        description: 'A unified view across all your locations — combined revenue, cross-location staff management, and centralised marketing.',
        tags: ['Empire'],
      },
    ],
  },
]

export default function RoadmapPage() {
  return (
    <main className="bg-[#0a0a0a]">
      {/* Hero */}
      <section className="pt-20 pb-12 px-4 sm:px-6 text-center space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">
          What's Next
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,7vw,5.5rem)] leading-none tracking-widest text-white">
          ROADMAP
        </h1>
        <p className="text-zinc-500 text-lg max-w-xl mx-auto">
          A transparent look at what we're building, what's planned, and what's on the horizon.
        </p>
        <div className="flex items-center justify-center gap-6 pt-2 text-xs text-zinc-500">
          {[
            { dot: 'bg-emerald-500', label: 'In Progress' },
            { dot: 'bg-blue-400', label: 'Planned' },
            { dot: 'bg-zinc-500', label: 'Under Consideration' },
          ].map(({ dot, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* Roadmap sections */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-16">
          {ROADMAP.map((section) => (
            <div key={`${section.status}-${section.quarter}`}>
              {/* Section header */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-2.5 h-2.5 rounded-full ${section.dotColor} shrink-0`} />
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${section.statusColor}`}>
                    {section.status}
                  </span>
                  <span className="text-xs text-zinc-600 font-medium">{section.quarter}</span>
                </div>
                <div className="flex-1 h-px bg-[#1e1e1e]" />
              </div>

              {/* Items */}
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div
                    key={item.title}
                    className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 flex gap-5 hover:border-[#c9a84c]/15 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/8 border border-[#c9a84c]/15 flex items-center justify-center shrink-0 group-hover:bg-[#c9a84c]/12 transition-colors">
                      <item.icon className="w-4.5 h-4.5 text-[#c9a84c]" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                        <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                        <div className="flex gap-1.5 flex-wrap">
                          {item.tags.map((tag) => (
                            <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1e1e1e] text-zinc-500 border border-[#2a2a2a]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-zinc-500 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Suggest a feature */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-10 text-center space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Got an idea?</p>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(1.8rem,4vw,2.8rem)] leading-none tracking-widest text-white">
              SHAPE THE PRODUCT
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-md mx-auto">
              We build what barbers actually need. If you have a feature request or workflow you'd love to see, we want to hear it.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold px-8 py-4 rounded-xl transition-all tracking-wide"
            >
              Share your idea
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
