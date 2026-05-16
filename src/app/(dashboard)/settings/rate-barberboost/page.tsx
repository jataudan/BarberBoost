'use client'

import { useState } from 'react'
import { Star, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RateBarberBoostPage() {
  const [rating, setRating]         = useState(0)
  const [hovered, setHovered]       = useState(0)
  const [comment, setComment]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [alreadyDone, setAlreadyDone] = useState(false)

  async function submit() {
    if (!rating || comment.trim().length < 20) return
    setSubmitting(true)
    setError(null)
    try {
      const res  = await fetch('/api/platform-reviews', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      })
      if (res.status === 409) { setAlreadyDone(true); return }
      if (!res.ok) {
        const j = await res.json() as { error?: string }
        throw new Error(j.error ?? 'Failed to submit')
      }
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (done || alreadyDone) {
    return (
      <div className="max-w-xl space-y-8">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white leading-none">
            RATE BARBERBOOST
          </h1>
        </div>
        <div className="flex flex-col items-center gap-4 py-12 text-center bg-[#111111] border border-[#1e1e1e] rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center">
            <Check className="w-7 h-7 text-[#c9a84c]" />
          </div>
          <div>
            <p className="font-bold text-white">
              {alreadyDone ? 'You\'ve already left a review' : 'Thank you!'}
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              {alreadyDone
                ? 'We have your review on record — we really appreciate it.'
                : 'Your review has been submitted and will appear on the BarberBoost website once approved.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const charCount = comment.trim().length
  const canSubmit = rating > 0 && charCount >= 20

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white leading-none">
          RATE BARBERBOOST
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Share your experience — approved reviews appear on the BarberBoost website
        </p>
      </div>

      <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-6">
        {/* Stars */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-300">Overall rating</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                className="transition-transform hover:scale-110 active:scale-95">
                <Star className={cn('w-9 h-9 transition-colors',
                  n <= (hovered || rating)
                    ? 'fill-[#c9a84c] stroke-[#c9a84c]'
                    : 'fill-transparent stroke-zinc-600 hover:stroke-zinc-400',
                )} />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs text-zinc-500">
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="bb-review-comment" className="text-sm font-medium text-zinc-300">
              Your review <span className="text-red-400">*</span>
            </label>
            <span className={cn('text-xs', charCount >= 20 ? 'text-emerald-400' : 'text-zinc-600')}>
              {charCount}/500
            </span>
          </div>
          <textarea
            id="bb-review-comment"
            rows={5}
            maxLength={500}
            placeholder="Tell other barbers what you love about BarberBoost — bookings, reminders, analytics, client management… (min. 20 characters)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20 resize-none transition-all"
          />
          {charCount > 0 && charCount < 20 && (
            <p className="text-xs text-yellow-400">{20 - charCount} more characters needed</p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button type="button" onClick={submit} disabled={!canSubmit || submitting}
          className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl py-3.5 text-sm transition-colors">
          {submitting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
            : 'Submit Review'
          }
        </button>
      </div>

      <p className="text-xs text-zinc-600 leading-relaxed">
        Reviews are moderated before appearing on the website. We display your shop name and current plan alongside your review.
      </p>
    </div>
  )
}
