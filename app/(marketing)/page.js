import { Hero } from '@/components/marketing/hero'
import { TrustStrip } from '@/components/marketing/trust-strip'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { TemplateShowcase } from '@/components/marketing/template-showcase'
import { Features } from '@/components/marketing/features'
import { EditorialSplit } from '@/components/marketing/editorial-split'
import { PricingSection } from '@/components/marketing/pricing-section'
import { CTA } from '@/components/marketing/cta'
import { IMAGES } from '@/lib/data/site'

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <TemplateShowcase />
      <Features />
      <EditorialSplit
        eyebrow="Dijital Mikrosite"
        title={<>Davetiyeniz, düğününüzün <span className="italic text-champagne-dark">dijital evi</span> olsun.</>}
        description="Tek bir bağlantı; hikâyeniz, program akışı, konum, konaklama önerileri, hediye tercihi ve RSVP. Konuklarınız aramak zorunda kalmaz, siz tekrar etmek zorunda kalmazsınız."
        bullets={['Geri sayım ve açılış animasyonu', 'Harita ve ulaşım bilgileri', 'Spotify çalma listesi', 'Yayın sonrası sınırsız düzenleme']}
        image={IMAGES.table}
        imageAlt="Mum ışığında düğün masası"
        cta={{ label: 'Tasarımları keşfet', href: '/tasarimlar' }}
      />
      <EditorialSplit
        reverse
        tone="dark"
        eyebrow="QR Anı Albümü"
        title={<>Gecenin her karesi, <span className="italic text-champagne-light">tek bir albümde.</span></>}
        description="Masalardaki QR kodu okutan konuklarınız, uygulama indirmeden fotoğraflarını ortak albüme yükler. Birlikte paylaştığınız kareler aynı yerde toplanır."
        bullets={['Uygulama gerektirmez', 'Albüm sahibi fotoğrafları yönetebilir', 'Fotoğrafları ZIP olarak indirme', 'Konuklarla paylaşılabilir galeri']}
        image={IMAGES.dance}
        imageAlt="Gün batımında dans eden çift"
        cta={{ label: 'Nasıl çalışır', href: '/nasil-calisir' }}
      />
      <PricingSection />
      <CTA />
    </>
  )
}
