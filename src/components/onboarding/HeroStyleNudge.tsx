'use client'

import { useEffect, useState } from 'react'
import { Wand2, X } from 'lucide-react'
import { HeroStylePicker } from './HeroStylePicker'
import { HERO_PRESETS } from '@/lib/hero-presets'
import type { Shop } from '@/types/database'

const DISMISSED_KEY = 'bb_hero_nudge_v1'

export function HeroStyleNudge() {
  const [visible, setVisible]       = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY) === 'true'
    if (dismissed) return

    fetch('/api/shops')
      .then(r => r.json())
      .then((json: { data?: Shop }) => {
        if (json.data && !json.data.cover_url) setVisible(true)
      })
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      <div className="flex items-center gap-4 bg-[#111111] border border-white/[0.08] rounded-2xl px-5 py-4 overflow-hidden relative">
        {/* Gradient preview strip */}
        <div className="hidden sm:flex gap-1 flex-shrink-0" aria-hidden>
          {HERO_PRESETS.slice(0, 5).map(p => (
            <div
              key={p.id}
              className="w-5 h-10 rounded-md flex-shrink-0"
              style={{ background: p.background }}
            />
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Make your booking page stand out</p>
          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
            Choose a hero style for your public booking page — takes seconds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] text-xs font-bold rounded-xl px-3.5 py-2 transition-colors flex-shrink-0"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Choose style
        </button>

        <button
          type="button"
          onClick={dismiss}
          className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {showPicker && (
        <HeroStylePicker
          onClose={() => setShowPicker(false)}
          onSelect={() => { setVisible(false) }}
        />
      )}
    </>
  )
}
