import { describe, it, expect, vi } from 'vitest'

interface FakeDb {
  prefs: Record<string, { lifecycle_opted_out_at: string | null }>
  sends: Array<{ shop_id: string; email_key: string; sent_at: string | null }>
}

const db: FakeDb = { prefs: {}, sends: [] }

function resetDb() {
  db.prefs = {}
  db.sends = []
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'email_preferences') {
        return {
          select: () => ({
            eq: (_col: string, shopId: string) => ({
              maybeSingle: () => Promise.resolve({ data: db.prefs[shopId] ?? null, error: null }),
            }),
          }),
        }
      }
      if (table === 'email_sends') {
        return {
          select: () => ({
            eq: (_col: string, shopId: string) => ({
              not: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: () => {
                      const rows = db.sends.filter(s => s.shop_id === shopId && s.sent_at)
                        .sort((a, b) => (b.sent_at! > a.sent_at! ? 1 : -1))
                      return Promise.resolve({ data: rows[0] ?? null, error: null })
                    },
                  }),
                }),
              }),
            }),
          }),
          insert: (row: { shop_id: string; email_key: string }) => {
            const exists = db.sends.some(s => s.shop_id === row.shop_id && s.email_key === row.email_key)
            if (exists) return Promise.resolve({ error: { code: '23505', message: 'duplicate' } })
            db.sends.push({ ...row, sent_at: null })
            return Promise.resolve({ error: null })
          },
          update: (fields: { sent_at?: string; resend_message_id?: string | null }) => ({
            eq: (_c1: string, shopId: string) => ({
              eq: (_c2: string, key: string) => {
                const row = db.sends.find(s => s.shop_id === shopId && s.email_key === key)
                if (row && fields.sent_at) row.sent_at = fields.sent_at
                return Promise.resolve({ error: null })
              },
            }),
          }),
          delete: () => ({
            eq: (_c1: string, shopId: string) => ({
              eq: (_c2: string, key: string) => {
                db.sends = db.sends.filter(s => !(s.shop_id === shopId && s.email_key === key))
                return Promise.resolve({ error: null })
              },
            }),
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    },
  }),
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: async () => ({ data: { id: 'msg_fake' }, error: null }) }
  },
}))

import { checkSuppression, claimEmailSend, markEmailSent, attemptNurtureSend } from '@/lib/nurture'

describe('checkSuppression', () => {
  it('suppresses when converted', async () => {
    resetDb()
    const r = await checkSuppression('shop-1', true)
    expect(r.suppressed).toBe(true)
    expect(r.reason).toBe('converted')
  })

  it('suppresses when lifecycle_opted_out_at is set', async () => {
    resetDb()
    db.prefs['shop-1'] = { lifecycle_opted_out_at: new Date().toISOString() }
    const r = await checkSuppression('shop-1', false)
    expect(r.suppressed).toBe(true)
    expect(r.reason).toBe('opted_out')
  })

  it('suppresses when the last lifecycle email was sent under 48h ago', async () => {
    resetDb()
    db.sends.push({ shop_id: 'shop-1', email_key: 'welcome', sent_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() })
    const r = await checkSuppression('shop-1', false)
    expect(r.suppressed).toBe(true)
    expect(r.reason).toBe('too_recent')
  })

  it('does not suppress when the last send was over 48h ago', async () => {
    resetDb()
    db.sends.push({ shop_id: 'shop-1', email_key: 'welcome', sent_at: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString() })
    const r = await checkSuppression('shop-1', false)
    expect(r.suppressed).toBe(false)
  })

  it('does not suppress a clean shop with no history', async () => {
    resetDb()
    const r = await checkSuppression('shop-1', false)
    expect(r.suppressed).toBe(false)
  })
})

describe('email_sends idempotency', () => {
  it('claimEmailSend blocks a second claim for the same (shop, key) pair', async () => {
    resetDb()
    const first  = await claimEmailSend('shop-1', 'welcome')
    const second = await claimEmailSend('shop-1', 'welcome')
    expect(first).toBe(true)
    expect(second).toBe(false)
  })

  it('a double cron run only ever sends one email for the same key', async () => {
    resetDb()
    let sendCount = 0
    const build = () => { sendCount++; return { subject: 's', html: 'h' } }

    // Simulate two overlapping cron invocations racing to send the same key.
    // Two independent guards can catch the repeat: the 48h suppression check
    // (since the first call's sent_at is now in the last 48h) or, in a truly
    // concurrent race where suppression is checked before the first send
    // completes, the email_sends insert conflict itself (covered directly by
    // the 'claimEmailSend blocks a second claim' test above). Either way, the
    // guarantee that matters is: the second attempt never actually sends.
    const first  = await attemptNurtureSend('shop-1', 'owner@example.com', 'welcome', build)
    const second = await attemptNurtureSend('shop-1', 'owner@example.com', 'welcome', build)

    expect(first.sent).toBe(true)
    expect(second.sent).toBe(false)
    expect(['already_sent', 'too_recent']).toContain(second.reason)
    expect(sendCount).toBe(1) // build() — and therefore the actual Resend send — only ran once
  })

  it('markEmailSent records sent_at so a later suppression check sees it', async () => {
    resetDb()
    await claimEmailSend('shop-1', 'welcome')
    await markEmailSent('shop-1', 'welcome', 'msg_123')
    const row = db.sends.find(s => s.shop_id === 'shop-1' && s.email_key === 'welcome')
    expect(row?.sent_at).not.toBeNull()
  })
})
