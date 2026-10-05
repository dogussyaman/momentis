import { PricingSection } from '@/components/marketing/pricing-section'
import { CTA } from '@/components/marketing/cta'
import { Reveal } from '@/components/shared/reveal'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FAQ } from '@/lib/data/site'

export const metadata = {
  title: 'Fiyatlandırma | MOMENTIS',
  description: 'Tek seferlik, şeffaf fiyatlar. Abonelik yok, gizli ücret yok.',
}

export default function PricingPage() {
  return (
    <div className="bg-ivory pt-36">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-champagne-dark"><span className="h-px w-8 bg-current" /> Fiyatlandırma</p>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-midnight md:text-6xl">Tek seferlik, <span className="italic text-champagne-dark">şeffaf</span> fiyatlar.</h1>
          <p className="mt-6 text-lg text-muted-foreground">Abonelik yok, gizli ücret yok. Etkinliğiniz için bir kez ödeyin; davetiyeniz 12 ay boyunca yayında kalsın.</p>
        </div>
      </div>
      <div className="-mt-16">
        <PricingSection showHeading={false} />
      </div>

      <section className="bg-ivory-50 py-28" data-testid="faq">
        <div className="container grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="mb-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-champagne-dark"><span className="h-px w-8 bg-current" /> Sık Sorulanlar</p>
            <h2 className="font-serif text-4xl leading-[1.08] text-midnight">Aklınıza takılanlar</h2>
            <p className="mt-4 text-muted-foreground">Başka bir sorunuz mu var? <a href="mailto:merhaba@momentis.app" className="border-b border-midnight text-midnight">Bize yazın</a>.</p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-8">
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((item, i) => (
                <AccordionItem key={item.q} value={`faq-${i}`} className="border-border">
                  <AccordionTrigger className="py-6 text-left font-serif text-xl text-midnight hover:no-underline" data-testid={`faq-trigger-${i}`}>{item.q}</AccordionTrigger>
                  <AccordionContent className="pb-6 leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>
      <CTA />
    </div>
  )
}
