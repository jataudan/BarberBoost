import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  [
          '/dashboard',
          '/bookings',
          '/clients',
          '/services',
          '/staff',
          '/analytics',
          '/marketing',
          '/inventory',
          '/settings',
          '/api/',
          '/auth/',
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  }
}
