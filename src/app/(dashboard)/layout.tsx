import { redirect } from 'next/navigation'
import { getUser, getShop, createClient } from '@/lib/supabase/server'
import { getEntitlement } from '@/lib/entitlement'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, shop] = await Promise.all([
    getUser(),
    getShop(),
  ])

  if (!user) redirect('/login')

  // Enforce admin_status: block access to dashboard for suspended/disabled shops
  if (shop?.admin_status === 'disabled')  redirect('/account-disabled')
  if (shop?.admin_status === 'suspended') redirect('/account-suspended')

  const [entitlement, notificationCount] = await Promise.all([
    shop ? getEntitlement(shop.id) : null,
    (async () => {
      if (!shop) return 0
      const supabase = await createClient()
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.id)
        .eq('is_read', false)
      return count ?? 0
    })(),
  ])

  return (
    <DashboardShell
      user={user}
      shop={shop}
      entitlement={entitlement}
      notificationCount={notificationCount}
    >
      {children}
    </DashboardShell>
  )
}
