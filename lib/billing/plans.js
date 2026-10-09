const premiumEventEntitlements = {
  websites: 1,
  invitations: 1,
  invitationExports: 1,
  guests: null,
  messages: null,
  premiumTemplates: true,
  advancedRsvp: true,
  album: true,
  albumPhotos: 500,
  spotify: true,
  removeBranding: true,
  printPdf: 0,
  designerSupport: false,
  customIllustration: false,
}

export const BILLING_PLANS = {
  baslangic: {
    id: 'baslangic',
    name: 'Başlangıç',
    price: 0,
    period: 'ücretsiz',
    tagline: 'Keşfetmek için ideal',
    highlighted: false,
    cta: 'Ücretsiz Başla',
    scope: 'account',
    grantMode: 'baseline',
    eventCredits: 0,
    entitlements: {
      websites: 1,
      invitations: 1,
      invitationExports: 1,
      guests: 50,
      messages: 50,
      premiumTemplates: false,
      advancedRsvp: false,
      album: false,
      albumPhotos: 0,
      spotify: false,
      removeBranding: false,
      printPdf: 0,
      designerSupport: false,
      customIllustration: false,
    },
    features: ['1 etkinlik projesi', 'Ücretsiz tasarım koleksiyonu', '50 davetliye kadar', 'Temel RSVP formu', 'MOMENTIS imzalı davetiye'],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 1490,
    period: 'etkinlik başına',
    tagline: 'En çok tercih edilen',
    highlighted: true,
    cta: 'Premium ile Başla',
    scope: 'event',
    grantMode: 'event_credits',
    eventCredits: 1,
    entitlements: premiumEventEntitlements,
    features: ['Tüm premium tasarımlar', 'Sınırsız davetli', 'Gelişmiş RSVP ve menü tercihi', 'QR anı albümü', 'Spotify çalma listesi', 'İmzasız davetiye', 'RSVP yanıt özeti'],
  },
  atolye: {
    id: 'atolye',
    name: 'Atölye',
    price: 3900,
    period: '3 etkinlik projesi dahil',
    tagline: 'Tasarımcı dokunuşu',
    highlighted: false,
    cta: 'Atölye ile Başla',
    scope: 'account',
    grantMode: 'event_credits',
    eventCredits: 3,
    entitlements: {
      ...premiumEventEntitlements,
      printPdf: 1,
      designerSupport: true,
      customIllustration: true,
    },
    features: ['Premium paketin tamamı', 'Kişisel tasarımcı desteği', 'Size özel illüstrasyon', 'Baskıya uygun PDF davetiye', '3 etkinlik projesi', 'Öncelikli destek hattı'],
  },
}

export const FREE_PLAN_ID = 'baslangic'

export function getBillingPlan(packageId) {
  return typeof packageId === 'string' ? BILLING_PLANS[packageId] || null : null
}

export function isPremiumTemplate(template) {
  return Boolean(template && template.tier && template.tier !== 'free')
}

export function isMockPaymentEnabled(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv !== 'production'
}
