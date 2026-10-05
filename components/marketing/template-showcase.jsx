import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionHeading } from '@/components/shared/section-heading'
import { Reveal } from '@/components/shared/reveal'
import { TemplateCard } from '@/components/templates/template-card'
import { getFeaturedTemplates } from '@/lib/data/templates'

export function TemplateShowcase() {
  const templates = getFeaturedTemplates(6)
  return (
    <section className="bg-ivory-50 py-28" data-testid="template-showcase">
      <div className="container">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Koleksiyon"
            title={<>Editoryal tasarımlar, <span className="italic text-champagne-dark">size özel</span> hikâyeler.</>}
            description="Her tasarım bir stüdyo titizliğiyle hazırlandı. Renkleri, yazı tiplerini ve blokları kendi hikâyenize göre şekillendirin."
          />
          <Reveal delay={0.2}>
            <Link href="/tasarimlar" className="group inline-flex items-center gap-3 border-b border-midnight pb-1 text-[12px] uppercase tracking-[0.22em] text-midnight" data-testid="showcase-all-link">
              Tüm tasarımları gör <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 0.1} className={i % 3 === 1 ? 'lg:translate-y-12' : ''}>
              <TemplateCard template={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
