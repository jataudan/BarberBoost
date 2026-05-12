'use client'

import { useEffect, useState } from 'react'
import { Loader2, Check, Minus, Zap, ArrowRight, CreditCard, AlertCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PLANS, type PlanId } from '@/lib/stripe/plans'
import type { Subscription } from '@/types/database'

const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'empire']

const PLAN_ACCENT: Record<PlanId, { border: string; badge: string; cta: string; text: string; bg: string }> = {
  free:    { border: 'border-zinc-700',       badge: 'bg-zinc-700/60 text-zinc-300',          cta: 'bg-zinc-600 hover:bg-zinc-500',       text: 'text-zinc-400',   bg: 'bg-zinc-900/40'    },
  starter: { border: 'border-indigo-500/40',  badge: 'bg-indigo-500/10 text-indigo-300',       cta: 'bg-indigo-500 hover:bg-indigo-400',   text: 'text-indigo-400', bg: 'bg-indigo-500/[0.04]' },
  pro:     { border: 'border-[#c9a84c]/40',   badge: 'bg-[#c9a84c]/10 text-[#c9a84c]',        cta: 'bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a]', text: 'text-[#c9a84c]',   bg: 'bg-[#c9a84c]/[0.04]'  },
  empire:  { border: 'border-emerald-500/40', badge: 'bg-emerald-500/10 text-emerald-300',     cta: 'bg-emerald-500 hover:bg-emerald-400', text: 'text-emerald-400',bg: 'bg-emerald-500/[0.04]' },
}

function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const ERROR_MESSAGES: Record<string, string> = {
  price_not_configured: 'This plan is not yet configured. Please contact support.',
  checkout_failed:      'Checkout could not be started. Please try again or contact support.',
}

export default function BillingPage() {
  const [sub, setSub]           = useState<Subscription | null>(null)
  const [loading, setLoading]   = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError]     = useState<string | null>(null)
  const [upgrading, setUpgrading]         = useState<PlanId | null>(null)
  const [upgradeError, setUpgradeError]   = useState<string | null>(null)
  const [urlError, setUrlError]           = useState<string | null>(null)
  const [wasCanceled, setWasCanceled]     = useState(false)

  useEffect(() => {
    // Read redirect params from Stripe (client-side only)
    const params = new URLSearchParams(window.location.search)
    setUrlError(params.get('error'))
    setWasCanceled(params.get('canceled') === 'true')

    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('owner_id', user.id)
          .in('status', ['active', 'trialing', 'past_due'])
          .order('updated_at', { ascending: false })
          .limit(1)
        if (data?.[0]) setSub(data[0] as Subscription)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const currentPlanId: PlanId = (sub?.plan as PlanId | undefined) ?? 'free'
  const currentPlan = PLANS[currentPlanId]

  async function handleUpgrade(planId: PlanId) {
    setUpgrading(planId)
    setUpgradeError(null)
    try {
      const res  = await fetch('/api/stripe/upgrade', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ planId }),
      })
      const json = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) { setUpgradeError(json.error ?? 'Upgrade failed. Please try again.'); return }
      window.location.reload()
    } catch {
      setUpgradeError('Network error. Please try again.')
    } finally {
      setUpgrading(null)
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true)
    setPortalError(null)
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok || !json.url) { setPortalError(json.error ?? 'Could not open billing portal.'); return }
      window.location.href = json.url
    } catch {
      setPortalError('Network error. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
    </div>
  )

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white leading-none">BILLING</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your plan and payment details</p>
      </div>

      {/* Current plan card */}
      <div className={`bg-[#111111] border ${PLAN_ACCENT[currentPlanId].border} rounded-2xl p-6`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CreditCard className={`w-4 h-4 ${PLAN_ACCENT[currentPlanId].text}`} />
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Current plan</span>
            </div>
            <h2 className="text-2xl font-bold text-white">{currentPlan.name}</h2>
            <p className="text-sm text-zinc-400">{currentPlan.description}</p>
            {sub && (
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  sub.status === 'active'   ? 'bg-emerald-400/10 text-emerald-400' :
                  sub.status === 'trialing' ? 'bg-blue-400/10 text-blue-400' :
                  'bg-red-500/10 text-red-400'
                }`}>{sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}</span>
                {sub.current_period_end && (
                  <span className="text-xs text-zinc-500">
                    {sub.cancel_at_period_end ? 'Cancels' : 'Renews'} {fmtDate(sub.current_period_end)}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-white">
              {currentPlan.price === 0 ? 'Free' : `£${currentPlan.price}`}
              {currentPlan.price > 0 && <span className="text-sm font-normal text-zinc-500">/mo</span>}
            </p>
          </div>
        </div>

        {portalError && (
          <div className="mt-4 flex items-center gap-2 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{portalError}
          </div>
        )}

        {sub?.stripe_customer_id && (
          <button type="button" onClick={handleManageBilling} disabled={portalLoading}
            className="mt-4 flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] disabled:opacity-50 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-colors">
            {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Manage Billing
          </button>
        )}
      </div>

      {/* Inline upgrade error */}
      {upgradeError && (
        <div className="flex items-center gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />{upgradeError}
        </div>
      )}

      {/* Canceled / error banners from Stripe redirect */}
      {wasCanceled && (
        <div className="flex items-center gap-2.5 bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-400">
          <XCircle className="w-4 h-4 shrink-0 text-zinc-500" />
          Checkout was canceled — no charge was made. Choose a plan below to try again.
        </div>
      )}
      {urlError && (
        <div className="flex items-center gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {ERROR_MESSAGES[urlError] ?? 'Something went wrong. Please try again or contact support.'}
        </div>
      )}

      {/* Plan comparison */}
      <div>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">Available plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_ORDER.map(planId => {
            const plan     = PLANS[planId]
            const accent   = PLAN_ACCENT[planId]
            const isCurrent = planId === currentPlanId
            const isUpgrade = PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(currentPlanId)

            return (
              <div key={planId}
                className={`relative flex flex-col rounded-2xl border p-5 gap-4 ${accent.border} ${isCurrent ? accent.bg : 'bg-[#111111]'}`}>
                {isCurrent && (
                  <div className="absolute -top-2.5 left-4">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#0a0a0a] border border-[#2a2a2a] text-zinc-400 uppercase tracking-wider">
                      Current
                    </span>
                  </div>
                )}
                {'badge' in plan && (
                  <div className="absolute -top-2.5 right-4">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${accent.badge} uppercase tracking-wider`}>
                      {(plan as typeof PLANS['starter']).badge}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    {plan.price === 0
                      ? <span className="text-xl font-black text-white">Free</span>
                      : <><span className="text-xl font-black text-white">£{plan.price}</span><span className="text-zinc-500 text-xs">/mo</span></>
                    }
                  </div>
                </div>

                <ul className="space-y-1.5 flex-1">
                  {plan.features.slice(0, 5).map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                      <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${accent.text}`} />{f}
                    </li>
                  ))}
                  {plan.notIncluded.slice(0, 2).map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-zinc-600">
                      <Minus className="w-3.5 h-3.5 mt-0.5 shrink-0" />{f}
                    </li>
                  ))}
                </ul>

                {isUpgrade && (
                  sub?.stripe_customer_id ? (
                    // Already a paid subscriber — update subscription in-place
                    <button type="button"
                      onClick={() => handleUpgrade(planId as PlanId)}
                      disabled={upgrading === planId}
                      className={`w-full flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors disabled:opacity-60 ${accent.cta}`}>
                      {upgrading === planId
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Zap className="w-3.5 h-3.5" />}
                      Upgrade to {plan.name}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    // Free plan — create new Stripe Checkout session
                    <form action="/api/stripe/checkout" method="POST">
                      <input type="hidden" name="planId" value={planId} />
                      <button type="submit"
                        className={`w-full flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors ${accent.cta}`}>
                        <Zap className="w-3.5 h-3.5" /> Upgrade to {plan.name}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )
                )}
                {isCurrent && (
                  <div className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold bg-white/[0.04] text-zinc-500">
                    <Check className="w-3.5 h-3.5" /> Current plan
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-center text-zinc-600 text-xs mt-4">
          Cancel anytime · No hidden fees · Instant activation
        </p>
      </div>
    </div>
  )
}
