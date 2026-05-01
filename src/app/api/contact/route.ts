import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const { Resend: ResendClient } = await import('resend')
    const resend = new ResendClient(process.env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'BarberBoost <noreply@barberboost.app>',
      to: 'hello@barberboost.app',
      subject: `[Contact] ${subject}`,
      html: `
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p>${message.replace(/\n/g, '<br />')}</p>
      `,
    })

    if (error) {
      return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}
