import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getEventType, getStyle } from '@/lib/data/events'
import { cn } from '@/lib/utils'

export function TemplateCard({ template, className }) {
  const category = getEventType(template.category)
  const style = getStyle(template.style)
  return (
    <Link href={`/tasarimlar/${template.slug}`} className={cn('group block', className)} data-testid={`template-card-${template.slug}`}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
        <img src={template.cover} alt={template.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 via-midnight/10 to-transparent opacity-80 transition-opacity duration-700 group-hover:opacity-95" />
        <div className="absolute left-4 top-4 flex gap-2">
          {template.tier === 'premium' ? (
            <Badge className="rounded-full border-0 bg-champagne px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-midnight hover:bg-champagne">Premium</Badge>
          ) : (
            <Badge className="rounded-full border border-ivory/40 bg-transparent px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-ivory hover:bg-transparent">Ücretsiz</Badge>
          )}
          {template.is_new && <Badge className="rounded-full border-0 bg-ivory px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-midnight hover:bg-ivory">Yeni</Badge>}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
          <p className="text-[10px] uppercase tracking-[0.3em] text-champagne-light">{category?.label} · {style?.label}</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <h3 className="font-serif text-2xl leading-none">{template.name}</h3>
              <p className="mt-1.5 text-xs text-ivory/70">{template.tagline}</p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-ivory/30 transition-all duration-500 group-hover:border-champagne group-hover:bg-champagne group-hover:text-midnight">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {Object.values(template.palette || {}).slice(0, 4).map((c) => (
          <span key={c} className="h-2.5 w-2.5 rounded-full border border-midnight/10" style={{ backgroundColor: c }} />
        ))}
        <span className="ml-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{template.layout}</span>
      </div>
    </Link>
  )
}
