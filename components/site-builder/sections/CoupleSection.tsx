'use client'

import { cn } from '@/lib/utils'
import { Instagram } from 'lucide-react'
import { Reveal, SectionHeading, SectionShell, SbImage, type SectionComponentProps } from '../render/primitives'

const SHAPES: Record<string, string> = {
  circle: 'rounded-full aspect-square',
  arch: 'rounded-t-[999px] aspect-[3/4]',
  rounded: 'aspect-[3/4]',
  square: 'aspect-[3/4]',
}

function Person({ p, prefix, shape, card, horizontal, reverse }: { p: Record<string, any>; prefix: 'bride' | 'groom'; shape: string; card?: boolean; horizontal?: boolean; reverse?: boolean }) {
  const name = p[`${prefix}Name`]
  const ig = (p[`${prefix}Instagram`] as string | undefined)?.replace('@', '')
  return (
    <Reveal
      className={cn(
        'flex flex-col items-center gap-5 text-center',
        card && 'sb-card rounded-3xl border border-current/10 bg-white/70 p-5 shadow-sm @3xl:p-6',
        horizontal && '@3xl:flex-row @3xl:text-left @3xl:gap-12',
        horizontal && reverse && '@3xl:flex-row-reverse @3xl:text-right',
      )}
    >
      <div className={cn('relative w-full max-w-[230px] shrink-0', horizontal && '@3xl:max-w-[280px]')}>
        <SbImage
          src={p[`${prefix}Photo`]}
          alt={name}
          className={cn('w-full', SHAPES[shape] ?? SHAPES.arch)}
          style={{ borderRadius: shape === 'rounded' ? 'var(--sb-radius)' : undefined }}
        />
        {shape === 'arch' && <div className="pointer-events-none absolute -inset-2 rounded-t-[999px] border opacity-40" style={{ borderColor: 'var(--sb-accent)' }} />}
      </div>
      <div className={cn('flex flex-col gap-2', horizontal ? 'items-center @3xl:items-start' : 'items-center', horizontal && reverse && '@3xl:items-end')}>
        {p[`${prefix}Role`] && <span className="sb-eyebrow sb-accent">{p[`${prefix}Role`]}</span>}
        <h3 className="sb-heading text-3xl @3xl:text-4xl">{name}</h3>
        {p[`${prefix}Parents`] && <p className="text-sm italic sb-muted">{p[`${prefix}Parents`]}</p>}
        {p[`${prefix}Bio`] && <p className="text-[15px] leading-relaxed sb-muted max-w-sm mt-1">{p[`${prefix}Bio`]}</p>}
        {ig && (
          <a href={`https://www.instagram.com/${encodeURIComponent(ig)}/`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs sb-accent transition hover:opacity-70">
            <Instagram className="w-3.5 h-3.5" /> @{ig}
          </a>
        )}
      </div>
    </Reveal>
  )
}

export function CoupleSection({ section, props }: SectionComponentProps) {
  const layout = props.layout ?? 'side'
  const shape = props.photoShape ?? 'arch'
  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />
      {layout === 'stacked' ? (
        <div className="flex flex-col gap-16">
          <Person p={props} prefix="bride" shape={shape} horizontal />
          {props.showAmpersand && <Reveal className="sb-script sb-accent text-6xl text-center">&</Reveal>}
          <Person p={props} prefix="groom" shape={shape} horizontal reverse />
        </div>
      ) : (
        <div className={cn('mx-auto grid w-full max-w-5xl items-center gap-5 @3xl:gap-8', props.showAmpersand && layout === 'side' ? '@3xl:grid-cols-[1fr_auto_1fr]' : '@3xl:grid-cols-2')}>
          <Person p={props} prefix="bride" shape={shape} card={layout === 'cards' || layout === 'side'} />
          {props.showAmpersand && layout === 'side' && <Reveal className="sb-script sb-accent text-7xl @3xl:text-8xl text-center">&</Reveal>}
          <Person p={props} prefix="groom" shape={shape} card={layout === 'cards' || layout === 'side'} />
        </div>
      )}
    </SectionShell>
  )
}

export function StorySection({ section, props }: SectionComponentProps) {
  const layout = props.layout ?? 'zigzag'
  const items: any[] = props.items ?? []
  const showImg = props.showImages !== false

  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />

      {layout === 'cards' && (
        <div className="grid gap-6 @2xl:grid-cols-2 @4xl:grid-cols-3 text-left">
          {items.map((it) => (
            <Reveal key={it.id} className="sb-card overflow-hidden group">
              {showImg && it.image && (
                <div className="overflow-hidden aspect-[4/3]">
                  <SbImage src={it.image} className="w-full h-full transition-transform duration-700 group-hover:scale-105" />
                </div>
              )}
              <div className="p-6 flex flex-col gap-2">
                <span className="sb-eyebrow sb-accent">{it.date}</span>
                <h3 className="sb-heading text-2xl">{it.title}</h3>
                <p className="text-sm leading-relaxed sb-muted">{it.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {layout === 'timeline' && (
        <div className="relative mx-auto max-w-2xl text-left">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-current opacity-20" />
          <div className="flex flex-col gap-12">
            {items.map((it) => (
              <Reveal key={it.id} className="relative pl-12">
                <span className="absolute left-0 top-1 w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'var(--sb-accent)', background: 'var(--sb-bg)' }}>
                  <span className="w-2 h-2 rounded-full sb-bg-accent" />
                </span>
                <span className="sb-eyebrow sb-accent">{it.date}</span>
                <h3 className="sb-heading text-2xl mt-2">{it.title}</h3>
                <p className="text-[15px] leading-relaxed sb-muted mt-2">{it.text}</p>
                {showImg && it.image && <SbImage src={it.image} className="mt-4 w-full aspect-[16/9] sb-radius" />}
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {layout === 'zigzag' && (
        <div className="relative">
          <div className="hidden @3xl:block absolute left-1/2 top-0 bottom-0 w-px bg-current opacity-15" />
          <div className="flex flex-col gap-14 @3xl:gap-20">
            {items.map((it, i) => (
              <Reveal key={it.id} className={cn('relative grid items-center gap-6 @3xl:gap-16 @3xl:grid-cols-2')}>
                <div className={cn('@3xl:order-1', i % 2 === 1 && '@3xl:order-2')}>
                  {showImg && it.image ? (
                    <SbImage src={it.image} className="w-full aspect-[4/3] sb-radius shadow-lg" />
                  ) : (
                    <div className="hidden @3xl:block" />
                  )}
                </div>
                <div className={cn('flex flex-col gap-2 text-center', i % 2 === 0 ? '@3xl:order-2 @3xl:text-left' : '@3xl:order-1 @3xl:text-right')}>
                  <span className="sb-script sb-accent text-3xl">{it.date}</span>
                  <h3 className="sb-heading text-2xl @3xl:text-3xl">{it.title}</h3>
                  <p className="text-[15px] leading-relaxed sb-muted">{it.text}</p>
                </div>
                <span className="hidden @3xl:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rotate-45 sb-bg-accent" />
              </Reveal>
            ))}
          </div>
        </div>
      )}
    </SectionShell>
  )
}
