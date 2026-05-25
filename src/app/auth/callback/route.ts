import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { welcomeEmail, newSignupAlert } from '@/lib/email/templates'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.app'
const SUPPORT = process.env.SUPPORT_EMAIL ?? 'support@barberboost.app'

const PAID_PLANS = ['starter', 'pro', 'empire']

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')   // 'recovery' for password reset
  const next = searchParams.get('next') ?? '/dashboard'

  // plan + billing params carried through the emailRedirectTo URL
  const planParam    = searchParams.get('plan')    ?? ''
  const billingParam = searchParams.get('billing') ?? ''
  const isAnnual     = billingParam === 'annual'
  const isPaidSignup = PAID_PLANS.includes(planParam)

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin))
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
    )
  }

  // Password reset — send to update-password page, preserving next destination
  if (type === 'recovery') {
    const updateUrl = new URL('/reset-password/update', origin)
    if (next && next !== '/dashboard') updateUrl.searchParams.set('next', next)
    return NextResponse.redirect(updateUrl)
  }

  // Platform admins use /admin-login (signInWithPassword) — they never pass
  // through this callback. But guard here too, just in case, so we never
  // create a ghost shop or send a welcome email to an admin account.
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const isAdminAccount = user ? adminEmails.includes((user.email ?? '').toLowerCase()) : false

  if (isAdminAccount) {
    return NextResponse.redirect(new URL('/admin', origin))
  }

  // ── Safeguard: ensure shop + subscription rows exist ───────────────────────
  // The on_auth_user_created DB trigger normally handles this at signup, but
  // this fallback catches cases where the trigger was absent or failed.
  if (user) {
    try {
      const { data: existingShop } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!existingShop) {
        const rawName = (user.user_metadata?.shop_name as string | undefined)?.trim() || 'My Barbershop'
        const slug = (
          rawName
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase()
            .replace(/^-+|-+$/, '') || 'shop'
        ) + '-' + user.id.slice(0, 8)

        const { data: newShop } = await supabase
          .from('shops')
          .insert({ owner_id: user.id, name: rawName, slug, email: user.email ?? null })
          .select('id')
          .single()

        if (newShop) {
          await supabase.from('subscriptions').insert({
            shop_id:  newShop.id,
            owner_id: user.id,
            plan:     'free',
            status:   'active',
          })
        }
      }
    } catch (safeguardErr) {
      console.error('[auth/callback] shop safeguard error:', safeguardErr)
    }
  }

  // ── First-ever confirmation: send emails ───────────────────────────────────
  const isFirstConfirmation = user && !user.user_metadata?.welcome_sent

  if (isFirstConfirmation) {
    try {
      const { data: shop } = await supabase
        .from('shops')
        .select('name, slug')
        .eq('owner_id', user.id)
        .single()

      const ownerName = (user.user_metadata?.full_name as string | undefined) ?? 'there'
      const shopName  = (shop as { name?: string } | null)?.name ?? 'your shop'
      const slug      = (shop as { slug?: string } | null)?.slug ?? ''

      const payload = welcomeEmail({
        ownerName,
        shopName,
        bookingPageUrl: `${APP_URL}/booking/${slug}`,
        dashboardUrl:   `${APP_URL}/dashboard`,
        supportEmail:   SUPPORT,
      })

      if (user.email) {
        try {
          const { Resend: ResendClient } = await import('resend')
          const resend = new ResendClient(process.env.RESEND_API_KEY)
          const FROM   = process.env.RESEND_FROM_EMAIL ?? 'BarberBoost <noreply@barberboost.app>'
          const NOTIFY = process.env.NOTIFY_EMAIL ?? 'barberboost.app@gmail.com'

          const signedUpAt = new Date().toLocaleString('en-GB', {
            timeZone: 'Europe/London', dateStyle: 'full', timeStyle: 'short',
          })

          // Welcome email → new user
          const { error: welcomeErr } = await resend.emails.send({
            from: FROM, to: user.email,
            subject: payload.subject, html: payload.html, text: payload.text,
          })
          if (welcomeErr) console.error('[auth/callback] welcome email error:', welcomeErr.message)

          // Internal alert → BarberBoost team
          const alertTmpl = newSignupAlert({ ownerName, shopName, email: user.email, signedUpAt })
          const { error: alertErr } = await resend.emails.send({ from: FROM, to: NOTIFY, ...alertTmpl })
          if (alertErr) console.error('[auth/callback] signup alert error:', alertErr.message)
        } catch (emailEx) {
          console.error('[auth/callback] email exception:', emailEx)
        }
      }

      // Mark so future logins don't resend welcome
      await supabase.auth.updateUser({ data: { welcome_sent: true } })
    } catch {
      // Non-fatal — never block the auth flow
    }

    // ── First confirmation + paid plan → go to Stripe Checkout ──────────────
    // Also check user metadata as a fallback (for auto-confirm flow where
    // emailRedirectTo query params were not available).
    const resolvedPlan = isPaidSignup
      ? planParam
      : (PAID_PLANS.includes(user.user_metadata?.intended_plan as string)
          ? (user.user_metadata?.intended_plan as string)
          : '')

    if (resolvedPlan) {
      const checkoutUrl = `/api/stripe/checkout?plan=${resolvedPlan}` + (isAnnual ? '&billing=annual' : '')
      return NextResponse.redirect(new URL(checkoutUrl, origin))
    }
  }

  // ── Default: redirect to intended destination ──────────────────────────────
  return NextResponse.redirect(new URL(next, origin))
}
