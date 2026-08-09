/**
 * BarberBoost Email Templates — Resend-compatible HTML email builders.
 * All styles are inline (required for email client compatibility).
 * These are HTML strings, not JSX — inline styles are intentional.
 */

import { PLANS } from '@/lib/stripe/plans'

// ── Shared primitives ─────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const GOLD    = '#c9a84c'
const BG      = '#0f0f0f'
const SURFACE = '#1a1a1a'
const TEXT    = '#e4e4e7'
const MUTED   = '#71717a'
const BORDER  = '#27272a'

function emailShell(content: string, shopName: string): string {
  const safeName = esc(shopName.slice(0, 100))
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeName}</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo bar -->
        <tr><td style="padding-bottom:28px;text-align:center;">
          <span style="font-size:22px;font-weight:900;letter-spacing:0.12em;color:${GOLD};">BARBERBOOST</span>
          <div style="font-size:12px;color:${MUTED};margin-top:4px;letter-spacing:0.06em;">${safeName.toUpperCase()}</div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:${SURFACE};border:1px solid ${BORDER};border-radius:12px;padding:32px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;font-size:11px;color:${MUTED};line-height:1.6;">
          This email was sent by ${safeName} via BarberBoost.<br>
          If you did not make this booking, please ignore this email.
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * Shell for trial-lifecycle nurture emails. Unlike emailShell() (booking
 * transactional mail — no unsubscribe, since those are required service
 * messages), every nurture send needs a working unsubscribe link per PECR.
 */
function nurtureEmailShell(content: string, shopName: string, unsubscribeUrl: string): string {
  const safeName = esc(shopName.slice(0, 100))
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeName}</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo bar -->
        <tr><td style="padding-bottom:28px;text-align:center;">
          <span style="font-size:22px;font-weight:900;letter-spacing:0.12em;color:${GOLD};">BARBERBOOST</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:${SURFACE};border:1px solid ${BORDER};border-radius:12px;padding:32px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;font-size:11px;color:${MUTED};line-height:1.7;">
          You're receiving this because ${safeName} is trialling BarberBoost.<br>
          <a href="${unsubscribeUrl}" style="color:${MUTED};text-decoration:underline;">Unsubscribe from these emails</a>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid ${BORDER};color:${MUTED};font-size:13px;width:36%;">${label}</td>
    <td style="padding:8px 0;border-bottom:1px solid ${BORDER};color:${TEXT};font-size:13px;font-weight:500;">${value}</td>
  </tr>`
}

function ctaButton(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;background:${GOLD};color:#000;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.06em;padding:12px 28px;border-radius:8px;">${text}</a>`
}

/**
 * Two side-by-side self-service buttons (Reschedule = gold primary,
 * Cancel = outlined secondary) for customer booking emails. Rendered only when
 * both manage URLs are present; callers fall back to phone-contact copy.
 */
function manageButtons(rescheduleUrl: string, cancelUrl: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr>
        <td style="padding:4px;width:50%;" align="center">
          <a href="${rescheduleUrl}" style="display:block;background:${GOLD};color:#000;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.04em;padding:12px 0;border-radius:8px;text-align:center;">Reschedule</a>
        </td>
        <td style="padding:4px;width:50%;" align="center">
          <a href="${cancelUrl}" style="display:block;background:transparent;color:${TEXT};text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.04em;padding:11px 0;border:1px solid ${BORDER};border-radius:8px;text-align:center;">Cancel</a>
        </td>
      </tr>
    </table>`
}

// ── Booking data shape used by all templates ──────────────────────────────
export interface BookingEmailData {
  clientName: string
  clientEmail: string
  shopName: string
  shopAddress?: string | null
  shopPhone?: string | null
  shopWebsite?: string | null
  serviceName: string
  staffName: string
  date: string         // formatted, e.g. "Monday, 14 April 2026"
  startTime: string    // formatted, e.g. "10:30 AM"
  durationMinutes: number
  price: number
  currency: string
  bookingId: string
  bookingRef: string   // human-readable reference, e.g. "BB-A3F91C2B"
  depositAmount?: number
  bookingPageUrl?: string
  selectedStyleTitles?: string[]
  styleConfidence?: number
  rescheduleUrl?: string   // customer self-service reschedule link
  cancelUrl?: string       // customer self-service cancel link
}

// ── 1. Booking Confirmation ────────────────────────────────────────────────
export function bookingConfirmation(data: BookingEmailData) {
  const formatted = new Intl.NumberFormat('en-GB', { style: 'currency', currency: data.currency }).format(data.price)
  const depositFormatted = data.depositAmount
    ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: data.currency }).format(data.depositAmount)
    : null

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:48px;height:48px;background:rgba(201,168,76,0.12);border-radius:50%;border:1px solid rgba(201,168,76,0.25);line-height:48px;font-size:24px;margin-bottom:12px;">✓</div>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:0.04em;">Booking Confirmed</h1>
      <p style="margin:8px 0 0;font-size:14px;color:${MUTED};">Hi ${esc(data.clientName)}, see you soon!</p>
    </div>

    <!-- Booking reference block -->
    <div style="background:#0f0f0f;border:1px solid ${BORDER};border-radius:10px;padding:16px;text-align:center;margin-bottom:24px;">
      <p style="margin:0;font-size:11px;color:${MUTED};letter-spacing:0.1em;text-transform:uppercase;">Booking Reference</p>
      <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:${GOLD};font-family:'Courier New',Courier,monospace;letter-spacing:0.12em;">${data.bookingRef}</p>
      <p style="margin:6px 0 0;font-size:11px;color:${MUTED};">Quote this reference when contacting us</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${detailRow('Service', esc(data.serviceName))}
      ${detailRow('Barber', esc(data.staffName))}
      ${detailRow('Date', data.date)}
      ${detailRow('Time', data.startTime)}
      ${detailRow('Duration', `${data.durationMinutes} min`)}
      ${detailRow('Total', formatted)}
      ${depositFormatted ? detailRow('Deposit paid', depositFormatted) : ''}
      ${data.shopAddress ? detailRow('Location', esc(data.shopAddress)) : ''}
      ${data.selectedStyleTitles?.length ? detailRow('Desired styles', esc(data.selectedStyleTitles.join(', ')) + (data.styleConfidence ? ` (${data.styleConfidence}% match)` : '')) : ''}
    </table>

    <p style="margin-top:24px;font-size:13px;color:${MUTED};line-height:1.6;">
      Need to make a change? You can reschedule or cancel below${data.shopPhone ? `, or call us on <a href="tel:${esc(data.shopPhone)}" style="color:${GOLD};text-decoration:none;">${esc(data.shopPhone)}</a>` : ''}.
      Please give us at least 24 hours' notice.
    </p>
    ${data.rescheduleUrl && data.cancelUrl ? manageButtons(data.rescheduleUrl, data.cancelUrl) : ''}
  `
  const text = [
    `BOOKING CONFIRMED — ${data.shopName}`,
    '',
    `Hi ${data.clientName},`,
    '',
    `Your appointment is confirmed. Here are your details:`,
    '',
    `Booking Reference: ${data.bookingRef}`,
    `Service:  ${data.serviceName}`,
    `Barber:   ${data.staffName}`,
    `Date:     ${data.date}`,
    `Time:     ${data.startTime}`,
    `Duration: ${data.durationMinutes} min`,
    `Total:    ${formatted}`,
    data.shopAddress ? `Location: ${data.shopAddress}` : '',
    '',
    `Need to make a change? Please give us at least 24 hours' notice.`,
    data.rescheduleUrl ? `Reschedule: ${data.rescheduleUrl}` : '',
    data.cancelUrl ? `Cancel:     ${data.cancelUrl}` : '',
    data.shopPhone ? `Or call us on ${data.shopPhone}.` : '',
    '',
    `---`,
    `This email was sent by ${data.shopName} via BarberBoost.`,
  ].filter(l => l !== undefined).join('\n')

  return {
    subject: `Booking Confirmed [${data.bookingRef}] — ${data.shopName} · ${data.date}`,
    html:    emailShell(content, data.shopName),
    text,
  }
}

// ── 2. Booking Received (awaiting barber confirmation) ────────────────────
export function bookingReceived(data: BookingEmailData) {
  const formatted = new Intl.NumberFormat('en-GB', { style: 'currency', currency: data.currency }).format(data.price)

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:48px;height:48px;background:rgba(201,168,76,0.12);border-radius:50%;border:1px solid rgba(201,168,76,0.25);line-height:48px;font-size:24px;margin-bottom:12px;">📋</div>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:0.04em;">Booking Received</h1>
      <p style="margin:8px 0 0;font-size:14px;color:${MUTED};">Hi ${esc(data.clientName)}, your request is with the barber.</p>
    </div>

    <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:${GOLD};line-height:1.6;">
        Your booking is awaiting confirmation. You'll receive another email once <strong>${esc(data.staffName)}</strong> confirms your appointment.
      </p>
    </div>

    <div style="background:#0f0f0f;border:1px solid ${BORDER};border-radius:10px;padding:16px;text-align:center;margin-bottom:24px;">
      <p style="margin:0;font-size:11px;color:${MUTED};letter-spacing:0.1em;text-transform:uppercase;">Booking Reference</p>
      <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:${GOLD};font-family:'Courier New',Courier,monospace;letter-spacing:0.12em;">${data.bookingRef}</p>
      <p style="margin:6px 0 0;font-size:11px;color:${MUTED};">Keep this reference handy</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${detailRow('Service', esc(data.serviceName))}
      ${detailRow('Barber', esc(data.staffName))}
      ${detailRow('Date', data.date)}
      ${detailRow('Time', data.startTime)}
      ${detailRow('Duration', `${data.durationMinutes} min`)}
      ${detailRow('Total', formatted)}
      ${data.shopAddress ? detailRow('Location', esc(data.shopAddress)) : ''}
    </table>

    <p style="margin-top:20px;font-size:13px;color:${MUTED};line-height:1.6;">
      Need to reschedule or cancel this request?${data.shopPhone ? ` Or call us on <a href="tel:${esc(data.shopPhone)}" style="color:${GOLD};text-decoration:none;">${esc(data.shopPhone)}</a>.` : ''}
    </p>
    ${data.rescheduleUrl && data.cancelUrl ? manageButtons(data.rescheduleUrl, data.cancelUrl) : ''}
  `

  const text = [
    `BOOKING RECEIVED — ${data.shopName}`,
    '',
    `Hi ${data.clientName},`,
    '',
    `Your booking request has been received and is awaiting confirmation from ${data.staffName}.`,
    `You will receive a confirmation email once your appointment is approved.`,
    '',
    `Booking Reference: ${data.bookingRef}`,
    `Service:  ${data.serviceName}`,
    `Barber:   ${data.staffName}`,
    `Date:     ${data.date}`,
    `Time:     ${data.startTime}`,
    `Duration: ${data.durationMinutes} min`,
    `Total:    ${formatted}`,
    data.shopAddress ? `Location: ${data.shopAddress}` : '',
    '',
    `Need to change this request?`,
    data.rescheduleUrl ? `Reschedule: ${data.rescheduleUrl}` : '',
    data.cancelUrl ? `Cancel:     ${data.cancelUrl}` : '',
    data.shopPhone ? `Or call ${data.shopPhone}.` : '',
    '',
    `---`,
    `This email was sent by ${data.shopName} via BarberBoost.`,
  ].filter(l => l !== undefined).join('\n')

  return {
    subject: `Booking Received [${data.bookingRef}] — ${data.shopName}`,
    html:    emailShell(content, data.shopName),
    text,
  }
}

// ── 3. Booking Reminder (24h before) ──────────────────────────────────────
export function bookingReminder(data: BookingEmailData) {
  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:48px;height:48px;background:rgba(201,168,76,0.08);border-radius:50%;border:1px solid rgba(201,168,76,0.2);line-height:48px;font-size:22px;margin-bottom:12px;">⏰</div>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:0.04em;">See You Tomorrow</h1>
      <p style="margin:8px 0 0;font-size:14px;color:${MUTED};">Hi ${esc(data.clientName)}, your appointment is in 24 hours.</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${detailRow('Service', esc(data.serviceName))}
      ${detailRow('Barber', esc(data.staffName))}
      ${detailRow('Date', data.date)}
      ${detailRow('Time', data.startTime)}
      ${data.shopAddress ? detailRow('Location', esc(data.shopAddress)) : ''}
    </table>

    <p style="font-size:13px;color:${MUTED};line-height:1.6;margin-top:4px;">
      If you need to cancel, please do so now to avoid a cancellation fee.
      ${data.shopPhone ? `Call <a href="tel:${esc(data.shopPhone)}" style="color:${GOLD};text-decoration:none;">${esc(data.shopPhone)}</a>.` : ''}
    </p>
  `
  const text = [
    `APPOINTMENT REMINDER — ${data.shopName}`,
    '',
    `Hi ${data.clientName},`,
    '',
    `Your appointment is tomorrow. Here are your details:`,
    '',
    `Service:  ${data.serviceName}`,
    `Barber:   ${data.staffName}`,
    `Date:     ${data.date}`,
    `Time:     ${data.startTime}`,
    data.shopAddress ? `Location: ${data.shopAddress}` : '',
    '',
    `If you need to cancel, please do so now to avoid a cancellation fee.`,
    data.shopPhone ? `Call ${data.shopPhone}.` : '',
    '',
    `---`,
    `This email was sent by ${data.shopName} via BarberBoost.`,
  ].filter(l => l !== undefined).join('\n')

  return {
    subject: `Reminder: Your appointment tomorrow at ${data.startTime} — ${data.shopName}`,
    html:    emailShell(content, data.shopName),
    text,
  }
}

// ── 3. Booking Cancellation ───────────────────────────────────────────────
export function bookingCancellation(data: BookingEmailData) {
  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:48px;height:48px;background:rgba(239,68,68,0.1);border-radius:50%;border:1px solid rgba(239,68,68,0.2);line-height:48px;font-size:22px;margin-bottom:12px;">✕</div>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:0.04em;">Booking Cancelled</h1>
      <p style="margin:8px 0 0;font-size:14px;color:${MUTED};">Hi ${esc(data.clientName)}, your booking has been cancelled.</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${detailRow('Reference', data.bookingRef)}
      ${detailRow('Service', esc(data.serviceName))}
      ${detailRow('Was scheduled', `${data.date} at ${data.startTime}`)}
    </table>

    <p style="font-size:13px;color:${MUTED};line-height:1.6;">
      We hope to see you again soon.
    </p>

    ${data.bookingPageUrl ? ctaButton('BOOK AGAIN', data.bookingPageUrl) : ''}
  `
  const text = [
    `BOOKING CANCELLED — ${data.shopName}`,
    '',
    `Hi ${data.clientName},`,
    '',
    `Your booking has been cancelled.`,
    '',
    `Reference:     ${data.bookingRef}`,
    `Service:       ${data.serviceName}`,
    `Was scheduled: ${data.date} at ${data.startTime}`,
    '',
    `We hope to see you again soon.`,
    data.bookingPageUrl ? `Book again: ${data.bookingPageUrl}` : '',
    '',
    `---`,
    `This email was sent by ${data.shopName} via BarberBoost.`,
  ].filter(l => l !== undefined).join('\n')

  return {
    subject: `Booking Cancelled — ${data.shopName}`,
    html:    emailShell(content, data.shopName),
    text,
  }
}

// ── 4. No-show Follow-up ─────────────────────────────────────────────────
export function noShowFollowup(data: BookingEmailData) {
  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:48px;height:48px;background:rgba(161,161,170,0.1);border-radius:50%;border:1px solid rgba(161,161,170,0.2);line-height:48px;font-size:22px;margin-bottom:12px;">👋</div>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:0.04em;">We Missed You</h1>
      <p style="margin:8px 0 0;font-size:14px;color:${MUTED};">Hi ${esc(data.clientName)}, we didn&apos;t see you yesterday.</p>
    </div>

    <p style="font-size:14px;color:${TEXT};line-height:1.6;margin-bottom:20px;">
      You had a <strong>${esc(data.serviceName)}</strong> booked with <strong>${esc(data.staffName)}</strong>
      on ${data.date} at ${data.startTime}. We hope everything is okay!
    </p>

    <p style="font-size:13px;color:${MUTED};line-height:1.6;">
      Whenever you&apos;re ready, we&apos;d love to get you back in the chair.
    </p>

    ${data.bookingPageUrl ? ctaButton('REBOOK NOW', data.bookingPageUrl) : ''}
  `
  const text = [
    `WE MISSED YOU — ${data.shopName}`,
    '',
    `Hi ${data.clientName},`,
    '',
    `You had a ${data.serviceName} booked with ${data.staffName} on ${data.date} at ${data.startTime}. We didn't see you — we hope everything is okay!`,
    '',
    `Whenever you're ready, we'd love to get you back in the chair.`,
    data.bookingPageUrl ? `Rebook here: ${data.bookingPageUrl}` : '',
    '',
    `---`,
    `This email was sent by ${data.shopName} via BarberBoost.`,
  ].filter(l => l !== undefined).join('\n')

  return {
    subject: `We missed you — Rebook at ${data.shopName}`,
    html:    emailShell(content, data.shopName),
    text,
  }
}

// ── 5. Low Stock Alert ────────────────────────────────────────────────────

export interface LowStockAlertData {
  shopName:  string
  ownerName: string
  items: {
    name:      string
    sku:       string | null
    quantity:  number
    threshold: number
    category:  string | null
  }[]
  dashboardUrl: string
}

export function lowStockAlert(data: LowStockAlertData) {
  const RED    = '#ef4444'
  const YELLOW = '#f59e0b'

  const rows = data.items.map(item => {
    const isCritical = item.quantity === 0
    const colour     = isCritical ? RED : YELLOW
    const status     = isCritical ? 'OUT OF STOCK' : 'LOW STOCK'
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:13px;color:${TEXT};">
          <strong>${esc(item.name)}</strong>
          ${item.category ? `<span style="color:${MUTED};font-size:11px;margin-left:6px;">${esc(item.category)}</span>` : ''}
          ${item.sku ? `<br><span style="color:${MUTED};font-size:11px;font-family:monospace;">${esc(item.sku)}</span>` : ''}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};text-align:center;font-size:13px;">
          <span style="color:${colour};font-weight:700;">${item.quantity}</span>
          <span style="color:${MUTED};font-size:11px;"> / min ${item.threshold}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};text-align:right;">
          <span style="display:inline-block;background:${colour}22;color:${colour};font-size:10px;font-weight:700;letter-spacing:0.06em;padding:2px 8px;border-radius:4px;border:1px solid ${colour}44;">${status}</span>
        </td>
      </tr>`
  }).join('')

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:48px;height:48px;background:rgba(245,158,11,0.12);border-radius:50%;border:1px solid rgba(245,158,11,0.3);line-height:48px;font-size:24px;margin-bottom:12px;">📦</div>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:0.04em;">Low Stock Alert</h1>
      <p style="margin:8px 0 0;font-size:14px;color:${MUTED};">${data.items.length} item${data.items.length !== 1 ? 's' : ''} need restocking at ${esc(data.shopName)}</p>
    </div>

    <p style="font-size:14px;color:${TEXT};line-height:1.6;margin-bottom:20px;">
      Hi ${esc(data.ownerName)}, the following items in your inventory have reached or fallen below their low-stock threshold:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <thead>
        <tr>
          <th style="text-align:left;padding-bottom:8px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:${MUTED};text-transform:uppercase;">Product</th>
          <th style="text-align:center;padding-bottom:8px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:${MUTED};text-transform:uppercase;">Qty</th>
          <th style="text-align:right;padding-bottom:8px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:${MUTED};text-transform:uppercase;">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    ${ctaButton('VIEW INVENTORY', data.dashboardUrl)}
  `

  const itemLines = data.items.map(item =>
    `- ${item.name}${item.sku ? ` (${item.sku})` : ''}: ${item.quantity} in stock (min ${item.threshold}) — ${item.quantity === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}`
  ).join('\n')

  const text = [
    `LOW STOCK ALERT — ${data.shopName}`,
    '',
    `Hi ${data.ownerName},`,
    '',
    `${data.items.length} item${data.items.length !== 1 ? 's' : ''} need restocking:`,
    '',
    itemLines,
    '',
    `View your inventory: ${data.dashboardUrl}`,
    '',
    `---`,
    `Sent by BarberBoost.`,
  ].join('\n')

  return {
    subject: `Low stock alert — ${data.items.length} item${data.items.length !== 1 ? 's' : ''} need restocking at ${data.shopName}`,
    html:    emailShell(content, data.shopName),
    text,
  }
}

// ── 6. Welcome email ──────────────────────────────────────────────────────

export interface WelcomeEmailData {
  ownerName:      string
  shopName:       string
  bookingPageUrl: string
  dashboardUrl:   string
  supportEmail:   string
}

export function welcomeEmail(data: WelcomeEmailData) {
  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:52px;height:52px;background:rgba(201,168,76,0.12);border-radius:50%;border:1px solid rgba(201,168,76,0.25);line-height:52px;font-size:26px;margin-bottom:12px;">🔥</div>
      <h1 style="margin:0;font-size:24px;font-weight:900;color:${TEXT};letter-spacing:0.06em;">WELCOME TO BARBERBOOST</h1>
      <p style="margin:10px 0 0;font-size:14px;color:${MUTED};">Hi ${esc(data.ownerName)} — let&apos;s get ${esc(data.shopName)} set up.</p>
    </div>

    <p style="font-size:14px;color:${TEXT};line-height:1.7;margin-bottom:20px;">
      Your shop is live. Here&apos;s everything you need to get your first booking today:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};">
          <span style="color:${GOLD};font-weight:700;font-size:13px;">① Add a service</span>
          <p style="margin:4px 0 0;font-size:12px;color:${MUTED};">Create your haircut menu so clients know what you offer.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};">
          <span style="color:${GOLD};font-weight:700;font-size:13px;">② Add a barber</span>
          <p style="margin:4px 0 0;font-size:12px;color:${MUTED};">Add yourself or your team so clients can choose their barber.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};">
          <span style="color:${GOLD};font-weight:700;font-size:13px;">③ Share your booking page</span>
          <p style="margin:4px 0 0;font-size:12px;color:${MUTED};">Your public booking link is ready — put it in your bio or text it to clients.</p>
          <a href="${data.bookingPageUrl}" style="color:${GOLD};font-size:12px;text-decoration:none;display:inline-block;margin-top:4px;">${data.bookingPageUrl}</a>
        </td>
      </tr>
    </table>

    ${ctaButton('OPEN MY DASHBOARD', data.dashboardUrl)}

    <p style="margin-top:28px;font-size:12px;color:${MUTED};line-height:1.7;text-align:center;">
      Questions? Reply to this email or reach us at
      <a href="mailto:${data.supportEmail}" style="color:${GOLD};text-decoration:none;">${data.supportEmail}</a>
      — we&apos;re always here to help.
    </p>
  `

  const text = [
    `WELCOME TO BARBERBOOST`,
    '',
    `Hi ${data.ownerName},`,
    '',
    `Your shop is live. Here's what to do first:`,
    '',
    `1. Add a service — create your haircut menu so clients know what you offer.`,
    `2. Add a barber — add yourself or your team so clients can choose their barber.`,
    `3. Share your booking page — ${data.bookingPageUrl}`,
    '',
    `Open your dashboard: ${data.dashboardUrl}`,
    '',
    `Questions? ${data.supportEmail}`,
    '',
    `---`,
    `Sent by BarberBoost.`,
  ].join('\n')

  return {
    subject: `Welcome to BarberBoost — let's get you set up`,
    html:    emailShell(content, data.shopName),
    text,
  }
}

// ── Staff invitation ──────────────────────────────────────────────────────

export interface StaffInvitationData {
  staffName:   string
  shopName:    string
  ownerName?:  string | null
  dashboardUrl: string
}

export function staffInvitation(data: StaffInvitationData): { subject: string; html: string; text: string } {
  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${TEXT};">You've been added to ${esc(data.shopName)}</h2>
    <p style="margin:0 0 24px;font-size:14px;color:${MUTED};line-height:1.6;">
      ${data.ownerName ? `${esc(data.ownerName)} has` : 'You have been'} added you as a team member on BarberBoost.
      Clients can now book appointments directly with you online.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${detailRow('Shop', esc(data.shopName))}
      ${detailRow('Your name', esc(data.staffName))}
    </table>

    <p style="font-size:13px;color:${MUTED};line-height:1.6;margin:0 0 4px;">
      Your manager can share your booking page link so clients can book with you directly.
      If you have any questions about your schedule or services, contact your shop manager.
    </p>

    ${ctaButton('View BarberBoost', data.dashboardUrl)}
  `

  const text = [
    `YOU'VE BEEN ADDED TO ${data.shopName.toUpperCase()} ON BARBERBOOST`,
    '',
    `Hi ${data.staffName},`,
    '',
    `${data.ownerName ? `${data.ownerName} has` : 'You have been'} added you as a team member on BarberBoost. Clients can now book appointments directly with you online.`,
    '',
    `Shop: ${data.shopName}`,
    `Your name: ${data.staffName}`,
    '',
    `View BarberBoost: ${data.dashboardUrl}`,
    '',
    `---`,
    `Sent by BarberBoost.`,
  ].join('\n')

  return {
    subject: `You've been added to ${data.shopName} on BarberBoost`,
    html:    emailShell(content, data.shopName),
    text,
  }
}

// ── 8. New signup alert (internal — sent to BarberBoost) ──────────────────

export interface NewSignupAlertData {
  ownerName: string
  shopName:  string
  email:     string
  signedUpAt: string
}

export function newSignupAlert(data: NewSignupAlertData): { subject: string; html: string; text: string } {
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${TEXT};">New signup on BarberBoost</h2>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${detailRow('Name',       esc(data.ownerName))}
      ${detailRow('Email',      esc(data.email))}
      ${detailRow('Shop name',  esc(data.shopName))}
      ${detailRow('Signed up',  data.signedUpAt)}
    </table>

    ${ctaButton('VIEW SUPABASE DASHBOARD', 'https://supabase.com/dashboard')}
  `

  const text = [
    `NEW SIGNUP ON BARBERBOOST`,
    '',
    `Name:       ${data.ownerName}`,
    `Email:      ${data.email}`,
    `Shop name:  ${data.shopName}`,
    `Signed up:  ${data.signedUpAt}`,
    '',
    `Supabase dashboard: https://supabase.com/dashboard`,
  ].join('\n')

  return {
    subject: `New signup: ${data.ownerName} — ${data.shopName}`,
    html:    emailShell(content, 'BarberBoost'),
    text,
  }
}

// ── 8. Account confirmation email ─────────────────────────────────────────

export interface ConfirmationEmailData {
  fullName:         string
  email:            string
  plan:             string | null  // null = free
  confirmationLink: string
}

export function confirmationEmail(data: ConfirmationEmailData) {
  const safeLink = esc(data.confirmationLink)
  const planName = data.plan ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1) : null

  const planCallout = planName
    ? `<div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:${GOLD};font-weight:700;">After confirming you&apos;ll be taken to complete your ${planName} plan payment.</p>
      </div>`
    : `<p style="font-size:14px;color:${MUTED};line-height:1.6;margin:0 0 20px;">Once confirmed, you&apos;ll land straight in your free dashboard — no payment needed.</p>`

  const ctaText = planName ? `CONFIRM & PROCEED TO PAYMENT` : `CONFIRM MY ACCOUNT`

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:52px;height:52px;background:rgba(201,168,76,0.12);border-radius:50%;border:1px solid rgba(201,168,76,0.25);line-height:52px;font-size:26px;margin-bottom:12px;">✉️</div>
      <h1 style="margin:0;font-size:22px;font-weight:900;color:${TEXT};letter-spacing:0.06em;">CONFIRM YOUR EMAIL</h1>
      <p style="margin:10px 0 0;font-size:14px;color:${MUTED};">Hi ${esc(data.fullName)} — one click and you&apos;re in.</p>
    </div>

    <p style="font-size:14px;color:${TEXT};line-height:1.7;margin-bottom:16px;">
      Click the button below to verify your email address and activate your BarberBoost account.
    </p>

    ${planCallout}

    <div style="text-align:center;">
      ${ctaButton(ctaText, data.confirmationLink)}
    </div>

    <p style="margin-top:28px;font-size:12px;color:${MUTED};line-height:1.6;">
      This link expires in 24 hours. If you didn&apos;t sign up for BarberBoost, you can safely ignore this email.
    </p>
    <p style="font-size:12px;color:${MUTED};line-height:1.6;word-break:break-all;">
      Or copy this link into your browser: <a href="${safeLink}" style="color:${GOLD};text-decoration:none;">${safeLink}</a>
    </p>
  `

  const subject = planName
    ? `Confirm your email — then activate your ${planName} plan`
    : `Confirm your BarberBoost account`

  const text = [
    `CONFIRM YOUR BARBERBOOST ACCOUNT`,
    ``,
    `Hi ${data.fullName},`,
    ``,
    planName
      ? `Click the link below to confirm your email and proceed to your ${planName} plan payment:`
      : `Click the link below to confirm your email and access your free dashboard:`,
    ``,
    data.confirmationLink,
    ``,
    `This link expires in 24 hours.`,
    ``,
    `If you didn't sign up for BarberBoost, ignore this email.`,
  ].join('\n')

  return { subject, html: emailShell(content, 'BarberBoost'), text }
}

// ── 10. Barber new-booking alert ──────────────────────────────────────────

export interface BarberBookingAlertData {
  barberName:      string
  clientName:      string
  clientEmail:     string
  clientPhone:     string | null
  serviceName:     string
  date:            string
  startTime:       string
  durationMinutes: number
  price:           number
  currency:        string
  bookingRef:      string
  shopName:        string
  dashboardUrl:    string
}

export function barberBookingAlert(data: BarberBookingAlertData) {
  const formatted = new Intl.NumberFormat('en-GB', { style: 'currency', currency: data.currency }).format(data.price)

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:48px;height:48px;background:rgba(201,168,76,0.12);border-radius:50%;border:1px solid rgba(201,168,76,0.25);line-height:48px;font-size:24px;margin-bottom:12px;">✂️</div>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:0.04em;">New Booking</h1>
      <p style="margin:8px 0 0;font-size:14px;color:${MUTED};">Hey ${esc(data.barberName)}, you have a new appointment!</p>
    </div>

    <div style="background:#0f0f0f;border:1px solid ${BORDER};border-radius:10px;padding:16px;text-align:center;margin-bottom:24px;">
      <p style="margin:0;font-size:11px;color:${MUTED};letter-spacing:0.1em;text-transform:uppercase;">Booking Reference</p>
      <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:${GOLD};font-family:'Courier New',Courier,monospace;letter-spacing:0.12em;">${esc(data.bookingRef)}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${detailRow('Client',   esc(data.clientName))}
      ${detailRow('Email',    `<a href="mailto:${esc(data.clientEmail)}" style="color:${GOLD};text-decoration:none;">${esc(data.clientEmail)}</a>`)}
      ${data.clientPhone ? detailRow('Phone', `<a href="tel:${esc(data.clientPhone)}" style="color:${GOLD};text-decoration:none;">${esc(data.clientPhone)}</a>`) : ''}
      ${detailRow('Service',  esc(data.serviceName))}
      ${detailRow('Date',     data.date)}
      ${detailRow('Time',     data.startTime)}
      ${detailRow('Duration', `${data.durationMinutes} min`)}
      ${detailRow('Value',    formatted)}
    </table>

    <div style="text-align:center;">
      ${ctaButton('VIEW IN DASHBOARD', data.dashboardUrl)}
    </div>
  `

  const text = [
    `NEW BOOKING — ${data.shopName}`,
    '',
    `Hey ${data.barberName},`,
    '',
    `You have a new appointment booked:`,
    '',
    `Booking Ref: ${data.bookingRef}`,
    `Client:      ${data.clientName}`,
    `Email:       ${data.clientEmail}`,
    data.clientPhone ? `Phone:       ${data.clientPhone}` : '',
    `Service:     ${data.serviceName}`,
    `Date:        ${data.date}`,
    `Time:        ${data.startTime}`,
    `Duration:    ${data.durationMinutes} min`,
    `Value:       ${formatted}`,
    '',
    `View in dashboard: ${data.dashboardUrl}`,
  ].filter(l => l !== undefined).join('\n')

  return {
    subject: `New booking: ${data.clientName} — ${data.serviceName} on ${data.date}`,
    html:    emailShell(content, data.shopName),
    text,
  }
}

// ── 11. Campaign email ────────────────────────────────────────────────────

export interface CampaignEmailData {
  clientName: string
  shopName:   string
  subject:    string
  content:    string   // may contain {name} placeholder
  shopPhone?: string | null
}

export function campaignEmail(data: CampaignEmailData) {
  // Replace {name} after escaping (esc() does not touch { or }, so pattern survives)
  const escapedContent = esc(data.content).replace(/\{name\}/g, esc(data.clientName))

  const paragraphs = escapedContent
    .split(/\n{2,}/)
    .filter(p => p.trim())
    .map(p => `<p style="margin:0 0 14px;font-size:14px;color:${TEXT};line-height:1.7;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

  const content = `
    <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:${TEXT};line-height:1.3;">${esc(data.subject)}</h2>
    ${paragraphs}
    ${data.shopPhone
      ? `<p style="margin:20px 0 0;font-size:13px;color:${MUTED};line-height:1.6;">Questions? Call us on <a href="tel:${esc(data.shopPhone)}" style="color:${GOLD};text-decoration:none;">${esc(data.shopPhone)}</a></p>`
      : ''
    }
  `

  const textContent = data.content.replace(/\{name\}/g, data.clientName)
  const text = [
    data.subject,
    '',
    textContent,
    data.shopPhone ? `\nQuestions? Call ${data.shopPhone}` : '',
    '',
    '---',
    `This message was sent by ${data.shopName} via BarberBoost.`,
    `To stop receiving marketing messages, contact us directly.`,
  ].join('\n')

  return {
    subject: data.subject,
    html:    emailShell(content, data.shopName),
    text,
  }
}

// ── 9. Subscription activated email ──────────────────────────────────────

export interface SubscriptionActivatedData {
  ownerName:    string
  plan:         string   // e.g. 'Pro'
  billing:      string   // e.g. 'Monthly' | 'Annual'
  periodEnd:    string   // e.g. '12 June 2027'
  dashboardUrl: string
}

export function subscriptionActivated(data: SubscriptionActivatedData) {
  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:52px;height:52px;background:rgba(201,168,76,0.12);border-radius:50%;border:1px solid rgba(201,168,76,0.25);line-height:52px;font-size:26px;margin-bottom:12px;">🎉</div>
      <h1 style="margin:0;font-size:24px;font-weight:900;color:${TEXT};letter-spacing:0.06em;">${esc(data.plan).toUpperCase()} PLAN ACTIVE</h1>
      <p style="margin:10px 0 0;font-size:14px;color:${MUTED};">Hi ${esc(data.ownerName)} — your subscription is live.</p>
    </div>

    <p style="font-size:14px;color:${TEXT};line-height:1.7;margin-bottom:20px;">
      Your <strong>${esc(data.plan)}</strong> subscription is now active. All features are unlocked and ready to use in your dashboard.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${detailRow('Plan', esc(data.plan))}
      ${detailRow('Billing', esc(data.billing))}
      ${detailRow('Next renewal', esc(data.periodEnd))}
    </table>

    <p style="font-size:13px;color:${MUTED};line-height:1.6;margin-bottom:0;">
      Manage your subscription at any time from <a href="${esc(data.dashboardUrl)}/settings/billing" style="color:${GOLD};text-decoration:none;">Settings → Billing</a>.
    </p>

    <div style="text-align:center;">
      ${ctaButton('GO TO DASHBOARD', data.dashboardUrl)}
    </div>
  `

  const text = [
    `${data.plan.toUpperCase()} PLAN ACTIVE — BARBERBOOST`,
    ``,
    `Hi ${data.ownerName},`,
    ``,
    `Your ${data.plan} subscription is now active. All features are unlocked.`,
    ``,
    `Plan:         ${data.plan}`,
    `Billing:      ${data.billing}`,
    `Next renewal: ${data.periodEnd}`,
    ``,
    `Dashboard: ${data.dashboardUrl}`,
  ].join('\n')

  return {
    subject: `Your ${data.plan} plan is now active`,
    html:    emailShell(content, 'BarberBoost'),
    text,
  }
}

// ── 13. Barber alert — customer cancelled their own booking ────────────────

export interface BookingCancelledByCustomerData {
  barberName:  string
  clientName:  string
  clientPhone: string | null
  serviceName: string
  date:        string        // formatted, when it was scheduled
  startTime:   string        // formatted
  bookingRef:  string
  shopName:    string
  dashboardUrl: string
}

export function bookingCancelledByCustomer(data: BookingCancelledByCustomerData) {
  const RED = '#ef4444'
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:48px;height:48px;background:rgba(239,68,68,0.1);border-radius:50%;border:1px solid rgba(239,68,68,0.2);line-height:48px;font-size:22px;margin-bottom:12px;">✕</div>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:0.04em;">Booking Cancelled</h1>
      <p style="margin:8px 0 0;font-size:14px;color:${MUTED};">Hey ${esc(data.barberName)}, a client cancelled their appointment.</p>
    </div>

    <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:${RED};line-height:1.6;">
        <strong>${esc(data.clientName)}</strong> cancelled their booking. This slot is now free again.
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${detailRow('Reference', esc(data.bookingRef))}
      ${detailRow('Client',    esc(data.clientName))}
      ${data.clientPhone ? detailRow('Phone', `<a href="tel:${esc(data.clientPhone)}" style="color:${GOLD};text-decoration:none;">${esc(data.clientPhone)}</a>`) : ''}
      ${detailRow('Service',   esc(data.serviceName))}
      ${detailRow('Was scheduled', `${data.date} at ${data.startTime}`)}
    </table>

    <div style="text-align:center;">
      ${ctaButton('VIEW IN DASHBOARD', data.dashboardUrl)}
    </div>
  `

  const text = [
    `BOOKING CANCELLED — ${data.shopName}`,
    '',
    `Hey ${data.barberName},`,
    '',
    `${data.clientName} cancelled their booking. This slot is now free again.`,
    '',
    `Reference:     ${data.bookingRef}`,
    `Client:        ${data.clientName}`,
    data.clientPhone ? `Phone:         ${data.clientPhone}` : '',
    `Service:       ${data.serviceName}`,
    `Was scheduled: ${data.date} at ${data.startTime}`,
    '',
    `View in dashboard: ${data.dashboardUrl}`,
  ].filter(l => l !== undefined).join('\n')

  return {
    subject: `Cancelled: ${data.clientName} — ${data.serviceName} on ${data.date}`,
    html:    emailShell(content, data.shopName),
    text,
  }
}

// ── 14. Barber alert — customer rescheduled their own booking ──────────────

export interface BookingRescheduledByCustomerData {
  barberName:  string
  clientName:  string
  clientPhone: string | null
  serviceName: string
  oldDate:     string        // formatted
  oldStartTime: string       // formatted
  newDate:     string        // formatted
  newStartTime: string       // formatted
  bookingRef:  string
  shopName:    string
  dashboardUrl: string
}

export function bookingRescheduledByCustomer(data: BookingRescheduledByCustomerData) {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:48px;height:48px;background:rgba(201,168,76,0.12);border-radius:50%;border:1px solid rgba(201,168,76,0.25);line-height:48px;font-size:22px;margin-bottom:12px;">🔄</div>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:0.04em;">Booking Rescheduled</h1>
      <p style="margin:8px 0 0;font-size:14px;color:${MUTED};">Hey ${esc(data.barberName)}, a client moved their appointment.</p>
    </div>

    <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:12px;color:${MUTED};line-height:1.6;text-decoration:line-through;">
        ${data.oldDate} at ${data.oldStartTime}
      </p>
      <p style="margin:0;font-size:14px;color:${GOLD};font-weight:700;line-height:1.6;">
        Now: ${data.newDate} at ${data.newStartTime}
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${detailRow('Reference', esc(data.bookingRef))}
      ${detailRow('Client',    esc(data.clientName))}
      ${data.clientPhone ? detailRow('Phone', `<a href="tel:${esc(data.clientPhone)}" style="color:${GOLD};text-decoration:none;">${esc(data.clientPhone)}</a>`) : ''}
      ${detailRow('Service',   esc(data.serviceName))}
    </table>

    <div style="text-align:center;">
      ${ctaButton('VIEW IN DASHBOARD', data.dashboardUrl)}
    </div>
  `

  const text = [
    `BOOKING RESCHEDULED — ${data.shopName}`,
    '',
    `Hey ${data.barberName},`,
    '',
    `${data.clientName} moved their appointment.`,
    '',
    `Was: ${data.oldDate} at ${data.oldStartTime}`,
    `Now: ${data.newDate} at ${data.newStartTime}`,
    '',
    `Reference: ${data.bookingRef}`,
    `Client:    ${data.clientName}`,
    data.clientPhone ? `Phone:     ${data.clientPhone}` : '',
    `Service:   ${data.serviceName}`,
    '',
    `View in dashboard: ${data.dashboardUrl}`,
  ].filter(l => l !== undefined).join('\n')

  return {
    subject: `Rescheduled: ${data.clientName} → ${data.newDate} at ${data.newStartTime}`,
    html:    emailShell(content, data.shopName),
    text,
  }
}

// ============================================================
// Trial nurture series (Phase 5) — all use nurtureEmailShell(),
// which includes the required unsubscribe link. Copy is UK English.
// ============================================================

interface NurtureBase {
  shopName:       string
  ownerName:      string
  dashboardUrl:   string
  unsubscribeUrl: string
}

// ── welcome (day 0) ─────────────────────────────────────────────────────

export function trialWelcome(data: NurtureBase & { servicesUrl: string }) {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:52px;height:52px;background:rgba(201,168,76,0.12);border-radius:50%;border:1px solid rgba(201,168,76,0.25);line-height:52px;font-size:26px;margin-bottom:12px;">✂️</div>
      <h1 style="margin:0;font-size:22px;font-weight:900;color:${TEXT};letter-spacing:0.04em;">YOUR 30-DAY TRIAL IS LIVE</h1>
      <p style="margin:10px 0 0;font-size:14px;color:${MUTED};">Hi ${esc(data.ownerName)} — full access, no card needed.</p>
    </div>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      The fastest way to see ${esc(data.shopName)} come to life on BarberBoost is to add your chairs and
      the services you offer — that's it, your public booking page goes live the moment you do.
    </p>
    <div style="text-align:center;">
      ${ctaButton('ADD MY SERVICES & STAFF', data.servicesUrl)}
    </div>
  `
  const text = [
    `YOUR 30-DAY TRIAL IS LIVE`, '',
    `Hi ${data.ownerName} — full access, no card needed.`, '',
    `Add your chairs and services to bring ${data.shopName} to life on BarberBoost:`,
    data.servicesUrl,
  ].join('\n')

  return {
    subject: `Let's get ${data.shopName} ready to take bookings`,
    html:    nurtureEmailShell(content, data.shopName, data.unsubscribeUrl),
    text,
  }
}

// ── setup_nudge (day 2, skipped if setup already complete) ─────────────

export function setupNudge(data: NurtureBase & { missing: string[] }) {
  const items = data.missing.map(m => `<li style="padding:4px 0;color:${TEXT};font-size:13px;">${esc(m)}</li>`).join('')
  const content = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:900;color:${TEXT};">YOU'RE ALMOST READY</h1>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      Quick one — ${esc(data.shopName)} is a couple of steps from being able to take bookings:
    </p>
    <ul style="margin:0 0 20px;padding-left:20px;">${items}</ul>
    <div style="text-align:center;">
      ${ctaButton('FINISH SETUP', data.dashboardUrl)}
    </div>
  `
  const text = [
    `YOU'RE ALMOST READY`, '',
    `${data.shopName} is a couple of steps from being able to take bookings:`,
    ...data.missing.map(m => `- ${m}`), '',
    data.dashboardUrl,
  ].join('\n')

  return {
    subject: `Quick one — finish setting up ${data.shopName}`,
    html:    nurtureEmailShell(content, data.shopName, data.unsubscribeUrl),
    text,
  }
}

// ── booking_link (day 4, branches on whether any booking exists) ───────

export function bookingLinkNudge(data: NurtureBase & { bookingPageUrl: string; hasBookings: boolean }) {
  const heading = data.hasBookings ? 'YOU’VE GOT BOOKINGS COMING IN' : 'YOUR BOOKING PAGE IS READY'
  const body = data.hasBookings
    ? `Nice work — clients are already booking ${esc(data.shopName)} online. The more places you share your link, the more it works for you: Instagram bio, WhatsApp status, a QR code by the till.`
    : `${esc(data.shopName)}'s public booking page is live and ready for clients — you just need to put it in front of them. Add it to your Instagram bio, WhatsApp status, or text it directly.`
  const content = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:900;color:${TEXT};">${heading}</h1>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">${body}</p>
    <p style="margin:16px 0;padding:12px 16px;background:${BG};border:1px solid ${BORDER};border-radius:8px;font-size:13px;color:${GOLD};word-break:break-all;">${esc(data.bookingPageUrl)}</p>
    <div style="text-align:center;">
      ${ctaButton('MANAGE MY BOOKING PAGE', data.dashboardUrl)}
    </div>
  `
  const text = [heading, '', body, '', data.bookingPageUrl].join('\n')

  return {
    subject: data.hasBookings ? `Nice — you've got bookings coming in` : `Your booking page is ready — share it`,
    html:    nurtureEmailShell(content, data.shopName, data.unsubscribeUrl),
    text,
  }
}

// ── reminders_feature (day 7) ────────────────────────────────────────────

export function remindersFeatureNudge(data: NurtureBase & { noShowCount: number }) {
  const noShowLine = data.noShowCount > 0
    ? `You've already had <strong style="color:${TEXT};">${data.noShowCount}</strong> no-show${data.noShowCount === 1 ? '' : 's'} since your trial started — automated reminders are built to stop that.`
    : `No-shows cost UK barbershops real money every week — automated reminders are the single easiest fix.`
  const content = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:900;color:${TEXT};">CUT NO-SHOWS AUTOMATICALLY</h1>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">${noShowLine}</p>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      Your trial includes automated SMS and email reminders sent ahead of every booking — no setup beyond
      what you've already done.
    </p>
    <div style="text-align:center;">
      ${ctaButton('VIEW MY BOOKINGS', data.dashboardUrl)}
    </div>
  `
  const text = [`CUT NO-SHOWS AUTOMATICALLY`, '', noShowLine.replace(/<[^>]+>/g, ''), '', data.dashboardUrl].join('\n')

  return {
    subject: `Cut no-shows with automatic reminders`,
    html:    nurtureEmailShell(content, data.shopName, data.unsubscribeUrl),
    text,
  }
}

// ── midtrial_active (day 12, active shops) ──────────────────────────────

export function midtrialActive(data: NurtureBase & { bookingsCount: number }) {
  const content = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:900;color:${TEXT};">YOU'RE OFF TO A STRONG START</h1>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      ${esc(data.shopName)} has taken <strong style="color:${GOLD};">${data.bookingsCount}</strong> booking${data.bookingsCount === 1 ? '' : 's'} through
      BarberBoost so far. A few things worth trying next:
    </p>
    <ul style="margin:0 0 20px;padding-left:20px;">
      <li style="padding:4px 0;color:${TEXT};font-size:13px;">Take deposits on booking to cut cancellations</li>
      <li style="padding:4px 0;color:${TEXT};font-size:13px;">Prompt clients to rebook before they leave the chair</li>
      <li style="padding:4px 0;color:${TEXT};font-size:13px;">Track stock and commissions as your team grows</li>
    </ul>
    <div style="text-align:center;">
      ${ctaButton('EXPLORE MY DASHBOARD', data.dashboardUrl)}
    </div>
  `
  const text = [
    `YOU'RE OFF TO A STRONG START`, '',
    `${data.shopName} has taken ${data.bookingsCount} bookings through BarberBoost so far.`, '',
    `- Take deposits on booking to cut cancellations`,
    `- Prompt clients to rebook before they leave the chair`,
    `- Track stock and commissions as your team grows`, '',
    data.dashboardUrl,
  ].join('\n')

  return {
    subject: `You're off to a strong start`,
    html:    nurtureEmailShell(content, data.shopName, data.unsubscribeUrl),
    text,
  }
}

// ── midtrial_stalled (day 12, stalled shops) ─────────────────────────────

export function midtrialStalled(data: NurtureBase) {
  const content = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:900;color:${TEXT};">NEED A HAND GETTING STARTED?</h1>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      We noticed ${esc(data.shopName)} hasn't taken a booking yet. That's completely normal — but we'd
      rather help now than let your trial run out unused.
    </p>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      Reply to this email and tell us what's blocking you, or grab 15 minutes with us and we'll get you
      set up together.
    </p>
    <div style="text-align:center;">
      ${ctaButton('BACK TO MY DASHBOARD', data.dashboardUrl)}
    </div>
  `
  const text = [
    `NEED A HAND GETTING STARTED?`, '',
    `We noticed ${data.shopName} hasn't taken a booking yet.`,
    `Reply to this email and tell us what's blocking you, or grab 15 minutes with us.`, '',
    data.dashboardUrl,
  ].join('\n')

  return {
    subject: `Need a hand getting started?`,
    html:    nurtureEmailShell(content, data.shopName, data.unsubscribeUrl),
    text,
  }
}

// ── value_recap (day 16) — strongest email in the series ────────────────

export function valueRecap(data: NurtureBase & { bookingsCount: number; hoursSaved: number; revenueBooked: number; currency: string }) {
  const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: data.currency || 'GBP', minimumFractionDigits: 0 }).format(data.revenueBooked)
  const content = `
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:900;color:${TEXT};">WHAT BARBERBOOST HAS DONE FOR ${esc(data.shopName.toUpperCase())}</h1>
    <p style="margin:0 0 20px;font-size:13px;color:${MUTED};">Your real numbers since your trial started:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${BORDER};text-align:center;width:33%;">
          <div style="font-size:24px;font-weight:900;color:${GOLD};">${data.bookingsCount}</div>
          <div style="font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:0.04em;">Bookings taken</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${BORDER};text-align:center;width:33%;">
          <div style="font-size:24px;font-weight:900;color:${GOLD};">${data.hoursSaved}</div>
          <div style="font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:0.04em;">Hours saved</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${BORDER};text-align:center;width:33%;">
          <div style="font-size:24px;font-weight:900;color:${GOLD};">${money}</div>
          <div style="font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:0.04em;">Revenue booked</div>
        </td>
      </tr>
    </table>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      That's real time back in your week and real money through the till — with ${esc(data.ownerName)} not
      lifting a phone to book any of it in.
    </p>
    <div style="text-align:center;">
      ${ctaButton('SEE MY FULL DASHBOARD', data.dashboardUrl)}
    </div>
  `
  const text = [
    `WHAT BARBERBOOST HAS DONE FOR ${data.shopName}`, '',
    `Bookings taken:  ${data.bookingsCount}`,
    `Hours saved:     ${data.hoursSaved}`,
    `Revenue booked:  ${money}`, '',
    data.dashboardUrl,
  ].join('\n')

  return {
    subject: `Here's what BarberBoost has done for ${data.shopName} so far`,
    html:    nurtureEmailShell(content, data.shopName, data.unsubscribeUrl),
    text,
  }
}

// ── plan_guide (day 21) — comparison, no hard sell ───────────────────────

export function planGuide(data: NurtureBase & { trialDaysRemaining: number }) {
  const rows = (['starter', 'pro', 'empire'] as const).map(id => {
    const p = PLANS[id]
    return `<tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:13px;color:${TEXT};font-weight:700;">${p.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:13px;color:${MUTED};">£${p.price}/mo</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:12px;color:${MUTED};">${esc(p.description)}</td>
    </tr>`
  }).join('')
  const content = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:900;color:${TEXT};">WHICH PLAN FITS ${esc(data.shopName.toUpperCase())}?</h1>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;margin-bottom:16px;">
      No rush — you've still got ${data.trialDaysRemaining} day${data.trialDaysRemaining === 1 ? '' : 's'} left on your trial.
      Here's a quick comparison to think about when you're ready:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">${rows}</table>
    <div style="text-align:center;">
      ${ctaButton('COMPARE PLANS', data.dashboardUrl)}
    </div>
  `
  const text = [
    `WHICH PLAN FITS ${data.shopName}?`, '',
    ...(['starter', 'pro', 'empire'] as const).map(id => `${PLANS[id].name} — £${PLANS[id].price}/mo — ${PLANS[id].description}`),
    '', data.dashboardUrl,
  ].join('\n')

  return {
    subject: `Which BarberBoost plan is right for ${data.shopName}?`,
    html:    nurtureEmailShell(content, data.shopName, data.unsubscribeUrl),
    text,
  }
}

// ── recommendation (day 25) — first strong add-card CTA ──────────────────

export function recommendationEmail(data: NurtureBase & { recommendedPlan: string; reason: string; billingUrl: string }) {
  const content = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:900;color:${TEXT};">OUR PICK FOR ${esc(data.shopName.toUpperCase())}: ${esc(data.recommendedPlan.toUpperCase())}</h1>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">${esc(data.reason)}</p>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      Add a card whenever you're ready — it won't cut your trial short. You'll keep every remaining free
      day before anything is charged.
    </p>
    <div style="text-align:center;">
      ${ctaButton('ADD PAYMENT METHOD', data.billingUrl)}
    </div>
  `
  const text = [
    `OUR PICK FOR ${data.shopName}: ${data.recommendedPlan}`, '',
    data.reason, '',
    `Add a card whenever you're ready — it won't cut your trial short.`, '',
    data.billingUrl,
  ].join('\n')

  return {
    subject: `Our pick for ${data.shopName}: ${data.recommendedPlan}`,
    html:    nurtureEmailShell(content, data.shopName, data.unsubscribeUrl),
    text,
  }
}

// ── trial_ending (day 27, fired by trial_will_end webhook) ───────────────

export function trialEndingSoon(data: NurtureBase & { trialEndDate: string; billingUrl: string }) {
  const content = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:900;color:${TEXT};">3 DAYS LEFT IN YOUR TRIAL</h1>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      Your BarberBoost trial ends on <strong style="color:${TEXT};">${esc(data.trialEndDate)}</strong>. If no
      card is on file by then, ${esc(data.shopName)} switches to read-only — nothing is deleted, but new
      bookings and client messages pause until you add a payment method.
    </p>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      Add a card now and your trial keeps running exactly as it is — you won't be charged a day early.
    </p>
    <div style="text-align:center;">
      ${ctaButton('ADD PAYMENT METHOD', data.billingUrl)}
    </div>
  `
  const text = [
    `3 DAYS LEFT IN YOUR TRIAL`, '',
    `Your trial ends on ${data.trialEndDate}. If no card is on file, ${data.shopName} switches to read-only — nothing is deleted.`, '',
    data.billingUrl,
  ].join('\n')

  return {
    subject: `3 days left in your BarberBoost trial`,
    html:    nurtureEmailShell(content, data.shopName, data.unsubscribeUrl),
    text,
  }
}

// ── trial_ended (day 30, fired by the paused transition) ─────────────────

export function trialEndedPaused(data: NurtureBase & { billingUrl: string }) {
  const content = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:900;color:${TEXT};">YOUR TRIAL HAS ENDED</h1>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      ${esc(data.shopName)}'s account is now read-only — no new bookings or client messages until you
      reactivate. Nothing has been touched: your clients, booking history and settings are exactly as you
      left them.
    </p>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      Reactivating takes one click — add a card and you're straight back in.
    </p>
    <div style="text-align:center;">
      ${ctaButton('REACTIVATE MY ACCOUNT', data.billingUrl)}
    </div>
  `
  const text = [
    `YOUR TRIAL HAS ENDED`, '',
    `${data.shopName}'s account is now read-only. Nothing has been deleted — your data is exactly as you left it.`,
    `Reactivate: ${data.billingUrl}`,
  ].join('\n')

  return {
    subject: `Your trial has ended — your data is safe`,
    html:    nurtureEmailShell(content, data.shopName, data.unsubscribeUrl),
    text,
  }
}

// ── winback_1 (day 34) ────────────────────────────────────────────────────

export function winback1(data: NurtureBase & { bookingsCount: number; revenueBooked: number; currency: string; billingUrl: string }) {
  const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: data.currency || 'GBP', minimumFractionDigits: 0 }).format(data.revenueBooked)
  const content = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:900;color:${TEXT};">WHAT YOU'RE MISSING AT ${esc(data.shopName.toUpperCase())}</h1>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      Before it paused, your trial booked <strong style="color:${GOLD};">${data.bookingsCount}</strong>
      appointment${data.bookingsCount === 1 ? '' : 's'} worth <strong style="color:${GOLD};">${money}</strong> —
      all without a phone call. That's still sitting there waiting for you.
    </p>
    <div style="text-align:center;">
      ${ctaButton('REACTIVATE MY ACCOUNT', data.billingUrl)}
    </div>
  `
  const text = [
    `WHAT YOU'RE MISSING AT ${data.shopName}`, '',
    `Before it paused, your trial booked ${data.bookingsCount} appointments worth ${money}.`, '',
    data.billingUrl,
  ].join('\n')

  return {
    subject: `What you're missing at ${data.shopName}`,
    html:    nurtureEmailShell(content, data.shopName, data.unsubscribeUrl),
    text,
  }
}

// ── winback_2 (day 45, final) ─────────────────────────────────────────────

export function winback2(data: NurtureBase & { billingUrl: string; supportEmail: string }) {
  const content = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:900;color:${TEXT};">BEFORE YOU GO...</h1>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      This is the last email we'll send about your trial. If BarberBoost wasn't right for
      ${esc(data.shopName)}, we'd genuinely like to know why — just reply to this email and tell us. It
      helps us more than you'd think.
    </p>
    <p style="font-size:14px;color:${TEXT};line-height:1.7;">
      If you'd still like to pick back up, your data is exactly where you left it.
    </p>
    <div style="text-align:center;">
      ${ctaButton('REACTIVATE MY ACCOUNT', data.billingUrl)}
    </div>
    <p style="margin-top:20px;font-size:12px;color:${MUTED};text-align:center;">
      Or just reply — ${esc(data.supportEmail)} reaches a real person.
    </p>
  `
  const text = [
    `BEFORE YOU GO...`, '',
    `If BarberBoost wasn't right for ${data.shopName}, reply and tell us why — it helps.`,
    `Your data is exactly where you left it if you'd like to pick back up: ${data.billingUrl}`,
  ].join('\n')

  return {
    subject: `Before you go...`,
    html:    nurtureEmailShell(content, data.shopName, data.unsubscribeUrl),
    text,
  }
}
