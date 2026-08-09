import { describe, it, expect, vi } from 'vitest'

const TRIAL_END_UNIX = 1780000000 // arbitrary fixed unix timestamp used as the "existing" trial_end

// STRIPE_*_PRICE_ID env vars are unset in this test environment (no real
// Stripe credentials), so PLANS[plan].priceId would be falsy and
// handleTrialConversionSetup would bail out before ever touching Stripe.
// Stub fake-but-truthy price ids so the code under test actually runs.
vi.mock('@/lib/stripe/plans', () => ({
  PLANS: {
    free:    { id: 'free',    priceId: null,                  annualPriceId: null },
    starter: { id: 'starter', priceId: 'price_starter_test',  annualPriceId: null },
    pro:     { id: 'pro',     priceId: 'price_pro_test',      annualPriceId: null },
    empire:  { id: 'empire',  priceId: 'price_empire_test',   annualPriceId: null },
  },
  getPlanByPriceId: () => null,
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripeCalls: any = { updateParams: null, resumeCalled: false }

vi.mock('@/lib/stripe/config', () => ({
  getStripe: () => ({
    setupIntents: {
      retrieve: async () => ({ payment_method: 'pm_test_123' }),
    },
    customers: {
      update: async () => ({}),
    },
    subscriptions: {
      retrieve: async () => ({
        id: 'sub_test_123',
        trial_end: TRIAL_END_UNIX,
        items: { data: [{ id: 'si_test_123' }] },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: async (_id: string, params: any) => { stripeCalls.updateParams = params; return {} },
      resume: async () => { stripeCalls.resumeCalled = true; return {} },
    },
  }),
}))

function chainable(result: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = {}
  for (const m of ['select', 'eq']) b[m] = () => b
  b.maybeSingle = () => Promise.resolve(result)
  return b
}

const dbSub = { stripe_subscription_id: 'sub_test_123', stripe_customer_id: 'cus_test_123' }

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'subscriptions') return chainable({ data: dbSub, error: null })
      throw new Error(`unexpected table ${table}`)
    },
  }),
}))

import { handleTrialConversionSetup } from '@/app/api/stripe/webhook/route'
import { createAdminClient } from '@/lib/supabase/admin'

describe('handleTrialConversionSetup', () => {
  it('convert flow explicitly carries the existing trial_end forward — a day-8 conversion never ends the trial early', async () => {
    stripeCalls.updateParams = null
    stripeCalls.resumeCalled = false

    const supabase = createAdminClient()
    await handleTrialConversionSetup(
      { id: 'cs_test_1', setup_intent: 'seti_test_1', metadata: { userId: 'user-1', shopId: 'shop-1', planId: 'pro', flow: 'convert' } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase as any,
    )

    expect(stripeCalls.resumeCalled).toBe(false)
    expect(stripeCalls.updateParams).not.toBeNull()
    expect(stripeCalls.updateParams.trial_end).toBe(TRIAL_END_UNIX)
    expect(stripeCalls.updateParams.proration_behavior).toBe('none')
  })

  it('reactivate flow calls resume() first and does not carry a trial_end (the trial already ended)', async () => {
    stripeCalls.updateParams = null
    stripeCalls.resumeCalled = false

    const supabase = createAdminClient()
    await handleTrialConversionSetup(
      { id: 'cs_test_2', setup_intent: 'seti_test_2', metadata: { userId: 'user-1', shopId: 'shop-1', planId: 'starter', flow: 'reactivate' } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase as any,
    )

    expect(stripeCalls.resumeCalled).toBe(true)
    expect(stripeCalls.updateParams).not.toBeNull()
    expect(stripeCalls.updateParams.trial_end).toBeUndefined()
  })
})
