'use client'

import Link from 'next/link'
import { format, parseISO, differenceInDays } from 'date-fns'
import { Phone, Mail, Calendar, Star, TrendingUp, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import type { Client } from '@/types/database'

// ── Tag styles ────────────────────────────────────────────────────────────
const TAG_STYLES: Record<string, string> = {
  VIP:      'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/20',
  Regular:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  New:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'At-risk':'bg-red-500/10 text-red-400 border-red-500/20',
}

const TAG_DEFAULT = 'bg-zinc-700/40 text-zinc-400 border-zinc-600/20'

function TagChip({ tag }: { tag: string }) {
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', TAG_STYLES[tag] ?? TAG_DEFAULT)}>
      {tag}
    </span>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────
// Colours cycle deterministically from name
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

// ── Props ─────────────────────────────────────────────────────────────────
interface ClientCardProps {
  client:     Client
  currency:   string
  onEdit?:    (client: Client) => void
  onDelete?:  (client: Client) => void
}

// ── Component ─────────────────────────────────────────────────────────────
export function ClientCard({ client, currency, onEdit, onDelete }: ClientCardProps) {
  const colour = avatarColour(client.name)
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

  const spent = new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(client.total_spent ?? 0)
  const tags  = (client.tags ?? []) as string[]

  return (
    <div className="group relative bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-[#c9a84c]/25 hover:shadow-[0_0_24px_rgba(201,168,76,0.06)] transition-all duration-300 flex flex-col gap-4">
      {/* Actions dropdown */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Client actions"
              className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-50 min-w-[130px] bg-[#1a1a1a] border border-white/[0.1] rounded-xl p-1 shadow-2xl"
            >
              <DropdownMenu.Item asChild>
                <button type="button" onClick={() => onEdit?.(client)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-lg outline-none text-left">
                  <Edit className="w-3.5 h-3.5" />Edit
                </button>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <button type="button" onClick={() => onDelete?.(client)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.06] rounded-lg outline-none text-left">
                  <Trash2 className="w-3.5 h-3.5" />Delete
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Avatar + name */}
      <Link href={`/clients/${client.id}`} className="flex items-center gap-3 min-w-0">
        {client.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={client.logo_url} alt={client.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className={cn('w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0', colour)}>
            {getInitials(client.name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-white truncate group-hover:text-[#c9a84c] transition-colors">{client.name}</p>
          {tags.length > 0 && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {tags.slice(0, 3).map((t) => <TagChip key={t} tag={t} />)}
            </div>
          )}
        </div>
      </Link>

      {/* Contact info */}
      <div className="space-y-1.5 min-w-0">
        {client.phone && (
          <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors truncate">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />{client.phone}
          </a>
        )}
        {client.email && (
          <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors truncate">
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />{client.email}
          </a>
        )}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          Last visit: <span className={cn('font-medium', client.last_visit ? 'text-zinc-300' : 'text-zinc-600')}>{lastVisitLabel}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.05]">
        <div className="space-y-0.5">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Visits</p>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-[#c9a84c]" />
            <span className="text-sm font-bold text-white">{client.total_visits ?? 0}</span>
          </div>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Total spent</p>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-sm font-bold text-white">{spent}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Temp: expose logo_url on Client type workaround
declare module '@/types/database' {
  interface Client {
    logo_url?: string | null
  }
}
