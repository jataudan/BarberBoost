'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

interface Props {
  url:   string
  title: string
}

export function ShareButton({ url, title }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (typeof navigator === 'undefined') return

    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard also unavailable — nothing to do
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white transition-all flex-shrink-0 min-w-[64px]"
    >
      {copied
        ? <Check className="w-4 h-4 text-emerald-400" />
        : <Share2 className="w-4 h-4" />
      }
      <span className="text-[10px] font-medium">{copied ? 'Copied!' : 'Share'}</span>
    </button>
  )
}
