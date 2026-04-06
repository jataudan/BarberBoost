export const APP_NAME = 'BarberBoost'
export const APP_DESCRIPTION = 'The all-in-one platform for modern barbershops'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const PLANS = {
  STARTER: 'starter',
  PRO: 'pro',
  EMPIRE: 'empire',
} as const

export const PLAN_LIMITS = {
  starter: {
    staff: 2,
    bookingsPerMonth: 100,
    clients: 200,
    locations: 1,
  },
  pro: {
    staff: 10,
    bookingsPerMonth: 1000,
    clients: 2000,
    locations: 3,
  },
  empire: {
    staff: Infinity,
    bookingsPerMonth: Infinity,
    clients: Infinity,
    locations: Infinity,
  },
} as const

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Bookings', href: '/bookings', icon: 'Calendar' },
  { label: 'Clients', href: '/clients', icon: 'Users' },
  { label: 'Services', href: '/services', icon: 'Scissors' },
  { label: 'Staff', href: '/staff', icon: 'UserCheck' },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart2' },
  { label: 'Marketing', href: '/marketing', icon: 'Megaphone' },
  { label: 'Inventory', href: '/inventory', icon: 'Package' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const
