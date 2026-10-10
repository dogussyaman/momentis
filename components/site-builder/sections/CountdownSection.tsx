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
    <Reveal className="sb-heading text-2xl @3xl:text-4xl">{props.finishedText}</Reveal>
  ) : !c.valid ? (
    <Reveal className="italic opacity-60">Tarih ayarlanmadı</Reveal>
  ) : (
    <Reveal className={cn("grid gap-2 @2xl:gap-4", secs ? "grid-cols-4" : "grid-cols-3")}>
      {items.map(([val, label]) => (
        <div 
          key={label} 
          className={cn(
            "flex min-w-0 flex-col items-center justify-center rounded-2xl px-2 py-3 @2xl:px-4 @2xl:py-5",
            v === 'boxes' && "border border-current/10 bg-white/75 shadow-sm backdrop-blur",
            v === 'circles' && "aspect-square w-full max-w-24 @2xl:max-w-32 mx-auto border"
          )}
          style={v === 'circles' || v === 'boxes' ? { borderColor: 'color-mix(in srgb, var(--sb-accent) 22%, transparent)' } : undefined}
        >
          <span className={cn("sb-heading tabular-nums leading-none", v === 'boxes' ? 'text-2xl @2xl:text-4xl' : 'text-2xl @2xl:text-4xl')}>{String(val).padStart(2, '0')}</span>
          <span className="mt-2 text-[9px] @2xl:text-[10px] uppercase tracking-[0.16em] opacity-65">{label}</span>
        </div>
      ))}
    </Reveal>
  )

  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-current/10 bg-white/45 p-4 shadow-sm backdrop-blur-sm @2xl:p-7">
        {display}
        <SiteButtons buttons={props.buttons} style={{ marginTop: 20 }} />
      </div>
    </SectionShell>
  )
}
