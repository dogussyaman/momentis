import { PenTool, MailCheck, Users, QrCode, Music, BarChart3 } from 'lucide-react'
import { SectionHeading } from '@/components/shared/section-heading'
import { Reveal } from '@/components/shared/reveal'
import { FEATURES } from '@/lib/data/site'

const ICONS = { PenTool, MailCheck, Users, QrCode, Music, BarChart3 }

export function Features() {
  return (
    <section className="bg-midnight py-28 text-ivory" data-testid="features">
      <div className="container">
        <SectionHeading
          tone="light"
          eyebrow="Bir davetiyeden fazlası"
          title={<>Etkinliğinizin tüm akışı, <span className="italic text-champagne-light">tek bir bağlantıda.</span></>}
          description="Davetiye, RSVP, konuk listesi, anı albümü ve analitik. Hepsi birbiriyle konuşan, zarif bir sistem."
        />
        <div className="mt-20 grid gap-px bg-ivory/10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = ICONS[f.icon]
            return (
              <Reveal key={f.title} delay={i * 0.08} className="group bg-midnight p-10 transition-colors duration-500 hover:bg-midnight-700">
                <div className="flex h-12 w-12 items-center justify-center border border-champagne/40 text-champagne transition-all duration-500 group-hover:bg-champagne group-hover:text-midnight">
                  {Icon && <Icon className="h-5 w-5" strokeWidth={1.5} />}
                </div>
                <h3 className="mt-8 font-serif text-2xl">{f.title}</h3>
                <p className="mt-3 leading-relaxed text-ivory/65">{f.description}</p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
