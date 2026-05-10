/**
 * BarberBoost UAT Report Generator
 * Produces a fully branded DOCX from structured data using docx v9.
 * Run: node scripts/generate-uat-report.mjs
 */

import {
  AlignmentType, BorderStyle, convertInchesToTwip, Document,
  Footer, Header, HeadingLevel, ImageRun, Packer, PageBreak,
  PageNumber, Paragraph, ShadingType, Tab, TabStopPosition,
  TabStopType, Table, TableCell, TableRow, TextRun, WidthType,
  UnderlineType,
} from 'docx'
import { writeFileSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')
const logo      = readFileSync(path.join(ROOT, 'public/logo.png'))

// ─── Brand palette ─────────────────────────────────────────────────────────
const G = {
  GOLD:        'C9A84C',
  GOLD_DARK:   'A8872E',
  GOLD_LIGHT:  'FDF8EE',
  DARK:        '111827',
  MID:         '374151',
  GREY:        '6B7280',
  LGREY:       '9CA3AF',
  WHITE:       'FFFFFF',
  PALE:        'F9FAFB',
  BORDER:      'E5E7EB',
  GREEN:       '15803D',
  GREEN_BG:    'DCFCE7',
  RED:         'B91C1C',
  RED_BG:      'FEE2E2',
  AMBER:       'B45309',
  AMBER_BG:    'FEF3C7',
  ORANGE:      'C2410C',
  BLUE:        '1D4ED8',
}

// ─── Typography helpers ─────────────────────────────────────────────────────
const pt = (n) => n * 2   // half-points (docx unit)
const sp = (n = 160) => new Paragraph({ spacing: { after: n } })

function run(text, opts = {}) {
  return new TextRun({ text: String(text ?? ''), font: 'Calibri', size: pt(10), color: G.DARK, ...opts })
}

function boldRun(text, opts = {}) {
  return run(text, { bold: true, ...opts })
}

function coloredRun(text, color, opts = {}) {
  return run(text, { color, ...opts })
}

function para(children, opts = {}) {
  const c = Array.isArray(children) ? children : [run(children)]
  return new Paragraph({ children: c, spacing: { after: 120 }, ...opts })
}

function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: 'Calibri', size: pt(18), color: G.GOLD })],
    spacing: { before: 320, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: G.GOLD } },
  })
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: 'Calibri', size: pt(13), color: G.DARK })],
    spacing: { before: 240, after: 80 },
  })
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: 'Calibri', size: pt(11), color: G.MID })],
    spacing: { before: 160, after: 60 },
  })
}

function bodyPara(text, opts = {}) {
  return para([run(text)], opts)
}

function codePara(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Courier New', size: pt(8.5), color: G.MID })],
    shading: { type: ShadingType.SOLID, color: G.PALE },
    spacing: { after: 0 },
    indent: { left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
  })
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] })
}

// ─── Table helpers ──────────────────────────────────────────────────────────
const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: G.BORDER }
const noBorder   = { style: BorderStyle.NONE, size: 0, color: 'auto' }
const allBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder }
const noTableBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder }

function cell(children, opts = {}) {
  const { bg, bold, color, span, width, align } = opts
  const runs = Array.isArray(children) ? children : [new TextRun({ text: String(children ?? ''), font: 'Calibri', size: pt(9), bold: bold ?? false, color: color ?? G.DARK })]
  return new TableCell({
    children: [new Paragraph({ children: runs, alignment: align ?? AlignmentType.LEFT, spacing: { after: 0 } })],
    shading: bg ? { type: ShadingType.SOLID, color: bg } : undefined,
    borders: allBorders,
    margins: { top: convertInchesToTwip(0.04), bottom: convertInchesToTwip(0.04), left: convertInchesToTwip(0.07), right: convertInchesToTwip(0.07) },
    ...(span ? { columnSpan: span } : {}),
    ...(width ? { width: { size: width, type: WidthType.PERCENTAGE } } : {}),
  })
}

function headerCell(text, width) {
  return cell([new TextRun({ text, font: 'Calibri', size: pt(9), bold: true, color: G.WHITE })], { bg: G.GOLD, width })
}

function passCell(text = 'PASS') {
  return cell([new TextRun({ text: '✓ ' + text, font: 'Calibri', size: pt(9), bold: true, color: G.GREEN })], { bg: G.GREEN_BG })
}

function pendingCell() {
  return cell([new TextRun({ text: '— Pending', font: 'Calibri', size: pt(9), color: G.GREY })], {})
}

function statusCell(label, color, bg) {
  return cell([new TextRun({ text: label, font: 'Calibri', size: pt(9), bold: true, color })], { bg })
}

function brandTable(headers, rows, colWidths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => headerCell(h, colWidths ? colWidths[i] : undefined)),
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cellDef, ci) => {
          if (cellDef && typeof cellDef === 'object' && cellDef.__cell) return cellDef
          const bg = ri % 2 === 1 ? G.GOLD_LIGHT : G.WHITE
          const w  = colWidths ? colWidths[ci] : undefined
          return cell(cellDef, { bg, width: w })
        }),
      })),
    ],
  })
}

// Special cell factories that return tagged objects for brandTable
function passTag()    { return { __cell: true, _make: passCell }   }
function pendTag()    { return { __cell: true, _make: pendingCell } }

// Unwrap tagged cells in brandTable
function brandTableEx(headers, rows, colWidths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => headerCell(h, colWidths ? colWidths[i] : undefined)),
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cellDef, ci) => {
          const bg = ri % 2 === 1 ? G.GOLD_LIGHT : G.WHITE
          const w  = colWidths ? colWidths[ci] : undefined
          if (cellDef && typeof cellDef === 'object' && cellDef.__cell) {
            return cellDef._make()
          }
          if (cellDef && typeof cellDef === 'object' && cellDef.__custom) {
            return cellDef._make(bg, w)
          }
          return cell(cellDef, { bg, width: w })
        }),
      })),
    ],
  })
}

function customCell(text, color, bg, w) { return { __custom: true, _make: (defBg, defW) => cell([new TextRun({ text, font: 'Calibri', size: pt(9), bold: true, color })], { bg: bg ?? defBg, width: w ?? defW }) } }
function passTag2(text = '✓ PASS')      { return customCell(text, G.GREEN, G.GREEN_BG)  }
function warnTag(text = '— Pending')    { return customCell(text, G.GREY, undefined)     }
function failTag(text = '✗ FAIL')       { return customCell(text, G.RED, G.RED_BG)       }
function sevTag(label, c, bg)           { return customCell(label, c, bg)                }

// ─── Header / Footer ────────────────────────────────────────────────────────
function makeHeader() {
  return new Header({
    children: [
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: convertInchesToTwip(6.27) }],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: G.GOLD } },
        spacing: { after: 80 },
        children: [
          new ImageRun({ data: logo, transformation: { width: 120, height: 24 }, type: 'png' }),
          new TextRun('\t'),
          new TextRun({ text: 'UAT Test Report — Pre-Launch', font: 'Calibri', size: pt(8.5), color: G.GREY, italics: true }),
        ],
      }),
    ],
  })
}

function makeFooter() {
  return new Footer({
    children: [
      new Paragraph({
        tabStops: [
          { type: TabStopType.CENTER, position: convertInchesToTwip(3.135) },
          { type: TabStopType.RIGHT,  position: convertInchesToTwip(6.27) },
        ],
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: G.BORDER } },
        spacing: { before: 80 },
        children: [
          new TextRun({ text: 'BarberBoost Ltd — Confidential', font: 'Calibri', size: pt(8), color: G.GREY }),
          new TextRun('\t'),
          new TextRun({ text: 'Page ', font: 'Calibri', size: pt(8), color: G.GREY }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: pt(8), color: G.GREY }),
          new TextRun({ text: ' of ', font: 'Calibri', size: pt(8), color: G.GREY }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri', size: pt(8), color: G.GREY }),
          new TextRun('\t'),
          new TextRun({ text: '10 May 2026', font: 'Calibri', size: pt(8), color: G.GREY }),
        ],
      }),
    ],
  })
}

// ─── Cover page ─────────────────────────────────────────────────────────────
function coverChildren() {
  const metaRow = (k, v) => new TableRow({
    children: [
      cell(k, { bold: true, bg: G.PALE, width: 25 }),
      cell(v, { bg: G.WHITE, width: 75 }),
    ],
  })

  return [
    new Paragraph({ spacing: { before: convertInchesToTwip(1.5), after: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: logo, transformation: { width: 280, height: 56 }, type: 'png' })],
      spacing: { after: 320 },
    }),
    // Gold rule
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: G.GOLD } },
      children: [],
      spacing: { after: 280 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: 'UAT TEST REPORT', bold: true, font: 'Calibri', size: pt(30), color: G.GOLD })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [new TextRun({ text: 'User Acceptance Testing — Pre-Launch', font: 'Calibri', size: pt(13), color: G.MID })],
    }),
    new Table({
      width: { size: 60, type: WidthType.PERCENTAGE },
      borders: noTableBorders,
      rows: [
        metaRow('Version',        '1.0'),
        metaRow('Date',           '10 May 2026'),
        metaRow('Environment',    'https://barberboost.app'),
        metaRow('Branch',         'development @ fa5e12b'),
        metaRow('Next.js',        '16.2.2 (Turbopack)'),
        metaRow('Prepared by',    'Dan Jatau / Development Team'),
        metaRow('Classification', 'Pre-Launch UAT — Confidential'),
      ],
    }),
    sp(800),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'CONFIDENTIAL — For authorised testers only', font: 'Calibri', size: pt(8.5), color: G.LGREY, italics: true })],
    }),
    pageBreak(),
  ]
}

// ─── Executive Summary ───────────────────────────────────────────────────────
function execSummary() {
  const moduleStats = [
    ['Marketing Pages',        '7',   '4',  '3'],
    ['Security Headers',       '5',   '5',  '0'],
    ['Auth & Route Guards',    '10',  '5',  '5'],
    ['Onboarding',             '2',   '0',  '2'],
    ['Shop Settings',          '4',   '0',  '4'],
    ['Services',               '4',   '0',  '4'],
    ['Staff',                  '4',   '0',  '4'],
    ['Bookings (Dashboard)',    '7',   '0',  '7'],
    ['Public Booking Page',    '7',   '2',  '5'],
    ['Clients',                '9',   '0',  '9'],
    ['Analytics',              '6',   '0',  '6'],
    ['Inventory',              '5',   '0',  '5'],
    ['Marketing Campaigns',    '7',   '1',  '6'],
    ['Billing & Stripe',       '7',   '2',  '5'],
    ['Reminders & Notifs',     '4',   '0',  '4'],
    ['Signup Notification',    '2',   '2',  '0'],
    ['Responsive Design',      '4',   '0',  '4'],
    ['Edge Cases',             '6',   '3',  '3'],
    ['TOTAL',                  '100', '34', '66'],
  ]

  return [
    h1('Executive Summary'),
    sp(80),
    bodyPara('A full UAT assessment was conducted across all 18 functional modules of BarberBoost. The test suite comprised 100 test cases: 34 fully automated (HTTP endpoint verification, TypeScript compilation, code review) and 66 requiring manual browser interaction. All 34 automated tests passed without exception.'),
    sp(80),
    // Status banner
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noTableBorders,
      rows: [new TableRow({
        children: [new TableCell({
          shading: { type: ShadingType.SOLID, color: G.GOLD_LIGHT },
          borders: { top: { style: BorderStyle.SINGLE, size: 12, color: G.GOLD }, bottom: { style: BorderStyle.SINGLE, size: 12, color: G.GOLD }, left: { style: BorderStyle.SINGLE, size: 12, color: G.GOLD }, right: { style: BorderStyle.SINGLE, size: 12, color: G.GOLD } },
          margins: { top: convertInchesToTwip(0.1), bottom: convertInchesToTwip(0.1), left: convertInchesToTwip(0.15), right: convertInchesToTwip(0.15) },
          children: [
            new Paragraph({ children: [new TextRun({ text: 'OVERALL STATUS: CONDITIONAL PASS', bold: true, font: 'Calibri', size: pt(12), color: G.GOLD_DARK })], spacing: { after: 60 } }),
            new Paragraph({ children: [new TextRun({ text: 'All 34 automated tests green. 66 manual browser tests documented and ready for tester sign-off. No blocking defects found in automated testing layer.', font: 'Calibri', size: pt(9.5), color: G.MID })], spacing: { after: 0 } }),
          ],
        })],
      })],
    }),
    sp(160),
    brandTable(
      ['Module', 'Total TCs', 'Automated PASS', 'Pending Manual'],
      moduleStats,
      [55, 15, 15, 15],
    ),
    pageBreak(),
  ]
}

// ─── Section 1 — Automated Results ──────────────────────────────────────────
function automatedResults() {
  const httpRows = [
    ['TC-001', 'GET', '/', '200', passTag2()],
    ['TC-002', 'GET', '/features', '200', passTag2()],
    ['TC-003', 'GET', '/pricing', '200', passTag2()],
    ['TC-013a', 'GET', '/dashboard (no auth)', '307 →/login', passTag2('✓ 307')],
    ['TC-013b', 'GET', '/bookings (no auth)', '307 →/login', passTag2('✓ 307')],
    ['TC-013c', 'GET', '/clients (no auth)', '307 →/login', passTag2('✓ 307')],
    ['TC-013d', 'GET', '/analytics (no auth)', '307 →/login', passTag2('✓ 307')],
    ['TC-013e', 'GET', '/settings (no auth)', '307 →/login', passTag2('✓ 307')],
    ['TC-014a', 'GET', '/api/bookings (no auth)', '401', passTag2('✓ 401')],
    ['TC-014b', 'GET', '/api/clients (no auth)', '401', passTag2('✓ 401')],
    ['TC-014c', 'GET', '/api/campaigns (no auth)', '401', passTag2('✓ 401')],
    ['TC-014d', 'GET', '/api/inventory (no auth)', '401', passTag2('✓ 401')],
    ['TC-014e', 'GET', '/api/staff (no auth)', '401', passTag2('✓ 401')],
    ['TC-015', 'POST', '/api/send-email (deleted)', '404', passTag2('✓ 404')],
    ['TC-016', 'GET', '/api/cron/reminders (bad token)', '401', passTag2('✓ 401')],
    ['TC-005', 'POST', '/api/contact (empty body)', '400', passTag2('✓ 400')],
    ['TC-006', 'POST', '/api/contact (XSS payload)', '200 no crash', passTag2()],
    ['TC-090', 'POST', '/api/signup-notify ×7 (rate limit silent)', '200 ×7', passTag2()],
    ['TC-097', 'GET', '/api/public/availability?shop_id=nonexistent', '404', passTag2('✓ 404')],
    ['—', 'GET', '/login', '200', passTag2()],
    ['—', 'GET', '/signup', '200', passTag2()],
  ]

  const headerRows = [
    ['TC-008', 'Content-Security-Policy', 'object-src \'none\'; form-action \'self\'', passTag2()],
    ['TC-009', 'Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload', passTag2()],
    ['TC-010', 'X-Frame-Options', 'SAMEORIGIN', passTag2()],
    ['TC-011', 'X-Content-Type-Options', 'nosniff', passTag2()],
    ['TC-012', 'Permissions-Policy', 'camera=(), microphone=(), geolocation=()', passTag2()],
  ]

  const codeReviewRows = [
    ['TC-004', 'Social links', '"getbarberboost" appears 9× in homepage HTML (3 platforms × header + footer)', passTag2()],
    ['TC-049', 'Public booking rate limit', 'rateLimit(\'public_booking:\', 10, 60) present in /api/public/bookings', passTag2()],
    ['TC-075', 'AI copy rate limit', 'rateLimit(\'ai_copy:\', 5, 60) present in /api/ai-copy', passTag2()],
    ['TC-079', 'Stripe priceId whitelist', 'VALID_PRICE_IDS.has(priceId) check before Stripe API call', passTag2()],
    ['TC-080', 'Webhook — subscription upsert', 'checkout.session.completed → upsert to subscriptions table', passTag2()],
    ['TC-081', 'Webhook — payment fail email', 'await sendPaymentFailedEmail() — awaited, not fire-and-forget', passTag2()],
    ['TC-082', 'Webhook — receipt email', 'await sendPaymentReceiptEmail() — awaited, not fire-and-forget', passTag2()],
    ['TC-096', 'Error boundaries', 'error.tsx exists at app, dashboard, auth, and marketing levels', passTag2()],
    ['TC-100', 'TypeScript integrity', 'npx tsc --noEmit → exit code 0, zero errors', passTag2()],
  ]

  const buildRows = [
    ['Production build', 'Compiled in 12.2 s, Turbopack', passTag2()],
    ['TypeScript check', '0 errors across all source files', passTag2()],
    ['Static pages generated', '50 / 50 pages generated successfully', passTag2()],
    ['Route manifest', 'All 21 API routes present; /api/send-email absent', passTag2()],
    ['Vercel deployment', 'fa5e12b deployed to https://barberboost.app', passTag2()],
  ]

  return [
    h1('1. Automated Test Results'),
    bodyPara('All automated tests were executed against the live production deployment on 10 May 2026 at https://barberboost.app using curl, TypeScript compiler, and code review.'),
    sp(80),
    h2('1.1  HTTP Endpoint Checks'),
    brandTableEx(['TC', 'Method', 'URL / Endpoint', 'Expected', 'Result'], httpRows, [8, 7, 42, 20, 23]),
    sp(120),
    h2('1.2  Security Headers (curl -I https://barberboost.app/)'),
    brandTableEx(['TC', 'Header', 'Expected Value', 'Result'], headerRows, [8, 28, 41, 23]),
    sp(120),
    h2('1.3  Code-Review Verified Checks'),
    brandTableEx(['TC', 'Area', 'Finding', 'Result'], codeReviewRows, [8, 22, 47, 23]),
    sp(120),
    h2('1.4  Build & Deploy Verification'),
    brandTableEx(['Check', 'Detail', 'Result'], buildRows, [25, 52, 23]),
    pageBreak(),
  ]
}

// ─── Section 2 — Security Remediation ───────────────────────────────────────
function securityRemediation() {
  const rows = [
    [sevTag('Critical', G.RED, G.RED_BG), '/api/send-email — unauthenticated open email relay', 'Route deleted (no internal callers existed)', passTag2()],
    [sevTag('Critical', G.RED, G.RED_BG), '/api/signup-notify — no auth or rate limiting', 'IP rate limit (5/min) added; excess silently returns 200', passTag2()],
    [sevTag('Critical', G.RED, G.RED_BG), 'Webhook billing emails not awaited — silent drop risk', 'Added await to sendPaymentFailedEmail and sendPaymentReceiptEmail', passTag2()],
    [sevTag('High', G.ORANGE, G.AMBER_BG), 'Campaigns PATCH — all fields writable (mass-assignment)', 'Explicit allowlist: name, type, subject, content, target_segment, status, scheduled_at, sent_count, open_rate, sent_at', passTag2()],
    [sevTag('Medium', G.AMBER, G.AMBER_BG), 'Contact form — name/subject/message unescaped in HTML email', 'All four fields passed through esc() before HTML interpolation', passTag2()],
    [sevTag('Medium', G.AMBER, G.AMBER_BG), 'Stripe checkout — arbitrary priceId accepted', 'VALID_PRICE_IDS Set built from PLANS; unknown IDs → 400', passTag2()],
    [sevTag('Medium', G.AMBER, G.AMBER_BG), 'CONTACT_EMAIL / NOTIFY_EMAIL undocumented', 'Both vars added to .env.example with descriptions', passTag2()],
    [sevTag('Low', G.GREY, G.PALE), 'No Content-Security-Policy header', 'CSP added to vercel.json global headers; confirmed in live response', passTag2()],
  ]

  return [
    h1('2. Security Remediation Summary'),
    bodyPara('Eight security issues were identified during the pre-UAT code review and resolved prior to this test run. All are verified against the live deployment.'),
    sp(80),
    brandTableEx(['Severity', 'Issue', 'Resolution', 'Verified'], rows, [10, 35, 35, 20]),
    pageBreak(),
  ]
}

// ─── Section 3 — Manual Test Checklist ──────────────────────────────────────
const CHKHEADERS = ['TC', 'Test Case', 'Expected Outcome', 'Result', 'Tester', 'Notes']
const CHKWIDTHS  = [7, 34, 29, 12, 9, 9]
const P = () => warnTag()   // pending slot

function chkRow(tc, test, expected) {
  return [tc, test, expected, P(), '', '']
}

function manualChecklist() {
  const sections = [
    {
      title: '3.1  Marketing & Contact',
      rows: [
        chkRow('TC-003', 'Pricing page — all four plans visible with correct prices (Free / £19 / £39 / £79)', 'All four plans shown; Starter has "Most Popular" badge'),
        chkRow('TC-004', 'Desktop header: three social icons visible; each opens correct URL in new tab', 'FB → facebook.com/getbarberboost; IG → instagram.com/getbarberboost; TT → tiktok.com/@getbarberboost'),
        chkRow('TC-004b', 'Mobile hamburger menu: social icons appear below "Start Free" button', '3 bordered icon tiles visible on ≤ md breakpoint'),
        chkRow('TC-007', 'Contact form submission with valid data', 'Success state shown; email delivered to CONTACT_EMAIL'),
      ],
    },
    {
      title: '3.2  Authentication',
      rows: [
        chkRow('TC-017', 'New user signup with name, email, shop name, password ≥ 8 chars', 'Redirect to dashboard; onboarding checklist shown'),
        chkRow('TC-017b', 'Signup with an already-registered email', 'Clear error message shown; no duplicate account created'),
        chkRow('TC-017c', 'Signup with password shorter than 8 characters', 'Client-side validation error before form submits'),
        chkRow('TC-018', 'Login with valid email and password', 'Redirect to /dashboard'),
        chkRow('TC-019', 'Login with wrong password', 'Error: "Incorrect email or password"; no lockout on first attempt'),
        chkRow('TC-020', 'Full password reset flow: request link → receive email → set new password', 'Can log in with new password after reset'),
        chkRow('TC-021', 'Authenticated user navigates directly to /login', 'Redirect to /dashboard'),
        chkRow('TC-022', 'Sign out via account menu', 'Session cleared; /dashboard redirects to /login'),
      ],
    },
    {
      title: '3.3  Onboarding',
      rows: [
        chkRow('TC-023', 'Fresh account sees onboarding checklist on dashboard', '5-step checklist visible: services, staff, opening hours, first booking, first client'),
        chkRow('TC-024', 'Checklist auto-hides when all 5 steps are completed', 'Checklist section disappears from dashboard view'),
      ],
    },
    {
      title: '3.4  Shop Settings',
      rows: [
        chkRow('TC-025', 'Update shop name and description; save', 'Changes persist after page refresh; success toast appears'),
        chkRow('TC-026', 'Enter slug with uppercase letters or spaces; attempt save', 'Validation error shown; save blocked'),
        chkRow('TC-027', 'Set Monday to Closed, Tuesday 09:00–18:00; save; verify public booking page', 'No slots on Monday; Tuesday slots available 09:00–18:00'),
        chkRow('TC-028', 'Upload a logo image < 2 MB', 'Logo visible in settings and on booking page; persists after refresh'),
        chkRow('TC-028b', 'Attempt logo upload > 2 MB', 'Error message shown; upload rejected'),
      ],
    },
    {
      title: '3.5  Services',
      rows: [
        chkRow('TC-029', 'Create a new service with name, price, duration, category', 'Service appears in list; visible in public booking dropdown'),
        chkRow('TC-030', 'Free plan: attempt to add 6th service', '403 error: "Service limit reached (5 on Free plan)"'),
        chkRow('TC-031', 'Edit existing service price; save', 'Updated price shown; no disruption to existing bookings'),
        chkRow('TC-032', 'Toggle service to inactive', 'Service hidden from public booking page; inactive badge in dashboard'),
      ],
    },
    {
      title: '3.6  Staff',
      rows: [
        chkRow('TC-033', 'Add a new staff member with name, role, commission rate', 'Staff card appears; staff visible in booking creation dropdown'),
        chkRow('TC-034', 'Free plan: attempt to add 2nd active staff member', '403 error: "Staff limit reached (1 on Free plan)"'),
        chkRow('TC-035', 'Set staff working hours Mon–Fri only; check Saturday availability', 'No slots shown for Saturday on public booking page'),
        chkRow('TC-036', 'Staff detail → Commission tab: toggle This Month / Last Month', 'Commission = revenue × commission rate; updates on toggle'),
      ],
    },
    {
      title: '3.7  Bookings (Dashboard)',
      rows: [
        chkRow('TC-037', 'Create a booking via dashboard; confirm client email received', 'Booking appears in list and today\'s schedule; email in client inbox'),
        chkRow('TC-038', 'Create two overlapping bookings for same staff, same date', 'Second booking rejected: "Time slot is already taken" (409)'),
        chkRow('TC-039', 'Mark a booking as Completed', 'Status badge updates to Completed; counts toward revenue analytics'),
        chkRow('TC-040', 'Cancel a booking; confirm cancellation email sent', 'Status = Cancelled; email received; slot available again'),
        chkRow('TC-041', 'Free plan with 30 bookings this month: attempt 31st', '403 error: "Monthly booking limit reached (30 on Free plan)"'),
        chkRow('TC-042', 'Search bookings by partial client name', 'List filters to matching entries only'),
        chkRow('TC-043', 'Search bookings by BB- reference number', 'Single matching booking returned'),
      ],
    },
    {
      title: '3.8  Public Booking Page',
      rows: [
        chkRow('TC-044', 'Load /booking/{slug} for a valid shop', 'Shop name, services, staff visible; no login required'),
        chkRow('TC-045', 'Select service, staff, and date; confirm slots match working hours', 'Only open hours shown; already-booked slots absent'),
        chkRow('TC-046', 'Select a day the shop or staff member is marked closed', '"No available slots" shown; no times listed'),
        chkRow('TC-047', 'Submit a complete booking via public page', '201 created; confirmation email sent to client email'),
        chkRow('TC-048', 'Attempt to select a past date in the date picker', 'UI prevents selection; API returns 400 if bypassed'),
        chkRow('TC-050', 'Select a date more than 60 days ahead', 'No slots shown; "No available slots" message'),
      ],
    },
    {
      title: '3.9  Clients',
      rows: [
        chkRow('TC-051', 'Add client manually with name, email, phone', 'Client appears in list; visit and spend counters at 0'),
        chkRow('TC-052', 'Search clients by partial name', 'List filters in real time'),
        chkRow('TC-053', 'Open client profile for a client with bookings; check Bookings tab', 'Full history shown; stats match actual booking data'),
        chkRow('TC-054', 'Verify VIP tag on a high-spend client', 'Gold VIP badge visible on client card and profile'),
        chkRow('TC-055', 'Import a valid CSV with name, email, phone columns', 'Clients imported; duplicate emails reported as skipped'),
        chkRow('TC-056', 'Import a CSV with no "name" column header', 'Error: "No valid rows found. Make sure your CSV has a name column header."'),
        chkRow('TC-057', 'Import a CSV with more than 500 rows', 'Error: "Maximum 500 rows per import. Split your file and try again."'),
        chkRow('TC-058', 'Export clients to CSV', 'File downloaded with headers: name, email, phone, notes, tags, total_visits, total_spent, created_at'),
        chkRow('TC-059', 'Free plan at 50 clients: attempt to add 51st', 'Plan limit error shown; client not created'),
      ],
    },
    {
      title: '3.10  Analytics',
      rows: [
        chkRow('TC-060', 'Navigate to /analytics; confirm KPI cards load', '4 cards visible: Revenue, Bookings, New Clients, No-Show Rate — all with % change'),
        chkRow('TC-061', 'Switch date range: Today → This Week → This Month → Last 30 Days', 'Charts and KPIs update correctly for each range'),
        chkRow('TC-062', 'Free plan: services chart, status donut, staff leaderboard, heatmap', 'All locked with blur and upgrade CTA'),
        chkRow('TC-063', 'Starter plan: client insights panel', 'Locked — "Upgrade to Pro" prompt visible'),
        chkRow('TC-064', 'Pro plan: financial summary (Empire feature)', 'Locked — "Upgrade to Empire" prompt visible'),
        chkRow('TC-065', 'Pro+ plan: click Export; download CSV', 'CSV file downloaded with booking data for selected period'),
      ],
    },
    {
      title: '3.11  Inventory',
      rows: [
        chkRow('TC-066', 'Free or Starter plan: navigate to /inventory', 'Blurred locked preview shown with upgrade CTA'),
        chkRow('TC-067', 'Pro+ plan: add inventory item with name, category, qty, threshold, cost, retail', 'Item in list; cost value = cost × qty; retail value = retail × qty'),
        chkRow('TC-068', 'Adjust stock on existing item: delta +5', 'New quantity = old + 5; no error'),
        chkRow('TC-069', 'Adjust stock so quantity falls to or below threshold', 'Low-stock alert email sent to owner; item highlighted Critical in UI'),
        chkRow('TC-070', 'Filter by category; search by product name', 'List filters correctly; item count updates'),
      ],
    },
    {
      title: '3.12  Marketing Campaigns',
      rows: [
        chkRow('TC-071', 'Free plan: navigate to /marketing', 'Upgrade prompt shown; create button locked'),
        chkRow('TC-072', 'Starter+ plan: create a campaign as Draft (email, all clients, subject, content)', 'Campaign appears in list with Draft status'),
        chkRow('TC-073', 'Starter plan: create 3rd campaign in same calendar month', '403 error: "Monthly campaign limit reached (2 on Starter plan)"'),
        chkRow('TC-074', 'Empire plan: create campaign → Use AI Copy → select tone and segment → generate', 'Returns 3 subject lines, email body (150–250 words), SMS ≤ 160 chars'),
        chkRow('TC-076', 'Edit a Draft campaign: change subject; save', 'Subject updated; shop_id unchanged (whitelist enforced)'),
        chkRow('TC-077', 'Delete a Draft campaign', 'Campaign removed from list'),
      ],
    },
    {
      title: '3.13  Billing & Stripe',
      rows: [
        chkRow('TC-078', 'Upgrade to Starter via /settings/billing using test card 4242...', 'Redirect to /dashboard?upgraded=true; plan badge shows Starter; limits updated'),
        chkRow('TC-080', 'After checkout: verify subscription row exists in Supabase', 'Row present with correct plan, status=active, period dates'),
        chkRow('TC-081', 'Stripe CLI: trigger invoice.payment_failed', 'Payment failure email received at subscriber\'s email address'),
        chkRow('TC-082', 'Stripe CLI: trigger invoice.payment_succeeded (renewal)', 'Payment receipt email received (not sent for initial subscription_create)'),
        chkRow('TC-083', 'Click "Manage Billing" in billing settings', 'Redirected to Stripe Customer Portal; can update card, view invoices, cancel'),
        chkRow('TC-084', 'Cancel subscription via Stripe portal; observe webhook', 'Subscription status → cancelled; plan reverts to Free at period end'),
      ],
    },
    {
      title: '3.14  Reminders & Notifications',
      rows: [
        chkRow('TC-085', 'Create booking for tomorrow; trigger cron with correct Bearer token', 'Reminder email received; booking.reminder_sent = true in DB'),
        chkRow('TC-086', 'Create booking with phone number; trigger cron', 'WhatsApp reminder sent (requires Twilio configured in .env)'),
        chkRow('TC-087', 'Free plan booking: trigger cron', 'Booking skipped (plan gate); skipped counter incremented in cron response'),
        chkRow('TC-088', 'Create activity that triggers notification; open notification bell', 'Unread badge count shown; notifications load; mark all read clears badge'),
      ],
    },
    {
      title: '3.15  Signup Notification',
      rows: [
        chkRow('TC-089', 'Register a new account; check admin inbox', 'New-signup alert email received at NOTIFY_EMAIL address'),
      ],
    },
    {
      title: '3.16  Responsive Design',
      rows: [
        chkRow('TC-091', 'Open site at < 768px; click hamburger icon', 'Mobile menu opens; shows nav links, Login, Start Free, and 3 social icon tiles'),
        chkRow('TC-092', 'Confirm social icon tiles in mobile menu', 'Facebook, Instagram, TikTok tiles visible below "Start Free" button'),
        chkRow('TC-093', 'View /dashboard at 375px (iPhone SE)', 'Sidebar collapses to bottom nav; stat cards stack vertically; no horizontal scroll'),
        chkRow('TC-094', 'Open /booking/{slug} on a mobile device', 'Full booking flow usable: service picker → slots → form → confirm'),
      ],
    },
    {
      title: '3.17  Edge Cases',
      rows: [
        chkRow('TC-095', 'Navigate to a non-existent URL (e.g. /this-page-does-not-exist)', 'Custom 404 page shown with link to return home'),
        chkRow('TC-096', 'Verify error boundary catches component failures gracefully', 'Graceful error UI shown (not blank page); error.tsx exists at all route group levels'),
        chkRow('TC-098', 'Log in as User B; attempt GET /api/bookings?shop_id={User A\'s shop_id}', '403 Forbidden returned; no data leaked'),
        chkRow('TC-099', 'View major dashboard sections on 3G throttle (DevTools Network)', 'Skeleton loaders shown during load; no blank flash or layout shift'),
      ],
    },
  ]

  const children = [
    h1('3. Manual Test Checklist'),
    bodyPara('The following 66 test cases require tester sign-off. Testers should update the Result column (✓ Pass / ✗ Fail / ⚠ Partial) and add notes for any failures.'),
    sp(80),
    // Test card legend
    new Paragraph({
      children: [
        boldRun('Test card: ', { size: pt(9) }),
        run('4242 4242 4242 4242 | any future expiry | any CVC  ', { size: pt(9) }),
        boldRun('Stripe CLI: ', { size: pt(9) }),
        run('stripe listen --forward-to localhost:3000/api/stripe/webhook', { size: pt(9), font: 'Courier New' }),
      ],
      shading: { type: ShadingType.SOLID, color: G.PALE },
      spacing: { before: 40, after: 160 },
      indent: { left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
    }),
  ]

  for (const s of sections) {
    children.push(h2(s.title))
    children.push(brandTableEx(CHKHEADERS, s.rows, CHKWIDTHS))
    children.push(sp(100))
  }

  children.push(pageBreak())
  return children
}

// ─── Section 4 — Post-UAT Backlog ────────────────────────────────────────────
function backlog() {
  const rows = [
    [
      sevTag('High', G.ORANGE, G.AMBER_BG),
      'POST-01',
      'Rate limiting is in-memory per Vercel instance; concurrent requests across instances can bypass it',
      'Replace with Redis-backed rate limiter (e.g. Upstash) before high-traffic launch',
      'Pre-GA',
    ],
    [
      sevTag('Medium', G.AMBER, G.AMBER_BG),
      'POST-02',
      'sent_count and open_rate are in the campaigns PATCH whitelist; if campaign sending is automated, these should only be set server-side',
      'Move to a trusted server function when campaign-send automation is built',
      'Pre-GA',
    ],
    [
      sevTag('Medium', G.AMBER, G.AMBER_BG),
      'POST-03',
      'CSP uses \'unsafe-inline\' and \'unsafe-eval\' (required for Next.js without nonces)',
      'Implement nonce-based CSP in middleware for a stricter policy',
      'Post-GA',
    ],
    [
      sevTag('Low', G.GREY, G.PALE),
      'POST-04',
      'No user-friendly error if chosen booking page slug is already taken by another shop',
      'Add explicit uniqueness check in /api/shops PATCH with a clear error message',
      'Post-GA',
    ],
    [
      sevTag('Low', G.GREY, G.PALE),
      'POST-05',
      'If STRIPE_*_PRICE_ID env vars are unset, VALID_PRICE_IDS is empty and all checkout attempts fail with 400',
      'Add startup validation to fail fast with a clear configuration error on boot',
      'Pre-GA',
    ],
  ]

  return [
    h1('4. Post-UAT Backlog'),
    bodyPara('The following items were identified during review and do not block UAT. They should be resolved before General Availability where marked Pre-GA.'),
    sp(80),
    brandTableEx(['Priority', 'ID', 'Issue', 'Recommended Action', 'Timeline'], rows, [10, 8, 32, 32, 18]),
    pageBreak(),
  ]
}

// ─── Section 5 — Sign-off ────────────────────────────────────────────────────
function signOff() {
  const sigRow = (role, name = '', date = '') => new TableRow({
    children: [
      cell(role, { bold: true, bg: G.PALE, width: 25 }),
      cell(name, { bg: G.WHITE, width: 35 }),
      cell('', { bg: G.WHITE, width: 22 }),  // signature
      cell(date, { bg: G.WHITE, width: 18 }),
    ],
  })

  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell('Role', 25), headerCell('Full Name', 35),
          headerCell('Signature', 22), headerCell('Date', 18),
        ],
      }),
      sigRow('Product Owner'),
      sigRow('Lead Developer', 'Dan Jatau', '10 May 2026'),
      sigRow('QA Lead'),
      sigRow('UAT Tester 1'),
      sigRow('UAT Tester 2'),
    ],
  })

  return [
    h1('5. Sign-off'),
    bodyPara('By signing below, each party confirms they have reviewed the relevant test results and the UAT outcome decision.'),
    sp(120),
    new Paragraph({
      children: [
        new TextRun({ text: 'UAT Outcome:', bold: true, font: 'Calibri', size: pt(10.5), color: G.DARK }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({ children: [run('☐  PASS — all manual tests signed off; proceed to production release')], spacing: { after: 60 } }),
    new Paragraph({ children: [run('☐  CONDITIONAL PASS — minor issues logged; proceed with known post-UAT backlog')], spacing: { after: 60 } }),
    new Paragraph({ children: [run('☐  FAIL — blocking issues found; re-test required after fixes')], spacing: { after: 160 } }),
    sigTable,
    pageBreak(),
  ]
}

// ─── Appendices ──────────────────────────────────────────────────────────────
function appendices() {
  const envRows = [
    ['Production URL', 'https://barberboost.app'],
    ['Git branch', 'development'],
    ['Commit SHA', 'fa5e12b (UAT-hardened)'],
    ['Deployment ID', 'dpl_8EkG1BqFrTYzv13zzcFE691PqdgL'],
    ['Next.js version', '16.2.2 (Turbopack)'],
    ['Node runtime', 'Vercel iad1 — Washington DC'],
    ['Stripe mode', 'Test'],
    ['Test date', '10 May 2026'],
  ]

  const automatedCmds = [
    '# TypeScript integrity check',
    'npx tsc --noEmit',
    '',
    '# Security headers',
    'curl -I https://barberboost.app/',
    '',
    '# Route guards (expect 307)',
    'for path in /dashboard /bookings /clients /analytics /settings; do',
    '  curl -o /dev/null -w "$path → %{http_code}\\n" https://barberboost.app$path',
    'done',
    '',
    '# API auth (expect 401)',
    'for ep in /api/bookings /api/clients /api/campaigns /api/inventory /api/staff; do',
    '  curl -o /dev/null -w "$ep → %{http_code}\\n" https://barberboost.app$ep',
    'done',
    '',
    '# Deleted endpoint (expect 404)',
    'curl -o /dev/null -w "%{http_code}" -X POST https://barberboost.app/api/send-email',
    '',
    '# Cron bad token (expect 401)',
    'curl https://barberboost.app/api/cron/reminders -H "Authorization: Bearer wrong"',
    '',
    '# Contact form validation (expect 400)',
    'curl -X POST https://barberboost.app/api/contact \\',
    '  -H "Content-Type: application/json" -d \'{}\'',
    '',
    '# Rate limit — silent absorption (expect 200 ×7)',
    'for i in {1..7}; do',
    '  curl -o /dev/null -w "%{http_code}\\n" -X POST https://barberboost.app/api/signup-notify \\',
    '    -H "Content-Type: application/json" \\',
    '    -d \'{"email":"a@b.com","fullName":"Test","shopName":"Shop"}\'',
    'done',
  ]

  const stripeCmds = [
    '# Forward webhook events to local dev server',
    'stripe listen --forward-to localhost:3000/api/stripe/webhook',
    '',
    '# Trigger TC-081: payment failure email',
    'stripe trigger invoice.payment_failed',
    '',
    '# Trigger TC-082: renewal receipt email',
    'stripe trigger invoice.payment_succeeded',
    '',
    '# Trigger TC-084: subscription cancelled',
    'stripe trigger customer.subscription.deleted',
    '',
    '# Trigger TC-078: checkout completed (subscription created)',
    'stripe trigger checkout.session.completed',
  ]

  return [
    h1('Appendix A — Test Environment'),
    brandTable(['Item', 'Detail'], envRows, [30, 70]),
    sp(160),
    pageBreak(),
    h1('Appendix B — Automated Test Commands'),
    bodyPara('Run these commands from any terminal to reproduce the automated test results in Section 1. Requires curl and Node.js.'),
    sp(80),
    ...automatedCmds.map(codePara),
    sp(160),
    h1('Appendix C — Stripe CLI Commands'),
    bodyPara('Use the Stripe CLI to trigger webhook events for billing tests (TC-081, TC-082, TC-084). Requires stripe CLI and STRIPE_WEBHOOK_SECRET configured.'),
    sp(80),
    ...stripeCmds.map(codePara),
  ]
}

// ─── Assemble & write ────────────────────────────────────────────────────────
async function main() {
  const doc = new Document({
    creator:     'BarberBoost',
    title:       'BarberBoost UAT Test Report',
    subject:     'User Acceptance Testing — Pre-Launch',
    description: 'Full UAT test report for BarberBoost v1.0, 10 May 2026',
    keywords:    'UAT, QA, barberboost, testing',
    sections: [
      // Section 1: Cover page — no running header/footer
      {
        properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.25), right: convertInchesToTwip(1.25) } } },
        children: coverChildren(),
      },
      // Section 2: Main content — with branded header/footer
      {
        properties: { page: { margin: { top: convertInchesToTwip(1.1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.25), right: convertInchesToTwip(1.25) } } },
        headers: { default: makeHeader() },
        footers: { default: makeFooter() },
        children: [
          ...execSummary(),
          ...automatedResults(),
          ...securityRemediation(),
          ...manualChecklist(),
          ...backlog(),
          ...signOff(),
          ...appendices(),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  const out = path.join(ROOT, 'docs', 'BarberBoost-UAT-Test-Report.docx')
  writeFileSync(out, buffer)
  console.log(`\n✓ Written: ${out}\n  Size: ${(buffer.byteLength / 1024).toFixed(1)} KB`)
}

main().catch((e) => { console.error(e); process.exit(1) })
