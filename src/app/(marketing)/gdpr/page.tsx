import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalLayout, LegalSection } from '@/components/marketing/LegalLayout'

export const metadata: Metadata = {
  title: 'GDPR Rights — BarberBoost',
  description: "Your data rights under UK GDPR. Learn how to access, correct, delete, or port your data held by BarberBoost.",
}

const TOC = [
  { id: 'overview', label: '1. Overview' },
  { id: 'data-controller', label: '2. Data Controller' },
  { id: 'lawful-bases', label: '3. Lawful Bases' },
  { id: 'your-rights', label: '4. Your Rights' },
  { id: 'submitting-request', label: '5. How to Submit a Request' },
  { id: 'response-process', label: '6. Our Response Process' },
  { id: 'retention', label: '7. Retention Periods' },
  { id: 'transfers', label: '8. International Transfers' },
  { id: 'automated', label: '9. Automated Processing' },
  { id: 'breach', label: '10. Data Breach Notification' },
  { id: 'complaints', label: '11. Complaints' },
]

export default function GdprPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="GDPR RIGHTS"
      intro="BarberBoost is committed to complying with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. This page explains your rights as a data subject and how to exercise them. For the full detail of how we process your data, see our Privacy Policy."
      lastUpdated="26 April 2026"
      toc={TOC}
    >
      <LegalSection id="overview" title="1. Overview">
        <p>
          The UK GDPR gives individuals significant rights over their personal data. These rights apply to data we hold about you as an account holder, user of the platform, or contact who has communicated with us.
        </p>
        <p>
          If you are a client of a barbershop that uses BarberBoost, the barbershop is the data controller for your booking data. You should direct your data rights requests to them. However, if the barbershop requests our assistance in fulfilling a data rights request, we will co-operate fully and promptly.
        </p>
        <p>
          Our full Privacy Policy is available at <Link href="/privacy" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">barberboost.app/privacy</Link>.
        </p>
      </LegalSection>

      <LegalSection id="data-controller" title="2. Data Controller">
        <p>
          For personal data processed in connection with your BarberBoost account and use of the platform, the data controller is:
        </p>
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 space-y-1.5 mt-2">
          <p className="text-zinc-300 font-semibold">BarberBoost Ltd</p>
          <p className="text-zinc-500 text-xs">Registered in England & Wales</p>
          <div className="pt-1 space-y-0.5 text-sm">
            <p>
              <span className="text-zinc-600 text-xs">Data enquiries: </span>
              <a href="mailto:legal@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">legal@barberboost.app</a>
            </p>
            <p>
              <span className="text-zinc-600 text-xs">General: </span>
              <a href="mailto:hello@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">hello@barberboost.app</a>
            </p>
          </div>
        </div>
        <p className="pt-3">
          We have registered with the Information Commissioner's Office (ICO) as required by the Data Protection (Charges and Information) Regulations 2018. Our ICO registration number is available on request.
        </p>
      </LegalSection>

      <LegalSection id="lawful-bases" title="3. Lawful Bases for Processing">
        <p>Every processing activity we carry out has a lawful basis under UK GDPR Article 6. The bases we rely on are:</p>
        <div className="space-y-3 pt-1">
          {[
            {
              basis: 'Contract',
              article: 'Art. 6(1)(b)',
              examples: 'Account creation, billing, service delivery, sending booking notifications on behalf of shops.',
            },
            {
              basis: 'Legitimate Interests',
              article: 'Art. 6(1)(f)',
              examples: 'Platform security, fraud prevention, usage analytics, product improvement, and account-related communications.',
            },
            {
              basis: 'Legal Obligation',
              article: 'Art. 6(1)(c)',
              examples: 'Retaining VAT and billing records for 7 years as required by HMRC; responding to lawful authority requests.',
            },
            {
              basis: 'Consent',
              article: 'Art. 6(1)(a)',
              examples: 'Marketing emails and product newsletters. You may withdraw consent at any time without detriment.',
            },
          ].map(({ basis, article, examples }) => (
            <div key={basis} className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white">{basis}</span>
                <span className="text-[10px] font-mono text-zinc-600 bg-[#1a1a1a] px-2 py-0.5 rounded">{article}</span>
              </div>
              <p className="text-xs text-zinc-500">{examples}</p>
            </div>
          ))}
        </div>
        <p className="pt-2">
          Where we process special category data (we do not currently do so), we would also identify an appropriate condition under UK GDPR Article 9.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="4. Your Rights">
        <p>Under UK GDPR, you have the following rights. These are not absolute — exemptions may apply in limited circumstances, which we will explain if we need to rely on one.</p>

        <div className="space-y-4 pt-2">
          {[
            {
              right: 'Right of Access (Subject Access Request)',
              summary: 'You have the right to obtain a copy of the personal data we hold about you, along with information about how we process it, who we share it with, and how long we keep it.',
              note: 'We will provide your data in a commonly used electronic format. For large or complex requests, we may extend our response time to three months.',
            },
            {
              right: 'Right to Rectification',
              summary: 'If any personal data we hold about you is inaccurate or incomplete, you have the right to have it corrected.',
              note: 'You can update most of your account data directly within Settings → Account without needing to contact us.',
            },
            {
              right: 'Right to Erasure ("Right to be Forgotten")',
              summary: 'You have the right to request deletion of your personal data where: it is no longer necessary for the purpose it was collected; you withdraw consent (where consent was the basis); you successfully object to the processing; or the data was unlawfully processed.',
              note: 'This right is not absolute. We may be unable to delete data that we are legally required to retain (e.g. billing records required by HMRC for 7 years).',
            },
            {
              right: 'Right to Restriction of Processing',
              summary: "You have the right to request that we restrict (pause) the processing of your data while: you contest its accuracy; the processing is unlawful but you prefer restriction to erasure; we no longer need it but you need it for a legal claim; or you've objected and we're assessing the grounds.",
              note: 'During a restriction, we will continue to store your data but not otherwise process it.',
            },
            {
              right: 'Right to Data Portability',
              summary: 'Where processing is based on your consent or contract and carried out by automated means, you have the right to receive your personal data in a structured, commonly used, machine-readable format and to have it transferred to another controller.',
              note: "You can export your data at any time from your BarberBoost dashboard (Clients, Bookings, and Finances pages). For a full account export, contact us.",
            },
            {
              right: 'Right to Object',
              summary: 'You have the right to object to processing based on legitimate interests or for direct marketing at any time. Where you object to direct marketing, we will cease processing immediately. Where you object to legitimate interests processing, we will stop unless we can demonstrate compelling legitimate grounds.',
              note: 'To unsubscribe from marketing emails, use the unsubscribe link in any email or contact legal@barberboost.app.',
            },
            {
              right: 'Rights Related to Automated Decision-Making',
              summary: 'You have the right not to be subject to decisions made solely by automated processing that produce legal or similarly significant effects on you.',
              note: 'BarberBoost does not make decisions about individuals through solely automated means that produce legal or significant effects.',
            },
            {
              right: 'Right to Withdraw Consent',
              summary: 'Where processing is based on consent, you have the right to withdraw it at any time. Withdrawal does not affect the lawfulness of processing carried out before withdrawal.',
              note: 'To withdraw marketing consent, click "Unsubscribe" in any marketing email or contact legal@barberboost.app.',
            },
          ].map(({ right, summary, note }) => (
            <div key={right} className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-semibold text-white">{right}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{summary}</p>
              {note && (
                <p className="text-xs text-zinc-600 border-l-2 border-[#c9a84c]/30 pl-3 italic">{note}</p>
              )}
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection id="submitting-request" title="5. How to Submit a Request">
        <p>To exercise any of your rights, contact us using one of the following methods:</p>
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 space-y-2 mt-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Email (preferred)</p>
          <p>
            <a href="mailto:legal@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">legal@barberboost.app</a>
          </p>
          <p className="text-xs text-zinc-600 pt-1">Subject line: <span className="font-mono">Data Rights Request – [Your Name]</span></p>
        </div>
        <p className="pt-3">To help us process your request efficiently, please include:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Your full name</li>
          <li>The email address associated with your BarberBoost account</li>
          <li>A clear description of the right you wish to exercise</li>
          <li>Any relevant detail that helps us identify the specific data (e.g. date range for a SAR, data to be rectified)</li>
        </ul>
        <p>
          We may need to verify your identity before fulfilling the request. For high-risk requests (such as erasure or full data exports), we may request additional proof of identity to protect your data from unauthorised requests.
        </p>
      </LegalSection>

      <LegalSection id="response-process" title="6. Our Response Process">
        <div className="space-y-3">
          {[
            {
              step: '1',
              label: 'Acknowledgement',
              desc: 'We will acknowledge receipt of your request within 3 business days.',
            },
            {
              step: '2',
              label: 'Identity verification',
              desc: 'Where required, we will request proof of identity. The 1-month clock does not start until we have verified your identity.',
            },
            {
              step: '3',
              label: 'Response',
              desc: 'We will respond fully within 1 calendar month of receiving your verified request. For complex or multiple requests, we may extend this to 3 months and will notify you within the first month.',
            },
            {
              step: '4',
              label: 'No charge',
              desc: "We will not charge a fee unless your request is manifestly unfounded or excessive, in which case we may charge a reasonable administrative fee or refuse to act on the request.",
            },
          ].map(({ step, label, desc }) => (
            <div key={step} className="flex gap-4 py-3 border-b border-[#1a1a1a] last:border-0">
              <div className="w-7 h-7 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center shrink-0 text-[#c9a84c] text-xs font-bold">{step}</div>
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">{label}</p>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection id="retention" title="7. Data Retention Periods">
        <p>We retain personal data for the following periods:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs mt-2 border-collapse">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                <th className="text-left py-2 pr-4 text-zinc-500 font-semibold">Data Category</th>
                <th className="text-left py-2 pr-4 text-zinc-500 font-semibold">Period</th>
                <th className="text-left py-2 text-zinc-500 font-semibold">Legal Basis for Retention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {[
                { category: 'Account & profile data', period: 'Subscription duration + 90 days', basis: 'Contract / post-termination export window' },
                { category: 'Billing & invoice records', period: '7 years', basis: 'Legal obligation (HMRC / VAT Act 1994)' },
                { category: 'Booking & client records', period: 'Subscription duration + 90 days', basis: 'Contract (processor on behalf of shop)' },
                { category: 'Support & communications', period: '3 years', basis: 'Legitimate interests (dispute resolution)' },
                { category: 'Usage & analytics data', period: '2 years', basis: 'Legitimate interests (service improvement)' },
                { category: 'Marketing consent records', period: '3 years from last interaction', basis: 'Legal obligation (ICO guidance on consent records)' },
                { category: 'Security & fraud prevention logs', period: '12 months', basis: 'Legitimate interests (security)' },
              ].map(({ category, period, basis }) => (
                <tr key={category}>
                  <td className="py-2.5 pr-4 text-zinc-300">{category}</td>
                  <td className="py-2.5 pr-4 text-zinc-400 whitespace-nowrap">{period}</td>
                  <td className="py-2.5 text-zinc-500">{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pt-3">
          After the applicable period, data is permanently and securely deleted from all systems, including backups (which are overwritten on a rolling 30-day cycle).
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="8. International Data Transfers">
        <p>
          We use service providers based in the United States and the European Union. All international transfers of personal data from the UK are conducted under appropriate safeguards as required by UK GDPR Chapter V:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs mt-2 border-collapse">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                <th className="text-left py-2 pr-4 text-zinc-500 font-semibold">Processor</th>
                <th className="text-left py-2 pr-4 text-zinc-500 font-semibold">Country</th>
                <th className="text-left py-2 text-zinc-500 font-semibold">Transfer Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {[
                { processor: 'Supabase Inc.', country: 'EU (primary) / USA', mechanism: 'EU adequacy decision; UK-EU Bridge IDTA' },
                { processor: 'Stripe Inc.', country: 'USA / EU', mechanism: 'UK IDTA; Stripe DPA with SCCs' },
                { processor: 'Resend Inc.', country: 'USA', mechanism: 'UK IDTA' },
                { processor: 'Anthropic PBC', country: 'USA', mechanism: 'UK IDTA; transfer impact assessment completed' },
                { processor: 'Vercel Inc.', country: 'USA / EU', mechanism: 'UK IDTA; EU data residency options used where possible' },
              ].map(({ processor, country, mechanism }) => (
                <tr key={processor}>
                  <td className="py-2.5 pr-4 text-zinc-300">{processor}</td>
                  <td className="py-2.5 pr-4 text-zinc-400">{country}</td>
                  <td className="py-2.5 text-zinc-500">{mechanism}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pt-3">
          Transfer impact assessments (TIAs) have been conducted for each processor. Copies of applicable transfer agreements are available on request from{' '}
          <a href="mailto:legal@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">legal@barberboost.app</a>.
        </p>
      </LegalSection>

      <LegalSection id="automated" title="9. Automated Processing & Profiling">
        <p>
          BarberBoost does not make decisions about individuals using solely automated processing that produce legal or similarly significant effects under UK GDPR Article 22.
        </p>
        <p>
          We do use automated processes for operational purposes — such as automatically assigning client tags (New, Regular, VIP, At-risk) based on visit frequency. These tags are informational, visible to the barbershop, and do not prevent you from receiving services or produce any legal effect. You may ask the barbershop to correct or remove any tag at any time.
        </p>
        <p>
          AI-assisted marketing copy generation (via Anthropic Claude) is a tool to assist barbershop owners in drafting content — all final decisions and approvals remain with the human user.
        </p>
      </LegalSection>

      <LegalSection id="breach" title="10. Data Breach Notification">
        <p>
          In the event of a personal data breach, we follow this process:
        </p>
        <div className="space-y-3 pt-1">
          {[
            { timeframe: 'Within 72 hours', action: 'Where a breach is likely to result in a risk to your rights and freedoms, we will notify the Information Commissioner\'s Office (ICO) as required by UK GDPR Article 33.' },
            { timeframe: 'Without undue delay', action: 'Where a breach is likely to result in a high risk to your rights and freedoms, we will notify affected individuals directly, describing the nature of the breach, what data was involved, likely consequences, and steps we are taking to address it.' },
            { timeframe: 'Ongoing', action: 'We maintain an internal breach register as required by UK GDPR Article 33(5). We will co-operate fully with any ICO investigation.' },
          ].map(({ timeframe, action }) => (
            <div key={timeframe} className="flex gap-4 py-3 border-b border-[#1a1a1a] last:border-0">
              <span className="text-[#c9a84c] text-xs font-semibold w-36 shrink-0 pt-0.5">{timeframe}</span>
              <p className="text-xs text-zinc-500 leading-relaxed">{action}</p>
            </div>
          ))}
        </div>
        <p className="pt-2">
          If you believe your personal data has been involved in a breach, contact us immediately at{' '}
          <a href="mailto:legal@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">legal@barberboost.app</a>.
        </p>
      </LegalSection>

      <LegalSection id="complaints" title="11. Complaints to the ICO">
        <p>
          If you are not satisfied with how we have handled your personal data or a data rights request, you have the right to lodge a complaint with the UK supervisory authority:
        </p>
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 space-y-2 mt-2">
          <p className="text-zinc-300 font-semibold">Information Commissioner's Office (ICO)</p>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-zinc-600 text-xs">Website: </span>
              <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">
                ico.org.uk/make-a-complaint
              </a>
            </p>
            <p><span className="text-zinc-600 text-xs">Telephone: </span><span className="text-zinc-400">0303 123 1113</span></p>
            <p><span className="text-zinc-600 text-xs">Post: </span><span className="text-zinc-400">Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF</span></p>
          </div>
        </div>
        <p className="pt-3">
          We ask that you contact us first at{' '}
          <a href="mailto:legal@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">legal@barberboost.app</a>{' '}
          so that we have the opportunity to resolve your concern before you escalate to the ICO. We aim to resolve all data-related complaints within 30 days.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
