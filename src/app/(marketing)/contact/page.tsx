import type { Metadata } from 'next'
import { Mail, Clock, MessageSquare } from 'lucide-react'
import { ContactForm } from '@/components/marketing/ContactForm'

export const metadata: Metadata = {
  title: 'Contact — BarberBoost',
  description: 'Get in touch with the BarberBoost team. We reply to every message within one business day.',
}

const CONTACT_DETAILS = [
  {
    icon: Mail,
    label: 'Email',
    value: 'hello@barberboost.app',
    href: 'mailto:hello@barberboost.app',
  },
  {
    icon: Clock,
    label: 'Response time',
    value: 'Within 1 business day',
    href: null,
  },
  {
    icon: MessageSquare,
    label: 'Support hours',
    value: 'Mon–Fri, 9am–6pm GMT',
    href: null,
  },
]

export default function ContactPage() {
  return (
    <main className="bg-[#0a0a0a]">
      {/* Hero */}
      <section className="pt-20 pb-12 px-4 sm:px-6 text-center space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">
          Get in touch
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,7vw,5.5rem)] leading-none tracking-widest text-white">
          CONTACT US
        </h1>
        <p className="text-zinc-500 text-lg max-w-xl mx-auto">
          A question, an idea, or just want to say hello — we read every message.
        </p>
      </section>

      {/* Content */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-10">
          {/* Left: contact info */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c] mb-4">Contact info</p>
              <div className="space-y-3">
                {CONTACT_DETAILS.map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-xl bg-[#111111] border border-[#1e1e1e] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#c9a84c]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600">{label}</p>
                      {href ? (
                        <a href={href} className="text-sm text-zinc-300 hover:text-[#c9a84c] transition-colors">
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm text-zinc-300">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#1e1e1e] pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c] mb-3">Other ways to reach us</p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>
                  <span className="text-zinc-600">Sales:</span>{' '}
                  <a href="mailto:sales@barberboost.app" className="hover:text-[#c9a84c] transition-colors">
                    sales@barberboost.app
                  </a>
                </li>
                <li>
                  <span className="text-zinc-600">Support:</span>{' '}
                  <a href="mailto:support@barberboost.app" className="hover:text-[#c9a84c] transition-colors">
                    support@barberboost.app
                  </a>
                </li>
                <li>
                  <span className="text-zinc-600">Press:</span>{' '}
                  <a href="mailto:press@barberboost.app" className="hover:text-[#c9a84c] transition-colors">
                    press@barberboost.app
                  </a>
                </li>
              </ul>
            </div>

            <div className="border-t border-[#1e1e1e] pt-6 bg-[#111111] rounded-2xl p-5 border border-[#1e1e1e]">
              <p className="text-xs text-zinc-500 leading-relaxed">
                BarberBoost Ltd<br />
                Registered in England & Wales<br />
                <span className="text-zinc-600">hello@barberboost.app</span>
              </p>
            </div>
          </div>

          {/* Right: form (2 cols) */}
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c] mb-6">Send us a message</p>
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  )
}
