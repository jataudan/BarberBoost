import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { confirmationEmail, newSignupAlert } from '@/lib/email/templates'

const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.app'
const FROM        = process.env.RESEND_FROM_EMAIL   ?? 'BarberBoost <noreply@barberboost.app>'
const NOTIFY      = process.env.NOTIFY_EMAIL        ?? 'barberboost.app@gmail.com'
const PAID_PLANS  = ['starter', 'pro', 'empire']

/**
 * POST /api/auth/signup
 *
 * Server-side signup handler. Uses the Supabase Admin API to create the user
 * and generate a confirmation link, then sends that link via Resend — bypassing
 * Supabase's built-in email service which is rate-limited and unreliable in
 * production.
 *
 * Body: { email, password, shopName, fullName, plan?, billing? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, shopName, fullName, plan, billing } = body

    if (!email || !password || !shopName || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const isPaid   = typeof plan === 'string' && PAID_PLANS.includes(plan)
    const isAnnual = billing === 'annual'

    const redirectTo =
      `${APP_URL}/auth/callback?next=/dashboard` +
      (isPaid   ? `&plan=${encodeURIComponent(plan)}` : '') +
      (isAnnual ? `&billing=annual`                   : '')

    // Admin client — doesn't use cookies, bypasses RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Generate confirmation link without Supabase sending an email
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type:     'signup',
      email,
      password,
      options: {
        data: {
          shop_name:     shopName,
          full_name:     fullName,
          intended_plan: isPaid ? plan : 'free',
        },
        redirectTo,
      },
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already exists')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const confirmationLink = data.properties.action_link

    const { Resend: ResendClient } = await import('resend')
    const resend = new ResendClient(process.env.RESEND_API_KEY)

    // Send branded confirmation email to the new user
    const tmpl = confirmationEmail({
      fullName,
      email,
      plan:             isPaid ? plan : null,
      confirmationLink,
    })
    const { error: emailErr } = await resend.emails.send({
      from:    FROM,
      to:      email,
      subject: tmpl.subject,
      html:    tmpl.html,
      text:    tmpl.text,
    })
    if (emailErr) console.error('[api/auth/signup] confirmation email error:', emailErr)

    // Internal signup alert (non-blocking)
    const signedUpAt = new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/London', dateStyle: 'full', timeStyle: 'short',
    })
    const alertTmpl = newSignupAlert({ ownerName: fullName, shopName, email, signedUpAt })
    resend.emails.send({ from: FROM, to: NOTIFY, ...alertTmpl }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/auth/signup]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
