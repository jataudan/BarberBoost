import { describe, it, expect, vi } from 'vitest'
import { POST as createDashboardBooking } from '@/app/api/bookings/route'
import { POST as createPublicBooking } from '@/app/api/public/bookings/route'

const mockUser = { id: 'user-1', email: 'owner@example.com' }
const mockShop = { id: 'shop-1', owner_id: 'user-1', name: 'Test Shop', address: null, phone: null, currency: 'GBP' }

function chainable(result: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {}
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'not', 'contains', 'ilike', 'or', 'order', 'range', 'limit']) {
    builder[m] = () => builder
  }
  builder.single      = () => Promise.resolve(result)
  builder.maybeSingle = () => Promise.resolve(result)
  return builder
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: mockUser } }) },
    from: (table: string) => (table === 'shops' ? chainable({ data: mockShop, error: null }) : chainable({ data: null, error: null })),
  }),
  createServiceClient: async () => ({
    from: () => chainable({ data: null, error: null }),
  }),
}))

// Only requireWriteAccess is overridden — readOnlyResponseBody stays real so
// the test also proves the actual response shape, not just the status code.
vi.mock('@/lib/entitlement', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/entitlement')>()
  return {
    ...actual,
    requireWriteAccess: vi.fn(async () => ({
      ok: false,
      entitlement: {
        state: 'read_only', isReadOnly: true, readOnlyReason: 'paused',
        plan: 'pro', status: 'paused', trialDaysRemaining: null, subscription: null,
      },
    })),
  }
})

describe('read-only gate on mutating booking routes', () => {
  it('POST /api/bookings (dashboard) returns 403 READ_ONLY for a paused shop', async () => {
    const req = new Request('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        shop_id: 'shop-1', staff_id: 'staff-1', service_id: 'service-1',
        date: '2999-01-01', start_time: '09:00', end_time: '09:30',
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any

    const res = await createDashboardBooking(req)
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.code).toBe('READ_ONLY')
  })

  it('POST /api/public/bookings (customer-facing) returns 403 READ_ONLY for a paused shop', async () => {
    const req = new Request('http://localhost/api/public/bookings', {
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.1' },
      body: JSON.stringify({
        shop_id: 'shop-1', service_id: 'service-1', staff_id: 'staff-1',
        date: '2999-01-01', start_time: '09:00', end_time: '09:30',
        client_name: 'Test Customer', client_email: 'customer@example.com',
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any

    const res = await createPublicBooking(req)
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.code).toBe('READ_ONLY')
  })
})
