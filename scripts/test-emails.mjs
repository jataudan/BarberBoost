/**
 * BarberBoost — Comprehensive Email Test Suite
 *
 * Tests every email template for structural correctness, then sends a live
 * test email for each type via Resend so you can visually inspect them.
 *
 * Usage:
 *   node --experimental-strip-types scripts/test-emails.mjs
 *
 * Optional env overrides:
 *   RESEND_API_KEY=re_...   (falls back to .env.example key)
 *   RESEND_FROM_EMAIL=...   (falls back to noreply@barberboost.app)
 *   TEST_EMAIL=...          (recipient for live sends — defaults to webxcelld@gmail.com)
 *   SKIP_SEND=1             (set to skip live sends, only run structure checks)
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Load .env.example as fallback key source ──────────────────────────────
function loadEnvExample() {
  try {
    const raw = readFileSync(resolve(ROOT, '.env.example'), 'utf8')
    const out = {}
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.+)$/)
      if (m) out[m[1]] = m[2].trim()
    }
    return out
  } catch {
    return {}
  }
}
const envExample = loadEnvExample()

const API_KEY   = process.env.RESEND_API_KEY   || envExample.RESEND_API_KEY   || ''
const FROM      = process.env.RESEND_FROM_EMAIL || envExample.RESEND_FROM_EMAIL || 'BarberBoost <noreply@barberboost.app>'
const TO        = process.env.TEST_EMAIL        || 'webxcelld@gmail.com'
const SKIP_SEND = process.env.SKIP_SEND === '1'
const APP_URL   = 'https://barberboost.app'

// ── Import TypeScript templates directly (Node 22 strip-types) ────────────
const {
  bookingConfirmation,
  bookingReminder,
  bookingCancellation,
  noShowFollowup,
  lowStockAlert,
  welcomeEmail,
  staffInvitation,
  newSignupAlert,
} = await import('../src/lib/email/templates.ts')

// ── Shared mock data ──────────────────────────────────────────────────────
const BOOKING = {
  clientName:      'James Wright',
  clientEmail:     TO,
  shopName:        'Crown Cuts Barbershop',
  shopAddress:     '42 King Street, London, EC1A 1BB',
  shopPhone:       '+44 20 7946 0958',
  shopWebsite:     APP_URL,
  serviceName:     'Premium Fade & Shape-Up',
  staffName:       'Marcus Johnson',
  date:            'Wednesday, 7 May 2026',
  startTime:       '2:30 PM',
  durationMinutes: 45,
  price:           35,
  currency:        'GBP',
  bookingId:       'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  bookingRef:      'BB-F47AC10B',
  depositAmount:   1000,
  bookingPageUrl:  `${APP_URL}/booking/crown-cuts`,
}

// ── ANSI colours ──────────────────────────────────────────────────────────
const G = '\x1b[32m'  // green
const R = '\x1b[31m'  // red
const Y = '\x1b[33m'  // yellow
const B = '\x1b[34m'  // blue
const D = '\x1b[2m'   // dim
const X = '\x1b[0m'   // reset
const BOLD = '\x1b[1m'

let passed = 0, failed = 0, warned = 0

function pass(label) { console.log(`  ${G}✓${X} ${label}`); passed++ }
function fail(label, detail) { console.log(`  ${R}✗${X} ${label}${detail ? `\n    ${D}${detail}${X}` : ''}`); failed++ }
function warn(label) { console.log(`  ${Y}⚠${X} ${label}`); warned++ }
function section(title) { console.log(`\n${BOLD}${B}▶ ${title}${X}`) }

// ── Structure validator ───────────────────────────────────────────────────
function checkTemplate(name, tmpl, expectations = {}) {
  section(`Template: ${name}`)

  // Required fields
  if (typeof tmpl.subject === 'string' && tmpl.subject.length > 0) {
    pass(`subject present: "${tmpl.subject}"`)
  } else {
    fail('subject missing or empty')
  }

  if (typeof tmpl.html === 'string' && tmpl.html.length > 100) {
    pass(`html present (${tmpl.html.length} chars)`)
  } else {
    fail('html missing or too short')
  }

  if (typeof tmpl.text === 'string' && tmpl.text.length > 20) {
    pass(`text fallback present (${tmpl.text.length} chars)`)
  } else {
    fail('text fallback missing or too short')
  }

  // HTML sanity checks
  if (tmpl.html) {
    if (tmpl.html.includes('<!DOCTYPE html>'))  pass('has DOCTYPE declaration')
    else                                         fail('missing DOCTYPE declaration')

    if (tmpl.html.includes('BARBERBOOST'))       pass('contains BARBERBOOST branding')
    else                                         fail('missing BARBERBOOST branding')

    if (tmpl.html.includes('#c9a84c'))           pass('uses brand gold colour')
    else                                         warn('brand gold colour not found')

    // Check for unclosed common tags
    const openDiv  = (tmpl.html.match(/<div/g)  || []).length
    const closeDiv = (tmpl.html.match(/<\/div>/g) || []).length
    if (openDiv === closeDiv) pass(`div tags balanced (${openDiv} pairs)`)
    else                      fail(`div tags unbalanced — ${openDiv} open, ${closeDiv} close`)

    const openTd  = (tmpl.html.match(/<td/g)  || []).length
    const closeTd = (tmpl.html.match(/<\/td>/g) || []).length
    if (openTd === closeTd) pass(`td tags balanced (${openTd} pairs)`)
    else                    fail(`td tags unbalanced — ${openTd} open, ${closeTd} close`)
  }

  // Custom expectations
  for (const [label, check] of Object.entries(expectations)) {
    if (check(tmpl)) pass(label)
    else             fail(label)
  }
}

// ── Live send via Resend ──────────────────────────────────────────────────
const delay = (ms) => new Promise(r => setTimeout(r, ms))

async function send(tag, tmpl, recipient = TO) {
  await delay(250) // stay under Resend's 5 req/s limit
  if (SKIP_SEND) { warn(`[SKIP_SEND] skipped live send: ${tag}`); return }
  if (!API_KEY || !API_KEY.startsWith('re_')) {
    warn(`No valid RESEND_API_KEY — skipping live send: ${tag}`)
    return
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(API_KEY)
    const payload = {
      from:    FROM,
      to:      recipient,
      subject: `[TEST] ${tmpl.subject}`,
      html:    tmpl.html,
      ...(tmpl.text ? { text: `[TEST EMAIL]\n\n${tmpl.text}` } : {}),
    }
    const { data, error } = await resend.emails.send(payload)
    if (error) {
      fail(`Live send failed: ${tag} — ${error.message}`)
    } else {
      pass(`Live send OK: ${tag} → ${recipient} (id: ${data?.id ?? 'n/a'})`)
    }
  } catch (err) {
    fail(`Live send exception: ${tag} — ${err.message}`)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 1 — Template structure tests
// ═══════════════════════════════════════════════════════════════════════════

console.log(`\n${BOLD}${'═'.repeat(60)}${X}`)
console.log(`${BOLD}  BarberBoost Email Test Suite${X}`)
console.log(`${BOLD}${'═'.repeat(60)}${X}`)
console.log(`  ${D}API key: ${API_KEY ? API_KEY.slice(0, 12) + '...' : 'NOT SET'}${X}`)
console.log(`  ${D}FROM:    ${FROM}${X}`)
console.log(`  ${D}TO:      ${TO}${X}`)
console.log(`  ${D}Live:    ${SKIP_SEND ? 'DISABLED' : 'ENABLED'}${X}`)

// ── 1. Booking Confirmation ───────────────────────────────────────────────
const conf = bookingConfirmation(BOOKING)
checkTemplate('Booking Confirmation', conf, {
  'subject includes booking ref':   t => t.subject.includes('BB-F47AC10B'),
  'subject includes shop name':     t => t.subject.includes('Crown Cuts'),
  'html includes client name':      t => t.html.includes('James Wright'),
  'html includes booking ref block':t => t.html.includes('Booking Reference'),
  'html includes BB-F47AC10B ref':  t => t.html.includes('BB-F47AC10B'),
  'html includes service name':     t => t.html.includes('Premium Fade'),
  'html includes barber name':      t => t.html.includes('Marcus Johnson'),
  'html includes date':             t => t.html.includes('7 May 2026'),
  'html includes price £35.00':     t => t.html.includes('35.00'),
  'html includes deposit row':      t => t.html.includes('Deposit paid'),
  'html includes shop address':     t => t.html.includes('42 King Street'),
  'html includes shop phone link':  t => t.html.includes('tel:+44'),
  'text includes booking ref':      t => t.text.includes('BB-F47AC10B'),
  'text includes all key fields':   t => ['James Wright','Premium Fade','Marcus Johnson','7 May 2026'].every(s => t.text.includes(s)),
})

// ── 2. Booking Reminder ───────────────────────────────────────────────────
const reminder = bookingReminder(BOOKING)
checkTemplate('Booking Reminder', reminder, {
  'subject says "tomorrow"':        t => t.subject.toLowerCase().includes('tomorrow'),
  'subject includes shop name':     t => t.subject.includes('Crown Cuts'),
  'html includes client name':      t => t.html.includes('James Wright'),
  'html has 24h reminder heading':  t => t.html.includes('See You Tomorrow'),
  'html includes service name':     t => t.html.includes('Premium Fade'),
  'html includes location':         t => t.html.includes('42 King Street'),
  'text includes reminder header':  t => t.text.includes('APPOINTMENT REMINDER'),
})

// ── 3. Booking Cancellation ───────────────────────────────────────────────
const cancel = bookingCancellation(BOOKING)
checkTemplate('Booking Cancellation', cancel, {
  'subject says "Cancelled"':       t => t.subject.includes('Cancelled'),
  'html includes reference row':    t => t.html.includes('Reference'),
  'html includes booking ref':      t => t.html.includes('BB-F47AC10B'),
  'html includes rebook CTA':       t => t.html.includes('BOOK AGAIN'),
  'html includes booking page URL': t => t.html.includes('crown-cuts'),
  'text includes cancellation':     t => t.text.includes('BOOKING CANCELLED'),
  'text includes booking ref':      t => t.text.includes('BB-F47AC10B'),
})

// ── 4. No-show Follow-up ─────────────────────────────────────────────────
const noshow = noShowFollowup(BOOKING)
checkTemplate('No-Show Follow-up', noshow, {
  'subject says "missed"':          t => t.subject.toLowerCase().includes('miss'),
  'html has "We Missed You" heading': t => t.html.includes('We Missed You'),
  'html includes service name':     t => t.html.includes('Premium Fade'),
  'html includes rebook CTA':       t => t.html.includes('REBOOK NOW'),
  'text includes WE MISSED YOU':    t => t.text.includes('WE MISSED YOU'),
})

// ── 5. Low Stock Alert ────────────────────────────────────────────────────
const stockData = {
  shopName:     'Crown Cuts Barbershop',
  ownerName:    'Daniel Osei',
  dashboardUrl: `${APP_URL}/inventory`,
  items: [
    { name: 'Fade Spray (250ml)', sku: 'SKU-001', quantity: 0,  threshold: 5, category: 'Styling' },
    { name: 'Beard Oil',          sku: 'SKU-002', quantity: 2,  threshold: 5, category: 'Grooming' },
    { name: 'Pomade Classic',     sku: null,       quantity: 1,  threshold: 3, category: null },
  ],
}
const stock = lowStockAlert(stockData)
checkTemplate('Low Stock Alert', stock, {
  'subject mentions item count':    t => t.subject.includes('3 items'),
  'subject mentions shop name':     t => t.subject.includes('Crown Cuts'),
  'subject no emoji prefix':        t => !t.subject.startsWith('⚠'),
  'html shows OUT OF STOCK badge':  t => t.html.includes('OUT OF STOCK'),
  'html shows LOW STOCK badge':     t => t.html.includes('LOW STOCK'),
  'html shows all 3 items':         t => t.html.includes('Fade Spray') && t.html.includes('Beard Oil') && t.html.includes('Pomade Classic'),
  'html shows inventory CTA':       t => t.html.includes('VIEW INVENTORY'),
  'text includes all 3 items':      t => ['Fade Spray','Beard Oil','Pomade Classic'].every(s => t.text.includes(s)),
  'text shows OUT OF STOCK status': t => t.text.includes('OUT OF STOCK'),
})

// ── 6. Welcome Email ──────────────────────────────────────────────────────
const welcome = welcomeEmail({
  ownerName:      'Daniel Osei',
  shopName:       'Crown Cuts Barbershop',
  bookingPageUrl: `${APP_URL}/booking/crown-cuts`,
  dashboardUrl:   `${APP_URL}/dashboard`,
  supportEmail:   'support@barberboost.app',
})
checkTemplate('Welcome Email', welcome, {
  'subject says "Welcome"':         t => t.subject.toLowerCase().includes('welcome'),
  'subject no emoji':               t => !/[\u{1F300}-\u{1FFFF}]/u.test(t.subject),
  'html greets owner by name':      t => t.html.includes('Daniel Osei'),
  'html has 3 setup steps':         t => t.html.includes('① Add a service') && t.html.includes('② Add a barber') && t.html.includes('③ Share your booking page'),
  'html includes booking page URL': t => t.html.includes('/booking/crown-cuts'),
  'html includes dashboard CTA':    t => t.html.includes('OPEN MY DASHBOARD'),
  'html links to support email':    t => t.html.includes('support@barberboost.app'),
  'text includes 3 steps':          t => t.text.includes('1. Add a service') && t.text.includes('2. Add a barber') && t.text.includes('3. Share your booking page'),
})

// ── 7. Staff Invitation ───────────────────────────────────────────────────
const invite = staffInvitation({
  staffName:    'Marcus Johnson',
  shopName:     'Crown Cuts Barbershop',
  ownerName:    'Daniel Osei',
  dashboardUrl: `${APP_URL}/dashboard`,
})
checkTemplate('Staff Invitation', invite, {
  'subject mentions shop name':     t => t.subject.includes('Crown Cuts'),
  'html says "You\'ve been added"': t => t.html.includes("You've been added"),
  'html shows shop name':           t => t.html.includes('Crown Cuts'),
  'html shows staff name detail':   t => t.html.includes('Marcus Johnson'),
  'html shows owner name':          t => t.html.includes('Daniel Osei'),
  'html has dashboard CTA':         t => t.html.includes('View BarberBoost'),
  'text has uppercase shop name':   t => t.text.includes('CROWN CUTS'),
})

// ── 8. New Signup Alert (internal) ───────────────────────────────────────
const alert = newSignupAlert({
  ownerName:  'Daniel Osei',
  shopName:   'Crown Cuts Barbershop',
  email:      TO,
  signedUpAt: 'Wednesday, 7 May 2026 at 14:30',
})
checkTemplate('New Signup Alert (internal)', alert, {
  'subject has owner name':         t => t.subject.includes('Daniel Osei'),
  'subject has shop name':          t => t.subject.includes('Crown Cuts'),
  'html shows name row':            t => t.html.includes('Daniel Osei'),
  'html shows email row':           t => t.html.includes(TO),
  'html shows shop name row':       t => t.html.includes('Crown Cuts'),
  'html shows signed-up time':      t => t.html.includes('14:30'),
  'html has Supabase CTA':          t => t.html.includes('VIEW SUPABASE DASHBOARD'),
  'html wraps in barberboost shell':t => t.html.includes('emailShell') || t.html.includes('BARBERBOOST'),
  'text has all 4 fields':          t => ['Daniel Osei', TO, 'Crown Cuts', '14:30'].every(s => t.text.includes(s)),
})

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 2 — Additional edge-case checks
// ═══════════════════════════════════════════════════════════════════════════

section('Edge Cases')

// Booking with no optional fields
const minimalBooking = {
  clientName:      'Walk-in',
  clientEmail:     TO,
  shopName:        'Test Shop',
  shopAddress:     null,
  shopPhone:       null,
  shopWebsite:     null,
  serviceName:     'Haircut',
  staffName:       'Barber',
  date:            'Monday, 4 May 2026',
  startTime:       '10:00 AM',
  durationMinutes: 30,
  price:           2000,
  currency:        'GBP',
  bookingId:       'aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
  bookingRef:      'BB-AAAABBBB',
}

try {
  const minConf = bookingConfirmation(minimalBooking)
  if (minConf.subject && minConf.html && minConf.text) pass('Confirmation renders OK with null optional fields')
  else fail('Confirmation missing fields with null optionals')
} catch (e) {
  fail(`Confirmation throws with null optionals: ${e.message}`)
}

try {
  const minRemind = bookingReminder(minimalBooking)
  if (minRemind.subject && minRemind.html && minRemind.text) pass('Reminder renders OK with null optional fields')
  else fail('Reminder missing fields with null optionals')
} catch (e) {
  fail(`Reminder throws with null optionals: ${e.message}`)
}

try {
  const minCancel = bookingCancellation({ ...minimalBooking, bookingPageUrl: undefined })
  if (minCancel.subject && minCancel.html && minCancel.text) pass('Cancellation renders OK without bookingPageUrl')
  else fail('Cancellation missing fields without bookingPageUrl')
} catch (e) {
  fail(`Cancellation throws without bookingPageUrl: ${e.message}`)
}

// Low stock with single item
try {
  const singleStock = lowStockAlert({ ...stockData, items: [stockData.items[0]] })
  const singular = !singleStock.subject.includes('items') && singleStock.subject.includes('item')
  if (singular) pass('Low stock uses singular "item" for 1 item')
  else fail(`Low stock subject for 1 item: "${singleStock.subject}"`)
} catch (e) {
  fail(`Low stock throws with 1 item: ${e.message}`)
}

// Staff invitation without ownerName
try {
  const noOwner = staffInvitation({ staffName: 'Bob', shopName: 'Test Shop', ownerName: null, dashboardUrl: APP_URL })
  if (noOwner.html && !noOwner.html.includes('null')) pass('Staff invite handles null ownerName (no "null" in HTML)')
  else fail('Staff invite has "null" in HTML when ownerName is null')
} catch (e) {
  fail(`Staff invite throws with null ownerName: ${e.message}`)
}

// XSS sanity — user-supplied fields must be HTML-escaped
const xssBooking = { ...BOOKING, clientName: 'Alice <script>alert(1)</script>' }
try {
  const xssConf = bookingConfirmation(xssBooking)
  if (xssConf.html.includes('<script>'))
    fail('XSS: raw <script> tag found in HTML — esc() not applied to clientName')
  else if (xssConf.html.includes('&lt;script&gt;'))
    pass('XSS safe: <script> is HTML-escaped to &lt;script&gt; in output')
  else
    fail('XSS check inconclusive: neither raw nor escaped script tag found')
} catch (e) {
  fail(`Template throws on special chars in clientName: ${e.message}`)
}

// Ampersand and quote escaping
const ampBooking = { ...BOOKING, clientName: 'O\'Brien & Sons' }
try {
  const ampConf = bookingConfirmation(ampBooking)
  if (ampConf.html.includes("O'Brien & Sons") && !ampConf.html.includes('&amp;'))
    fail('Ampersand not escaped — raw & in HTML output')
  else
    pass('Special chars (apostrophe, ampersand) correctly escaped')
} catch (e) {
  fail(`Template throws on apostrophe/ampersand in clientName: ${e.message}`)
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 3 — Live send tests
// ═══════════════════════════════════════════════════════════════════════════

section('Live Email Sends via Resend')

if (!SKIP_SEND && (!API_KEY || !API_KEY.startsWith('re_'))) {
  warn('No valid RESEND_API_KEY found — all live sends will be skipped')
  warn(`Set RESEND_API_KEY=re_... or ensure .env.example has a valid key`)
}

// Send one of each type to the test recipient
await send('Booking Confirmation',    bookingConfirmation(BOOKING))
await send('Booking Reminder',        bookingReminder(BOOKING))
await send('Booking Cancellation',    bookingCancellation(BOOKING))
await send('No-Show Follow-up',       noShowFollowup(BOOKING))
await send('Low Stock Alert',         lowStockAlert(stockData))
await send('Welcome Email',           welcomeEmail({
  ownerName: 'Daniel Osei', shopName: 'Crown Cuts Barbershop',
  bookingPageUrl: `${APP_URL}/booking/crown-cuts`,
  dashboardUrl: `${APP_URL}/dashboard`,
  supportEmail: 'support@barberboost.app',
}))
await send('Staff Invitation',        staffInvitation({
  staffName: 'Marcus Johnson', shopName: 'Crown Cuts Barbershop',
  ownerName: 'Daniel Osei', dashboardUrl: APP_URL,
}))
await send('New Signup Alert',        newSignupAlert({
  ownerName: 'Daniel Osei', shopName: 'Crown Cuts Barbershop',
  email: TO, signedUpAt: 'Wednesday, 7 May 2026 at 14:30',
}), process.env.NOTIFY_EMAIL || envExample.NOTIFY_EMAIL || TO)

// ═══════════════════════════════════════════════════════════════════════════
//  Summary
// ═══════════════════════════════════════════════════════════════════════════

console.log(`\n${BOLD}${'═'.repeat(60)}${X}`)
console.log(`${BOLD}  Results${X}`)
console.log(`${'═'.repeat(60)}`)
console.log(`  ${G}Passed:${X}  ${passed}`)
if (warned > 0) console.log(`  ${Y}Warned:${X}  ${warned}`)
if (failed > 0) console.log(`  ${R}Failed:${X}  ${failed}`)
console.log(`${'─'.repeat(60)}`)
if (failed === 0) {
  console.log(`  ${G}${BOLD}All checks passed${warned > 0 ? ` (${warned} warning${warned > 1 ? 's' : ''})` : ''}${X}`)
} else {
  console.log(`  ${R}${BOLD}${failed} check${failed > 1 ? 's' : ''} failed — review output above${X}`)
}
console.log()

process.exit(failed > 0 ? 1 : 0)
