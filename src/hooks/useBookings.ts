'use client'

import { useState, useCallback, useRef } from 'react'
import type { BookingWithRelations, BookingStatus } from '@/types/database'

export interface BookingFilters {
  date?:       string
  date_from?:  string
  date_to?:    string
  staff_id?:   string
  status?:     BookingStatus | ''
  service_id?: string
  search?:     string
  page?:       number
  limit?:      number
  relations?:  boolean
}

export interface BookingsMeta {
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

export interface CreateBookingPayload {
  shop_id:        string
  staff_id:       string
  service_id:     string
  client_name:    string
  client_email?:  string | null
  client_phone?:  string | null
  client_id?:     string | null
  date:           string
  start_time:     string
  end_time:       string
  price:          number
  deposit_amount?: number
  payment_method?: string
  notes?:         string | null
  source?:        string
}

interface UseBookingsReturn {
  bookings:      BookingWithRelations[]
  meta:          BookingsMeta | null
  loading:       boolean
  error:         string | null
  fetchBookings: (shopId: string, filters?: BookingFilters) => Promise<void>
  createBooking: (payload: CreateBookingPayload) => Promise<{ data?: BookingWithRelations; error?: string; code?: string }>
  updateStatus:  (id: string, status: BookingStatus) => Promise<{ error?: string }>
  cancelBooking: (id: string) => Promise<{ error?: string }>
}

export function useBookings(): UseBookingsReturn {
  const [bookings, setBookings] = useState<BookingWithRelations[]>([])
  const [meta,     setMeta]     = useState<BookingsMeta | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchBookings = useCallback(async (shopId: string, filters: BookingFilters = {}) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ shop_id: shopId })
    if (filters.date)       params.set('date',       filters.date)
    if (filters.date_from)  params.set('date_from',  filters.date_from)
    if (filters.date_to)    params.set('date_to',    filters.date_to)
    if (filters.staff_id)   params.set('staff_id',   filters.staff_id)
    if (filters.status)     params.set('status',     filters.status)
    if (filters.service_id) params.set('service_id', filters.service_id)
    if (filters.search)     params.set('search',     filters.search)
    if (filters.page)       params.set('page',       String(filters.page))
    if (filters.limit)      params.set('limit',      String(filters.limit))
    if (filters.relations === false) params.set('relations', 'false')

    try {
      const res = await fetch(`/api/bookings?${params}`, {
        signal: abortRef.current.signal,
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(json.error ?? 'Failed to fetch bookings')
      }
      const json = await res.json() as { data: BookingWithRelations[]; meta: BookingsMeta }
      setBookings(json.data ?? [])
      setMeta(json.meta ?? null)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const createBooking = useCallback(async (payload: CreateBookingPayload) => {
    try {
      const res = await fetch('/api/bookings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const json = await res.json() as { data?: BookingWithRelations; error?: string; code?: string }
      if (!res.ok) return { error: json.error, code: json.code }
      return { data: json.data }
    } catch (err) {
      return { error: (err as Error).message }
    }
  }, [])

  const updateStatus = useCallback(async (id: string, status: BookingStatus) => {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b))
    try {
      const res = await fetch('/api/bookings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, status }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) return { error: json.error }
      return {}
    } catch (err) {
      return { error: (err as Error).message }
    }
  }, [])

  const cancelBooking = useCallback(async (id: string) => {
    setBookings((prev) => prev.map((b) =>
      b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b
    ))
    try {
      const res = await fetch('/api/bookings', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) return { error: json.error }
      return {}
    } catch (err) {
      return { error: (err as Error).message }
    }
  }, [])

  return { bookings, meta, loading, error, fetchBookings, createBooking, updateStatus, cancelBooking }
}
