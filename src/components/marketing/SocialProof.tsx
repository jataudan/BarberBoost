const STATS = [
  { value: '500+', label: 'UK barbershops trust BarberBoost' },
  { value: '£2M+', label: 'Revenue processed monthly' },
  { value: '40%', label: 'Average reduction in no-shows' },
  { value: '4.9 / 5', label: 'Average customer rating' },
]

const SHOP_NAMES = [
  'Precision Cuts',
  'Fade Kings',
  'The Barber Lab',
  'Crisp & Clean',
  'Crown Barbers',
  'Sharp Society',
]

export function SocialProof() {
  return (
    <section className="border-y border-[#c9a84c]/10 bg-[#0d0d0d]">
      {/* Stats row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600 mb-10">
          Trusted by 500+ UK Barbershops
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label} className="space-y-1">
              <p className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl text-[#c9a84c] leading-none tracking-wide">
                {value}
              </p>
              <p className="text-sm text-zinc-500 leading-snug">{label}</p>
            </div>
          ))}
        </div>

        {/* Shop name ticker */}
        <div className="mt-12 pt-8 border-t border-[#1a1a1a]">
          <p className="text-center text-xs text-zinc-700 mb-5 tracking-widest uppercase">
            Shops running on BarberBoost
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {SHOP_NAMES.map((name) => (
              <span
                key={name}
                className="font-[family-name:var(--font-heading)] text-lg tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
