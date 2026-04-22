import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { welcomeEmail } from '@/lib/email/templates'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.com'
const SUPPORT = process.env.SUPPORT_EMAIL ?? 'support@barberboost.com'

/**
 * Supabase Auth callback handler.
 * Used by:
 *  - Email confirmation links (new signups)
 *  - Google OAuth (and any other provider)
 *  - Password reset links (type=recovery)
 *
 * Supabase redirects here with a `?code=` PKCE code.
 * This route exchanges the code for a session, sends a welcome email on
 * first confirmation, then redirects onward.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery' for password reset
  const next = searchParams.get('next') ?? '/dashboard'

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

  // Password reset flow → send to update-password page
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/reset-password/update', origin))
  }

  // Send welcome email on first-ever confirmation (not on every re-login)
  if (user && !user.user_metadata?.welcome_sent) {
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
        const { Resend: ResendClient } = await import('resend')
        const resend = new ResendClient(process.env.RESEND_API_KEY)
        const FROM   = process.env.RESEND_FROM_EMAIL!
        resend.emails.send({ from: FROM, to: user.email, subject: payload.subject, html: payload.html })
          .catch(() => {})
      }

      // Mark so future logins don't resend
      await supabase.auth.updateUser({ data: { welcome_sent: true } })
    } catch {
      // Non-fatal — never block the auth flow
    }
  }

  return NextResponse.redirect(new URL(next, origin))
}
