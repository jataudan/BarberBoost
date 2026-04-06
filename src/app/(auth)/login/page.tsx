'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Zod schema ─────────────────────────────────────────────────
const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

// ── Google wordmark SVG ─────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

const INPUT_BASE   = 'w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all'
const INPUT_NORMAL = `${INPUT_BASE} border-[#2a2a2a] focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20`
const INPUT_ERROR  = `${INPUT_BASE} border-red-500/40 focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20`

function Field({ label, error, children, right }: {
  label: string
  error?: string
  children: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-zinc-400">{label}</label>
        {right}
      </div>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

// Inner component that safely uses useSearchParams (must be inside Suspense)
function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [oauthLoading, setOauthLoading] = useState(false)

  // Show errors coming back from the OAuth callback (e.g. cancelled flow)
  useEffect(() => {
    const err = searchParams.get('error')
    if (err) setServerError(decodeURIComponent(err))
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setServerError(
        error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : error.message
      )
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogleOAuth() {
    setOauthLoading(true)
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?next=/dashboard`,
      },
    })
    if (error) {
      setServerError(error.message)
      setOauthLoading(false)
    }
    // On success, browser will redirect — no need to handle here
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-heading)] text-4xl tracking-widest text-white leading-none">
          WELCOME BACK
        </h1>
        <p className="text-zinc-500 text-sm">Sign in to your BarberBoost account</p>
      </div>

      {/* Server / OAuth error */}
      {serverError && (
        <div className="flex items-center gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleOAuth}
        disabled={oauthLoading || isSubmitting}
        className="w-full flex items-center justify-center gap-3 bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-50 border border-[#2a2a2a] hover:border-zinc-600 rounded-xl px-4 py-3 text-sm text-white font-medium transition-all"
      >
        {oauthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#1e1e1e]" />
        <span className="text-xs text-zinc-600">or sign in with email</span>
        <div className="flex-1 h-px bg-[#1e1e1e]" />
      </div>

      {/* Email / Password form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Email Address" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={errors.email ? INPUT_ERROR : INPUT_NORMAL}
          />
        </Field>

        <Field
          label="Password"
          error={errors.password?.message}
          right={
            <Link
              href="/reset-password"
              className="text-xs text-zinc-500 hover:text-[#c9a84c] transition-colors"
            >
              Forgot password?
            </Link>
          }
        >
          <div className="relative">
            <input
              {...register('password')}
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`${errors.password ? INPUT_ERROR : INPUT_NORMAL} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <button
          type="submit"
          disabled={isSubmitting || oauthLoading}
          className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-4 py-3.5 text-sm tracking-wide transition-all mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[#c9a84c] hover:text-[#e2bf6a] font-medium transition-colors">
          Start free
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}
