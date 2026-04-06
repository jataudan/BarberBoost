import Link from 'next/link'
import { CreditCard, Store, UserCircle, Globe, ChevronRight } from 'lucide-react'

const ITEMS = [
  {
    href:        '/settings/shop',
    icon:        Store,
    title:       'Shop Settings',
    description: 'Name, address, logo, opening hours, social links and regional preferences',
    accent:      'text-[#c9a84c]',
    iconBg:      'bg-[#c9a84c]/10',
  },
  {
    href:        '/settings/account',
    icon:        UserCircle,
    title:       'Account',
    description: 'Update your display name, email, password and manage your account',
    accent:      'text-violet-400',
    iconBg:      'bg-violet-500/10',
  },
  {
    href:        '/settings/booking-page',
    icon:        Globe,
    title:       'Booking Page',
    description: 'Customise your public booking URL, notice periods and no-show policy',
    accent:      'text-sky-400',
    iconBg:      'bg-sky-500/10',
  },
  {
    href:        '/settings/billing',
    icon:        CreditCard,
    title:       'Billing',
    description: 'Manage your subscription plan and payment details',
    accent:      'text-indigo-400',
    iconBg:      'bg-indigo-500/10',
  },
] as const

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl tracking-widest text-white leading-none">SETTINGS</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="space-y-3">
        {ITEMS.map(({ href, icon: Icon, title, description, accent, iconBg }) => (
          <Link key={href} href={href}
            className="group flex items-center gap-4 bg-[#111111] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-2xl px-5 py-4 transition-colors">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <Icon className={`w-5 h-5 ${accent}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="text-sm text-zinc-500 mt-0.5">{description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
