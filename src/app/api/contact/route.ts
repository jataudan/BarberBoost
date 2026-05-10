import { NextResponse } from 'next/server'

const CONTACT_RECIPIENT = process.env.CONTACT_EMAIL ?? process.env.SUPPORT_EMAIL ?? 'webxcelld@gmail.com'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const { Resend: ResendClient } = await import('resend')
    const resend = new ResendClient(process.env.RESEND_API_KEY)
    const FROM   = process.env.RESEND_FROM_EMAIL ?? 'BarberBoost <noreply@barberboost.app>'

    const { error } = await resend.emails.send({
      from:    FROM,
      to:      CONTACT_RECIPIENT,
      replyTo: email,
      subject: `[Contact] ${esc(subject)}`,
      html: `
        <p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>
        <p><strong>Subject:</strong> ${esc(subject)}</p>
        <hr />
        <p>${esc(message).replace(/\n/g, '<br />')}</p>
      `,
      text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
    })

    if (error) {
      console.error('[contact] Resend error:', error.message)
      return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact] exception:', err)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}
