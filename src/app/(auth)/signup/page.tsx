'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Scissors, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Zod v4 schema ──────────────────────────────────────────────
const schema = z
  .object({
    shop_name: z.string().min(2, 'Shop name must be at least 2 characters'),
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Must contain at least one letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type FormData = z.infer<typeof schema>

// ── Reusable field wrapper ─────────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-zinc-400">{label}</label>
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

const INPUT_BASE =
  'w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all'
const INPUT_NORMAL = `${INPUT_BASE} border-[#2a2a2a] focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20`
const INPUT_ERROR  = `${INPUT_BASE} border-red-500/40 focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20`

export default function SignupPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          shop_name: data.shop_name,
          full_name: data.full_name,
        },
        // The database trigger (handle_new_user) auto-creates shop + subscription
        emailRedirectTo: `${location.origin}/auth/callback?next=/dashboard`,
      },
    })

    if (error) {
      setServerError(error.message)
      return
    }

    // Supabase may require email confirmation depending on project settings.
    // If auto-confirm is ON → user is signed in; redirect to dashboard.
    // If email confirm is ON → show "check your inbox" message.
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.confirmed_at) {
      router.push('/dashboard?welcome=1')
      router.refresh()
    } else {
      setEmailSent(true)
    }
  }

  if (emailSent) {
    return (
      <div className="text-center space-y-5 py-8">
        <div className="w-14 h-14 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center mx-auto">
          <Scissors className="w-7 h-7 text-[#c9a84c]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white">
            CHECK YOUR EMAIL
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            We&apos;ve sent a confirmation link to your inbox.
            Click it to activate your account and start your free trial.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm text-[#c9a84c] hover:text-[#e2bf6a] transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-heading)] text-4xl tracking-widest text-white leading-none">
          START FOR FREE
        </h1>
        <p className="text-zinc-500 text-sm">
          No credit card required · Cancel any time
        </p>
      </div>

      {/* Pro trial callout */}
      <div className="flex items-start gap-3 bg-[#c9a84c]/8 border border-[#c9a84c]/20 rounded-xl px-4 py-3">
        <span className="text-lg leading-none">🚀</span>
        <div>
          <p className="text-sm font-semibold text-[#c9a84c]">14-Day Pro Trial — Free</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Get full Pro features from day one. No card needed until you decide to stay.
          </p>
        </div>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="flex items-center gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Shop Name" error={errors.shop_name?.message}>
          <input
            {...register('shop_name')}
            type="text"
            autoComplete="organization"
            placeholder="Fresh Cuts Barbershop"
            className={errors.shop_name ? INPUT_ERROR : INPUT_NORMAL}
          />
        </Field>

        <Field label="Your Name" error={errors.full_name?.message}>
          <input
            {...register('full_name')}
            type="text"
            autoComplete="name"
            placeholder="Jordan Clarke"
            className={errors.full_name ? INPUT_ERROR : INPUT_NORMAL}
          />
        </Field>

        <Field label="Email Address" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={errors.email ? INPUT_ERROR : INPUT_NORMAL}
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <input
              {...register('password')}
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 characters with a number"
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

        <Field label="Confirm Password" error={errors.confirm_password?.message}>
          <div className="relative">
            <input
              {...register('confirm_password')}
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat your password"
              className={`${errors.confirm_password ? INPUT_ERROR : INPUT_NORMAL} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-4 py-3.5 text-sm tracking-wide transition-all mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating your account…
            </>
          ) : (
            'Create My Free Account'
          )}
        </button>

        <p className="text-[11px] text-zinc-600 text-center leading-relaxed">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link href="/login" className="text-[#c9a84c] hover:text-[#e2bf6a] font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
