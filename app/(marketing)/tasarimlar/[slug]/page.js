import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InvitationPreview } from '@/components/shared/invitation-preview'
import { TemplateCard } from '@/components/templates/template-card'
import { Reveal } from '@/components/shared/reveal'
import { TEMPLATES, getTemplateBySlug } from '@/lib/data/templates'
import { getEventType, getStyle } from '@/lib/data/events'

export async function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const t = getTemplateBySlug(slug)
  if (!t) return { title: 'Tasarım bulunamadı | MOMENTIS' }
  return { title: `${t.name} | MOMENTIS Tasarımlar`, description: t.description }
}

export default async function TemplateDetailPage({ params }) {
  const { slug } = await params
  const template = getTemplateBySlug(slug)
  if (!template) notFound()

  const category = getEventType(template.category)
  const style = getStyle(template.style)
  const related = TEMPLATES.filter((t) => t.slug !== template.slug && (t.category === template.category || t.style === template.style)).slice(0, 3)

  return (
    <div className="bg-ivory pb-28 pt-32" data-testid="template-detail">
      <div className="container">
        <Link href="/tasarimlar" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-midnight" data-testid="back-to-templates">
          <ArrowLeft className="h-3.5 w-3.5" /> Tüm tasarımlar
        </Link>

        <div className="mt-10 grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div className="relative">
              <div className="absolute inset-0 overflow-hidden">
                <img src={template.cover} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-midnight/40" />
              </div>
              <div className="relative flex items-center justify-center px-8 py-16 md:py-24">
                <div className="w-full max-w-[360px] [container-type:inline-size]">
                  <InvitationPreview template={template} greeting={category?.greeting} />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="lg:col-span-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full border-midnight/20 text-[10px] uppercase tracking-[0.2em]">{category?.label}</Badge>
              <Badge variant="outline" className="rounded-full border-midnight/20 text-[10px] uppercase tracking-[0.2em]">{style?.label}</Badge>
              {template.tier === 'premium' ? (
                <Badge className="rounded-full border-0 bg-champagne text-[10px] uppercase tracking-[0.2em] text-midnight hover:bg-champagne">Premium</Badge>
              ) : (
                <Badge className="rounded-full border-0 bg-midnight text-[10px] uppercase tracking-[0.2em] text-ivory hover:bg-midnight">Ücretsiz</Badge>
              )}
            </div>
            <h1 className="mt-6 font-serif text-5xl leading-[1.05] text-midnight md:text-6xl" data-testid="template-name">{template.name}</h1>
            <p className="mt-3 font-serif text-xl italic text-champagne-dark">{template.tagline}</p>
            <p className="mt-6 leading-relaxed text-muted-foreground">{template.description}</p>

            <div className="mt-8">
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Renk Paleti</p>
              <div className="mt-3 flex gap-3">
                {Object.entries(template.palette).map(([k, c]) => (
                  <div key={k} className="flex flex-col items-center gap-2">
                    <span className="h-10 w-10 rounded-full border border-midnight/10" style={{ backgroundColor: c }} />
                    <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">İçerdiği Bloklar</p>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {template.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-midnight/85"><Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" /> {f}</li>
                ))}
              </ul>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="group h-14 flex-1 rounded-2xl bg-midnight text-[12px] uppercase tracking-[0.2em] text-ivory hover:bg-midnight-700">
                <Link href={`/kayit?tasarim=${template.slug}`} data-testid="start-with-template">Bu Tasarımla Başla <ArrowRight className="ml-3 h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl border-midnight/30 text-[12px] uppercase tracking-[0.2em] text-midnight hover:bg-midnight/5">
                <Link href="/fiyatlandirma">Paketleri Gör</Link>
              </Button>
            </div>
          </Reveal>
        </div>

        {related.length > 0 && (
          <div className="mt-28">
            <p className="mb-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-champagne-dark"><span className="h-px w-8 bg-current" /> Benzer Tasarımlar</p>
            <h2 className="font-serif text-4xl text-midnight">Beğenebileceğiniz diğer tasarımlar</h2>
            <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((t) => <TemplateCard key={t.id} template={t} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
