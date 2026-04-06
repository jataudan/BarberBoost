import { cn } from '@/lib/utils'

// ── SVG Illustrations ─────────────────────────────────────────────────────

function CalendarIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="8" y="12" width="48" height="44" rx="6" fill="rgba(201,168,76,0.08)" stroke="rgba(201,168,76,0.2)" strokeWidth="1.5"/>
      <rect x="8" y="12" width="48" height="14" rx="6" fill="rgba(201,168,76,0.15)"/>
      <rect x="8" y="20" width="48" height="6" fill="rgba(201,168,76,0.15)"/>
      <line x1="20" y1="8" x2="20" y2="18" stroke="rgba(201,168,76,0.5)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="44" y1="8" x2="44" y2="18" stroke="rgba(201,168,76,0.5)" strokeWidth="2" strokeLinecap="round"/>
      <rect x="16" y="34" width="10" height="8" rx="2" fill="rgba(201,168,76,0.3)"/>
      <rect x="30" y="34" width="10" height="8" rx="2" fill="rgba(255,255,255,0.06)"/>
      <rect x="16" y="46" width="10" height="6" rx="2" fill="rgba(255,255,255,0.06)"/>
      <rect x="30" y="46" width="10" height="6" rx="2" fill="rgba(255,255,255,0.06)"/>
      <rect x="44" y="34" width="10" height="6" rx="2" fill="rgba(255,255,255,0.06)"/>
    </svg>
  )
}

function UsersIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="22" r="12" fill="rgba(201,168,76,0.1)" stroke="rgba(201,168,76,0.25)" strokeWidth="1.5"/>
      <circle cx="32" cy="22" r="7" fill="rgba(201,168,76,0.2)"/>
      <path d="M12 52c0-11 9-18 20-18s20 7 20 18" stroke="rgba(201,168,76,0.25)" strokeWidth="1.5" strokeLinecap="round" fill="rgba(201,168,76,0.06)"/>
      <circle cx="14" cy="28" r="7" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
      <circle cx="50" cy="28" r="7" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
      <path d="M4 52c0-8 4.5-13 10-14" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M60 52c0-8-4.5-13-10-14" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function ScissorsIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="18" cy="22" r="8" fill="rgba(201,168,76,0.1)" stroke="rgba(201,168,76,0.25)" strokeWidth="1.5"/>
      <circle cx="18" cy="22" r="4" fill="rgba(201,168,76,0.2)"/>
      <circle cx="18" cy="44" r="8" fill="rgba(201,168,76,0.1)" stroke="rgba(201,168,76,0.25)" strokeWidth="1.5"/>
      <circle cx="18" cy="44" r="4" fill="rgba(201,168,76,0.2)"/>
      <line x1="24" y1="26" x2="50" y2="12" stroke="rgba(201,168,76,0.4)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="24" y1="40" x2="50" y2="54" stroke="rgba(201,168,76,0.4)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="38" y1="32" x2="50" y2="32" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function PackageIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="12" y="28" width="40" height="28" rx="4" fill="rgba(201,168,76,0.08)" stroke="rgba(201,168,76,0.2)" strokeWidth="1.5"/>
      <path d="M12 32L32 20L52 32" stroke="rgba(201,168,76,0.3)" strokeWidth="1.5" fill="rgba(201,168,76,0.12)"/>
      <line x1="32" y1="20" x2="32" y2="56" stroke="rgba(201,168,76,0.2)" strokeWidth="1.5"/>
      <rect x="24" y="38" width="16" height="10" rx="2" fill="rgba(201,168,76,0.15)"/>
    </svg>
  )
}

function BarChartIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="10" y="40" width="10" height="14" rx="2" fill="rgba(201,168,76,0.15)" stroke="rgba(201,168,76,0.2)" strokeWidth="1"/>
      <rect x="24" y="28" width="10" height="26" rx="2" fill="rgba(201,168,76,0.25)" stroke="rgba(201,168,76,0.3)" strokeWidth="1"/>
      <rect x="38" y="18" width="10" height="36" rx="2" fill="rgba(201,168,76,0.15)" stroke="rgba(201,168,76,0.2)" strokeWidth="1"/>
      <line x1="8" y1="56" x2="56" y2="56" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="52" y1="22" x2="52" y2="54" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export type EmptyStateVariant = 'bookings' | 'clients' | 'services' | 'inventory' | 'analytics' | 'generic'

const ILLUSTRATIONS: Record<EmptyStateVariant, React.FC> = {
  bookings:  CalendarIllustration,
  clients:   UsersIllustration,
  services:  ScissorsIllustration,
  inventory: PackageIllustration,
  analytics: BarChartIllustration,
  generic:   CalendarIllustration,
}

interface EmptyStateProps {
  variant?:    EmptyStateVariant
  title:       string
  description: string
  action?:     { label: string; onClick: () => void }
  className?:  string
}

export function EmptyState({ variant = 'generic', title, description, action, className }: EmptyStateProps) {
  const Illustration = ILLUSTRATIONS[variant]

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-20 gap-5 text-center',
      className
    )}>
      <div className="w-20 h-20 rounded-3xl bg-[#141414] border border-white/[0.06] flex items-center justify-center">
        <Illustration />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold text-zinc-300">{title}</p>
        <p className="text-xs text-zinc-600 leading-relaxed">{description}</p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-sm rounded-xl px-5 py-2.5 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
