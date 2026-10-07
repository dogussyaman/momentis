'use client'

import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import {
  Reveal, SectionShell, SiteButtons, SbImage, alignToJustify, editableTextAttributes, editableTextStyle, useCountdown, useSiteRender, type SectionComponentProps,
} from '../render/primitives'

function fontClass(f?: string) {
  return f === 'script' ? 'sb-script' : f === 'body' ? 'sb-body font-light' : 'sb-heading'
}

function MiniCountdown() {
  const { site } = useSiteRender()
  const c = useCountdown(site.settings.eventDate)
  if (!c.valid) return null
  const items = [
    [c.days, 'Gün'],
    [c.hours, 'Saat'],
    [c.minutes, 'Dk'],
    [c.seconds, 'Sn'],
  ] as const
  return (
    <Reveal className="flex gap-5 @3xl:gap-8" style={{ justifyContent: 'inherit' }}>
      {items.map(([v, l]) => (
        <div key={l} className="flex flex-col items-center">
          <span className="sb-heading text-2xl @3xl:text-3xl tabular-nums">{String(v).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase tracking-[0.25em] opacity-70 mt-1">{l}</span>
        </div>
      ))}
    </Reveal>
  )
}

export function HeroSection({ section, props }: SectionComponentProps) {
  const { mode } = useSiteRender()
  const layout = props.layout ?? 'center'
  const align = section.style.align ?? 'center'
  const justify = alignToJustify(align)
  const scale = (props.titleSize ?? 100) / 100
  const isScript = props.titleFont === 'script'
  const titleSize = `calc(clamp(${isScript ? '3.4rem' : '2.6rem'}, ${isScript ? '11cqi' : '8cqi'}, ${isScript ? '8rem' : '6rem'}) * ${scale} * var(--sb-heading-scale))`

  const content = (
    <div
      className={cn(
        'relative flex flex-col',
        props.contentBox === 'glass' && 'backdrop-blur-md bg-white/10 border border-white/25 px-8 py-12 @3xl:px-16 @3xl:py-16 shadow-2xl',
        props.contentBox === 'solid' && 'sb-surface px-8 py-12 @3xl:px-16 @3xl:py-16 shadow-xl',
        layout === 'frame' && props.contentBox === 'none' && 'px-8 py-14 @3xl:px-16 @3xl:py-20',
      )}
      style={{
        gap: section.style.elementGap ?? 20,
        alignItems: justify,
        textAlign: align,
        borderRadius: props.contentBox !== 'none' ? 'var(--sb-radius)' : undefined,
        color: props.contentBox === 'solid' ? 'var(--sb-text)' : undefined,
        justifyContent: justify,
      }}
    >
      {layout === 'frame' && (
        <div className="pointer-events-none absolute inset-0 border" style={{ borderColor: 'currentColor', opacity: 0.45, borderRadius: 'inherit' }}>
          <div className="absolute inset-2 border" style={{ borderColor: 'currentColor', opacity: 0.6, borderRadius: 'inherit' }} />
        </div>
      )}
      {props.eyebrow && (
        <Reveal>
          <span {...editableTextAttributes(section, 'eyebrow', mode)} className="sb-eyebrow" style={editableTextStyle(props, 'eyebrow')}>{props.eyebrow}</span>
        </Reveal>
      )}
      <Reveal style={{ marginBottom: section.style.titleMarginBottom ?? 0 }}>
        <h1 {...editableTextAttributes(section, 'title', mode)} className={cn(fontClass(props.titleFont), 'leading-[1.05]')} style={{ fontSize: titleSize, ...editableTextStyle(props, 'title') }}>
          {props.title}
        </h1>
      </Reveal>
      {props.showDivider && (
        <Reveal className="flex items-center gap-3 opacity-80" style={{ justifyContent: justify }}>
          <span className="h-px w-12 bg-current" />
          <span className="text-xs">✦</span>
          <span className="h-px w-12 bg-current" />
        </Reveal>
      )}
      {props.date && (
        <Reveal>
          <p {...editableTextAttributes(section, 'date', mode)} className="sb-heading italic text-lg @3xl:text-2xl opacity-95" style={editableTextStyle(props, 'date')}>{props.date}</p>
        </Reveal>
      )}
      {props.subtitle && (
        <Reveal>
          <p {...editableTextAttributes(section, 'subtitle', mode)} className="max-w-lg text-[15px] @3xl:text-base leading-relaxed opacity-85 whitespace-pre-line" style={editableTextStyle(props, 'subtitle')}>{props.subtitle}</p>
        </Reveal>
      )}
      {props.showCountdown && <MiniCountdown />}
      <SiteButtons buttons={props.buttons} style={{ marginTop: section.style.buttonMarginTop ?? 12 }} />
    </div>
  )

  if (layout === 'split') {
    return (
      <SectionShell section={section} noContainer>
        <div className="grid w-full @3xl:grid-cols-2" style={{ minHeight: section.style.minHeight === 'screen' ? 'var(--sb-screen)' : undefined }}>
          <div className="relative min-h-[380px] overflow-hidden" data-editable-image-section={section.id} data-editable-image-key="sideImage" tabIndex={mode === 'editor' ? 0 : undefined}>
            <Reveal className="absolute inset-0">
              <SbImage src={props.sideImage} className="h-full w-full" />
            </Reveal>
          </div>
          <div className="flex items-center px-8 py-16 @3xl:px-20" style={{ justifyContent: justify }}>
            {content}
          </div>
        </div>
      </SectionShell>
    )
  }

  return (
    <SectionShell section={section} contentClassName={layout === 'bottom' ? 'mt-auto' : undefined}>
      <div className="flex w-full" style={{ justifyContent: justify }}>
        {content}
      </div>
      {props.showScrollHint && layout !== 'bottom' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 sb-scroll-hint">
          <ChevronDown className="w-6 h-6" strokeWidth={1.2} />
        </div>
      )}
    </SectionShell>
  )
}
