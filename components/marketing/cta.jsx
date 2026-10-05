import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/shared/reveal'
import { IMAGES } from '@/lib/data/site'

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-midnight py-36 text-ivory" data-testid="cta">
      <img src={IMAGES.sparklers} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-midnight via-midnight/60 to-midnight" />
      <div className="container relative text-center">
        <Reveal>
          <p className="mb-6 text-[11px] uppercase tracking-[0.32em] text-champagne">Hikâyeniz başlasın</p>
          <h2 className="mx-auto max-w-3xl font-serif text-5xl leading-[1.05] md:text-6xl">
            İlk davetiyenizi <span className="italic text-champagne-light">bu akşam</span> paylaşın.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-ivory/70">Ücretsiz başlayın, beğendiğinizde Premium’a geçin. Kredi kartı gerekmez.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="group h-14 rounded-2xl bg-champagne px-8 text-[13px] uppercase tracking-[0.18em] text-midnight hover:bg-champagne-light">
              <Link href="/kayit" data-testid="cta-register">Ücretsiz Başla <ArrowRight className="ml-3 h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl border-ivory/30 bg-transparent px-8 text-[13px] uppercase tracking-[0.18em] text-ivory hover:bg-ivory/10 hover:text-ivory">
              <Link href="/tasarimlar">Tasarımlara Göz At</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
