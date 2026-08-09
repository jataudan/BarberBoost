import { describe, it, expect, vi, beforeAll } from 'vitest'
import fixture from './fixtures/stripe/subscription-updated-trialing-to-paused.json'

const WEBHOOK_SECRET = 'whsec_test_fixture_secret'

// Real Stripe SDK, fake-but-well-formed keys — constructEvent/generateTestHeaderString
// are pure local HMAC operations and never touch the network, so this proves
// real signature verification without needing live Stripe credentials.
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET
process.env.STRIPE_SECRET_KEY    ||= 'sk_test_fixture_dummy_key'

// STRIPE_*_PRICE_ID are unset in this environment; stub a price id matching
// the fixture so getPlanByPriceId() resolves it to 'pro'.
vi.mock('@/lib/stripe/plans', () => ({
  PLANS: {
    free:    { id: 'free',    priceId: null,                 annualPriceId: null },
    starter: { id: 'starter', priceId: 'price_starter_test', annualPriceId: null },
    pro:     { id: 'pro',     priceId: 'price_pro_test',     annualPriceId: null },
    empire:  { id: 'empire',  priceId: 'price_empire_test',  annualPriceId: null },
  },
  getPlanByPriceId: (priceId: string) => {
    if (priceId === 'price_pro_test') return 'pro'
    return null
  },
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: async () => ({ data: { id: 'msg_fixture' }, error: null }) }
  },
}))

let signature = ''
vi.mock('next/headers', () => ({
  headers: async () => new Map([['stripe-signature', signature]]),
}))

// The real handler doesn't await after()'s callback (by design — it's meant
// to run post-response), so the test captures the promise itself and awaits
// it explicitly before asserting on the deferred processing's side effects.
let afterPromise: Promise<void> | null = null
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: (fn: () => Promise<void>) => { afterPromise = fn() },
  }
})

interface FakeDb {
  stripeEvents: Set<string>
  subscriptions: Record<string, Record<string, unknown>>   // keyed by stripe_subscription_id
  emailSends: Array<{ shop_id: string; email_key: string; sent_at: string | null }>
}
const db: FakeDb = { stripeEvents: new Set(), subscriptions: {}, emailSends: [] }

function resetDb() {
  db.stripeEvents = new Set()
  db.subscriptions = {
    sub_fixture_paused_1: { id: 'row-1', shop_id: 'shop-1', stripe_subscription_id: 'sub_fixture_paused_1', status: 'trialing' },
  }
  db.emailSends = []
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b: any = {}
      const chain = ['select', 'eq', 'order', 'limit', 'not']
      for (const m of chain) b[m] = () => b

      if (table === 'stripe_events') {
        b.insert = (row: { id: string }) => {
          if (db.stripeEvents.has(row.id)) return Promise.resolve({ error: { code: '23505', message: 'duplicate' } })
          db.stripeEvents.add(row.id)
          return Promise.resolve({ error: null })
        }
        return b
      }

      if (table === 'subscriptions') {
        b.update = (fields: Record<string, unknown>) => ({
          eq: (col: string, val: string) => {
            const row = col === 'stripe_subscription_id' ? db.subscriptions[val] : undefined
            if (row) Object.assign(row, fields)
            return Promise.resolve({ error: null })
          },
        })
        b.maybeSingle = () => {
          const row = Object.values(db.subscriptions)[0] ?? null
          return Promise.resolve({ data: row, error: null })
        }
        return b
      }

      if (table === 'shops') {
        b.maybeSingle = () => Promise.resolve({ data: { id: 'shop-1', name: 'Fixture Shop', owner_id: 'user-1' }, error: null })
        return b
      }

      if (table === 'email_preferences') {
        b.maybeSingle = () => Promise.resolve({ data: null, error: null }) // never opted out
        return b
      }

      if (table === 'email_sends') {
        b.insert = (row: { shop_id: string; email_key: string }) => {
          const exists = db.emailSends.some(s => s.shop_id === row.shop_id && s.email_key === row.email_key)
          if (exists) return Promise.resolve({ error: { code: '23505', message: 'duplicate' } })
          db.emailSends.push({ ...row, sent_at: null })
          return Promise.resolve({ error: null })
        }
        b.update = (fields: { sent_at?: string }) => ({
          eq: () => ({
            eq: (_c: string, key: string) => {
              const row = db.emailSends.find(s => s.email_key === key)
              if (row && fields.sent_at) row.sent_at = fields.sent_at
              return Promise.resolve({ error: null })
            },
          }),
        })
        b.maybeSingle = () => Promise.resolve({ data: null, error: null })
        return b
      }

      throw new Error(`unexpected table ${table} in webhook replay fixture test`)
    },
    auth: {
      admin: {
        getUserById: async () => ({ data: { user: { email: 'owner@example.com', user_metadata: { full_name: 'Fixture Owner' } } } }),
      },
    },
  }),
}))

let POST: typeof import('@/app/api/stripe/webhook/route').POST

beforeAll(async () => {
  const { getStripe } = await import('@/lib/stripe/config')
  const rawBody = JSON.stringify(fixture)
  signature = getStripe().webhooks.generateTestHeaderString({ payload: rawBody, secret: WEBHOOK_SECRET })
  ;({ POST } = await import('@/app/api/stripe/webhook/route'))
})

function fixtureRequest(): Request {
  return new Request('http://localhost/api/stripe/webhook', { method: 'POST', body: JSON.stringify(fixture) })
}

describe('webhook replay using a captured fixture', () => {
  it('processes a fresh event: real signature verifies, status/paused_at sync, trial_ended email queues', async () => {
    resetDb()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(fixtureRequest() as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)
    expect(json.duplicate).toBeUndefined()

    await afterPromise

    const row = db.subscriptions.sub_fixture_paused_1
    expect(row.status).toBe('paused')
    expect(row.paused_at).toBeTruthy()

    const sent = db.emailSends.find(s => s.email_key === 'trial_ended')
    expect(sent?.sent_at).toBeTruthy()
  })

  it('replaying the identical fixture (same event id) is a safe no-op — no reprocessing, no second email', async () => {
    // Deliberately do NOT reset db.stripeEvents here — this simulates Stripe
    // redelivering a webhook it already sent once (network retry, etc.).
    const emailCountBefore = db.emailSends.length

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(fixtureRequest() as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.duplicate).toBe(true)

    // No new after() callback should have been scheduled for a duplicate.
    expect(db.emailSends.length).toBe(emailCountBefore)
  })
})
