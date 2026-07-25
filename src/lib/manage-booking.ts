/**
 * Shared helpers for the public customer self-service manage flow
 * (`/api/public/manage/[token]` — cancel & reschedule). All access is gated by
 * the unguessable per-booking `manage_token`; reads/writes use the service-role
 * client so no anon RLS policy needs to expose these rows.
 */
import type { createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>

// Only future, still-active bookings can be self-managed by the customer.
export const MANAGEABLE_STATUSES = ['pending', 'confirmed'] as const

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(s: string): boolean {
  return UUID_RE.test(s)
}

export function fmtTime12h(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const d = new Date(); d.setHours(h, m, 0, 0)
  return format(d, 'h:mm a')
}

export function fmtLongDate(date: string): string {
  // `date` is a plain "yyyy-MM-dd"; noon avoids any TZ/DST slippage.
  return format(new Date(date + 'T12:00:00'), 'EEEE, d MMMM yyyy')
}

export interface ManagedBookingShop {
  id: string; owner_id: string; name: string; slug: string | null
  address: string | null; phone: string | null; currency: string | null
}
export interface ManagedBookingService {
  id: string; name: string; duration_minutes: number; price: number
}
export interface ManagedBookingStaff { id: string; name: string }

export interface ManagedBooking {
  id: string
  shop_id: string
  staff_id: string
  service_id: string
  booking_ref: string | null
  client_name: string
  client_email: string | null
  client_phone: string | null
  date: string
  start_time: string
  end_time: string
  status: string
  price: number
  shop: ManagedBookingShop | null
  service: ManagedBookingService | null
  staff: ManagedBookingStaff | null
}

/**
 * Look up a booking by its manage token. Returns null when the token is
 * malformed or no booking matches — callers should treat both as 404.
 */
export async function loadBookingByToken(
  supabase: ServiceClient,
  token: string,
): Promise<ManagedBooking | null> {
  if (!isUuid(token)) return null

  const { data } = await supabase
    .from('bookings')
    .select(`
      id, shop_id, staff_id, service_id, booking_ref, client_name, client_email, client_phone,
      date, start_time, end_time, status, price,
      shop:shops(id, owner_id, name, slug, address, phone, currency),
      service:services(id, name, duration_minutes, price),
      staff:staff(id, name)
    `)
    .eq('manage_token', token)
    .single()

  if (!data) return null
  // Supabase types joined relations as arrays in some configs; normalise to a single object.
  const norm = data as unknown as Record<string, unknown>
  const one = <T,>(v: unknown): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null)) as T | null
  return {
    ...(data as unknown as ManagedBooking),
    shop:    one<ManagedBookingShop>(norm.shop),
    service: one<ManagedBookingService>(norm.service),
    staff:   one<ManagedBookingStaff>(norm.staff),
  }
}

export type ManageBlockReason = 'cancelled' | 'completed' | 'no_show' | 'past' | null

/**
 * Whether a booking may still be cancelled/rescheduled by the customer, and if
 * not, why. `todayStr` is the shop-local "yyyy-MM-dd" (server date is fine for
 * a single-region app).
 */
export function manageBlockReason(booking: ManagedBooking, todayStr: string): ManageBlockReason {
  if (booking.status === 'cancelled') return 'cancelled'
  if (booking.status === 'completed') return 'completed'
  if (booking.status === 'no_show')   return 'no_show'
  if (booking.date < todayStr)        return 'past'
  return null
}
