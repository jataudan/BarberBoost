import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MessageSquare, Users, BookOpen, Rss } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Community — BarberBoost',
  description: 'Join the BarberBoost community. Connect with other barbershop owners, share tips, and get help.',
}

const CHANNELS = [
  {
    icon: MessageSquare,
    platform: 'Discord',
    description: 'Our main community hub. Ask questions, share wins, get feedback on your booking page, and chat with the team.',
    cta: 'Join Discord server',
    href: '#',
    accent: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/20',
    iconBg: 'bg-indigo-500/8 border-indigo-500/15',
    members: '1,400+ members',
  },
  {
    icon: Users,
    platform: 'Facebook Group',
    description: 'A private group for BarberBoost users. Share your experience, ask for advice, and see how other shops are running things.',
    cta: 'Join the group',
    href: '#',
    accent: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 border-blue-500/20',
    iconBg: 'bg-blue-500/8 border-blue-500/15',
    members: '820+ members',
  },
]

const SOCIAL = [
  { name: 'Instagram', handle: '@getbarberboost', href: '#', letter: 'I', desc: 'Tips, features, and barbershop highlights' },
  { name: 'X (Twitter)', handle: '@getbarberboost', href: '#', letter: 'X', desc: 'Product updates and quick announcements' },
  { name: 'Facebook', handle: '@getbarberboost', href: '#', letter: 'F', desc: 'Community updates and barbershop culture' },
  { name: 'YouTube', handle: '@getbarberboost', href: '#', letter: 'Y', desc: 'Tutorials, walkthroughs, and tips' },
]

const GUIDELINES = [
  'Be respectful — everyone is at a different stage of the journey',
  'Share real experiences — good and bad — so everyone can learn',
  'No spam, no self-promotion without context',
  'Tag the BarberBoost team if you need official support',
]

export default function CommunityPage() {
  return (
    <main className="bg-[#0a0a0a]">
      {/* Hero */}
      <section className="pt-20 pb-16 px-4 sm:px-6 text-center space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Community</p>
        <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,7vw,5.5rem)] leading-none tracking-widest text-white">
          JOIN THE<br />COMMUNITY
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
          Thousands of UK barbershop owners sharing what works, what doesn't, and how they're growing their businesses.
        </p>
      </section>

      {/* Main channels */}
      <section className="py-8 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600 mb-8 text-center">Where to find us</p>
          <div className="grid md:grid-cols-2 gap-5">
            {CHANNELS.map(({ icon: Icon, platform, description, cta, href, accent, badgeBg, iconBg, members }) => (
              <div
                key={platform}
                className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-7 space-y-5 hover:border-[#c9a84c]/15 transition-all group flex flex-col"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${accent}`} strokeWidth={1.5} />
                  </div>
                  <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${badgeBg} ${accent}`}>
                    {members}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-[family-name:var(--font-heading)] text-xl tracking-widest text-white leading-none">
                    {platform.toUpperCase()}
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
                </div>
                <a
                  href={href}
                  className={`inline-flex items-center gap-2 text-sm font-semibold ${accent} hover:opacity-80 transition-opacity`}
                >
                  {cta}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social links */}
      <section className="py-16 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600">Social media</p>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(1.8rem,4vw,2.8rem)] leading-none tracking-widest text-white">
              FOLLOW ALONG
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {SOCIAL.map(({ name, handle, href, letter, desc }) => (
              <a
                key={name}
                href={href}
                className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-5 space-y-3 hover:border-[#c9a84c]/20 hover:bg-[#131313] transition-all group text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/8 border border-[#c9a84c]/15 flex items-center justify-center mx-auto text-[#c9a84c] font-bold text-sm group-hover:bg-[#c9a84c]/12 transition-colors">
                  {letter}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{name}</p>
                  <p className="text-xs text-[#c9a84c]">{handle}</p>
                </div>
                <p className="text-xs text-zinc-600">{desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Blog + newsletter */}
      <section className="py-16 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
          {/* Blog */}
          <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-7 space-y-4 hover:border-[#c9a84c]/15 transition-all">
            <div className="w-11 h-11 rounded-xl bg-[#c9a84c]/8 border border-[#c9a84c]/15 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#c9a84c]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-heading)] text-xl tracking-widest text-white leading-none mb-2">THE BLOG</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Practical guides, business tips, and product updates written for barbershop owners.
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-[#c9a84c] hover:text-[#e2bf6a] font-medium transition-colors"
            >
              Read the blog
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Newsletter */}
          <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-7 space-y-4 hover:border-[#c9a84c]/15 transition-all">
            <div className="w-11 h-11 rounded-xl bg-[#c9a84c]/8 border border-[#c9a84c]/15 flex items-center justify-center">
              <Rss className="w-5 h-5 text-[#c9a84c]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-heading)] text-xl tracking-widest text-white leading-none mb-2">NEWSLETTER</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                One email a month with the most useful tips and what's new in BarberBoost.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
              />
              <button
                type="button"
                className="bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold px-4 py-2.5 rounded-xl transition-colors text-sm shrink-0"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Community guidelines */}
      <section className="py-16 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600">Community guidelines</p>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(1.8rem,4vw,2.5rem)] leading-none tracking-widest text-white">
              HOW WE ROLL
            </h2>
          </div>
          <ul className="space-y-3">
            {GUIDELINES.map((g) => (
              <li key={g} className="flex gap-3 items-start text-sm text-zinc-500">
                <span className="text-[#c9a84c] mt-0.5 shrink-0">—</span>
                {g}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Help CTA */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <p className="text-sm text-zinc-500">
            Need official support?{' '}
            <Link href="/help" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">Visit the Help Centre</Link>
            {' '}or{' '}
            <Link href="/contact" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">contact the team directly</Link>.
          </p>
        </div>
      </section>
    </main>
  )
}
