import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowUpRight, Eye } from 'lucide-react'
import { TemplateGallery } from '@/components/templates/template-gallery'
import { Skeleton } from '@/components/ui/skeleton'
import { TEMPLATES as SITE_TEMPLATES } from '@/lib/site-builder/templates'

export const metadata = {
  title: 'Tasarımlar | MOMENTIS',
  description: 'Düğün, nişan, kına ve özel günler için editoryal dijital davetiye tasarımları.',
}

export default function TemplatesPage() {
  const siteTemplates = SITE_TEMPLATES

  return (
    <div className="bg-ivory pb-28 pt-36">
      <div className="container">
        <div className="max-w-3xl">
          <p className="mb-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-champagne-dark"><span className="h-px w-8 bg-current" /> Koleksiyon</p>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-midnight md:text-6xl">
            Hikâyenize yakışan <span className="italic text-champagne-dark">tasarımı</span> bulun.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">Her tasarım, renkleri ve bloklarıyla tamamen özelleştirilebilir. Etkinlik türünüze göre filtreleyin.</p>
        </div>
        <div className="mt-14">
          <Suspense fallback={
            <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="block">
                  <Skeleton className="aspect-[3/4] w-full rounded-2xl bg-midnight/5" />
                  <div className="mt-3 flex items-center gap-1.5">
                    {Array.from({ length: 4 }).map((_, j) => (
                       <Skeleton key={j} className="h-2.5 w-2.5 rounded-full bg-midnight/5" />
                    ))}
                    <Skeleton className="ml-2 h-3 w-16 bg-midnight/5" />
                  </div>
                </div>
              ))}
            </div>
          }>
            <TemplateGallery />
          </Suspense>
        </div>

        <div className="mt-20 border-t border-midnight/10 pt-12">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-champagne-dark"><span className="h-px w-8 bg-current" /> Hazır web sitesi</p>
              <h2 className="font-serif text-4xl leading-tight text-midnight md:text-5xl">Tam hazırlanmış <span className="italic text-champagne-dark">site şablonları</span></h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Düğün web siteniz için düzenlenmiş, canlı önizleme odaklı görünümler. Her biri farklı bir hikâye ve stil sunar.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {siteTemplates.map((template) => (
              <Link
                key={template.id}
                href={`/panel/sablonlar/${template.id}`}
                className="group overflow-hidden rounded-[26px] border border-midnight/10 bg-white shadow-[0_18px_60px_-36px_rgba(16,24,39,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-midnight/20 hover:shadow-xl"
                data-testid={`marketing-site-template-${template.id}`}
              >
                <div className="relative aspect-[1.55/1] overflow-hidden bg-midnight/5">
                  <img src={template.preview} alt={`${template.name} web sitesi önizlemesi`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/35 bg-midnight/30 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                    <Eye className="h-3.5 w-3.5" /> Önizleme
                  </span>
                  <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-midnight transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-0.5 group-hover:bg-champagne">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-2xl text-midnight">{template.name}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">{template.tagline}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-midnight/8 pt-4">
                    <div className="flex items-center gap-1.5" aria-label="Renk paleti">
                      {template.swatches.map((color) => (
                        <span key={color} className="h-4 w-4 rounded-full border border-midnight/10" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-midnight/60 transition-colors group-hover:text-midnight">Şablonu gör</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
