const TESTIMONIALS = [
  {
    quote:
      "BarberBoost cut my no-shows by 60%. The automated WhatsApp reminders are an absolute game-changer — I don't chase clients anymore, the system does it for me.",
    author: 'Marcus Thompson',
    shop: 'Fade Kings, Birmingham',
    initials: 'MT',
    rating: 5,
    plan: 'Pro',
  },
  {
    quote:
      "I manage 4 chairs from my phone on the Empire plan. £79 a month saves me 10+ hours of admin a week. The multi-location dashboard alone is worth it.",
    author: 'Kofi Asante',
    shop: 'The Barber Lab, Manchester',
    initials: 'KA',
    rating: 5,
    plan: 'Empire',
  },
  {
    quote:
      "My clients actually book online now — 80% of them. I thought they wouldn't bother but the booking page looks so clean they trust it immediately.",
    author: 'Ryan Williams',
    shop: 'Crisp & Clean, London',
    initials: 'RW',
    rating: 5,
    plan: 'Starter',
  },
]

const PLAN_BADGE: Record<string, string> = {
  Starter: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  Pro:     'text-[#c9a84c] bg-[#c9a84c]/10 border-[#c9a84c]/20',
  Empire:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

export function Testimonials() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-[#0d0d0d] border-y border-[#c9a84c]/5">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">
            Testimonials
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,6vw,4.5rem)] leading-none tracking-widest text-white">
            BARBERS DON&apos;T LIE
          </h2>
          <p className="text-zinc-500 text-lg">
            Real shops. Real results.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, author, shop, initials, rating, plan }) => (
            <article
              key={author}
              className="relative bg-[#111111] border border-[#1e1e1e] rounded-2xl p-7 flex flex-col gap-5 hover:border-[#c9a84c]/15 transition-colors group"
            >
              {/* Large decorative quote mark */}
              <div
                className="absolute top-5 right-6 font-[family-name:var(--font-heading)] text-8xl leading-none text-[#c9a84c]/6 select-none pointer-events-none"
                aria-hidden="true"
              >
                "
              </div>

              {/* Stars */}
              <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
                {Array.from({ length: rating }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-[#c9a84c]" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-zinc-300 text-sm leading-relaxed flex-1">&ldquo;{quote}&rdquo;</p>

              {/* Author row */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#1e1e1e]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-xs font-bold text-zinc-400">
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{author}</p>
                    <p className="text-xs text-zinc-600">{shop}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PLAN_BADGE[plan]}`}>
                  {plan}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
