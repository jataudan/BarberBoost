# BarberBoost — UAT Test Report
**Report version:** 2.0  
**Test date:** 13 May 2026  
**Environment:** Production — https://barberboost.app  
**Branch:** `development` @ commit `66b4219`  
**Prepared by:** Dan Jatau / Development Team  
**Classification:** Pre-launch UAT

---

## Revision History

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 10 May 2026 | Dan Jatau | Initial UAT — 100 TCs, 34 automated, commit `fa5e12b` |
| 2.0 | 13 May 2026 | Dan Jatau | Billing system overhaul — 10 new TCs added (8 automated, 2 manual); 4 security issues resolved; Stripe live mode confirmed |

---

## Executive Summary

A full UAT assessment was conducted across all 18 functional modules of BarberBoost. The test suite now comprises **110 test cases**: 42 fully automated (HTTP, TypeScript, code-review) and 68 requiring manual browser interaction. All 42 automated tests passed.

Since v1.0, the billing and subscription subsystem received a significant overhaul addressing four defects identified during live testing. All four defects are now resolved and verified by automated code-review checks added to this report.

| Category | Total | Automated PASS | Pending Manual | Blocked |
|----------|-------|---------------|----------------|---------|
| Marketing Pages | 7 | 4 | 3 | 0 |
| Security Headers | 5 | 5 | 0 | 0 |
| Auth & Route Guards | 13 | 8 | 5 | 0 |
| Onboarding | 2 | 0 | 2 | 0 |
| Shop Settings | 4 | 0 | 4 | 0 |
| Services | 4 | 0 | 4 | 0 |
| Staff | 4 | 0 | 4 | 0 |
| Bookings (Dashboard) | 7 | 0 | 7 | 0 |
| Public Booking Page | 7 | 2 | 5 | 0 |
| Clients | 9 | 0 | 9 | 0 |
| Analytics | 6 | 0 | 6 | 0 |
| Inventory | 5 | 0 | 5 | 0 |
| Marketing Campaigns | 7 | 1 | 6 | 0 |
| Billing & Stripe | 14 | 7 | 7 | 0 |
| Reminders & Notifications | 4 | 0 | 4 | 0 |
| Signup Notification | 2 | 2 | 0 | 0 |
| Responsive Design | 4 | 0 | 4 | 0 |
| Edge Cases | 6 | 3 | 3 | 0 |
| **TOTAL** | **110** | **42** | **68** | **0** |

**Overall status: 🟡 CONDITIONAL PASS — All automated tests green; manual test execution pending.**

---

## Automated Test Results

All 42 automated tests executed against the live production deployment on 13 May 2026.

### HTTP Endpoint Checks

| TC | Test | Method | URL | Expected | Result |
|----|------|--------|-----|----------|--------|
| TC-001 | Homepage | GET | `/` | 200 | ✅ 200 |
| TC-002 | Features page | GET | `/features` | 200 | ✅ 200 |
| TC-003 | Pricing page | GET | `/pricing` | 200 | ✅ 200 |
| TC-013a | Dashboard guard | GET | `/dashboard` | 307 | ✅ 307 |
| TC-013b | Bookings guard | GET | `/bookings` | 307 | ✅ 307 |
| TC-013c | Clients guard | GET | `/clients` | 307 | ✅ 307 |
| TC-013d | Analytics guard | GET | `/analytics` | 307 | ✅ 307 |
| TC-013e | Settings guard | GET | `/settings` | 307 | ✅ 307 |
| TC-014a | Bookings API auth | GET | `/api/bookings` | 401 | ✅ 401 |
| TC-014b | Clients API auth | GET | `/api/clients` | 401 | ✅ 401 |
| TC-014c | Campaigns API auth | GET | `/api/campaigns` | 401 | ✅ 401 |
| TC-014d | Inventory API auth | GET | `/api/inventory` | 401 | ✅ 401 |
| TC-014e | Staff API auth | GET | `/api/staff` | 401 | ✅ 401 |
| TC-014f ★ | Stripe checkout auth | POST | `/api/stripe/checkout` | 401 | ✅ 401 |
| TC-014g ★ | Stripe upgrade auth | POST | `/api/stripe/upgrade` | 401 | ✅ 401 |
| TC-014h ★ | Stripe portal auth | POST | `/api/stripe/portal` | 401 | ✅ 401 |
| TC-015 | Deleted relay endpoint | POST | `/api/send-email` | 404 | ✅ 404 |
| TC-016 | Cron bad token | GET | `/api/cron/reminders` | 401 | ✅ 401 |
| TC-005 | Contact validation | POST | `/api/contact` (empty) | 400 | ✅ 400 |
| TC-006 | Contact XSS input | POST | `/api/contact` (XSS payload) | 200 | ✅ 200 |
| TC-090 | Signup-notify rate limit | POST | `/api/signup-notify` ×7 | 200×7 (silent) | ✅ All 200 |
| TC-097 | Availability 404 | GET | `/api/public/availability?shop_id=nonexistent` | 404 | ✅ 404 |

★ New in v2.0

### Security Header Checks (`curl -I https://barberboost.app/`)

| TC | Header | Expected Value | Result |
|----|--------|---------------|--------|
| TC-008 | Content-Security-Policy | `object-src 'none'; form-action 'self'` | ✅ Present |
| TC-009 | Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` | ✅ Present |
| TC-010 | X-Frame-Options | `SAMEORIGIN` | ✅ Present |
| TC-011 | X-Content-Type-Options | `nosniff` | ✅ Present |
| TC-012 | Permissions-Policy | `camera=(), microphone=(), geolocation=()` | ✅ Present |

### Code-Review Verified Checks

| TC | Area | Finding | Result |
|----|------|---------|--------|
| TC-004 | Social links | `getbarberboost` appears 9× in homepage HTML | ✅ PASS |
| TC-049 | Public booking rate limit | `rateLimit('public_booking:${ip}', 10, 60)` present in route | ✅ PASS |
| TC-075 | AI copy rate limit | `rateLimit('ai_copy:${ip}', 5, 60)` present in route | ✅ PASS |
| TC-079 | Stripe priceId whitelist | `VALID_PRICE_IDS.has(priceId)` check — annual IDs also included | ✅ PASS |
| TC-079b ★ | Billing page — JS fetch upgrade | All plan upgrade buttons use `handleCheckout()`/`handleUpgrade()` JS fetch; no silent HTML form fallback | ✅ PASS |
| TC-079c ★ | Checkout route — JSON response | `POST /api/stripe/checkout` returns `{ url }` JSON for `application/json` callers; legacy form callers receive redirect | ✅ PASS |
| TC-079d ★ | Upgrade proration — immediate charge | `/api/stripe/upgrade` uses `proration_behavior: 'always_invoice'` — prorated difference charged immediately, not deferred | ✅ PASS |
| TC-079e ★ | Portal route — JSON response | `POST /api/stripe/portal` returns `NextResponse.json({ url })` — client-side `fetch()` can extract URL without opaque redirect | ✅ PASS |
| TC-079f ★ | Subscription query safety | All `subscriptions` table queries use `.order('updated_at', {ascending: false}).limit(1)` — PGRST116 error impossible even with historical duplicate rows | ✅ PASS |
| TC-080 | Webhook subscription upsert | `checkout.session.completed` handler upserts to `subscriptions`; uses ordered `.limit(1)` duplicate detection | ✅ PASS |
| TC-081 | Webhook payment fail email | `await sendPaymentFailedEmail()` — awaited, not fire-and-forget | ✅ PASS |
| TC-082 | Webhook receipt email | `await sendPaymentReceiptEmail()` — awaited, not fire-and-forget | ✅ PASS |
| TC-096 | Error boundaries | `error.tsx` exists at app, dashboard, auth, and marketing route group levels | ✅ PASS |
| TC-100 | TypeScript integrity | `npx tsc --noEmit` exit code 0, zero errors | ✅ PASS |

★ New in v2.0

### Build & Deploy Verification

| Check | Result | Detail |
|-------|--------|--------|
| Production build | ✅ PASS | Compiled in 15.5s, Turbopack |
| TypeScript check | ✅ PASS | 0 errors across all source files |
| Static pages generated | ✅ PASS | 52/52 pages generated successfully |
| Route manifest complete | ✅ PASS | All 22 API routes present; `/api/send-email` absent |
| Vercel deployment | ✅ PASS | `66b4219` deployed to `https://barberboost.app` (dpl_FrD8r4tzkim3H81LF1bS76vJDZ9J) |

---

## Security Remediation Summary

### Original Issues (v1.0 — all verified resolved)

| Severity | Issue | Resolution | Verified |
|----------|-------|-----------|---------|
| 🔴 Critical | `/api/send-email` — unauthenticated open email relay | Route deleted | ✅ Returns 404 |
| 🔴 Critical | `/api/signup-notify` — no auth or rate limiting | IP rate limit; excess silently absorbed | ✅ 7×200 confirmed |
| 🔴 Critical | Webhook billing emails not awaited — silent drop risk | `await` added to both send functions | ✅ Code reviewed |
| 🟠 High | Campaigns PATCH — mass-assignment | Explicit field whitelist applied | ✅ Code reviewed |
| 🟡 Medium | Contact form — unescaped user input in HTML email | All four fields escaped via `esc()` | ✅ Code reviewed |
| 🟡 Medium | Stripe checkout — arbitrary `priceId` accepted | `VALID_PRICE_IDS` whitelist enforced | ✅ Returns 400 |
| 🟡 Medium | `CONTACT_EMAIL`/`NOTIFY_EMAIL` missing from `.env.example` | Both vars documented | ✅ File committed |
| ⚪ Low | No Content-Security-Policy header | CSP added to `vercel.json` | ✅ Header confirmed |

### New Issues Resolved Since v1.0 (billing overhaul — 13 May 2026)

| Severity | Issue | Resolution | Verified |
|----------|-------|-----------|---------|
| 🟠 High | Subscription queries used `.single()` — PGRST116 errors caused all users with historical duplicate rows to appear on Free plan | All queries changed to `.order('updated_at', {ascending: false}).limit(1)` | ✅ TC-079f |
| 🟠 High | Free-plan upgrade buttons used plain HTML `<form>` POST — Stripe session errors displayed as raw JSON in the browser | Converted to JS fetch with `handleCheckout()` and inline error display | ✅ TC-079b/c |
| 🟡 Medium | Paid→paid upgrades redirected to Stripe Customer Portal which only offered Cancel — no plan-switching | Replaced with direct `/api/stripe/upgrade` route using `stripe.subscriptions.update()` | ✅ TC-079d |
| 🟡 Medium | Proration used `create_prorations` — upgrade cost deferred to next invoice; users could use higher plan features without immediate charge | Changed to `always_invoice` — prorated difference charged immediately | ✅ TC-079d |
| ⚪ Low | `/api/stripe/portal` used `NextResponse.redirect()` — client `fetch()` received opaque redirect, URL extraction failed silently | Changed to `NextResponse.json({ url })` | ✅ TC-079e |

---

## Manual Test Checklist

The following 68 test cases require tester sign-off. Testers should update the **Result** and **Notes** columns.

### Instructions for testers
- Use Chrome/Safari (latest) on desktop and iPhone/Android for mobile tests
- **Billing tests (TC-078 through TC-084):** This environment uses live Stripe keys. Use a real payment card or request a test Stripe account. Stripe CLI events can be forwarded to a local development instance for TC-081/082.
- Record any failures with screenshot URL and steps to reproduce
- Mark each row: ✅ Pass | ❌ Fail | ⚠️ Partial | — Skipped

---

### Marketing & Contact

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-003 | Pricing page — all four plans with correct prices | Free/£19/£39/£79; Starter "Most Popular" badge | | | |
| TC-004 | Social icons desktop — 3 icons in header, correct URL in new tab | FB/IG/TT → correct domains | | | |
| TC-004b | Social icons mobile — appear in hamburger menu below CTA | 3 bordered tiles visible | | | |
| TC-007 | Contact form submission — email received | Success state; email delivered | | | |

### Authentication

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-017 | New user signup | Redirect to dashboard; onboarding shown | | | |
| TC-017b | Duplicate email signup | Error message; no duplicate account | | | |
| TC-017c | Weak password (< 8 chars) | Client-side validation before submit | | | |
| TC-018 | Login with valid credentials | Redirect to dashboard | | | |
| TC-019 | Login with wrong password | Error message; no lockout on first attempt | | | |
| TC-020 | Password reset — link received; password updated | Can login with new password | | | |
| TC-021 | Logged-in user visiting /login | Redirect to dashboard | | | |
| TC-022 | Logout | Session cleared; /dashboard → /login | | | |

### Onboarding

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-023 | Onboarding checklist on fresh account | 5 steps visible | | | |
| TC-024 | Checklist hides when all steps complete | Section disappears | | | |

### Shop Settings

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-025 | Update shop name/description | Persists after refresh; toast shown | | | |
| TC-026 | Slug with uppercase/spaces rejected | Validation error | | | |
| TC-027 | Opening hours saved; closed days affect public page | Correct slots on each day | | | |
| TC-028 | Logo upload (< 2 MB) | Logo visible and persisted | | | |
| TC-028b | Logo upload (> 2 MB) | Error shown; upload rejected | | | |

### Services

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-029 | Create service | Appears in list and public booking page | | | |
| TC-030 | Free plan — 6th service rejected | 403 limit error | | | |
| TC-031 | Edit service price | Updated price shown | | | |
| TC-032 | Deactivate service | Disappears from public page; badge in dashboard | | | |

### Staff

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-033 | Add staff | Card visible; appears in booking dropdown | | | |
| TC-034 | Free plan — 2nd staff rejected | 403 limit error | | | |
| TC-035 | Staff working hours saved | No slots on closed days | | | |
| TC-036 | Commission calculator | Revenue × rate = commission shown | | | |

### Bookings (Dashboard)

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-037 | Create booking — confirmation email received | Email in client inbox | | | |
| TC-038 | Double-booking same staff rejected | 409 conflict | | | |
| TC-039 | Mark booking Completed | Status badge updates; counts in analytics | | | |
| TC-040 | Cancel booking — cancellation email sent | Email in client inbox | | | |
| TC-041 | Free plan — 31st booking rejected | 403 limit error | | | |
| TC-042 | Search by client name | List filters correctly | | | |
| TC-043 | Search by BB- reference | Single result returned | | | |

### Public Booking Page

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-044 | Public page loads for valid slug | Shop name, services, staff visible; no login required | | | |
| TC-045 | Correct slots shown per working hours | Booked slots absent | | | |
| TC-046 | Closed days show no slots | "No available slots" message | | | |
| TC-047 | Submit booking — confirmation email | 201 created; email received | | | |
| TC-048 | Past date rejected in UI | Date picker prevents; API returns 400 if bypassed | | | |
| TC-050 | 61+ day ahead date — no slots | Slots empty | | | |

### Clients

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-051 | Add client manually | Appears in list | | | |
| TC-052 | Client search | Real-time filter | | | |
| TC-053 | Client booking history | Matches actual bookings | | | |
| TC-054 | VIP tag on high-spend client | Gold VIP badge visible | | | |
| TC-055 | Import CSV (valid) | Clients imported; duplicates skipped | | | |
| TC-056 | Import CSV (no name column) | Error message | | | |
| TC-057 | Import CSV (> 500 rows) | Error: max 500 | | | |
| TC-058 | Export CSV | File downloaded with correct headers | | | |
| TC-059 | Free plan — 51st client rejected | Plan limit error | | | |

### Analytics

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-060 | KPI cards load | 4 cards with % change | | | |
| TC-061 | Date range selector updates data | Charts update correctly | | | |
| TC-062 | Free plan — Starter features locked | Blurred with upgrade CTA | | | |
| TC-063 | Starter plan — Pro features locked | Locked | | | |
| TC-064 | Pro plan — Empire features locked | Locked | | | |
| TC-065 | Pro+ analytics export | CSV downloaded | | | |

### Inventory

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-066 | Free/Starter — inventory locked | Blur + upgrade CTA | | | |
| TC-067 | Add inventory item (Pro+) | Appears in list with correct values | | | |
| TC-068 | Stock adjustment +5 | Quantity updates | | | |
| TC-069 | Low-stock alert email | Email received; item highlighted Critical | | | |
| TC-070 | Search/filter inventory | Filters correctly | | | |

### Marketing Campaigns

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-071 | Free plan — campaigns locked | Upgrade prompt shown | | | |
| TC-072 | Create campaign draft (Starter+) | Appears in list as Draft | | | |
| TC-073 | Starter monthly limit enforced | 403 on 3rd campaign | | | |
| TC-074 | AI copy generation (Empire) | 3 subjects + body + SMS | | | |
| TC-076 | Edit campaign — whitelist enforced | shop_id unchanged | | | |
| TC-077 | Delete campaign | Removed from list | | | |

### Billing & Stripe

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-078 | Free plan — upgrade to Starter via Stripe Checkout | All three upgrade buttons active; clicking opens Stripe Checkout; redirect to `/dashboard?upgraded=true`; plan badge shows Starter | | | |
| TC-078b ★ | Paid plan — in-place upgrade Starter → Pro | Billing page shows "Upgrade to Pro" button (not portal link); clicking charges prorated difference immediately; plan badge updates without leaving site | | | |
| TC-078c ★ | Billing page — upgrade error shows inline | Simulate API failure (e.g. network off); clicking Upgrade shows inline error message below plan cards; no raw JSON exposed | | | |
| TC-080 | Subscription row in DB after checkout | Supabase `subscriptions` row present with correct plan, `status=active`, period dates | | | |
| TC-081 | Payment failure email (Stripe CLI) | Email received at subscriber address | | | |
| TC-082 | Payment receipt email (Stripe CLI — renewal) | Email received; not sent for initial `subscription_create` | | | |
| TC-083 | Manage Billing portal | Stripe Customer Portal opens; can update card, view invoices, cancel | | | |
| TC-084 | Cancel subscription via portal — webhook updates DB | `subscriptions.status` → `cancelled`; plan reverts to Free at period end | | | |

★ New in v2.0

### Reminders

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-085 | 24h reminder email (cron trigger) | Email received; `reminder_sent=true` in DB | | | |
| TC-086 | 24h reminder WhatsApp | WhatsApp message received (requires Twilio) | | | |
| TC-087 | Free plan — no reminders | Skipped counter incremented | | | |
| TC-088 | In-app notification bell | Badge count; mark-all read clears badge | | | |

### Signup Notification

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-089 | Admin email on new signup | Email received at NOTIFY_EMAIL | | | |

### Responsive Design

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-091 | Mobile hamburger menu opens | Nav + CTAs + social icons visible | | | |
| TC-092 | Social icons in mobile menu | 3 icon tiles below CTA button | | | |
| TC-093 | Dashboard at 375px | Bottom nav; stat cards stack; no overflow | | | |
| TC-094 | Public booking page mobile | Full booking flow usable | | | |

### Edge Cases

| TC | Test Case | Expected | Result | Tester | Notes |
|----|-----------|----------|--------|--------|-------|
| TC-095 | 404 page | Custom not-found UI with link home | | | |
| TC-096 | Error boundary | Graceful error UI; not blank page | | | |
| TC-098 | Cross-shop data access | 403 Forbidden | | | |
| TC-099 | Loading skeletons on slow connection | Skeletons shown; no blank flash | | | |

---

## Known Limitations & Post-UAT Backlog

The following items do not block UAT. Items marked Pre-GA should be resolved before General Availability.

| ID | Area | Description | Priority | Status |
|----|------|-------------|----------|--------|
| POST-01 | Rate limiting | In-memory rate limiter is per-Vercel-instance; concurrent requests across instances bypass it. Replace with Redis (e.g. Upstash). | High (pre-GA) | Open |
| POST-02 | Campaigns PATCH | `sent_count` and `open_rate` are in the field whitelist. When campaign automation is built, these should be set only by trusted server functions. | Medium (pre-GA) | Open |
| POST-03 | CSP | Current CSP uses `'unsafe-inline'` and `'unsafe-eval'` (required by Next.js without nonces). Implement nonce-based CSP in middleware. | Medium (post-GA) | Open |
| POST-04 | Shop slug uniqueness | Uniqueness enforced at DB level; no user-friendly error if slug is taken by another shop. Add explicit check in `/api/shops` PATCH. | Low (post-GA) | Open |
| POST-05 | Stripe env validation | If `STRIPE_*_PRICE_ID` env vars are unset, `VALID_PRICE_IDS` is empty and all checkout attempts return 400. Add startup validation. | Low (pre-GA) | Open |

---

## Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Lead Developer | Dan Jatau | | 13 May 2026 |
| QA Lead | | | |
| UAT Tester 1 | | | |
| UAT Tester 2 | | | |

**UAT outcome:**  
☐ PASS — all manual tests signed off; proceed to production  
☐ CONDITIONAL PASS — minor issues logged; proceed with known backlog  
☐ FAIL — blocking issues found; re-test required after fixes  

---

## Appendix A — Test Environment

| Item | Detail |
|------|--------|
| Production URL | https://barberboost.app |
| Git branch | `development` |
| Commit SHA | `66b4219` (full: `66b4219588968c1189d4e9a1e0fbcece1a812b22`) |
| Deployment ID | `dpl_FrD8r4tzkim3H81LF1bS76vJDZ9J` |
| Next.js version | 16.2.2 (Turbopack) |
| Node runtime | Vercel iad1 (Washington DC) |
| Supabase region | As configured in `.env.local` |
| Stripe mode | **Live** — real payment methods required for billing tests |
| Report date | 13 May 2026 |

---

## Appendix B — Automated Test Commands

```bash
# TypeScript integrity check
npx tsc --noEmit

# Security headers
curl -I https://barberboost.app/

# Route guards (expect 307)
for path in /dashboard /bookings /clients /analytics /settings; do
  curl -o /dev/null -w "$path → %{http_code}\n" https://barberboost.app$path
done

# API auth guards (expect 401)
for ep in /api/bookings /api/clients /api/campaigns /api/inventory /api/staff; do
  curl -o /dev/null -w "$ep → %{http_code}\n" https://barberboost.app$ep
done

# Stripe API auth guards (expect 401) — new in v2.0
curl -o /dev/null -w "/api/stripe/checkout → %{http_code}\n" \
  -X POST https://barberboost.app/api/stripe/checkout \
  -H "Content-Type: application/json" -d '{"planId":"starter"}'

curl -o /dev/null -w "/api/stripe/upgrade → %{http_code}\n" \
  -X POST https://barberboost.app/api/stripe/upgrade \
  -H "Content-Type: application/json" -d '{"planId":"pro"}'

curl -o /dev/null -w "/api/stripe/portal → %{http_code}\n" \
  -X POST https://barberboost.app/api/stripe/portal

# Deleted endpoint (expect 404)
curl -o /dev/null -w "%{http_code}" -X POST https://barberboost.app/api/send-email

# Cron bad token (expect 401)
curl https://barberboost.app/api/cron/reminders -H "Authorization: Bearer wrong"

# Contact form validation (expect 400)
curl -X POST https://barberboost.app/api/contact \
  -H "Content-Type: application/json" -d '{}'

# Rate limit silent absorption (expect 200 ×7)
for i in {1..7}; do
  curl -o /dev/null -w "%{http_code}\n" -X POST https://barberboost.app/api/signup-notify \
    -H "Content-Type: application/json" \
    -d '{"email":"a@b.com","fullName":"Test","shopName":"Shop"}'
done

# Shop not found (expect 404)
curl "https://barberboost.app/api/public/availability?shop_id=nonexistent&service_id=x&date=2026-05-13"
```

## Appendix C — Stripe CLI Test Commands

```bash
# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# TC-081: payment failure email
stripe trigger invoice.payment_failed

# TC-082: renewal receipt email
stripe trigger invoice.payment_succeeded

# TC-084: subscription cancelled
stripe trigger customer.subscription.deleted

# TC-078: checkout completed (subscription created)
stripe trigger checkout.session.completed
```
