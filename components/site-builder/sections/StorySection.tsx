'use client'

import { cn } from '@/lib/utils'
import { Reveal, SectionHeading, SectionShell, SbImage, type SectionComponentProps } from '../render/primitives'

export function StorySection({ section, props }: SectionComponentProps) {
  const layout = props.layout ?? 'zigzag'
  const items: any[] = props.items ?? []
  
  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />

      {layout === 'zigzag' && (
        <div className="relative mx-auto max-w-4xl flex flex-col gap-16 @3xl:gap-32">
          {/* Vertical line for desktop */}
          <div className="hidden @3xl:block absolute left-1/2 top-8 bottom-8 w-px bg-current opacity-20 -translate-x-1/2" />
          
          {items.map((it, i) => (
            <Reveal key={it.id} className={cn("relative grid @3xl:grid-cols-2 gap-8 @3xl:gap-16 items-center", i % 2 === 1 && "@3xl:text-right")}>
              {/* Dot on the line */}
              <div className="hidden @3xl:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[21px] h-[21px] rounded-full border-2 bg-background z-10 items-center justify-center" style={{ borderColor: 'var(--sb-accent)' }}>
                 <div className="w-2 h-2 rounded-full sb-bg-accent" />
              </div>
              
              <div className={cn(i % 2 === 1 && "@3xl:order-2")}>
                {props.showImages && it.image ? (
                  <SbImage src={it.image} className="w-full aspect-[4/3] sb-radius object-cover shadow-xl" />
                ) : (
                  <div className="w-full aspect-[4/3] bg-black/5 sb-radius" />
                )}
              </div>
              
              <div className={cn("flex flex-col gap-4 text-left", i % 2 === 1 && "@3xl:order-1 @3xl:items-end")}>
                <span className="sb-eyebrow sb-accent">{it.date}</span>
                <h3 className="sb-heading text-2xl @3xl:text-4xl">{it.title}</h3>
                <p className="text-[15px] leading-relaxed sb-muted max-w-sm">{it.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {layout === 'timeline' && (
        <div className="relative mx-auto max-w-xl text-left pl-6 @2xl:pl-10">
          <div className="absolute left-[11px] @2xl:left-[21px] top-2 bottom-2 w-px bg-current opacity-20" />
          <div className="flex flex-col gap-16">
            {items.map((it) => (
              <Reveal key={it.id} className="relative">
                 <span className="absolute -left-6 @2xl:-left-10 top-1.5 w-[21px] h-[21px] rounded-full border-2 bg-background flex items-center justify-center" style={{ borderColor: 'var(--sb-accent)' }}>
                  <span className="w-2 h-2 rounded-full sb-bg-accent" />
                </span>
                <div className="flex flex-col gap-4">
                  <span className="sb-eyebrow sb-accent">{it.date}</span>
                  <h3 className="sb-heading text-2xl">{it.title}</h3>
                  <p className="text-[15px] leading-relaxed sb-muted">{it.text}</p>
                  {props.showImages && it.image && (
                     <SbImage src={it.image} className="w-full max-w-xs mt-2 aspect-video sb-radius object-cover shadow-md" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      )}
      
      {layout === 'cards' && (
        <div className="grid @2xl:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((it) => (
             <Reveal key={it.id} className="sb-card flex flex-col text-left overflow-hidden shadow-lg group">
                {props.showImages && it.image && (
                  <div className="w-full aspect-[4/3] overflow-hidden">
                    <SbImage src={it.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                  </div>
                )}
                <div className="p-6 @2xl:p-8 flex flex-col gap-3">
                  <span className="text-xs uppercase tracking-widest font-semibold sb-accent">{it.date}</span>
                  <h3 className="sb-heading text-xl">{it.title}</h3>
                  <p className="text-[14px] leading-relaxed sb-muted mt-2">{it.text}</p>
                </div>
             </Reveal>
          ))}
        </div>
      )}
    </SectionShell>
  )
}
