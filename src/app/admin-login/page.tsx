'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Lock, Mail, Loader2, AlertCircle, Shield, CheckCircle, ArrowLeft } from 'lucide-react'

const INPUT = 'w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Forgot-password sub-flow
  const [showReset,   setShowReset]   = useState(false)
  const [resetEmail,  setResetEmail]  = useState('')
  const [resetSent,   setResetSent]   = useState(false)
  const [resetLoading,setResetLoading]= useState(false)
  const [resetError,  setResetError]  = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError(null)

    const supabase = getSupabase()
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

    if (authError) {
      setError('Invalid credentials. Access denied.')
      setLoading(false)
      return
    }

    // Verify this account has admin access before navigating
    const check = await fetch('/api/admin/me').then(r => r.json()) as { ok: boolean }
    if (!check.ok) {
      await supabase.auth.signOut()
      setError(
        'This account does not have platform admin access. ' +
        'Check that ADMIN_EMAILS is set in Vercel and includes this address.'
      )
      setLoading(false)
      return
    }

    router.replace('/admin')
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetEmail.trim()) return
    setResetLoading(true)
    setResetError(null)

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.app'
    const supabase = getSupabase()
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${APP_URL}/auth/callback?next=/admin-login`,
    })

    setResetLoading(false)
    if (resetErr) {
      setResetError(resetErr.message)
    } else {
      setResetSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 mb-4">
            <Shield className="w-7 h-7 text-[#c9a84c]" />
          </div>
          <h1 className="text-2xl font-black tracking-widest text-white">BARBERBOOST</h1>
          <p className="text-xs text-zinc-500 mt-1 tracking-widest uppercase">Platform Administration</p>
        </div>

        {/* ── Forgot-password flow ── */}
        {showReset ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => { setShowReset(false); setResetSent(false); setResetError(null) }}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Back to sign in
            </button>

            {resetSent ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Reset email sent</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Check <span className="text-zinc-300">{resetEmail}</span> and click the link to set a new password.
                    You&apos;ll be redirected back here after updating.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} noValidate className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Reset admin password</p>
                  <p className="text-xs text-zinc-500">Enter your admin email address. We&apos;ll send a reset link.</p>
                </div>
                {resetError && (
                  <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{resetError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="reset-email" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Mail className="w-3 h-3" />Admin email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@barberboost.app"
                    className={INPUT}
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading || !resetEmail.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-4 py-3 text-sm transition-colors"
                >
                  {resetLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : 'Send Reset Email'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ── Sign-in form ── */
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Mail className="w-3 h-3" />Admin email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                placeholder="admin@barberboost.app"
                className={INPUT}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Lock className="w-3 h-3" />Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••"
                className={INPUT}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-4 py-3 text-sm transition-colors mt-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying…</> : 'Sign In to Admin'}
            </button>

            <button
              type="button"
              onClick={() => { setShowReset(true); setResetEmail(email) }}
              className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors pt-1"
            >
              Forgot password?
            </button>
          </form>
        )}

        <p className="text-center text-xs text-zinc-700 mt-8">
          This portal is restricted to BarberBoost staff only.
        </p>
      </div>
    </div>
  )
}
