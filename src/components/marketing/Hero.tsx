import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'

/** Decorative barbershop scissors SVG — placed absolutely in hero background */
function DecorativeScissors({
  className,
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="10" />
      <circle cx="16" cy="48" r="10" />
      <line x1="24" y1="22" x2="56" y2="8" />
      <line x1="24" y1="42" x2="56" y2="56" />
      <line x1="36" y1="30" x2="56" y2="8" />
    </svg>
  )
}

/** Decorative comb SVG */
function DecorativeComb({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 72"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="4" width="40" height="16" rx="3" />
      {[8, 16, 24, 32, 40].map((x) => (
        <line key={x} x1={x} y1="20" x2={x} y2="52" />
      ))}
    </svg>
  )
}

/** Decorative razor SVG */
function DecorativeRazor({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 40 L40 8" />
      <path d="M36 4 L44 12 L12 44 L4 44 L4 36 Z" />
      <line x1="28" y1="20" x2="20" y2="28" />
    </svg>
  )
}

const STATS = [
  { value: '500+', label: 'UK Barbershops' },
  { value: '40%', label: 'Fewer No-Shows' },
  { value: '£2M+', label: 'Revenue Managed' },
  { value: '4.9★', label: 'Average Rating' },
]

export function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden bg-[#0a0a0a]">
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none hero-glow" aria-hidden="true" />

      {/* Geometric barbershop pattern — decorative icons scattered in background */}
      <DecorativeScissors className="absolute top-[12%] left-[6%] w-24 h-24 text-[#c9a84c]/5 rotate-[-20deg]" />
      <DecorativeScissors className="absolute bottom-[18%] right-[5%] w-32 h-32 text-[#c9a84c]/5 rotate-[15deg]" />
      <DecorativeComb className="absolute top-[20%] right-[12%] w-14 h-20 text-[#c9a84c]/5 rotate-[10deg]" />
      <DecorativeComb className="absolute bottom-[25%] left-[10%] w-10 h-14 text-[#c9a84c]/5 rotate-[-15deg]" />
      <DecorativeRazor className="absolute top-[55%] left-[3%] w-16 h-16 text-[#c9a84c]/4 rotate-[30deg]" />
      <DecorativeRazor className="absolute top-[8%] right-[3%] w-12 h-12 text-[#c9a84c]/4 rotate-[-10deg]" />

      {/* Subtle diagonal line pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30 hero-pattern" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#c9a84c]/8 border border-[#c9a84c]/25 text-[#c9a84c] text-xs font-semibold px-4 py-2 rounded-full tracking-widest uppercase">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
            🇬🇧 &nbsp;The #1 Platform for UK Barbershops
          </div>

          {/* Headline */}
          <h1 className="font-[family-name:var(--font-heading)] leading-none tracking-widest text-[clamp(2.8rem,10vw,8rem)]">
            <span className="block text-white">RUN YOUR</span>
            <span className="block text-[#c9a84c]">BARBERSHOP</span>
            <span className="block text-white">LIKE A BOSS</span>
          </h1>

          {/* Subheadline */}
          <p className="text-zinc-400 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
            The all-in-one platform UK barbers use to book more clients, reduce no-shows,
            and grow their business — without the admin headache.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/signup"
              className="group flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold px-6 sm:px-8 py-4 rounded-xl transition-all duration-200 text-base tracking-wide shadow-lg shadow-[#c9a84c]/20 hover:shadow-[#c9a84c]/30 hover:scale-[1.02]"
            >
              Start Free — No Card Needed
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              className="flex items-center justify-center gap-3 text-white border border-zinc-700 hover:border-[#c9a84c]/50 px-6 sm:px-8 py-4 rounded-xl transition-all duration-200 text-base hover:bg-[#c9a84c]/5"
            >
              <span className="w-8 h-8 rounded-full border border-zinc-600 flex items-center justify-center flex-shrink-0">
                <Play className="w-3 h-3 fill-white ml-0.5" />
              </span>
              Watch Demo
            </button>
          </div>

          {/* Trust nudge */}
          <p className="text-sm text-zinc-600">
            Free plan available · No credit card · Setup in 5 minutes
          </p>
        </div>

        {/* Stats row */}
        <div className="mt-12 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-[#c9a84c]/10 rounded-2xl overflow-hidden border border-[#c9a84c]/10 max-w-3xl mx-auto">
          {STATS.map(({ value, label }) => (
            <div
              key={label}
              className="bg-[#0f0f0f] px-4 sm:px-6 py-4 sm:py-5 text-center first:rounded-l-2xl last:rounded-r-2xl"
            >
              <p className="font-[family-name:var(--font-heading)] text-3xl text-[#c9a84c] leading-none tracking-wide">
                {value}
              </p>
              <p className="text-xs text-zinc-500 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none hero-fade-bottom" aria-hidden="true" />
    </section>
  )
}
