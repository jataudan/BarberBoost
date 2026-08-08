import { cache } from 'react'
import { createAdminClient } from './supabase/admin'
import type { PlanId } from './stripe/plans'
import type { Subscription, SubscriptionStatus } from '@/types/database'

export type EntitlementState = 'trialing' | 'active' | 'past_due' | 'read_only'
export type ReadOnlyReason   = 'paused' | 'canceled' | 'past_due_expired'

export interface Entitlement {
  state:               EntitlementState
  isReadOnly:          boolean
  readOnlyReason:      ReadOnlyReason | null
  plan:                PlanId
  status:              SubscriptionStatus | null
  /** Only meaningful when state === 'trialing'. */
  trialDaysRemaining:  number | null
  subscription:        Subscription | null
}

/** Full access continues this many days past `current_period_end` while `past_due`/`incomplete`/`unpaid`. */
const PAST_DUE_GRACE_DAYS = 7

function daysUntil(target: Date): number {
  return Math.ceil((target.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
}

/**
 * Single source of truth for what a shop can do right now. Every gate in the
 * app — dashboard banners and server-side mutation checks alike — goes
 * through this, never a scattered `status === 'active'` check.
 *
 * Deliberately uses the service-role client: this is a trusted, cross-cutting
 * read called from dashboard layouts, mutating API routes, the public
 * booking route, and cron jobs alike, not a user-facing RLS-scoped fetch.
 * Callers are responsible for having already established that `shopId` is
 * the right one to check (e.g. an owner-authenticated route already did its
 * own `.eq('owner_id', user.id)` shop lookup before calling this).
 */
export const getEntitlement = cache(async (shopId: string): Promise<Entitlement> => {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('shop_id', shopId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const subscription = data as Subscription | null

  if (!subscription) {
    return {
      state: 'read_only', isReadOnly: true, readOnlyReason: 'canceled',
      plan: 'free', status: null, trialDaysRemaining: null, subscription: null,
    }
  }

  const plan   = subscription.plan as PlanId
  const status = subscription.status

  if (status === 'trialing') {
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null
    return {
      state: 'trialing', isReadOnly: false, readOnlyReason: null, plan, status,
      trialDaysRemaining: trialEnd ? Math.max(0, daysUntil(trialEnd)) : null,
      subscription,
    }
  }

  if (status === 'active') {
    return { state: 'active', isReadOnly: false, readOnlyReason: null, plan, status, trialDaysRemaining: null, subscription }
  }

  if (status === 'paused') {
    return { state: 'read_only', isReadOnly: true, readOnlyReason: 'paused', plan, status, trialDaysRemaining: null, subscription }
  }

  if (status === 'canceled') {
    return { state: 'read_only', isReadOnly: true, readOnlyReason: 'canceled', plan, status, trialDaysRemaining: null, subscription }
  }

  // past_due, incomplete, unpaid — same grace-window treatment (spec: "treat
  // as past_due"). Anchored to current_period_end, falling back to created_at
  // for subscriptions that never reached a normal billing period.
  if (status === 'past_due' || status === 'incomplete' || status === 'unpaid') {
    const anchor = new Date(subscription.current_period_end ?? subscription.created_at)
    const graceCutoff = new Date(anchor.getTime() + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000)
    if (Date.now() > graceCutoff.getTime()) {
      return { state: 'read_only', isReadOnly: true, readOnlyReason: 'past_due_expired', plan, status, trialDaysRemaining: null, subscription }
    }
    return { state: 'past_due', isReadOnly: false, readOnlyReason: null, plan, status, trialDaysRemaining: null, subscription }
  }

  // 'inactive' or any unrecognised status — safest default is read-only.
  return { state: 'read_only', isReadOnly: true, readOnlyReason: 'canceled', plan, status, trialDaysRemaining: null, subscription }
})

/**
 * Server-side gate for mutating endpoints. Returns `{ ok: true }` when the
 * shop may write, or `{ ok: false, entitlement }` when it's read-only —
 * callers should respond 403 in the latter case. This is the only function
 * that should ever decide "can this shop write right now?"
 */
export async function requireWriteAccess(shopId: string): Promise<
  { ok: true } | { ok: false; entitlement: Entitlement }
> {
  const entitlement = await getEntitlement(shopId)
  if (entitlement.isReadOnly) return { ok: false, entitlement }
  return { ok: true }
}

export function readOnlyResponseBody(entitlement: Entitlement) {
  const messages: Record<ReadOnlyReason, string> = {
    paused:             'This account is paused — add a payment method to reactivate.',
    canceled:           'This account is read-only — resubscribe to make changes.',
    past_due_expired:   'This account is read-only after a failed payment — update your card to reactivate.',
  }
  return {
    error: entitlement.readOnlyReason ? messages[entitlement.readOnlyReason] : 'This account is read-only.',
    code:  'READ_ONLY' as const,
    readOnlyReason: entitlement.readOnlyReason,
  }
}
