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
import { bookingCancellation, bookingCancelledByCustomer, type BookingEmailData } from '@/lib/email/templates'
import { sendWhatsApp, buildBarberCancellationText } from '@/lib/whatsapp'

// ── POST — customer cancels their own booking (token-gated, no auth) ────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`manage_cancel:${ip}`, 10, 60)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
    )
  }

  const { token } = await params
  const supabase  = await createServiceClient()
  const booking   = await loadBookingByToken(supabase, token)

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const blocked  = manageBlockReason(booking, todayStr)
  if (blocked === 'cancelled') {
    // Idempotent — already cancelled, treat as success.
    return NextResponse.json({ data: { status: 'cancelled' } })
  }
  if (blocked) {
    return NextResponse.json(
      { error: 'This booking can no longer be cancelled online. Please call the shop.', code: 'NOT_MANAGEABLE', reason: blocked },
      { status: 409 }
    )
  }

  // ── Cancel ────────────────────────────────────────────────────────────────
  const { error: updErr } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', booking.id)
  if (updErr) {
    console.error('[manage/cancel] update error:', updErr.message)
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
  }

  // ── Notifications (all non-blocking) ────────────────────────────────────────
  const appUrl        = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.app'
  const bookingRef    = booking.booking_ref ?? booking.id.slice(0, 8).toUpperCase()
  const formattedDate = fmtLongDate(booking.date)
  const formattedTime = fmtTime12h(booking.start_time)
  const shopName      = booking.shop?.name ?? 'BarberBoost'
  const currency      = booking.shop?.currency ?? 'GBP'
  const serviceName   = booking.service?.name ?? 'Service'
  const staffName     = booking.staff?.name ?? 'Your barber'

  // Construct the mail client defensively — a missing API key must never turn a
  // successful cancellation into a 500 for the customer.
  let resend: import('resend').Resend | null = null
  try {
    const { Resend: ResendClient } = await import('resend')
    resend = new ResendClient(process.env.RESEND_API_KEY)
  } catch (err) {
    console.error('[manage/cancel] resend init failed — skipping emails:', err)
  }
  const FROM = process.env.RESEND_FROM_EMAIL ?? 'BarberBoost <noreply@barberboost.app>'

  // Customer confirmation of cancellation.
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
        date:            formattedDate,
        startTime:       formattedTime,
        durationMinutes: booking.service?.duration_minutes ?? 30,
        price:           booking.price,
        currency,
        bookingId:       booking.id,
        bookingRef,
        bookingPageUrl:  `${appUrl}/booking/${booking.shop?.slug ?? booking.shop_id}`,
      }
      const tmpl = bookingCancellation(emailData)
      const { error } = await resend.emails.send({ from: FROM, to: booking.client_email, ...tmpl })
      if (error) console.error('[manage/cancel] customer email error:', error.message)
    } catch (err) {
      console.error('[manage/cancel] customer email exception:', err)
    }
  }

  // Barber alert (+ owner backstop) that the customer cancelled.
  if (booking.shop) {
    try {
      const { recipients, staffPhone } = await resolveBarberAlertRecipients(
        supabase, booking.shop.owner_id, booking.staff_id, '[manage/cancel]'
      )
      const tmpl = bookingCancelledByCustomer({
        barberName:   staffName,
        clientName:   booking.client_name,
        clientPhone:  booking.client_phone,
        serviceName,
        date:         formattedDate,
        startTime:    formattedTime,
        bookingRef,
        shopName,
        dashboardUrl: `${appUrl}/bookings`,
      })
      for (const r of recipients) {
        if (!resend) break
        try {
          const { error } = await resend.emails.send({ from: FROM, to: r.email, ...tmpl })
          if (error) console.error(`[manage/cancel] ${r.role} alert error:`, error.message)
        } catch (err) {
          console.error(`[manage/cancel] ${r.role} alert exception:`, err)
        }
      }
      if (staffPhone) {
        try {
          await sendWhatsApp(staffPhone, buildBarberCancellationText({
            barberName: staffName,
            clientName: booking.client_name,
            serviceName,
            date:       formattedDate,
            startTime:  formattedTime,
            bookingRef,
          }))
        } catch (err) {
          console.error('[manage/cancel] barber WhatsApp exception:', err)
        }
      }
    } catch (err) {
      console.error('[manage/cancel] barber alert exception:', err)
    }
  }

  return NextResponse.json({ data: { status: 'cancelled' } })
}
