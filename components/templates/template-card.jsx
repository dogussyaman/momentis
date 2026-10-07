import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getEventType, getStyle } from '@/lib/data/events'
import { cn } from '@/lib/utils'

export function TemplateCard({ template, className }) {
  const category = getEventType(template.category)
  const style = getStyle(template.style)
  return (
    <Link href={`/tasarimlar/${template.slug}`} className={cn('group block transition-transform duration-500 ease-out hover:-translate-y-1.5', className)} data-testid={`template-card-${template.slug}`}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-br from-midnight to-midnight/80">
        <img src={template.cover} alt={template.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-midnight/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/25 to-transparent transition-opacity duration-700 group-hover:opacity-95" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {template.tags?.includes('web sitesi') ? (
            <Badge className="rounded-full border border-champagne/60 bg-midnight/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-champagne shadow-lg backdrop-blur-md hover:bg-midnight/90">Web Sitesi</Badge>
          ) : (
            <Badge className="rounded-full border border-white/70 bg-white/95 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-midnight shadow-lg backdrop-blur-md hover:bg-white/95">Davetiye</Badge>
          )}
          {template.tier === 'premium' ? (
            <Badge className="rounded-full border border-champagne-dark/40 bg-champagne px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-midnight shadow-lg hover:bg-champagne">Premium</Badge>
          ) : (
            <Badge className="rounded-full border border-white/70 bg-midnight/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur-md hover:bg-midnight/80">Ücretsiz</Badge>
          )}
          {template.is_new && <Badge className="rounded-full border border-midnight/20 bg-ivory px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-midnight shadow-lg hover:bg-ivory">Yeni</Badge>}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-champagne-light [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">{category?.label} · {style?.label}</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <h3 className="font-serif text-2xl leading-none [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">{template.name}</h3>
              <p className="mt-1.5 text-xs text-ivory/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">{template.tagline}</p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/60 bg-midnight/50 backdrop-blur-sm transition-all duration-500 group-hover:border-champagne group-hover:bg-champagne group-hover:text-midnight">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {Object.values(template.palette || {}).slice(0, 4).map((c, i) => (
          <span key={`${c}-${i}`} className="h-2.5 w-2.5 rounded-full border border-midnight/10" style={{ backgroundColor: c }} />
        ))}
        <span className="ml-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{template.layout}</span>
      </div>
    </Link>
  )
}
