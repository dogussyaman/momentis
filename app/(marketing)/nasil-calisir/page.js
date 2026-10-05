import { HowItWorks } from '@/components/marketing/how-it-works'
import { Features } from '@/components/marketing/features'
import { EditorialSplit } from '@/components/marketing/editorial-split'
import { CTA } from '@/components/marketing/cta'
import { IMAGES } from '@/lib/data/site'

export const metadata = {
  title: 'Nasıl Çalışır | MOMENTIS',
  description: 'Üç adımda dijital davetiyenizi oluşturun, paylaşın ve yönetin.',
}

export default function HowItWorksPage() {
  return (
    <div className="bg-ivory pt-36">
      <div className="container">
        <div className="max-w-3xl">
          <p className="mb-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-champagne-dark"><span className="h-px w-8 bg-current" /> Nasıl Çalışır</p>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-midnight md:text-6xl">Üç adımda, <span className="italic text-champagne-dark">dakikalar içinde</span> yayında.</h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">Tasarım bilgisi gerekmez. Bir fincan kahve süresinde davetiyeniz hazır, paylaşılmaya hazır.</p>
        </div>
      </div>
      <div className="-mt-12"><HowItWorks compact /></div>
      <EditorialSplit
        eyebrow="Canlı Düzenleyici"
        title={<>Canva kadar kolay, <span className="italic text-champagne-dark">stüdyo kadar zarif.</span></>}
        description="Sol panelden blokları seçin, sağda anında önizleyin. Renk paleti, tipografi ve görseller; her şey birkaç tıklama uzaklığında."
        bullets={['Sürükle-bırak blok sıralama', 'Hazır renk paletleri ve yazı tipi eşleşmeleri', 'Mobil ve masaüstü önizleme', 'Otomatik kaydetme']}
        image={IMAGES.stationery}
        imageAlt="Davetiye tasarım detayları"
        cta={{ label: 'Tasarımları keşfet', href: '/tasarimlar' }}
      />
      <Features />
      <CTA />
    </div>
  )
}
