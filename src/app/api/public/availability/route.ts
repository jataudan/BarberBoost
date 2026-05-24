import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── Helpers ───────────────────────────────────────────────────────────────

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
const DAY_KEYS: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

interface DayHours { open: string; close: string; closed: boolean }

function getStaffHoursForDay(
  staffHours: Partial<Record<DayKey, DayHours>>,
  shopHours:  Partial<Record<DayKey, DayHours>>,
  dayKey: DayKey,
): DayHours | null {
  const h = staffHours[dayKey] ?? shopHours[dayKey]
  if (!h || h.closed) return null
  return h
}

// ── GET ───────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const sp         = request.nextUrl.searchParams
  const shopId     = sp.get('shop_id')
  const serviceId  = sp.get('service_id')
  const staffParam = sp.get('staff_id') ?? 'any'  // UUID or 'any'
  const date       = sp.get('date')               // 'yyyy-MM-dd'

  if (!shopId || !serviceId || !date) {
    return NextResponse.json({ error: 'shop_id, service_id and date are required' }, { status: 400 })
  }

  // Validate date is not in the past and within 60 days
  const requested  = new Date(date)
  const today      = new Date(); today.setHours(0, 0, 0, 0)
  const maxDate    = new Date(today); maxDate.setDate(today.getDate() + 60)
  if (requested < today || requested > maxDate) {
    return NextResponse.json({ slots: [] })
  }

  const supabase = await createClient()

  // ── Fetch service ───────────────────────────────────────────────────────
  const { data: service } = await supabase
    .from('services')
    .select('id, duration_minutes, is_active')
    .eq('id', serviceId)
    .eq('shop_id', shopId)
    .single()

  if (!service || !service.is_active) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  // ── Fetch shop opening hours ─────────────────────────────────────────────
  const { data: shop } = await supabase
    .from('shops')
    .select('id, opening_hours')
    .eq('id', shopId)
    .single()

  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const shopHours = (shop.opening_hours ?? {}) as Partial<Record<DayKey, DayHours>>

  // ── Fetch staff ──────────────────────────────────────────────────────────
  let staffRows: { id: string; working_hours: Partial<Record<DayKey, DayHours>>; blocked_dates: string[] }[] = []

  if (staffParam !== 'any') {
    const { data } = await supabase
      .from('staff')
      .select('id, working_hours, blocked_dates')
      .eq('id', staffParam)
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .single()
    if (data) {
      staffRows = [{
        id:            data.id,
        working_hours: (data.working_hours ?? {}) as Partial<Record<DayKey, DayHours>>,
        blocked_dates: (data.blocked_dates as string[] | null) ?? [],
      }]
    }
  } else {
    const { data } = await supabase
      .from('staff')
      .select('id, working_hours, blocked_dates')
      .eq('shop_id', shopId)
      .eq('is_active', true)
    staffRows = (data ?? []).map(s => ({
      id:            s.id,
      working_hours: (s.working_hours ?? {}) as Partial<Record<DayKey, DayHours>>,
      blocked_dates: (s.blocked_dates as string[] | null) ?? [],
    }))
  }

  if (!staffRows.length) return NextResponse.json({ slots: [] })

  // Filter out staff who have this specific date blocked
  const availableStaff = staffRows.filter(s => !s.blocked_dates.includes(date))

  // If a specific barber was requested and they're blocked, return blocked signal
  if (staffParam !== 'any' && staffRows.length > 0 && availableStaff.length === 0) {
    return NextResponse.json({ slots: [], blocked: true })
  }

  if (!availableStaff.length) return NextResponse.json({ slots: [] })
  staffRows = availableStaff

  // ── Fetch existing bookings for this date ───────────────────────────────
  const { data: existingBkgs } = await supabase
    .from('bookings')
    .select('staff_id, start_time, end_time')
    .eq('shop_id', shopId)
    .eq('date', date)
    .neq('status', 'cancelled')
    .in('staff_id', staffRows.map(s => s.id))

  const bookings = existingBkgs ?? []
  const duration = service.duration_minutes
  const SLOT_INTERVAL = 15  // Generate slots every 15 minutes

  // ── Build a slot map across all eligible staff ───────────────────────────
  // dayKey for the requested date
  const dateObj = new Date(date + 'T12:00:00Z') // noon UTC avoids DST boundary issues
  const dayKey  = DAY_KEYS[dateObj.getUTCDay()] as DayKey

  // Build per-staff booked intervals
  const staffBookings = new Map<string, { start: number; end: number }[]>()
  for (const b of bookings) {
    if (!b.staff_id) continue
    const prev = staffBookings.get(b.staff_id) ?? []
    prev.push({ start: timeToMin(b.start_time), end: timeToMin(b.end_time) })
    staffBookings.set(b.staff_id, prev)
  }

  // For each possible slot time, find which staff (if any) is free
  const slotMap = new Map<number, { available: boolean; staffId: string }>()

  for (const staff of staffRows) {
    const hours = getStaffHoursForDay(staff.working_hours, shopHours, dayKey)
    if (!hours) continue

    const openMin  = timeToMin(hours.open)
    const closeMin = timeToMin(hours.close)
    const busyList = staffBookings.get(staff.id) ?? []

    for (let t = openMin; t + duration <= closeMin; t += SLOT_INTERVAL) {
      const slotEnd = t + duration

      // Check if this staff is free at this slot
      const clash = busyList.some(b => b.start < slotEnd && b.end > t)

      // Only upgrade to available — once a slot is marked available, keep it
      if (!clash) {
        if (!slotMap.has(t) || !slotMap.get(t)!.available) {
          slotMap.set(t, { available: true, staffId: staff.id })
        }
      } else if (!slotMap.has(t)) {
        slotMap.set(t, { available: false, staffId: staff.id })
      }
    }
  }

  // ── Sort and return ──────────────────────────────────────────────────────
  const slots = [...slotMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([startMin, info]) => ({
      time:      minToTime(startMin),
      end_time:  minToTime(startMin + duration),
      available: info.available,
      staffId:   info.available ? info.staffId : null,
    }))

  return NextResponse.json({ slots })
}
