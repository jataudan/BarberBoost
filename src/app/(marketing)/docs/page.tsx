import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Lock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'API Docs — BarberBoost',
  description: 'BarberBoost REST API documentation. Manage bookings, clients, and services programmatically.',
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e1e1e]">
        <span className="text-[11px] font-mono text-zinc-600">{lang}</span>
      </div>
      <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  )
}

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-5 py-10 border-t border-[#1e1e1e] first:border-t-0 first:pt-0">
      {children}
    </section>
  )
}

function EndpointBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PATCH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <span className={`inline-block text-[11px] font-mono font-bold px-2.5 py-1 rounded-md border ${colors[method] ?? colors.GET}`}>
      {method}
    </span>
  )
}

const NAV_ITEMS = [
  { label: 'Overview', href: '#overview' },
  { label: 'Authentication', href: '#authentication' },
  { label: 'Rate Limits', href: '#rate-limits' },
  { label: 'Bookings', href: '#bookings' },
  { label: 'Clients', href: '#clients' },
  { label: 'Services', href: '#services' },
  { label: 'Staff', href: '#staff' },
  { label: 'Errors', href: '#errors' },
]

export default function DocsPage() {
  return (
    <main className="bg-[#0a0a0a]">
      {/* Hero */}
      <section className="pt-20 pb-10 px-4 sm:px-6 border-b border-[#1e1e1e]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Developer</p>
            <span className="text-xs font-mono bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-[#c9a84c] px-2.5 py-0.5 rounded-full">
              v1
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,6vw,4.5rem)] leading-none tracking-widest text-white mb-3">
            API REFERENCE
          </h1>
          <p className="text-zinc-500 text-lg max-w-2xl">
            Manage bookings, clients, services, and staff programmatically. Available on the Empire plan.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500 bg-[#111111] border border-[#1e1e1e] rounded-xl px-4 py-3 w-fit">
            <Lock className="w-3.5 h-3.5 text-[#c9a84c]" strokeWidth={1.5} />
            API access requires an <span className="text-emerald-400 font-medium ml-1">Empire plan</span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex gap-12">
        {/* Sidebar */}
        <aside className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-24 space-y-1">
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">Contents</p>
            {NAV_ITEMS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="block text-sm text-zinc-500 hover:text-[#c9a84c] py-1 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-3xl">

          <Section id="overview">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">OVERVIEW</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              The BarberBoost REST API lets you read and write data in your shop programmatically — integrate with your own systems, build custom workflows, or sync with third-party tools.
            </p>
            <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-4 space-y-2">
              <p className="text-xs text-zinc-600 font-medium uppercase tracking-widest">Base URL</p>
              <code className="text-sm font-mono text-[#c9a84c]">https://barberboost.app/api/v1</code>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              All requests and responses use JSON. Dates are returned in ISO 8601 format (<code className="text-xs font-mono text-zinc-400">2026-04-25T14:00:00Z</code>).
            </p>
          </Section>

          <Section id="authentication">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">AUTHENTICATION</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Authenticate using a Bearer token in the <code className="text-xs font-mono text-zinc-400">Authorization</code> header. Generate your API key from <strong className="text-zinc-300">Settings → Account → API Keys</strong>.
            </p>
            <CodeBlock lang="bash" code={`curl https://barberboost.app/api/v1/bookings \\
  -H "Authorization: Bearer bb_live_xxxxxxxxxxxxxxxxxxxx"`} />
            <p className="text-sm text-zinc-500 leading-relaxed">
              Keep your API key secret — treat it like a password. Rotate it from your settings at any time. Each shop has one API key.
            </p>
          </Section>

          <Section id="rate-limits">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">RATE LIMITS</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Requests are limited to <strong className="text-zinc-300">300 per minute</strong> per API key. Rate limit headers are included on every response:
            </p>
            <CodeBlock lang="http" code={`X-RateLimit-Limit: 300
X-RateLimit-Remaining: 287
X-RateLimit-Reset: 1745600460`} />
            <p className="text-sm text-zinc-500 leading-relaxed">
              When you exceed the limit, requests return <code className="text-xs font-mono text-zinc-400">429 Too Many Requests</code>. Back off and retry after the time indicated in <code className="text-xs font-mono text-zinc-400">X-RateLimit-Reset</code>.
            </p>
          </Section>

          <Section id="bookings">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">BOOKINGS</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Retrieve, create, and cancel bookings in your shop.</p>

            <div className="space-y-6">
              {/* List bookings */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <EndpointBadge method="GET" />
                  <code className="text-sm font-mono text-zinc-300">/bookings</code>
                </div>
                <p className="text-sm text-zinc-500">List all bookings. Supports filtering by date range, staff, and status.</p>
                <CodeBlock lang="bash" code={`curl https://barberboost.app/api/v1/bookings?date=2026-04-25 \\
  -H "Authorization: Bearer bb_live_xxxx"`} />
                <CodeBlock lang="json" code={`{
  "data": [
    {
      "id": "bkg_01jvz3m8xk",
      "client": { "id": "clt_01jvz2b", "name": "Marcus Reid", "phone": "+447700900123" },
      "service": { "id": "svc_01jvz1a", "name": "Fade & Beard", "duration": 45, "price": 2500 },
      "staff": { "id": "stf_01jvz0f", "name": "Jordan" },
      "starts_at": "2026-04-25T14:00:00Z",
      "ends_at": "2026-04-25T14:45:00Z",
      "status": "confirmed"
    }
  ],
  "total": 1
}`} />
              </div>

              {/* Create booking */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <EndpointBadge method="POST" />
                  <code className="text-sm font-mono text-zinc-300">/bookings</code>
                </div>
                <p className="text-sm text-zinc-500">Create a new booking.</p>
                <CodeBlock lang="bash" code={`curl -X POST https://barberboost.app/api/v1/bookings \\
  -H "Authorization: Bearer bb_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "clt_01jvz2b",
    "service_id": "svc_01jvz1a",
    "staff_id": "stf_01jvz0f",
    "starts_at": "2026-04-26T10:00:00Z"
  }'`} />
              </div>

              {/* Cancel booking */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <EndpointBadge method="DELETE" />
                  <code className="text-sm font-mono text-zinc-300">/bookings/:id</code>
                </div>
                <p className="text-sm text-zinc-500">Cancel a booking by ID. The client is notified automatically.</p>
                <CodeBlock lang="bash" code={`curl -X DELETE https://barberboost.app/api/v1/bookings/bkg_01jvz3m8xk \\
  -H "Authorization: Bearer bb_live_xxxx"`} />
              </div>
            </div>
          </Section>

          <Section id="clients">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">CLIENTS</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Read and manage your client database.</p>
            <div className="space-y-4">
              {[
                { method: 'GET', path: '/clients', desc: 'List all clients. Supports search by name or phone.' },
                { method: 'GET', path: '/clients/:id', desc: 'Get a single client with full visit history.' },
                { method: 'POST', path: '/clients', desc: 'Create a new client record.' },
                { method: 'PATCH', path: '/clients/:id', desc: 'Update client details (name, email, phone, tags).' },
              ].map(({ method, path, desc }) => (
                <div key={path} className="flex items-start gap-4 py-3 border-b border-[#1e1e1e] last:border-0">
                  <EndpointBadge method={method} />
                  <div>
                    <code className="text-sm font-mono text-zinc-300">{path}</code>
                    <p className="text-xs text-zinc-600 mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="services">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">SERVICES</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Read your service menu.</p>
            <div className="space-y-4">
              {[
                { method: 'GET', path: '/services', desc: 'List all active services.' },
                { method: 'GET', path: '/services/:id', desc: 'Get a service including pricing and assigned staff.' },
              ].map(({ method, path, desc }) => (
                <div key={path} className="flex items-start gap-4 py-3 border-b border-[#1e1e1e] last:border-0">
                  <EndpointBadge method={method} />
                  <div>
                    <code className="text-sm font-mono text-zinc-300">{path}</code>
                    <p className="text-xs text-zinc-600 mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="staff">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">STAFF</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Read staff profiles and availability.</p>
            <div className="space-y-4">
              {[
                { method: 'GET', path: '/staff', desc: 'List all staff members.' },
                { method: 'GET', path: '/staff/:id/availability', desc: 'Get available slots for a staff member on a given date.' },
              ].map(({ method, path, desc }) => (
                <div key={path} className="flex items-start gap-4 py-3 border-b border-[#1e1e1e] last:border-0">
                  <EndpointBadge method={method} />
                  <div>
                    <code className="text-sm font-mono text-zinc-300">{path}</code>
                    <p className="text-xs text-zinc-600 mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="errors">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">ERRORS</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              The API uses standard HTTP status codes. Errors include a machine-readable <code className="text-xs font-mono text-zinc-400">code</code> and a human-readable <code className="text-xs font-mono text-zinc-400">message</code>.
            </p>
            <CodeBlock lang="json" code={`{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "The requested time slot is no longer available."
  }
}`} />
            <div className="space-y-3 mt-4">
              {[
                { code: '200', label: 'OK', desc: 'Request succeeded.' },
                { code: '201', label: 'Created', desc: 'Resource created successfully.' },
                { code: '400', label: 'Bad Request', desc: 'Invalid parameters. Check the error code for details.' },
                { code: '401', label: 'Unauthorised', desc: 'Missing or invalid API key.' },
                { code: '403', label: 'Forbidden', desc: 'Your plan does not support API access.' },
                { code: '404', label: 'Not Found', desc: 'The requested resource does not exist.' },
                { code: '429', label: 'Too Many Requests', desc: 'Rate limit exceeded. Retry after X-RateLimit-Reset.' },
                { code: '500', label: 'Server Error', desc: 'Something went wrong on our end. Check status.barberboost.app.' },
              ].map(({ code, label, desc }) => (
                <div key={code} className="flex gap-4 py-2.5 border-b border-[#1a1a1a] last:border-0">
                  <code className="text-xs font-mono text-zinc-400 w-10 shrink-0">{code}</code>
                  <span className="text-xs font-semibold text-zinc-300 w-28 shrink-0">{label}</span>
                  <span className="text-xs text-zinc-600">{desc}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Empire CTA */}
          <div className="mt-10 bg-[#111111] border border-emerald-500/20 rounded-2xl p-8 text-center space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Empire plan</p>
            <h3 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">
              UNLOCK API ACCESS
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              API access is included on the Empire plan. Upgrade to get your API key and start building.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#0a0a0a] font-bold px-6 py-3 rounded-xl transition-colors text-sm tracking-wide"
            >
              View Empire plan
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
