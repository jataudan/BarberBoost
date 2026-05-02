import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react'

// ── Article data ──────────────────────────────────────────────────────────────

interface Section {
  id:    string
  title: string
  body:  string[]
}

interface Post {
  slug:          string
  category:      string
  categoryColor: string
  title:         string
  excerpt:       string
  readTime:      string
  date:          string
  sections:      Section[]
}

const POSTS: Post[] = [
  {
    slug:          'reduce-no-shows-automated-reminders',
    category:      'Client Retention',
    categoryColor: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/20',
    title:         'How to Reduce No-Shows by 70% with Automated Reminders',
    excerpt:       'No-shows are the silent killer of barbershop revenue. We break down the exact reminder sequence — timing, channels, and tone — that top-performing shops use to keep chairs full.',
    readTime:      '6 min read',
    date:          'Apr 18, 2026',
    sections: [
      {
        id:    'the-real-cost',
        title: 'The real cost of a no-show',
        body: [
          'A no-show is not just a missed booking. It is a chair sitting empty for 30 or 45 minutes that you cannot fill on short notice, a slot that someone else wanted but could not get, and the mental overhead of wondering whether to call, chase, or let it go.',
          'For a solo barber taking 8 appointments a day, a 15% no-show rate translates to roughly one missed booking a day. At £25 per cut, that is £125 a week — over £6,000 a year — walking out the door without a haircut.',
          'The good news is that the research is clear: most no-shows are not malicious. Clients forget. Life gets in the way. A well-timed reminder is usually all it takes to get a confirmation or, at worst, a cancellation early enough to rebook the slot.',
        ],
      },
      {
        id:    'timing',
        title: 'The reminder timing that works',
        body: [
          'Not all reminders are equal. Sending a reminder too early gives clients time to forget again. Too late and they cannot rearrange even if they want to. The sweet spot, based on booking data across thousands of UK barbershop appointments, is a two-touch sequence:',
          '48 hours before: the main reminder. This is when clients can still reschedule without causing you a problem, and it gives them enough notice to rearrange their day if they forgot. Keep this one friendly and include all the booking details — service, barber, time, and location.',
          '2 hours before: the final nudge. Short, warm, and practical. Just enough to break through a busy morning. Something like: "See you in 2 hours, Marcus. Your fade with Jordan is booked for 11am at Kings Cuts, EC1." That is it.',
          'Adding a third reminder (one week out) makes no difference to show-up rates and increases unsubscribes. Stick to two.',
        ],
      },
      {
        id:    'channels',
        title: 'Which channels to use',
        body: [
          'Email is reliable and free. Virtually every booking system supports it, and confirmation emails alone (not even reminders) reduce no-shows because they give clients a reference to check. If you are only doing one thing, make it email.',
          'WhatsApp and SMS cut through in a way that email does not. Open rates for SMS are over 95% — compared to around 30% for email. For UK clients, WhatsApp is the most natural channel: they already use it all day, they read messages immediately, and a short reminder from a business they recognise feels personal rather than spammy.',
          'The combination of email + WhatsApp is the most effective setup. Email for clients who check their inbox, WhatsApp for everyone else. BarberBoost Starter plans and above send both automatically.',
        ],
      },
      {
        id:    'message-tone',
        title: 'Tone: the difference between a reminder and a nuisance',
        body: [
          'The tone of your reminder matters more than most people realise. A cold, transactional message — "REMINDER: Appointment on Friday 14:00" — gets ignored. A message that sounds like it comes from a person gets read.',
          'Use first names. Reference the service and the barber. Keep it short. And give the client one clear action: confirm, or let you know if they need to change.',
          'What you do not need: a cancellation fee threat in the reminder itself. Save that for the booking terms — putting it in the reminder poisons the tone and rarely improves rates. A genuine, warm message does far more work.',
          'Bad: "This is a reminder that you have an appointment at Kings Cuts on Friday at 14:00. Failure to attend may result in a fee." Good: "Hi Marcus, just a reminder you\'re booked in for a fade with Jordan on Friday at 2pm. See you then — Kings Cuts."',
        ],
      },
      {
        id:    'no-show-follow-up',
        title: 'What to do when a no-show still happens',
        body: [
          'Even with a perfect reminder sequence, some clients will not show. Do not write them off immediately. A brief follow-up the next day — "Hey, we missed you yesterday — hope everything is okay. Want to rebook?" — converts a surprising number of no-shows into returning clients.',
          'Track no-shows on each client profile. One no-show is forgivable. Two in a row tells you something. Three means you consider a booking deposit for that client before you accept their next appointment.',
          'BarberBoost automatically logs no-shows on client profiles and can send a follow-up email the next day. Over time, your booking data will show you exactly which clients are reliable and which ones warrant a deposit upfront.',
        ],
      },
    ],
  },
  {
    slug:          'uk-barbershop-owner-guide-growing-client-base',
    category:      'Growth',
    categoryColor: 'text-blue-400 bg-blue-500/8 border-blue-500/20',
    title:         'The UK Barbershop Owner\'s Guide to Growing Your Client Base',
    excerpt:       'From first-time walk-ins to lifelong regulars — the systems and strategies that turn one-off visits into a loyal, growing clientele.',
    readTime:      '9 min read',
    date:          'Apr 11, 2026',
    sections: [
      {
        id:    'the-growth-problem',
        title: 'Why most shops plateau',
        body: [
          'Most barbershops grow quickly at first — word of mouth, a good location, a barber with a following. Then somewhere around year two or three, growth slows. The shop is busy but not growing. The waiting list fills up on Saturdays but Monday mornings are dead. Revenue feels like a ceiling rather than a trajectory.',
          'The reason is almost always the same: organic word-of-mouth has been exhausted, and there is no system to replace it. Every new client that walks in is a happy accident rather than the result of a deliberate process. To grow past this point, you need to convert accidentals into regulars — and regulars into advocates.',
        ],
      },
      {
        id:    'first-visit',
        title: 'Making the first visit count',
        body: [
          'The first visit is the highest-value moment in a client relationship. A client who has just had a great first cut is maximally receptive — they are satisfied, they trust you, and they have no loyalty to any other shop. This is exactly when you want to capture their details and give them a reason to return.',
          'Ask for a name and mobile number at booking or at the chair — frame it as "so we can send you a reminder for next time." Most clients are happy to give it. Store it in your client database immediately.',
          'The follow-up message 48 hours after the first visit is underused and highly effective. A simple "Great to meet you yesterday, Marcus — let us know when you want to book again" reminds them you exist before the memory fades, and it shows the kind of personal attention that makes people come back.',
        ],
      },
      {
        id:    'rebooking',
        title: 'The rebooking habit',
        body: [
          'The single most effective growth lever for a barbershop is also the simplest: ask every client to book their next appointment before they leave. Not as a hard sell — just a natural part of the checkout.',
          '"When do you usually come back in? Want me to pencil you in for the same time in four weeks?" Most clients have a rough idea of their cycle. Four to six weeks for a regular fade, six to eight for a relaxed cut. Getting the next appointment in the diary before they walk out reduces the chance they drift to a competitor when they next need a cut.',
          'In BarberBoost, you can take the next booking from the same screen you are on. It takes 30 seconds. Over a year, a barber who rebounds 60% of clients fills their calendar almost entirely with repeat business — rather than constantly chasing new clients to replace those who drifted.',
        ],
      },
      {
        id:    'instagram',
        title: 'Instagram: what actually works for barbershops',
        body: [
          'Instagram is the highest-ROI marketing channel for barbershops, but only when used correctly. The mistake most shops make is posting inconsistently — a flurry of content for two weeks, then silence for two months. An inconsistent account signals to new clients that the business is similarly unreliable.',
          'What works: one good photo of a finished cut, posted consistently (three times a week is plenty). Lighting matters more than camera equipment. Natural light by a window will beat a phone under strip lighting every time.',
          'Put your booking link in your bio. Not "DM to book" — an actual booking link. Every client who lands on your profile and sees a "Book Now" link in the bio has a conversion path that takes 60 seconds. Clients who are told to DM will do so maybe 20% of the time.',
          'Local hashtags (#LondonBarber, #ManchesterFade, your area name + barber) drive more relevant discovery than generic ones (#barbershop). Geotag every post. Google indexes Instagram posts — a geotagged post for your town appears in local search results.',
        ],
      },
      {
        id:    'google-business',
        title: 'Google Business: the most underused tool in barbering',
        body: [
          'More clients find barbershops via Google Maps than via any other channel. "Barber near me" is searched millions of times a month in the UK. A properly set up Google Business profile is free and pays back many times over.',
          'If you have not claimed your listing, do it today. Add your address, phone number, opening hours, and photos. Upload at least 10 photos — the shops with the most photos consistently rank higher and convert better. Add your BarberBoost booking link as the "Book" button.',
          'Reviews are the ranking factor. Ask every regular client to leave a Google review — not as a request after every cut, but once, genuinely, when you have had a good interaction. "Would you mind leaving us a Google review? It really helps us get found." Most satisfied clients are happy to do it if asked directly. Fifty good reviews puts you ahead of 90% of shops in your area.',
        ],
      },
      {
        id:    'retention',
        title: 'The maths of retention vs acquisition',
        body: [
          'Acquiring a new client costs roughly five times as much as retaining an existing one. For a barbershop, that ratio is even more pronounced: new clients come from expensive channels (advertising, Instagram, walk-ins), while retained clients come back automatically.',
          'A client who visits every five weeks and spends £30 is worth £312 a year. If your retention rate is 60%, you keep 60 of every 100 new clients past the second visit. Raising that to 75% — by improving follow-ups, rebooking rates, and the experience itself — adds 15 extra clients per 100 for free.',
          'Track your retention rate. BarberBoost\'s analytics shows how many clients return within 60 days. If that number is below 50%, focus entirely on retention before you spend a penny on acquisition.',
        ],
      },
    ],
  },
  {
    slug:          '5-signs-ready-to-go-digital',
    category:      'Getting Started',
    categoryColor: 'text-[#c9a84c] bg-[#c9a84c]/8 border-[#c9a84c]/20',
    title:         '5 Signs Your Barbershop Is Ready to Go Digital',
    excerpt:       'Still taking bookings by phone? Managing staff with a whiteboard? If any of these five scenarios sound familiar, it\'s time to make the switch — here\'s why and how.',
    readTime:      '4 min read',
    date:          'Apr 3, 2026',
    sections: [
      {
        id:    'intro',
        title: 'The tipping point',
        body: [
          'Most barbershops do not go digital because they decide to. They go digital because the pain of not doing so becomes greater than the friction of switching. The phone rings during a cut. The whiteboard gets wiped by accident. A client books a slot that was already taken. One of these happens, and suddenly the paper system that worked for two years stops being good enough.',
          'If any of the following five situations sounds familiar, you are at the tipping point.',
        ],
      },
      {
        id:    'sign-1',
        title: 'Sign 1: You are taking bookings while in the middle of a cut',
        body: [
          'The phone rings. You have scissors in one hand and a comb in the other. You either ignore it (and the client books somewhere else) or you stop, answer, and give the client in your chair a slightly worse experience.',
          'This is the most common complaint we hear from barbers. An online booking page solves it completely. The phone can still ring for clients who prefer it — but the majority will book online, any time of day, without interrupting your work.',
        ],
      },
      {
        id:    'sign-2',
        title: 'Sign 2: You have had a double-booking in the last six months',
        body: [
          'Two clients show up for the same slot. One of them is going to be unhappy, and one of them might not come back. If this has happened once, it will happen again — the system that allowed it is still in place.',
          'A digital booking system with real-time availability prevents double-bookings structurally. Once a slot is taken, it is gone. No calls, no checks, no manual cross-referencing.',
        ],
      },
      {
        id:    'sign-3',
        title: 'Sign 3: You cannot tell at a glance what tomorrow looks like',
        body: [
          'If answering "how busy are we tomorrow?" requires checking a notebook, calling a colleague, or piecing together WhatsApp messages, your scheduling is already failing you.',
          'A calendar view that shows every barber\'s day — colour-coded by service, with client names and times — should be the first thing you see when you open your booking system. It takes five seconds to read, not five minutes to reconstruct.',
        ],
      },
      {
        id:    'sign-4',
        title: 'Sign 4: You have no idea who your best clients are',
        body: [
          'Who came in most last month? Who has not been in for eight weeks? Who spends the most per visit? If you cannot answer these questions without thinking hard, you are not using the client relationship data you already have.',
          'Every visit is data. A digital client database turns those visits into a list: visit history, total spend, contact details, preferred barber. You can see who is drifting, who is loyal, and who to reach out to — rather than waiting for them to come back on their own.',
        ],
      },
      {
        id:    'sign-5',
        title: 'Sign 5: Your shop is not on Google Maps as a bookable business',
        body: [
          '"Barber near me" is one of the most searched phrases on Google in the UK. If your business does not have an online presence — or if clients cannot book directly from your Google listing — you are invisible to a large chunk of potential new clients who are actively looking for exactly what you offer.',
          'Going digital means your booking link can go in your Instagram bio, on your Google Business profile, and in every message you send. Every one of those is a door that stays open 24 hours a day, without you having to answer it.',
        ],
      },
      {
        id:    'making-the-switch',
        title: 'Making the switch',
        body: [
          'The most common fear is that setup will be complicated or time-consuming. In practice, the basics take about 30 minutes: add your services, add yourself as a staff member, set your working hours, and your booking page is live.',
          'Start by running the digital system alongside the phone for two weeks. Tell regular clients the link is there if they want to use it — most will. By the end of the month, phone bookings will have dropped and your schedule will manage itself.',
        ],
      },
    ],
  },
  {
    slug:          'how-to-price-services-uk-barbers',
    category:      'Business',
    categoryColor: 'text-indigo-400 bg-indigo-500/8 border-indigo-500/20',
    title:         'How to Price Your Services: A Guide for UK Barbers',
    excerpt:       'Undercharging is the most common mistake independent barbers make. Learn how to calculate a profitable rate, benchmark against your local market, and raise prices without losing clients.',
    readTime:      '7 min read',
    date:          'Mar 27, 2026',
    sections: [
      {
        id:    'undercharging',
        title: 'Why most barbers undercharge',
        body: [
          'Independent barbers almost universally underprice their services — not because they lack confidence in their work, but because they set prices based on what feels socially acceptable rather than what the business actually requires.',
          'The logic goes: the shop down the road charges £15 for a cut, so I\'ll charge £14 to be competitive. But competitive pricing only makes sense if both businesses have similar costs, similar volumes, and similar goals. Most of the time, they do not.',
          'The result is a barber who is busy, skilled, and exhausted — and still not making what the work is worth. Let us look at how to get to a number that actually holds up.',
        ],
      },
      {
        id:    'cost-of-seat',
        title: 'Start with the cost of your seat',
        body: [
          'Your pricing needs to cover three things: your costs (rent, supplies, insurance, software, payment fees), your desired earnings (what you want to take home), and a small buffer for quiet weeks and holidays.',
          'Take your monthly fixed costs and add them up. Include rent or chair rental, insurance, tools and product, software subscriptions, and any marketing spend. For a typical solo barber in a UK city, this might total £1,200–£2,000 a month depending on location.',
          'Add your target monthly take-home. If you want to earn £3,000 a month after costs, your total monthly revenue target is roughly £4,200–£5,000. Now divide by the number of appointments you realistically complete in a month. If you do 20 appointments a week across 4 weeks, that is 80 appointments. £5,000 ÷ 80 = £62.50 per appointment.',
          'That number will surprise most barbers who are charging £20. The gap between current pricing and sustainable pricing is the undercharging problem in its simplest form.',
        ],
      },
      {
        id:    'market-benchmarking',
        title: 'Benchmarking against your local market',
        body: [
          'Your cost-based price tells you the floor. Your local market tells you the ceiling. Check what similar shops in your area charge for comparable services — not just the cheapest, but the ones with good reputations and full books.',
          'In London, a premium men\'s cut at a reputable shop now typically runs £35–£55. In Manchester, Birmingham, or Leeds, £25–£40 is common for skilled independent barbers. In smaller towns, the ceiling is lower — but so are your costs.',
          'The goal is to sit in the upper-middle of your local market, not the bottom. Clients who are comparison-shopping on price alone are the most likely to no-show, the least likely to tip, and the hardest to retain. The clients who pay for quality stay loyal.',
        ],
      },
      {
        id:    'raising-prices',
        title: 'How to raise prices without losing clients',
        body: [
          'Most barbers dread the price increase conversation. They worry clients will leave. The reality: a well-executed price rise loses very few clients and is barely noticed by most regulars.',
          'Give notice rather than surprise. A card at the desk or a message to your client list two to three weeks ahead is enough: "From 1 June, our prices will be updated to reflect increased costs. Our standard cut will move from £20 to £25. Thank you for your support." That is the entire message.',
          'Raise prices in one meaningful step rather than small increments every six months. A £5 increase once is less disruptive — and less psychologically annoying — than a £1 increase five times. Clients adapt to a new price more easily than they adapt to constant change.',
          'Do not apologise. A price increase is not a failure — it is a business running properly. Most clients understand this, and the ones who do not were not your long-term clients anyway.',
        ],
      },
      {
        id:    'tiered-pricing',
        title: 'Using tiered pricing to increase average spend',
        body: [
          'Tiered pricing — charging different rates for different service levels — is one of the most effective ways to increase revenue without increasing volume. Instead of a single "haircut" price, you offer a cut, a cut with beard tidy, and a cut with full beard shaping at three different price points.',
          'Clients self-select into the tier that fits their needs and budget. A significant proportion will opt for the middle or premium tier because the upgrade feels justified for the price difference. Average spend goes up without any pressure selling.',
          'For BarberBoost users, this is as simple as creating three services with distinct names, durations, and prices. They appear as separate options on your public booking page, and clients choose the one they want when they book.',
        ],
      },
      {
        id:    'deposits',
        title: 'Deposits: protecting your time without scaring clients away',
        body: [
          'A deposit policy is not about distrust — it is about making the cost of a no-show tangible for the client. A £5 or £10 deposit to hold a booking is low enough not to deter genuine clients, but high enough that cancelling requires a conscious decision rather than just not showing up.',
          'Apply deposits selectively at first: new clients, peak slots (Saturday afternoon), and clients with a no-show history. Once clients have shown up reliably two or three times, you can remove the requirement.',
          'Communicate the policy clearly on your booking page and at the time of booking. "We take a small deposit to hold your slot — this is deducted from the total on the day." Most clients find this completely reasonable for a first booking.',
        ],
      },
    ],
  },
]

// ── Static generation ─────────────────────────────────────────────────────────

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = POSTS.find((p) => p.slug === params.slug)
  if (!post) return {}
  return {
    title:       `${post.title} — BarberBoost Blog`,
    description: post.excerpt,
  }
}

// ── Components ────────────────────────────────────────────────────────────────

function ArticleSection({ section }: { section: Section }) {
  return (
    <div id={section.id} className="scroll-mt-24 space-y-4 py-8 border-t border-[#1a1a1a] first:border-t-0 first:pt-0">
      <h2 className="font-[family-name:var(--font-heading)] text-xl sm:text-2xl tracking-widest text-white leading-tight">
        {section.title.toUpperCase()}
      </h2>
      {section.body.map((para, i) => (
        <p key={i} className="text-sm text-zinc-400 leading-[1.8]">{para}</p>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = POSTS.find((p) => p.slug === params.slug)
  if (!post) notFound()

  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 2)

  return (
    <main className="bg-[#0a0a0a]">

      {/* Hero */}
      <section className="pt-16 pb-10 px-4 sm:px-6 border-b border-[#1e1e1e]">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to blog
          </Link>
          <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border mb-4 ${post.categoryColor}`}>
            {post.category}
          </span>
          <h1 className="font-[family-name:var(--font-heading)] text-[clamp(1.8rem,5vw,3.5rem)] leading-tight tracking-widest text-white mb-5">
            {post.title.toUpperCase()}
          </h1>
          <p className="text-zinc-500 text-base leading-relaxed max-w-2xl mb-6">{post.excerpt}</p>
          <div className="flex items-center gap-5 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {post.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex gap-14">

          {/* Sticky TOC */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-24 space-y-0.5">
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">In this article</p>
              {post.sections.map(({ id, title }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="block text-xs text-zinc-500 hover:text-[#c9a84c] py-1.5 transition-colors border-l border-[#1e1e1e] hover:border-[#c9a84c]/40 pl-3"
                >
                  {title}
                </a>
              ))}
            </div>
          </aside>

          {/* Article content */}
          <div className="flex-1 min-w-0">
            {post.sections.map((section) => (
              <ArticleSection key={section.id} section={section} />
            ))}

            {/* CTA */}
            <div className="mt-12 bg-[#c9a84c]/5 border border-[#c9a84c]/15 rounded-2xl p-8 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a84c]">Try BarberBoost free</p>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">
                Set up in under 30 minutes. Free plan available — no credit card required.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#c9a84c] hover:bg-[#e2bf6a] text-[#0a0a0a] font-bold px-6 py-3 rounded-xl transition-colors text-sm tracking-wide"
              >
                Start for free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="py-16 px-4 sm:px-6 border-t border-[#1e1e1e]">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600 mb-6">More from the blog</p>
            <div className="grid sm:grid-cols-2 gap-5">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-3 hover:border-[#c9a84c]/20 hover:bg-[#131313] transition-all"
                >
                  <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full border ${p.categoryColor}`}>
                    {p.category}
                  </span>
                  <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-[#c9a84c] transition-colors">
                    {p.title}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600">{p.date}</span>
                    <span className="flex items-center gap-1 text-xs text-zinc-600">
                      <Clock className="w-3 h-3" />
                      {p.readTime}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

    </main>
  )
}
