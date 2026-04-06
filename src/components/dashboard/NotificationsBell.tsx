'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, X, CheckCheck, Calendar, XCircle, Star,
  DollarSign, Package, CreditCard, AlertTriangle, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'

// ── Notification type config ──────────────────────────────────────────────
type NotifConfig = { icon: React.ElementType; colour: string; route: string }

const TYPE_CONFIG: Record<string, NotifConfig> = {
  new_booking:       { icon: Calendar,      colour: 'text-emerald-400', route: '/bookings'          },
  booking_cancelled: { icon: XCircle,       colour: 'text-red-400',     route: '/bookings'          },
  new_review:        { icon: Star,          colour: 'text-yellow-400',  route: '/marketing'         },
  commission:        { icon: DollarSign,    colour: 'text-[#c9a84c]',   route: '/staff'             },
  low_stock:         { icon: Package,       colour: 'text-amber-400',   route: '/inventory'         },
  payment_failed:    { icon: CreditCard,    colour: 'text-red-400',     route: '/settings/billing'  },
  subscription:      { icon: CreditCard,    colour: 'text-indigo-400',  route: '/settings/billing'  },
  usage_limit:       { icon: AlertTriangle, colour: 'text-orange-400',  route: '/settings/billing'  },
}
const FALLBACK_CONFIG: NotifConfig = { icon: Info, colour: 'text-zinc-400', route: '/dashboard' }

function getConfig(type: string): NotifConfig {
  return TYPE_CONFIG[type] ?? FALLBACK_CONFIG
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ── Component ─────────────────────────────────────────────────────────────

interface Props {
  shopId:       string
  initialCount: number
}

export function NotificationsBell({ shopId, initialCount }: Props) {
  const router         = useRouter()
  const [open, setOpen]             = useState(false)
  const [notifs, setNotifs]         = useState<Notification[]>([])
  const [unread, setUnread]         = useState(initialCount)
  const [loaded, setLoaded]         = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const panelRef                    = useRef<HTMLDivElement | undefined>(undefined)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Load notifications on first open
  const loadNotifs = useCallback(async () => {
    if (loaded) return
    setLoaded(true)
    const res  = await fetch('/api/notifications?limit=30')
    const json = await res.json() as { data?: Notification[] }
    setNotifs(json.data ?? [])
    setUnread((json.data ?? []).filter(n => !n.is_read).length)
  }, [loaded])

  useEffect(() => {
    if (open) loadNotifs()
  }, [open, loadNotifs])

  // Supabase Realtime subscription for new notifications
  useEffect(() => {
    if (!shopId) return
    const supabase = createClient()
    const channel  = supabase
      .channel(`notifications:${shopId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'notifications',
        filter: `shop_id=eq.${shopId}`,
      }, (payload) => {
        const n = payload.new as Notification
        setNotifs(prev => [n, ...prev])
        setUnread(u => u + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [shopId])

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  async function markAllRead() {
    setMarkingAll(true)
    await fetch('/api/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ all: true }),
    })
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
    setMarkingAll(false)
  }

  async function handleClick(n: Notification) {
    const cfg = getConfig(n.type)
    if (!n.is_read) await markRead(n.id)
    setOpen(false)
    router.push(cfg.route)
  }

  return (
    <div className="relative" ref={el => { panelRef.current = el ?? undefined }}>
      {/* Bell button */}
      <button
        type="button"
        aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
        onClick={() => setOpen(v => !v)}
        className={cn(
          'relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors',
          open
            ? 'bg-white/[0.08] text-white'
            : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
        )}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#111111] border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-300">Notifications</span>
              {unread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button type="button" onClick={markAllRead} disabled={markingAll}
                  title="Mark all as read"
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors disabled:opacity-40">
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {!loaded ? (
              /* Loading skeleton */
              <div className="p-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-2 animate-pulse">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-2.5 bg-white/[0.05] rounded w-3/4" />
                      <div className="h-2 bg-white/[0.04] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                  <Bell className="w-5 h-5 text-zinc-700" />
                </div>
                <p className="text-xs text-zinc-600">No notifications yet</p>
              </div>
            ) : (
              notifs.map(n => {
                const { icon: Icon, colour } = getConfig(n.type)
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClick(n)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]',
                      !n.is_read && 'bg-white/[0.02]'
                    )}
                  >
                    {/* Icon */}
                    <div className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                      n.is_read ? 'bg-white/[0.04]' : 'bg-white/[0.07]'
                    )}>
                      <Icon className={cn('w-4 h-4', colour)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-xs leading-snug truncate',
                        n.is_read ? 'text-zinc-400' : 'text-white font-medium'
                      )}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-[11px] text-zinc-600 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-700 mt-1">{timeAgo(n.created_at)}</p>
                    </div>

                    {/* Unread dot */}
                    {!n.is_read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] mt-2 flex-shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
