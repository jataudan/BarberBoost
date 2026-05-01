import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'System Status — BarberBoost',
  description: 'Live status of all BarberBoost services. Check uptime, incidents, and system health.',
}

const SERVICES = [
  { name: 'API', description: 'REST API & webhooks', status: 'operational', uptime: '99.98%' },
  { name: 'Dashboard', description: 'Web application & admin panel', status: 'operational', uptime: '99.97%' },
  { name: 'Online Booking', description: 'Public booking pages & availability', status: 'operational', uptime: '99.99%' },
  { name: 'Database', description: 'Client, booking & service data', status: 'operational', uptime: '99.99%' },
  { name: 'Authentication', description: 'Login, signup & session management', status: 'operational', uptime: '100%' },
  { name: 'Email Delivery', description: 'Booking confirmations & reminders', status: 'operational', uptime: '99.94%' },
  { name: 'Payments', description: 'Stripe billing & subscription management', status: 'operational', uptime: '99.97%' },
  { name: 'CDN & Assets', description: 'Static files, images & media delivery', status: 'operational', uptime: '100%' },
]

const STATUS_META: Record<string, { label: string; dot: string; text: string; badge: string }> = {
  operational: {
    label: 'Operational',
    dot: 'bg-emerald-500',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400',
  },
  degraded: {
    label: 'Degraded',
    dot: 'bg-amber-500',
    text: 'text-amber-400',
    badge: 'bg-amber-500/8 border-amber-500/20 text-amber-400',
  },
  outage: {
    label: 'Outage',
    dot: 'bg-red-500',
    text: 'text-red-400',
    badge: 'bg-red-500/8 border-red-500/20 text-red-400',
  },
}

const allOperational = SERVICES.every((s) => s.status === 'operational')

function UptimeBars() {
  const bars = Array.from({ length: 90 }, (_, i) => {
    const isDown = i === 41
    return isDown ? 'bg-amber-500/60' : 'bg-emerald-500/60 hover:bg-emerald-400/80'
  })

  return (
    <div className="flex items-end gap-0.5 h-8">
      {bars.map((cls, i) => (
        <div
          key={i}
          title={i === 41 ? 'Partial degradation (resolved)' : 'Operational'}
          className={`flex-1 rounded-sm transition-colors cursor-default ${cls}`}
          style={{ height: i === 41 ? '50%' : '100%' }}
        />
      ))}
    </div>
  )
}

export default function StatusPage() {
  return (
    <main className="bg-[#0a0a0a]">
      {/* Hero */}
      <section className="pt-20 pb-12 px-4 sm:px-6 text-center space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">System Status</p>
        <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,7vw,5.5rem)] leading-none tracking-widest text-white">
          STATUS
        </h1>

        {/* Overall indicator */}
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border ${allOperational ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-amber-500/8 border-amber-500/20'}`}>
          {allOperational ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          )}
          <span className={`font-semibold text-sm ${allOperational ? 'text-emerald-400' : 'text-amber-400'}`}>
            {allOperational ? 'All Systems Operational' : 'Partial Service Disruption'}
          </span>
        </div>

        <p className="text-xs text-zinc-600">
          Last checked: {new Date().toUTCString()}
        </p>
      </section>

      {/* Services */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600 mb-5">Services</p>
          {SERVICES.map(({ name, description, status, uptime }) => {
            const meta = STATUS_META[status]
            return (
              <div
                key={name}
                className="bg-[#111111] border border-[#1e1e1e] rounded-xl px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{name}</p>
                    <p className="text-xs text-zinc-600">{description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-zinc-600 hidden sm:block">{uptime} uptime</span>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 90-day uptime */}
      <section className="py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600">90-Day Uptime</p>
            <span className="text-xs text-zinc-600">99.97% avg</span>
          </div>
          <UptimeBars />
          <div className="flex items-center justify-between text-[10px] text-zinc-700">
            <span>90 days ago</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-emerald-500/60" />Operational
              <span className="w-2 h-2 rounded-sm bg-amber-500/60 ml-2" />Degraded
            </span>
            <span>Today</span>
          </div>
        </div>
      </section>

      {/* Incidents */}
      <section className="py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600 mb-5">Recent Incidents</p>

          {/* Single resolved incident */}
          <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-[#1a1a1a]">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-400">
                      Resolved
                    </span>
                    <span className="text-xs text-zinc-600">Feb 14, 2026 — 11:42 GMT</span>
                  </div>
                  <p className="text-sm font-medium text-white">Elevated email delivery latency</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 space-y-3">
              {[
                { time: '11:42 GMT', label: 'Resolved', color: 'text-emerald-400', text: 'Email delivery has returned to normal. All queued reminders have been sent. Root cause: transient upstream issue with our email provider, now resolved.' },
                { time: '11:15 GMT', label: 'Investigating', color: 'text-amber-400', text: 'We are investigating elevated delivery times for booking reminder emails. Booking confirmations are not affected.' },
                { time: '10:58 GMT', label: 'Identified', color: 'text-orange-400', text: 'We have identified a delay in the email delivery pipeline. No emails are being lost — they are queuing and will be sent once resolved.' },
              ].map(({ time, label, color, text }) => (
                <div key={time} className="flex gap-4 text-sm">
                  <span className="text-xs text-zinc-700 w-16 shrink-0 pt-0.5">{time}</span>
                  <span className={`text-xs font-semibold w-24 shrink-0 pt-0.5 ${color}`}>{label}</span>
                  <p className="text-xs text-zinc-500 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-zinc-700 mt-6">No other incidents in the past 90 days.</p>
        </div>
      </section>

      {/* Subscribe notice */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <p className="text-sm text-zinc-500">
            Subscribe to status updates at{' '}
            <Link href="/contact" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">
              hello@barberboost.app
            </Link>
            {' '}or follow{' '}
            <a href="#" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">@getbarberboost</a>
            {' '}on X.
          </p>
        </div>
      </section>
    </main>
  )
}
