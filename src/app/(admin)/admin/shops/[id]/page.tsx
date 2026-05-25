'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle, PauseCircle, XCircle,
  MapPin, Mail, Phone, Globe, Calendar, Users, CalendarCheck, Zap,
} from 'lucide-react'
import type { AdminStatus } from '@/types/database'

interface ShopDetail {
  id:           string
  name:         string
  slug:         string
  email:        string | null
  phone:        string | null
  city:         string | null
  postcode:     string | null
  address:      string | null
  website:      string | null
  admin_status: AdminStatus
  created_at:   string
  owner_id:     string
}

interface SubDetail {
  plan:                 string
  status:               string
  current_period_end:   string | null
  stripe_customer_id:   string | null
}

interface Stats { bookings: number; clients: number }

const STATUS_CONFIG: Record<AdminStatus, { label: string; bg: string; text: string }> = {
  active:    { label: 'Active',    bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  suspended: { label: 'Suspended', bg: 'bg-amber-500/15',   text: 'text-amber-400'   },
  disabled:  { label: 'Disabled',  bg: 'bg-red-500/15',     text: 'text-red-400'     },
}

const PLAN_BADGE: Record<string, string> = {
  free:    'bg-slate-500/15 text-slate-400',
  starter: 'bg-indigo-500/15 text-indigo-400',
  pro:     'bg-amber-500/15 text-amber-400',
  empire:  'bg-emerald-500/15 text-emerald-400',
}

export default function AdminShopDetailPage() {
  const { id }                 = useParams<{ id: string }>()
  const router                 = useRouter()
  const [shop, setShop]        = useState<ShopDetail | null>(null)
  const [sub, setSub]          = useState<SubDetail | null>(null)
  const [stats, setStats]      = useState<Stats | null>(null)
  const [loading, setLoading]  = useState(true)
  const [saving, setSaving]    = useState(false)
  const [error, setError]      = useState('')
  const [success, setSuccess]  = useState('')

  useEffect(() => {
    fetch(`/api/admin/shops/${id}`)
      .then(r => r.json())
      .then(data => {
        setShop(data.shop)
        setSub(data.subscription)
        setStats(data.stats)
      })
      .finally(() => setLoading(false))
  }, [id])

  const setAdminStatus = async (status: AdminStatus) => {
    if (!shop) return
    setSaving(true)
    setError('')
    setSuccess('')
    const res = await fetch(`/api/admin/shops/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ admin_status: status }),
    })
    const data = await res.json()
    if (data.success) {
      setShop(prev => prev ? { ...prev, admin_status: status } : prev)
      setSuccess(`Shop ${status === 'active' ? 'activated' : status} successfully`)
    } else {
      setError(data.error ?? 'Failed to update status')
    }
    setSaving(false)
  }

  const setPlan = async (newPlan: string) => {
    setSaving(true)
    setError('')
    setSuccess('')
    const res = await fetch(`/api/admin/shops/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plan: newPlan }),
    })
    const data = await res.json()
    if (data.success) {
      setSub(prev => prev ? { ...prev, plan: newPlan, status: 'active' } : { plan: newPlan, status: 'active', current_period_end: null, stripe_customer_id: null })
      setSuccess(`Plan set to ${newPlan}`)
    } else {
      setError(data.error ?? 'Failed to update plan')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-40 text-white/40">Loading…</div>
    )
  }

  if (!shop) {
    return (
      <div className="p-6 text-center">
        <p className="text-white/40 mb-4">Shop not found</p>
        <Link href="/admin/shops" className="text-sm text-white/60 hover:text-white">← Back to shops</Link>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[shop.admin_status] ?? STATUS_CONFIG.active
  const plan      = sub?.plan ?? 'free'

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/admin/shops"
        className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to shops
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{shop.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusCfg.bg} ${statusCfg.text}`}>
              {statusCfg.label}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${PLAN_BADGE[plan] ?? PLAN_BADGE.free}`}>
              {plan}
            </span>
            {sub?.status && sub.status !== 'active' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 capitalize">
                {sub.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-white/10 p-5 space-y-3">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Shop Details</h2>
          {shop.email && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Mail className="w-3.5 h-3.5 text-white/30 flex-shrink-0" /> {shop.email}
            </div>
          )}
          {shop.phone && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Phone className="w-3.5 h-3.5 text-white/30 flex-shrink-0" /> {shop.phone}
            </div>
          )}
          {(shop.city || shop.postcode) && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <MapPin className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              {[shop.city, shop.postcode].filter(Boolean).join(', ')}
            </div>
          )}
          {shop.website && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Globe className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              <a href={shop.website} target="_blank" rel="noopener noreferrer" className="hover:text-white underline underline-offset-2 truncate">
                {shop.website}
              </a>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Calendar className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            Joined {new Date(shop.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-5 space-y-3">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Subscription</h2>
          <div className="text-sm text-white/70">
            <span className={`capitalize font-medium ${PLAN_BADGE[plan]?.split(' ')[1] ?? ''}`}>{plan}</span>
            {' plan · '}
            <span className="capitalize">{sub?.status ?? 'no subscription'}</span>
          </div>
          {sub?.current_period_end && (
            <div className="text-xs text-white/40">
              Period ends: {new Date(sub.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
          {stats && (
            <>
              <div className="pt-2 border-t border-white/10 flex gap-6">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <CalendarCheck className="w-3.5 h-3.5 text-white/30" />
                  {stats.bookings.toLocaleString()} bookings
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Users className="w-3.5 h-3.5 text-white/30" />
                  {stats.clients.toLocaleString()} clients
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status actions */}
      <div className="rounded-xl border border-white/10 p-5">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Account Status</h2>
        <p className="text-sm text-white/50 mb-5">
          Changing the status takes effect immediately. Suspended shops see a warning banner; disabled shops are blocked from the dashboard entirely.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setAdminStatus('active')}
            disabled={saving || shop.admin_status === 'active'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            Activate
          </button>
          <button
            onClick={() => setAdminStatus('suspended')}
            disabled={saving || shop.admin_status === 'suspended'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PauseCircle className="w-4 h-4" />
            Suspend
          </button>
          <button
            onClick={() => setAdminStatus('disabled')}
            disabled={saving || shop.admin_status === 'disabled'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <XCircle className="w-4 h-4" />
            Disable
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {success && <p className="mt-4 text-sm text-emerald-400">{success}</p>}
      </div>

      {/* Plan override */}
      <div className="rounded-xl border border-white/10 p-5 mt-4">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Plan Override</h2>
        <p className="text-sm text-white/50 mb-5">
          Manually set the subscription plan. This sets status to <code className="text-white/70">active</code> immediately, bypassing Stripe. Use for testing or support.
        </p>
        <div className="flex flex-wrap gap-3">
          {(['free', 'starter', 'pro', 'empire'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPlan(p)}
              disabled={saving || plan === p}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed capitalize
                ${p === 'free'    ? 'bg-slate-500/15 text-slate-400 hover:bg-slate-500/25' : ''}
                ${p === 'starter' ? 'bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25' : ''}
                ${p === 'pro'     ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25' : ''}
                ${p === 'empire'  ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : ''}
              `}
            >
              <Zap className="w-4 h-4" />
              {p === plan ? `${p} (current)` : `Set to ${p}`}
            </button>
          ))}
        </div>
      </div>

      {/* Contact owner */}
      {shop.email && (
        <div className="mt-4">
          <a
            href={`mailto:${shop.email}?subject=BarberBoost - Your account`}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email owner: {shop.email}
          </a>
        </div>
      )}
    </div>
  )
}
