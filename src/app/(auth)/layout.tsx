import Link from 'next/link'
import Image from 'next/image'
import { AuthTestimonials } from '@/components/auth/AuthTestimonials'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">

      {/* ── Left branded panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] shrink-0 flex-col justify-between p-10 xl:p-14 relative overflow-hidden border-r border-[#c9a84c]/8">

        {/* Background glow */}
        <div className="absolute inset-0 hero-glow pointer-events-none" aria-hidden="true" />
        {/* Subtle diagonal pattern */}
        <div className="absolute inset-0 hero-pattern opacity-40 pointer-events-none" aria-hidden="true" />

        {/* Decorative scissors bg */}
        <svg
          className="absolute -right-16 top-1/3 w-64 h-64 text-[#c9a84c]/4 rotate-12 pointer-events-none"
          viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="0.8"
          aria-hidden="true"
        >
          <circle cx="16" cy="16" r="10" />
          <circle cx="16" cy="48" r="10" />
          <line x1="24" y1="22" x2="56" y2="8" />
          <line x1="24" y1="42" x2="56" y2="56" />
        </svg>

        {/* Top: logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="BarberBoost" width={200} height={40} priority className="h-10 w-auto" />
          </Link>
        </div>

        {/* Middle: headline */}
        <div className="relative z-10 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c] mb-4">
              Heritage meets digital
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-[3.5rem] xl:text-[4rem] leading-none tracking-widest text-white">
              RUN YOUR<br />
              <span className="text-[#c9a84c]">SHOP</span><br />
              SMARTER
            </h2>
          </div>

          <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
            Join 500+ UK barbershops using BarberBoost to book more clients,
            cut no-shows, and grow their business.
          </p>

          {/* Testimonials rotator */}
          <div className="bg-[#0f0f0f]/80 border border-[#c9a84c]/10 rounded-2xl p-5">
            <AuthTestimonials />
          </div>
        </div>

        {/* Bottom: trust signals */}
        <div className="relative z-10">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-600">
            {['No credit card required', 'Cancel any time', 'GDPR compliant', 'UK based'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="text-[#c9a84c]">✓</span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-8">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex justify-center">
          <Link href="/">
            <Image src="/logo.png" alt="BarberBoost" width={180} height={36} priority className="h-9 w-auto" />
          </Link>
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
