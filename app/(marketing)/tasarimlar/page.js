import { Suspense } from 'react'
import { TemplateGallery } from '@/components/templates/template-gallery'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Tasarımlar | MOMENTIS',
  description: 'Düğün, nişan, kına ve özel günler için editoryal dijital davetiye tasarımları.',
}

export default function TemplatesPage() {
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
      </div>
    </div>
  )
}
