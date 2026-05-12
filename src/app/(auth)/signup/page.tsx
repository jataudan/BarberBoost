'use client'

import { use, Suspense, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Scissors, AlertCircle, Check } from 'lucide-react'
import { PLANS, type PlanId } from '@/lib/stripe/plans'

const PAID_PLANS: PlanId[] = ['starter', 'pro', 'empire']

const PLAN_ACCENT: Record<string, { border: string; text: string; bg: string }> = {
  starter: { border: 'border-indigo-500/30', text: 'text-indigo-300',  bg: 'bg-indigo-500/8' },
  pro:     { border: 'border-[#c9a84c]/30',  text: 'text-[#c9a84c]',  bg: 'bg-[#c9a84c]/8'  },
  empire:  { border: 'border-emerald-500/30',text: 'text-emerald-300', bg: 'bg-emerald-500/8' },
}

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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
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

type SearchParamsProp = Promise<{ [key: string]: string | string[] | undefined }>

function SignupForm({ searchParams }: { searchParams: SearchParamsProp }) {
  const params = use(searchParams)

  const rawPlan      = typeof params.plan === 'string' ? params.plan as PlanId : null
  const intendedPlan = rawPlan && PAID_PLANS.includes(rawPlan) ? rawPlan : null
  const isAnnual     = params.billing === 'annual'
  const planDetails  = intendedPlan ? PLANS[intendedPlan] : null
  const accent       = intendedPlan ? PLAN_ACCENT[intendedPlan] : null

  const [showPw, setShowPw]           = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [emailSent, setEmailSent]     = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)

    const res = await fetch('/api/auth/signup', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        email:    data.email,
        password: data.password,
        shopName: data.shop_name,
        fullName: data.full_name,
        plan:     intendedPlan ?? undefined,
        billing:  isAnnual ? 'annual' : undefined,
      }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      setServerError(json.error ?? 'Something went wrong. Please try again.')
      return
    }

    setEmailSent(true)
  }

  // ── Email-sent confirmation screen ────────────────────────────
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
          {intendedPlan && planDetails ? (
            <p className="text-zinc-500 text-sm leading-relaxed">
              We&apos;ve sent a confirmation link to your inbox. Click it to verify your account
              and continue to your{' '}
              <span className={accent?.text ?? ''}>{planDetails.name}</span>{' '}
              {isAnnual ? 'annual ' : ''}subscription setup.
            </p>
          ) : (
            <p className="text-zinc-500 text-sm leading-relaxed">
              We&apos;ve sent a confirmation link to your inbox.
              Click it to activate your account and access your free plan.
            </p>
          )}
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

  // ── Signup form ────────────────────────────────────────────────
  const annualMonthly = intendedPlan && planDetails && isAnnual
    ? Math.floor((planDetails.price * 10) / 12 * 100) / 100
    : null

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-heading)] text-4xl tracking-widest text-white leading-none">
          {intendedPlan ? 'CREATE ACCOUNT' : 'START FOR FREE'}
        </h1>
        <p className="text-zinc-500 text-sm">
          {intendedPlan ? 'One step away from activating your plan' : 'No credit card required · Cancel any time'}
        </p>
      </div>

      {/* Plan / trial callout */}
      {intendedPlan && planDetails && accent ? (
        <div className={`flex items-start gap-3 ${accent.bg} border ${accent.border} rounded-xl px-4 py-3`}>
          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${accent.text}`} />
          <div>
            <p className={`text-sm font-semibold ${accent.text}`}>
              {planDetails.name} Plan ·{' '}
              {isAnnual && annualMonthly
                ? `£${annualMonthly % 1 === 0 ? annualMonthly : annualMonthly.toFixed(2)}/mo (billed annually — 2 months free)`
                : `£${planDetails.price}/mo`}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Create your account, confirm your email, then complete payment — instant activation.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 bg-[#c9a84c]/8 border border-[#c9a84c]/20 rounded-xl px-4 py-3">
          <span className="text-lg leading-none">✂️</span>
          <div>
            <p className="text-sm font-semibold text-[#c9a84c]">Free Plan — No Card Needed</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Get started immediately. Upgrade to unlock more bookings, staff, and features.
            </p>
          </div>
        </div>
      )}

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
          ) : intendedPlan ? (
            'Create Account & Continue to Payment'
          ) : (
            'Create My Free Account'
          )}
        </button>

        <p className="text-[11px] text-zinc-600 text-center leading-relaxed">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2">Privacy Policy</Link>.
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

export default function SignupPage({
  searchParams,
}: {
  searchParams: SearchParamsProp
}) {
  return (
    <Suspense fallback={null}>
      <SignupForm searchParams={searchParams} />
    </Suspense>
  )
}
