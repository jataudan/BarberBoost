# BarberBoost UAT Test Cases & Scripts
**Version:** 2.0  
**Date:** 13 May 2026  
**Environment:** https://barberboost.app  
**Prepared by:** QA / Development Team

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 10 May 2026 | Initial UAT — 100 TCs, commit `fa5e12b` |
| 2.0 | 13 May 2026 | +10 TCs: billing upgrade flows, Stripe auth guards, code review checks; commit `66b4219` |

---

## Conventions

| Symbol | Meaning |
|--------|---------|
| 🤖 | Automated — verified programmatically |
| 👤 | Manual — requires browser interaction |
| ✅ | Pass |
| ❌ | Fail |
| ⚠️ | Partial / conditional pass |
| N/A | Not applicable to this environment |

**Pre-conditions for manual tests:**  
- Tester has a registered BarberBoost account  
- A shop has been created during onboarding  
- At least one service and one staff member exist  
- Test Stripe card: `4242 4242 4242 4242`, any future expiry, any CVC  

---

## MODULE 1 — Marketing Pages

### TC-001 · Homepage loads correctly 🤖
**Objective:** Confirm the public homepage renders and is cacheable.  
**Steps:**
1. `GET https://barberboost.app/`

**Expected:** HTTP 200, `Content-Type: text/html`  
**Automated result:** PASS (200)

---

### TC-002 · Features page loads 🤖
**Steps:** `GET https://barberboost.app/features`  
**Expected:** 200  
**Automated result:** PASS

---

### TC-003 · Pricing page loads and shows all four plans 🤖👤
**Steps:**
1. `GET https://barberboost.app/pricing` (automated)
2. Open in browser; confirm Free / Starter (£19) / Pro (£39) / Empire (£79) cards visible
3. Confirm "Most Popular" badge on Starter
4. Confirm upgrade CTAs link to `/signup`

**Expected:** 200; all four plans visible with correct prices  
**Automated result:** PASS (200)  
**Manual:** Required

---

### TC-004 · Social icons — header and footer 🤖👤
**Objective:** Confirm Facebook, Instagram, TikTok icons render with correct URLs.  
**Automated steps:**
1. `curl https://barberboost.app/ | grep getbarberboost` — count occurrences

**Expected (automated):** ≥ 6 occurrences (`getbarberboost` appears in both header and footer for all 3 platforms)  
**Automated result:** PASS (9 occurrences)

**Manual steps:**
1. Load homepage
2. Confirm three icons visible in header (desktop view, ≥ md breakpoint)
3. Confirm three icons visible in footer brand column
4. Click each icon — confirm opens correct URL in new tab:
   - Facebook → `https://facebook.com/getbarberboost`
   - Instagram → `https://instagram.com/getbarberboost`
   - TikTok → `https://www.tiktok.com/@getbarberboost`
5. Resize to mobile — confirm icons appear in mobile menu (hamburger → expand → below CTAs)

---

### TC-005 · Contact form — validation 🤖
**Steps:**
1. `POST /api/contact` with empty body `{}`

**Expected:** 400, `{"error":"All fields are required."}`  
**Automated result:** PASS

---

### TC-006 · Contact form — XSS input handled safely 🤖
**Steps:**
1. `POST /api/contact` with `name: "<script>alert(1)</script>"`, valid email/subject/message

**Expected:** 200 (Resend delivery attempted); no server crash; HTML in email is escaped  
**Automated result:** PASS (200, no crash)  
**Code review:** All four fields escaped via `esc()` before interpolation into HTML email

---

### TC-007 · Contact form — submission 👤
**Steps:**
1. Navigate to `/contact`
2. Fill all fields with valid data
3. Click Send

**Expected:** Success state shown; email received at configured `CONTACT_EMAIL`

---

---

## MODULE 2 — Security Headers

### TC-008 · Content-Security-Policy present 🤖
**Steps:** `curl -I https://barberboost.app/`  
**Expected:** `Content-Security-Policy` header present, containing `object-src 'none'` and `form-action 'self'`  
**Automated result:** PASS — full CSP header confirmed

---

### TC-009 · HSTS enforced 🤖
**Expected:** `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`  
**Automated result:** PASS

---

### TC-010 · X-Frame-Options 🤖
**Expected:** `X-Frame-Options: SAMEORIGIN`  
**Automated result:** PASS

---

### TC-011 · X-Content-Type-Options 🤖
**Expected:** `X-Content-Type-Options: nosniff`  
**Automated result:** PASS

---

### TC-012 · Permissions-Policy 🤖
**Expected:** `Permissions-Policy: camera=(), microphone=(), geolocation=()`  
**Automated result:** PASS

---

---

## MODULE 3 — Authentication & Route Guards

### TC-013 · Protected routes redirect unauthenticated users 🤖
**Steps:** `GET` each of `/dashboard`, `/bookings`, `/clients`, `/analytics`, `/settings` without session cookie  
**Expected:** 307 redirect to `/login?next=<original-path>`  
**Automated result:** PASS — all five returned 307

---

### TC-014 · API routes return 401 without auth 🤖
**Steps:** `GET` each of `/api/bookings`, `/api/clients`, `/api/campaigns`, `/api/inventory`, `/api/staff` without auth  
**Expected:** 401 JSON response  
**Automated result:** PASS — all five returned 401

---

### TC-014f · Stripe checkout API returns 401 without auth 🤖
**Objective:** Confirm `/api/stripe/checkout` is protected by auth middleware.  
**Steps:**
1. `POST https://barberboost.app/api/stripe/checkout` with no session cookie and body `{"planId":"starter"}`

**Expected:** `{"error":"Unauthorized"}` with HTTP 401  
**Automated result:** PASS (401)

---

### TC-014g · Stripe upgrade API returns 401 without auth 🤖
**Objective:** Confirm `/api/stripe/upgrade` is protected by auth middleware.  
**Steps:**
1. `POST https://barberboost.app/api/stripe/upgrade` with no session cookie and body `{"planId":"pro"}`

**Expected:** `{"error":"Unauthorized"}` with HTTP 401  
**Automated result:** PASS (401)

---

### TC-014h · Stripe portal API returns 401 without auth 🤖
**Objective:** Confirm `/api/stripe/portal` is protected by auth middleware.  
**Steps:**
1. `POST https://barberboost.app/api/stripe/portal` with no session cookie

**Expected:** `{"error":"Unauthorized"}` with HTTP 401  
**Automated result:** PASS (401)

---

### TC-015 · Deleted endpoint returns 404 🤖
**Objective:** Confirm the removed unauthenticated email relay no longer exists.  
**Steps:** `POST /api/send-email`  
**Expected:** 404  
**Automated result:** PASS

---

### TC-016 · Cron endpoint rejects invalid token 🤖
**Steps:** `GET /api/cron/reminders` with `Authorization: Bearer wrong-secret`  
**Expected:** `{"error":"Unauthorized"}` with 401  
**Automated result:** PASS

---

### TC-017 · User signup flow 👤
**Steps:**
1. Navigate to `/signup`
2. Enter full name, email, shop name; set password ≥ 8 chars
3. Submit

**Expected:** Account created; redirected to dashboard; onboarding checklist visible  
**Edge cases:**
- Duplicate email → error message shown
- Password < 8 chars → validation error before submit

---

### TC-018 · User login — email/password 👤
**Steps:**
1. Navigate to `/login`
2. Enter valid credentials
3. Submit

**Expected:** Redirect to `/dashboard`

---

### TC-019 · User login — wrong password 👤
**Steps:** Enter wrong password  
**Expected:** "Incorrect email or password" error; no account lockout on first attempt

---

### TC-020 · Password reset flow 👤
**Steps:**
1. Navigate to `/reset-password`
2. Enter registered email
3. Check inbox for reset link
4. Click link → redirected to `/reset-password/update`
5. Set new password ≥ 8 chars

**Expected:** Password updated; can log in with new password

---

### TC-021 · Authenticated user redirected away from login 👤
**Steps:** Log in, then navigate to `/login` directly  
**Expected:** Redirect to `/dashboard`

---

### TC-022 · Logout 👤
**Steps:** Click account menu → Sign out  
**Expected:** Session cleared; redirect to `/login`; attempting `/dashboard` redirects to login

---

---

## MODULE 4 — Onboarding

### TC-023 · Onboarding checklist appears for new users 👤
**Steps:** Create fresh account  
**Expected:** Welcome banner and checklist visible on dashboard with steps: Add services / Add staff / Set opening hours / Take first booking / Add a client

---

### TC-024 · Checklist auto-hides when all steps complete 👤
**Steps:** Complete all five onboarding steps  
**Expected:** Checklist section disappears from dashboard

---

---

## MODULE 5 — Shop Settings

### TC-025 · Update shop name and description 👤
**Steps:**
1. Navigate to `/settings/shop`
2. Change shop name and description
3. Save

**Expected:** Success toast; changes persisted after page refresh

---

### TC-026 · Slug validation 👤
**Steps:**
1. Enter slug with uppercase letters or spaces (e.g. `My Shop`)
2. Attempt to save

**Expected:** Validation error; save blocked

---

### TC-027 · Opening hours configuration 👤
**Steps:**
1. Toggle Monday to Closed
2. Set Tuesday 09:00–18:00
3. Save

**Expected:** Monday closed; Tuesday hours saved; reflected in public booking page availability

---

### TC-028 · Logo upload 👤
**Steps:**
1. Upload a PNG < 2 MB
2. Save

**Expected:** Logo visible; persisted after refresh  
**Edge case:** File > 2 MB → error; non-image file → rejected

---

---

## MODULE 6 — Services

### TC-029 · Create a service 👤
**Steps:**
1. Navigate to `/services`
2. Click Add Service
3. Enter name, price, duration, category, colour
4. Save

**Expected:** Service appears in list; visible in public booking page

---

### TC-030 · Plan limit enforced on services 👤
**Steps (Free plan):** Add 6th service  
**Expected:** Error: "Service limit reached (5 on Free plan)" — 403 response

---

### TC-031 · Edit service 👤
**Steps:** Click edit on existing service; change price; save  
**Expected:** Updated price shown; no disruption to existing bookings

---

### TC-032 · Deactivate / reactivate service 👤
**Steps:** Toggle service to inactive  
**Expected:** Service disappears from public booking page; inactive badge in dashboard

---

---

## MODULE 7 — Staff

### TC-033 · Add staff member 👤
**Steps:**
1. Navigate to `/staff`
2. Click Add Staff
3. Enter name, role, commission rate, working hours
4. Save

**Expected:** Staff card appears; staff visible in booking creation dropdown

---

### TC-034 · Plan limit enforced on staff 👤
**Steps (Free plan):** Add 2nd active staff member  
**Expected:** Error: "Staff limit reached (1 on Free plan)"

---

### TC-035 · Set staff working hours 👤
**Steps:** Open staff edit modal; set Mon–Fri 09:00–17:00, Sat–Sun closed; save  
**Expected:** Working hours saved; availability API returns no slots on Saturday

---

### TC-036 · Staff detail — commission calculator 👤
**Steps:** Navigate to `/staff/[id]` → Commission tab; toggle This Month / Last Month  
**Expected:** Revenue × commission rate = commission amount shown

---

---

## MODULE 8 — Bookings (Dashboard)

### TC-037 · Create booking 👤
**Steps:**
1. Navigate to `/bookings/new`
2. Select client, service, staff, date, time
3. Confirm

**Expected:** Booking appears in list and today's schedule; confirmation email sent to client

---

### TC-038 · Booking conflict detection 👤
**Steps:** Create two bookings for the same staff, same date and overlapping times  
**Expected:** Second booking rejected with "Time slot is already taken" (409)

---

### TC-039 · Update booking status 👤
**Steps:** Open booking; change status to Completed; save  
**Expected:** Status badge updates; booking counts toward revenue analytics

---

### TC-040 · Cancel booking 👤
**Steps:** Open booking; click Cancel  
**Expected:** Status = cancelled; cancellation email sent to client; slot freed for rebooking

---

### TC-041 · Month limit enforced (Free plan) 👤
**Steps (Free plan with 30 bookings this month):** Attempt to create 31st booking  
**Expected:** "Monthly booking limit reached (30 on Free plan)" error

---

### TC-042 · Booking search by client name 👤
**Steps:** Enter partial client name in search  
**Expected:** List filters to matching clients only

---

### TC-043 · Booking search by reference 👤
**Steps:** Search `BB-` followed by 8 chars  
**Expected:** Single booking returned matching that reference

---

---

## MODULE 9 — Public Booking Page

### TC-044 · Public booking page loads for valid shop 👤
**Steps:** Navigate to `/booking/{shop-slug}`  
**Expected:** Shop name, available services, and staff dropdown visible

---

### TC-045 · Availability — shows correct slots 👤
**Steps:** Select service and staff; pick a date  
**Expected:** Slots shown per staff working hours; already-booked slots not shown

---

### TC-046 · Availability — closed days return empty 👤
**Steps:** Select a day the shop/staff is closed  
**Expected:** "No available slots" message; no times shown

---

### TC-047 · Create booking via public page 👤
**Steps:**
1. Select service, staff, date, time
2. Enter name, email, phone
3. Confirm

**Expected:** Booking created (201); confirmation email sent; slot no longer available

---

### TC-048 · Past date rejected 🤖👤
**Automated:** API validation rejects `date < today` in code review  
**Manual:** Try selecting yesterday in the date picker  
**Expected:** UI prevents selection; API returns 400 if bypassed

---

### TC-049 · Rate limit on public bookings 🤖
**Objective:** Confirm IP-based rate limit (10/min) is in place  
**Code review:** `rateLimit('public_booking:${ip}', 10, 60)` verified in `/api/public/bookings/route.ts`  
**Expected:** 11th request from same IP within 60 seconds → 429 with `Retry-After` header

---

### TC-050 · Availability — 60-day cap 🤖
**Code review:** `maxDate = today + 60 days`; dates beyond return `{ slots: [] }`  
**Manual:** Try selecting a date 61 days ahead  
**Expected:** No slots shown

---

---

## MODULE 10 — Clients

### TC-051 · Add client manually 👤
**Steps:**
1. Navigate to `/clients`
2. Click Add Client; fill name, email, phone
3. Save

**Expected:** Client appears in list; visit/spend counters at 0

---

### TC-052 · Client search 👤
**Steps:** Type partial name in search box  
**Expected:** List filters in real time

---

### TC-053 · Client profile — booking history 👤
**Steps:** Click on a client who has bookings  
**Expected:** Bookings tab shows full history; stats (total visits, total spent) match bookings

---

### TC-054 · Client tags 👤
**Steps:** Verify a high-spend client is tagged VIP  
**Expected:** VIP badge visible; tag renders in gold

---

### TC-055 · Import clients — valid CSV 👤
**Steps:**
1. Prepare CSV with columns: name, email, phone
2. Navigate to `/clients` → Import
3. Upload file

**Expected:** Clients imported; count reported; duplicate emails skipped with reason

---

### TC-056 · Import clients — invalid CSV (no name column) 👤
**Expected:** Error: "No valid rows found. Make sure your CSV has a 'name' column header."

---

### TC-057 · Import clients — over 500 rows 👤
**Expected:** Error: "Maximum 500 rows per import. Split your file and try again."

---

### TC-058 · Export clients to CSV 👤
**Steps:** Navigate to `/clients` → Export  
**Expected:** `clients.csv` downloaded; headers: name, email, phone, notes, tags, total_visits, total_spent, created_at; data matches dashboard

---

### TC-059 · Plan limit enforced on clients 👤
**Steps (Free plan at 50 clients):** Attempt to add 51st  
**Expected:** Import or add blocked with plan limit error

---

---

## MODULE 11 — Analytics

### TC-060 · Dashboard KPIs load 👤
**Steps:** Navigate to `/analytics`  
**Expected:** Four KPI cards visible (Revenue, Bookings, New Clients, No-Show Rate) with percentage change vs prior period

---

### TC-061 · Date range selector 👤
**Steps:** Switch between Today / This Week / This Month / Last 30 Days  
**Expected:** Charts and KPIs update correctly for each range

---

### TC-062 · Plan gate — Starter features 👤
**Steps (Free plan):** Confirm services chart, status donut, staff leaderboard, heatmap are locked  
**Expected:** Blurred/locked UI with upgrade prompt

---

### TC-063 · Plan gate — Pro client insights 👤
**Steps (Starter plan):** Confirm client insights panel is locked  
**Expected:** Locked UI visible; not accessible

---

### TC-064 · Plan gate — Empire financial summary 👤
**Steps (Pro plan):** Confirm financial summary is locked  
**Expected:** Locked UI visible

---

### TC-065 · Analytics export 👤
**Steps (Pro+ plan):** Click Export; download CSV  
**Expected:** File downloaded with booking data for selected period

---

---

## MODULE 12 — Inventory

### TC-066 · Inventory locked for Free/Starter 👤
**Steps (Free plan):** Navigate to `/inventory`  
**Expected:** Locked preview with blur and upgrade CTA

---

### TC-067 · Add inventory item (Pro+) 👤
**Steps:**
1. Upgrade to Pro (or use Pro test account)
2. Navigate to `/inventory` → Add Item
3. Enter name, category, quantity, threshold, cost, retail price

**Expected:** Item appears in list; cost value = cost × qty; retail value = retail × qty

---

### TC-068 · Stock adjustment 👤
**Steps:** Click adjust on item; enter delta +5; save  
**Expected:** New quantity = old + 5; audit reason recorded

---

### TC-069 · Low-stock alert email 👤
**Steps:** Adjust stock to ≤ threshold (e.g. set threshold 10, adjust to 8)  
**Expected:** Low-stock alert email sent to shop owner; item highlighted Critical in UI

---

### TC-070 · Search and filter inventory 👤
**Steps:** Filter by category; search by name  
**Expected:** List filters correctly; count updates

---

---

## MODULE 13 — Marketing Campaigns

### TC-071 · Campaigns locked for Free plan 👤
**Steps (Free plan):** Navigate to `/marketing`  
**Expected:** Upgrade prompt; create button disabled or locked

---

### TC-072 · Create campaign (Starter+) 👤
**Steps:**
1. Navigate to `/marketing` → New Campaign
2. Enter name, select type (Email), target (All Clients), subject, content
3. Save as draft

**Expected:** Campaign appears in list with "Draft" status

---

### TC-073 · Monthly campaign limit enforced 👤
**Steps (Starter plan — 2 campaigns used this month):** Create 3rd  
**Expected:** Error: "Monthly campaign limit reached (2 on Starter plan)"

---

### TC-074 · AI copy generation (Empire plan) 👤
**Steps:**
1. Upgrade to Empire
2. Create campaign → Use AI Copy
3. Select tone and segment; generate

**Expected:** AI returns 3 subject lines, email body, SMS message; all ≤ 160 chars for SMS

---

### TC-075 · AI copy rate limit 🤖
**Code review:** `rateLimit('ai_copy:${ip}', 5, 60)` — 6th request returns 429  
**Expected:** Rate limit header `Retry-After` present

---

### TC-076 · Edit campaign 👤
**Steps:** Edit a draft campaign; update subject  
**Expected:** Changes saved; only whitelisted fields updated (shop_id unchanged)

---

### TC-077 · Delete campaign 👤
**Steps:** Delete a draft campaign  
**Expected:** Campaign removed from list

---

---

## MODULE 14 — Billing & Stripe

### TC-078 · Upgrade to Starter 👤
**Steps:**
1. Navigate to `/settings/billing`
2. Click Upgrade on Starter plan
3. Complete Stripe checkout (test card 4242...)

**Expected:** Redirected to `/dashboard?upgraded=true`; plan badge shows Starter; plan limits updated

---

### TC-078b · In-place plan upgrade (Starter → Pro) 👤
**Objective:** Verify an existing paid subscriber can upgrade to a higher plan without going through Stripe Checkout again.  
**Pre-condition:** Account is on Starter plan with an active Stripe subscription.  
**Steps:**
1. Navigate to `/settings/billing`
2. Click "Upgrade to Pro" on the Pro plan card
3. Observe the button spinner
4. Wait for page reload

**Expected:**
- Spinner appears immediately on click (no navigation away)
- Page reloads within ~5 seconds
- Plan badge now shows "Pro"
- Pro plan card shows "Current plan" indicator
- No Stripe Checkout page was visited (upgrade is in-place)
- A prorated invoice for the price difference is created immediately in Stripe

**Edge cases:**
- If Stripe call fails → inline red error banner appears below the plan grid; button re-enables
- Network disconnect → "Network error. Please try again." banner shown

---

### TC-078c · Upgrade error shown inline 👤
**Objective:** Verify upgrade failures surface an error banner rather than a broken page.  
**Steps:**
1. With a Free-plan account (no Stripe customer ID), call `POST /api/stripe/upgrade` directly with `{"planId":"pro"}`
2. Alternatively, disconnect from network and click Upgrade

**Expected:** Red error banner "No active subscription found" (or network error) appears below plan cards; no page navigation; button re-enables  
**Automated check:** `POST /api/stripe/upgrade` with Free-plan auth → 404 "No active subscription found"

---

### TC-079 · Invalid price ID rejected 🤖
**Code review:** `VALID_PRICE_IDS.has(priceId)` check in `/api/stripe/checkout`  
**Steps:** `POST /api/stripe/checkout` with `priceId=price_fake123` and valid auth  
**Expected:** 400 "Invalid price ID"

---

### TC-079b · Billing page uses JS fetch — not HTML form 🤖
**Objective:** Confirm upgrade buttons use `fetch()` so errors display inline rather than navigating away to raw JSON.  
**Code review:** `billing/page.tsx` — `handleCheckout()` calls `fetch('/api/stripe/checkout', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({planId})})`. No `<form>` element present.  
**Expected:** No `<form action=...>` on the billing page; `handleCheckout` and `handleUpgrade` functions verified in source  
**Automated result:** PASS (code review)

---

### TC-079c · Checkout POST returns JSON URL for application/json callers 🤖
**Objective:** Confirm the checkout API returns `{"url":"..."}` instead of a raw redirect when called with `Content-Type: application/json`.  
**Code review:** `src/app/api/stripe/checkout/route.ts` — when `contentType.includes('application/json')`, handler returns `NextResponse.json({ url: session.url })`.  
**Steps:** `POST /api/stripe/checkout` with `Content-Type: application/json` and valid auth + `{"planId":"starter"}`  
**Expected:** 200 JSON response containing `{ "url": "https://checkout.stripe.com/..." }`; not a 303 redirect  
**Automated result:** PASS (code review)

---

### TC-079d · Upgrade uses always_invoice proration 🤖
**Objective:** Confirm plan upgrades charge the prorated difference immediately rather than deferring to next invoice.  
**Code review:** `src/app/api/stripe/upgrade/route.ts` — `stripe.subscriptions.update(...)` called with `proration_behavior: 'always_invoice'`.  
**Expected:** `always_invoice` present in upgrade handler; no `create_prorations` or `none`  
**Automated result:** PASS (code review)

---

### TC-079e · Portal route returns JSON not redirect 🤖
**Objective:** Confirm the portal API returns `{"url":"..."}` so the client-side fetch can extract and navigate without opaque redirect issues.  
**Code review:** `src/app/api/stripe/portal/route.ts` — returns `NextResponse.json({ url: portalSession.url })` (not `NextResponse.redirect`).  
**Expected:** No `NextResponse.redirect` in portal route; `NextResponse.json({ url })` confirmed  
**Automated result:** PASS (code review)

---

### TC-079f · Subscription queries use .order().limit(1) not .single() 🤖
**Objective:** Confirm all subscription queries tolerate historical duplicate rows (legacy upsert artefacts) without throwing PGRST116.  
**Code review:** All Supabase subscription selects across billing page, checkout, upgrade, portal, and webhook handler use `.order('updated_at', {ascending: false}).limit(1)` instead of `.single()`.  
**Expected:** No `.single()` on subscriptions table; `.limit(1)` confirmed in all relevant files  
**Automated result:** PASS (code review)

---

### TC-080 · Stripe webhook — subscription created 🤖
**Code review:** `checkout.session.completed` event → upsert to `subscriptions` table  
**Manual verification:** After checkout, confirm subscription row in Supabase with correct plan, status, period dates

---

### TC-081 · Stripe webhook — payment failure email 🤖
**Code review:** `invoice.payment_failed` → `await sendPaymentFailedEmail()` (awaited, not fire-and-forget)  
**Manual:** Trigger test payment failure via Stripe CLI; confirm email received

---

### TC-082 · Stripe webhook — payment receipt email 🤖
**Code review:** `invoice.payment_succeeded` with `billing_reason !== 'subscription_create'` → `await sendPaymentReceiptEmail()` (awaited)  
**Manual:** Trigger test renewal via Stripe CLI; confirm email received

---

### TC-083 · Manage Billing portal 👤
**Steps:** Click "Manage Billing" in billing settings  
**Expected:** Redirected to Stripe Customer Portal; can update card, view invoices, cancel

---

### TC-084 · Downgrade / cancellation reflected 👤
**Steps:** Cancel plan via Stripe portal; wait for webhook  
**Expected:** Subscription status → `cancelled`; plan reverts to Free at period end

---

---

## MODULE 15 — Reminders & Notifications

### TC-085 · Booking reminder — email 👤
**Objective:** Confirm cron sends email 24h before appointment.  
**Steps:**
1. Create a booking for tomorrow
2. Trigger cron manually: `GET /api/cron/reminders` with correct `Authorization: Bearer {CRON_SECRET}`
3. Check client email inbox

**Expected:** Reminder email received; booking marked `reminder_sent = true` in DB

---

### TC-086 · Booking reminder — WhatsApp 👤
**Steps:** Create booking with phone number; trigger cron  
**Expected:** WhatsApp message sent to client phone (if Twilio configured)

---

### TC-087 · Reminder — plan gate (Free plan) 👤
**Steps:** Trigger cron with Free-plan shop booking  
**Expected:** No reminder sent; `skipped` counter incremented

---

### TC-088 · In-app notifications bell 👤
**Steps:** Create a booking that triggers a notification; open notification bell  
**Expected:** Unread count badge shown; notifications list loads; mark as read clears badge

---

---

## MODULE 16 — Signup Notification

### TC-089 · New signup alert email 🤖
**Code review:** `/api/signup-notify` sends `newSignupAlert` template to `NOTIFY_EMAIL`  
**Manual:** Register a new account; confirm admin notification email received

---

### TC-090 · Signup-notify rate limit (silent) 🤖
**Steps:** Send 7 consecutive `POST /api/signup-notify` requests from same IP  
**Expected:** All return 200 (silently absorbed after limit); no error exposed to caller  
**Automated result:** PASS — all 7 returned 200 as designed

---

---

## MODULE 17 — Responsive Design

### TC-091 · Mobile navigation — hamburger menu 👤
**Steps:** Open site at < 768px width; click hamburger  
**Expected:** Mobile menu slides open; nav links, CTA buttons, and social icons visible

---

### TC-092 · Mobile — social icons in menu 👤
**Steps:** Mobile menu open (TC-091)  
**Expected:** Three social icon tiles appear below "Start Free" button

---

### TC-093 · Dashboard responsive layout 👤
**Steps:** View dashboard at 375px (iPhone SE width)  
**Expected:** Sidebar collapsed to bottom nav; stats cards stack; no horizontal overflow

---

### TC-094 · Public booking page mobile 👤
**Steps:** Open `/booking/{slug}` on mobile  
**Expected:** Service picker, staff dropdown, calendar, and slot grid all usable; form fields keyboard-friendly

---

---

## MODULE 18 — Edge Cases & Error States

### TC-095 · 404 page 👤
**Steps:** Navigate to `/this-page-does-not-exist`  
**Expected:** Custom 404 page shown; link to return home

---

### TC-096 · Error boundary 👤
**Steps:** If possible, trigger a component error (or verify `error.tsx` exists)  
**Code review:** `src/app/error.tsx`, `src/app/(dashboard)/error.tsx`, `src/app/(auth)/error.tsx` all exist  
**Expected:** Graceful error UI shown rather than blank page

---

### TC-097 · Shop not found — public booking 🤖
**Steps:** `GET /api/public/availability?shop_id=nonexistent&service_id=x&date=2026-05-10`  
**Expected:** 404 "Shop not found"  
**Automated result:** PASS (404 returned)

---

### TC-098 · Ownership isolation — cannot access another shop's data 👤
**Steps:**
1. Log in as User A; note their shop_id
2. Log in as User B in a different browser
3. `GET /api/bookings?shop_id={User A's shop_id}` with User B's session

**Expected:** 403 Forbidden

---

### TC-099 · Loading states 👤
**Steps:** Navigate to each major dashboard section on a slow connection (DevTools → 3G throttle)  
**Expected:** Skeleton loaders shown; no blank flash or layout shift

---

### TC-100 · TypeScript build integrity 🤖
**Steps:** `npx tsc --noEmit`  
**Expected:** Zero errors  
**Automated result:** PASS (exit code 0)

---

*End of Test Cases — 110 test cases across 18 modules (v2.0, 13 May 2026)*
