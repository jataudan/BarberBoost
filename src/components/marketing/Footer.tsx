import Link from 'next/link'

const LINKS = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'Roadmap', href: '/roadmap' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  Support: [
    { label: 'Help Centre', href: '/help' },
    { label: 'API Docs', href: '/docs' },
    { label: 'Status', href: '/status' },
    { label: 'Community', href: '/community' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'GDPR', href: '/gdpr' },
  ],
}

function ScissorsLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="#c9a84c" strokeWidth="1.5" />
      <circle cx="7" cy="21" r="4.5" stroke="#c9a84c" strokeWidth="1.5" />
      <line x1="11" y1="10" x2="24" y2="4" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="18" x2="24" y2="24" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#c9a84c]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        {/* Top: brand + columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <ScissorsLogo />
              <span className="font-[family-name:var(--font-heading)] text-xl tracking-widest leading-none">
                <span className="text-[#c9a84c]">BARBER</span>
                <span className="text-white">BOOST</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-[200px]">
              Heritage meets digital. Built for UK barbershops.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              {(['Instagram', 'X', 'Facebook', 'TikTok'] as const).map((name) => (
                <a
                  key={name}
                  href="#"
                  aria-label={name}
                  className="w-8 h-8 rounded-lg bg-[#161616] border border-[#222] flex items-center justify-center text-zinc-500 hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-colors text-[10px] font-bold"
                >
                  {name[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading} className="space-y-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{heading}</p>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-zinc-400 hover:text-[#c9a84c] transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-12 pt-8 border-t border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} BarberBoost Ltd. All rights reserved. Registered in England & Wales.
          </p>
          <div className="flex items-center gap-1 text-xs text-zinc-600">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  )
}
