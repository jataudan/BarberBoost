'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const schema = z
  .object({
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

const INPUT_BASE   = 'w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all'
const INPUT_NORMAL = `${INPUT_BASE} border-[#2a2a2a] focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/20`
const INPUT_ERROR  = `${INPUT_BASE} border-red-500/40 focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20`

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setServerError(error.message)
      return
    }
    setDone(true)
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 2000)
  }

  if (done) {
    return (
      <div className="text-center space-y-5 py-8">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle className="w-7 h-7 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white">
            PASSWORD UPDATED
          </h2>
          <p className="text-zinc-500 text-sm">Redirecting you to the dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-heading)] text-4xl tracking-widest text-white leading-none">
          NEW PASSWORD
        </h1>
        <p className="text-zinc-500 text-sm">Choose a strong password for your account.</p>
      </div>

      {serverError && (
        <div className="flex items-center gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-400">New Password</label>
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
          {errors.password && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-400">Confirm Password</label>
          <div className="relative">
            <input
              {...register('confirm_password')}
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat your new password"
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
          {errors.confirm_password && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.confirm_password.message}
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
              Updating password…
            </>
          ) : (
            'Set New Password'
          )}
        </button>
      </form>
    </div>
  )
}
