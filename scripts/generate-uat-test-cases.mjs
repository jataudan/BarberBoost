/**
 * BarberBoost UAT Test Cases Generator
 * Produces a fully branded DOCX from the UAT test cases data using docx v9.
 * Run: node scripts/generate-uat-test-cases.mjs
 */

import {
  AlignmentType, BorderStyle, convertInchesToTwip, Document,
  Footer, Header, ImageRun, Packer, PageBreak,
  PageNumber, Paragraph, ShadingType, Table, TableCell, TableRow,
  TextRun, WidthType,
} from 'docx'
import { writeFileSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')
const logo      = readFileSync(path.join(ROOT, 'public/logo.png'))

// ─── Brand palette ──────────────────────────────────────────────────────────
const G = {
  GOLD:       'C9A84C',
  GOLD_DARK:  'A8872E',
  GOLD_LIGHT: 'FDF8EE',
  DARK:       '111827',
  MID:        '374151',
  GREY:       '6B7280',
  LGREY:      '9CA3AF',
  WHITE:      'FFFFFF',
  PALE:       'F9FAFB',
  BORDER:     'E5E7EB',
  GREEN:      '15803D',
  GREEN_BG:   'DCFCE7',
  RED:        'B91C1C',
  RED_BG:     'FEE2E2',
  AMBER:      'B45309',
  AMBER_BG:   'FEF3C7',
  BLUE:       '1D4ED8',
  BLUE_BG:    'DBEAFE',
}

const pt    = (n) => n * 2
const sp    = (n = 160) => new Paragraph({ spacing: { after: n } })

const cellBorder   = { style: BorderStyle.SINGLE, size: 4, color: G.BORDER }
const noBorder     = { style: BorderStyle.NONE, size: 0, color: 'auto' }
const allBorders   = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder }
const noTblBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder }

function run(text, opts = {}) {
  return new TextRun({ text: String(text ?? ''), font: 'Calibri', size: pt(10), color: G.DARK, ...opts })
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
    spacing: { before: 200, after: 60 },
  })
}

function bodyPara(text) {
  return para([run(text)])
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] })
}

function cellMargins() {
  return {
    top: convertInchesToTwip(0.04),
    bottom: convertInchesToTwip(0.04),
    left: convertInchesToTwip(0.07),
    right: convertInchesToTwip(0.07),
  }
}

// ─── TC table helper ─────────────────────────────────────────────────────────
// Layout: 3 columns — label (12%) | content (68%) | badge (20%)
// Steps/Expected/Result rows span cols 2+3 (columnSpan: 2)

function tcTable(id, title, type, steps, expected, result) {
  const isAuto   = type === 'auto'
  const isBoth   = type === 'both'
  const isManual = type === 'manual'

  const typeBg    = isAuto ? G.GREEN_BG : isBoth ? G.AMBER_BG : G.BLUE_BG
  const typeColor = isAuto ? G.GREEN    : isBoth ? G.AMBER    : G.BLUE
  const typeLabel = isAuto ? 'AUTOMATED' : isBoth ? 'AUTOMATED + MANUAL' : 'MANUAL'

  const stepsArr = Array.isArray(steps) ? steps : (steps ? [steps] : [])

  const labelCell = (text) => new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, font: 'Calibri', size: pt(8.5), bold: true, color: G.GREY })],
      spacing: { after: 0 },
    })],
    shading: { type: ShadingType.SOLID, color: G.PALE },
    borders: allBorders,
    margins: cellMargins(),
    width: { size: 12, type: WidthType.PERCENTAGE },
  })

  const spanCell = (paragraphs) => new TableCell({
    children: paragraphs,
    borders: allBorders,
    margins: cellMargins(),
    columnSpan: 2,
  })

  const rows = [
    // Row 1: ID | Title | Type badge
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: id, font: 'Calibri', size: pt(9), bold: true, color: G.WHITE })],
            spacing: { after: 0 },
            alignment: AlignmentType.CENTER,
          })],
          shading: { type: ShadingType.SOLID, color: G.GOLD },
          borders: allBorders,
          margins: cellMargins(),
          width: { size: 12, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: title, font: 'Calibri', size: pt(10), bold: true, color: G.DARK })],
            spacing: { after: 0 },
          })],
          shading: { type: ShadingType.SOLID, color: G.WHITE },
          borders: allBorders,
          margins: cellMargins(),
          width: { size: 68, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: typeLabel, font: 'Calibri', size: pt(8), bold: true, color: typeColor })],
            spacing: { after: 0 },
            alignment: AlignmentType.CENTER,
          })],
          shading: { type: ShadingType.SOLID, color: typeBg },
          borders: allBorders,
          margins: cellMargins(),
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
  ]

  // Steps row
  if (stepsArr.length > 0) {
    rows.push(new TableRow({
      children: [
        labelCell('Steps'),
        spanCell(stepsArr.map((s, i) => new Paragraph({
          children: [new TextRun({ text: s, font: 'Calibri', size: pt(9), color: G.DARK })],
          spacing: { after: i < stepsArr.length - 1 ? 40 : 0 },
        }))),
      ],
    }))
  }

  // Expected row
  rows.push(new TableRow({
    children: [
      labelCell('Expected'),
      spanCell([new Paragraph({
        children: [new TextRun({ text: expected, font: 'Calibri', size: pt(9), color: G.MID })],
        spacing: { after: 0 },
      })]),
    ],
  }))

  // Result row
  if (result !== null && result !== undefined) {
    rows.push(new TableRow({
      children: [
        labelCell('Result'),
        spanCell([new Paragraph({
          children: [new TextRun({ text: '✓ ' + result, font: 'Calibri', size: pt(9), bold: true, color: G.GREEN })],
          spacing: { after: 0 },
        })]),
      ],
    }))
  } else {
    rows.push(new TableRow({
      children: [
        labelCell('Result'),
        spanCell([new Paragraph({
          children: [new TextRun({ text: '☐  Pass    ☐  Fail    ☐  Partial', font: 'Calibri', size: pt(9), color: G.LGREY })],
          spacing: { after: 0 },
        })]),
      ],
    }))
  }

  return [
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
    sp(80),
  ]
}

// ─── Header / Footer ─────────────────────────────────────────────────────────
function makeHeader() {
  return new Header({
    children: [
      new Paragraph({
        tabStops: [{ type: 'right', position: convertInchesToTwip(6.27) }],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: G.GOLD } },
        spacing: { after: 80 },
        children: [
          new ImageRun({ data: logo, transformation: { width: 120, height: 24 }, type: 'png' }),
          new TextRun('\t'),
          new TextRun({ text: 'UAT Test Cases — Pre-Launch', font: 'Calibri', size: pt(8.5), color: G.GREY, italics: true }),
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
          { type: 'center', position: convertInchesToTwip(3.135) },
          { type: 'right',  position: convertInchesToTwip(6.27) },
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

// ─── Cover page ──────────────────────────────────────────────────────────────
function coverChildren() {
  const metaRow = (k, v) => new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: k, font: 'Calibri', size: pt(9.5), bold: true, color: G.MID })], spacing: { after: 0 } })],
        shading: { type: ShadingType.SOLID, color: G.PALE },
        borders: allBorders,
        margins: cellMargins(),
        width: { size: 25, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: v, font: 'Calibri', size: pt(9.5), color: G.DARK })], spacing: { after: 0 } })],
        shading: { type: ShadingType.SOLID, color: G.WHITE },
        borders: allBorders,
        margins: cellMargins(),
        width: { size: 75, type: WidthType.PERCENTAGE },
      }),
    ],
  })

  return [
    new Paragraph({ spacing: { before: convertInchesToTwip(1.5), after: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: logo, transformation: { width: 280, height: 56 }, type: 'png' })],
      spacing: { after: 320 },
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: G.GOLD } },
      children: [],
      spacing: { after: 280 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: 'UAT TEST CASES', bold: true, font: 'Calibri', size: pt(30), color: G.GOLD })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [new TextRun({ text: 'User Acceptance Testing — 100 Test Cases Across 18 Modules', font: 'Calibri', size: pt(13), color: G.MID })],
    }),
    new Table({
      width: { size: 60, type: WidthType.PERCENTAGE },
      borders: noTblBorders,
      rows: [
        metaRow('Version',        '1.0'),
        metaRow('Date',           '10 May 2026'),
        metaRow('Environment',    'https://barberboost.app'),
        metaRow('Total TCs',      '100 (34 Automated, 66 Manual)'),
        metaRow('Modules',        '18'),
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

// ─── Conventions ─────────────────────────────────────────────────────────────
function conventions() {
  const hdrCell = (text, w) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, font: 'Calibri', size: pt(9), bold: true, color: G.WHITE })], spacing: { after: 0 } })],
    shading: { type: ShadingType.SOLID, color: G.GOLD },
    borders: allBorders,
    margins: cellMargins(),
    width: { size: w, type: WidthType.PERCENTAGE },
  })

  const twoCell = (a, b, bg) => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a, font: 'Calibri', size: pt(9.5), bold: true, color: G.DARK })], spacing: { after: 0 }, alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: bg || G.WHITE }, borders: allBorders, margins: cellMargins(), width: { size: 20, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: b, font: 'Calibri', size: pt(9.5), color: G.MID })], spacing: { after: 0 } })], shading: { type: ShadingType.SOLID, color: G.WHITE }, borders: allBorders, margins: cellMargins(), width: { size: 80, type: WidthType.PERCENTAGE } }),
    ],
  })

  const legendTable = new Table({
    width: { size: 80, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: [hdrCell('Symbol', 20), hdrCell('Meaning', 80)] }),
      twoCell('AUTOMATED', 'Test verified programmatically — curl, TypeScript compiler, or code review', G.GREEN_BG),
      twoCell('MANUAL', 'Test requires browser interaction or manual verification', G.BLUE_BG),
      twoCell('AUTOMATED + MANUAL', 'Partially automated; manual browser sign-off also required', G.AMBER_BG),
      twoCell('✓ PASS', 'Test passed'),
      twoCell('✗ FAIL', 'Test failed — issue logged'),
      twoCell('⚠ Partial', 'Conditional pass — minor issue noted'),
    ],
  })

  const preCondBox = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noTblBorders,
    rows: [new TableRow({
      children: [new TableCell({
        shading: { type: ShadingType.SOLID, color: G.GOLD_LIGHT },
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 8, color: G.GOLD },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: G.GOLD },
          left:   { style: BorderStyle.SINGLE, size: 8, color: G.GOLD },
          right:  { style: BorderStyle.SINGLE, size: 8, color: G.GOLD },
        },
        margins: { top: convertInchesToTwip(0.1), bottom: convertInchesToTwip(0.1), left: convertInchesToTwip(0.15), right: convertInchesToTwip(0.15) },
        children: [
          new Paragraph({ children: [new TextRun({ text: 'Pre-conditions for all manual tests', bold: true, font: 'Calibri', size: pt(10), color: G.GOLD_DARK })], spacing: { after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: '1.  Tester has a registered BarberBoost account', font: 'Calibri', size: pt(9.5), color: G.MID })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: '2.  A shop has been created during onboarding', font: 'Calibri', size: pt(9.5), color: G.MID })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: '3.  At least one service and one staff member exist', font: 'Calibri', size: pt(9.5), color: G.MID })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: '4.  Test Stripe card: 4242 4242 4242 4242 | any future expiry | any CVC', font: 'Calibri', size: pt(9.5), color: G.MID, font: 'Courier New' })], spacing: { after: 0 } }),
        ],
      })],
    })],
  })

  return [
    h1('Conventions & Pre-conditions'),
    sp(80),
    legendTable,
    sp(160),
    preCondBox,
    pageBreak(),
  ]
}

// ─── Test case data ───────────────────────────────────────────────────────────
const MODULES = [
  {
    num: 1, title: 'MODULE 1 — Marketing Pages',
    cases: [
      { id: 'TC-001', title: 'Homepage loads correctly', type: 'auto',
        steps: ['GET https://barberboost.app/'],
        expected: 'HTTP 200, Content-Type: text/html',
        result: 'PASS (200)' },
      { id: 'TC-002', title: 'Features page loads', type: 'auto',
        steps: ['GET https://barberboost.app/features'],
        expected: 'HTTP 200',
        result: 'PASS' },
      { id: 'TC-003', title: 'Pricing page loads and shows all four plans', type: 'both',
        steps: [
          '1. GET https://barberboost.app/pricing (automated)',
          '2. Open in browser; confirm Free / Starter (£19) / Pro (£39) / Empire (£79) cards visible',
          '3. Confirm "Most Popular" badge on Starter',
          '4. Confirm upgrade CTAs link to /signup',
        ],
        expected: 'HTTP 200; all four plans visible with correct prices',
        result: 'PASS (200) — manual sign-off required' },
      { id: 'TC-004', title: 'Social icons — header and footer', type: 'both',
        steps: [
          '1. Automated: curl https://barberboost.app/ | grep getbarberboost — expect ≥ 6 occurrences',
          '2. Load homepage; confirm three social icons visible in header (desktop, ≥ md breakpoint)',
          '3. Confirm three icons visible in footer brand column',
          '4. Click each icon — confirm opens correct URL in new tab: FB → facebook.com/getbarberboost, IG → instagram.com/getbarberboost, TT → tiktok.com/@getbarberboost',
          '5. Resize to mobile — confirm icons appear in hamburger menu below "Start Free" button',
        ],
        expected: 'Automated: ≥ 6 occurrences of "getbarberboost" in HTML; manual: all 3 URLs open correctly in new tab, icons visible at all breakpoints',
        result: 'PASS (9 occurrences) — manual sign-off required' },
      { id: 'TC-005', title: 'Contact form — validation (empty body)', type: 'auto',
        steps: ['POST /api/contact with empty body {}'],
        expected: '400, {"error":"All fields are required."}',
        result: 'PASS' },
      { id: 'TC-006', title: 'Contact form — XSS input handled safely', type: 'auto',
        steps: ['POST /api/contact with name: "<script>alert(1)</script>", valid email, subject, and message'],
        expected: 'HTTP 200 (no crash); HTML in email is escaped; no raw script tag in email body',
        result: 'PASS (200, no crash) — code review confirms esc() applied to all four fields' },
      { id: 'TC-007', title: 'Contact form — full submission', type: 'manual',
        steps: [
          '1. Navigate to /contact',
          '2. Fill all fields with valid data (name, email, subject, message)',
          '3. Click Send',
        ],
        expected: 'Success state shown; email delivered to configured CONTACT_EMAIL',
        result: null },
    ],
  },
  {
    num: 2, title: 'MODULE 2 — Security Headers',
    cases: [
      { id: 'TC-008', title: 'Content-Security-Policy present', type: 'auto',
        steps: ["curl -I https://barberboost.app/"],
        expected: "Content-Security-Policy header present, containing object-src 'none' and form-action 'self'",
        result: 'PASS — full CSP header confirmed' },
      { id: 'TC-009', title: 'HSTS enforced', type: 'auto',
        steps: ["curl -I https://barberboost.app/"],
        expected: 'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
        result: 'PASS' },
      { id: 'TC-010', title: 'X-Frame-Options', type: 'auto',
        steps: ["curl -I https://barberboost.app/"],
        expected: 'X-Frame-Options: SAMEORIGIN',
        result: 'PASS' },
      { id: 'TC-011', title: 'X-Content-Type-Options', type: 'auto',
        steps: ["curl -I https://barberboost.app/"],
        expected: 'X-Content-Type-Options: nosniff',
        result: 'PASS' },
      { id: 'TC-012', title: 'Permissions-Policy', type: 'auto',
        steps: ["curl -I https://barberboost.app/"],
        expected: 'Permissions-Policy: camera=(), microphone=(), geolocation=()',
        result: 'PASS' },
    ],
  },
  {
    num: 3, title: 'MODULE 3 — Authentication & Route Guards',
    cases: [
      { id: 'TC-013', title: 'Protected routes redirect unauthenticated users', type: 'auto',
        steps: ['GET each of /dashboard, /bookings, /clients, /analytics, /settings without session cookie'],
        expected: '307 redirect to /login?next=<original-path> for all five routes',
        result: 'PASS — all five returned 307' },
      { id: 'TC-014', title: 'API routes return 401 without auth', type: 'auto',
        steps: ['GET each of /api/bookings, /api/clients, /api/campaigns, /api/inventory, /api/staff without auth'],
        expected: '401 JSON response for all five endpoints',
        result: 'PASS — all five returned 401' },
      { id: 'TC-015', title: 'Deleted endpoint returns 404', type: 'auto',
        steps: ['POST /api/send-email (the removed unauthenticated email relay)'],
        expected: 'HTTP 404 — endpoint no longer exists',
        result: 'PASS' },
      { id: 'TC-016', title: 'Cron endpoint rejects invalid token', type: 'auto',
        steps: ['GET /api/cron/reminders with Authorization: Bearer wrong-secret'],
        expected: '{"error":"Unauthorized"} with HTTP 401',
        result: 'PASS' },
      { id: 'TC-017', title: 'User signup flow', type: 'manual',
        steps: [
          '1. Navigate to /signup',
          '2. Enter full name, email, shop name; set password ≥ 8 characters',
          '3. Submit form',
          'Edge A: duplicate email → expect clear error message, no duplicate account',
          'Edge B: password < 8 chars → expect client-side validation error before submit',
        ],
        expected: 'Account created; redirected to /dashboard; onboarding checklist visible',
        result: null },
      { id: 'TC-018', title: 'User login — valid credentials', type: 'manual',
        steps: ['1. Navigate to /login', '2. Enter valid email and password', '3. Submit'],
        expected: 'Redirect to /dashboard',
        result: null },
      { id: 'TC-019', title: 'User login — wrong password', type: 'manual',
        steps: ['1. Navigate to /login', '2. Enter correct email but wrong password', '3. Submit'],
        expected: '"Incorrect email or password" error message shown; no account lockout on first attempt',
        result: null },
      { id: 'TC-020', title: 'Password reset flow', type: 'manual',
        steps: [
          '1. Navigate to /reset-password',
          '2. Enter registered email address',
          '3. Check inbox for reset link',
          '4. Click link → redirected to /reset-password/update',
          '5. Set new password ≥ 8 characters',
        ],
        expected: 'Password updated; can log in with new password',
        result: null },
      { id: 'TC-021', title: 'Authenticated user redirected away from /login', type: 'manual',
        steps: ['1. Log in successfully', '2. Navigate directly to /login in the address bar'],
        expected: 'Redirect to /dashboard (not shown login form again)',
        result: null },
      { id: 'TC-022', title: 'Logout', type: 'manual',
        steps: ['1. Click account menu', '2. Click Sign Out'],
        expected: 'Session cleared; redirect to /login; subsequent attempt to visit /dashboard redirects to /login',
        result: null },
    ],
  },
  {
    num: 4, title: 'MODULE 4 — Onboarding',
    cases: [
      { id: 'TC-023', title: 'Onboarding checklist appears for new users', type: 'manual',
        steps: ['Create a fresh account (new email address)'],
        expected: 'Welcome banner and 5-step checklist visible on dashboard: Add services / Add staff / Set opening hours / Take first booking / Add a client',
        result: null },
      { id: 'TC-024', title: 'Checklist auto-hides when all steps complete', type: 'manual',
        steps: ['Complete all five onboarding steps in sequence'],
        expected: 'Checklist section disappears from dashboard after final step',
        result: null },
    ],
  },
  {
    num: 5, title: 'MODULE 5 — Shop Settings',
    cases: [
      { id: 'TC-025', title: 'Update shop name and description', type: 'manual',
        steps: ['1. Navigate to /settings/shop', '2. Change shop name and description', '3. Click Save'],
        expected: 'Success toast shown; changes persisted after hard page refresh',
        result: null },
      { id: 'TC-026', title: 'Slug validation', type: 'manual',
        steps: ['1. Enter slug with uppercase letters or spaces (e.g. "My Shop")', '2. Attempt to save'],
        expected: 'Validation error shown; save blocked; slug must be lowercase alphanumeric with hyphens',
        result: null },
      { id: 'TC-027', title: 'Opening hours configuration', type: 'manual',
        steps: [
          '1. Toggle Monday to Closed',
          '2. Set Tuesday 09:00–18:00',
          '3. Save changes',
          '4. Open public booking page; select Monday and Tuesday',
        ],
        expected: 'Monday: no slots available; Tuesday: slots from 09:00 to 18:00 visible',
        result: null },
      { id: 'TC-028', title: 'Logo upload', type: 'manual',
        steps: [
          '1. Navigate to /settings/shop',
          '2. Upload a PNG image < 2 MB',
          '3. Save',
          'Edge A: upload file > 2 MB → expect error',
          'Edge B: upload non-image file → expect rejection',
        ],
        expected: 'Logo visible in settings; persisted after page refresh. Oversized and non-image files rejected with error message',
        result: null },
    ],
  },
  {
    num: 6, title: 'MODULE 6 — Services',
    cases: [
      { id: 'TC-029', title: 'Create a service', type: 'manual',
        steps: [
          '1. Navigate to /services',
          '2. Click Add Service',
          '3. Enter name, price, duration, category, colour',
          '4. Save',
        ],
        expected: 'Service appears in list with correct details; visible in public booking page service picker',
        result: null },
      { id: 'TC-030', title: 'Plan limit enforced on services (Free plan)', type: 'manual',
        steps: ['1. Ensure Free plan account already has 5 services', '2. Attempt to add a 6th service'],
        expected: '403 error: "Service limit reached (5 on Free plan)"',
        result: null },
      { id: 'TC-031', title: 'Edit service price', type: 'manual',
        steps: ['1. Click edit on an existing service', '2. Change the price', '3. Save'],
        expected: 'Updated price shown in list; existing bookings not affected',
        result: null },
      { id: 'TC-032', title: 'Deactivate / reactivate service', type: 'manual',
        steps: ['1. Toggle an active service to inactive'],
        expected: 'Service disappears from public booking page; inactive badge visible in dashboard; reactivating restores it',
        result: null },
    ],
  },
  {
    num: 7, title: 'MODULE 7 — Staff',
    cases: [
      { id: 'TC-033', title: 'Add staff member', type: 'manual',
        steps: [
          '1. Navigate to /staff',
          '2. Click Add Staff',
          '3. Enter name, role, commission rate, working hours',
          '4. Save',
        ],
        expected: 'Staff card appears in list; staff member visible in booking creation dropdown',
        result: null },
      { id: 'TC-034', title: 'Plan limit enforced on staff (Free plan)', type: 'manual',
        steps: ['1. Free plan account with 1 active staff member', '2. Attempt to add a 2nd active staff member'],
        expected: '403 error: "Staff limit reached (1 on Free plan)"',
        result: null },
      { id: 'TC-035', title: 'Set staff working hours', type: 'manual',
        steps: [
          '1. Open staff edit modal',
          '2. Set Mon–Fri 09:00–17:00; mark Sat–Sun as closed',
          '3. Save',
          '4. Check public booking page availability on Saturday',
        ],
        expected: 'Working hours saved; no slots shown on Saturday for this staff member',
        result: null },
      { id: 'TC-036', title: 'Staff detail — commission calculator', type: 'manual',
        steps: [
          '1. Navigate to /staff/[id]',
          '2. Open Commission tab',
          '3. Toggle between This Month and Last Month',
        ],
        expected: 'Commission amount = revenue × commission rate; figures update correctly on toggle',
        result: null },
    ],
  },
  {
    num: 8, title: 'MODULE 8 — Bookings (Dashboard)',
    cases: [
      { id: 'TC-037', title: 'Create a booking', type: 'manual',
        steps: [
          '1. Navigate to /bookings/new',
          '2. Select client, service, staff, date, and time',
          '3. Confirm booking',
        ],
        expected: 'Booking appears in list and today\'s schedule; confirmation email sent to client',
        result: null },
      { id: 'TC-038', title: 'Booking conflict detection', type: 'manual',
        steps: ['1. Create a booking for Staff A at 10:00', '2. Attempt to create a second booking for the same staff at 10:00 (or overlapping time) on the same date'],
        expected: 'Second booking rejected: "Time slot is already taken" (409)',
        result: null },
      { id: 'TC-039', title: 'Update booking status to Completed', type: 'manual',
        steps: ['1. Open a booking', '2. Change status to Completed', '3. Save'],
        expected: 'Status badge updates to Completed; booking counts toward revenue analytics',
        result: null },
      { id: 'TC-040', title: 'Cancel a booking', type: 'manual',
        steps: ['1. Open an existing booking', '2. Click Cancel booking'],
        expected: 'Status = Cancelled; cancellation email sent to client; time slot freed for rebooking',
        result: null },
      { id: 'TC-041', title: 'Monthly booking limit enforced (Free plan)', type: 'manual',
        steps: ['1. Free plan account with 30 bookings this calendar month', '2. Attempt to create the 31st booking'],
        expected: '403 error: "Monthly booking limit reached (30 on Free plan)"',
        result: null },
      { id: 'TC-042', title: 'Booking search by client name', type: 'manual',
        steps: ['1. Navigate to /bookings', '2. Enter a partial client name in the search box'],
        expected: 'List filters in real time to show only matching clients',
        result: null },
      { id: 'TC-043', title: 'Booking search by reference', type: 'manual',
        steps: ['1. Navigate to /bookings', '2. Search BB- followed by 8 characters (the booking reference)'],
        expected: 'Single booking returned matching that reference number',
        result: null },
    ],
  },
  {
    num: 9, title: 'MODULE 9 — Public Booking Page',
    cases: [
      { id: 'TC-044', title: 'Public booking page loads for valid shop', type: 'manual',
        steps: ['Navigate to /booking/{shop-slug} (no authentication required)'],
        expected: 'Shop name, available services, and staff dropdown visible; page loads without login',
        result: null },
      { id: 'TC-045', title: 'Availability — shows correct time slots', type: 'manual',
        steps: ['1. Select a service and a staff member', '2. Pick a date within the next 60 days'],
        expected: 'Slots shown match staff working hours; already-booked slots not available',
        result: null },
      { id: 'TC-046', title: 'Availability — closed days return empty', type: 'manual',
        steps: ['1. Select a day the shop or chosen staff member is marked as closed'],
        expected: '"No available slots" message displayed; no time slots listed',
        result: null },
      { id: 'TC-047', title: 'Create booking via public page', type: 'manual',
        steps: [
          '1. Select service, staff, date, and time slot',
          '2. Enter name, email, and phone number',
          '3. Click Confirm booking',
        ],
        expected: 'Booking created (201); confirmation email sent to entered email; selected slot no longer available',
        result: null },
      { id: 'TC-048', title: 'Past date rejected', type: 'both',
        steps: [
          'Automated: API validates date >= today (code review)',
          'Manual: try selecting yesterday in the date picker on the public booking page',
        ],
        expected: 'UI prevents selection of past dates; API returns 400 if date < today is submitted directly',
        result: 'Code review PASS — manual sign-off required' },
      { id: 'TC-049', title: 'Rate limit on public bookings', type: 'auto',
        steps: ['Code review: rateLimit("public_booking:${ip}", 10, 60) confirmed in /api/public/bookings/route.ts'],
        expected: '11th request from same IP within 60 seconds returns 429 with Retry-After header',
        result: 'PASS (code review)' },
      { id: 'TC-050', title: 'Availability — 60-day booking cap', type: 'both',
        steps: [
          'Automated: code review confirms maxDate = today + 60 days; dates beyond return { slots: [] }',
          'Manual: try selecting a date 61 days ahead in the date picker',
        ],
        expected: 'No slots shown for dates more than 60 days in the future',
        result: 'Code review PASS — manual sign-off required' },
    ],
  },
  {
    num: 10, title: 'MODULE 10 — Clients',
    cases: [
      { id: 'TC-051', title: 'Add client manually', type: 'manual',
        steps: ['1. Navigate to /clients', '2. Click Add Client', '3. Fill name, email, phone', '4. Save'],
        expected: 'Client appears in list; visit and spend counters at 0',
        result: null },
      { id: 'TC-052', title: 'Client search', type: 'manual',
        steps: ['Type a partial client name into the search box on /clients'],
        expected: 'List filters in real time to show only matching clients',
        result: null },
      { id: 'TC-053', title: 'Client profile — booking history', type: 'manual',
        steps: ['Click on a client who has at least one booking'],
        expected: 'Bookings tab shows full history; Total Visits and Total Spent stats match actual booking data',
        result: null },
      { id: 'TC-054', title: 'Client VIP tag', type: 'manual',
        steps: ['Identify a high-spend client; open their profile'],
        expected: 'Gold VIP badge visible on client card and profile page',
        result: null },
      { id: 'TC-055', title: 'Import clients — valid CSV', type: 'manual',
        steps: [
          '1. Prepare a CSV with columns: name, email, phone',
          '2. Navigate to /clients → Import',
          '3. Upload the file',
        ],
        expected: 'Clients imported; import count reported; duplicate emails skipped with reason given',
        result: null },
      { id: 'TC-056', title: 'Import clients — invalid CSV (no name column)', type: 'manual',
        steps: ['Upload a CSV that does not contain a "name" column header'],
        expected: 'Error: "No valid rows found. Make sure your CSV has a \'name\' column header."',
        result: null },
      { id: 'TC-057', title: 'Import clients — over 500 rows', type: 'manual',
        steps: ['Upload a CSV with more than 500 data rows'],
        expected: 'Error: "Maximum 500 rows per import. Split your file and try again."',
        result: null },
      { id: 'TC-058', title: 'Export clients to CSV', type: 'manual',
        steps: ['Navigate to /clients → click Export'],
        expected: 'File clients.csv downloaded; headers: name, email, phone, notes, tags, total_visits, total_spent, created_at; data matches dashboard',
        result: null },
      { id: 'TC-059', title: 'Plan limit enforced on clients (Free plan)', type: 'manual',
        steps: ['1. Free plan account at 50 clients', '2. Attempt to add a 51st client (manually or via import)'],
        expected: 'Plan limit error shown; client not created',
        result: null },
    ],
  },
  {
    num: 11, title: 'MODULE 11 — Analytics',
    cases: [
      { id: 'TC-060', title: 'Dashboard KPIs load', type: 'manual',
        steps: ['Navigate to /analytics'],
        expected: 'Four KPI cards visible: Revenue, Bookings, New Clients, No-Show Rate — each with % change vs prior period',
        result: null },
      { id: 'TC-061', title: 'Date range selector', type: 'manual',
        steps: ['Switch between: Today → This Week → This Month → Last 30 Days'],
        expected: 'Charts and KPIs update correctly for each selected range',
        result: null },
      { id: 'TC-062', title: 'Plan gate — Starter features (Free plan)', type: 'manual',
        steps: ['Free plan: navigate to /analytics and look for: services chart, status donut, staff leaderboard, heatmap'],
        expected: 'All four elements locked with blur overlay and upgrade CTA',
        result: null },
      { id: 'TC-063', title: 'Plan gate — Pro client insights (Starter plan)', type: 'manual',
        steps: ['Starter plan: look for the client insights panel on /analytics'],
        expected: 'Locked with "Upgrade to Pro" prompt; no data accessible',
        result: null },
      { id: 'TC-064', title: 'Plan gate — Empire financial summary (Pro plan)', type: 'manual',
        steps: ['Pro plan: look for the financial summary section on /analytics'],
        expected: 'Locked with "Upgrade to Empire" prompt',
        result: null },
      { id: 'TC-065', title: 'Analytics export (Pro+ plan)', type: 'manual',
        steps: ['Pro+ plan: on /analytics, click Export and download the CSV'],
        expected: 'CSV file downloaded with booking data for the selected period',
        result: null },
    ],
  },
  {
    num: 12, title: 'MODULE 12 — Inventory',
    cases: [
      { id: 'TC-066', title: 'Inventory locked for Free/Starter plan', type: 'manual',
        steps: ['Free or Starter plan: navigate to /inventory'],
        expected: 'Blurred locked preview shown with upgrade CTA',
        result: null },
      { id: 'TC-067', title: 'Add inventory item (Pro+ plan)', type: 'manual',
        steps: [
          '1. Use a Pro or higher plan account',
          '2. Navigate to /inventory → Add Item',
          '3. Enter name, category, quantity, threshold, cost price, retail price',
        ],
        expected: 'Item appears in list; cost value = cost × qty; retail value = retail × qty',
        result: null },
      { id: 'TC-068', title: 'Stock adjustment', type: 'manual',
        steps: ['1. Click Adjust on an existing item', '2. Enter delta +5', '3. Save'],
        expected: 'New quantity = old quantity + 5; audit reason recorded',
        result: null },
      { id: 'TC-069', title: 'Low-stock alert email', type: 'manual',
        steps: ['1. Set item threshold to 10', '2. Adjust stock quantity down to 8 (below threshold)'],
        expected: 'Low-stock alert email sent to shop owner; item highlighted as Critical in the UI',
        result: null },
      { id: 'TC-070', title: 'Search and filter inventory', type: 'manual',
        steps: ['1. Filter by category', '2. Search by product name'],
        expected: 'List filters correctly; item count updates to match filtered results',
        result: null },
    ],
  },
  {
    num: 13, title: 'MODULE 13 — Marketing Campaigns',
    cases: [
      { id: 'TC-071', title: 'Campaigns locked for Free plan', type: 'manual',
        steps: ['Free plan: navigate to /marketing'],
        expected: 'Upgrade prompt shown; create/new campaign button disabled or locked',
        result: null },
      { id: 'TC-072', title: 'Create campaign as Draft (Starter+ plan)', type: 'manual',
        steps: [
          '1. Navigate to /marketing → New Campaign',
          '2. Enter name; select type: Email; target: All Clients',
          '3. Enter subject and email content',
          '4. Save as Draft',
        ],
        expected: 'Campaign appears in list with "Draft" status',
        result: null },
      { id: 'TC-073', title: 'Monthly campaign limit enforced (Starter plan)', type: 'manual',
        steps: ['1. Starter plan account with 2 campaigns already created this calendar month', '2. Attempt to create a 3rd campaign'],
        expected: '403 error: "Monthly campaign limit reached (2 on Starter plan)"',
        result: null },
      { id: 'TC-074', title: 'AI copy generation (Empire plan)', type: 'manual',
        steps: [
          '1. Use an Empire plan account',
          '2. Create campaign → click "Use AI Copy"',
          '3. Select tone and target segment',
          '4. Click Generate',
        ],
        expected: 'AI returns 3 subject line options, an email body (150–250 words), and an SMS message ≤ 160 characters',
        result: null },
      { id: 'TC-075', title: 'AI copy rate limit', type: 'auto',
        steps: ['Code review: rateLimit("ai_copy:${ip}", 5, 60) confirmed in /api/ai-copy'],
        expected: '6th request from same IP within 60 seconds returns 429 with Retry-After header',
        result: 'PASS (code review)' },
      { id: 'TC-076', title: 'Edit a Draft campaign', type: 'manual',
        steps: ['1. Open a Draft campaign', '2. Change the subject line', '3. Save'],
        expected: 'Subject updated; only whitelisted fields modified (shop_id and owner fields unchanged)',
        result: null },
      { id: 'TC-077', title: 'Delete a Draft campaign', type: 'manual',
        steps: ['Select a Draft campaign and click Delete'],
        expected: 'Campaign removed from list; cannot be recovered',
        result: null },
    ],
  },
  {
    num: 14, title: 'MODULE 14 — Billing & Stripe',
    cases: [
      { id: 'TC-078', title: 'Upgrade to Starter plan', type: 'manual',
        steps: [
          '1. Navigate to /settings/billing',
          '2. Click Upgrade on the Starter plan card',
          '3. Complete Stripe checkout using test card: 4242 4242 4242 4242 | any future expiry | any CVC',
        ],
        expected: 'Redirected to /dashboard?upgraded=true; plan badge shows Starter; plan limits immediately updated',
        result: null },
      { id: 'TC-079', title: 'Invalid price ID rejected at checkout', type: 'auto',
        steps: [
          'Code review: VALID_PRICE_IDS.has(priceId) check in /api/stripe/checkout',
          'POST /api/stripe/checkout with priceId=price_fake123 and valid session auth',
        ],
        expected: '400 "Invalid price ID"',
        result: 'PASS (code review)' },
      { id: 'TC-080', title: 'Stripe webhook — subscription created', type: 'both',
        steps: [
          'Code review: checkout.session.completed → upsert to subscriptions table',
          'Manual: after completing checkout, verify subscription row exists in Supabase with correct plan, status=active, and period dates',
        ],
        expected: 'Subscription row present with correct plan, active status, and billing period',
        result: 'Code review PASS — manual Supabase check required' },
      { id: 'TC-081', title: 'Stripe webhook — payment failure email', type: 'both',
        steps: [
          'Code review: invoice.payment_failed → await sendPaymentFailedEmail() (not fire-and-forget)',
          'Manual: stripe trigger invoice.payment_failed via Stripe CLI; check subscriber\'s inbox',
        ],
        expected: 'Payment failure email received; email awaited (not dropped silently)',
        result: 'Code review PASS — manual Stripe CLI test required' },
      { id: 'TC-082', title: 'Stripe webhook — payment receipt email', type: 'both',
        steps: [
          'Code review: invoice.payment_succeeded with billing_reason !== "subscription_create" → await sendPaymentReceiptEmail()',
          'Manual: stripe trigger invoice.payment_succeeded via Stripe CLI; check subscriber\'s inbox',
        ],
        expected: 'Receipt email received for renewals; not sent for the initial subscription_create event',
        result: 'Code review PASS — manual Stripe CLI test required' },
      { id: 'TC-083', title: 'Manage Billing portal', type: 'manual',
        steps: ['1. Navigate to /settings/billing', '2. Click "Manage Billing"'],
        expected: 'Redirected to Stripe Customer Portal; can update payment card, view invoice history, and cancel subscription',
        result: null },
      { id: 'TC-084', title: 'Downgrade / cancellation reflected via webhook', type: 'manual',
        steps: ['1. Cancel subscription in the Stripe Customer Portal', '2. Wait for webhook to be received'],
        expected: 'Subscription status → cancelled; plan reverts to Free at end of current billing period',
        result: null },
    ],
  },
  {
    num: 15, title: 'MODULE 15 — Reminders & Notifications',
    cases: [
      { id: 'TC-085', title: 'Booking reminder — email', type: 'manual',
        steps: [
          '1. Create a booking for tomorrow with a valid client email',
          '2. Trigger cron: GET /api/cron/reminders with correct Authorization: Bearer {CRON_SECRET}',
          '3. Check client email inbox',
        ],
        expected: 'Reminder email received; booking.reminder_sent = true in database',
        result: null },
      { id: 'TC-086', title: 'Booking reminder — WhatsApp', type: 'manual',
        steps: ['1. Create a booking with a valid UK mobile phone number', '2. Trigger cron as above'],
        expected: 'WhatsApp reminder message sent to client phone number (requires Twilio configured in .env)',
        result: null },
      { id: 'TC-087', title: 'Reminder — plan gate (Free plan)', type: 'manual',
        steps: ['1. Free plan account with a booking for tomorrow', '2. Trigger cron as above'],
        expected: 'No reminder sent for Free plan bookings; skipped counter incremented in cron response',
        result: null },
      { id: 'TC-088', title: 'In-app notifications bell', type: 'manual',
        steps: [
          '1. Perform an action that creates a notification (e.g. new booking)',
          '2. Open the notification bell in the dashboard header',
        ],
        expected: 'Unread count badge shown on bell; notifications list loads; marking as read clears the badge',
        result: null },
    ],
  },
  {
    num: 16, title: 'MODULE 16 — Signup Notification',
    cases: [
      { id: 'TC-089', title: 'New signup alert email', type: 'both',
        steps: [
          'Code review: /api/signup-notify sends newSignupAlert template to NOTIFY_EMAIL',
          'Manual: register a brand new account; check admin NOTIFY_EMAIL inbox',
        ],
        expected: 'Admin notification email received at NOTIFY_EMAIL address within seconds',
        result: 'Code review PASS — manual inbox check required' },
      { id: 'TC-090', title: 'Signup-notify rate limit (silent absorption)', type: 'auto',
        steps: ['Send 7 consecutive POST /api/signup-notify requests from the same IP'],
        expected: 'All 7 requests return HTTP 200 (excess requests silently absorbed; no error exposed to caller)',
        result: 'PASS — all 7 returned 200 as designed' },
    ],
  },
  {
    num: 17, title: 'MODULE 17 — Responsive Design',
    cases: [
      { id: 'TC-091', title: 'Mobile navigation — hamburger menu', type: 'manual',
        steps: ['1. Open the site at < 768px viewport width (or DevTools responsive mode)', '2. Click the hamburger menu icon'],
        expected: 'Mobile menu slides open; nav links, Login, Start Free CTA, and three social icon tiles all visible',
        result: null },
      { id: 'TC-092', title: 'Mobile — social icons in hamburger menu', type: 'manual',
        steps: ['With mobile menu open (TC-091), inspect below the "Start Free" button'],
        expected: 'Three bordered social icon tiles (Facebook, Instagram, TikTok) visible below the CTA button',
        result: null },
      { id: 'TC-093', title: 'Dashboard responsive layout', type: 'manual',
        steps: ['View the dashboard at 375px width (iPhone SE) using DevTools device emulation'],
        expected: 'Sidebar collapses to bottom navigation; stat cards stack vertically; no horizontal scroll or overflow',
        result: null },
      { id: 'TC-094', title: 'Public booking page on mobile', type: 'manual',
        steps: ['Open /booking/{slug} on a mobile device or at 375px width'],
        expected: 'Full booking flow usable: service picker, staff dropdown, calendar, slot grid, and form fields are all accessible and keyboard-friendly',
        result: null },
    ],
  },
  {
    num: 18, title: 'MODULE 18 — Edge Cases & Error States',
    cases: [
      { id: 'TC-095', title: '404 page', type: 'manual',
        steps: ['Navigate to a URL that does not exist, e.g. /this-page-does-not-exist'],
        expected: 'Custom 404 page shown with correct branding and a link to return home',
        result: null },
      { id: 'TC-096', title: 'Error boundary catches component failures', type: 'both',
        steps: [
          'Code review: error.tsx exists at app, dashboard, auth, and marketing route group levels',
          'Manual: trigger a component error (or verify error.tsx rendering in development mode)',
        ],
        expected: 'Graceful error UI shown (not blank page or unhandled crash)',
        result: 'Code review PASS — error.tsx confirmed at all route levels; manual verification recommended' },
      { id: 'TC-097', title: 'Shop not found — public booking API', type: 'auto',
        steps: ['GET /api/public/availability?shop_id=nonexistent&service_id=x&date=2026-05-10'],
        expected: '404 "Shop not found"',
        result: 'PASS (404 returned)' },
      { id: 'TC-098', title: 'Ownership isolation — cannot access another shop\'s data', type: 'manual',
        steps: [
          '1. Log in as User A; note their shop_id',
          '2. Log in as User B in a separate browser session',
          '3. As User B: GET /api/bookings?shop_id={User A\'s shop_id}',
        ],
        expected: '403 Forbidden; no data from User A\'s shop returned',
        result: null },
      { id: 'TC-099', title: 'Loading states on slow connection', type: 'manual',
        steps: ['1. Open DevTools → Network tab → set throttle to 3G', '2. Navigate to each major dashboard section'],
        expected: 'Skeleton loaders shown during load; no blank flash; no layout shift (CLS)',
        result: null },
      { id: 'TC-100', title: 'TypeScript build integrity', type: 'auto',
        steps: ['npx tsc --noEmit'],
        expected: 'Zero TypeScript errors; exit code 0',
        result: 'PASS (exit code 0)' },
    ],
  },
]

// ─── Build module sections ────────────────────────────────────────────────────
function moduleSections() {
  const children = []
  for (const mod of MODULES) {
    children.push(h1(mod.title))
    for (const tc of mod.cases) {
      children.push(...tcTable(tc.id, tc.title, tc.type, tc.steps, tc.expected, tc.result))
    }
    children.push(pageBreak())
  }
  return children
}

// ─── Summary table ────────────────────────────────────────────────────────────
function summaryPage() {
  const hdrCell = (text, w) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, font: 'Calibri', size: pt(9), bold: true, color: G.WHITE })], spacing: { after: 0 } })],
    shading: { type: ShadingType.SOLID, color: G.GOLD },
    borders: allBorders,
    margins: cellMargins(),
    width: { size: w, type: WidthType.PERCENTAGE },
  })

  const dataRow = (num, title, total, auto, manual, isTotals = false) => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(num), font: 'Calibri', size: pt(9), bold: isTotals, color: G.DARK })], spacing: { after: 0 }, alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: isTotals ? G.GOLD_LIGHT : G.WHITE }, borders: allBorders, margins: cellMargins(), width: { size: 8, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: title, font: 'Calibri', size: pt(9), bold: isTotals, color: G.DARK })], spacing: { after: 0 } })], shading: { type: ShadingType.SOLID, color: isTotals ? G.GOLD_LIGHT : G.WHITE }, borders: allBorders, margins: cellMargins(), width: { size: 52, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(total), font: 'Calibri', size: pt(9), bold: isTotals, color: G.DARK })], spacing: { after: 0 }, alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: isTotals ? G.GOLD_LIGHT : G.WHITE }, borders: allBorders, margins: cellMargins(), width: { size: 13, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(auto), font: 'Calibri', size: pt(9), bold: isTotals, color: G.GREEN })], spacing: { after: 0 }, alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: isTotals ? G.GOLD_LIGHT : G.GREEN_BG }, borders: allBorders, margins: cellMargins(), width: { size: 13, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(manual), font: 'Calibri', size: pt(9), bold: isTotals, color: G.BLUE })], spacing: { after: 0 }, alignment: AlignmentType.CENTER })], shading: { type: ShadingType.SOLID, color: isTotals ? G.GOLD_LIGHT : G.BLUE_BG }, borders: allBorders, margins: cellMargins(), width: { size: 14, type: WidthType.PERCENTAGE } }),
    ],
  })

  const stats = MODULES.map(mod => {
    const autoCount   = mod.cases.filter(c => c.type === 'auto').length
    const bothCount   = mod.cases.filter(c => c.type === 'both').length
    const manualCount = mod.cases.filter(c => c.type === 'manual').length
    return { num: mod.num, title: mod.title.replace(/^MODULE \d+ — /, ''), total: mod.cases.length, auto: autoCount + bothCount, manual: manualCount + bothCount }
  })

  const totalAuto   = MODULES.reduce((s, m) => s + m.cases.filter(c => c.type === 'auto').length + m.cases.filter(c => c.type === 'both').length, 0)
  const totalManual = MODULES.reduce((s, m) => s + m.cases.filter(c => c.type === 'manual').length + m.cases.filter(c => c.type === 'both').length, 0)

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: [hdrCell('#', 8), hdrCell('Module', 52), hdrCell('Total TCs', 13), hdrCell('Automated', 13), hdrCell('Manual', 14)] }),
      ...stats.map(s => dataRow(s.num, s.title, s.total, s.auto, s.manual)),
      dataRow('', 'TOTAL', 100, totalAuto, totalManual, true),
    ],
  })

  return [
    h1('Test Case Summary'),
    bodyPara('100 test cases across 18 modules. Automated tests use curl, TypeScript compiler, or code review. Manual tests require browser interaction with a live account.'),
    sp(80),
    table,
    pageBreak(),
  ]
}

// ─── Assemble & write ─────────────────────────────────────────────────────────
async function main() {
  const doc = new Document({
    creator:     'BarberBoost',
    title:       'BarberBoost UAT Test Cases',
    subject:     'User Acceptance Testing — Test Cases & Scripts',
    description: 'Full UAT test case catalogue for BarberBoost v1.0, 10 May 2026',
    keywords:    'UAT, QA, test cases, barberboost',
    sections: [
      // Cover page — no running header/footer
      {
        properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.25), right: convertInchesToTwip(1.25) } } },
        children: coverChildren(),
      },
      // Main content — branded header/footer
      {
        properties: { page: { margin: { top: convertInchesToTwip(1.1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.25), right: convertInchesToTwip(1.25) } } },
        headers: { default: makeHeader() },
        footers: { default: makeFooter() },
        children: [
          ...conventions(),
          ...summaryPage(),
          ...moduleSections(),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  const out = path.join(ROOT, 'docs', 'BarberBoost-UAT-Test-Cases.docx')
  writeFileSync(out, buffer)
  console.log(`\n✓ Written: ${out}\n  Size: ${(buffer.byteLength / 1024).toFixed(1)} KB`)
}

main().catch((e) => { console.error(e); process.exit(1) })
