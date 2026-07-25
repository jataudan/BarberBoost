import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { format } from 'date-fns'
import {
  loadBookingByToken,
  manageBlockReason,
  fmtTime12h,
  fmtLongDate,
} from '@/lib/manage-booking'
import { resolveBarberAlertRecipients } from '@/lib/email/booking-notify'
import {
  bookingConfirmation,
  bookingReceived,
  bookingRescheduledByCustomer,
  type BookingEmailData,
} from '@/lib/email/templates'
import { sendWhatsApp, buildBarberRescheduleText } from '@/lib/whatsapp'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total  = h * 60 + m + minutes
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

// ── POST — customer reschedules their own booking (token-gated, no auth) ────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`manage_reschedule:${ip}`, 10, 60)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
    )
  }

  const { token } = await params
  const body      = await request.json().catch(() => ({})) as { date?: string; start_time?: string }
  const newDate   = body.date
  const newStart  = body.start_time

  if (!newDate || !newStart || !DATE_RE.test(newDate) || !TIME_RE.test(newStart)) {
    return NextResponse.json({ error: 'A valid date and start time are required' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const booking  = await loadBookingByToken(supabase, token)
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const blocked  = manageBlockReason(booking, todayStr)
  if (blocked) {
    return NextResponse.json(
      { error: 'This booking can no longer be rescheduled online. Please call the shop.', code: 'NOT_MANAGEABLE', reason: blocked },
      { status: 409 }
    )
  }

  if (newDate < todayStr) {
    return NextResponse.json({ error: 'Cannot reschedule to a date in the past' }, { status: 400 })
  }

  // Recompute end time server-side from the service duration so it can't be
  // tampered with client-side.
  const duration    = booking.service?.duration_minutes ?? 30
  const normStart   = newStart.slice(0, 5)          // "HH:MM"
  const newEnd      = addMinutesToTime(normStart, duration)
  const oldDate     = booking.date
  const oldStart    = booking.start_time

  // No-op guard: nothing changed.
  if (newDate === oldDate && normStart === oldStart.slice(0, 5)) {
    return NextResponse.json({ error: 'That is already your booking time' }, { status: 400 })
  }

  // ── Clash check (same barber, excluding this booking) ──────────────────────
  const { data: clash } = await supabase
    .from('bookings')
    .select('id')
    .eq('shop_id', booking.shop_id)
    .eq('staff_id', booking.staff_id)
    .eq('date', newDate)
    .neq('status', 'cancelled')
    .neq('id', booking.id)
    .lt('start_time', newEnd)
    .gt('end_time', normStart)
    .limit(1)

  if (clash && clash.length > 0) {
    return NextResponse.json(
      { error: 'That slot has just been taken. Please choose another time.', code: 'SLOT_TAKEN' },
      { status: 409 }
    )
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  const { error: updErr } = await supabase
    .from('bookings')
    .update({ date: newDate, start_time: normStart, end_time: newEnd })
    .eq('id', booking.id)
  if (updErr) {
    console.error('[manage/reschedule] update error:', updErr.message)
    return NextResponse.json({ error: 'Failed to reschedule booking' }, { status: 500 })
  }

  // ── Notifications (all non-blocking) ────────────────────────────────────────
  const appUrl          = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.app'
  const bookingRef      = booking.booking_ref ?? booking.id.slice(0, 8).toUpperCase()
  const oldDateFmt      = fmtLongDate(oldDate)
  const oldTimeFmt      = fmtTime12h(oldStart)
  const newDateFmt      = fmtLongDate(newDate)
  const newTimeFmt      = fmtTime12h(normStart)
  const shopName        = booking.shop?.name ?? 'BarberBoost'
  const currency        = booking.shop?.currency ?? 'GBP'
  const serviceName     = booking.service?.name ?? 'Service'
  const staffName       = booking.staff?.name ?? 'Your barber'

  // Construct the mail client defensively — a missing API key must never turn a
  // successful reschedule into a 500 for the customer.
  let resend: import('resend').Resend | null = null
  try {
    const { Resend: ResendClient } = await import('resend')
    resend = new ResendClient(process.env.RESEND_API_KEY)
  } catch (err) {
    console.error('[manage/reschedule] resend init failed — skipping emails:', err)
  }
  const FROM = process.env.RESEND_FROM_EMAIL ?? 'BarberBoost <noreply@barberboost.app>'

  const manageBase = `${appUrl}/booking/manage/${token}`

  // Customer gets a fresh copy of the appropriate template (with the new time
  // and self-service links intact). A confirmed booking stays confirmed.
  if (resend && booking.client_email) {
    try {
      const emailData: BookingEmailData = {
        clientName:      booking.client_name,
        clientEmail:     booking.client_email,
        shopName,
        shopAddress:     booking.shop?.address ?? null,
        shopPhone:       booking.shop?.phone ?? null,
        shopWebsite:     null,
        serviceName,
        staffName,
        date:            newDateFmt,
        startTime:       newTimeFmt,
        durationMinutes: duration,
        price:           booking.price,
        currency,
        bookingId:       booking.id,
        bookingRef,
        bookingPageUrl:  `${appUrl}/booking/${booking.shop?.slug ?? booking.shop_id}`,
        rescheduleUrl:   `${manageBase}?action=reschedule`,
        cancelUrl:       `${manageBase}?action=cancel`,
      }
      const tmpl = booking.status === 'confirmed'
        ? bookingConfirmation(emailData)
        : bookingReceived(emailData)
      const { error } = await resend.emails.send({ from: FROM, to: booking.client_email, ...tmpl })
      if (error) console.error('[manage/reschedule] customer email error:', error.message)
    } catch (err) {
      console.error('[manage/reschedule] customer email exception:', err)
    }
  }

  // Barber alert (+ owner backstop) that the customer moved the appointment.
  if (booking.shop) {
    try {
      const { recipients, staffPhone } = await resolveBarberAlertRecipients(
        supabase, booking.shop.owner_id, booking.staff_id, '[manage/reschedule]'
      )
      const tmpl = bookingRescheduledByCustomer({
        barberName:   staffName,
        clientName:   booking.client_name,
        clientPhone:  booking.client_phone,
        serviceName,
        oldDate:      oldDateFmt,
        oldStartTime: oldTimeFmt,
        newDate:      newDateFmt,
        newStartTime: newTimeFmt,
        bookingRef,
        shopName,
        dashboardUrl: `${appUrl}/bookings`,
      })
      for (const r of recipients) {
        if (!resend) break
        try {
          const { error } = await resend.emails.send({ from: FROM, to: r.email, ...tmpl })
          if (error) console.error(`[manage/reschedule] ${r.role} alert error:`, error.message)
        } catch (err) {
          console.error(`[manage/reschedule] ${r.role} alert exception:`, err)
        }
      }
      if (staffPhone) {
        try {
          await sendWhatsApp(staffPhone, buildBarberRescheduleText({
            barberName:   staffName,
            clientName:   booking.client_name,
            serviceName,
            oldDate:      oldDateFmt,
            oldStartTime: oldTimeFmt,
            newDate:      newDateFmt,
            newStartTime: newTimeFmt,
            bookingRef,
          }))
        } catch (err) {
          console.error('[manage/reschedule] barber WhatsApp exception:', err)
        }
      }
    } catch (err) {
      console.error('[manage/reschedule] barber alert exception:', err)
    }
  }

  return NextResponse.json({
    data: {
      status:     booking.status,
      date:       newDate,
      start_time: normStart,
      end_time:   newEnd,
      dateFormatted: newDateFmt,
      timeFormatted: newTimeFmt,
    },
  })
}
