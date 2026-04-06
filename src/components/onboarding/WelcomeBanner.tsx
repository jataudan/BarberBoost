'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, ArrowRight, X } from 'lucide-react'

const SEEN_KEY = 'bb_welcome_seen'

export function WelcomeBanner() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const fromParam = searchParams.get('welcome') === '1'
    const alreadySeen = typeof window !== 'undefined' && localStorage.getItem(SEEN_KEY) === 'true'

    if (fromParam && !alreadySeen) {
      setVisible(true)
      localStorage.setItem(SEEN_KEY, 'true')
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('welcome')
      router.replace(url.pathname + (url.search || ''), { scroll: false })
    }
  }, [searchParams, router])

  if (!visible) return null

  return (
    <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-[#c9a84c]/10 to-[#c9a84c]/5 border border-[#c9a84c]/20 rounded-2xl px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#c9a84c]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4.5 h-4.5 text-[#c9a84c]" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Welcome to BarberBoost! 🔥</p>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed max-w-md">
            Your shop is live. Complete the checklist below to add your first service, barber, and share your booking page — it only takes 5 minutes.
          </p>
          <a
            href="/settings/booking-page"
            className="inline-flex items-center gap-1.5 text-xs text-[#c9a84c] hover:text-[#e2bf6a] font-medium mt-2 transition-colors"
          >
            View your booking page <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-500 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
