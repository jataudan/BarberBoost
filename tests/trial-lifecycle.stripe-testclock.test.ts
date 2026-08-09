/**
 * Stripe Test Clock integration test — a 30-day trial cannot be verified any
 * other way (advancing wall-clock time isn't an option, and mocking Stripe's
 * own trial/pause state machine would only prove our assumptions about it
 * are internally consistent, not that they're correct).
 *
 * This talks to the REAL Stripe API in test mode: creates a test clock, a
 * customer and a trialing subscription under it, then advances the clock
 * through day 27 → 30 → 34 and asserts against Stripe's actual resulting
 * subscription state and event log at each step.
 *
 * Requires real Stripe TEST-mode credentials (STRIPE_SECRET_KEY starting
 * with sk_test_, plus STRIPE_PRO_PRICE_ID pointing at a real test-mode
 * price) — neither is available in this sandboxed session, so the suite
 * skips itself rather than failing or faking a result. Wire real test
 * credentials into CI/local env to actually run it:
 *
 *   STRIPE_SECRET_KEY=sk_test_... STRIPE_PRO_PRICE_ID=price_... npm test
 *
 * What this test does NOT cover: delivery of the resulting webhooks to our
 * own endpoint (that needs a live tunnel — see tests/webhook-replay-fixtures.test.ts
 * for the piece that proves our handler correctly processes a real event
 * once received). This test proves the events genuinely fire on Stripe's
 * side with the shape/timing we assume, via the Events API.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Stripe from 'stripe'

const hasRealTestCreds =
  !!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') &&
  !!process.env.STRIPE_PRO_PRICE_ID

const DAY = 24 * 60 * 60

async function waitUntilReady(stripe: Stripe, clockId: string, timeoutMs = 60_000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const clock = await stripe.testHelpers.testClocks.retrieve(clockId)
    if (clock.status === 'ready') return
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error(`test clock ${clockId} did not become ready within ${timeoutMs}ms`)
}

describe.skipIf(!hasRealTestCreds)('Stripe Test Clock: trial lifecycle day 27 → 30 → 34', () => {
  let stripe: Stripe
  let clockId: string
  let subscriptionId: string
  let startUnix: number

  beforeAll(async () => {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia', typescript: true })
    startUnix = Math.floor(Date.now() / 1000)

    const clock = await stripe.testHelpers.testClocks.create({ frozen_time: startUnix, name: 'phase6-trial-lifecycle-test' })
    clockId = clock.id

    const customer = await stripe.customers.create({ email: `test-clock-${clockId}@example.invalid`, test_clock: clockId })

    const sub = await stripe.subscriptions.create({
      customer:          customer.id,
      items:             [{ price: process.env.STRIPE_PRO_PRICE_ID! }],
      trial_period_days: 30,
      trial_settings:    { end_behavior: { missing_payment_method: 'pause' } },
    })
    subscriptionId = sub.id

    expect(sub.status).toBe('trialing')
  }, 60_000)

  afterAll(async () => {
    // Deleting the test clock cascades and cleans up every object created
    // under it (customer, subscription, invoices) — no per-object cleanup needed.
    if (clockId) await stripe.testHelpers.testClocks.del(clockId).catch(() => {})
  })

  it('day 27: still trialing, and Stripe has genuinely fired trial_will_end', async () => {
    await stripe.testHelpers.testClocks.advance(clockId, { frozen_time: startUnix + 27 * DAY })
    await waitUntilReady(stripe, clockId)

    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    expect(sub.status).toBe('trialing')
    expect(sub.trial_end).toBe(startUnix + 30 * DAY)

    const events = await stripe.events.list({ type: 'customer.subscription.trial_will_end', limit: 20 })
    const fired = events.data.some(e => (e.data.object as Stripe.Subscription).id === subscriptionId)
    expect(fired).toBe(true)
  }, 90_000)

  it('day 30: trial ends with no payment method → subscription pauses, not cancels', async () => {
    await stripe.testHelpers.testClocks.advance(clockId, { frozen_time: startUnix + 30 * DAY + 3600 })
    await waitUntilReady(stripe, clockId)

    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    expect(sub.status).toBe('paused')

    const events = await stripe.events.list({ type: 'customer.subscription.updated', limit: 20 })
    const pausedEvent = events.data.find(e => {
      const obj = e.data.object as Stripe.Subscription
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prev = (e.data as any).previous_attributes
      return obj.id === subscriptionId && obj.status === 'paused' && prev?.status === 'trialing'
    })
    expect(pausedEvent).toBeTruthy()
  }, 90_000)

  it('day 34: remains paused — Stripe never auto-cancels a paused subscription on its own', async () => {
    await stripe.testHelpers.testClocks.advance(clockId, { frozen_time: startUnix + 34 * DAY })
    await waitUntilReady(stripe, clockId)

    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    expect(sub.status).toBe('paused')
    // This is exactly the state our win-back nurture emails (day 34/45) and
    // the past-due-sweep cron are designed around — confirms the assumption
    // those features are built on actually holds against real Stripe behaviour.
  }, 90_000)
})
