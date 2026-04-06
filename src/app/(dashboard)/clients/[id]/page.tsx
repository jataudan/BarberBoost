'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO, differenceInDays } from 'date-fns'
import {
  ArrowLeft, Phone, Mail, Calendar, Star, TrendingUp, Edit,
  Loader2, AlertCircle, MessageSquare, Clock, CheckCircle2,
  XCircle, ClipboardList, User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { createClient as supabaseClient } from '@/lib/supabase/client'
import { ClientModal } from '@/components/clients/ClientModal'
import type { Client, Booking, Service, Staff } from '@/types/database'

// ── localStorage helpers ─────────────────────────────────────────────────
function stored(key: string, fallback = '') {
  return typeof window !== 'undefined' ? (localStorage.getItem(key) ?? fallback) : fallback
}

// ── Tag colours ───────────────────────────────────────────────────────────
const TAG_STYLES: Record<string, string> = {
  VIP:      'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/20',
  Regular:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  New:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'At-risk':'bg-red-500/10 text-red-400 border-red-500/20',
}
const TAG_DEFAULT = 'bg-zinc-700/40 text-zinc-400 border-zinc-600/20'

// ── Booking status colours ────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  confirmed: { bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-500'    },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  pending:   { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  dot: 'bg-yellow-500'  },
  cancelled: { bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-500/60'  },
  no_show:   { bg: 'bg-zinc-500/10',    text: 'text-zinc-400',    dot: 'bg-zinc-500'    },
}

// ── Avatar colours (deterministic) ───────────────────────────────────────
const AVATAR_COLOURS = [
  'bg-[#c9a84c]/20 text-[#c9a84c]',
  'bg-blue-500/20 text-blue-400',
  'bg-indigo-500/20 text-indigo-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-rose-500/20 text-rose-400',
  'bg-violet-500/20 text-violet-400',
]
function avatarColour(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length]
}

// ── Types for joined booking data ─────────────────────────────────────────
interface BookingRow extends Booking {
  service?: Pick<Service, 'id' | 'name' | 'colour'> | null
  staff?:   Pick<Staff,   'id' | 'name'> | null
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode
}) {
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{label}</p>
        <div className="text-zinc-600">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'bookings' | 'notes'

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
        active
          ? 'bg-[#c9a84c]/10 text-[#c9a84c]'
          : 'text-zinc-500 hover:text-zinc-300'
      )}
    >
      {label}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const params   = useParams()
  const router   = useRouter()
  const clientId = params.id as string

  const [shopId]   = useState(() => stored('bb_shop_id'))
  const [currency] = useState(() => stored('bb_currency', 'GBP'))

  const [client,   setClient]   = useState<Client | null>(null)
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [tab,      setTab]      = useState<Tab>('overview')
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!clientId) return
    setLoading(true)

    fetch(`/api/clients?id=${clientId}`)
      .then((r) => r.json())
      .then(({ data, error: err }) => {
        if (err || !data) { setError(err ?? 'Client not found'); setLoading(false); return }
        setClient(data as Client)

        // Load bookings via Supabase client
        const sb = supabaseClient()
        return sb
          .from('bookings')
          .select('*, service:service_id(id,name,colour), staff:staff_id(id,name)')
          .eq('client_id', clientId)
          .order('date', { ascending: false })
          .order('start_time', { ascending: false })
          .limit(50)
          .then(({ data: bData }) => {
            setBookings((bData ?? []) as BookingRow[])
            setLoading(false)
          })
      })
      .catch((e) => { setError((e as Error).message); setLoading(false) })
  }, [clientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="w-8 h-8 text-red-400 opacity-60" />
        <p className="text-sm text-zinc-400">{error ?? 'Client not found'}</p>
        <Link href="/clients" className="text-xs text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">
          Back to clients
        </Link>
      </div>
    )
  }

  const colour = avatarColour(client.name)
  const tags   = (client.tags ?? []) as string[]
  const spent  = new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(client.total_spent ?? 0)
  const avgSpend = client.total_visits ? new Intl.NumberFormat('en-GB', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format((client.total_spent ?? 0) / client.total_visits) : '—'

  const lastVisitLabel = client.last_visit
    ? (() => {
        const days = differenceInDays(new Date(), parseISO(client.last_visit))
        if (days === 0) return 'Today'
        if (days === 1) return 'Yesterday'
        if (days < 7)  return `${days}d ago`
        if (days < 30) return `${Math.floor(days / 7)}w ago`
        return format(parseISO(client.last_visit), 'd MMM yyyy')
      })()
    : 'Never'

  const completedBookings  = bookings.filter((b) => b.status === 'completed')
  const upcomingBookings   = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending')

  return (
    <div className="space-y-5 max-w-4xl">
      {/* ── Back + header ────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors flex-shrink-0 mt-1"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-start gap-4">
          {/* Avatar */}
          <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0', colour)}>
            {getInitials(client.name)}
          </div>

          {/* Name + tags + contact */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">
                {client.name.toUpperCase()}
              </h1>
              {tags.map((t) => (
                <span key={t} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', TAG_STYLES[t] ?? TAG_DEFAULT)}>
                  {t}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  <Phone className="w-3 h-3" />{client.phone}
                </a>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  <Mail className="w-3 h-3" />{client.email}
                </a>
              )}
              {client.date_of_birth && (
                <span className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(client.date_of_birth), 'd MMM yyyy')}
                </span>
              )}
            </div>
          </div>

          {/* Edit button */}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl px-3 py-2 transition-colors flex-shrink-0"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total visits"
          value={client.total_visits ?? 0}
          sub={`Last: ${lastVisitLabel}`}
          icon={<Star className="w-4 h-4" />}
        />
        <StatCard
          label="Total spent"
          value={spent}
          sub={`Avg ${avgSpend}/visit`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Upcoming"
          value={upcomingBookings.length}
          sub={upcomingBookings.length > 0 ? format(parseISO(upcomingBookings[0].date), 'd MMM') : 'None booked'}
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          label="Completed"
          value={completedBookings.length}
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] pb-1">
        <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')} label="Overview"  />
        <TabBtn active={tab === 'bookings'} onClick={() => setTab('bookings')} label={`Bookings (${bookings.length})`} />
        <TabBtn active={tab === 'notes'}    onClick={() => setTab('notes')}    label="Notes" />
      </div>

      {/* ── Tab content ──────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <OverviewTab client={client} upcomingBookings={upcomingBookings} currency={currency} />
      )}
      {tab === 'bookings' && (
        <BookingsTab bookings={bookings} currency={currency} shopId={shopId} clientId={clientId} />
      )}
      {tab === 'notes' && (
        <NotesTab client={client} />
      )}

      {/* ── Edit modal ───────────────────────────────────────────────── */}
      <ClientModal
        shopId={shopId}
        open={editOpen}
        onOpenChange={setEditOpen}
        editClient={client}
        onSuccess={(updated) => setClient(updated)}
      />
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────
function OverviewTab({ client, upcomingBookings, currency }: {
  client:           Client
  upcomingBookings: BookingRow[]
  currency:         string
}) {
  return (
    <div className="space-y-4">
      {/* Upcoming bookings preview */}
      {upcomingBookings.length > 0 && (
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Upcoming</p>
          </div>
          {upcomingBookings.slice(0, 3).map((b) => (
            <BookingRow key={b.id} booking={b} currency={currency} />
          ))}
        </div>
      )}

      {/* Client details */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
        <DetailRow label="Member since" value={format(parseISO(client.created_at), 'd MMMM yyyy')} />
        {client.preferred_barber_id && (
          <DetailRow label="Preferred barber" value={<span className="flex items-center gap-1.5"><User className="w-3 h-3" />Assigned barber</span>} />
        )}
        <DetailRow
          label="Marketing consent"
          value={
            client.marketing_consent
              ? <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3 h-3" />Opted in</span>
              : <span className="flex items-center gap-1 text-zinc-500"><XCircle className="w-3 h-3" />Opted out</span>
          }
        />
        {client.date_of_birth && (
          <DetailRow label="Date of birth" value={format(parseISO(client.date_of_birth), 'd MMMM yyyy')} />
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-xs text-zinc-300">{value}</p>
    </div>
  )
}

// ── Bookings tab ──────────────────────────────────────────────────────────
function BookingsTab({ bookings, currency, shopId: _shopId, clientId: _clientId }: {
  bookings:  BookingRow[]
  currency:  string
  shopId:    string
  clientId:  string
}) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-600">
        <ClipboardList className="w-8 h-8 opacity-30" />
        <p className="text-sm text-zinc-500">No bookings yet</p>
      </div>
    )
  }

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
      {bookings.map((b) => <BookingRow key={b.id} booking={b} currency={currency} />)}
    </div>
  )
}

function BookingRow({ booking: b, currency }: { booking: BookingRow; currency: string }) {
  const style  = STATUS_STYLES[b.status] ?? STATUS_STYLES.pending
  const price  = new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(b.price ?? 0)
  const time   = b.start_time?.slice(0, 5) ?? ''

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.025] transition-colors">
      {/* Date */}
      <div className="text-center flex-shrink-0 w-10">
        <p className="text-[10px] text-zinc-600 uppercase">{format(parseISO(b.date), 'MMM')}</p>
        <p className="text-base font-bold text-white leading-tight">{format(parseISO(b.date), 'd')}</p>
      </div>

      {/* Service + staff */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{b.service?.name ?? 'Service'}</p>
        <p className="text-xs text-zinc-500">{time} · {b.staff?.name ?? 'Staff'}</p>
      </div>

      {/* Status */}
      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline', style.bg, style.text)}>
        {b.status.replace('_', ' ')}
      </span>

      {/* Price */}
      <p className="text-sm font-medium text-zinc-300 flex-shrink-0">{price}</p>
    </div>
  )
}

// ── Notes tab ─────────────────────────────────────────────────────────────
function NotesTab({ client }: { client: Client }) {
  return (
    <div className="space-y-4">
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 min-h-32">
        {client.notes ? (
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{client.notes}</p>
        ) : (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-zinc-600">
            <MessageSquare className="w-6 h-6 opacity-30" />
            <p className="text-xs">No notes added yet</p>
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-600">
        Edit the client profile to update notes.
      </p>
    </div>
  )
}
