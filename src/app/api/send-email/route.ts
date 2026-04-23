import { NextResponse } from 'next/server'
import { bookingConfirmation as bookingConfirmationTemplate } from '@/lib/email/templates'

export async function POST(request: Request) {
  try {
    const { Resend: ResendClient } = await import('resend')
    const resend = new ResendClient(process.env.RESEND_API_KEY)
    const body = await request.json()
    const { type, to, ...data } = body

    if (!to || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let template: { subject: string; html: string }

    switch (type) {
      case 'booking_confirmation':
        template = bookingConfirmationTemplate(data)
        break
      default:
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
    }

    const { data: result, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'BarberBoost <noreply@barberboost.app>',
      to,
      subject: template.subject,
      html: template.html,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
