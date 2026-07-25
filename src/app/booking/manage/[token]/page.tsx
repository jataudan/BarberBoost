import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import {
  loadBookingByToken,
  manageBlockReason,
  fmtTime12h,
  fmtLongDate,
} from '@/lib/manage-booking'
import { ManageBookingClient } from '@/components/booking/ManageBookingClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Manage your booking',
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ token: string }>
}

export default async function ManageBookingPage({ params }: Props) {
  const { token } = await params
  const supabase  = await createServiceClient()
  const booking   = await loadBookingByToken(supabase, token)

  if (!booking) notFound()

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const blocked  = manageBlockReason(booking, todayStr)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-lg font-black tracking-[0.14em] text-[#c9a84c]">BARBERBOOST</span>
          <div className="text-xs text-zinc-500 mt-1 tracking-wide uppercase">
            {booking.shop?.name ?? ''}
          </div>
        </div>

        <ManageBookingClient
          token={token}
          shopId={booking.shop_id}
          serviceId={booking.service_id}
          staffId={booking.staff_id}
          initial={{
            bookingRef:      booking.booking_ref,
            status:          booking.status,
            clientName:      booking.client_name,
            serviceName:     booking.service?.name ?? 'Service',
            staffName:       booking.staff?.name ?? 'Your barber',
            durationMinutes: booking.service?.duration_minutes ?? 30,
            price:           booking.price,
            currency:        booking.shop?.currency ?? 'GBP',
            shopPhone:       booking.shop?.phone ?? null,
            shopSlug:        booking.shop?.slug ?? null,
            date:            booking.date,
            startTime:       booking.start_time,
            dateFormatted:   fmtLongDate(booking.date),
            timeFormatted:   fmtTime12h(booking.start_time),
            manageable:      blocked === null,
            blockReason:     blocked,
          }}
        />
      </div>
    </div>
  )
}
