import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalLayout, LegalSection } from '@/components/marketing/LegalLayout'

export const metadata: Metadata = {
  title: 'Terms of Service — BarberBoost',
  description: 'BarberBoost Terms of Service. Read about your rights, our obligations, subscription terms, and acceptable use.',
}

const TOC = [
  { id: 'agreement', label: '1. Agreement to Terms' },
  { id: 'services', label: '2. Our Services' },
  { id: 'accounts', label: '3. Accounts' },
  { id: 'billing', label: '4. Subscription & Billing' },
  { id: 'free-plan', label: '5. Free Plan' },
  { id: 'acceptable-use', label: '6. Acceptable Use' },
  { id: 'intellectual-property', label: '7. Intellectual Property' },
  { id: 'data-privacy', label: '8. Data & Privacy' },
  { id: 'availability', label: '9. Service Availability' },
  { id: 'liability', label: '10. Limitation of Liability' },
  { id: 'indemnification', label: '11. Indemnification' },
  { id: 'termination', label: '12. Termination' },
  { id: 'general', label: '13. General' },
  { id: 'contact', label: '14. Contact' },
]

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="TERMS OF SERVICE"
      intro="These Terms of Service ('Terms') govern your access to and use of BarberBoost. By creating an account or using the service, you agree to be bound by these Terms and our Privacy Policy. Please read them carefully."
      lastUpdated="26 April 2026"
      toc={TOC}
    >
      <LegalSection id="agreement" title="1. Agreement to Terms">
        <p>
          These Terms of Service constitute a legally binding agreement between you (the account holder) and <strong className="text-zinc-300">BarberBoost Ltd</strong>, a company registered in England & Wales ("BarberBoost", "we", "us", or "our").
        </p>
        <p>
          By registering for an account, accessing, or using the BarberBoost platform, you confirm that you have read, understood, and agree to these Terms. If you do not agree, you must not use the service.
        </p>
        <p>
          Where you are using BarberBoost on behalf of a business, you represent that you have authority to bind that business to these Terms.
        </p>
      </LegalSection>

      <LegalSection id="services" title="2. Our Services">
        <p>
          BarberBoost provides a cloud-based barbershop management platform that may include, depending on your subscription plan:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Online booking system and public-facing booking page</li>
          <li>Client database and management</li>
          <li>Staff scheduling and working hours management</li>
          <li>Service menu configuration</li>
          <li>Automated booking confirmations and reminders</li>
          <li>Marketing campaign tools with AI-assisted copywriting</li>
          <li>Inventory management</li>
          <li>Business analytics and reporting</li>
          <li>Stripe-powered subscription billing management</li>
          <li>REST API access (Empire plan only)</li>
        </ul>
        <p>
          We reserve the right to modify, add, or remove features at any time. We will provide reasonable notice of material changes that affect your use of the service.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="3. Accounts">
        <p>
          To use BarberBoost, you must create an account. You agree to:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Be at least 18 years of age</li>
          <li>Provide accurate, current, and complete information during registration</li>
          <li>Keep your account credentials confidential and not share them with unauthorised parties</li>
          <li>Notify us immediately at <a href="mailto:hello@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">hello@barberboost.app</a> if you suspect unauthorised use of your account</li>
          <li>Be responsible for all activity that occurs under your account</li>
        </ul>
        <p>
          One BarberBoost account corresponds to one barbershop location, except on the Empire plan which supports multiple locations under a single account.
        </p>
      </LegalSection>

      <LegalSection id="billing" title="4. Subscription & Billing">
        <p><strong className="text-zinc-300">Plans and Pricing</strong></p>
        <p>
          BarberBoost is available on the following paid plans (prices exclusive of VAT at the current UK rate of 20%):
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs mt-2 border-collapse">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                <th className="text-left py-2 pr-4 text-zinc-500 font-semibold">Plan</th>
                <th className="text-left py-2 pr-4 text-zinc-500 font-semibold">Monthly</th>
                <th className="text-left py-2 text-zinc-500 font-semibold">Annual (2 months free)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {[
                { plan: 'Starter', monthly: '£19/mo', annual: '£190/yr' },
                { plan: 'Pro', monthly: '£39/mo', annual: '£390/yr' },
                { plan: 'Empire', monthly: '£79/mo', annual: '£790/yr' },
              ].map(({ plan, monthly, annual }) => (
                <tr key={plan}>
                  <td className="py-2.5 pr-4 text-zinc-300 font-medium">{plan}</td>
                  <td className="py-2.5 pr-4 text-zinc-400">{monthly}</td>
                  <td className="py-2.5 text-zinc-400">{annual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pt-2">We reserve the right to change pricing with 30 days' notice. Changes will not apply until your next billing cycle.</p>

        <p className="pt-2"><strong className="text-zinc-300">Payment</strong></p>
        <p>
          All payments are processed by Stripe. By subscribing, you authorise BarberBoost to charge the payment method you provide on a recurring basis. Subscriptions renew automatically at the end of each billing period unless cancelled before the renewal date.
        </p>

        <p className="pt-2"><strong className="text-zinc-300">Upgrades and Downgrades</strong></p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Upgrades take effect immediately. You will be charged a prorated amount for the remainder of the current billing period.</li>
          <li>Downgrades take effect at the start of the next billing cycle. Your current plan's features remain available until then.</li>
        </ul>

        <p className="pt-2"><strong className="text-zinc-300">Money-Back Guarantee</strong></p>
        <p>
          If you are not satisfied with BarberBoost, you may request a full refund within <strong className="text-zinc-300">14 days</strong> of your first paid subscription. This applies to first-time paid subscriptions only. For annual plans, a pro-rata refund is available within 30 days of the annual payment. Contact us at{' '}
          <a href="mailto:hello@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">hello@barberboost.app</a> to request a refund.
        </p>

        <p className="pt-2"><strong className="text-zinc-300">Late Payment</strong></p>
        <p>
          If a payment fails, we will retry the charge and notify you by email. Accounts with outstanding balances may be suspended until payment is resolved. After 14 days of non-payment, we reserve the right to downgrade your account to the Free plan or terminate access.
        </p>

        <p className="pt-2"><strong className="text-zinc-300">VAT</strong></p>
        <p>
          All prices are exclusive of UK VAT. VAT at the prevailing rate will be added at checkout. VAT invoices are automatically generated and available in your billing settings.
        </p>
      </LegalSection>

      <LegalSection id="free-plan" title="5. Free Plan">
        <p>
          BarberBoost offers a permanently free plan with the following limitations: up to 30 bookings per month, 50 client profiles, 1 staff member, and 5 services. The free plan does not include automated reminders, marketing campaigns, advanced analytics, or inventory features.
        </p>
        <p>
          We reserve the right to modify or discontinue the free plan at any time with 60 days' notice. If we discontinue the free plan, current free plan users will be given the option to upgrade to a paid plan or export their data before access ends.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="6. Acceptable Use">
        <p>You agree not to use BarberBoost to:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Violate any applicable law, regulation, or third-party right</li>
          <li>Send unsolicited, misleading, or spam communications to clients</li>
          <li>Upload or transmit malicious code, viruses, or any software intended to damage or disrupt our systems</li>
          <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of the platform</li>
          <li>Resell, sublicense, or provide access to the platform to third parties without our written consent</li>
          <li>Use the platform to process or store data in violation of applicable data protection laws</li>
          <li>Attempt to gain unauthorised access to other users' accounts or BarberBoost's systems</li>
          <li>Scrape or systematically harvest data from the platform without our prior written consent</li>
          <li>Use the platform in any way that could damage our reputation or that of BarberBoost</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate access to any account found to be in violation of these acceptable use rules, without prior notice.
        </p>
      </LegalSection>

      <LegalSection id="intellectual-property" title="7. Intellectual Property">
        <p>
          <strong className="text-zinc-300">Our property:</strong> BarberBoost owns all intellectual property rights in the platform, including but not limited to software, design, trademarks, logos, and content created by BarberBoost. These Terms do not grant you any rights to use our intellectual property except as necessary to use the service.
        </p>
        <p>
          <strong className="text-zinc-300">Your data:</strong> You retain ownership of all data you input into BarberBoost, including your business information, client records, and booking data ("Your Data"). You grant BarberBoost a limited, non-exclusive licence to store, process, and use Your Data solely to provide and improve the service.
        </p>
        <p>
          <strong className="text-zinc-300">Feedback:</strong> If you provide suggestions, ideas, or feedback about BarberBoost, you grant us a perpetual, royalty-free licence to use that feedback to improve the service without any obligation to you.
        </p>
      </LegalSection>

      <LegalSection id="data-privacy" title="8. Data & Privacy">
        <p>
          Your use of BarberBoost is also governed by our{' '}
          <Link href="/privacy" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">Privacy Policy</Link>, which is incorporated into these Terms by reference.
        </p>
        <p>
          Where you use BarberBoost to process personal data relating to your clients, you act as the data controller and BarberBoost acts as a data processor. Our Data Processing Agreement (DPA), which forms part of these Terms, sets out the responsibilities and obligations of each party under UK GDPR. By accepting these Terms, you also accept the DPA. A copy is available on request from{' '}
          <a href="mailto:legal@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">legal@barberboost.app</a>.
        </p>
        <p>
          You are responsible for ensuring that any personal data you input into BarberBoost is collected and processed in accordance with applicable data protection law, including obtaining any necessary consents from your clients.
        </p>
      </LegalSection>

      <LegalSection id="availability" title="9. Service Availability">
        <p>
          We aim to provide a reliable, high-availability service. However, we do not guarantee that BarberBoost will be available at all times, error-free, or uninterrupted. Planned maintenance will be communicated in advance where possible.
        </p>
        <p>
          We target 99.9% monthly uptime. You can view current and historical system status at{' '}
          <Link href="/status" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">barberboost.app/status</Link>.
        </p>
        <p>
          We are not responsible for any loss or damage arising from service interruptions caused by factors outside our reasonable control, including third-party service failures, internet outages, or force majeure events.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="10. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>BarberBoost provides the service "as is" and "as available" without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
          <li>BarberBoost shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, loss of revenue, loss of data, or loss of business opportunity</li>
          <li>Our total aggregate liability to you arising out of or relating to these Terms or the service shall not exceed the greater of: (a) the total subscription fees paid by you to BarberBoost in the 12 months immediately preceding the event giving rise to the claim, or (b) £100</li>
        </ul>
        <p>
          Nothing in these Terms excludes or limits our liability for death or personal injury caused by our negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be excluded or limited under applicable law.
        </p>
      </LegalSection>

      <LegalSection id="indemnification" title="11. Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless BarberBoost and its officers, directors, employees, and agents from and against any claims, liabilities, damages, judgments, awards, costs, and expenses (including reasonable legal fees) arising out of or relating to:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Your breach of these Terms</li>
          <li>Your use of the service in violation of applicable law</li>
          <li>Your infringement of any third-party right, including intellectual property rights or privacy rights</li>
          <li>Any claim by your clients relating to data you have stored in BarberBoost</li>
        </ul>
      </LegalSection>

      <LegalSection id="termination" title="12. Termination">
        <p><strong className="text-zinc-300">By you:</strong> You may cancel your subscription at any time from Settings → Billing. Cancellation takes effect at the end of your current billing period. No partial refunds are issued for the remaining period except under the money-back guarantee set out in Section 4.</p>
        <p>
          <strong className="text-zinc-300">By us:</strong> We may suspend or terminate your account immediately and without notice if:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>You breach these Terms in a material way</li>
          <li>You fail to pay any amount due and do not remedy the non-payment within 14 days of notice</li>
          <li>We are required to do so by law or a competent authority</li>
          <li>Continuing to provide the service would expose BarberBoost to legal, reputational, or technical risk</li>
        </ul>
        <p>
          <strong className="text-zinc-300">Effect of termination:</strong> Upon termination, your right to access the service ceases immediately. Your data will be retained for 90 days after termination during which you may export it. After 90 days, all data is permanently deleted.
        </p>
      </LegalSection>

      <LegalSection id="general" title="13. General">
        <p><strong className="text-zinc-300">Governing Law:</strong> These Terms are governed by and construed in accordance with the laws of England and Wales. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
        <p><strong className="text-zinc-300">Entire Agreement:</strong> These Terms, together with the Privacy Policy, Cookie Policy, and any Data Processing Agreement, constitute the entire agreement between you and BarberBoost and supersede all prior agreements or representations.</p>
        <p><strong className="text-zinc-300">Severability:</strong> If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions continue in full force and effect.</p>
        <p><strong className="text-zinc-300">No Waiver:</strong> Our failure to enforce any provision of these Terms shall not be treated as a waiver of that provision or our right to enforce it in the future.</p>
        <p><strong className="text-zinc-300">Assignment:</strong> You may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may assign our rights and obligations to any successor business.</p>
        <p><strong className="text-zinc-300">Changes to Terms:</strong> We may update these Terms from time to time. We will notify you of material changes by email or in-app notification at least 30 days before they take effect. Continued use after the effective date constitutes acceptance.</p>
      </LegalSection>

      <LegalSection id="contact" title="14. Contact">
        <p>For any questions about these Terms, please contact us:</p>
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 space-y-1 mt-2">
          <p className="text-zinc-300 font-medium">BarberBoost Ltd</p>
          <p className="text-zinc-500">Registered in England & Wales</p>
          <p>
            <a href="mailto:legal@barberboost.app" className="text-[#c9a84c] hover:text-[#e2bf6a] transition-colors">legal@barberboost.app</a>
          </p>
        </div>
      </LegalSection>
    </LegalLayout>
  )
}
