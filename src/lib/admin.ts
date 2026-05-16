import { getUser } from '@/lib/supabase/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',').map(e => e.trim()).filter(Boolean)

export async function isAdmin(): Promise<boolean> {
  const user = await getUser()
  if (!user?.email) return false
  return ADMIN_EMAILS.includes(user.email)
}
