export const PACKAGES = [
  {
    id: 'baslangic', name: 'Başlangıç', price: 0, period: 'ücretsiz', tagline: 'Keşfetmek için ideal',
    highlighted: false, cta: 'Ücretsiz Başla',
    features: ['1 etkinlik projesi', 'Ücretsiz tasarım koleksiyonu', '50 davetliye kadar', 'Temel RSVP formu', 'MOMENTIS imzalı davetiye'],
  },
  {
    id: 'premium', name: 'Premium', price: 1490, period: 'etkinlik başına', tagline: 'En çok tercih edilen',
    highlighted: true, cta: 'Premium ile Başla',
    features: ['Tüm premium tasarımlar', 'Sınırsız davetli', 'Gelişmiş RSVP ve menü tercihi', 'QR anı albümü', 'Spotify çalma listesi', 'İmzasız davetiye', 'Katılım analitiği'],
  },
  {
    id: 'atolye', name: 'Atölye', price: 3900, period: 'etkinlik başına', tagline: 'Tasarımcı dokunuşu',
    highlighted: false, cta: 'Atölye ile Görüş',
    features: ['Premium paketin tamamı', 'Kişisel tasarımcı desteği', 'Size özel illüstrasyon', 'Baskıya uygun PDF davetiye', '3 etkinlik projesi', 'Öncelikli destek hattı'],
  },
]

export function formatPrice(price) {
  if (price === 0) return 'Ücretsiz'
  return `₺${new Intl.NumberFormat('tr-TR').format(price)}`
}
