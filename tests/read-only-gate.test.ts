import { describe, it, expect, vi } from 'vitest'
import { POST as createDashboardBooking } from '@/app/api/bookings/route'
import { POST as createPublicBooking } from '@/app/api/public/bookings/route'
import { POST as createStaff } from '@/app/api/staff/route'
import { POST as createService } from '@/app/api/services/route'
import { POST as createClientRow } from '@/app/api/clients/route'
import { POST as createCampaign } from '@/app/api/campaigns/route'
import { POST as createInventoryItem } from '@/app/api/inventory/route'
import { POST as createStyle } from '@/app/api/styles/route'
import { PATCH as patchShop } from '@/app/api/shops/route'
import { POST as generateAiCopy } from '@/app/api/ai-copy/route'

const mockUser = { id: 'user-1', email: 'owner@example.com' }
const mockShop = { id: 'shop-1', owner_id: 'user-1', name: 'Test Shop', address: null, phone: null, currency: 'GBP' }
// Empire + active so ai-copy's own plan gate (checked before the entitlement
// gate) passes and the test actually exercises requireWriteAccess.
const mockSubscription = { plan: 'empire', status: 'active' }

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

function tableRouter(table: string) {
  if (table === 'shops')         return chainable({ data: mockShop, error: null })
  if (table === 'subscriptions') return chainable({ data: mockSubscription, error: null })
  return chainable({ data: null, error: null })
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: mockUser } }) },
    from: tableRouter,
  }),
  createServiceClient: async () => ({
    from: tableRouter,
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

  // Representative sweep across the rest of the owner-authenticated mutating
  // routes gated in Phase 2 — the point of Phase 6 is proving the gate holds
  // everywhere it was applied, not just the two booking routes above.
  const cases: Array<[string, () => Promise<Response>]> = [
    ['POST /api/staff', () => createStaff(jsonReq('http://localhost/api/staff', { shop_id: 'shop-1', name: 'Barber' }))],
    ['POST /api/services', () => createService(jsonReq('http://localhost/api/services', { shop_id: 'shop-1', name: 'Haircut' }))],
    ['POST /api/clients', () => createClientRow(jsonReq('http://localhost/api/clients', { shop_id: 'shop-1', name: 'Client' }))],
    ['POST /api/campaigns', () => createCampaign(jsonReq('http://localhost/api/campaigns', { shop_id: 'shop-1', name: 'Campaign' }))],
    ['POST /api/inventory', () => createInventoryItem(jsonReq('http://localhost/api/inventory', { shop_id: 'shop-1', name: 'Pomade' }))],
    ['POST /api/styles', () => createStyle(jsonReq('http://localhost/api/styles', { shop_id: 'shop-1', title: 'Fade', image_url: 'https://example.test/x.png' }))],
    ['PATCH /api/shops', () => patchShop(jsonReq('http://localhost/api/shops', {}, 'PATCH'))],
    ['POST /api/ai-copy', () => generateAiCopy(jsonReq('http://localhost/api/ai-copy', {}))],
  ]

  for (const [label, run] of cases) {
    it(`${label} returns 403 READ_ONLY for a paused shop`, async () => {
      const res = await run()
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.code).toBe('READ_ONLY')
    })
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonReq(url: string, body: unknown, method: string = 'POST'): any {
  return new Request(url, { method, body: JSON.stringify(body) })
}
