import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Routes inside the (dashboard) route group.
 * Any request whose pathname starts with one of these is protected.
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/bookings',
  '/clients',
  '/services',
  '/staff',
  '/analytics',
  '/marketing',
  '/inventory',
  '/settings',
  // /admin is intentionally excluded — the AdminLayout enforces its own
  // auth and redirects to /admin-login, keeping it fully separate from
  // the shop-owner auth flow.
]

/**
 * Auth routes — authenticated users are redirected away from these.
 */
const AUTH_ROUTES = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  try {
    // ── 1. Create a mutable response so Supabase can refresh session cookies ──
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Write updated cookies onto the request (for downstream middleware)
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            // Rebuild the response so it carries the refreshed cookies to the browser
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // ── 2. Refresh the session (IMPORTANT: use getUser, not getSession) ──
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // ── 3. Route guards ──────────────────────────────────────────────────────
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
    const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p))

    if (isProtected && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }

    if (isAuthRoute && user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (err) {
    // On any auth/network failure, fail open so the app stays accessible.
    // Protected routes will still enforce auth at the page/layout level.
    console.error('[middleware] error:', err)
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public assets (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
