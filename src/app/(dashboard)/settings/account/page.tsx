'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle, CheckCircle2, User, Lock, Trash2, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const INPUT = 'w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20'

// ── Schemas ───────────────────────────────────────────────────────────────
const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(80),
  email:     z.string().email('Invalid email'),
})
type ProfileValues = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Required'),
  new_password:     z.string().min(8, 'At least 8 characters'),
  confirm_password: z.string().min(1, 'Required'),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Passwords do not match', path: ['confirm_password'],
})
type PasswordValues = z.infer<typeof passwordSchema>

export default function AccountSettingsPage() {
  const [user, setUser]                 = useState<SupabaseUser | null>(null)
  const [loading, setLoading]           = useState(true)
  const [profileSaved, setProfileSaved] = useState(false)
  const [pwdSaved, setPwdSaved]         = useState(false)
  const [showPwd, setShowPwd]           = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError]   = useState<string | null>(null)

  const { register: rp, handleSubmit: hsp, reset: rsp, formState: { errors: ep, isSubmitting: isp }, setError: sep } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues: { full_name: '', email: '' },
  })

  const { register: rw, handleSubmit: hsw, reset: rsw, formState: { errors: ew, isSubmitting: isw }, setError: sew } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema) as never,
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user: u } } = await supabase.auth.getUser()
        if (u) {
          setUser(u)
          rsp({ full_name: (u.user_metadata?.full_name as string | undefined) ?? '', email: u.email ?? '' })
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [rsp])

  async function onProfileSubmit(values: ProfileValues) {
    setProfileSaved(false)
    const supabase = createClient()
    const updates: { data?: { full_name: string }; email?: string } = {
      data: { full_name: values.full_name },
    }
    if (values.email !== user?.email) updates.email = values.email

    const { error } = await supabase.auth.updateUser(updates)
    if (error) { sep('root', { message: error.message }); return }
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  async function onPasswordSubmit(values: PasswordValues) {
    setPwdSaved(false)
    const supabase = createClient()
    // Re-auth with current password first
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u?.email) { sew('root', { message: 'Not authenticated' }); return }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: u.email, password: values.current_password,
    })
    if (signInErr) { sew('current_password', { message: 'Incorrect current password' }); return }

    const { error } = await supabase.auth.updateUser({ password: values.new_password })
    if (error) { sew('root', { message: error.message }); return }
    rsw({ current_password: '', new_password: '', confirm_password: '' })
    setPwdSaved(true)
    setTimeout(() => setPwdSaved(false), 3000)
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      // Sign the user out — actual hard-delete requires a server-side API call
      // with service-role credentials (contact support or implement /api/account/delete)
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/login?deleted=true'
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
    </div>
  )

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white leading-none">ACCOUNT</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your personal account details</p>
      </div>

      {/* Profile */}
      <section className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <User className="w-4 h-4 text-[#c9a84c]" />Profile
        </h2>

        <form onSubmit={hsp(onProfileSubmit)} noValidate className="space-y-4">
          {ep.root && (
            <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{ep.root.message}
            </div>
          )}
          {profileSaved && (
            <div className="flex items-center gap-2.5 bg-emerald-400/[0.08] border border-emerald-400/20 rounded-xl px-4 py-3 text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />Profile updated.
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="acc-name" className="text-xs font-medium text-zinc-400">Display name</label>
            <input id="acc-name" type="text" placeholder="Your name"
              className={cn(INPUT, ep.full_name && 'border-red-500/50')} {...rp('full_name')} />
            {ep.full_name && <p className="text-xs text-red-400">{ep.full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="acc-email" className="text-xs font-medium text-zinc-400">Email address</label>
            <input id="acc-email" type="email" placeholder="you@example.com"
              className={cn(INPUT, ep.email && 'border-red-500/50')} {...rp('email')} />
            {ep.email && <p className="text-xs text-red-400">{ep.email.message}</p>}
            <p className="text-[11px] text-zinc-600">Changing your email will send a confirmation to the new address.</p>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={isp}
              className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-5 py-2.5 text-sm transition-colors">
              {isp ? <Loader2 className="w-4 h-4 animate-spin" /> : profileSaved ? <><CheckCircle2 className="w-4 h-4" />Saved</> : 'Save profile'}
            </button>
          </div>
        </form>
      </section>

      {/* Password */}
      <section className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <Lock className="w-4 h-4 text-[#c9a84c]" />Change password
        </h2>

        <form onSubmit={hsw(onPasswordSubmit)} noValidate className="space-y-4">
          {ew.root && (
            <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{ew.root.message}
            </div>
          )}
          {pwdSaved && (
            <div className="flex items-center gap-2.5 bg-emerald-400/[0.08] border border-emerald-400/20 rounded-xl px-4 py-3 text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />Password updated.
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="acc-curpwd" className="text-xs font-medium text-zinc-400">Current password</label>
            <input id="acc-curpwd" type="password" placeholder="••••••••"
              className={cn(INPUT, ew.current_password && 'border-red-500/50')} {...rw('current_password')} />
            {ew.current_password && <p className="text-xs text-red-400">{ew.current_password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="acc-newpwd" className="text-xs font-medium text-zinc-400">New password</label>
            <div className="relative">
              <input id="acc-newpwd" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                className={cn(INPUT, 'pr-10', ew.new_password && 'border-red-500/50')} {...rw('new_password')} />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {ew.new_password && <p className="text-xs text-red-400">{ew.new_password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="acc-confpwd" className="text-xs font-medium text-zinc-400">Confirm new password</label>
            <input id="acc-confpwd" type="password" placeholder="••••••••"
              className={cn(INPUT, ew.confirm_password && 'border-red-500/50')} {...rw('confirm_password')} />
            {ew.confirm_password && <p className="text-xs text-red-400">{ew.confirm_password.message}</p>}
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={isw}
              className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-5 py-2.5 text-sm transition-colors">
              {isw ? <Loader2 className="w-4 h-4 animate-spin" /> : pwdSaved ? <><CheckCircle2 className="w-4 h-4" />Saved</> : 'Update password'}
            </button>
          </div>
        </form>
      </section>

      {/* Danger zone */}
      <section className="bg-[#111111] border border-red-900/30 rounded-2xl p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-red-400">
          <Trash2 className="w-4 h-4" />Danger zone
        </h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Deleting your account will permanently remove all your shop data, bookings, clients, and subscription.
          This action cannot be undone.
        </p>
        <div className="space-y-2">
          <label htmlFor="acc-delete-confirm" className="text-xs font-medium text-zinc-400">
            Type <span className="text-red-400 font-mono">DELETE</span> to confirm
          </label>
          <input id="acc-delete-confirm" type="text" placeholder="DELETE"
            value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-red-900/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 outline-none focus:border-red-500/50 transition-all" />
        </div>
        {deleteError && (
          <p className="text-xs text-red-400 bg-red-500/[0.07] border border-red-500/20 rounded-lg px-3 py-2">{deleteError}</p>
        )}
        <button type="button" onClick={handleDeleteAccount}
          disabled={deleteConfirm !== 'DELETE' || deleteLoading}
          className="flex items-center gap-2 bg-red-500/[0.1] hover:bg-red-500/[0.18] disabled:opacity-30 disabled:cursor-not-allowed text-red-400 font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors border border-red-500/20">
          {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete my account
        </button>
      </section>
    </div>
  )
}
