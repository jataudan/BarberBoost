'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Megaphone, Pencil, Trash2, Loader2, Mail, MessageSquare, Bell, Send, Clock, FileText } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { CampaignModal } from '@/components/marketing/modals/CampaignModal'
import { UpgradeModal } from '@/components/shared/UpgradeModal'
import type { Campaign } from '@/types/database'
import type { PlanId } from '@/lib/stripe/plans'
import { PLANS } from '@/lib/stripe/plans'

const TYPE_ICON: Record<string, React.ElementType> = {
  email: Mail,
  sms:   MessageSquare,
  push:  Bell,
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Draft',     className: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  sending:   { label: 'Sending',   className: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
  sent:      { label: 'Sent',      className: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  failed:    { label: 'Failed',    className: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

const SEGMENT_LABELS: Record<string, string> = {
  all:      'All clients',
  vip:      'VIP clients',
  regular:  'Regular clients',
  at_risk:  'At-risk clients',
  new:      'New clients',
  inactive: 'Inactive (60+ days)',
}

function fmt(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function MarketingPage() {
  const [shopId, setShopId]               = useState<string | null>(null)
  const [shopName, setShopName]           = useState<string>('Your Shop')
  const [plan, setPlan]                   = useState<PlanId>('free')
  const [campaigns, setCampaigns]         = useState<Campaign[]>([])
  const [loading, setLoading]             = useState(true)
  const [modalOpen, setModalOpen]         = useState(false)
  const [editCampaign, setEditCampaign]   = useState<Campaign | null>(null)
  const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [sendCampaign, setSendCampaign]   = useState<Campaign | null>(null)
  const [sendLoading, setSendLoading]     = useState(false)
  const [upgradeOpen, setUpgradeOpen]     = useState(false)

  useEffect(() => {
    const id   = localStorage.getItem('bb_shop_id')
    const p    = (localStorage.getItem('bb_plan') ?? 'free') as PlanId
    const name = localStorage.getItem('bb_shop_name') ?? 'Your Shop'
    setShopId(id)
    setPlan(p)
    setShopName(name)
  }, [])

  const fetchCampaigns = useCallback(async () => {
    if (!shopId) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/campaigns?shop_id=${shopId}`)
      const json = await res.json() as { data?: Campaign[] }
      setCampaigns(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [shopId])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const maxCampaigns = PLANS[plan].limits.campaigns
  const canCreate    = maxCampaigns !== 0

  // Count this month's campaigns for the limit bar
  const monthStart       = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const thisMonthCount   = campaigns.filter(c => new Date(c.created_at) >= monthStart).length
  const limitPercent     = maxCampaigns > 0 ? Math.min(100, (thisMonthCount / maxCampaigns) * 100) : 0

  function limitBarClass() {
    if (limitPercent >= 100) return 'bg-red-500'
    if (limitPercent >= 75)  return 'bg-yellow-400'
    return 'bg-[#c9a84c]'
  }

  function limitBarWidth() {
    if (limitPercent >= 100)  return 'w-full'
    if (limitPercent >= 90)   return 'w-[90%]'
    if (limitPercent >= 75)   return 'w-3/4'
    if (limitPercent >= 50)   return 'w-1/2'
    if (limitPercent >= 25)   return 'w-1/4'
    if (limitPercent > 0)     return 'w-[10%]'
    return 'w-0'
  }

  function handleAddClick() {
    if (!canCreate) { setUpgradeOpen(true); return }
    if (maxCampaigns > 0 && thisMonthCount >= maxCampaigns) { setUpgradeOpen(true); return }
    setEditCampaign(null)
    setModalOpen(true)
  }

  function handleEditClick(c: Campaign) {
    setEditCampaign(c)
    setModalOpen(true)
  }

  async function handleSendConfirm() {
    if (!sendCampaign) return
    setSendLoading(true)
    try {
      const res  = await fetch('/api/campaigns/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ campaign_id: sendCampaign.id }),
      })
      const json = await res.json() as { data?: { sentCount: number }; error?: string }
      if (res.ok && json.data) {
        setCampaigns(prev => prev.map(c =>
          c.id === sendCampaign.id
            ? { ...c, status: 'sent', sent_count: json.data!.sentCount, sent_at: new Date().toISOString() }
            : c
        ))
      }
    } finally {
      setSendLoading(false)
      setSendCampaign(null)
    }
  }

  async function handleDelete() {
    if (!deleteCampaign) return
    setDeleteLoading(true)
    try {
      await fetch('/api/campaigns', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteCampaign.id }) })
      setCampaigns(prev => prev.filter(c => c.id !== deleteCampaign.id))
      setDeleteCampaign(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  function handleSuccess(campaign: Campaign) {
    setCampaigns(prev => {
      const idx = prev.findIndex(c => c.id === campaign.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = campaign; return next }
      return [campaign, ...prev]
    })
  }

  if (!shopId) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white leading-none">MARKETING</h1>
          <p className="text-zinc-500 text-sm mt-1">Campaigns, promotions and client retention</p>
        </div>
        <button type="button" onClick={handleAddClick}
          className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold text-sm rounded-xl px-4 py-2.5 transition-colors">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Plan lock banner */}
      {!canCreate && (
        <div className="flex items-center gap-3 bg-indigo-500/[0.08] border border-indigo-500/20 rounded-xl px-4 py-3">
          <Megaphone className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <p className="text-sm text-indigo-300">Marketing campaigns require at least the <strong className="text-indigo-200">Starter plan</strong>.</p>
          <button type="button" onClick={() => setUpgradeOpen(true)}
            className="ml-auto text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap">Upgrade →</button>
        </div>
      )}

      {/* Monthly limit bar */}
      {canCreate && maxCampaigns > 0 && (
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Campaigns this month</span>
            <span className={cn('font-semibold', thisMonthCount >= maxCampaigns ? 'text-red-400' : 'text-zinc-300')}>
              {thisMonthCount} / {maxCampaigns}
            </span>
          </div>
          <div className="h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', limitBarClass(), limitBarWidth())} />
          </div>
        </div>
      )}

      {/* Campaigns list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 bg-[#111111] border border-[#1e1e1e] rounded-2xl">
          <Megaphone className="w-8 h-8 text-zinc-700" />
          <p className="text-zinc-500 text-sm">No campaigns yet.</p>
          {canCreate && (
            <button type="button" onClick={handleAddClick}
              className="text-xs text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">+ Create your first campaign</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const TypeIcon   = TYPE_ICON[c.type] ?? Mail
            const statusInfo = STATUS_STYLES[c.status] ?? STATUS_STYLES.draft
            return (
              <div key={c.id}
                className="group bg-[#111111] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-2xl px-5 py-4 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Type icon */}
                    <div className="w-9 h-9 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TypeIcon className="w-4 h-4 text-[#c9a84c]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white truncate">{c.name}</h3>
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', statusInfo.className)}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-zinc-500 uppercase tracking-wider">{c.type}</span>
                        <span className="text-xs text-zinc-600">·</span>
                        <span className="text-xs text-zinc-500">{SEGMENT_LABELS[c.target_segment] ?? c.target_segment}</span>
                        {c.scheduled_at && (
                          <>
                            <span className="text-xs text-zinc-600">·</span>
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                              <Clock className="w-3 h-3" />{fmt(c.scheduled_at)}
                            </span>
                          </>
                        )}
                      </div>
                      {c.subject && (
                        <p className="text-xs text-zinc-600 mt-1 truncate">{c.subject}</p>
                      )}
                    </div>
                  </div>

                  {/* Stats + actions */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {c.status === 'sent' && (
                      <div className="hidden sm:flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-zinc-500">Sent</p>
                          <p className="text-sm font-semibold text-white">{c.sent_count.toLocaleString()}</p>
                        </div>
                        {c.open_rate != null && (
                          <div className="text-center">
                            <p className="text-xs text-zinc-500">Open rate</p>
                            <p className="text-sm font-semibold text-emerald-400">{(c.open_rate * 100).toFixed(1)}%</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(c.status === 'draft' || c.status === 'scheduled') && (
                        <button type="button" aria-label="Send campaign" onClick={() => setSendCampaign(c)}
                          className="w-7 h-7 rounded-lg bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15] text-emerald-500 transition-colors flex items-center justify-center">
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button type="button" onClick={() => handleEditClick(c)} aria-label="Edit campaign"
                        className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors flex items-center justify-center">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setDeleteCampaign(c)} aria-label="Delete campaign"
                        className="w-7 h-7 rounded-lg bg-red-500/[0.06] hover:bg-red-500/[0.12] text-red-500 hover:text-red-400 transition-colors flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Campaign Modal */}
      {shopId && (
        <CampaignModal
          shopId={shopId}
          shopName={shopName}
          plan={plan}
          open={modalOpen}
          onOpenChange={setModalOpen}
          editCampaign={editCampaign}
          onSuccess={handleSuccess}
        />
      )}

      {/* Delete Confirm */}
      <Dialog.Root open={!!deleteCampaign} onOpenChange={o => { if (!o) setDeleteCampaign(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <Dialog.Title className="font-semibold text-white text-lg mb-2">Delete campaign?</Dialog.Title>
            <Dialog.Description className="text-zinc-400 text-sm mb-5">
              <strong className="text-white">{deleteCampaign?.name}</strong> will be permanently deleted.
            </Dialog.Description>
            <div className="flex gap-3">
              <Dialog.Close asChild>
                <button type="button" className="flex-1 bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 rounded-xl py-2.5 text-sm font-medium transition-colors">Cancel</button>
              </Dialog.Close>
              <button type="button" onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 bg-red-500/80 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Send Confirm */}
      <Dialog.Root open={!!sendCampaign} onOpenChange={o => { if (!o) setSendCampaign(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#111111] border border-[#2a2a2a] rounded-2xl p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <Dialog.Title className="font-semibold text-white text-lg mb-1">Send campaign now?</Dialog.Title>
            <Dialog.Description className="text-zinc-400 text-sm mb-4">
              <strong className="text-white">{sendCampaign?.name}</strong> will be sent immediately to{' '}
              <span className="text-zinc-300">{SEGMENT_LABELS[sendCampaign?.target_segment ?? ''] ?? sendCampaign?.target_segment}</span>{' '}
              via <span className="text-zinc-300">{sendCampaign?.type}</span>. This cannot be undone.
            </Dialog.Description>
            <div className="flex gap-3">
              <Dialog.Close asChild>
                <button type="button" className="flex-1 bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 rounded-xl py-2.5 text-sm font-medium transition-colors">Cancel</button>
              </Dialog.Close>
              <button type="button" onClick={handleSendConfirm} disabled={sendLoading}
                className="flex-1 bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {sendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sendLoading ? 'Sending…' : 'Send Now'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Upgrade Modal */}
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} requiredPlan="starter" currentPlan={plan} />
    </div>
  )
}
