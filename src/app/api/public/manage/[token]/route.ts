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

// ── GET — fetch a booking for the customer manage page (token-gated) ────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`manage_get:${ip}`, 60, 60)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
    )
  }

  const { token } = await params
  const supabase = await createServiceClient()
  const booking  = await loadBookingByToken(supabase, token)

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const blocked  = manageBlockReason(booking, todayStr)

  return NextResponse.json({
    data: {
      // Identifiers the reschedule availability lookup needs.
      shop_id:    booking.shop_id,
      service_id: booking.service_id,
      staff_id:   booking.staff_id,
      // Display fields.
      bookingRef:      booking.booking_ref,
      status:          booking.status,
      clientName:      booking.client_name,
      shopName:        booking.shop?.name ?? '',
      shopSlug:        booking.shop?.slug ?? null,
      shopPhone:       booking.shop?.phone ?? null,
      shopAddress:     booking.shop?.address ?? null,
      currency:        booking.shop?.currency ?? 'GBP',
      serviceName:     booking.service?.name ?? 'Service',
      durationMinutes: booking.service?.duration_minutes ?? 30,
      price:           booking.price,
      staffName:       booking.staff?.name ?? 'Your barber',
      date:            booking.date,
      startTime:       booking.start_time,
      endTime:         booking.end_time,
      dateFormatted:   fmtLongDate(booking.date),
      timeFormatted:   fmtTime12h(booking.start_time),
      // Manageability signal for the UI.
      manageable:  blocked === null,
      blockReason: blocked,
    },
  })
}
