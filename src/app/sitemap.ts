import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barberboost.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url:              APP_URL,
      lastModified:     now,
      changeFrequency:  'weekly',
      priority:         1,
    },
    {
      url:              `${APP_URL}/pricing`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.9,
    },
    {
      url:              `${APP_URL}/features`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.8,
    },
    {
      url:              `${APP_URL}/signup`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.7,
    },
    {
      url:              `${APP_URL}/login`,
      lastModified:     now,
      changeFrequency:  'yearly',
      priority:         0.3,
    },
  ]
}
