import { type NextRequest, NextResponse } from 'next/server'
import { newSignupAlert } from '@/lib/email/templates'
import { rateLimit } from '@/lib/rate-limit'

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? 'barberboost.app@gmail.com'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`signup_notify:${ip}`, 5, 60)
  if (!rl.allowed) {
    return NextResponse.json({ ok: true }) // silently absorb — never block the signup UX
  }
  try {
    const { email, fullName, shopName } = await request.json()

    if (!email || !fullName || !shopName) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const signedUpAt = new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      dateStyle: 'full',
      timeStyle: 'short',
    })

    const tmpl = newSignupAlert({ ownerName: fullName, shopName, email, signedUpAt })

    const { Resend: ResendClient } = await import('resend')
    const resend = new ResendClient(process.env.RESEND_API_KEY)
    const FROM   = process.env.RESEND_FROM_EMAIL ?? 'BarberBoost <noreply@barberboost.app>'

    const { error } = await resend.emails.send({ from: FROM, to: NOTIFY_EMAIL, ...tmpl })
    if (error) console.error('[signup-notify] Resend error:', error.message)
  } catch (err) {
    console.error('[signup-notify] exception:', err)
  }

  // Always return 200 — never block the signup UX
  return NextResponse.json({ ok: true })
}
