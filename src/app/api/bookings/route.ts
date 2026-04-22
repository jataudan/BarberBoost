import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe/plans'
import type { PlanId } from '@/lib/stripe/plans'
import { bookingConfirmation, bookingCancellation, type BookingEmailData } from '@/lib/email/templates'
import { format } from 'date-fns'

// ── Helpers ───────────────────────────────────────────────────────────────
function formatTime12h(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(); d.setHours(h, m, 0, 0)
  return format(d, 'h:mm a')
}

async function sendBookingEmail(
  template: (data: BookingEmailData) => { subject: string; html: string },
  to: string,
  data: BookingEmailData
) {
  try {
    const { Resend: ResendClient } = await import('resend')
    const resend = new ResendClient(process.env.RESEND_API_KEY)
    const from   = process.env.RESEND_FROM_EMAIL ?? 'bookings@barberboost.com'
    await resend.emails.send({ from, to, ...template(data) })
  } catch {
    // Non-fatal: log and continue
    console.error('[email] failed to send booking email')
  }
}

// ── GET ── Fetch bookings with filters ────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp       = request.nextUrl.searchParams
  const shopId   = sp.get('shop_id')
  const dateFrom = sp.get('date_from')
  const dateTo   = sp.get('date_to')
  const date     = sp.get('date')
  const staffId  = sp.get('staff_id')
  const status   = sp.get('status')
  const serviceId = sp.get('service_id')
  const page     = Math.max(1, parseInt(sp.get('page') ?? '1'))
  const limit    = Math.min(100, parseInt(sp.get('limit') ?? '50'))
  const withRelations = sp.get('relations') !== 'false'

  if (!shopId) return NextResponse.json({ error: 'shop_id required' }, { status: 400 })

  // Verify the requesting user owns this shop
  const { data: shop } = await supabase.from('shops').select('id').eq('id', shopId).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const selectCols = withRelations
    ? `*, service:services(id,name,duration_minutes,price,colour), staff:staff(id,name,avatar_url,colour), client:clients(id,name,email,phone)`
    : '*'

  let query = supabase
    .from('bookings')
    .select(selectCols, { count: 'exact' })
    .eq('shop_id', shopId)
    .order('date', { ascending: false })
    .order('start_time', { ascending: true })
    .range((page - 1) * limit, page * limit - 1)

  if (date)      query = query.eq('date', date)
  if (dateFrom)  query = query.gte('date', dateFrom)
  if (dateTo)    query = query.lte('date', dateTo)
  if (staffId)   query = query.eq('staff_id', staffId)
  if (status)    query = query.eq('status', status)
  if (serviceId) query = query.eq('service_id', serviceId)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) },
  })
}

// ── POST ── Create booking ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { shop_id, staff_id, service_id, client_name, client_email, date,
          start_time, end_time, price, deposit_amount, payment_method,
          notes, source = 'dashboard' } = body

  if (!shop_id || !staff_id || !service_id || !date || !start_time || !end_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // ── Verify ownership ──────────────────────────────────────────────────
  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, address, phone, currency')
    .eq('id', shop_id)
    .eq('owner_id', user.id)
    .single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // ── Plan limit check ──────────────────────────────────────────────────
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('owner_id', user.id)
    .in('status', ['active', 'trialing'])
    .single()

  const plan     = ((sub?.plan as PlanId | null) ?? 'free') satisfies PlanId
  const planData = PLANS[plan]
  const maxPerMonth = planData.limits.bookings_per_month  // -1 = unlimited

  if (maxPerMonth !== -1) {
    const monthStart = format(new Date(date), 'yyyy-MM') + '-01'
    const { count }  = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shop_id)
      .gte('date', monthStart)
      .neq('status', 'cancelled')

    if ((count ?? 0) >= maxPerMonth) {
      return NextResponse.json(
        {
          error: `Monthly booking limit reached (${maxPerMonth} on the ${planData.name} plan). Upgrade to add more bookings.`,
          code:  'PLAN_LIMIT_EXCEEDED',
          plan,
        },
        { status: 403 }
      )
    }
  }

  // ── Clash check ───────────────────────────────────────────────────────
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
    return NextResponse.json({ error: 'Time slot is already taken' }, { status: 409 })
  }

  // ── Insert booking ────────────────────────────────────────────────────
  const { data: booking, error: insertError } = await supabase
    .from('bookings')
    .insert({
      shop_id, staff_id, service_id,
      client_name:    client_name ?? 'Walk-in',
      client_email:   client_email ?? null,
      date, start_time, end_time,
      price:          price ?? 0,
      deposit_amount: deposit_amount ?? 0,
      payment_method: payment_method ?? 'cash',
      status:         'confirmed',
      notes:          notes ?? null,
      source,
      is_paid:        false,
      reminder_sent:  false,
    })
    .select('*, service:services(id,name,duration_minutes,price,colour), staff:staff(id,name,colour)')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // ── Send confirmation email (non-blocking) ────────────────────────────
  if (client_email) {
    const service = booking.service as { name: string; duration_minutes: number } | null
    const staff   = booking.staff   as { name: string } | null
    const emailData: BookingEmailData = {
      clientName:      client_name,
      clientEmail:     client_email,
      shopName:        shop.name,
      shopAddress:     shop.address,
      shopPhone:       shop.phone,
      shopWebsite:     null,
      serviceName:     service?.name ?? 'Service',
      staffName:       staff?.name   ?? 'Your barber',
      date:            format(new Date(date), 'EEEE, d MMMM yyyy'),
      startTime:       formatTime12h(start_time),
      durationMinutes: service?.duration_minutes ?? 30,
      price:           price ?? 0,
      currency:        shop.currency ?? 'GBP',
      bookingId:       booking.id,
      depositAmount:   deposit_amount,
    }
    sendBookingEmail(bookingConfirmation, client_email, emailData)
  }

  return NextResponse.json({ data: booking }, { status: 201 })
}

// ── PATCH ── Update booking status ────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, status, notes, internal_notes } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Verify ownership via shop
  const { data: existing } = await supabase
    .from('bookings')
    .select('*, service:services(name,duration_minutes), staff:staff(name), client:clients(name)')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, address, phone, currency')
    .eq('id', existing.shop_id)
    .eq('owner_id', user.id)
    .single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updates: Record<string, unknown> = {}
  if (status)         updates.status         = status
  if (notes !== undefined)          updates.notes          = notes
  if (internal_notes !== undefined) updates.internal_notes = internal_notes

  const { data: updated, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send email on cancellation
  if (status === 'cancelled' && existing.client_email) {
    const service = existing.service as { name: string; duration_minutes: number } | null
    const staff   = existing.staff   as { name: string } | null
    const emailData: BookingEmailData = {
      clientName:      existing.client_name,
      clientEmail:     existing.client_email,
      shopName:        shop.name,
      shopAddress:     shop.address,
      shopPhone:       shop.phone,
      shopWebsite:     null,
      serviceName:     service?.name ?? 'Service',
      staffName:       staff?.name   ?? 'Your barber',
      date:            format(new Date(existing.date), 'EEEE, d MMMM yyyy'),
      startTime:       formatTime12h(existing.start_time),
      durationMinutes: service?.duration_minutes ?? 30,
      price:           existing.price ?? 0,
      currency:        shop.currency ?? 'GBP',
      bookingId:       existing.id,
    }
    sendBookingEmail(bookingCancellation, existing.client_email, emailData)
  }

  return NextResponse.json({ data: updated })
}

// ── DELETE ── Soft-cancel booking ─────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Verify ownership
  const { data: existing } = await supabase.from('bookings').select('shop_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: shop } = await supabase.from('shops').select('id').eq('id', existing.shop_id).eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
