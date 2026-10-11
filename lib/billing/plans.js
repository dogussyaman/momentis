const premiumEventEntitlements = {
  websites: 1,
  invitations: 1,
  // Davetiye dışa aktarma, mevcut kodda tek bir kota olarak tanımlanmıştır. Dosya türü
  // (PDF/PNG/ZIP) veya tekrar indirme sayımı için ayrı kurallar eklenmemektedir.
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
    // Başlangıç paketi, hesap düzeyinde ücretsiz proje kotası kullanır; bir etkinlik kredisi
    // tahsisi yapmaz. Bu nedenle eventCredits 0 kalmalıdır.
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
    features: [
      'Hesap başına 1 ücretsiz etkinlik projesi (ücretli etkinlik kredisi içermez)',
      '1 davet sitesi ve 1 dijital davetiye',
      '1 davetiye dışa aktarma kotası',
      'Ücretsiz tasarım koleksiyonu',
      '50 davetli ve 50 mesaj',
      'Temel RSVP formu',
      'MOMENTIS imzası korunur',
      'Premium şablonlar, gelişmiş RSVP, QR anı albümü, Spotify ve baskıya uygun PDF dahil değildir',
    ],
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
    features: [
      '1 etkinlik kredisi',
      'Etkinlik başına 1 davet sitesi ve 1 dijital davetiye',
      'Etkinlik başına 1 davetiye dışa aktarma kotası',
      'Tüm premium tasarımlar',
      'Sınırsız davetli ve mesaj',
      'Gelişmiş RSVP ve menü tercihleri',
      '500 fotoğrafa kadar QR anı albümü',
      'Spotify çalma listesi',
      'MOMENTIS markası kaldırılır',
      'Baskıya uygun PDF hakkı Premium için tanımlı değil',
      'RSVP yanıt özeti',
    ],
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
    features: [
      '3 etkinlik kredisi',
      'Etkinlik başına 1 davet sitesi ve 1 dijital davetiye',
      'Etkinlik başına 1 davetiye dışa aktarma kotası',
      'Tüm premium tasarımlar',
      'Sınırsız davetli ve mesaj',
      'Gelişmiş RSVP ve menü tercihleri',
      'Etkinlik başına 500 fotoğrafa kadar QR anı albümü',
      'Spotify çalma listesi',
      'MOMENTIS markası kaldırılır',
      'Etkinlik başına 1 baskıya uygun PDF hakkı',
      'Tasarımcı desteği ve özel illüstrasyon',
      'Öncelikli destek hattı',
      'RSVP yanıt özeti',
    ],
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
