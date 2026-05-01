import type { ReactNode } from 'react'

interface TocItem {
  id: string
  label: string
}

interface LegalLayoutProps {
  eyebrow: string
  title: string
  intro: string
  lastUpdated: string
  toc: TocItem[]
  children: ReactNode
}

export function LegalLayout({ eyebrow, title, intro, lastUpdated, toc, children }: LegalLayoutProps) {
  return (
    <main className="bg-[#0a0a0a]">
      {/* Hero */}
      <section className="pt-16 pb-10 px-4 sm:px-6 border-b border-[#1e1e1e]">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c] mb-3">{eyebrow}</p>
          <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-widest text-white mb-4">
            {title}
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-2xl mb-4">{intro}</p>
          <p className="text-xs text-zinc-600">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Body */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex gap-14">

          {/* Sticky TOC */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-24 space-y-0.5">
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">Contents</p>
              {toc.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="block text-xs text-zinc-500 hover:text-[#c9a84c] py-1.5 transition-colors border-l border-[#1e1e1e] hover:border-[#c9a84c]/40 pl-3"
                >
                  {label}
                </a>
              ))}
            </div>
          </aside>

          {/* Sections */}
          <div className="flex-1 min-w-0 space-y-0 divide-y divide-[#1a1a1a]">
            {children}
          </div>
        </div>
      </section>
    </main>
  )
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div id={id} className="py-8 scroll-mt-20 first:pt-0 space-y-4">
      <h2 className="font-[family-name:var(--font-heading)] text-lg tracking-widest text-white leading-none">
        {title}
      </h2>
      <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
        {children}
      </div>
    </div>
  )
}
