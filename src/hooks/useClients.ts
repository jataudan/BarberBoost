'use client'

import { useState, useCallback, useRef } from 'react'
import type { Client } from '@/types/database'

// ── Auto-tag helper (matches server-side logic) ───────────────────────────
export function computeClientTags(
  totalVisits: number,
  totalSpent: number,
  lastVisit: string | null,
  recentVisits = 0
): string[] {
  const tags: string[] = []
  const daysSinceLast = lastVisit
    ? Math.floor((Date.now() - new Date(lastVisit).getTime()) / 86_400_000)
    : 999
  if (totalVisits <= 1)   tags.push('New')
  if (recentVisits >= 5)  tags.push('Regular')
  if (totalSpent >= 500)  tags.push('VIP')
  if (daysSinceLast >= 60 && totalVisits > 1) tags.push('At-risk')
  return tags
}

// ── Filter types ──────────────────────────────────────────────────────────
export interface ClientFilters {
  search?:  string
  tag?:     string
  sort?:    'name' | 'last_visit' | 'spent' | 'visits'
  page?:    number
  limit?:   number
}

export interface ClientsMeta {
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

export interface CreateClientPayload {
  shop_id:              string
  name:                 string
  email?:               string | null
  phone?:               string | null
  date_of_birth?:       string | null
  preferred_barber_id?: string | null
  tags?:                string[]
  notes?:               string | null
  marketing_consent?:   boolean
}

export type UpdateClientPayload = Partial<Omit<CreateClientPayload, 'shop_id'>> & {
  total_visits?: number
  total_spent?:  number
  last_visit?:   string | null
}

interface UseClientsReturn {
  clients:       Client[]
  meta:          ClientsMeta | null
  loading:       boolean
  error:         string | null
  fetchClients:  (shopId: string, filters?: ClientFilters) => Promise<void>
  createClient:  (payload: CreateClientPayload) => Promise<{ data?: Client; error?: string; code?: string; limit?: number }>
  updateClient:  (id: string, updates: UpdateClientPayload) => Promise<{ data?: Client; error?: string }>
  deleteClient:  (id: string) => Promise<{ error?: string }>
}

export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([])
  const [meta,    setMeta]    = useState<ClientsMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchClients = useCallback(async (shopId: string, filters: ClientFilters = {}) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true); setError(null)

    const params = new URLSearchParams({ shop_id: shopId })
    if (filters.search) params.set('search', filters.search)
    if (filters.tag)    params.set('tag',    filters.tag)
    if (filters.sort)   params.set('sort',   filters.sort)
    if (filters.page)   params.set('page',   String(filters.page))
    if (filters.limit)  params.set('limit',  String(filters.limit))

    try {
      const res  = await fetch(`/api/clients?${params}`, { signal: abortRef.current.signal })
      const json = await res.json() as { data?: Client[]; meta?: ClientsMeta; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to fetch clients')
      setClients(json.data ?? [])
      setMeta(json.meta ?? null)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createClient = useCallback(async (payload: CreateClientPayload) => {
    try {
      const res  = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json() as { data?: Client; error?: string; code?: string; limit?: number }
      if (!res.ok) return { error: json.error, code: json.code, limit: json.limit }
      if (json.data) setClients((prev) => [...prev, json.data!].sort((a, b) => a.name.localeCompare(b.name)))
      return { data: json.data }
    } catch (err) {
      return { error: (err as Error).message }
    }
  }, [])

  const updateClient = useCallback(async (id: string, updates: UpdateClientPayload) => {
    // Optimistic update
    setClients((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c))
    try {
      const res  = await fetch('/api/clients', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) })
      const json = await res.json() as { data?: Client; error?: string }
      if (!res.ok) { setClients((prev) => prev.map((c) => c.id === id ? c : c)); return { error: json.error } }
      if (json.data) setClients((prev) => prev.map((c) => c.id === id ? json.data! : c))
      return { data: json.data }
    } catch (err) {
      return { error: (err as Error).message }
    }
  }, [])

  const deleteClient = useCallback(async (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
    try {
      const res  = await fetch('/api/clients', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      const json = await res.json() as { error?: string }
      if (!res.ok) { return { error: json.error } }
      return {}
    } catch (err) {
      return { error: (err as Error).message }
    }
  }, [])

  return { clients, meta, loading, error, fetchClients, createClient, updateClient, deleteClient }
}
