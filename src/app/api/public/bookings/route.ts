import { type NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe/plans'
import type { PlanId } from '@/lib/stripe/plans'
import { bookingConfirmation, type BookingEmailData } from '@/lib/email/templates'
import { format, parseISO } from 'date-fns'
import { rateLimit } from '@/lib/rate-limit'

function fmtTime12h(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const d = new Date(); d.setHours(h, m, 0, 0)
  return format(d, 'h:mm a')
}

// ── POST — create a public booking (no auth required) ─────────────────────
export async function POST(request: NextRequest) {
  // Rate limit: 10 booking attempts per IP per minute
  const ip  = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl  = rateLimit(`public_booking:${ip}`, 10, 60)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
    )
  }

  const body = await request.json() as Record<string, unknown>
  const {
    shop_id, service_id, staff_id,
    date, start_time, end_time,
    client_name, client_email, client_phone,
    notes, selected_style_ids, style_confidence,
  } = body as {
    shop_id: string; service_id: string; staff_id: string
    date: string; start_time: string; end_time: string
    client_name: string; client_email: string; client_phone?: string
    notes?: string; selected_style_ids?: string[]; style_confidence?: number
  }

  // ── Basic validation ─────────────────────────────────────────────────────
  if (!shop_id || !service_id || !staff_id || !date || !start_time || !end_time || !client_name?.trim() || !client_email?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate date is not in the past
  const today = format(new Date(), 'yyyy-MM-dd')
  if (date < today) {
    return NextResponse.json({ error: 'Cannot book in the past' }, { status: 400 })
  }

  // Use anon client for reads, service client for writes
  const supabase        = await createClient()
  const serviceSupabase = await createServiceClient()

  // ── Verify shop exists and is public ────────────────────────────────────
  const { data: shop } = await supabase
    .from('shops')
    .select('id, owner_id, name, slug, address, phone, currency, cancellation_hours, no_show_fee')
    .eq('id', shop_id)
    .single()

  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  // ── Verify service belongs to shop and is active ─────────────────────────
  const { data: service } = await supabase
    .from('services')
    .select('id, name, duration_minutes, price, is_active')
    .eq('id', service_id)
    .eq('shop_id', shop_id)
    .eq('is_active', true)
    .single()

  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

  // ── Verify staff belongs to shop and is active ───────────────────────────
  const { data: staff } = await supabase
    .from('staff')
    .select('id, name, is_active')
    .eq('id', staff_id)
    .eq('shop_id', shop_id)
    .eq('is_active', true)
    .single()

  if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 })

  // ── Plan limit check ─────────────────────────────────────────────────────
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('owner_id', shop.owner_id)
    .in('status', ['active', 'trialing'])
    .single()

  const plan        = ((sub?.plan as PlanId | null) ?? 'free') satisfies PlanId
  const maxPerMonth = PLANS[plan].limits.bookings_per_month

  if (maxPerMonth !== -1) {
    const monthStart = date.slice(0, 7) + '-01'
    const { count }  = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shop_id)
      .gte('date', monthStart)
      .neq('status', 'cancelled')

    if ((count ?? 0) >= maxPerMonth) {
      return NextResponse.json(
        { error: 'This shop is fully booked for the month. Please call to arrange.' },
        { status: 429 }
      )
    }
  }

  // ── Clash check ───────────────────────────────────────────────────────────
  const { data: clash } = await supabase
    .from('bookings')
    .select('id')
    .eq('shop_id', shop_id)
    .eq('staff_id', staff_id)
    .eq('date', date)
    .neq('status', 'cancelled')
    .lt('start_time', end_time)
    .gt('end_time', start_time)
    .limit(1)

  if (clash && clash.length > 0) {
    return NextResponse.json({ error: 'This slot has just been taken. Please choose another time.' }, { status: 409 })
  }

  // ── Upsert client record ─────────────────────────────────────────────────
  let clientId: string | null = null
  if (client_email) {
    const { data: existingClient } = await serviceSupabase
      .from('clients')
      .select('id')
      .eq('shop_id', shop_id)
      .eq('email', client_email.toLowerCase().trim())
      .single()

    if (existingClient) {
      clientId = existingClient.id
    } else {
      const { data: newClient } = await serviceSupabase
        .from('clients')
        .insert({
          shop_id,
          name:               client_name.trim(),
          email:              client_email.toLowerCase().trim(),
          phone:              client_phone ?? null,
          tags:               [],
          marketing_consent:  false,
          total_visits:       0,
          total_spent:        0,
        })
        .select('id')
        .single()
      clientId = newClient?.id ?? null
    }
  }

  // ── Insert booking ────────────────────────────────────────────────────────
  const { data: booking, error: insertError } = await serviceSupabase
    .from('bookings')
    .insert({
      shop_id,
      staff_id,
      service_id,
      client_id:       clientId,
      client_name:     client_name.trim(),
      client_email:    client_email.toLowerCase().trim(),
      client_phone:    client_phone ?? null,
      date,
      start_time,
      end_time,
      price:           service.price,
      deposit_amount:  0,
      payment_method:  'cash',
      status:          'confirmed',
      notes:               notes ?? null,
      source:              'online',
      is_paid:             false,
      reminder_sent:       false,
      selected_style_ids:  selected_style_ids ?? [],
      style_confidence:    style_confidence ?? null,
    })
    .select('id, booking_ref')
    .single()

  if (insertError || !booking) {
    return NextResponse.json({ error: insertError?.message ?? 'Failed to create booking' }, { status: 500 })
  }

  // ── Fetch style titles for email (if styles were selected) ──────────────
  let selectedStyleTitles: string[] | undefined
  if (selected_style_ids && selected_style_ids.length > 0) {
    const { data: styleRows } = await supabase
      .from('haircut_styles')
      .select('title')
      .in('id', selected_style_ids)
    selectedStyleTitles = (styleRows ?? []).map(s => s.title as string)
  }

  // ── Send confirmation email ───────────────────────────────────────────────
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.app'
  const emailData: BookingEmailData = {
    clientName:      client_name.trim(),
    clientEmail:     client_email.trim(),
    shopName:        shop.name,
    shopAddress:     shop.address,
    shopPhone:       shop.phone,
    shopWebsite:     null,
    serviceName:     service.name,
    staffName:       staff.name,
    date:            format(parseISO(date), 'EEEE, d MMMM yyyy'),
    startTime:       fmtTime12h(start_time),
    durationMinutes: service.duration_minutes,
    price:           service.price,
    currency:        shop.currency ?? 'GBP',
    bookingId:       booking.id,
    bookingRef:           (booking.booking_ref as string | null) ?? booking.id.slice(0, 8).toUpperCase(),
    bookingPageUrl:       `${appUrl}/booking/${(shop as { slug?: string }).slug ?? shop_id}`,
    selectedStyleTitles,
    styleConfidence:      style_confidence,
  }

  try {
    const { Resend: ResendClient } = await import('resend')
    const resend = new ResendClient(process.env.RESEND_API_KEY)
    const FROM   = process.env.RESEND_FROM_EMAIL ?? 'BarberBoost <noreply@barberboost.app>'
    const tmpl   = bookingConfirmation(emailData)
    const { error: emailErr } = await resend.emails.send({ from: FROM, to: client_email.trim(), ...tmpl })
    if (emailErr) console.error('[public/bookings] email error:', emailErr.message)
  } catch (err) {
    console.error('[public/bookings] email exception:', err)
  }

  return NextResponse.json({
    data: {
      id:           booking.id,
      service_name: service.name,
      staff_name:   staff.name,
      date,
      start_time,
      price:        service.price,
      currency:     shop.currency ?? 'GBP',
    }
  }, { status: 201 })
}
