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

export function FooterSection({ section, props }: SectionComponentProps) {
  const instagram = String(props.instagram ?? '').trim().replace(/^@/, '')
  return (
    <SectionShell section={section} noContainer>
      <footer className="flex w-full flex-col items-center justify-center gap-4 px-6 py-14 text-center">
        {props.monogram && <p className="sb-script sb-accent text-4xl">{props.monogram}</p>}
        {props.title && <h2 className="sb-heading text-2xl">{props.title}</h2>}
        {props.text && <p className="max-w-md whitespace-pre-line text-sm sb-muted">{props.text}</p>}
        {props.date && <p className="sb-eyebrow">{props.date}</p>}
        {props.hashtag && <p className="text-sm sb-accent">{props.hashtag}</p>}
        {instagram && (
          <a href={`https://www.instagram.com/${encodeURIComponent(instagram)}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs sb-accent transition hover:opacity-70">
            <Instagram className="h-4 w-4" /> @{instagram}
          </a>
        )}
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
