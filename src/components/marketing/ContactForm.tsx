'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle } from 'lucide-react'

const SUBJECTS = [
  'General enquiry',
  'Sales / pricing',
  'Technical support',
  'Billing',
  'Feature request',
  'Partnership',
  'Press / media',
  'Other',
]

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-10 text-center space-y-4">
        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" strokeWidth={1.5} />
        <h3 className="font-[family-name:var(--font-heading)] text-2xl tracking-widest text-white leading-none">
          MESSAGE SENT
        </h3>
        <p className="text-sm text-zinc-500">
          Thanks for reaching out. We'll get back to you within one business day.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs text-zinc-500 font-medium">Your name</label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Dan Smith"
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs text-zinc-500 font-medium">Email address</label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="dan@yourshop.com"
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="subject" className="text-xs text-zinc-500 font-medium">Subject</label>
        <select
          id="subject"
          required
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 transition-colors appearance-none"
        >
          <option value="" disabled>Select a subject…</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="text-xs text-zinc-500 font-medium">Message</label>
        <textarea
          id="message"
          required
          rows={6}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Tell us what's on your mind…"
          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="group flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0a] font-bold px-8 py-4 rounded-xl transition-all tracking-wide"
      >
        {loading ? 'Sending…' : 'Send message'}
        {!loading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
      </button>
    </form>
  )
}
