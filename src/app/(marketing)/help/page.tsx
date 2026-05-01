import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BookOpen, Calendar, Users, CreditCard, Wrench, ArrowRight,
  CheckCircle, Clock, Globe, Scissors, BarChart2, Bell,
  RefreshCw, Hash, Mail, Shield, Smartphone, ChevronRight,
} from 'lucide-react'
import { FAQ } from '@/components/marketing/FAQ'

export const metadata: Metadata = {
  title: 'Help Centre — BarberBoost',
  description: 'Step-by-step setup guide, daily workflow tips, and answers to common questions about BarberBoost.',
}

// ── Category nav ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { icon: BookOpen,   label: 'Setup Guide',        href: '#setup-guide',    description: 'Get your shop live in under 30 minutes' },
  { icon: Calendar,  label: 'Bookings & Clients',  href: '#bookings-faq',   description: 'Managing appointments and your client database' },
  { icon: Users,     label: 'Staff & Services',    href: '#staff',          description: 'Adding barbers, setting hours, and services' },
  { icon: CreditCard, label: 'Billing & Plans',    href: '#billing',        description: 'Subscriptions, invoices, and upgrades' },
  { icon: Wrench,    label: 'Technical',            href: '#technical',      description: 'Data, browsers, security, and exports' },
]

// ── Setup guide steps ─────────────────────────────────────────────────────────
const SETUP_STEPS = [
  {
    number: '01',
    title: 'Complete your shop profile',
    description: 'Go to Settings → Shop Profile and fill in your shop name, address, phone number, and currency. This information appears on client confirmation emails and your public booking page — so make sure it\'s accurate.',
    tips: [
      'Upload a logo and cover photo to make your booking page look professional',
      'Add your Instagram handle so clients can find you',
      'Set your timezone to ensure booking times are correct',
    ],
  },
  {
    number: '02',
    title: 'Add your services',
    description: 'Go to Services → Add Service. Create each service you offer with a name, duration, price, and category. Colour-code them to make your calendar easier to read at a glance.',
    tips: [
      'Start with your 5–10 most popular services — you can add more later',
      'Use categories (Haircut, Beard, Colour) to group services on your booking page',
      'Set realistic durations — add 5 min buffer time for cleaning between clients',
    ],
  },
  {
    number: '03',
    title: 'Add your staff',
    description: 'Go to Staff → Add Staff. Add yourself first, then your team. Set each barber\'s colour so their bookings are visually distinct in the calendar.',
    tips: [
      'Assign each barber only the services they actually perform',
      'Set working hours per barber, not just for the shop — this controls availability',
      'The Free plan supports 1 staff member; upgrade for a larger team',
    ],
  },
  {
    number: '04',
    title: 'Configure working hours',
    description: 'Go to Staff → select a barber → Working Hours. Set their start and end times for each day of the week and toggle off their days off. These hours directly control which time slots appear on your public booking page.',
    tips: [
      'Double-check each barber\'s hours before sharing your booking page',
      'Mark public holidays as days off in advance so clients can\'t book them',
      'You can temporarily close a specific day by toggling it off',
    ],
  },
  {
    number: '05',
    title: 'Customise your booking page',
    description: 'Go to Settings → Booking Page. Choose your public URL (e.g. barberboost.app/book/your-shop), write a welcome message, and select which services are bookable online. This is the link you share with clients.',
    tips: [
      'Put your booking link in your Instagram bio and Google Business profile',
      'Write a welcome message that sets the tone — keep it short and friendly',
      'You can hide services from the public page without deleting them',
    ],
  },
  {
    number: '06',
    title: 'Take your first booking',
    description: 'Click New Booking on the Bookings page. Select or create a client, choose a service, pick an available slot, and confirm. The client will receive an automated confirmation email with their booking reference number.',
    tips: [
      'Test with your own email first to check the confirmation email looks right',
      'Booking references (e.g. BB-A3F91C2B) are shown in the list and emailed to clients — they can quote this if they need to contact you',
      'Share your booking link and let clients book themselves from day one',
    ],
  },
]

// ── Daily use cards ────────────────────────────────────────────────────────────
const DAILY_STEPS = [
  {
    icon: Clock,
    time: 'Start of day',
    title: 'Check your schedule',
    points: [
      'Open Bookings → Day View to see today\'s full schedule',
      'Switch barbers using the staff filter to check each chair',
      'Any pending bookings? Approve or action them before clients arrive',
    ],
  },
  {
    icon: Calendar,
    time: 'During the day',
    title: 'Manage live bookings',
    points: [
      'Click a booking row to open the detail panel — see full client info, contact details, and notes',
      'Mark bookings as Complete after each appointment to keep your records clean',
      'Need to edit client details? Use the Edit button in the booking detail modal',
    ],
  },
  {
    icon: Hash,
    time: 'Handling enquiries',
    title: 'Look up bookings fast',
    points: [
      'Use the search bar on the Bookings page to find a client by name',
      'Clients can quote their BB- reference number — paste it into search to pull up the exact booking instantly',
      'Phone enquiries? Search the client name or number directly',
    ],
  },
  {
    icon: BarChart2,
    time: 'End of day',
    title: 'Review and close out',
    points: [
      'Mark any completed appointments that weren\'t updated during the day',
      'Record no-shows so your client attendance history stays accurate',
      'Check tomorrow\'s bookings so you\'re prepared for the morning',
    ],
  },
]

// ── Maintenance tips ───────────────────────────────────────────────────────────
const MAINTENANCE = [
  {
    icon: Users,
    title: 'Keep client records clean',
    description: 'Review your client list monthly. Merge any duplicate records (same client booked twice with slightly different names). Add notes to regular clients — preferred style, sensitivities — so every barber is prepared.',
  },
  {
    icon: Bell,
    title: 'Monitor low-stock alerts',
    description: 'If you use the inventory feature (Pro and Empire plans), set low-stock thresholds for your products. BarberBoost will email you automatically when stock falls below the threshold so you\'re never caught out.',
  },
  {
    icon: BarChart2,
    title: 'Review analytics weekly',
    description: 'Check your revenue, peak hours, and top services once a week on the Analytics page. Use this to decide opening hours, staffing, and which services to promote. Your busiest slot is your most valuable product.',
  },
  {
    icon: RefreshCw,
    title: 'Audit services quarterly',
    description: 'Every few months, go to Services and deactivate anything you no longer offer. Update prices to match your current rates. Keeping your service list accurate prevents confusion for new clients booking online.',
  },
  {
    icon: Shield,
    title: 'Check email deliverability',
    description: 'Occasionally ask a client whether they received their confirmation. If they didn\'t, check your spam folder and verify your sender domain is configured correctly in your email settings. Good deliverability protects your no-show rate.',
  },
  {
    icon: Smartphone,
    title: 'Test your booking page',
    description: 'Once a month, visit your own public booking page on a mobile device and make a test booking through to completion. This catches any issues before your clients experience them.',
  },
]

// ── Enhanced FAQ content ──────────────────────────────────────────────────────
const GETTING_STARTED = [
  {
    question: 'How long does setup take?',
    answer: 'Most shops are fully set up in under 30 minutes. The essentials are: add a service, add a staff member with working hours, and your booking page is ready to share. You can add more services, staff, and customisation over time. Follow the six steps in the Setup Guide above.',
  },
  {
    question: 'How do I create my first booking?',
    answer: 'Go to Bookings in the dashboard and click "New Booking". Select the client (or create one on the spot), choose the service, pick an available time slot, and confirm. The client will receive a confirmation email with their unique booking reference (e.g. BB-A3F91C2B) automatically.',
  },
  {
    question: 'How do I set up my public booking page?',
    answer: 'Head to Settings → Booking Page. Choose a memorable URL slug (e.g. barberboost.app/book/kings-cuts), upload a cover photo, and write a welcome message. Select which services are bookable online, then share the link anywhere clients find you — Instagram bio, Google Business, WhatsApp.',
  },
  {
    question: 'How do I add my services?',
    answer: 'Go to Services and click "Add Service". Enter the name, duration, price, and category. Colour-code services for easy visual identification in the calendar. You can also click any existing service card to view its full details, then edit it from within the modal.',
  },
  {
    question: 'How do I add staff members?',
    answer: 'Go to Staff → Add Staff. Enter the barber\'s name, role, and colour. Set their working hours immediately after — this is what controls available slots on the booking page. You can then assign which services they offer. Staff limits depend on your plan (Free = 1, Starter = 2, Pro = 8, Empire = unlimited).',
  },
  {
    question: 'How do I complete the onboarding checklist?',
    answer: 'The onboarding checklist on your dashboard guides you through the key steps: add a service, add a staff member, configure working hours, and publish your booking page. It dismisses automatically once all steps are complete. If you accidentally dismiss it, the steps are covered in full in the Setup Guide section above.',
  },
]

const BOOKINGS_CLIENTS = [
  {
    question: 'What is a booking reference and how do I use it?',
    answer: 'Every booking gets a unique reference number in the format BB-XXXXXXXX (e.g. BB-A3F91C2B). This reference is shown in the booking list under the client\'s name, displayed in the booking detail modal, and included in the client\'s confirmation email. When a client calls or messages about their appointment, ask them to quote it. Paste it into the search bar on the Bookings page and their booking appears instantly.',
  },
  {
    question: 'How do I search for a booking?',
    answer: 'Use the search bar at the top of the Bookings page. Type a client\'s name to find all their bookings. If a client has their booking reference (BB-XXXXXXXX), typing it in will go straight to that exact booking. You can combine this with the date and status filters for more precise results.',
  },
  {
    question: 'How do I view full booking details?',
    answer: 'Click any booking row in the list to open the Booking Details modal. This shows the full appointment info (date, time, service, barber), complete client contact details (email, phone), payment status, and any notes. From here you can approve, complete, cancel, or edit the booking.',
  },
  {
    question: 'Can clients book online without creating an account?',
    answer: 'Yes — clients visit your public booking page, choose a service and time, enter their name and contact details, and that\'s it. No account, no app download. They receive an automatic confirmation email with their booking reference as soon as the booking is made.',
  },
  {
    question: 'How do I cancel or reschedule a booking?',
    answer: 'Click the booking row to open its detail modal, then click Cancel. Or use the ⋯ actions menu on the right of any booking row. If you cancel, the client receives an automated cancellation email (on Starter plans and above) that includes their original booking reference.',
  },
  {
    question: 'How are booking reminders sent?',
    answer: 'On Starter plans and above, BarberBoost automatically sends email reminders 48 hours and 2 hours before the appointment. You can customise the timing in Settings → Notifications. Clients can confirm or cancel directly from the reminder email — no login required.',
  },
  {
    question: 'How do I add a client manually?',
    answer: 'Go to Clients → Add Client and fill in their name, email, and phone. Clients are also created automatically when they book through your public booking page. You can add notes, preferred barber, and tags to any client profile from the Clients section.',
  },
  {
    question: 'What do the client tags mean?',
    answer: 'Tags are assigned automatically based on booking behaviour: New (1–2 visits), Regular (consistent visitor), VIP (high frequency or spend), At-risk (no visit in 60+ days). You can also add custom tags from any client profile. These tags help you target campaigns and identify clients who need re-engaging.',
  },
]

const STAFF_SERVICES = [
  {
    question: 'How do I set staff working hours?',
    answer: 'Go to Staff → select a staff member → Working Hours. Set start and end times for each day and toggle days off. These hours control the slots shown on the public booking page for that barber. Set these before sharing your booking link — clients can only book within the hours you define.',
  },
  {
    question: 'Can I assign specific services to individual barbers?',
    answer: 'Yes. On each staff member\'s profile you can toggle which services they offer. Clients will only see available slots for barbers who actually perform the requested service. This prevents bookings for services a barber doesn\'t do.',
  },
  {
    question: 'How do I view a specific barber\'s schedule?',
    answer: 'Use the staff filter on the Bookings page (Day or Week view) to see one barber\'s calendar at a time. In Day view, you\'ll see colour-coded appointments for each barber on a time grid. Switch barbers using the dropdown filter.',
  },
  {
    question: 'How do I temporarily block out time for a barber?',
    answer: 'Currently the best approach is to create a manual booking for the blocked period (e.g. "Staff Training" or "Holiday") so that slot shows as unavailable on the public booking page. A dedicated blocked-time feature is on the roadmap.',
  },
  {
    question: 'Can I change a service price without affecting old bookings?',
    answer: 'Yes — updating a service price in Services only affects future bookings. All existing bookings retain the price that was set at the time of booking. You can also manually adjust the price on an individual booking from the booking detail modal.',
  },
  {
    question: 'How many staff members can I have?',
    answer: 'The Free plan supports 1 staff member, Starter supports 2, Pro supports 8, and Empire supports unlimited. You can upgrade your plan at any time from Settings → Billing. Existing bookings are never affected by plan changes.',
  },
]

const BILLING = [
  {
    question: 'What happens when I hit my booking limit?',
    answer: 'You\'ll see a warning as you approach the limit. Once reached, new bookings can\'t be created until you upgrade or the monthly limit resets. Existing bookings are never cancelled. The Free plan allows 30 bookings/month; Starter gives you 200; Pro and Empire are unlimited.',
  },
  {
    question: 'Can I upgrade or downgrade mid-month?',
    answer: 'Yes. Upgrades take effect immediately and you\'re charged a prorated amount for the remainder of the billing period. Downgrades take effect at the start of the next billing cycle — you keep full access until then.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'Go to Settings → Billing → Manage Subscription and cancel from the Stripe billing portal. Your account stays active until the end of the current billing period, then reverts to the Free plan. Your data is not deleted.',
  },
  {
    question: 'Where can I find my invoices?',
    answer: 'All invoices are in Settings → Billing → Billing History and emailed to you automatically each cycle. They include your business name, VAT number (if provided), and a full itemised breakdown.',
  },
  {
    question: 'Do you offer a discount for annual billing?',
    answer: 'Yes — annual plans give you 2 months free (a 16.7% saving). You can switch to annual billing at any time from Settings → Billing. The full annual amount is charged upfront.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a full refund within 14 days of your first paid subscription if you\'re not happy — no questions asked. For annual plans, a prorated refund is available within 30 days.',
  },
]

const TECHNICAL = [
  {
    question: 'How do I make sure confirmation emails reach clients?',
    answer: 'Confirmation emails are sent via Resend using your verified sending domain (noreply@barberboost.app). Check that your RESEND_API_KEY and RESEND_FROM_EMAIL are configured in your environment settings. To test, make a booking with your own email address and check it arrives. If it lands in spam, ask clients to add noreply@barberboost.app to their contacts.',
  },
  {
    question: 'A client says they didn\'t receive their confirmation email — what do I do?',
    answer: 'First, ask them to check their spam or junk folder. The email comes from noreply@barberboost.app with the subject "Booking Confirmed [BB-XXXXXXXX]". If it\'s not there, open the booking detail modal in the dashboard — the client\'s email address is shown there so you can verify it was entered correctly. You can resend the details manually by copying the booking reference to them via WhatsApp or SMS.',
  },
  {
    question: 'Which browsers are supported?',
    answer: 'BarberBoost works on the latest versions of Chrome, Safari, Firefox, and Edge. Chrome and Safari give the best experience. The dashboard is fully responsive on mobile browsers — no app download required. A native iOS and Android app is on the roadmap for Q3 2026.',
  },
  {
    question: 'Is my data backed up?',
    answer: 'Yes — your data is stored in Supabase with continuous backups and point-in-time recovery. We maintain 30-day backups and can restore to any point within that window if needed. Your data is encrypted at rest and in transit.',
  },
  {
    question: 'Can I export my data?',
    answer: 'Yes — you can export bookings, clients, and financial reports as CSV from the relevant pages. On Pro and Empire plans, you can also export analytics reports. Data export is available for 90 days after cancelling your subscription.',
  },
  {
    question: 'How do I reset my password?',
    answer: 'Click "Forgot password" on the login page and enter your email address. You\'ll receive a reset link within a minute — check your spam folder if it doesn\'t appear. You can also change your password at any time from Settings → Account.',
  },
  {
    question: 'How do I contact support?',
    answer: 'Use the Contact page to send us a message and we\'ll reply within one business day. Starter and Pro customers get email support. Empire customers have access to priority support and a dedicated onboarding call.',
  },
]

// ── Quick start ────────────────────────────────────────────────────────────────
const QUICK_START = [
  {
    step: '1',
    time: '~8 min',
    title: 'Set up your shop',
    stepColor:  'text-[#c9a84c]',
    bulletBg:   'bg-[#c9a84c]/10',
    bulletBorder: 'border-[#c9a84c]/20',
    bulletText: 'text-[#c9a84c]',
    linkColor:  'text-[#c9a84c] hover:text-[#e2bf6a]',
    actions: [
      'Add shop name, address & phone in Settings → Shop Profile',
      'Create at least one service with a price and duration',
      'Add yourself as a staff member and set your working hours',
    ],
    href: '#setup-guide',
  },
  {
    step: '2',
    time: '~2 min',
    title: 'Publish your booking page',
    stepColor:  'text-emerald-400',
    bulletBg:   'bg-emerald-400/10',
    bulletBorder: 'border-emerald-400/20',
    bulletText: 'text-emerald-400',
    linkColor:  'text-emerald-400 hover:text-emerald-300',
    actions: [
      'Go to Settings → Booking Page and choose your public URL',
      'Write a short welcome message for clients',
      'Paste the link into your Instagram bio and Google Business profile',
    ],
    href: '#setup-guide',
  },
  {
    step: '3',
    time: 'Every day',
    title: 'Run your daily schedule',
    stepColor:  'text-blue-400',
    bulletBg:   'bg-blue-400/10',
    bulletBorder: 'border-blue-400/20',
    bulletText: 'text-blue-400',
    linkColor:  'text-blue-400 hover:text-blue-300',
    actions: [
      'Open Bookings → Day View each morning to see all appointments',
      'Click any booking row to view full details or take action',
      'Mark each appointment Complete as your day progresses',
    ],
    href: '#daily-use',
  },
]

// ── Common workflows ──────────────────────────────────────────────────────────
const WORKFLOWS = [
  {
    title: 'Add a walk-in',
    steps: [
      'Click New Booking on the Bookings page',
      'Enter a name — leave email blank',
      'Select service, barber, and time slot → Confirm',
    ],
  },
  {
    title: 'Handle a no-show',
    steps: [
      'Find the booking by name in the search bar',
      'Open the detail modal',
      'Change status to No Show — it logs permanently on the client profile',
    ],
  },
  {
    title: 'Block time for holiday or training',
    steps: [
      'Go to Staff → select the barber → Working Hours',
      'Toggle off the relevant day(s)',
      'For a multi-week absence, toggle off each affected day',
    ],
  },
  {
    title: 'Client calls to cancel',
    steps: [
      'Search by client name or BB- reference in the Bookings search bar',
      'Open the booking detail modal → click Cancel',
      'Client receives an automatic cancellation email (Starter+ plans)',
    ],
  },
  {
    title: 'Look up a client\'s history',
    steps: [
      'Go to Clients and search by name or phone number',
      'Open their profile to see all past visits, total spend, and notes',
      'Add a note — preferred style, sensitivities — visible to all barbers',
    ],
  },
  {
    title: 'Update a service price',
    steps: [
      'Go to Services and click the service card',
      'Edit the price → Save',
      'Only affects future bookings — existing bookings keep their original price',
    ],
  },
]

// ── Sub-components ─────────────────────────────────────────────────────────────
function StepCard({ step }: { step: typeof SETUP_STEPS[number] }) {
  return (
    <div className="flex gap-6 group">
      {/* Number + line */}
      <div className="flex flex-col items-center gap-0">
        <div className="w-10 h-10 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/25 flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-bold font-mono text-[#c9a84c]">{step.number}</span>
        </div>
        <div className="flex-1 w-px bg-gradient-to-b from-[#c9a84c]/20 to-transparent mt-2 mb-0 group-last:hidden" />
      </div>
      {/* Content */}
      <div className="pb-10 group-last:pb-0 min-w-0">
        <h3 className="font-semibold text-white text-base mb-2">{step.title}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed mb-3">{step.description}</p>
        <ul className="space-y-1.5">
          {step.tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-xs text-zinc-600">
              <CheckCircle className="w-3.5 h-3.5 text-[#c9a84c]/50 flex-shrink-0 mt-0.5" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function DailyCard({ step }: { step: typeof DAILY_STEPS[number] }) {
  const Icon = step.icon
  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-5 space-y-3 hover:border-[#c9a84c]/15 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#c9a84c]/8 border border-[#c9a84c]/15 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#c9a84c]" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a84c]/70">{step.time}</p>
          <p className="text-sm font-semibold text-white">{step.title}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {step.points.map((point) => (
          <li key={point} className="flex items-start gap-2 text-xs text-zinc-500 leading-relaxed">
            <ChevronRight className="w-3 h-3 text-zinc-700 flex-shrink-0 mt-0.5" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  )
}

function MaintenanceCard({ item }: { item: typeof MAINTENANCE[number] }) {
  const Icon = item.icon
  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-5 space-y-3 hover:border-[#c9a84c]/15 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-[#c9a84c]/8 border border-[#c9a84c]/15 flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#c9a84c]" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-white">{item.title}</p>
      <p className="text-xs text-zinc-500 leading-relaxed">{item.description}</p>
    </div>
  )
}

function QuickStartCard({ item }: { item: typeof QUICK_START[number] }) {
  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 flex flex-col gap-5 hover:border-[#c9a84c]/15 transition-all">
      <div className="flex items-center justify-between">
        <span className={`font-[family-name:var(--font-heading)] text-4xl leading-none tracking-widest font-bold opacity-25 ${item.stepColor}`}>
          {item.step}
        </span>
        <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full border border-[#2a2a2a] text-zinc-500">
          {item.time}
        </span>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">{item.title}</h3>
        <ol className="space-y-2.5 list-none">
          {item.actions.map((action, i) => (
            <li key={action} className="flex items-start gap-2.5 text-xs text-zinc-500 leading-relaxed">
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 ${item.bulletBg} ${item.bulletBorder} ${item.bulletText}`}>
                {i + 1}
              </span>
              {action}
            </li>
          ))}
        </ol>
      </div>
      <a href={item.href} className={`mt-auto text-xs font-medium transition-colors flex items-center gap-1 group ${item.linkColor}`}>
        See full guide
        <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
      </a>
    </div>
  )
}

function WorkflowCard({ item }: { item: typeof WORKFLOWS[number] }) {
  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 space-y-3 hover:border-[#c9a84c]/15 transition-colors">
      <p className="text-sm font-semibold text-white">{item.title}</p>
      <ol className="space-y-1.5 list-none">
        {item.steps.map((step, i) => (
          <li key={step} className="flex items-start gap-2.5 text-xs text-zinc-500 leading-relaxed">
            <span className="w-4 h-4 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center text-[9px] font-bold text-[#c9a84c] shrink-0 mt-0.5">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HelpPage() {
  return (
    <main className="bg-[#0a0a0a]">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-20 pb-12 px-4 sm:px-6 text-center space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Support</p>
        <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.5rem,7vw,5.5rem)] leading-none tracking-widest text-white">
          HELP CENTRE
        </h1>
        <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
          Everything you need to set up, use, and get the most out of BarberBoost — from day one to daily operations.
        </p>
      </section>

      {/* ── Quick Start ───────────────────────────────────────────────────── */}
      <section className="py-10 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c] mb-1">Quick start</p>
              <h2 className="font-[family-name:var(--font-heading)] text-[clamp(1.6rem,4vw,2.5rem)] leading-none tracking-widest text-white">
                UP AND RUNNING IN 10 MINUTES
              </h2>
            </div>
            <p className="text-xs text-zinc-600 shrink-0 sm:pb-1">No setup call needed.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {QUICK_START.map((item) => (
              <QuickStartCard key={item.step} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Category nav cards ────────────────────────────────────────────── */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4">
          {CATEGORIES.map(({ icon: Icon, label, href, description }) => (
            <a
              key={label}
              href={href}
              className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-5 space-y-3 hover:border-[#c9a84c]/20 hover:bg-[#131313] transition-all group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/8 border border-[#c9a84c]/15 flex items-center justify-center mx-auto group-hover:bg-[#c9a84c]/12 transition-colors">
                <Icon className="w-4 h-4 text-[#c9a84c]" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-semibold text-white">{label}</p>
              <p className="text-[11px] text-zinc-600 leading-snug hidden md:block">{description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ── Setup Guide ───────────────────────────────────────────────────── */}
      <section id="setup-guide" className="py-16 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">User guide</p>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-widest text-white">
              SETUP GUIDE
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Follow these six steps in order and your shop will be live and taking bookings in under 30 minutes.
            </p>
          </div>

          {/* Steps + quick summary side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Steps list */}
            <div className="lg:col-span-2">
              {SETUP_STEPS.map((step) => (
                <StepCard key={step.number} step={step} />
              ))}
            </div>

            {/* Quick checklist sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a84c]">Quick checklist</p>
                <ul className="space-y-2.5">
                  {[
                    'Shop profile complete',
                    'At least 1 service added',
                    'At least 1 staff member added',
                    'Working hours set',
                    'Booking page URL chosen',
                    'Test booking taken',
                  ].map((item, i) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-zinc-400">
                      <span className="w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center text-[10px] font-mono text-zinc-600 flex-shrink-0">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="pt-3 border-t border-[#1e1e1e]">
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Once all six steps are done, your public booking page is live and ready to share.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 text-xs text-zinc-500 hover:text-[#c9a84c] transition-colors group"
                >
                  Need help with setup?
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Daily Use ─────────────────────────────────────────────────────── */}
      <section id="daily-use" className="py-16 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Daily workflow</p>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-widest text-white">
              USING IT EVERY DAY
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              How to run your day-to-day operations smoothly with BarberBoost.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DAILY_STEPS.map((step) => (
              <DailyCard key={step.title} step={step} />
            ))}
          </div>

          {/* Booking reference callout */}
          <div className="mt-6 bg-[#c9a84c]/5 border border-[#c9a84c]/15 rounded-2xl p-6 flex gap-5 items-start">
            <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Hash className="w-4.5 h-4.5 text-[#c9a84c]" strokeWidth={1.5} />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-white">Booking references make client enquiries instant</p>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">
                Every booking gets a unique reference like <span className="font-mono text-[#c9a84c]">BB-A3F91C2B</span> — visible in the list, the detail modal, and the client&apos;s confirmation email.
                Tell clients to quote it when they contact you. Type it into the search bar on the Bookings page and their booking appears immediately, no scrolling required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Maintenance ───────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Best practices</p>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-widest text-white">
              KEEPING IT RUNNING WELL
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Small habits that keep your data accurate and your shop running without friction.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MAINTENANCE.map((item) => (
              <MaintenanceCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Common Workflows ─────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">How-to guides</p>
            <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-widest text-white">
              COMMON WORKFLOWS
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Step-by-step guides for the tasks you'll do most often.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WORKFLOWS.map((item) => (
              <WorkflowCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ sections ──────────────────────────────────────────────────── */}
      <div id="bookings" className="border-t border-[#c9a84c]/5">
        <FAQ items={GETTING_STARTED} title="GETTING STARTED" subtitle="Setting up your shop and taking your first booking." />
      </div>
      <div id="bookings-faq" className="border-t border-[#c9a84c]/5">
        <FAQ items={BOOKINGS_CLIENTS} title="BOOKINGS & CLIENTS" subtitle="Managing your schedule, references, and client database." />
      </div>
      <div id="staff" className="border-t border-[#c9a84c]/5">
        <FAQ items={STAFF_SERVICES} title="STAFF & SERVICES" subtitle="Setting up your team, hours, and service menu." />
      </div>
      <div id="billing" className="border-t border-[#c9a84c]/5">
        <FAQ items={BILLING} title="BILLING & PLANS" subtitle="Subscriptions, invoices, and plan changes." />
      </div>
      <div id="technical" className="border-t border-[#c9a84c]/5">
        <FAQ items={TECHNICAL} title="TECHNICAL" subtitle="Email delivery, browsers, security, and data exports." />
      </div>

      {/* ── Still stuck CTA ───────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 border-t border-[#c9a84c]/5">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Still need help?</p>
          <h2 className="font-[family-name:var(--font-heading)] text-[clamp(1.8rem,4vw,2.8rem)] leading-none tracking-widest text-white">
            WE&apos;RE ONE MESSAGE AWAY
          </h2>
          <p className="text-zinc-500 text-sm">
            Can&apos;t find what you&apos;re looking for? Send us a message and we&apos;ll reply within one business day.
            Pro and Empire customers get priority support.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="group flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold px-8 py-4 rounded-xl transition-all tracking-wide"
            >
              Contact support
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/community"
              className="text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-8 py-4 rounded-xl transition-all"
            >
              Ask the community
            </Link>
          </div>

          {/* Quick links */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { label: 'Pricing & plans', href: '/pricing' },
              { label: 'Changelog', href: '/changelog' },
              { label: 'API docs', href: '/docs' },
              { label: 'System status', href: '/status' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1"
              >
                {label}
                <ChevronRight className="w-3 h-3" />
              </Link>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
