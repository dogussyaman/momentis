import type { MetadataRoute } from 'next'
import { TEMPLATES } from '@/lib/data/templates'
import { siteUrl } from '@/lib/seo'

const publicPages = [
  { path: '/', priority: 1 },
  { path: '/nasil-calisir', priority: 0.8 },
  { path: '/tasarimlar', priority: 0.8 },
  { path: '/fiyatlandirma', priority: 0.8 },
  { path: '/sikca-sorulanlar', priority: 0.6 },
  { path: '/tasarimlar/vip', priority: 0.6 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...publicPages.map(({ path, priority }) => ({
      url: siteUrl(path),
      changeFrequency: 'monthly' as const,
      priority,
    })),
    ...TEMPLATES.map(({ slug }) => ({
      url: siteUrl(`/tasarimlar/${slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ]
}
