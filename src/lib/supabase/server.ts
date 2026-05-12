import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { Shop, Subscription } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component — cookies can't be set; middleware handles this
          }
        },
      },
    }
  )
}

/**
 * Returns the currently authenticated Supabase user, or null.
 * Wrapped in React `cache` so it runs at most once per request tree.
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
})

/**
 * Returns the shop row for the current user, or null.
 */
export const getShop = cache(async (): Promise<Shop | null> => {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return null
  const { data } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', user.id)
    .single()
  return data ?? null
})

/**
 * Returns the active/trialing subscription for the current user, or null.
 * Uses ordered limit(1) instead of .single() so duplicate rows (from a
 * historical upsert bug) never cause a thrown error.
 */
export const getSubscription = cache(async (): Promise<Subscription | null> => {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return null
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('owner_id', user.id)
    .in('status', ['active', 'trialing'])
    .order('updated_at', { ascending: false })
    .limit(1)
  return (data?.[0] as Subscription | undefined) ?? null
})

export async function createServiceClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignore
          }
        },
      },
    }
  )
}
