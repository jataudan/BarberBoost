import { describe, it, expect, vi } from 'vitest'

const insertedEventIds = new Set<string>()

const canned = {
  id: 'evt_test_1',
  type: 'customer.subscription.created',
  data: {
    object: {
      id: 'sub_x', status: 'trialing', schedule: null,
      items: { data: [{ price: { id: 'price_x' } }] },
      current_period_start: 0, current_period_end: 0, cancel_at_period_end: false,
    },
  },
}

vi.mock('next/headers', () => ({
  headers: async () => new Map([['stripe-signature', 'sig_test']]),
}))

// after() would normally defer work past the response — for this test we only
// care about the dedupe guard + response shape, so make it a no-op.
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return { ...actual, after: () => {} }
})

vi.mock('@/lib/stripe/config', () => ({
  getStripe: () => ({
    webhooks: { constructEvent: () => canned },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== 'stripe_events') throw new Error(`unexpected table ${table} in dedupe test`)
      return {
        insert: (row: { id: string }) => {
          if (insertedEventIds.has(row.id)) {
            return Promise.resolve({ error: { code: '23505', message: 'duplicate key' } })
          }
          insertedEventIds.add(row.id)
          return Promise.resolve({ error: null })
        },
      }
    },
  }),
}))

import { POST } from '@/app/api/stripe/webhook/route'

function req() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Request('http://localhost/api/stripe/webhook', { method: 'POST', body: 'raw-body' }) as any
}

describe('stripe webhook idempotency', () => {
  it('a new event is accepted (received:true, no duplicate flag)', async () => {
    const res = await POST(req())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)
    expect(json.duplicate).toBeUndefined()
  })

  it('the same event id replayed by Stripe is short-circuited as a duplicate', async () => {
    const res = await POST(req())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)
    expect(json.duplicate).toBe(true)
  })
})
