import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { getUser } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, user] = await Promise.all([isAdmin(), getUser()])

  if (!user) redirect('/login')
  if (!admin) redirect('/dashboard')

  return <AdminShell email={user.email ?? ''}>{children}</AdminShell>
}
