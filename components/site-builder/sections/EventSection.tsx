'use client'

import { cn } from '@/lib/utils'
import { editableTextAttributes, editableTextStyle, Reveal, SectionHeading, SectionShell, SbImage, SiteButton, useSiteRender, type SectionComponentProps } from '../render/primitives'

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
  const { mode } = useSiteRender()
  const layout = props.layout ?? 'cards'
  const items: any[] = props.events ?? []
  const editable = (index: number, key: string) => editableTextAttributes(section, `events.${index}.${key}`, mode)
  const inlineStyle = (index: number, key: string) => editableTextStyle(props, `events.${index}.${key}`)

  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />

      {layout === 'cards' && (
        <div className={cn('mx-auto grid w-full gap-5 text-center', items.length === 1 ? 'max-w-2xl grid-cols-1' : 'max-w-5xl @3xl:grid-cols-2')}>
          {items.map((ev, i) => (
            <Reveal key={`${section.id}-event-${ev.id ?? 'item'}-${i}`} className="sb-card flex flex-col items-center gap-3 rounded-3xl border border-current/10 bg-white/75 p-6 shadow-sm @3xl:p-8">
              {ev.image && <SbImage src={ev.image} className="mb-1 h-16 w-16 rounded-2xl object-cover" />}
              <h3 {...editable(i, 'name')} className="sb-heading text-xl @3xl:text-2xl" style={inlineStyle(i, 'name')}>{ev.name}</h3>
              <div className="flex flex-col gap-1 text-sm sb-muted">
                <span className="font-medium text-foreground">{formatDate(ev.date) || ev.date}</span>
                <span>Saat: {ev.time || formatTime(ev.date)}</span>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <span {...editable(i, 'venue')} className="font-semibold text-foreground text-sm" style={inlineStyle(i, 'venue')}>{ev.venue}</span>
                <span {...editable(i, 'address')} className="text-sm sb-muted" style={inlineStyle(i, 'address')}>{ev.address}</span>
              </div>
              {ev.note && <span {...editable(i, 'note')} className="mt-1 text-sm italic sb-accent" style={inlineStyle(i, 'note')}>{ev.note}</span>}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {props.showMap && (
                  <SiteButton
                    button={{ id: 'map', action: 'map', target: ev.address || ev.venue, label: 'Harita', variant: 'outline', icon: 'MapPin' }}
                  />
                )}
                {props.showCalendar && (
                  <SiteButton
                    button={{ id: `cal-${ev.id}`, action: 'calendar', target: ev.date, eventTitle: ev.name, eventLocation: [ev.venue, ev.address].filter(Boolean).join(', '), label: 'Takvime Ekle', variant: 'solid', icon: 'CalendarPlus' }}
                  />
                )}
                {ev.link && <SiteButton button={{ id: `link-${ev.id}`, action: 'link', target: ev.link, label: 'Detaylar', variant: 'outline', icon: 'ExternalLink' }} />}
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {layout === 'split' && (
        <div className="flex flex-col gap-16 @3xl:gap-24">
          {items.map((ev, i) => (
            <Reveal key={`${section.id}-event-${ev.id ?? 'item'}-${i}`} className={cn('grid @3xl:grid-cols-2 gap-8 @3xl:gap-16 items-center', i % 2 === 1 && '@3xl:flex-row-reverse')}>
              <div className={cn(i % 2 === 1 ? '@3xl:order-2' : '@3xl:order-1')}>
                {ev.image ? (
                  <SbImage src={ev.image} className="w-full aspect-[4/5] sb-radius object-cover shadow-xl" />
                ) : (
                  <div className="w-full aspect-[4/5] bg-black/5 sb-radius" />
                )}
              </div>
              <div className={cn('flex flex-col gap-6 text-center @3xl:text-left', i % 2 === 1 ? '@3xl:order-1' : '@3xl:order-2')}>
                <div>
                  <h3 {...editable(i, 'name')} className="sb-heading text-3xl @3xl:text-5xl" style={inlineStyle(i, 'name')}>{ev.name}</h3>
                  <div className="text-lg @3xl:text-xl sb-accent mt-3">{formatDate(ev.date) || ev.date} · {ev.time || formatTime(ev.date)}</div>
                </div>
                <div className="sb-muted text-[15px] leading-relaxed max-w-md mx-auto @3xl:mx-0">
                  <p {...editable(i, 'venue')} className="font-semibold text-foreground mb-1" style={inlineStyle(i, 'venue')}>{ev.venue}</p>
                  <p {...editable(i, 'address')} style={inlineStyle(i, 'address')}>{ev.address}</p>
                  {ev.note && <p {...editable(i, 'note')} className="italic mt-3 opacity-80" style={inlineStyle(i, 'note')}>{ev.note}</p>}
                </div>
                <div className="flex flex-wrap justify-center @3xl:justify-start gap-3 mt-2">
                  {props.showMap && (
                    <SiteButton button={{ id: 'map', action: 'map', target: ev.address || ev.venue, label: 'Yol Tarifi', variant: 'outline' }} />
                  )}
                  {props.showCalendar && (
                    <SiteButton button={{ id: `cal-${ev.id}`, action: 'calendar', target: ev.date, eventTitle: ev.name, eventLocation: [ev.venue, ev.address].filter(Boolean).join(', '), label: 'Takvim', variant: 'ghost' }} />
                  )}
                  {ev.link && <SiteButton button={{ id: `link-${ev.id}`, action: 'link', target: ev.link, label: 'Detaylar', variant: 'outline', icon: 'ExternalLink' }} />}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {layout === 'list' && (
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          {items.map((ev, i) => (
            <Reveal key={`${section.id}-event-${ev.id ?? 'item'}-${i}`} className="flex flex-col @2xl:flex-row gap-6 @2xl:gap-8 items-center @2xl:items-start text-center @2xl:text-left py-8 border-b last:border-0 border-border/50">
              <div className="w-32 shrink-0">
                <div className="sb-heading text-xl">{ev.time || formatTime(ev.date)}</div>
                <div className="text-sm sb-accent mt-1">{formatDate(ev.date) || ev.date}</div>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <h3 {...editable(i, 'name')} className="sb-heading text-2xl" style={inlineStyle(i, 'name')}>{ev.name}</h3>
                <p {...editable(i, 'venue')} className="font-medium" style={inlineStyle(i, 'venue')}>{ev.venue}</p>
                <p {...editable(i, 'address')} className="text-sm sb-muted" style={inlineStyle(i, 'address')}>{ev.address}</p>
                {ev.note && <p {...editable(i, 'note')} className="text-sm italic sb-accent mt-1" style={inlineStyle(i, 'note')}>{ev.note}</p>}
              </div>
              <div className="flex @2xl:flex-col gap-2 shrink-0 w-full @2xl:w-32 mt-4 @2xl:mt-0">
                {props.showMap && (
                     <SiteButton button={{ id: `map-${ev.id}`, action: 'map', target: ev.address || ev.venue, label: 'Harita', variant: 'outline', icon: 'MapPin' }} size="sm" />
                )}
                 {props.showCalendar && (
                     <SiteButton button={{ id: `cal-${ev.id}`, action: 'calendar', target: ev.date, eventTitle: ev.name, eventLocation: [ev.venue, ev.address].filter(Boolean).join(', '), label: 'Takvim', variant: 'solid', icon: 'CalendarPlus' }} size="sm" />
                )}
                  {ev.link && <SiteButton button={{ id: `link-${ev.id}`, action: 'link', target: ev.link, label: 'Detaylar', variant: 'outline', icon: 'ExternalLink' }} size="sm" />}
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
          <div className="absolute bottom-2 left-[11px] top-2 w-px bg-current opacity-15" />
          <div className="flex flex-col gap-4">
            {items.map((it) => (
              <Reveal key={it.id} className="sb-card relative ml-10 rounded-2xl border border-current/10 bg-white/70 p-4 @2xl:p-5">
                 <span className="absolute -left-[41px] top-5 flex h-[23px] w-[23px] items-center justify-center rounded-full border-2" style={{ borderColor: 'var(--sb-accent)', background: 'var(--sb-bg)' }}>
                  <span className="w-2 h-2 rounded-full sb-bg-accent" />
                </span>
                <div className="mb-1 text-xs font-semibold tracking-wide sb-accent">{it.time}</div>
                <h3 className="sb-heading text-lg @2xl:text-xl">{it.title}</h3>
                {it.desc && <p className="mt-1 text-sm leading-relaxed sb-muted">{it.desc}</p>}
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
