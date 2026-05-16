# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

---

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint (v9 flat config)
```

There is no test suite. Verify behavior by running the dev server and exercising the feature.

---

## Architecture Overview

**BarberBoost** is a SaaS platform for barbershop management. It is built on Next.js 16 (App Router), React 19, Supabase (auth + database), Stripe (subscriptions), Resend (email), and Anthropic Claude (AI copy).

### Route Groups

| Group | Purpose | Auth |
|---|---|---|
| `(marketing)` | Public marketing pages | None |
| `(auth)` | Login, signup, password reset | Unauthenticated only |
| `(dashboard)` | All business management features | Required |
| `/booking/[shopSlug]` | Public customer-facing booking page | None |
| `/api/*` | Backend API routes | Varies |

Middleware (`middleware.ts`) protects `/dashboard`, `/bookings`, `/clients`, `/services`, `/staff`, `/analytics`, `/marketing`, `/inventory`, `/settings` — redirecting unauthenticated users to `/login?next={pathname}`. It uses `getUser()` (not `getSession()`) per Supabase SSR best practice.

### Supabase Client Hierarchy

Three distinct clients — use the right one:

- **`src/lib/supabase/client.ts`** — Browser client (anon key). Use in Client Components.
- **`src/lib/supabase/server.ts`** — Server client (anon key + cookies). Use in Server Components and API routes. Exports `createClient()`, `getUser()`, `getShop()`, `getSubscription()` (all wrapped in React `cache()` for request deduplication).
- **`src/lib/supabase/admin.ts`** — Service role client (bypasses RLS). **Only for cron jobs and webhook handlers.** Never expose to the client.

API routes that read user-owned data use `createClient()` from `server.ts` and enforce ownership with `.eq('owner_id', user.id)`. Routes that need to write on behalf of a user (webhooks, public bookings) use `createServiceClient()` from `server.ts`.

### Subscription Plans & Gating

Plans are defined in **`src/lib/stripe/plans.ts`** (canonical source). Each plan has hard limits for bookings per month, clients, staff, services, campaigns, and feature flags. The `PLANS` object is keyed by plan ID: `free | starter | pro | empire`.

```
free:    30 bookings/mo, 50 clients, 1 staff, 5 services
starter: 150 bookings/mo, 300 clients, 2 staff, 20 services ($19)
pro:     unlimited, 8 staff, inventory, advanced analytics ($39)
empire:  unlimited everything, AI copy, multi-location, API ($79)
```

Plan gating in API routes: fetch subscription via `getSubscription()`, check `subscription.plan` against `PLANS[planId].limits`. The AI copy endpoint (`/api/ai-copy`) is Empire-only. Public booking creation checks `bookings_per_month` limit.

**`src/lib/constants.ts`** has a duplicate plan definition — prefer `plans.ts`.

### Stripe Integration

- **`src/lib/stripe/config.ts`** — `getStripe()` factory; API version `2025-02-24.acacia`.
- **`/api/stripe/checkout`** — Creates Checkout sessions. GET handles post-auth redirects with `?plan=`; POST returns `{ url }` for client navigation.
- **`/api/stripe/upgrade`** — Direct subscription upgrade (prorated, immediate charge).
- **`/api/stripe/portal`** — Stripe Customer Portal redirect.
- **`/api/stripe/webhook`** — Handles `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`. Updates `subscriptions` table and sends transactional emails.

### Email System (Resend)

All email templates are in **`src/lib/email/templates.ts`**. Templates return HTML strings using a dark-theme shell (`emailShell()`). Brand colors: gold `#c9a84c`, background `#0f0f0f`, surface `#1a1a1a`. Use `esc()` for any user-generated content inserted into HTML.

Email is sent from `process.env.RESEND_FROM_EMAIL`. Triggered from: webhook handler (subscription events), signup route, cron reminders, public booking confirmation.

### AI Copy (`/api/ai-copy`)

Empire-only, rate-limited to 5/min per IP. Calls `claude-haiku-4-5-20251001` to generate marketing copy as JSON: `{ subjects: string[], emailBody: string, smsMessage: string }`. Returns 502 if Claude returns malformed JSON, 503 if the AI service is unavailable.

### Public Booking Flow

`/booking/[shopSlug]` is a Server Component that fetches shop, services, staff, and subscription in parallel. It passes data to `<PublicBookingFlow>` (Client Component). Bookings are created via `POST /api/public/bookings` — no auth required, rate-limited to 10/min per IP, enforces plan booking limits.

### Key Utilities

| File | Exports |
|---|---|
| `src/lib/utils.ts` | `cn()`, `formatCurrency()`, `formatDate()`, `formatTime()`, `slugify()`, `getInitials()` |
| `src/lib/rate-limit.ts` | `rateLimit(identifier, limit, windowSecs)` — **in-memory only, resets on server restart** |
| `src/lib/analytics.ts` | `fetchAnalyticsData(shopId, range, plan)` — server-side aggregation for the analytics dashboard |
| `src/lib/env.ts` | Zod-validated typed `env` object — import this instead of `process.env` in server code |
| `src/lib/whatsapp.ts` | `sendWhatsApp(to, body)` via Twilio; `normalisePhone()` handles UK mobile formatting |

### Database Types

All table shapes and enums are in **`src/types/database.ts`**. Key types: `Shop`, `Subscription`, `Staff`, `Service`, `Client`, `Booking`, `SubscriptionPlan`, `SubscriptionStatus`, `BookingStatus`. `DayHours` shape: `{ open: "HH:MM", close: "HH:MM", closed: boolean }`.

### API Route Conventions

- GET params via `request.nextUrl.searchParams`
- POST body via `await request.json()`
- Auth check: `const { user } = await getUser()` → 401 if null
- Ownership check: `.eq('owner_id', user.id)` on DB queries
- Error responses: `NextResponse.json({ error: "message" }, { status: N })`
- HTTP status conventions: 400 bad input, 401 no auth, 403 plan/ownership, 404 not found, 429 rate limited (with `Retry-After` header), 500 unexpected, 502 bad upstream data, 503 upstream unavailable
- All errors logged with `console.error` before returning

### Environment Variables

`src/lib/env.ts` validates all required vars at startup via Zod. Required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, all Stripe price IDs (3 tiers × monthly + annual = 6 IDs), `RESEND_API_KEY`, `RESEND_FROM_EMAIL`. Optional: `ANTHROPIC_API_KEY`, `TWILIO_*`, `NEXT_PUBLIC_APP_URL`. See `.env.example` for full list.
