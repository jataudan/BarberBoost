'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, Check, EyeOff, Eye, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

interface Review {
  id:          string
  client_name: string
  rating:      number | null
  comment:     string | null
  is_public:   boolean
  booking_id:  string | null
  created_at:  string
}

function StarRow({ rating }: { rating: number | null }) {
  const r = rating ?? 0
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} className={cn('w-3.5 h-3.5', n <= r ? 'fill-[#c9a84c]' : 'fill-white/10')}
          viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews]   = useState<Review[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/reviews?page=${p}`)
      const json = await res.json() as { reviews: Review[]; total: number }
      setReviews(json.reviews ?? [])
      setTotal(json.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page) }, [page, load])

  async function togglePublic(id: string, current: boolean) {
    setToggling(id)
    try {
      await fetch('/api/reviews', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_public: !current }),
      })
      setReviews(r => r.map(rv => rv.id === id ? { ...rv, is_public: !current } : rv))
    } finally {
      setToggling(null)
    }
  }

  const totalPages = Math.ceil(total / 20)
  const pending    = reviews.filter(r => !r.is_public).length
  const approved   = reviews.filter(r => r.is_public).length

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white leading-none">
            REVIEWS
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Approve customer reviews to display on your booking page</p>
        </div>
        <button type="button" onClick={() => load(page)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-xl px-3 py-2 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',    value: total,    color: 'text-white' },
          { label: 'Approved', value: approved, color: 'text-emerald-400' },
          { label: 'Pending',  value: pending,  color: 'text-yellow-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111111] border border-[#1e1e1e] rounded-2xl px-4 py-3">
            <p className={cn('text-2xl font-black', color)}>{value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Star className="w-10 h-10 text-zinc-700" />
          <p className="text-zinc-400 font-medium">No reviews yet</p>
          <p className="text-zinc-600 text-sm max-w-xs">
            Reviews appear here after customers complete a booking and submit feedback.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id}
              className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-5 flex gap-4">
              {/* Left: avatar */}
              <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-xs font-bold text-zinc-400 flex-shrink-0">
                {review.client_name.slice(0, 2).toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white text-sm">{review.client_name}</p>
                    <p className="text-[11px] text-zinc-600">{formatDate(review.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                      review.is_public
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
                    )}>
                      {review.is_public ? 'Approved' : 'Pending'}
                    </span>
                    <button type="button"
                      onClick={() => togglePublic(review.id, review.is_public)}
                      disabled={toggling === review.id}
                      title={review.is_public ? 'Hide review' : 'Approve review'}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
                      {toggling === review.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : review.is_public
                          ? <EyeOff className="w-3.5 h-3.5" />
                          : <Eye className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>

                <StarRow rating={review.rating} />

                {review.comment && (
                  <p className="text-sm text-zinc-400 leading-relaxed">{review.comment}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <button type="button" onClick={() => setPage(p => p - 1)} disabled={page <= 1}
            className="text-sm text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            ← Previous
          </button>
          <span className="text-xs text-zinc-600">Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
            className="text-sm text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            Next →
          </button>
        </div>
      )}

      {/* Info box */}
      <div className="flex items-start gap-3 bg-[#c9a84c]/[0.06] border border-[#c9a84c]/15 rounded-xl px-4 py-3">
        <Check className="w-4 h-4 text-[#c9a84c] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-400 leading-relaxed">
          Approved reviews are shown publicly on your booking page. Pending reviews are only visible here.
        </p>
      </div>
    </div>
  )
}
