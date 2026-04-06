'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Zap, X } from 'lucide-react'

export function UpgradedBanner() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setVisible(true)
      // Remove the query param without a hard reload
      const url = new URL(window.location.href)
      url.searchParams.delete('upgraded')
      router.replace(url.pathname + (url.search || ''), { scroll: false })
    }
  }, [searchParams, router])

  if (!visible) return null

  return (
    <div className="flex items-center justify-between gap-4 bg-[#c9a84c]/10 border border-[#c9a84c]/25 rounded-2xl px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#c9a84c]/15 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-[#c9a84c]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Plan upgraded successfully!</p>
          <p className="text-xs text-zinc-400 mt-0.5">Your new features are now active. Welcome to your new plan.</p>
        </div>
      </div>
      <button type="button" onClick={() => setVisible(false)}
        className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-500 hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
