'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X, Clock, Tag, Scissors, Edit, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Service } from '@/types/database'

export interface ServiceDetailModalProps {
  service:      Service | null
  open:         boolean
  currency:     string
  onOpenChange: (open: boolean) => void
  onEdit:       (s: Service) => void
  onToggle:     (s: Service) => void
  onDelete:     (s: Service) => void
}

export function ServiceDetailModal({ service, open, currency, onOpenChange, onEdit, onToggle, onDelete }: ServiceDetailModalProps) {
  if (!service) return null

  const price = new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 2 }).format(service.price)
  const scopeClass = `svc-detail-${service.id.replace(/-/g, '').slice(0, 12)}`

  const durationLabel = service.duration_minutes < 60
    ? `${service.duration_minutes} min`
    : `${Math.floor(service.duration_minutes / 60)}h${service.duration_minutes % 60 > 0 ? ` ${service.duration_minutes % 60}m` : ''}`

  return (
    <>
      <style>{`.${scopeClass}{--svc-colour:${service.colour}}`}</style>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className={cn(
            scopeClass,
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-full max-w-md',
            'bg-[#111111] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'duration-200',
          )}>
            {/* Colour stripe */}
            <div className="h-1 w-full [background-color:var(--svc-colour)]" role="presentation" aria-hidden="true" />

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 [background-color:color-mix(in_srgb,var(--svc-colour)_15%,transparent)]">
                  <Scissors className="w-5 h-5 [color:var(--svc-colour)]" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <Dialog.Title className="text-lg font-bold text-white leading-tight truncate">{service.name}</Dialog.Title>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 flex items-center gap-1 flex-shrink-0">
                      <Tag className="w-2.5 h-2.5" />{service.category}
                    </span>
                    <span className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0',
                      service.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700/40 text-zinc-500'
                    )}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <Dialog.Close asChild>
                <button type="button" aria-label="Close"
                  className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors flex items-center justify-center flex-shrink-0 ml-3">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Body */}
            <div className="px-6 pb-6 space-y-5">
              {/* Description */}
              {service.description && (
                <p className="text-sm text-zinc-400 leading-relaxed">{service.description}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0d0d0d] border border-white/[0.05] rounded-xl px-4 py-3">
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3" />Duration
                  </p>
                  <p className="text-xl font-bold text-white">{durationLabel}</p>
                </div>
                <div className="bg-[#0d0d0d] border border-white/[0.05] rounded-xl px-4 py-3">
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">Price</p>
                  <p className="text-xl font-bold [color:var(--svc-colour)]">{price}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { onOpenChange(false); onEdit(service) }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] rounded-xl transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />Edit service
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenChange(false); onToggle(service) }}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium bg-white/[0.06] hover:bg-white/[0.10] text-zinc-300 rounded-xl transition-colors"
                >
                  {service.is_active
                    ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                    : <ToggleLeft  className="w-4 h-4 text-zinc-500" />
                  }
                  {service.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenChange(false); onDelete(service) }}
                  className="w-10 h-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                  aria-label="Delete service"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
