import { Calendar, Users, UserCheck, Megaphone, Package, BarChart2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type PlanBadge = 'Free' | 'Starter' | 'Pro' | 'Empire'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  plan: PlanBadge
  accentClass: string
}

const PLAN_BADGE_STYLES: Record<PlanBadge, string> = {
  Free:    'bg-zinc-800 text-zinc-400 border-zinc-700',
  Starter: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Pro:     'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/20',
  Empire:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const FEATURES: Feature[] = [
  {
    icon: Calendar,
    title: 'Smart Booking Calendar',
    description:
      'Drag & drop appointments, real-time availability, automated SMS & email reminders that cut no-shows by 40%.',
    plan: 'Free',
    accentClass: 'text-zinc-400 bg-zinc-800/50',
  },
  {
    icon: Users,
    title: 'Client Management',
    description:
      'Full history, style preferences, spend tracking, and loyalty points. Every client remembered, every visit counted.',
    plan: 'Free',
    accentClass: 'text-zinc-400 bg-zinc-800/50',
  },
  {
    icon: UserCheck,
    title: 'Staff & Commissions',
    description:
      'Schedule barbers, assign services, track individual earnings and commissions — all from one dashboard.',
    plan: 'Starter',
    accentClass: 'text-indigo-400 bg-indigo-500/10',
  },
  {
    icon: Megaphone,
    title: 'Marketing Tools',
    description:
      'Email & SMS campaigns, re-engagement flows for lapsed clients, and promo codes to fill slow Mondays.',
    plan: 'Starter',
    accentClass: 'text-indigo-400 bg-indigo-500/10',
  },
  {
    icon: Package,
    title: 'Inventory Control',
    description:
      'Track product stock, set low-level alerts, and never run out of fade spray before a Saturday rush.',
    plan: 'Pro',
    accentClass: 'text-[#c9a84c] bg-[#c9a84c]/10',
  },
  {
    icon: BarChart2,
    title: 'Analytics Dashboard',
    description:
      'Revenue charts, peak hours, top services, and staff performance. Know your numbers, grow your business.',
    plan: 'Pro',
    accentClass: 'text-[#c9a84c] bg-[#c9a84c]/10',
  },
]

export function Features() {
  return (
    <section className="pt-8 pb-24 px-4 sm:px-6 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, description, plan, accentClass }) => (
            <article
              key={title}
              className="group relative bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 flex flex-col gap-4 hover:border-[#c9a84c]/20 transition-all duration-300 hover:bg-[#131313]"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(201,168,76,0.04),transparent_60%)]" />

              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accentClass}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Text */}
              <div className="space-y-1.5 flex-1">
                <h3 className="font-semibold text-white text-base">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
              </div>

              {/* Plan badge */}
              <div className="pt-2 border-t border-[#1e1e1e]">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${PLAN_BADGE_STYLES[plan]}`}
                >
                  <span className="w-1 h-1 rounded-full bg-current" />
                  {plan === 'Free' ? 'Available on Free plan' : `Unlocked on ${plan}`}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
