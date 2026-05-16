'use client'

import { useEffect, useState, useCallback } from 'react'
import { Star, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface PlatformReview {
  id:          string
  shop_name:   string
  plan:        string
  rating:      number
  comment:     string
  is_approved: boolean
  created_at:  string
}

const PLAN_BADGE: Record<string, string> = {
  free:    'bg-slate-500/15 text-slate-400',
  starter: 'bg-indigo-500/15 text-indigo-400',
  pro:     'bg-amber-500/15 text-amber-400',
  empire:  'bg-emerald-500/15 text-emerald-400',
}

export default function AdminReviewsPage() {
  const [reviews, setReviews]   = useState<PlatformReview[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const limit = 20

  const load = useCallback(async (p: number) => {
    setLoading(true)
    const res  = await fetch(`/api/admin/reviews?page=${p}`)
    const data = await res.json()
    setReviews(data.reviews ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { load(page) }, [load, page])

  const toggle = async (id: string, is_approved: boolean) => {
    setUpdating(id)
    await fetch('/api/admin/reviews', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, is_approved }),
    })
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved } : r))
    setUpdating(null)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Platform Reviews</h1>
      <p className="text-white/40 text-sm mb-8">
        Approve reviews to show them on the marketing site · {total} total
      </p>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-white/40">Loading…</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-12 text-center text-white/30">
          No reviews yet
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div
              key={review.id}
              className={`rounded-xl border p-5 transition-colors ${
                review.is_approved ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">{review.shop_name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${PLAN_BADGE[review.plan] ?? PLAN_BADGE.free}`}>
                      {review.plan}
                    </span>
                    {review.is_approved && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 flex-shrink-0">
                        Approved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{review.comment}</p>
                  <p className="text-xs text-white/30 mt-2">
                    {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!review.is_approved ? (
                    <button
                      onClick={() => toggle(review.id, true)}
                      disabled={updating === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => toggle(review.id, false)}
                      disabled={updating === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 text-sm">
          <span className="text-white/40">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
