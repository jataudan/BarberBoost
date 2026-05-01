import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Changelog — BarberBoost',
  description: "See what's new in BarberBoost. Version history, bug fixes, and feature releases.",
}

const RELEASES = [
  {
    version: 'v1.5.0',
    date: 'May 2026',
    label: 'Latest',
    labelColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    title: 'Booking References & Marketing Site',
    summary: 'Every booking now has a unique reference code, making client enquiries instant. The full marketing site ships alongside this — Help Centre, API docs, legal pages, and more.',
    changes: [
      {
        type: 'New',
        items: [
          'Booking references (BB-XXXXXXXX) — unique code on every booking, shown in the list, detail panel, and client emails',
          'Reference-based search — paste a BB- code to jump directly to any booking with no scrolling',
          'Help Centre with setup guide, daily workflow, common how-to cards, and 35+ FAQ entries',
          'API reference documentation (Empire plan)',
          'Live system status page with 90-day uptime history',
          'Roadmap, Changelog, Blog, Careers, Community, and About pages',
          'Full legal suite — Privacy Policy, Terms of Service, Cookie Policy, GDPR page',
          'Contact form wired to support inbox via Resend',
        ],
      },
      {
        type: 'Fixed',
        items: [
          'Public online bookings now correctly include booking_ref in confirmation emails',
          'Help Centre "Bookings & Clients" nav card linked to the wrong FAQ section',
        ],
      },
    ],
  },
  {
    version: 'v1.4.2',
    date: 'April 2026',
    label: 'Patch',
    labelColor: 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400',
    title: 'Email & Bookings Stability',
    summary: 'Hardened the email delivery layer and fixed a series of edge-case crashes in the bookings view.',
    changes: [
      { type: 'Fixed', items: ['From address now uses barberboost.app domain across all transactional emails', 'Email send errors are now surfaced rather than silently swallowed', 'Invalid time value crashes on the bookings page resolved', 'SSR hydration mismatch on bookings page eliminated'] },
      { type: 'Improved', items: ['Booking modal now uses lazy step rendering — faster open time', 'Redirect /bookings/new correctly to /bookings'] },
    ],
  },
  {
    version: 'v1.4.0',
    date: 'March 2026',
    label: 'Feature',
    labelColor: 'bg-[#c9a84c]/10 border-[#c9a84c]/30 text-[#c9a84c]',
    title: 'Marketing Campaigns & AI Copywriting',
    summary: 'Launch email and SMS campaigns to your client segments, now with AI-generated copy powered by Claude.',
    changes: [
      { type: 'New', items: ['Marketing campaigns module for email, SMS, and push notifications', 'AI copy generation — describe your campaign and get a polished draft instantly', 'Client segmentation: All, VIP, Regular, At-risk, New, Inactive 60+ days', 'Campaign scheduling and status tracking (Draft → Scheduled → Sent)', 'Open rate and delivery metrics per campaign'] },
      { type: 'Improved', items: ['Dashboard KPI cards now load 40% faster with deferred queries', 'Onboarding checklist now auto-dismisses once all steps are complete'] },
    ],
  },
  {
    version: 'v1.3.0',
    date: 'February 2026',
    label: 'Feature',
    labelColor: 'bg-[#c9a84c]/10 border-[#c9a84c]/30 text-[#c9a84c]',
    title: 'Advanced Analytics & Inventory',
    summary: 'Deep insights into your business performance, plus full stock management for Pro plans.',
    changes: [
      { type: 'New', items: ['Analytics page with date range filtering, revenue charts, and busiest hours heatmap', 'Staff performance table with revenue attribution', 'Inventory management with low-stock alerts, supplier tracking, and adjustment history', 'Financial summary export (Pro & Empire plans)'] },
      { type: 'Improved', items: ['Client profile now shows full visit history and lifetime spend', 'Services page supports drag-and-drop ordering'] },
      { type: 'Fixed', items: ['Revenue chart showed incorrect totals when bookings spanned midnight', 'Staff working hours not saving on first creation'] },
    ],
  },
  {
    version: 'v1.2.0',
    date: 'January 2026',
    label: 'Feature',
    labelColor: 'bg-[#c9a84c]/10 border-[#c9a84c]/30 text-[#c9a84c]',
    title: 'Multi-Staff & Client Tagging',
    summary: 'Manage a full team of barbers, set individual working hours, and segment your client base automatically.',
    changes: [
      { type: 'New', items: ['Multi-staff support with per-barber availability and booking assignment', 'Client auto-tagging: New, Regular, VIP, At-risk based on visit frequency', 'Automated booking reminders via email (Starter plan+)', 'Day and Week calendar views on the Bookings page', 'Public booking page customisation in Settings'] },
      { type: 'Improved', items: ['Booking creation flow redesigned — fewer taps to confirm', 'Mobile navigation improved with bottom sheet menus'] },
    ],
  },
  {
    version: 'v1.0.0',
    date: 'December 2025',
    label: 'Launch',
    labelColor: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    title: 'Initial Launch',
    summary: 'BarberBoost goes live. Online bookings, client management, service menus, and Stripe payments.',
    changes: [
      { type: 'New', items: ['Online booking system with public booking page', 'Client database with contact details and visit history', 'Service menu with pricing, duration, and categories', 'Stripe-powered subscription billing', 'Dashboard with today\'s schedule and KPI overview', 'Free plan available — no card required'] },
    ],
  },
]

const TYPE_STYLES: Record<string, string> = {
  New: 'bg-emerald-500/8 text-emerald-400 border border-emerald-500/20',
  Improved: 'bg-blue-500/8 text-blue-400 border border-blue-500/20',
  Fixed: 'bg-orange-500/8 text-orange-400 border border-orange-500/20',
  Security: 'bg-red-500/8 text-red-400 border border-red-500/20',
}

export default function ChangelogPage() {
  return (
    <main className="bg-[#0a0a0a]">
      {/* Hero */}
      <section className="pt-20 pb-12 px-4 sm:px-6 text-center space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">
          Product Updates
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,7vw,5.5rem)] leading-none tracking-widest text-white">
          CHANGELOG
        </h1>
        <p className="text-zinc-500 text-lg max-w-xl mx-auto">
          Every fix, feature, and improvement — documented as we ship it.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            href="/roadmap"
            className="text-sm text-zinc-400 hover:text-[#c9a84c] transition-colors flex items-center gap-1.5"
          >
            See what's coming next
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-12">
          {RELEASES.map((release, i) => (
            <div key={release.version} className="relative">
              {/* Connector line */}
              {i < RELEASES.length - 1 && (
                <div className="absolute left-[5.5rem] top-16 bottom-0 w-px bg-[#1e1e1e] -mb-12" />
              )}

              <div className="flex gap-6">
                {/* Date + version */}
                <div className="w-20 shrink-0 pt-1 text-right">
                  <p className="text-xs text-zinc-600 leading-relaxed">{release.date}</p>
                  <p className="text-xs font-mono text-zinc-500 mt-1">{release.version}</p>
                </div>

                {/* Dot */}
                <div className="relative flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-[#c9a84c]/60 border border-[#c9a84c] mt-1 shrink-0 z-10" />
                </div>

                {/* Card */}
                <div className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5 hover:border-[#c9a84c]/15 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full border ${release.labelColor}`}>
                        {release.label}
                      </span>
                      <h2 className="font-[family-name:var(--font-heading)] text-xl tracking-widest text-white leading-tight mt-1">
                        {release.title}
                      </h2>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed">{release.summary}</p>

                  <div className="space-y-4">
                    {release.changes.map((group) => (
                      <div key={group.type}>
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md mb-2 ${TYPE_STYLES[group.type] ?? TYPE_STYLES.New}`}>
                          {group.type}
                        </span>
                        <ul className="space-y-1.5">
                          {group.items.map((item) => (
                            <li key={item} className="text-sm text-zinc-500 flex gap-2">
                              <span className="text-zinc-700 mt-1.5">—</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-[family-name:var(--font-heading)] text-[clamp(1.8rem,4vw,3rem)] leading-none tracking-widest text-white">
            WANT TO SEE WHAT'S NEXT?
          </h2>
          <p className="text-zinc-500">
            Check the roadmap or jump in and try the product.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/roadmap"
              className="group flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold px-8 py-4 rounded-xl transition-all tracking-wide"
            >
              View Roadmap
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/signup"
              className="text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-8 py-4 rounded-xl transition-all"
            >
              Start Free
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
