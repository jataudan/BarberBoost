import { NextResponse } from 'next/server'

// Temporary diagnostic endpoint — DELETE after testing
// POST /api/email-diag with body { "to": "your@email.com" }
export async function POST(request: Request) {
  const { to } = await request.json()
  if (!to) return NextResponse.json({ error: 'to required' }, { status: 400 })

  const apiKey  = process.env.RESEND_API_KEY
  const fromEnv = process.env.RESEND_FROM_EMAIL

  const diagnostics: Record<string, unknown> = {
    apiKey_set:   !!apiKey,
    apiKey_prefix: apiKey ? apiKey.slice(0, 8) + '...' : null,
    fromEnv_set:  !!fromEnv,
    fromEnv_value: fromEnv ?? null,
    to,
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set', diagnostics }, { status: 500 })
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const FROM   = fromEnv ?? 'BarberBoost <noreply@barberboost.app>'

    const { data, error } = await resend.emails.send({
      from:    FROM,
      to,
      subject: 'BarberBoost — Email Diagnostic Test',
      html:    '<p>If you receive this, Resend is working correctly from <strong>' + FROM + '</strong>.</p>',
      text:    'If you receive this, Resend is working correctly from ' + FROM + '.',
    })

    return NextResponse.json({
      diagnostics,
      resend_data:  data  ?? null,
      resend_error: error ?? null,
      success: !error,
    })
  } catch (err) {
    return NextResponse.json({
      diagnostics,
      exception: String(err),
      success: false,
    }, { status: 500 })
  }
}
