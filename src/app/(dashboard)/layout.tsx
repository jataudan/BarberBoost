import { redirect } from 'next/navigation'
import { getUser, getShop, getSubscription, createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, shop, subscription] = await Promise.all([
    getUser(),
    getShop(),
    getSubscription(),
  ])

  if (!user) redirect('/login')

  // Unread notification count
  let notificationCount = 0
  if (shop) {
    const supabase = await createClient()
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shop.id)
      .eq('is_read', false)
    notificationCount = count ?? 0
  }

  return (
    <DashboardShell
      user={user}
      shop={shop}
      subscription={subscription}
      notificationCount={notificationCount}
    >
      {children}
    </DashboardShell>
  )
}
