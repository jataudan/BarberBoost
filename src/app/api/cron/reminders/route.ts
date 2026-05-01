import { type NextRequest, NextResponse } from 'next/server'
import { format, addHours, parseISO } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/admin'
import { bookingReminder, type BookingEmailData } from '@/lib/email/templates'
import { sendWhatsApp, buildReminderText } from '@/lib/whatsapp'
import { PLANS } from '@/lib/stripe/plans'
import type { PlanId } from '@/lib/stripe/plans'

export const runtime    = 'nodejs'
export const maxDuration = 60

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime12h(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(); d.setHours(h, m, 0, 0)
  return format(d, 'h:mm a')
}

/** Combine a date string (YYYY-MM-DD) and time string (HH:MM or HH:MM:SS) into a Date. */
function bookingDateTime(date: string, startTime: string): Date {
  return parseISO(`${date}T${startTime}`)
}

type ShopRow = {
  id:       string
  name:     string
  address:  string | null
  phone:    string | null
  currency: string
  owner_id: string
}

type BookingRow = {
  id:           string
  booking_ref:  string | null
  date:         string
  start_time:   string
  client_name:  string
  client_email: string | null
  client_phone: string | null
  price:        number
  shop_id:      string
  service: { name: string; duration_minutes: number } | null
  staff:   { name: string } | null
  shop:    ShopRow | null
}

// ── GET — invoked by Vercel Cron ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  // Vercel automatically passes CRON_SECRET as a Bearer token
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now      = new Date()

  // Window: send when appointment is 22h–26h from now (±2h around 24h mark)
  const windowStart = addHours(now, 22)
  const windowEnd   = addHours(now, 26)

  // Query date range covers today through 2 days out
  const dateFrom = format(now, 'yyyy-MM-dd')
  const dateTo   = format(addHours(now, 27), 'yyyy-MM-dd')

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id, booking_ref, date, start_time,
      client_name, client_email, client_phone,
      price, shop_id,
      service:services(name, duration_minutes),
      staff:staff(name),
      shop:shops(id, name, address, phone, currency, owner_id)
    `)
    .eq('status', 'confirmed')
    .eq('reminder_sent', false)
    .gte('date', dateFrom)
    .lte('date', dateTo)

  if (error) {
    console.error('[cron/reminders] fetch error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!bookings?.length) {
    return NextResponse.json({ sent: 0, skipped: 0, message: 'No eligible bookings' })
  }

  const rows = bookings as unknown as BookingRow[]

  // Fetch plan for each shop owner in one query
  const ownerIds = [...new Set(
    rows.map(b => b.shop?.owner_id).filter(Boolean) as string[]
  )]

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('owner_id, plan')
    .in('owner_id', ownerIds)
    .in('status', ['active', 'trialing'])

  const planByOwner = new Map(
    (subs ?? []).map(s => [s.owner_id, s.plan as PlanId])
  )

  const results = { sent: 0, skipped: 0, errors: 0 }
  const sentIds: string[] = []

  for (const b of rows) {
    // ── Time window check ─────────────────────────────────────────────────
    const apptTime = bookingDateTime(b.date, b.start_time)
    if (apptTime < windowStart || apptTime > windowEnd) {
      results.skipped++
      continue
    }

    // ── Plan gate ─────────────────────────────────────────────────────────
    const shop = b.shop
    if (!shop) { results.skipped++; continue }

    const plan = planByOwner.get(shop.owner_id) ?? 'free'
    if (!PLANS[plan].limits.reminders) { results.skipped++; continue }

    // ── Build shared data ─────────────────────────────────────────────────
    const bookingRef  = b.booking_ref ?? b.id.slice(0, 8).toUpperCase()
    const formattedDate = format(parseISO(b.date), 'EEEE, d MMMM yyyy')
    const startTime12  = formatTime12h(b.start_time)

    const emailData: BookingEmailData = {
      clientName:      b.client_name,
      clientEmail:     b.client_email ?? '',
      shopName:        shop.name,
      shopAddress:     shop.address,
      shopPhone:       shop.phone,
      shopWebsite:     null,
      serviceName:     b.service?.name ?? 'Your appointment',
      staffName:       b.staff?.name   ?? 'Your barber',
      date:            formattedDate,
      startTime:       startTime12,
      durationMinutes: b.service?.duration_minutes ?? 30,
      price:           b.price,
      currency:        shop.currency ?? 'GBP',
      bookingId:       b.id,
      bookingRef,
    }

    let anySent = false

    // ── Email reminder ────────────────────────────────────────────────────
    if (b.client_email) {
      try {
        const { Resend: ResendClient } = await import('resend')
        const resend = new ResendClient(process.env.RESEND_API_KEY)
        const tmpl   = bookingReminder(emailData)
        const { error: emailErr } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'BarberBoost <noreply@barberboost.app>',
          to:   b.client_email,
          ...tmpl,
        })
        if (emailErr) {
          console.error(`[cron/reminders] email error for ${b.id}:`, emailErr.message)
        } else {
          anySent = true
        }
      } catch (err) {
        console.error(`[cron/reminders] email exception for ${b.id}:`, err)
      }
    }

    // ── WhatsApp reminder ─────────────────────────────────────────────────
    if (b.client_phone) {
      try {
        const text = buildReminderText({
          clientName:  b.client_name,
          shopName:    shop.name,
          serviceName: b.service?.name ?? 'appointment',
          staffName:   b.staff?.name   ?? 'your barber',
          date:        formattedDate,
          startTime:   startTime12,
          shopPhone:   shop.phone,
          bookingRef,
        })
        await sendWhatsApp(b.client_phone, text)
        anySent = true
      } catch (err) {
        console.error(`[cron/reminders] WhatsApp exception for ${b.id}:`, err)
      }
    }

    if (anySent) {
      sentIds.push(b.id)
      results.sent++
    } else {
      results.errors++
    }
  }

  // ── Mark reminders as sent in a single batch update ───────────────────────
  if (sentIds.length) {
    const { error: updateErr } = await supabase
      .from('bookings')
      .update({ reminder_sent: true })
      .in('id', sentIds)

    if (updateErr) {
      console.error('[cron/reminders] batch update error:', updateErr.message)
    }
  }

  console.log(`[cron/reminders] done — sent: ${results.sent}, skipped: ${results.skipped}, errors: ${results.errors}`)
  return NextResponse.json(results)
}
