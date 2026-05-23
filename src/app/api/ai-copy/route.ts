import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const SEGMENT_LABELS: Record<string, string> = {
  all:      'all existing clients',
  vip:      'VIP / high-value clients',
  regular:  'regular clients',
  at_risk:  'at-risk clients who may be drifting away',
  new:      'new clients',
  inactive: 'inactive clients who haven\'t visited in 60+ days',
}

export interface AICopyRequest {
  type:            'email' | 'sms' | 'push'
  shopName:        string
  targetAudience:  string   // segment key
  tone:            'friendly' | 'professional' | 'urgent' | 'exclusive'
}

export interface AICopyResponse {
  subjects:   string[]
  emailBody:  string
  smsMessage: string
}

// ── POST — generate campaign copy via Claude ───────────────────────────────
export async function POST(request: NextRequest) {
  // Verify user is authenticated and on Empire plan before rate limiting,
  // so the limit key is scoped to the user rather than a shared IP.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('owner_id', user.id)
    .in('status', ['active', 'trialing'])
    .single()

  if (sub?.plan !== 'empire') {
    return NextResponse.json(
      { error: 'AI Copy is an Empire plan feature. Upgrade to unlock it.' },
      { status: 403 }
    )
  }

  // Rate limit per user: 30 generations per hour
  const rl = rateLimit(`ai_copy:${user.id}`, 30, 3600)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
    )
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI service is not configured.' }, { status: 503 })
  }

  const body = await request.json() as AICopyRequest
  const { type, shopName, targetAudience, tone } = body

  if (!type || !shopName?.trim() || !targetAudience || !tone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const audience = SEGMENT_LABELS[targetAudience] ?? targetAudience

  const prompt = `You are a marketing copywriter specialising in UK barbershops.

Write a ${type} campaign for "${shopName}" targeting ${audience} with a ${tone} tone.

Requirements:
- subjects: 3 different compelling email subject lines (max 60 chars each), varied in approach
- emailBody: a full email body (150–250 words), conversational UK English, uses {name} placeholder for personalisation, ends with a clear CTA
- smsMessage: a single SMS message under 160 characters, punchy, includes a CTA, uses {name} placeholder

Respond with ONLY valid JSON matching this exact structure — no markdown, no extra text:
{"subjects":["...","...","..."],"emailBody":"...","smsMessage":"..."}`

  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages:   [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''

  let parsed: AICopyResponse
  try {
    parsed = JSON.parse(raw) as AICopyResponse
  } catch {
    return NextResponse.json({ error: 'AI returned an unexpected response. Please try again.' }, { status: 502 })
  }

  // Basic sanity checks
  if (!Array.isArray(parsed.subjects) || parsed.subjects.length === 0 || !parsed.emailBody || !parsed.smsMessage) {
    return NextResponse.json({ error: 'AI returned incomplete data. Please try again.' }, { status: 502 })
  }

  // Enforce SMS 160-char limit (truncate if AI went over)
  if (parsed.smsMessage.length > 160) {
    parsed.smsMessage = parsed.smsMessage.slice(0, 157) + '...'
  }

  return NextResponse.json({ data: parsed })
}
