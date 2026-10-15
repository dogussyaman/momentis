import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/panel',
        '/auth/',
        '/giris',
        '/kayit',
        '/sifre-sifirla',
        '/sifremi-unuttum',
        '/preview/',
        '/portfolio-preview/',
      ],
    },
    sitemap: siteUrl('/sitemap.xml'),
  }
}
