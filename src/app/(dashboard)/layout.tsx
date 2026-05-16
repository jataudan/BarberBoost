import { redirect } from 'next/navigation'
import { getUser, getShop, getSubscription, createClient, createServiceClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export const dynamic = 'force-dynamic'

// Grace period: 7 days past_due before we force-downgrade the plan in our DB.
// Stripe will eventually cancel and fire the webhook, but this acts as a safety net.
const GRACE_PERIOD_DAYS = 7

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, shop, subscription] = await Promise.all([
    getUser(),
    getShop(),
    getSubscription(),
  ])

  // Safety-net downgrade: if past_due and grace period has elapsed, set plan → free
  if (subscription && subscription.status === 'past_due' && subscription.current_period_end) {
    const periodEnd  = new Date(subscription.current_period_end)
    const graceCutoff = new Date(periodEnd.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)
    if (new Date() > graceCutoff && subscription.plan !== 'free') {
      const svc = await createServiceClient()
      await svc.from('subscriptions').update({ plan: 'free' }).eq('id', subscription.id)
      subscription.plan = 'free'
    }
  }

  if (!user) redirect('/login')

  // Enforce admin_status: block access to dashboard for suspended/disabled shops
  if (shop?.admin_status === 'disabled')  redirect('/account-disabled')
  if (shop?.admin_status === 'suspended') redirect('/account-suspended')

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
