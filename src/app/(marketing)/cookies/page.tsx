import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalLayout, LegalSection } from '@/components/marketing/LegalLayout'

export const metadata: Metadata = {
  title: 'Cookie Policy — BarberBoost',
  description: 'How BarberBoost uses cookies and similar technologies, and how you can manage your preferences.',
}

const TOC = [
  { id: 'what-are-cookies', label: '1. What Are Cookies' },
  { id: 'why-we-use', label: '2. Why We Use Cookies' },
  { id: 'types', label: '3. Types of Cookies' },
  { id: 'cookie-table', label: '4. Cookies We Use' },
  { id: 'third-party', label: '5. Third-Party Cookies' },
  { id: 'managing', label: '6. Managing Cookies' },
  { id: 'changes', label: '7. Changes' },
  { id: 'contact', label: '8. Contact' },
]

export default function CookiesPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="COOKIE POLICY"
      intro="This policy explains what cookies and similar technologies BarberBoost uses, why we use them, and how you can control them. By using BarberBoost, you consent to the use of cookies as described in this policy."
      lastUpdated="26 April 2026"
      toc={TOC}
    >
      <LegalSection id="what-are-cookies" title="1. What Are Cookies">
        <p>
          Cookies are small text files placed on your device (computer, tablet, or mobile) when you visit a website or use a web application. They allow the site to recognise your device, remember your preferences, and function correctly across pages and sessions.
        </p>
        <p>
          Cookies can be <strong className="text-zinc-300">session cookies</strong> (deleted when you close your browser) or <strong className="text-zinc-300">persistent cookies</strong> (remaining on your device for a set period or until manually deleted). They may be set by us ("first-party") or by our service providers ("third-party").
        </p>
        <p>
          We also use similar technologies including <strong className="text-zinc-300">local storage</strong> (browser-side data storage for keeping you logged in) and <strong className="text-zinc-300">pixels/web beacons</strong> in transactional emails (to track email opens for delivery confirmation).
        </p>
      </LegalSection>

      <LegalSection id="why-we-use" title="2. Why We Use Cookies">
        <p>We use cookies to:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Keep you authenticated and securely logged in to your account</li>
          <li>Protect your account and our platform from cross-site request forgery (CSRF) and session hijacking attacks</li>
          <li>Remember your preferences, such as your last-used view or filter settings</li>
          <li>Process payments securely through Stripe's fraud detection systems</li>
          <li>Collect anonymised usage statistics to understand how the platform is used and where we can improve it</li>
        </ul>
        <p>
          We do <strong className="text-zinc-300">not</strong> use cookies for advertising, behavioural tracking, or the sale of data to third parties. We do not use third-party advertising networks.
        </p>
      </LegalSection>

      <LegalSection id="types" title="3. Types of Cookies We Use">
        <div className="space-y-4">
          {[
            {
              type: 'Essential',
              color: 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400',
              desc: 'These cookies are strictly necessary for the platform to function. They enable core features like logging in, maintaining your session, and securing your account. The platform cannot function properly without them. These cookies do not require your consent.',
            },
            {
              type: 'Functional',
              color: 'bg-blue-500/8 border-blue-500/20 text-blue-400',
              desc: 'These cookies remember your choices and preferences to provide a more personalised experience — for example, remembering which calendar view you last used. Disabling them may affect your experience but will not prevent core functionality.',
            },
            {
              type: 'Analytics',
              color: 'bg-[#c9a84c]/8 border-[#c9a84c]/20 text-[#c9a84c]',
              desc: 'We use Vercel Analytics to collect anonymised, aggregated information about how visitors use the platform — such as which pages are most visited and how people navigate the site. No personally identifiable information is collected. This helps us understand usage patterns and improve the service.',
            },
          ].map(({ type, color, desc }) => (
            <div key={type} className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 space-y-2">
              <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border ${color}`}>{type}</span>
              <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection id="cookie-table" title="4. Cookies We Use">
        <p>The following is a list of the specific cookies set by BarberBoost:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs mt-3 border-collapse">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                <th className="text-left py-2 pr-3 text-zinc-500 font-semibold">Cookie Name</th>
                <th className="text-left py-2 pr-3 text-zinc-500 font-semibold">Type</th>
                <th className="text-left py-2 pr-3 text-zinc-500 font-semibold">Purpose</th>
                <th className="text-left py-2 text-zinc-500 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {[
                {
                  name: 'sb-[ref]-auth-token',
                  type: 'Essential',
                  purpose: 'Stores your Supabase authentication session to keep you logged in',
                  duration: 'Session / 1 hour',
                  typeColor: 'text-emerald-400',
                },
                {
                  name: 'sb-[ref]-auth-token-code-verifier',
                  type: 'Essential',
                  purpose: 'PKCE code verifier used during the OAuth authentication flow',
                  duration: 'Session',
                  typeColor: 'text-emerald-400',
                },
                {
                  name: '__Secure-next-auth.session-token',
                  type: 'Essential',
                  purpose: 'Secure session token for Next.js authentication layer',
                  duration: '30 days',
                  typeColor: 'text-emerald-400',
                },
                {
                  name: 'stripe_mid',
                  type: 'Essential',
                  purpose: 'Stripe machine identifier used for fraud prevention and payment security',
                  duration: '1 year',
                  typeColor: 'text-emerald-400',
                },
                {
                  name: 'stripe_sid',
                  type: 'Essential',
                  purpose: 'Stripe session identifier for payment checkout flows',
                  duration: '30 minutes',
                  typeColor: 'text-emerald-400',
                },
                {
                  name: '__stripe_orig_props',
                  type: 'Essential',
                  purpose: 'Stripe properties used to detect and prevent fraudulent payment activity',
                  duration: '30 minutes',
                  typeColor: 'text-emerald-400',
                },
                {
                  name: 'bb_cal_view',
                  type: 'Functional',
                  purpose: 'Remembers your last-used calendar view preference (list, day, or week)',
                  duration: '90 days',
                  typeColor: 'text-blue-400',
                },
                {
                  name: '_vaid',
                  type: 'Analytics',
                  purpose: 'Vercel Analytics anonymous visitor identifier — no PII collected',
                  duration: '1 year',
                  typeColor: 'text-[#c9a84c]',
                },
              ].map(({ name, type, purpose, duration, typeColor }) => (
                <tr key={name}>
                  <td className="py-2.5 pr-3 text-zinc-300 font-mono">{name}</td>
                  <td className={`py-2.5 pr-3 font-semibold ${typeColor}`}>{type}</td>
                  <td className="py-2.5 pr-3 text-zinc-500">{purpose}</td>
                  <td className="py-2.5 text-zinc-500">{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pt-3 text-zinc-600 text-xs">
          Cookie names prefixed with [ref] include a unique project identifier that varies by deployment.
        </p>
      </LegalSection>

      <LegalSection id="third-party" title="5. Third-Party Cookies">
        <p>
          Some cookies are set by third-party services we integrate with. These third parties have their own privacy and cookie policies:
        </p>
        <div className="space-y-3 pt-1">
          {[
            {
              name: 'Stripe',
              url: 'https://stripe.com/gb/privacy',
              desc: 'Sets cookies for payment security, fraud prevention, and checkout flow management.',
            },
            {
              name: 'Supabase',
              url: 'https://supabase.com/privacy',
              desc: 'Sets authentication session cookies to securely manage your login state.',
            },
            {
              name: 'Vercel',
              url: 'https://vercel.com/legal/privacy-policy',
              desc: 'Sets an anonymous analytics identifier to collect aggregated, non-identifiable usage statistics.',
            },
          ].map(({ name, url, desc }) => (
            <div key={name} className="flex gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0">
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors text-xs font-semibold w-20 shrink-0 pt-0.5">
                {name}
              </a>
              <span className="text-zinc-500 text-xs">{desc}</span>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection id="managing" title="6. Managing Cookies">
        <p><strong className="text-zinc-300">Essential cookies</strong> cannot be disabled without breaking core platform functionality such as authentication and payment processing.</p>
        <p><strong className="text-zinc-300">Functional and analytics cookies</strong> can be managed through your browser settings. Most browsers allow you to:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>View and delete cookies currently stored on your device</li>
          <li>Block third-party cookies</li>
          <li>Block all cookies (note: this will prevent you from logging in)</li>
          <li>Set preferences per website</li>
        </ul>
        <p>Browser-specific instructions for managing cookies:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {[
            { name: 'Chrome', url: 'https://support.google.com/chrome/answer/95647' },
            { name: 'Safari', url: 'https://support.apple.com/en-gb/guide/safari/sfri11471/mac' },
            { name: 'Firefox', url: 'https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox' },
            { name: 'Edge', url: 'https://support.microsoft.com/en-us/windows/manage-cookies-in-microsoft-edge' },
          ].map(({ name, url }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#111111] border border-[#1e1e1e] rounded-xl px-4 py-3 text-center text-xs text-zinc-400 hover:text-[#c9a84c] hover:border-[#c9a84c]/20 transition-colors"
            >
              {name}
            </a>
          ))}
        </div>
        <p className="pt-2">
          To opt out of Vercel Analytics, you can enable the <strong className="text-zinc-300">Do Not Track</strong> (DNT) browser setting. Vercel Analytics respects the DNT header.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="7. Changes to This Policy">
        <p>
          We may update this Cookie Policy to reflect changes in the cookies we use or for operational, legal, or regulatory reasons. We will notify you of significant changes via email or by displaying a notice in the platform. The "Last updated" date at the top of this page reflects when the most recent changes were made.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="8. Contact">
        <p>
          For questions about our use of cookies or to withdraw your consent to non-essential cookies, contact us:
        </p>
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 space-y-1 mt-2">
          <p className="text-zinc-300 font-medium">BarberBoost Ltd</p>
          <a href="mailto:legal@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors text-sm">legal@barberboost.app</a>
        </div>
        <p className="pt-3">
          See also our <Link href="/privacy" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">Privacy Policy</Link> and <Link href="/gdpr" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">GDPR Rights</Link> page.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
