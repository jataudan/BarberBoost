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
  // UK mobile starting with 07 → +447
  if (/^07\d{9}$/.test(stripped)) return `+44${stripped.slice(1)}`
  // Already has + prefix
  if (stripped.startsWith('+')) return stripped
  // Add + if it looks like an international number without it
  if (/^\d{10,15}$/.test(stripped)) return `+${stripped}`
  return stripped
}

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from  = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886'

  if (!sid || !token) {
    console.warn('[whatsapp] TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set — skipping send')
    return
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
