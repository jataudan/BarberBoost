'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertCircle, Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type FormData = z.infer<typeof schema>

const INPUT_BASE   = 'w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all'
const INPUT_NORMAL = `${INPUT_BASE} border-[#2a2a2a] focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20`
const INPUT_ERROR  = `${INPUT_BASE} border-red-500/40 focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20`

export default function ResetPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${location.origin}/auth/callback?type=recovery`,
    })
    if (error) {
      setServerError(error.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="w-14 h-14 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center mx-auto">
          <Mail className="w-7 h-7 text-[#c9a84c]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white">
            CHECK YOUR EMAIL
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto">
            We&apos;ve sent a password reset link to{' '}
            <span className="text-zinc-300 font-medium">{getValues('email')}</span>.
            The link expires in 1 hour.
          </p>
        </div>
        <p className="text-xs text-zinc-600">
          Didn&apos;t receive it? Check your spam folder or{' '}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors"
          >
            try again
          </button>
          .
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
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
          RESET PASSWORD
        </h1>
        <p className="text-zinc-500 text-sm">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      {serverError && (
        <div className="flex items-center gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-400">Email Address</label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={errors.email ? INPUT_ERROR : INPUT_NORMAL}
          />
          {errors.email && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-xl px-4 py-3.5 text-sm tracking-wide transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending reset link…
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to sign in
      </Link>
    </div>
  )
}
