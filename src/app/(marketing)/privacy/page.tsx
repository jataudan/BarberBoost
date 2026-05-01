import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalLayout, LegalSection } from '@/components/marketing/LegalLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy — BarberBoost',
  description: 'How BarberBoost collects, uses, and protects your personal data. UK GDPR compliant.',
}

const TOC = [
  { id: 'who-we-are', label: '1. Who We Are' },
  { id: 'what-we-collect', label: '2. What We Collect' },
  { id: 'how-we-use', label: '3. How We Use Your Data' },
  { id: 'legal-basis', label: '4. Legal Basis' },
  { id: 'data-sharing', label: '5. Data Sharing' },
  { id: 'international-transfers', label: '6. International Transfers' },
  { id: 'retention', label: '7. Data Retention' },
  { id: 'your-rights', label: '8. Your Rights' },
  { id: 'security', label: '9. Security' },
  { id: 'children', label: '10. Children' },
  { id: 'changes', label: '11. Changes' },
  { id: 'contact', label: '12. Contact & Complaints' },
]

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="PRIVACY POLICY"
      intro="This policy explains what personal data BarberBoost Ltd collects, why we collect it, and what rights you have over it. We are committed to protecting your privacy and complying with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018."
      lastUpdated="26 April 2026"
      toc={TOC}
    >
      <LegalSection id="who-we-are" title="1. Who We Are">
        <p>
          <strong className="text-zinc-300">BarberBoost Ltd</strong> ("BarberBoost", "we", "us", or "our") is the data controller for personal data collected through our platform at barberboost.app. We are registered in England & Wales.
        </p>
        <p>
          For data protection enquiries, contact us at{' '}
          <a href="mailto:legal@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">legal@barberboost.app</a>.
        </p>
        <p>
          Where BarberBoost processes personal data on behalf of a barbershop (for example, a shop's client booking records), the barbershop is the data controller and BarberBoost acts as a data processor. Our obligations as a processor are set out in our Data Processing Agreement, which forms part of these terms.
        </p>
      </LegalSection>

      <LegalSection id="what-we-collect" title="2. What We Collect">
        <p><strong className="text-zinc-300">Account holders (barbershop owners and staff):</strong></p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Identity data: name, email address, hashed password</li>
          <li>Business data: shop name, address, phone number, logo, services, pricing, working hours</li>
          <li>Billing data: name, billing address, card type and last four digits (full card data is held by Stripe, not us)</li>
          <li>Usage data: pages visited, features used, actions taken, session timestamps, IP address, browser type, and device information</li>
          <li>Communications: emails and messages you send to our support team or via the contact form</li>
        </ul>
        <p className="pt-2"><strong className="text-zinc-300">End clients (clients of barbershops using BarberBoost):</strong></p>
        <p>
          Client data — including names, phone numbers, email addresses, and booking history — is entered into BarberBoost by barbershop operators. We process this data as a data processor on behalf of the barbershop. If you are a client of a barbershop and wish to exercise your data rights, you should contact that barbershop directly. We will assist barbershops in fulfilling their data obligations.
        </p>
      </LegalSection>

      <LegalSection id="how-we-use" title="3. How We Use Your Data">
        <p>We use the personal data we collect to:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Create and manage your account and provide the BarberBoost service</li>
          <li>Process subscription payments and issue VAT invoices</li>
          <li>Send booking confirmations, reminders, and cancellation notifications on behalf of barbershops</li>
          <li>Respond to support requests and troubleshoot issues</li>
          <li>Monitor platform security, detect fraud, and prevent misuse</li>
          <li>Analyse usage patterns to improve the platform and fix bugs</li>
          <li>Send product updates, new feature announcements, and newsletters (only where you have given consent or we have a legitimate interest)</li>
          <li>Comply with legal and regulatory obligations, including tax record-keeping</li>
        </ul>
      </LegalSection>

      <LegalSection id="legal-basis" title="4. Legal Basis for Processing">
        <p>We process your personal data on the following legal bases under UK GDPR Article 6:</p>
        <div className="space-y-3 pt-1">
          {[
            {
              basis: 'Contract (Article 6(1)(b))',
              use: 'Processing necessary to deliver the BarberBoost service, including account management, billing, and sending booking notifications on behalf of barbershops.',
            },
            {
              basis: 'Legitimate Interests (Article 6(1)(f))',
              use: 'Security monitoring, fraud prevention, platform analytics, service improvement, and sending transactional communications related to your account. Our legitimate interests do not override your rights where your interests or fundamental rights take precedence.',
            },
            {
              basis: 'Legal Obligation (Article 6(1)(c))',
              use: 'Retaining billing and VAT records as required by HMRC; responding to lawful requests from public authorities.',
            },
            {
              basis: 'Consent (Article 6(1)(a))',
              use: 'Sending marketing emails and newsletters. You may withdraw consent at any time by clicking "Unsubscribe" in any marketing email or contacting us at legal@barberboost.app.',
            },
          ].map(({ basis, use }) => (
            <div key={basis} className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-[#c9a84c]">{basis}</p>
              <p className="text-zinc-500">{use}</p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection id="data-sharing" title="5. Data Sharing">
        <p>
          We do not sell your personal data. We do not share it with third parties for their own marketing purposes. We share data only with the following categories of recipient, each acting as a data processor under our instructions:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs mt-2 border-collapse">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                <th className="text-left py-2 pr-4 text-zinc-500 font-semibold">Processor</th>
                <th className="text-left py-2 pr-4 text-zinc-500 font-semibold">Purpose</th>
                <th className="text-left py-2 text-zinc-500 font-semibold">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {[
                { name: 'Stripe Inc.', purpose: 'Payment processing and subscription billing', location: 'USA / EU' },
                { name: 'Supabase Inc.', purpose: 'Database hosting, authentication, and file storage', location: 'EU (primary)' },
                { name: 'Resend Inc.', purpose: 'Transactional email delivery', location: 'USA' },
                { name: 'Anthropic PBC', purpose: 'AI-powered marketing copy generation (only when feature is used)', location: 'USA' },
                { name: 'Vercel Inc.', purpose: 'Web application hosting and content delivery', location: 'USA / EU' },
              ].map(({ name, purpose, location }) => (
                <tr key={name}>
                  <td className="py-2.5 pr-4 text-zinc-300 font-medium">{name}</td>
                  <td className="py-2.5 pr-4 text-zinc-500">{purpose}</td>
                  <td className="py-2.5 text-zinc-500">{location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pt-2">
          We may also disclose personal data where required by law, a court order, or a lawful request from a regulatory authority.
        </p>
      </LegalSection>

      <LegalSection id="international-transfers" title="6. International Data Transfers">
        <p>
          Some of our processors are based outside the UK, including in the United States. We ensure that any transfer of personal data outside the UK is subject to appropriate safeguards in accordance with UK GDPR Chapter V, including:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>UK International Data Transfer Agreements (IDTA) with processors where applicable</li>
          <li>Adequacy regulations in respect of countries recognised by the UK Secretary of State</li>
          <li>UK addendum to the EU Standard Contractual Clauses where applicable</li>
        </ul>
        <p>
          We have conducted transfer impact assessments for each international processor. Copies of applicable transfer mechanisms are available on request by contacting{' '}
          <a href="mailto:legal@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">legal@barberboost.app</a>.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="7. Data Retention">
        <p>We retain personal data only for as long as necessary for the purposes set out in this policy:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs mt-2 border-collapse">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                <th className="text-left py-2 pr-4 text-zinc-500 font-semibold">Data Type</th>
                <th className="text-left py-2 pr-4 text-zinc-500 font-semibold">Retention Period</th>
                <th className="text-left py-2 text-zinc-500 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {[
                { type: 'Account & business data', period: 'Duration of subscription + 90 days', reason: 'Service delivery; post-cancellation data export window' },
                { type: 'Billing & invoice records', period: '7 years from transaction date', reason: 'HMRC statutory requirement' },
                { type: 'Booking & client data', period: 'Duration of subscription + 90 days', reason: 'Service delivery on behalf of barbershop' },
                { type: 'Support communications', period: '3 years', reason: 'Legitimate interests (dispute resolution)' },
                { type: 'Usage & analytics data', period: '2 years', reason: 'Service improvement and security' },
                { type: 'Marketing consent records', period: '3 years from last interaction', reason: 'Demonstrating compliance' },
              ].map(({ type, period, reason }) => (
                <tr key={type}>
                  <td className="py-2.5 pr-4 text-zinc-300">{type}</td>
                  <td className="py-2.5 pr-4 text-zinc-400">{period}</td>
                  <td className="py-2.5 text-zinc-500">{reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pt-2">
          After the applicable retention period, data is securely and permanently deleted. You may request early deletion of your data — see Your Rights below.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="8. Your Rights">
        <p>Under UK GDPR, you have the following rights regarding your personal data. To exercise any of these rights, see the{' '}
          <Link href="/gdpr" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">GDPR Rights page</Link> or contact us at{' '}
          <a href="mailto:legal@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">legal@barberboost.app</a>.
        </p>
        <div className="space-y-2 pt-1">
          {[
            { right: 'Right of Access', desc: 'Obtain a copy of the personal data we hold about you.' },
            { right: 'Right to Rectification', desc: 'Have inaccurate or incomplete data corrected.' },
            { right: 'Right to Erasure', desc: 'Request deletion of your data where there is no legitimate reason for us to continue processing it.' },
            { right: 'Right to Restriction', desc: 'Request that we limit the processing of your data while a dispute is resolved.' },
            { right: 'Right to Portability', desc: 'Receive your data in a structured, commonly used, machine-readable format.' },
            { right: 'Right to Object', desc: 'Object to processing based on legitimate interests, or to direct marketing at any time.' },
            { right: 'Automated Decision-Making', desc: 'Not be subject to decisions made solely by automated processing that significantly affect you.' },
          ].map(({ right, desc }) => (
            <div key={right} className="flex gap-3 py-2 border-b border-[#1a1a1a] last:border-0">
              <span className="text-[#c9a84c] text-xs font-semibold w-40 shrink-0 pt-0.5">{right}</span>
              <span className="text-zinc-500 text-xs">{desc}</span>
            </div>
          ))}
        </div>
        <p className="pt-2">
          We respond to all requests within <strong className="text-zinc-300">one calendar month</strong>. For complex or numerous requests, we may extend this to three months and will notify you accordingly. There is no fee for exercising your rights unless a request is manifestly unfounded or excessive.
        </p>
      </LegalSection>

      <LegalSection id="security" title="9. Security">
        <p>
          We take the security of your personal data seriously. Our technical and organisational measures include:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>TLS 1.2+ encryption for all data in transit</li>
          <li>AES-256 encryption for data at rest</li>
          <li>Bcrypt hashing for passwords (never stored in plain text)</li>
          <li>Row-level security (RLS) policies on our database to prevent unauthorised data access</li>
          <li>Role-based access controls for staff accounts</li>
          <li>Regular security updates and dependency patching</li>
          <li>Infrastructure hosted on Supabase, which maintains SOC 2 Type II certification</li>
        </ul>
        <p>
          In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, we will notify the ICO within 72 hours and affected individuals without undue delay, as required by UK GDPR Article 33–34.
        </p>
      </LegalSection>

      <LegalSection id="children" title="10. Children's Privacy">
        <p>
          BarberBoost is a business-to-business service intended for use by adults aged 18 and over. We do not knowingly collect personal data from children under 18. If you believe a child has provided personal data to us, please contact{' '}
          <a href="mailto:legal@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">legal@barberboost.app</a> and we will delete it promptly.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="11. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Sending an email to the address associated with your account</li>
          <li>Displaying a prominent notice within the BarberBoost dashboard</li>
        </ul>
        <p>
          Changes take effect 30 days after notification. Your continued use of BarberBoost after that date constitutes acceptance of the revised policy. The "Last updated" date at the top of this page reflects when the most recent changes were made.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="12. Contact & Complaints">
        <p>
          For any privacy-related questions, subject access requests, or to exercise your rights, contact our data protection team:
        </p>
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 space-y-1 mt-2">
          <p className="text-zinc-300 font-medium">BarberBoost Ltd</p>
          <p className="text-zinc-500">Registered in England & Wales</p>
          <p>
            <a href="mailto:legal@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">legal@barberboost.app</a>
          </p>
        </div>
        <p className="pt-3">
          If you are unhappy with how we have handled your personal data, you have the right to lodge a complaint with the{' '}
          <strong className="text-zinc-300">Information Commissioner's Office (ICO)</strong>, the UK supervisory authority for data protection:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Website: <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">ico.org.uk/make-a-complaint</a></li>
          <li>Telephone: 0303 123 1113</li>
          <li>Post: Information Commissioner's Office, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF</li>
        </ul>
        <p>
          We ask that you contact us first so we can try to resolve your concern before you contact the ICO.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
