import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Reveal } from '@/components/shared/reveal'
import { cn } from '@/lib/utils'

export function EditorialSplit({ eyebrow, title, description, bullets = [], image, imageAlt = '', cta, reverse = false, tone = 'ivory' }) {
  const dark = tone === 'dark'
  return (
    <section className={cn('py-28', dark ? 'bg-midnight text-ivory' : 'bg-ivory text-midnight')}>
      <div className="container">
        <div className={cn('grid items-center gap-16 lg:grid-cols-12', reverse && 'lg:[&>*:first-child]:order-2')}>
          <Reveal className="lg:col-span-6">
            <div className="relative">
              <div className={cn('absolute -inset-4 border', dark ? 'border-champagne/30' : 'border-champagne/50')} style={{ transform: reverse ? 'translate(-12px, 12px)' : 'translate(12px, 12px)' }} />
              <div className="relative aspect-[4/5] overflow-hidden">
                <img src={image} alt={imageAlt} loading="lazy" className="h-full w-full object-cover" />
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.15} className="lg:col-span-5 lg:col-start-8">
            <p className={cn('mb-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em]', dark ? 'text-champagne-light' : 'text-champagne-dark')}>
              <span className="h-px w-8 bg-current" /> {eyebrow}
            </p>
            <h2 className="font-serif text-4xl leading-[1.08] tracking-tight md:text-5xl">{title}</h2>
            <p className={cn('mt-6 text-lg leading-relaxed', dark ? 'text-ivory/70' : 'text-muted-foreground')}>{description}</p>
            {bullets.length > 0 && (
              <ul className="mt-8 space-y-3">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" /> <span className={dark ? 'text-ivory/85' : 'text-midnight/85'}>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            {cta && (
              <Link href={cta.href} className={cn('group mt-10 inline-flex items-center gap-3 border-b pb-1 text-[12px] uppercase tracking-[0.22em]', dark ? 'border-ivory text-ivory' : 'border-midnight text-midnight')}>
                {cta.label} <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
