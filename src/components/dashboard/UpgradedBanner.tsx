'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Zap, X } from 'lucide-react'

type BannerKind = 'upgraded' | 'converted' | 'reactivated'

const COPY: Record<BannerKind, { title: string; body: string }> = {
  upgraded:    { title: 'Plan upgraded successfully!', body: 'Your new features are now active. Welcome to your new plan.' },
  converted:   { title: 'Card added — you’re all set!', body: 'Your remaining free trial days are untouched. Billing starts automatically once your trial ends.' },
  reactivated: { title: 'Welcome back!', body: 'Your account is fully active again — nothing was lost while you were away.' },
}

export function UpgradedBanner() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [kind, setKind] = useState<BannerKind | null>(null)

  useEffect(() => {
    const found = (['upgraded', 'converted', 'reactivated'] as BannerKind[]).find(k => searchParams.get(k) === 'true')
    if (found) {
      setKind(found)
      // Remove the query param without a hard reload
      const url = new URL(window.location.href)
      url.searchParams.delete(found)
      router.replace(url.pathname + (url.search || ''), { scroll: false })
    }
  }, [searchParams, router])

  if (!kind) return null
  const copy = COPY[kind]

  return (
    <div className="flex items-center justify-between gap-4 bg-[#c9a84c]/10 border border-[#c9a84c]/25 rounded-2xl px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#c9a84c]/15 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-[#c9a84c]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{copy.title}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{copy.body}</p>
        </div>
      </div>
      <button type="button" onClick={() => setKind(null)}
        className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-500 hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
