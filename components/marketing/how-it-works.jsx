import { SectionHeading } from '@/components/shared/section-heading'
import { Reveal } from '@/components/shared/reveal'
import { STEPS } from '@/lib/data/site'

export function HowItWorks({ compact = false }) {
  return (
    <section className="bg-ivory py-28" data-testid="how-it-works">
      <div className="container">
        {!compact && (
          <SectionHeading
            eyebrow="Nasıl Çalışır"
            title={<>Üç adımda, <span className="italic text-champagne-dark">dakikalar içinde</span> yayında.</>}
            description="Tasarım bilgisi gerekmez. Bir fincan kahve süresinde davetiyeniz hazır, paylaşılmaya hazır."
          />
        )}
        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 0.12} className="group relative border-t border-midnight/15 pt-8">
              <span className="absolute -top-px left-0 h-px w-0 bg-champagne transition-all duration-700 group-hover:w-full" />
              <p className="font-serif text-6xl text-champagne/60">{step.number}</p>
              <h3 className="mt-6 font-serif text-2xl text-midnight">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{step.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
