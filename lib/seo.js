export const SITE_ORIGIN = 'https://momentis-mu.vercel.app'

export function siteUrl(path = '/') {
  return new URL(path, SITE_ORIGIN).toString()
}

export function buildMarketingMetadata({ title, description, path }) {
  const shareImage = siteUrl('/opengraph-image')

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: siteUrl(path),
      siteName: 'MOMENTIS',
      locale: 'tr_TR',
      type: 'website',
      images: [{ url: shareImage, width: 1200, height: 630, alt: 'MOMENTIS dijital davetiye stüdyosu' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [shareImage],
    },
  }
}
