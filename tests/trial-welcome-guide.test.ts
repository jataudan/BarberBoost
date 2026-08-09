import { describe, it, expect } from 'vitest'
import { trialWelcome } from '@/lib/email/templates'

const base = {
  shopName: 'Fade Kings',
  ownerName: 'Sam',
  dashboardUrl: 'https://barberboost.app/dashboard',
  unsubscribeUrl: 'https://barberboost.app/api/email/unsubscribe?shop=shop-1',
  bookingPageUrl: 'https://barberboost.app/booking/fade-kings',
}

describe('trialWelcome (day-0 setup guide)', () => {
  it('shows all steps outstanding, "CONTINUE SETUP" CTA, and the guide subject when nothing is done', () => {
    const tmpl = trialWelcome({
      ...base,
      steps: [
        { label: 'Add your services', href: 'https://barberboost.app/services', done: false },
        { label: 'Add a barber', href: 'https://barberboost.app/staff', done: false },
        { label: 'Set your opening hours', href: 'https://barberboost.app/settings/shop', done: false },
      ],
    })
    expect(tmpl.subject).toContain('setup guide')
    expect(tmpl.html).toContain('CONTINUE SETUP')
    expect(tmpl.html).toContain('Add your services')
    expect(tmpl.html).toContain('https://barberboost.app/services')
    expect(tmpl.html).toContain(base.bookingPageUrl)
    expect(tmpl.html).toContain('Unsubscribe from these emails') // nurture shell, not the transactional one
  })

  it('marks completed steps done, hides their link, and switches CTA once everything is finished', () => {
    const tmpl = trialWelcome({
      ...base,
      steps: [
        { label: 'Add your services', href: 'https://barberboost.app/services', done: true },
        { label: 'Add a barber', href: 'https://barberboost.app/staff', done: true },
        { label: 'Set your opening hours', href: 'https://barberboost.app/settings/shop', done: true },
      ],
    })
    expect(tmpl.html).not.toContain('CONTINUE SETUP')
    expect(tmpl.html).toContain('GO TO MY DASHBOARD')
    expect(tmpl.html).not.toContain('https://barberboost.app/staff') // done steps don't render their link
    expect(tmpl.text).toContain('[done] Add your services')
  })

  it('escapes shop/owner names in the HTML output', () => {
    const tmpl = trialWelcome({
      ...base,
      shopName: '<script>alert(1)</script>',
      steps: [{ label: 'Add your services', href: 'https://barberboost.app/services', done: false }],
    })
    expect(tmpl.html).not.toContain('<script>alert(1)</script>')
  })
})
