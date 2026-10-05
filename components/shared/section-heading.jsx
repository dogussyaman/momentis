import { cn } from '@/lib/utils'
import { Reveal } from './reveal'

export function SectionHeading({ eyebrow, title, description, align = 'left', tone = 'dark', className }) {
  const light = tone === 'light'
  return (
    <Reveal className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && (
        <p className={cn('mb-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em]', align === 'center' && 'justify-center', light ? 'text-champagne-light' : 'text-champagne-dark')}>
          <span className="h-px w-8 bg-current" />
          {eyebrow}
        </p>
      )}
      <h2 className={cn('font-serif text-4xl leading-[1.08] tracking-tight md:text-5xl', light ? 'text-ivory' : 'text-midnight')}>
        {title}
      </h2>
      {description && (
        <p className={cn('mt-5 text-base leading-relaxed md:text-lg', light ? 'text-ivory/70' : 'text-muted-foreground')}>
          {description}
        </p>
      )}
    </Reveal>
  )
}
