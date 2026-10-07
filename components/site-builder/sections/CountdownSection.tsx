'use client'

import { cn } from '@/lib/utils'
import { Reveal, SectionHeading, SectionShell, SiteButtons, type SectionComponentProps, useCountdown, useSiteRender } from '../render/primitives'

export function CountdownSection({ section, props }: SectionComponentProps) {
  const { site } = useSiteRender()
  const target = props.targetDate || site.settings.eventDate
  const c = useCountdown(target)
  const v = props.variant ?? 'boxes'
  const secs = props.showSeconds !== false

  const items = [
    [c.days, 'Gün'],
    [c.hours, 'Saat'],
    [c.minutes, 'Dakika'],
    ...(secs ? [[c.seconds, 'Saniye']] : []),
  ] as const

  const display = c.done && c.valid ? (
    <Reveal className="sb-heading text-3xl @3xl:text-5xl my-10">{props.finishedText}</Reveal>
  ) : !c.valid ? (
    <Reveal className="my-10 italic opacity-50">Tarih ayarlanmadı</Reveal>
  ) : (
    <Reveal className={cn("grid gap-4 @2xl:gap-8 my-10", secs ? "grid-cols-4" : "grid-cols-3")}>
      {items.map(([val, label]) => (
        <div 
          key={label} 
          className={cn(
            "flex flex-col items-center justify-center p-4 @2xl:p-6",
            v === 'boxes' && "sb-card shadow-lg bg-background/90 backdrop-blur",
            v === 'circles' && "border-2 rounded-full aspect-square w-24 h-24 @2xl:w-32 @2xl:h-32 mx-auto"
          )}
          style={v === 'circles' ? { borderColor: 'var(--sb-accent)' } : undefined}
        >
          <span className={cn("sb-heading tabular-nums", v === 'boxes' ? 'text-4xl @2xl:text-6xl' : 'text-3xl @2xl:text-5xl')}>{String(val).padStart(2, '0')}</span>
          <span className={cn("sb-eyebrow mt-1 @2xl:mt-2", v === 'minimal' && 'sb-accent')}>{label}</span>
        </div>
      ))}
    </Reveal>
  )

  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />
      {display}
      <SiteButtons buttons={props.buttons} />
    </SectionShell>
  )
}
