import { getUser } from '@/lib/supabase/server'

export async function isAdmin(): Promise<boolean> {
  const user = await getUser()
  if (!user?.email) return false
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(user.email.toLowerCase())
}

export async function getAdminDebug() {
  const user = await getUser()
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return {
    userEmail:   user?.email ?? null,
    adminEmails,
    envRaw:      process.env.ADMIN_EMAILS ?? '(not set)',
    isAdmin:     user?.email ? adminEmails.includes(user.email.toLowerCase()) : false,
  }
}
