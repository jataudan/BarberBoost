'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Search, X, Package, AlertTriangle, Pencil, Trash2,
  Loader2, ChevronDown, ChevronUp, SlidersHorizontal, TrendingUp,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { InventoryModal } from '@/components/inventory/InventoryModal'
import { StockAdjustmentPopover } from '@/components/inventory/StockAdjustmentPopover'
import { UpgradeModal } from '@/components/shared/UpgradeModal'
import type { InventoryItem } from '@/types/database'
import type { PlanId } from '@/lib/stripe/plans'
import { PLANS } from '@/lib/stripe/plans'

// ── Constants ─────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Shampoo', 'Conditioner', 'Pomade', 'Oil', 'Clippers', 'Blades', 'Towels', 'Disposables', 'Other']

type SortKey = 'name' | 'category' | 'quantity' | 'cost_price' | 'retail_price'
type SortDir = 'asc' | 'desc'

// ── Status helpers ────────────────────────────────────────────────────────

type StockStatus = 'critical' | 'warning' | 'ok'

function getStatus(item: InventoryItem): StockStatus {
  if (item.quantity <= item.low_stock_threshold) return 'critical'
  if (item.quantity <= Math.ceil(item.low_stock_threshold * 1.2)) return 'warning'
  return 'ok'
}

const STATUS_STYLES: Record<StockStatus, { badge: string; row: string; qty: string }> = {
  critical: {
    badge: 'bg-red-500/10   text-red-400   border-red-500/25',
    row:   'bg-red-500/[0.03]',
    qty:   'bg-red-500/10   text-red-400   border-red-500/20',
  },
  warning: {
    badge: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/25',
    row:   'bg-yellow-400/[0.03]',
    qty:   'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  },
  ok: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    row:   '',
    qty:   'bg-white/[0.05]   text-zinc-300   border-white/[0.06]',
  },
}

const STATUS_LABELS: Record<StockStatus, string> = {
  critical: 'Critical',
  warning:  'Low Stock',
  ok:       'In Stock',
}

// ── Currency formatter ────────────────────────────────────────────────────

function fmtPrice(v: number | null | undefined, currency: string) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 2 }).format(v)
}

// ── Blurred locked preview ────────────────────────────────────────────────

const MOCK_ITEMS: InventoryItem[] = [
  { id: '1', shop_id: '', name: 'Pomade Strong Hold', category: 'Pomade',       sku: 'PMD-001', quantity: 2,  low_stock_threshold: 5,  cost_price: 3.50,  retail_price: 8.99,  supplier: 'Wahl UK',   notes: null, created_at: '' },
  { id: '2', shop_id: '', name: 'Barbicide Disinfectant', category: 'Other',    sku: 'DIS-003', quantity: 12, low_stock_threshold: 3,  cost_price: 5.00,  retail_price: 14.50, supplier: 'King Pro',  notes: null, created_at: '' },
  { id: '3', shop_id: '', name: 'Shaving Cream 200ml',  category: 'Other',      sku: 'SHV-007', quantity: 0,  low_stock_threshold: 4,  cost_price: 2.20,  retail_price: 6.00,  supplier: 'Taylor Ltd',notes: null, created_at: '' },
  { id: '4', shop_id: '', name: 'Premium Blade Pack ×10', category: 'Blades',   sku: 'BLD-010', quantity: 8,  low_stock_threshold: 10, cost_price: 4.00,  retail_price: 12.00, supplier: 'Gillette',  notes: null, created_at: '' },
  { id: '5', shop_id: '', name: 'Scalp Conditioner 500ml', category: 'Conditioner', sku: 'CDN-002', quantity: 6, low_stock_threshold: 5, cost_price: 7.80, retail_price: 18.99, supplier: 'Kerastase', notes: null, created_at: '' },
]

function LockedPreview({ plan, onUpgrade }: { plan: PlanId; onUpgrade: () => void }) {
  return (
    <div className="relative">
      {/* Blurred mock content */}
      <div className="pointer-events-none select-none blur-sm opacity-40 space-y-5">
        {/* Mock summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', value: '24' },
            { label: 'Low Stock Alerts', value: '3'  },
            { label: 'Inventory Value', value: '£412' },
            { label: 'Retail Value',    value: '£1,240' },
          ].map(c => (
            <div key={c.label} className="bg-[#111111] border border-[#1e1e1e] rounded-2xl px-4 py-4">
              <p className="text-xs text-zinc-500">{c.label}</p>
              <p className="text-2xl font-black text-white mt-1">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Mock table */}
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                {['Product', 'SKU', 'Category', 'Qty', 'Min', 'Cost', 'Retail', 'Supplier', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {MOCK_ITEMS.map(item => {
                const status = getStatus(item)
                const s      = STATUS_STYLES[status]
                return (
                  <tr key={item.id} className={cn('hover:bg-white/[0.02]', s.row)}>
                    <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{item.sku}</td>
                    <td className="px-4 py-3 text-zinc-400">{item.category}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg text-xs font-semibold border', s.qty)}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 text-xs">{item.low_stock_threshold}</td>
                    <td className="px-4 py-3 text-zinc-400">{fmtPrice(item.cost_price, 'GBP')}</td>
                    <td className="px-4 py-3 text-zinc-300">{fmtPrice(item.retail_price, 'GBP')}</td>
                    <td className="px-4 py-3 text-zinc-500">{item.supplier}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border', s.badge)}>
                        {STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-[#141414]/95 border border-amber-400/20 rounded-2xl px-8 py-7 text-center shadow-2xl max-w-sm mx-4 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-3xl">
            📦
          </div>
          <div>
            <p className="text-lg font-bold text-white">Track your products with Pro</p>
            <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
              Monitor stock levels, set reorder alerts, track costs and retail value — all in one place.
            </p>
          </div>
          <ul className="text-left space-y-1.5 text-sm text-zinc-300">
            {['Real-time stock tracking', 'Low-stock email alerts', 'Cost & retail value reports', 'Stock adjustment history'].map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-amber-400">✓</span>{f}
              </li>
            ))}
          </ul>
          <button type="button" onClick={onUpgrade}
            className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl py-3 text-sm transition-colors">
            Upgrade to Pro →
          </button>
          <p className="text-xs text-zinc-600">Cancel anytime · No hidden fees</p>
        </div>
      </div>
    </div>
  )
}

// ── Sort icon ─────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronDown className="w-3 h-3 inline ml-0.5 opacity-20" />
  return dir === 'asc'
    ? <ChevronUp   className="w-3 h-3 inline ml-0.5 text-[#c9a84c]" />
    : <ChevronDown className="w-3 h-3 inline ml-0.5 text-[#c9a84c]" />
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [shopId]   = useState<string>(() => typeof window !== 'undefined' ? (localStorage.getItem('bb_shop_id') ?? '') : '')
  const [currency] = useState<string>(() => typeof window !== 'undefined' ? (localStorage.getItem('bb_currency') ?? 'GBP') : 'GBP')
  const [plan,     setPlan]     = useState<PlanId>('free')

  const [items,        setItems]        = useState<InventoryItem[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [category,     setCategory]     = useState('All')
  const [showLowOnly,  setShowLowOnly]  = useState(false)
  const [sortKey,      setSortKey]      = useState<SortKey>('name')
  const [sortDir,      setSortDir]      = useState<SortDir>('asc')

  const [modalOpen,    setModalOpen]    = useState(false)
  const [editItem,     setEditItem]     = useState<InventoryItem | null>(null)
  const [adjustItem,   setAdjustItem]   = useState<InventoryItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null)
  const [deleteLoading,setDeleteLoading]= useState(false)
  const [upgradeOpen,  setUpgradeOpen]  = useState(false)

  // Read plan from localStorage (DashboardShell writes it after mount)
  useEffect(() => {
    const stored = (localStorage.getItem('bb_plan') ?? 'free') as PlanId
    setPlan(stored)
  }, [])

  const canUseInventory = PLANS[plan].limits.inventory

  const fetchItems = useCallback(async () => {
    if (!shopId) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/inventory?shop_id=${encodeURIComponent(shopId)}`)
      const json = await res.json() as { data?: InventoryItem[] }
      setItems(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [shopId])

  useEffect(() => { if (canUseInventory) fetchItems() }, [fetchItems, canUseInventory])

  // ── Derived values ────────────────────────────────────────────────────

  const lowStockItems  = items.filter(i => getStatus(i) !== 'ok')
  const lowStockCount  = lowStockItems.length
  const totalCostValue = items.reduce((s, i) => s + (i.cost_price   ?? 0) * i.quantity, 0)
  const totalRetailVal = items.reduce((s, i) => s + (i.retail_price ?? 0) * i.quantity, 0)

  const filtered = items
    .filter(i => {
      if (showLowOnly && getStatus(i) === 'ok') return false
      if (category !== 'All' && i.category !== category) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        i.name.toLowerCase().includes(q) ||
        (i.sku       ?? '').toLowerCase().includes(q) ||
        (i.category  ?? '').toLowerCase().includes(q) ||
        (i.supplier  ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const va = (a[sortKey] ?? '') as string | number
      const vb = (b[sortKey] ?? '') as string | number
      const cmp = typeof va === 'string'
        ? va.toLowerCase().localeCompare(String(vb).toLowerCase())
        : (va as number) - (vb as number)
      return sortDir === 'asc' ? cmp : -cmp
    })

  // ── Handlers ─────────────────────────────────────────────────────────

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function handleSuccess(item: InventoryItem) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = item; return n }
      return [item, ...prev]
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await fetch('/api/inventory', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: deleteTarget.id }),
      })
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Render: loading spinner ───────────────────────────────────────────

  if (!shopId) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white leading-none">INVENTORY</h1>
          <p className="text-zinc-500 text-sm mt-1">Track products, supplies and stock levels</p>
        </div>
        {canUseInventory && (
          <button type="button"
            onClick={() => { setEditItem(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-sm rounded-xl px-4 py-2.5 transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4" />Add Product
          </button>
        )}
      </div>

      {/* ── Locked preview for free / starter ───────────────────────── */}
      {!canUseInventory ? (
        <LockedPreview plan={plan} onUpgrade={() => setUpgradeOpen(true)} />
      ) : (
        <>
          {/* ── Summary cards ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Products',
                value: items.length.toString(),
                icon: <Package className="w-4 h-4" />,
                colour: 'text-zinc-400',
                bg:     'bg-zinc-400/10',
              },
              {
                label: 'Low Stock Alerts',
                value: lowStockCount.toString(),
                icon: <AlertTriangle className="w-4 h-4" />,
                colour: lowStockCount > 0 ? 'text-red-400'     : 'text-zinc-400',
                bg:     lowStockCount > 0 ? 'bg-red-500/10'    : 'bg-zinc-400/10',
              },
              {
                label: 'Inventory Value',
                value: fmtPrice(totalCostValue, currency),
                icon: <SlidersHorizontal className="w-4 h-4" />,
                colour: 'text-[#c9a84c]',
                bg:     'bg-[#c9a84c]/10',
              },
              {
                label: 'Retail Value',
                value: fmtPrice(totalRetailVal, currency),
                icon: <TrendingUp className="w-4 h-4" />,
                colour: 'text-indigo-400',
                bg:     'bg-indigo-400/10',
              },
            ].map(card => (
              <div key={card.label} className="bg-[#111111] border border-[#1e1e1e] rounded-2xl px-4 py-4 space-y-3">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', card.bg, card.colour)}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-xs text-zinc-500">{card.label}</p>
                  <p className={cn('text-2xl font-black mt-0.5', card.colour === 'text-zinc-400' ? 'text-white' : card.colour)}>
                    {card.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Low-stock alert banner ─────────────────────────────── */}
          {lowStockCount > 0 && (
            <button type="button" onClick={() => setShowLowOnly(v => !v)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors border',
                showLowOnly
                  ? 'bg-red-500/10 border-red-500/25 text-red-300'
                  : 'bg-red-500/[0.06] border-red-500/15 text-red-400 hover:bg-red-500/10'
              )}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>{lowStockCount}</strong> item{lowStockCount !== 1 ? 's' : ''} at or below reorder threshold
              </span>
              <span className="ml-auto text-xs opacity-60">
                {showLowOnly ? 'Show all items' : 'Show low stock only'}
              </span>
            </button>
          )}

          {/* ── Search + category filters ──────────────────────────── */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" placeholder="Search by name, SKU, category or supplier…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#c9a84c]/60" />
              {search && (
                <button type="button" onClick={() => setSearch('')} aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                    category === c
                      ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/25'
                      : 'bg-white/[0.03] text-zinc-500 border-white/[0.06] hover:text-zinc-300'
                  )}>{c}</button>
              ))}
            </div>
          </div>

          {/* ── Table ─────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 bg-[#111111] border border-[#1e1e1e] rounded-2xl">
              <Package className="w-8 h-8 text-zinc-700" />
              <p className="text-zinc-500 text-sm">
                {search || category !== 'All' || showLowOnly
                  ? 'No items match your filters.'
                  : 'No products yet — add your first item.'}
              </p>
              {!search && category === 'All' && !showLowOnly && (
                <button type="button" onClick={() => { setEditItem(null); setModalOpen(true) }}
                  className="text-xs text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">
                  + Add first product
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[#1e1e1e]">
                      {([
                        ['name',         'Product'   ],
                        [null,           'SKU'       ],
                        ['category',     'Category'  ],
                        ['quantity',     'Qty'       ],
                        [null,           'Min'       ],
                        ['cost_price',   'Cost'      ],
                        ['retail_price', 'Retail'    ],
                        [null,           'Supplier'  ],
                        [null,           'Status'    ],
                        [null,           ''          ],
                      ] as [SortKey | null, string][]).map(([k, label], i) => (
                        <th key={i}
                          onClick={k ? () => handleSort(k) : undefined}
                          className={cn(
                            'text-left px-4 py-3 text-xs font-medium text-zinc-500 whitespace-nowrap select-none',
                            k && 'cursor-pointer hover:text-zinc-300 transition-colors'
                          )}>
                          {label}
                          {k && <SortIcon active={sortKey === k} dir={sortDir} />}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#181818]">
                    {filtered.map(item => {
                      const status = getStatus(item)
                      const s      = STATUS_STYLES[status]
                      return (
                        <tr key={item.id} className={cn('group transition-colors hover:bg-white/[0.02]', s.row)}>
                          {/* Product name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {status !== 'ok' && (
                                <AlertTriangle className={cn('w-3.5 h-3.5 flex-shrink-0', status === 'critical' ? 'text-red-400' : 'text-yellow-400')} />
                              )}
                              <div>
                                <p className="text-white font-medium leading-tight">{item.name}</p>
                                {item.notes && (
                                  <p className="text-zinc-600 text-xs mt-0.5 truncate max-w-[180px]">{item.notes}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="px-4 py-3 font-mono text-xs text-zinc-500">{item.sku ?? '—'}</td>

                          {/* Category */}
                          <td className="px-4 py-3">
                            {item.category
                              ? <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.05] text-zinc-400 border border-white/[0.05]">{item.category}</span>
                              : <span className="text-zinc-600">—</span>
                            }
                          </td>

                          {/* Quantity */}
                          <td className="px-4 py-3">
                            <span className={cn(
                              'inline-flex items-center justify-center min-w-[2.25rem] px-2 py-0.5 rounded-lg text-xs font-bold border',
                              s.qty
                            )}>
                              {item.quantity}
                            </span>
                          </td>

                          {/* Min threshold */}
                          <td className="px-4 py-3 text-zinc-600 text-xs">{item.low_stock_threshold}</td>

                          {/* Cost */}
                          <td className="px-4 py-3 text-zinc-400 text-xs">{fmtPrice(item.cost_price, currency)}</td>

                          {/* Retail */}
                          <td className="px-4 py-3 text-zinc-300 text-xs font-medium">{fmtPrice(item.retail_price, currency)}</td>

                          {/* Supplier */}
                          <td className="px-4 py-3 text-zinc-500 text-xs">{item.supplier ?? '—'}</td>

                          {/* Status badge */}
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border', s.badge)}>
                              {STATUS_LABELS[status]}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => setAdjustItem(item)}
                                aria-label="Adjust stock"
                                title="Adjust stock"
                                className="w-7 h-7 rounded-lg bg-[#c9a84c]/[0.08] hover:bg-[#c9a84c]/[0.18] text-[#c9a84c] transition-colors flex items-center justify-center text-xs font-bold">
                                ±
                              </button>
                              <button type="button" onClick={() => { setEditItem(item); setModalOpen(true) }}
                                aria-label="Edit item"
                                className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors flex items-center justify-center">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => setDeleteTarget(item)}
                                aria-label="Delete item"
                                className="w-7 h-7 rounded-lg bg-red-500/[0.06] hover:bg-red-500/[0.12] text-red-500 hover:text-red-400 transition-colors flex items-center justify-center">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="px-4 py-2.5 border-t border-[#1e1e1e] flex items-center justify-between">
                <p className="text-xs text-zinc-600">
                  {filtered.length} of {items.length} product{items.length !== 1 ? 's' : ''}
                  {showLowOnly && <span className="text-red-500 ml-1">(low stock only)</span>}
                </p>
                {(search || category !== 'All' || showLowOnly) && (
                  <button type="button"
                    onClick={() => { setSearch(''); setCategory('All'); setShowLowOnly(false) }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
                    <X className="w-3 h-3" />Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modals ──────────────────────────────────────────────────── */}

      {/* Add / Edit */}
      {shopId && (
        <InventoryModal
          shopId={shopId}
          open={modalOpen}
          onOpenChange={setModalOpen}
          editItem={editItem}
          onSuccess={handleSuccess}
        />
      )}

      {/* Stock adjustment */}
      {adjustItem && (
        <StockAdjustmentPopover
          item={adjustItem}
          open={!!adjustItem}
          onOpenChange={o => { if (!o) setAdjustItem(null) }}
          onSuccess={updated => { handleSuccess(updated); setAdjustItem(null) }}
        />
      )}

      {/* Delete confirm */}
      <Dialog.Root open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <Dialog.Title className="font-semibold text-white">Delete product?</Dialog.Title>
                <Dialog.Description className="text-sm text-zinc-400 mt-0.5">
                  <strong className="text-white">{deleteTarget?.name}</strong> will be permanently removed from inventory.
                </Dialog.Description>
              </div>
            </div>
            <div className="flex gap-3">
              <Dialog.Close asChild>
                <button type="button" className="flex-1 bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 rounded-xl py-2.5 text-sm font-medium transition-colors">
                  Cancel
                </button>
              </Dialog.Close>
              <button type="button" onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 bg-red-500/80 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Upgrade */}
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} requiredPlan="pro" currentPlan={plan} />
    </div>
  )
}
