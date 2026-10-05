import { Quote } from 'lucide-react'
import { SectionHeading } from '@/components/shared/section-heading'
import { Reveal } from '@/components/shared/reveal'
import { TESTIMONIALS } from '@/lib/data/site'

export function Testimonials() {
  return (
    <section className="bg-ivory-50 py-28" data-testid="testimonials">
      <div className="container">
        <SectionHeading align="center" eyebrow="Hikâyeler" title={<>Onlar anlattı, <span className="italic text-champagne-dark">biz dinledik.</span></>} />
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1} className="flex flex-col border border-border bg-ivory p-10">
              <Quote className="h-6 w-6 text-champagne" strokeWidth={1.5} />
              <p className="mt-6 flex-1 font-serif text-xl leading-relaxed text-midnight">“{t.quote}”</p>
              <div className="mt-8 flex items-center gap-4 border-t border-border pt-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-midnight font-serif text-sm text-champagne">{t.initials}</span>
                <div>
                  <p className="text-sm font-medium text-midnight">{t.name}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t.event}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
