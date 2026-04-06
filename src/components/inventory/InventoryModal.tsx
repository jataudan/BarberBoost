'use client'

import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, AlertCircle, Package, Tag, Hash, AlertTriangle, DollarSign, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InventoryItem } from '@/types/database'

// ── Schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  name:                z.string().min(1, 'Name is required').max(100),
  category:            z.string().max(60).optional().or(z.literal('')),
  sku:                 z.string().max(60).optional().or(z.literal('')),
  quantity:            z.coerce.number().int().min(0),
  low_stock_threshold: z.coerce.number().int().min(0),
  cost_price:          z.coerce.number().min(0).optional().or(z.literal('')),
  retail_price:        z.coerce.number().min(0).optional().or(z.literal('')),
  supplier:            z.string().max(100).optional().or(z.literal('')),
  notes:               z.string().max(500).optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

const CATEGORIES = ['Shampoo', 'Conditioner', 'Pomade', 'Oil', 'Clippers', 'Blades', 'Towels', 'Disposables', 'Other']

const INPUT = 'w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20'

export interface InventoryModalProps {
  shopId:       string
  open:         boolean
  onOpenChange: (open: boolean) => void
  editItem?:    InventoryItem | null
  onSuccess?:   (item: InventoryItem) => void
}

export function InventoryModal({ shopId, open, onOpenChange, editItem, onSuccess }: InventoryModalProps) {
  const isEdit = !!editItem

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { name: '', category: '', sku: '', quantity: 0, low_stock_threshold: 5, cost_price: '', retail_price: '', supplier: '', notes: '' },
  })

  useEffect(() => {
    if (editItem) {
      reset({
        name:                editItem.name,
        category:            editItem.category      ?? '',
        sku:                 editItem.sku            ?? '',
        quantity:            editItem.quantity,
        low_stock_threshold: editItem.low_stock_threshold,
        cost_price:          editItem.cost_price     ?? '',
        retail_price:        editItem.retail_price   ?? '',
        supplier:            editItem.supplier       ?? '',
        notes:               editItem.notes          ?? '',
      })
    } else {
      reset({ name: '', category: '', sku: '', quantity: 0, low_stock_threshold: 5, cost_price: '', retail_price: '', supplier: '', notes: '' })
    }
  }, [editItem, open, reset])

  async function onSubmit(values: FormValues) {
    const body = isEdit
      ? JSON.stringify({ id: editItem!.id, ...values, cost_price: values.cost_price || null, retail_price: values.retail_price || null, notes: values.notes || null })
      : JSON.stringify({ shop_id: shopId, ...values, cost_price: values.cost_price || null, retail_price: values.retail_price || null, notes: values.notes || null })

    const res  = await fetch('/api/inventory', { method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body })
    const json = await res.json() as { data?: InventoryItem; error?: string }
    if (!res.ok) { setError('root', { message: json.error ?? 'Something went wrong' }); return }
    if (json.data) onSuccess?.(json.data)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md bg-[#111111] border-l border-white/[0.06] z-50 flex flex-col shadow-2xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300'
        )}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] flex-shrink-0">
            <Dialog.Title className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">
              {isEdit ? 'EDIT ITEM' : 'ADD ITEM'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close"
                className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {errors.root && (
              <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{errors.root.message}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="inv-name" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Package className="w-3 h-3" />Name <span className="text-red-400">*</span>
              </label>
              <input id="inv-name" type="text" placeholder="Pomade Tub 100g"
                className={cn(INPUT, errors.name && 'border-red-500/50')} {...register('name')} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            {/* Category + SKU */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="inv-cat" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Tag className="w-3 h-3" />Category
                </label>
                <input id="inv-cat" type="text" list="inv-cat-list" placeholder="Pomade"
                  className={INPUT} {...register('category')} />
                <datalist id="inv-cat-list">
                  {CATEGORIES.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="inv-sku" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Hash className="w-3 h-3" />SKU
                </label>
                <input id="inv-sku" type="text" placeholder="PMD-001"
                  className={INPUT} {...register('sku')} />
              </div>
            </div>

            {/* Quantity + Low-stock threshold */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="inv-qty" className="text-xs font-medium text-zinc-400">Quantity</label>
                <input id="inv-qty" type="number" min="0" placeholder="0"
                  className={cn(INPUT, errors.quantity && 'border-red-500/50')} {...register('quantity')} />
                {errors.quantity && <p className="text-xs text-red-400">{errors.quantity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="inv-thresh" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <AlertTriangle className="w-3 h-3 text-yellow-500" />Low-stock alert
                </label>
                <input id="inv-thresh" type="number" min="0" placeholder="5"
                  className={INPUT} {...register('low_stock_threshold')} />
              </div>
            </div>

            {/* Cost + Retail */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="inv-cost" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <DollarSign className="w-3 h-3" />Cost price (£)
                </label>
                <input id="inv-cost" type="number" step="0.01" min="0" placeholder="0.00"
                  className={INPUT} {...register('cost_price')} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="inv-retail" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <DollarSign className="w-3 h-3" />Retail price (£)
                </label>
                <input id="inv-retail" type="number" step="0.01" min="0" placeholder="0.00"
                  className={INPUT} {...register('retail_price')} />
              </div>
            </div>

            {/* Supplier */}
            <div className="space-y-1.5">
              <label htmlFor="inv-supplier" className="text-xs font-medium text-zinc-400">Supplier</label>
              <input id="inv-supplier" type="text" placeholder="Wahl UK Ltd"
                className={INPUT} {...register('supplier')} />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label htmlFor="inv-notes" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <FileText className="w-3 h-3" />Notes
              </label>
              <textarea id="inv-notes" rows={3} placeholder="Storage location, reorder link, special instructions…"
                className={cn(INPUT, 'resize-none')} {...register('notes')} />
            </div>
          </form>

          <div className="px-6 py-4 border-t border-white/[0.06] flex-shrink-0 bg-[#0d0d0d]">
            <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-4 py-3 text-sm transition-colors">
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? 'Saving…' : 'Adding…'}</>
                : isEdit ? 'Save Changes' : 'Add Item'
              }
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
