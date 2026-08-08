import { describe, it, expect, vi } from 'vitest'
import { getEntitlement } from '@/lib/entitlement'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSubscriptionRow: any = null

function chainable(result: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {}
  for (const m of ['select', 'eq', 'order', 'limit']) builder[m] = () => builder
  builder.maybeSingle = () => Promise.resolve(result)
  return builder
}

// vi.mock() is hoisted above imports by Vitest, so getEntitlement above already
// resolves against this mocked admin client.
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== 'subscriptions') throw new Error(`unexpected table ${table}`)
      return chainable({ data: mockSubscriptionRow, error: null })
    },
  }),
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function baseSub(overrides: Record<string, any>) {
  return {
    id: 'sub_1', plan: 'pro', status: 'active',
    current_period_end: null, trial_end: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('getEntitlement', () => {
  // NOTE: getEntitlement is wrapped in React's cache() — use a unique shopId
  // per test case so results from one test never leak into another.

  it('trialing: full access, reports days remaining', async () => {
    mockSubscriptionRow = baseSub({
      status: 'trialing',
      trial_end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    })
    const e = await getEntitlement('shop-trialing')
    expect(e.state).toBe('trialing')
    expect(e.isReadOnly).toBe(false)
    expect(e.trialDaysRemaining).toBeGreaterThanOrEqual(4)
  })

  it('active: full access, no read-only reason', async () => {
    mockSubscriptionRow = baseSub({ status: 'active' })
    const e = await getEntitlement('shop-active')
    expect(e.state).toBe('active')
    expect(e.isReadOnly).toBe(false)
    expect(e.readOnlyReason).toBeNull()
  })

  it('past_due within the 7-day grace window: full access', async () => {
    mockSubscriptionRow = baseSub({
      status: 'past_due',
      current_period_end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    })
    const e = await getEntitlement('shop-pastdue-grace')
    expect(e.state).toBe('past_due')
    expect(e.isReadOnly).toBe(false)
  })

  it('past_due beyond the 7-day grace window: read-only', async () => {
    mockSubscriptionRow = baseSub({
      status: 'past_due',
      current_period_end: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    })
    const e = await getEntitlement('shop-pastdue-expired')
    expect(e.state).toBe('read_only')
    expect(e.isReadOnly).toBe(true)
    expect(e.readOnlyReason).toBe('past_due_expired')
  })

  it('incomplete/unpaid follow the same grace-window rule as past_due', async () => {
    mockSubscriptionRow = baseSub({
      status: 'incomplete',
      current_period_end: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    })
    const e = await getEntitlement('shop-incomplete-expired')
    expect(e.isReadOnly).toBe(true)
    expect(e.readOnlyReason).toBe('past_due_expired')
  })

  it('paused: read-only', async () => {
    mockSubscriptionRow = baseSub({ status: 'paused' })
    const e = await getEntitlement('shop-paused')
    expect(e.isReadOnly).toBe(true)
    expect(e.readOnlyReason).toBe('paused')
  })

  it('canceled: read-only', async () => {
    mockSubscriptionRow = baseSub({ status: 'canceled' })
    const e = await getEntitlement('shop-canceled')
    expect(e.isReadOnly).toBe(true)
    expect(e.readOnlyReason).toBe('canceled')
  })

  it('missing subscription row: safest default is read-only', async () => {
    mockSubscriptionRow = null
    const e = await getEntitlement('shop-missing')
    expect(e.isReadOnly).toBe(true)
  })
})
