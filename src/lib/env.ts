/**
 * Environment variable validation.
 * Imported once at startup — throws a clear, actionable error if any
 * required variable is missing or malformed.
 *
 * Usage: `import '@/lib/env'` at the top of the root layout, or any
 * server entry point that runs before request handling.
 */

import { z } from 'zod'

const envSchema = z.object({
  // ── Supabase ──────────────────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY:     z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // ── Stripe ────────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY:          z.string().startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_'),
  STRIPE_WEBHOOK_SECRET:      z.string().startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_'),
  STRIPE_STARTER_PRICE_ID:    z.string().startsWith('price_', 'STRIPE_STARTER_PRICE_ID must start with price_'),
  STRIPE_PRO_PRICE_ID:        z.string().startsWith('price_', 'STRIPE_PRO_PRICE_ID must start with price_'),
  STRIPE_EMPIRE_PRICE_ID:     z.string().startsWith('price_', 'STRIPE_EMPIRE_PRICE_ID must start with price_'),

  // ── Resend (email) ────────────────────────────────────────────────────────
  RESEND_API_KEY:    z.string().startsWith('re_', 'RESEND_API_KEY must start with re_'),
  RESEND_FROM_EMAIL: z.string().email('RESEND_FROM_EMAIL must be a valid email address'),

  // ── Anthropic (AI Copy — Empire plan feature) ─────────────────────────────
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-', 'ANTHROPIC_API_KEY must start with sk-ant-').optional(),

  // ── App ───────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  SUPPORT_EMAIL:       z.string().email('SUPPORT_EMAIL must be a valid email address').optional(),
})

// Validate env vars on the server at runtime.
// Skipped during `next build` (NEXT_PHASE=phase-production-build) so that
// local/CI builds work without real credentials — validation still runs
// on every real server request in production via the root layout import.
function validateEnv() {
  if (typeof window !== 'undefined') return  // client — skip
  if (process.env.NEXT_PHASE === 'phase-production-build') return  // build — skip

  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const missing = result.error.issues
      .map(i => `  • ${String(i.path[0])}: ${i.message}`)
      .join('\n')

    throw new Error(
      `\n\n❌ Missing or invalid environment variables:\n${missing}\n\n` +
      `Copy .env.example to .env.local and fill in the values.\n`
    )
  }
}

validateEnv()

// Re-export typed env for convenience (server-side only)
export const env = {
  SUPABASE_URL:               process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY:          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY:  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  STRIPE_SECRET_KEY:          process.env.STRIPE_SECRET_KEY!,
  STRIPE_WEBHOOK_SECRET:      process.env.STRIPE_WEBHOOK_SECRET!,
  RESEND_API_KEY:             process.env.RESEND_API_KEY!,
  RESEND_FROM_EMAIL:          process.env.RESEND_FROM_EMAIL!,
  APP_URL:                    process.env.NEXT_PUBLIC_APP_URL!,
  SUPPORT_EMAIL:              process.env.SUPPORT_EMAIL ?? 'support@barberboost.com',
  ANTHROPIC_API_KEY:          process.env.ANTHROPIC_API_KEY,
} as const
