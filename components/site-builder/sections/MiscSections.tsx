'use client'

import { cn } from '@/lib/utils'
import { editableTextAttributes, editableTextStyle, Reveal, SectionHeading, SectionShell, SiteButtons, useSiteRender, type SectionComponentProps } from '../render/primitives'
import { Instagram } from 'lucide-react'

export function TextSection({ section, props }: SectionComponentProps) {
  const align = props.align ?? 'center'
  const { mode } = useSiteRender()
  const text = props.text ?? props.body
  
  return (
    <SectionShell section={section}>
      <Reveal className={cn("max-w-3xl flex flex-col gap-8", align === 'left' ? 'text-left mr-auto' : align === 'right' ? 'text-right ml-auto' : 'text-center mx-auto')}>
        <SectionHeading 
           eyebrow={props.eyebrow} 
           title={props.title} 
           subtitle={props.subtitle} 
           className={align === 'left' ? 'items-start' : align === 'right' ? 'items-end' : 'items-center'} 
        />
        {text && (
          <div 
            {...editableTextAttributes(section, 'text', mode)}
            className="prose prose-sm @2xl:prose-base max-w-none text-[var(--sb-muted)] leading-relaxed whitespace-pre-wrap"
            style={{ textAlign: align, ...editableTextStyle(props, 'text') }}
          >
            {text}
          </div>
        )}
        <SiteButtons buttons={props.buttons} />
      </Reveal>
    </SectionShell>
  )
}

export function DividerSection({ section, props }: SectionComponentProps) {
  const style = props.style ?? 'line'
  
  return (
    <SectionShell section={section} noContainer>
      <div className={cn("w-full flex items-center justify-center", props.padding === 'none' ? 'py-0' : props.padding === 'large' ? 'py-32' : 'py-16')}>
        <Reveal>
          {style === 'line' && <div className="w-32 h-px bg-current opacity-20" />}
          {style === 'dots' && <div className="flex gap-2 opacity-30"><span className="w-1 h-1 rounded-full bg-current"/><span className="w-1 h-1 rounded-full bg-current"/><span className="w-1 h-1 rounded-full bg-current"/></div>}
          {style === 'icon' && <div className="text-2xl opacity-40">❧</div>}
        </Reveal>
      </div>
    </SectionShell>
  )
}

const FOOTER_LINK_TYPES: Record<string, string> = {
  couple: 'Çift',
  story: 'Hikâyemiz',
  event: 'Etkinlik',
  schedule: 'Program',
  gallery: 'Galeri',
  accommodation: 'Konaklama',
  faq: 'S.S.S.',
  rsvp: 'Katılım',
}

export function FooterSection({ section, props }: SectionComponentProps) {
  const { site } = useSiteRender()
  const layout: string = props.layout ?? 'centered'
  const instagram = String(props.instagram ?? '').trim().replace(/^@/, '')
  const links = (site?.sections ?? [])
    .filter((s) => s.visible && FOOTER_LINK_TYPES[s.type])
    .map((s) => ({ id: s.id, label: FOOTER_LINK_TYPES[s.type] }))
  const venue = site?.settings?.venueName
  const address = site?.settings?.venueAddress

  const social = instagram && (
    <a href={`https://www.instagram.com/${encodeURIComponent(instagram)}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs sb-accent transition hover:opacity-70">
      <Instagram className="h-4 w-4" /> @{instagram}
    </a>
  )
  const credit = props.showCredit && (
    <p className="text-[11px] tracking-wide opacity-50">Momentis ile hazırlandı</p>
  )
  const linkRow = (cls = '') => (
    <nav aria-label="Alt gezinme" className={cn('flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.18em]', cls)}>
      {links.map((l) => (
        <a key={l.id} href={`#section-${l.id}`} className="opacity-70 transition hover:opacity-100 hover:text-[var(--sb-accent)]">{l.label}</a>
      ))}
    </nav>
  )

  if (layout === 'columns') {
    return (
      <SectionShell section={section} noContainer>
        <footer className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
          <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
            <div className="flex flex-col gap-4">
              {props.monogram && <p className="sb-script sb-accent text-5xl">{props.monogram}</p>}
              {props.title && <h2 className="sb-heading text-2xl">{props.title}</h2>}
              {props.text && <p className="max-w-sm whitespace-pre-line text-sm sb-muted">{props.text}</p>}
              {social}
            </div>
            <div className="flex flex-col gap-4">
              <p className="sb-eyebrow">Keşfet</p>
              <div className="flex flex-col gap-2.5 text-sm">
                {links.map((l) => (
                  <a key={l.id} href={`#section-${l.id}`} className="w-fit opacity-75 transition hover:translate-x-1 hover:opacity-100 hover:text-[var(--sb-accent)]">{l.label}</a>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <p className="sb-eyebrow">Detaylar</p>
              <div className="flex flex-col gap-2 text-sm">
                {props.date && <p className="sb-accent text-lg sb-heading">{props.date}</p>}
                {venue && <p>{venue}</p>}
                {address && <p className="sb-muted">{address}</p>}
                {props.hashtag && <p className="sb-accent">{props.hashtag}</p>}
              </div>
              <SiteButtons buttons={props.buttons} />
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-current/10 pt-6 text-[11px] opacity-70 sm:flex-row">
            <p>© {new Date().getFullYear()} {site?.title}</p>
            {credit}
          </div>
        </footer>
      </SectionShell>
    )
  }

  if (layout === 'split') {
    return (
      <SectionShell section={section} noContainer>
        <footer className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14 sm:px-10">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="flex flex-col gap-3">
              {props.monogram && <p className="sb-script sb-accent text-5xl">{props.monogram}</p>}
              {props.title && <h2 className="sb-heading max-w-xl text-3xl leading-tight md:text-4xl">{props.title}</h2>}
              {props.text && <p className="max-w-md whitespace-pre-line text-sm sb-muted">{props.text}</p>}
            </div>
            <div className="flex flex-col gap-3 md:items-end md:text-right">
              {props.date && <p className="sb-eyebrow">{props.date}</p>}
              {props.hashtag && <p className="sb-accent text-lg sb-heading">{props.hashtag}</p>}
              {social}
              <SiteButtons buttons={props.buttons} />
            </div>
          </div>
          <div className="flex flex-col items-start justify-between gap-4 border-t border-current/10 pt-6 md:flex-row md:items-center">
            {linkRow()}
            {credit}
          </div>
        </footer>
      </SectionShell>
    )
  }

  if (layout === 'minimal') {
    return (
      <SectionShell section={section} noContainer>
        <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-5 px-6 py-8 sm:flex-row sm:px-10">
          <div className="flex items-center gap-3">
            {props.monogram && <span className="sb-script sb-accent text-2xl">{props.monogram}</span>}
            {props.date && <span className="sb-eyebrow">{props.date}</span>}
          </div>
          {linkRow('justify-center')}
          <div className="flex items-center gap-4 text-xs">
            {props.hashtag && <span className="sb-accent">{props.hashtag}</span>}
            {social}
            {credit}
          </div>
        </footer>
      </SectionShell>
    )
  }

  return (
    <SectionShell section={section} noContainer>
      <footer className="flex w-full flex-col items-center justify-center gap-4 px-6 py-14 text-center">
        {props.monogram && <p className="sb-script sb-accent text-4xl">{props.monogram}</p>}
        {props.title && <h2 className="sb-heading text-2xl">{props.title}</h2>}
        {props.text && <p className="max-w-md whitespace-pre-line text-sm sb-muted">{props.text}</p>}
        {props.date && <p className="sb-eyebrow">{props.date}</p>}
        {props.hashtag && <p className="text-sm sb-accent">{props.hashtag}</p>}
        {social}
        {props.showLinks && links.length > 0 && linkRow('mt-2 justify-center')}
        <SiteButtons buttons={props.buttons} />
        {props.showCredit && (
          <div className="mt-6 flex flex-col gap-1 border-t border-current/10 pt-6 text-xs opacity-50">
             <p>Momentis ile hazırlandı</p>
          </div>
        )}
      </footer>
    </SectionShell>
  )
}
