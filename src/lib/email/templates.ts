/**
 * BarberBoost Email Templates — Resend-compatible HTML email builders.
 * All styles are inline (required for email client compatibility).
 * These are HTML strings, not JSX — inline styles are intentional.
 */

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
  const safeName = esc(shopName)
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

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid ${BORDER};color:${MUTED};font-size:13px;width:36%;">${label}</td>
    <td style="padding:8px 0;border-bottom:1px solid ${BORDER};color:${TEXT};font-size:13px;font-weight:500;">${value}</td>
  </tr>`
}

function ctaButton(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;background:${GOLD};color:#000;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.06em;padding:12px 28px;border-radius:8px;">${text}</a>`
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
    </table>

    <p style="margin-top:24px;font-size:13px;color:${MUTED};line-height:1.6;">
      Need to cancel or reschedule? Please contact us at least 24 hours in advance.
      ${data.shopPhone ? `Call us on <a href="tel:${esc(data.shopPhone)}" style="color:${GOLD};text-decoration:none;">${esc(data.shopPhone)}</a>.` : ''}
    </p>
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
    `Need to cancel or reschedule? Please contact us at least 24 hours in advance.`,
    data.shopPhone ? `Call us on ${data.shopPhone}.` : '',
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

// ── 2. Booking Reminder (24h before) ──────────────────────────────────────
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
