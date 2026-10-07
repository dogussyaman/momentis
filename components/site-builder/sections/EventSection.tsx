'use client'

import { cn } from '@/lib/utils'
import { CalendarPlus, Map as MapIcon, MapPin } from 'lucide-react'
import { Reveal, SectionHeading, SectionShell, SbImage, SiteButton, type SectionComponentProps } from '../render/primitives'
import { downloadIcs, mapUrl } from '@/lib/site-builder/actions'
import { useSiteRender } from '../render/primitives'

function formatTime(d: string) {
  if (!d) return ''
  const t = new Date(d)
  if (isNaN(t.getTime())) return ''
  return t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(d: string) {
  if (!d) return ''
  const t = new Date(d)
  if (isNaN(t.getTime())) return ''
  return t.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function EventSection({ section, props }: SectionComponentProps) {
  const layout = props.layout ?? 'cards'
  const items: any[] = props.events ?? []
  const { mode } = useSiteRender()

  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />

      {layout === 'cards' && (
        <div className="grid gap-6 @3xl:grid-cols-2 text-center">
          {items.map((ev, i) => (
            <Reveal key={ev.id} className="sb-card p-8 @3xl:p-12 flex flex-col items-center gap-4">
              {ev.image && <SbImage src={ev.image} className="w-20 h-20 rounded-full mb-2 object-cover" />}
              <h3 className="sb-heading text-2xl @3xl:text-3xl">{ev.name}</h3>
              <div className="flex flex-col gap-1 text-[15px] sb-muted mt-2">
                <span className="font-medium text-foreground">{formatDate(ev.date) || ev.date}</span>
                <span>Saat: {ev.time || formatTime(ev.date)}</span>
              </div>
              <div className="flex flex-col gap-1 mt-4">
                <span className="font-semibold text-foreground text-[15px]">{ev.venue}</span>
                <span className="text-sm sb-muted">{ev.address}</span>
              </div>
              {ev.note && <span className="mt-2 text-sm italic sb-accent">{ev.note}</span>}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                {props.showMap && (
                  <SiteButton
                    button={{ id: 'map', action: 'map', target: ev.address || ev.venue, label: 'Harita', variant: 'outline', icon: 'MapPin' }}
                  />
                )}
                {props.showCalendar && (
                  <SiteButton
                    button={{ id: 'cal', action: 'calendar', target: ev.date, label: 'Takvime Ekle', variant: 'solid', icon: 'CalendarPlus' }}
                  />
                )}
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {layout === 'split' && (
        <div className="flex flex-col gap-16 @3xl:gap-24">
          {items.map((ev, i) => (
            <Reveal key={ev.id} className={cn('grid @3xl:grid-cols-2 gap-8 @3xl:gap-16 items-center', i % 2 === 1 && '@3xl:flex-row-reverse')}>
              <div className={cn(i % 2 === 1 ? '@3xl:order-2' : '@3xl:order-1')}>
                {ev.image ? (
                  <SbImage src={ev.image} className="w-full aspect-[4/5] sb-radius object-cover shadow-xl" />
                ) : (
                  <div className="w-full aspect-[4/5] bg-black/5 sb-radius" />
                )}
              </div>
              <div className={cn('flex flex-col gap-6 text-center @3xl:text-left', i % 2 === 1 ? '@3xl:order-1' : '@3xl:order-2')}>
                <div>
                  <h3 className="sb-heading text-3xl @3xl:text-5xl">{ev.name}</h3>
                  <div className="text-lg @3xl:text-xl sb-accent mt-3">{formatDate(ev.date) || ev.date} · {ev.time || formatTime(ev.date)}</div>
                </div>
                <div className="sb-muted text-[15px] leading-relaxed max-w-md mx-auto @3xl:mx-0">
                  <p className="font-semibold text-foreground mb-1">{ev.venue}</p>
                  <p>{ev.address}</p>
                  {ev.note && <p className="italic mt-3 opacity-80">{ev.note}</p>}
                </div>
                <div className="flex flex-wrap justify-center @3xl:justify-start gap-3 mt-2">
                  {props.showMap && (
                    <SiteButton button={{ id: 'map', action: 'map', target: ev.address || ev.venue, label: 'Yol Tarifi', variant: 'outline' }} />
                  )}
                  {props.showCalendar && (
                    <SiteButton button={{ id: 'cal', action: 'calendar', target: ev.date, label: 'Takvim', variant: 'ghost' }} />
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {layout === 'list' && (
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          {items.map((ev, i) => (
            <Reveal key={ev.id} className="flex flex-col @2xl:flex-row gap-6 @2xl:gap-8 items-center @2xl:items-start text-center @2xl:text-left py-8 border-b last:border-0 border-border/50">
              <div className="w-32 shrink-0">
                <div className="sb-heading text-xl">{ev.time || formatTime(ev.date)}</div>
                <div className="text-sm sb-accent mt-1">{formatDate(ev.date) || ev.date}</div>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <h3 className="sb-heading text-2xl">{ev.name}</h3>
                <p className="font-medium">{ev.venue}</p>
                <p className="text-sm sb-muted">{ev.address}</p>
                {ev.note && <p className="text-sm italic sb-accent mt-1">{ev.note}</p>}
              </div>
              <div className="flex @2xl:flex-col gap-2 shrink-0 w-full @2xl:w-32 mt-4 @2xl:mt-0">
                {props.showMap && (
                   <button type="button" onClick={() => mode === 'live' && window.open(mapUrl(ev.address || ev.venue))} className="flex-1 @2xl:w-full py-2 px-3 border border-border rounded text-[11px] uppercase tracking-widest hover:bg-black/5 transition flex items-center justify-center gap-2"><MapPin className="w-3.5 h-3.5"/> Harita</button>
                )}
                 {props.showCalendar && (
                   <button type="button" onClick={() => mode === 'live' && downloadIcs({ title: ev.name, start: ev.date, location: `${ev.venue}, ${ev.address}` })} className="flex-1 @2xl:w-full py-2 px-3 bg-foreground text-background rounded text-[11px] uppercase tracking-widest hover:opacity-90 transition flex items-center justify-center gap-2"><CalendarPlus className="w-3.5 h-3.5"/> Takvim</button>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

export function ScheduleSection({ section, props }: SectionComponentProps) {
  const layout = props.layout ?? 'timeline'
  const items: any[] = props.items ?? []

  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />

      {layout === 'timeline' && (
        <div className="relative mx-auto max-w-xl text-left">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-current opacity-20" />
          <div className="flex flex-col gap-10">
            {items.map((it) => (
              <Reveal key={it.id} className="relative pl-10">
                 <span className="absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'var(--sb-accent)', background: 'var(--sb-bg)' }}>
                  <span className="w-2 h-2 rounded-full sb-bg-accent" />
                </span>
                <div className="sb-eyebrow sb-accent mb-1">{it.time}</div>
                <h3 className="sb-heading text-xl">{it.title}</h3>
                {it.desc && <p className="text-[15px] sb-muted mt-1">{it.desc}</p>}
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {layout === 'grid' && (
        <div className="grid @2xl:grid-cols-2 gap-4">
          {items.map((it) => (
            <Reveal key={it.id} className="sb-card p-6 flex items-start gap-4 text-left">
              <div className="sb-eyebrow sb-accent w-12 shrink-0 pt-1">{it.time}</div>
              <div>
                <h3 className="sb-heading text-lg">{it.title}</h3>
                {it.desc && <p className="text-[14px] sb-muted mt-1">{it.desc}</p>}
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </SectionShell>
  )
}
