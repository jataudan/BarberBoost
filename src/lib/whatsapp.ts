/**
 * WhatsApp message delivery via Twilio.
 *
 * Requires env vars:
 *   TWILIO_ACCOUNT_SID   — Twilio account SID
 *   TWILIO_AUTH_TOKEN    — Twilio auth token
 *   TWILIO_WHATSAPP_FROM — WhatsApp-enabled number, e.g. whatsapp:+14155238886
 *                          (defaults to Twilio sandbox number for development)
 *
 * Production note: outbound WhatsApp messages to new contacts require
 * a pre-approved message template registered in the Twilio console.
 * The sandbox bypasses this for testing.
 */

function normalisePhone(raw: string): string {
  const stripped = raw.replace(/\s+/g, '')
  // UK mobile starting with 07 → +447xxxxxxxxx (11 digits total)
  if (/^07\d{9}$/.test(stripped)) return `+44${stripped.slice(1)}`
  // Already E.164 format: +[1-9] followed by 6-14 digits
  if (/^\+[1-9]\d{6,14}$/.test(stripped)) return stripped
  // Bare digits that look like international number without the +
  if (/^[1-9]\d{6,14}$/.test(stripped)) return `+${stripped}`
  throw new Error(`Invalid phone number: ${raw}`)
}

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from  = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886'

  if (!sid || !token) {
    throw new Error('[whatsapp] TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not configured')
  }

  const normalised = normalisePhone(to)
  const toAddr     = normalised.startsWith('whatsapp:') ? normalised : `whatsapp:${normalised}`

  const params = new URLSearchParams({ From: from, To: toAddr, Body: body })

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      },
      body: params.toString(),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(`Twilio ${res.status}: ${err.message ?? 'unknown error'}`)
  }
}

export function buildBarberBookingText(data: {
  barberName:  string
  clientName:  string
  clientPhone: string | null
  serviceName: string
  date:        string
  startTime:   string
  bookingRef:  string
}): string {
  const lines = [
    `New booking, ${data.barberName}! ✂️`,
    '',
    `*${data.clientName}* has booked *${data.serviceName}*`,
    `📅  ${data.date} at ${data.startTime}`,
    `🔖  Ref: ${data.bookingRef}`,
    '',
    data.clientPhone
      ? `Client contact: ${data.clientPhone}`
      : 'No client phone number provided.',
  ]
  return lines.join('\n')
}

export function buildBarberCancellationText(data: {
  barberName:  string
  clientName:  string
  serviceName: string
  date:        string
  startTime:   string
  bookingRef:  string
}): string {
  const lines = [
    `Booking cancelled, ${data.barberName} ✕`,
    '',
    `*${data.clientName}* cancelled *${data.serviceName}*`,
    `📅  Was ${data.date} at ${data.startTime}`,
    `🔖  Ref: ${data.bookingRef}`,
    '',
    `This slot is now free again.`,
  ]
  return lines.join('\n')
}

export function buildBarberRescheduleText(data: {
  barberName:   string
  clientName:   string
  serviceName:  string
  oldDate:      string
  oldStartTime: string
  newDate:      string
  newStartTime: string
  bookingRef:   string
}): string {
  const lines = [
    `Booking moved, ${data.barberName} 🔄`,
    '',
    `*${data.clientName}* rescheduled *${data.serviceName}*`,
    `⛔  Was ${data.oldDate} at ${data.oldStartTime}`,
    `✅  Now ${data.newDate} at ${data.newStartTime}`,
    `🔖  Ref: ${data.bookingRef}`,
  ]
  return lines.join('\n')
}

export function buildReminderText(data: {
  clientName:  string
  shopName:    string
  serviceName: string
  staffName:   string
  date:        string
  startTime:   string
  shopPhone:   string | null
  bookingRef:  string
}): string {
  const lines = [
    `Hi ${data.clientName}! 👋`,
    '',
    `Just a reminder about your appointment at *${data.shopName}*:`,
    '',
    `✂️  *${data.serviceName}* with ${data.staffName}`,
    `📅  ${data.date} at ${data.startTime}`,
    `🔖  Ref: ${data.bookingRef}`,
    '',
    data.shopPhone
      ? `Need to cancel or reschedule? Call us: ${data.shopPhone}`
      : 'Need to cancel? Please let us know as soon as possible.',
  ]
  return lines.join('\n')
}
