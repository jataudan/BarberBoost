This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Transactional / lifecycle email sender domain

`RESEND_FROM_EMAIL` should send from a **subdomain** of `barberboost.app` (e.g.
`updates.barberboost.app`), not the root domain — this keeps deliverability
issues from bulk lifecycle mail isolated from the main domain's reputation.

In Resend, add and verify that subdomain as a sending domain, then add the
DNS records Resend gives you at your DNS provider:

- **SPF** — a `TXT` record authorising Resend's servers to send on the
  subdomain's behalf.
- **DKIM** — the `CNAME`/`TXT` record(s) Resend provides for signing.
- **DMARC** — a `TXT` record at `_dmarc.<subdomain>` (start with
  `p=quarantine` while verifying, then move to `p=reject` once mail is
  confirmed passing SPF/DKIM cleanly).

Verify all three are green in the Resend dashboard before sending real
lifecycle volume — a subdomain sending without DKIM/DMARC configured will see
a meaningful chunk of trial nurture emails land in spam.
