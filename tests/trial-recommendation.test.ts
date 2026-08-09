import { describe, it, expect, vi } from 'vitest'

let mockStaffCount = 0
let mockBookingsCount = 0

function countBuilder(count: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = {}
  for (const m of ['select', 'eq', 'gte']) b[m] = () => b
  b.then = (resolve: (v: { count: number }) => void) => Promise.resolve({ count }).then(resolve)
  return b
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'staff') return countBuilder(mockStaffCount)
      if (table === 'bookings') return countBuilder(mockBookingsCount)
      throw new Error(`unexpected table ${table}`)
    },
  }),
}))

import { getTrialRecommendation } from '@/lib/trial-recommendation'

describe('getTrialRecommendation', () => {
  it('recommends Starter for light usage (fits within Starter limits)', async () => {
    mockStaffCount = 1
    mockBookingsCount = 20
    const r = await getTrialRecommendation('shop-1', null)
    expect(r.plan).toBe('starter')
    expect(r.staffCount).toBe(1)
    expect(r.bookingsCount).toBe(20)
    expect(r.reason).toContain('Starter')
  })

  it('recommends Pro when staff count exceeds Starter but fits Pro', async () => {
    mockStaffCount = 3
    mockBookingsCount = 50
    const r = await getTrialRecommendation('shop-1', null)
    expect(r.plan).toBe('pro')
  })

  it('recommends Pro when booking volume exceeds Starter', async () => {
    mockStaffCount = 1
    mockBookingsCount = 200
    const r = await getTrialRecommendation('shop-1', null)
    expect(r.plan).toBe('pro')
  })

  it('recommends Empire when staff count exceeds Pro capacity', async () => {
    mockStaffCount = 12
    mockBookingsCount = 500
    const r = await getTrialRecommendation('shop-1', null)
    expect(r.plan).toBe('empire')
  })
})
