'use client'

import { useState, useEffect } from 'react'

const TESTIMONIALS = [
  {
    quote:
      'BarberBoost cut my no-shows by 60%. I used to chase clients — now the system does it for me.',
    author: 'Marcus Thompson',
    shop: 'Fade Kings, Birmingham',
    initials: 'MT',
  },
  {
    quote:
      'Setup took 5 minutes. Within a week I had 30 online bookings. My clients love it.',
    author: 'Ryan Williams',
    shop: 'Crisp & Clean, London',
    initials: 'RW',
  },
  {
    quote:
      'Managing 4 chairs from my phone. The Empire plan alone saves me 10 hours a week.',
    author: 'Kofi Asante',
    shop: 'The Barber Lab, Manchester',
    initials: 'KA',
  },
]

export function AuthTestimonials() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const t = TESTIMONIALS[active]

  return (
    <div className="space-y-5">
      {/* Stars */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className="w-4 h-4 fill-[#c9a84c]" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-sm text-zinc-300 leading-relaxed min-h-[60px]">
        &ldquo;{t.quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#c9a84c]/15 border border-[#c9a84c]/25 flex items-center justify-center text-[#c9a84c] text-xs font-bold">
          {t.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{t.author}</p>
          <p className="text-xs text-zinc-600">{t.shop}</p>
        </div>
      </div>

      {/* Dots */}
      <div className="flex gap-1.5">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Testimonial ${i + 1}`}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === active ? 'w-6 bg-[#c9a84c]' : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
