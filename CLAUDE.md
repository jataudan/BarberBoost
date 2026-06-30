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
| `(admin)` | Platform operator back-office (`/admin/*`) | Admin email only |
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

`plans.ts` is the single source for plan limits. (A former `src/lib/constants.ts` held a stale duplicate `PLAN_LIMITS` and was deleted — do not recreate it.)

### Stripe Integration

- **`src/lib/stripe/config.ts`** — `getStripe()` factory; API version `2025-02-24.acacia`.
- **`/api/stripe/checkout`** — Creates Checkout sessions. GET handles post-auth redirects with `?plan=`; POST returns `{ url }` for client navigation.
- **`/api/stripe/upgrade`** — Direct subscription upgrade (prorated, immediate charge).
- **`/api/stripe/portal`** — Stripe Customer Portal redirect.
- **`/api/stripe/webhook`** — Handles `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`. Updates `subscriptions` table and sends transactional emails.

### Admin Console (`(admin)` route group)

A platform-operator back-office, separate from the customer dashboard.

- **Access gate** — `isAdmin()` in `src/lib/admin.ts` checks the current user's email against the `ADMIN_EMAILS` env var (comma-separated, lowercased). Defense in depth: the `(admin)/layout.tsx` (`force-dynamic`) redirects non-admins to `/admin-login` (a dedicated login page, separate from `/login`), and **every** `/api/admin/*` route re-checks `isAdmin()` → 403. There is no RBAC — all admins are equal.
- **Pages** — `/admin` (metrics: total shops, MRR, weekly signups, past-due, suspended/disabled, plan distribution), `/admin/shops` (+ `/admin/shops/[id]` detail), `/admin/signups`, `/admin/reviews` (approve/revoke platform testimonials).
- **Shop actions** (`PATCH /api/admin/shops/[id]`) — set `admin_status` (`active`/`suspended`/`disabled`) and **plan override** (force any plan to `active`, bypassing Stripe — for support/testing; no guardrails).
- **Suspension enforcement** — `shops.admin_status` is checked in `(dashboard)/layout.tsx` on every request: `disabled` → `/account-disabled`, `suspended` → `/account-suspended`.
- **Gaps to be aware of** — no audit logging of admin actions, no 2FA, no rate limiting on admin routes.

### Email System (Resend)

All email templates are in **`src/lib/email/templates.ts`**. Templates return HTML strings using a dark-theme shell (`emailShell()`). Brand colors: gold `#c9a84c`, background `#0f0f0f`, surface `#1a1a1a`. Use `esc()` for any user-generated content inserted into HTML.

Email is sent from `process.env.RESEND_FROM_EMAIL`. Triggered from: webhook handler (subscription events), signup route, cron reminders, public booking confirmation.

### AI Copy (`/api/ai-copy`)

Empire-only, rate-limited to 5/min per IP. Calls `claude-haiku-4-5-20251001` to generate marketing copy as JSON: `{ subjects: string[], emailBody: string, smsMessage: string }`. Returns 502 if Claude returns malformed JSON, 503 if the AI service is unavailable.

### Public Booking Flow

`/booking/[shopSlug]` is a Server Component that fetches shop, services, staff, and subscription in parallel. It passes data to `<PublicBookingFlow>` (Client Component) — a 5- or 6-step wizard (the extra step is haircut-style selection, shown only when the shop has active `haircut_styles`). Availability is computed live by `GET /api/public/availability`: per-staff working hours (`staffHours[day] ?? shopHours[day]`) minus `blocked_dates`, walked in 15-min slots, with a slot marked available if any staff is free.

Bookings are created via `POST /api/public/bookings` — no auth required, rate-limited to 10/min per IP, enforces the plan booking limit, and rejects clashes (409). New bookings are inserted with `status: 'pending'` and `source: 'online'`.

**Barber-controlled confirmation flow:** public bookings arrive as `pending` and surface a pulsing amber **NEW badge** in the dashboard list and `BookingDetailModal`. The barber confirms via `PATCH /api/bookings { status: 'confirmed' }`. Lifecycle: `pending → confirmed → completed`, with `cancelled`/`no_show` available anytime. Notifications: on creation the customer gets a `bookingReceived` email and the barber gets a `barberBookingAlert` email **plus WhatsApp** (when `staff.phone` is set); on confirm/cancel the customer gets `bookingConfirmation`/`bookingCancellation`. The barber's contact details are read with the **service-role client** so alerts fire regardless of RLS context. All sends are non-blocking (try/catch).

### Key Utilities

| File | Exports |
|---|---|
| `src/lib/utils.ts` | `cn()`, `formatCurrency()`, `formatDate()`, `formatTime()`, `slugify()`, `getInitials()` |
| `src/lib/rate-limit.ts` | `rateLimit(identifier, limit, windowSecs)` — **in-memory only, resets on server restart** |
| `src/lib/analytics.ts` | `fetchAnalyticsData(shopId, range, plan)` — server-side aggregation for the analytics dashboard |
| `src/lib/env.ts` | Zod-validated typed `env` object — import this instead of `process.env` in server code |
| `src/lib/whatsapp.ts` | `sendWhatsApp(to, body)` via Twilio; `normalisePhone()` handles UK mobile formatting |

### Data Model

All table shapes and enums are in **`src/types/database.ts`**; the SQL DDL, RLS policies, and triggers are in **`src/lib/supabase/schema.sql`**.

**Tenancy** — `shops` and `subscriptions` carry `owner_id → auth.users`. Every child table is owned transitively via `shop_id`, with RLS of the form `shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())`. Public read-only policies expose shop-by-slug, active services/staff, and public reviews to the booking page, plus public INSERT for bookings/clients. **Always scope queries by ownership** — `.eq('owner_id', user.id)` on shops/subscriptions, or `shop_id` resolved from the owner's shop.

**Entity map** (all `1:N` from `Shop` unless noted):

```
auth.users
  └─ Shop (owner_id)            slug, opening_hours (JSONB), admin_status, pwa_* (Pro/Empire)
      ├─ 1:1 Subscription       stripe_*, plan, status, current_period_*, cancel_at_period_end
      ├─ Staff                  working_hours (JSONB), blocked_dates[], colour, commission_rate
      ├─ Service                duration_minutes, price, category, is_active
      ├─ Client                 tags[], marketing_consent, total_visits/total_spent (auto), preferred_barber_id → Staff
      ├─ Booking                date + start/end_time, status, denormalized client_*, selected_style_ids[], style_confidence, source, payment fields
      ├─ Review                 rating 1–5, is_public, optional booking_id/client_id
      ├─ HaircutStyle           image_url, barber_ids[] (empty = all), display_order
      ├─ Inventory (Pro+)       sku, quantity, low_stock_threshold
      ├─ Campaign (Pro+)        target_segment, sent_count, open_rate
      └─ Notification           auto-created on booking insert

PlatformReview (owner_id, separate from Shop)   shop_name, plan, rating, is_approved
```

**Enums:** `SubscriptionPlan` (`free|starter|pro|empire`), `SubscriptionStatus` (`active|canceled|past_due|trialing|inactive`), `BookingStatus` (`pending|confirmed|completed|cancelled|no_show`), `PaymentMethod` (`card|cash|bank_transfer`), `AdminStatus` (`active|suspended|disabled`).

**Key triggers** (`schema.sql`): `handle_new_user()` provisions a shop (slug = name + 8 chars of uid) + free subscription on signup; `update_client_stats` bumps `total_visits`/`total_spent` when a booking flips to `completed` (reverses on cancel); `notify_new_booking` writes a `notifications` row on booking insert; `set_updated_at()` on shops/subscriptions/clients/bookings.

**Notes:** Bookings denormalize `client_name/email/phone` (walk-ins + survival when `client_id`/`staff_id`/`service_id` are `SET NULL`). Scheduling is two-level: shop `opening_hours` overridden per-barber by `working_hours`, minus `blocked_dates`. `DayHours` shape: `{ open: "HH:MM", close: "HH:MM", closed: boolean }`. `haircut_styles` and the `pwa_*` columns are the newest (v2) additions.

### API Route Conventions

- GET params via `request.nextUrl.searchParams`
- POST body via `await request.json()`
- Auth check: `const { user } = await getUser()` → 401 if null
- Ownership check: `.eq('owner_id', user.id)` on DB queries
- Error responses: `NextResponse.json({ error: "message" }, { status: N })`
- HTTP status conventions: 400 bad input, 401 no auth, 403 plan/ownership, 404 not found, 429 rate limited (with `Retry-After` header), 500 unexpected, 502 bad upstream data, 503 upstream unavailable
- All errors logged with `console.error` before returning

### Environment Variables

`src/lib/env.ts` validates all required vars at startup via Zod. Required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, all Stripe price IDs (3 tiers × monthly + annual = 6 IDs), `RESEND_API_KEY`, `RESEND_FROM_EMAIL`. Optional: `ANTHROPIC_API_KEY`, `TWILIO_*`, `NEXT_PUBLIC_APP_URL`. `ADMIN_EMAILS` (comma-separated allowlist for the admin console) is read directly via `src/lib/admin.ts`, not validated in `env.ts`. See `.env.example` for full list.
