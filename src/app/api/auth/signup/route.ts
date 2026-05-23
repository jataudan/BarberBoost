import { type NextRequest, NextResponse } from 'next/server'
import { welcomeEmail, newSignupAlert } from '@/lib/email/templates'
import { rateLimit } from '@/lib/rate-limit'

const FROM   = process.env.RESEND_FROM_EMAIL ?? 'BarberBoost <noreply@barberboost.app>'
const NOTIFY = process.env.NOTIFY_EMAIL      ?? 'barberboost.app@gmail.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.app'

/**
 * POST /api/auth/signup
 *
 * Sends the welcome email to the new user and an internal signup alert to
 * the BarberBoost team. The user is already created by the client calling
 * supabase.auth.signUp() — this endpoint only handles email dispatch.
 *
 * Body: { email, fullName, shopName, plan?, shopSlug? }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`auth_signup:${ip}`, 10, 60)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
    )
  }

  try {
    const body = await request.json()
    const { email, fullName, shopName, plan, shopSlug } = body

    if (!email || !fullName || !shopName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { Resend: ResendClient } = await import('resend')
    const resend = new ResendClient(process.env.RESEND_API_KEY)

    const slug        = shopSlug ?? ''
    const signedUpAt  = new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/London', dateStyle: 'full', timeStyle: 'short',
    })

    // Welcome email → new user
    const welcomeTmpl = welcomeEmail({
      ownerName:      fullName,
      shopName,
      bookingPageUrl: `${APP_URL}/booking/${slug}`,
      dashboardUrl:   `${APP_URL}/dashboard`,
      supportEmail:   process.env.SUPPORT_EMAIL ?? 'support@barberboost.app',
    })
    resend.emails.send({
      from: FROM, to: email,
      subject: welcomeTmpl.subject, html: welcomeTmpl.html, text: welcomeTmpl.text,
    }).catch((err: unknown) => console.error('[api/auth/signup] welcome email error:', err))

    // Internal alert → BarberBoost team
    const alertTmpl = newSignupAlert({ ownerName: fullName, shopName, email, signedUpAt })
    resend.emails.send({ from: FROM, to: NOTIFY, ...alertTmpl })
      .catch((err: unknown) => console.error('[api/auth/signup] alert email error:', err))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/auth/signup]', err)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}
