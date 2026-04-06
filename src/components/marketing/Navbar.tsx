'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
]

function ScissorsLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="#c9a84c" strokeWidth="1.5" />
      <circle cx="7" cy="21" r="4.5" stroke="#c9a84c" strokeWidth="1.5" />
      <line x1="11" y1="10" x2="24" y2="4" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="18" x2="24" y2="24" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="13" x2="24" y2="4" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" opacity="0" />
    </svg>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-[#c9a84c]/10 shadow-lg shadow-black/40'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="BarberBoost home">
          <ScissorsLogo />
          <span className="font-[family-name:var(--font-heading)] text-2xl tracking-widest leading-none">
            <span className="text-[#c9a84c]">BARBER</span>
            <span className="text-white">BOOST</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors relative group ${
                pathname === href ? 'text-[#c9a84c]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {label}
              <span
                className={`absolute -bottom-0.5 left-0 h-px bg-[#c9a84c] transition-all duration-300 ${
                  pathname === href ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              />
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-2"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] text-sm font-bold px-5 py-2.5 rounded-lg transition-colors tracking-wide"
          >
            Start Free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden text-zinc-400 hover:text-white transition-colors p-2"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen ? 'true' : 'false'}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#111111] border-b border-[#c9a84c]/10">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'text-[#c9a84c] bg-[#c9a84c]/5'
                    : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="pt-3 border-t border-zinc-800 mt-3 flex flex-col gap-2">
              <Link
                href="/login"
                className="block px-3 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="block text-center bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
              >
                Start Free — No Card Needed
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
