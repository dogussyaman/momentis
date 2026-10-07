'use client'

import { cn } from '@/lib/utils'
import { Reveal, SectionHeading, SectionShell, SiteButtons, type SectionComponentProps } from '../render/primitives'

export function TextSection({ section, props }: SectionComponentProps) {
  const align = props.align ?? 'center'
  
  return (
    <SectionShell section={section}>
      <Reveal className={cn("max-w-3xl flex flex-col gap-8", align === 'left' ? 'text-left mr-auto' : align === 'right' ? 'text-right ml-auto' : 'text-center mx-auto')}>
        <SectionHeading 
           eyebrow={props.eyebrow} 
           title={props.title} 
           subtitle={props.subtitle} 
           className={align === 'left' ? 'items-start' : align === 'right' ? 'items-end' : 'items-center'} 
        />
        {props.text && (
          <div 
            className="prose prose-sm @2xl:prose-base max-w-none text-[var(--sb-muted)] leading-relaxed whitespace-pre-wrap"
            style={{ textAlign: align }}
          >
            {props.text}
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
  return (
    <SectionShell section={section} noContainer>
      <footer className="w-full py-12 px-6 flex flex-col items-center justify-center text-center gap-4">
        {props.logo && <h2 className="sb-heading text-2xl">{props.logo}</h2>}
        {props.text && <p className="text-sm sb-muted max-w-md">{props.text}</p>}
        {props.showCredits && (
          <div className="mt-8 pt-8 border-t border-current/10 text-xs opacity-50 flex flex-col gap-1">
             <p>Made with Momentis</p>
          </div>
        )}
      </footer>
    </SectionShell>
  )
}
