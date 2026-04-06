'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const GENERAL_FAQS: FAQItem[] = [
  {
    question: 'Is there really a free plan with no credit card required?',
    answer:
      'Yes — the Free plan is permanently free. You get 30 bookings/month, 50 client profiles, and your public booking page with no card required. Upgrade any time when you need more.',
  },
  {
    question: 'Can I import my existing client list?',
    answer:
      'Absolutely. You can import clients via CSV from any existing system. We also support direct imports from Google Contacts and Square. Our onboarding team will help you migrate for free on Pro and Empire plans.',
  },
  {
    question: 'How do automated reminders work?',
    answer:
      "On Starter and above, BarberBoost automatically sends SMS and email reminders 48 hours and 2 hours before each appointment. You can customise the timing and message. Clients can confirm or cancel directly from the reminder — no app download needed.",
  },
  {
    question: 'Does it work on mobile?',
    answer:
      'BarberBoost is fully responsive and works on any device. The dashboard is optimised for managing bookings from your phone. A native iOS and Android app is on the roadmap for Q3 2026.',
  },
  {
    question: 'Can I switch plans or cancel at any time?',
    answer:
      'Yes. Upgrade or downgrade instantly from your billing settings. Cancel any time — your data is retained for 90 days after cancellation so you can always come back.',
  },
  {
    question: 'Do you support multiple locations?',
    answer:
      'Multi-location management is available on the Empire plan (£79/mo). You get a unified dashboard across all your shops, with per-location analytics, staff management, and booking pages.',
  },
]

const BILLING_FAQS: FAQItem[] = [
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit and debit cards (Visa, Mastercard, Amex) via Stripe. No PayPal. UK Direct Debit is available on annual Empire plans.',
  },
  {
    question: 'How does the annual discount work?',
    answer:
      'Annual billing gives you 2 months free — effectively a 16.7% saving. The full annual amount is charged upfront. You can switch from monthly to annual at any time from your billing page.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer:
      'Your data is retained for 90 days after cancellation. You can export everything (bookings, clients, reports) as CSV at any time, including after cancelling. After 90 days, data is permanently deleted in line with GDPR.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'We offer a full refund within 14 days of your first paid subscription if you\'re not happy — no questions asked. For annual plans, a pro-rata refund is available within 30 days.',
  },
  {
    question: 'Is VAT included in the prices?',
    answer:
      'Prices shown are exclusive of VAT. UK businesses will be charged at the standard 20% VAT rate. A VAT invoice is automatically generated each billing period.',
  },
  {
    question: 'Can I get a receipt for my accountant?',
    answer:
      'Yes — all invoices are accessible in your billing settings and emailed automatically each billing cycle. They include your business name, VAT number (if provided), and itemised charges.',
  },
]

function AccordionItem({ question, answer, isOpen, onToggle }: FAQItem & { isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[#1a1a1a] last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={isOpen ? 'true' : 'false'}
      >
        <span className={`text-sm font-medium transition-colors ${isOpen ? 'text-[#c9a84c]' : 'text-zinc-200 group-hover:text-white'}`}>
          {question}
        </span>
        <span className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isOpen ? 'border-[#c9a84c]/40 bg-[#c9a84c]/10 text-[#c9a84c]' : 'border-zinc-700 text-zinc-500 group-hover:border-zinc-600'}`}>
          {isOpen ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </span>
      </button>
      {isOpen && (
        <div className="pb-5 pr-10">
          <p className="text-sm text-zinc-500 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

interface FAQProps {
  items?: FAQItem[]
  title?: string
  subtitle?: string
}

export function FAQ({
  items = GENERAL_FAQS,
  title = 'FREQUENTLY ASKED',
  subtitle = 'Everything you need to know.',
}: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-24 px-4 sm:px-6 bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">FAQ</p>
          <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-widest text-white">
            {title}
          </h2>
          <p className="text-zinc-500">{subtitle}</p>
        </div>

        <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl px-6">
          {items.map((item, i) => (
            <AccordionItem
              key={item.question}
              {...item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export { BILLING_FAQS, GENERAL_FAQS }
