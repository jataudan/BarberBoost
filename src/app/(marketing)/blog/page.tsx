import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog — BarberBoost',
  description: 'Guides, tips, and insights for UK barbershop owners looking to grow their business.',
}

const POSTS = [
  {
    slug: 'reduce-no-shows-automated-reminders',
    category: 'Client Retention',
    categoryColor: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/20',
    title: 'How to Reduce No-Shows by 70% with Automated Reminders',
    excerpt: 'No-shows are the silent killer of barbershop revenue. We break down the exact reminder sequence — timing, channels, and tone — that top-performing shops use to keep chairs full.',
    readTime: '6 min read',
    date: 'Apr 18, 2026',
    accentColor: '#c9a84c',
  },
  {
    slug: 'uk-barbershop-owner-guide-growing-client-base',
    category: 'Growth',
    categoryColor: 'text-blue-400 bg-blue-500/8 border-blue-500/20',
    title: 'The UK Barbershop Owner\'s Guide to Growing Your Client Base',
    excerpt: 'From first-time walk-ins to lifelong regulars — the systems and strategies that turn one-off visits into a loyal, growing clientele. Practical, tested, no fluff.',
    readTime: '9 min read',
    date: 'Apr 11, 2026',
    accentColor: '#c9a84c',
  },
  {
    slug: '5-signs-ready-to-go-digital',
    category: 'Getting Started',
    categoryColor: 'text-[#c9a84c] bg-[#c9a84c]/8 border-[#c9a84c]/20',
    title: '5 Signs Your Barbershop Is Ready to Go Digital',
    excerpt: 'Still taking bookings by phone? Managing staff with a whiteboard? If any of these five scenarios sound familiar, it\'s time to make the switch — here\'s why and how.',
    readTime: '4 min read',
    date: 'Apr 3, 2026',
    accentColor: '#c9a84c',
  },
  {
    slug: 'how-to-price-services-uk-barbers',
    category: 'Business',
    categoryColor: 'text-indigo-400 bg-indigo-500/8 border-indigo-500/20',
    title: 'How to Price Your Services: A Guide for UK Barbers',
    excerpt: 'Undercharging is the most common mistake independent barbers make. Learn how to calculate a profitable rate, benchmark against your local market, and raise prices without losing clients.',
    readTime: '7 min read',
    date: 'Mar 27, 2026',
    accentColor: '#c9a84c',
  },
]

const CATEGORIES = ['All', 'Growth', 'Client Retention', 'Business', 'Getting Started', 'Product Updates']

export default function BlogPage() {
  return (
    <main className="bg-[#0a0a0a]">
      {/* Hero */}
      <section className="pt-20 pb-12 px-4 sm:px-6 text-center space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">
          Insights & Guides
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,7vw,5.5rem)] leading-none tracking-widest text-white">
          THE BLOG
        </h1>
        <p className="text-zinc-500 text-lg max-w-xl mx-auto">
          Practical advice for barbershop owners who want to work smarter, not harder.
        </p>
      </section>

      {/* Category filter */}
      <section className="px-4 sm:px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map((cat, i) => (
              <span
                key={cat}
                className={`text-xs font-medium px-4 py-2 rounded-full border cursor-pointer transition-colors ${
                  i === 0
                    ? 'bg-[#c9a84c]/10 border-[#c9a84c]/30 text-[#c9a84c]'
                    : 'bg-transparent border-[#1e1e1e] text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                }`}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Posts grid */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Featured post */}
          <div className="mb-8">
            <Link
              href={`/blog/${POSTS[0].slug}`}
              className="group block bg-[#111111] border border-[#1e1e1e] rounded-2xl overflow-hidden hover:border-[#c9a84c]/20 hover:bg-[#131313] transition-all"
            >
              <div className="grid md:grid-cols-2 gap-0">
                {/* Color block */}
                <div className="h-48 md:h-auto bg-gradient-to-br from-[#c9a84c]/15 via-[#111111] to-[#0a0a0a] flex items-center justify-center p-10 border-b md:border-b-0 md:border-r border-[#1e1e1e]">
                  <div className="text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center mx-auto">
                      <span className="text-2xl">✂️</span>
                    </div>
                    <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest">Featured</p>
                  </div>
                </div>
                {/* Content */}
                <div className="p-8 space-y-4 flex flex-col justify-center">
                  <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border w-fit ${POSTS[0].categoryColor}`}>
                    {POSTS[0].category}
                  </span>
                  <h2 className="font-[family-name:var(--font-heading)] text-[clamp(1.5rem,3vw,2.2rem)] leading-tight tracking-widest text-white group-hover:text-[#c9a84c] transition-colors">
                    {POSTS[0].title}
                  </h2>
                  <p className="text-sm text-zinc-500 leading-relaxed">{POSTS[0].excerpt}</p>
                  <div className="flex items-center gap-4 pt-2">
                    <span className="text-xs text-zinc-600">{POSTS[0].date}</span>
                    <span className="flex items-center gap-1 text-xs text-zinc-600">
                      <Clock className="w-3 h-3" />
                      {POSTS[0].readTime}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-xs text-[#c9a84c] font-medium">
                      Read article
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Remaining posts */}
          <div className="grid md:grid-cols-3 gap-5">
            {POSTS.slice(1).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-[#111111] border border-[#1e1e1e] rounded-2xl overflow-hidden hover:border-[#c9a84c]/20 hover:bg-[#131313] transition-all flex flex-col"
              >
                {/* Mini color block */}
                <div className="h-24 bg-gradient-to-br from-[#c9a84c]/8 via-[#111111] to-[#0a0a0a] border-b border-[#1e1e1e] flex items-center justify-center">
                  <span className="text-xl">✂️</span>
                </div>
                <div className="p-6 space-y-3 flex flex-col flex-1">
                  <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full border w-fit ${post.categoryColor}`}>
                    {post.category}
                  </span>
                  <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-[#c9a84c] transition-colors flex-1">
                    {post.title}
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs text-zinc-600">{post.date}</span>
                    <span className="flex items-center gap-1 text-xs text-zinc-600">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-10 text-center space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Stay in the loop</p>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(1.8rem,4vw,2.8rem)] leading-none tracking-widest text-white">
              NEW ARTICLES, MONTHLY
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm mx-auto">
              One email a month. No spam, no promotions — just practical guides for barbershop owners.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#c9a84c]/50"
              />
              <button
                type="button"
                className="bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold px-6 py-3 rounded-xl transition-colors text-sm tracking-wide shrink-0"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
