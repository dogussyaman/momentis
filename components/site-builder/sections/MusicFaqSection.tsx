'use client'

import { useState } from 'react'
import { Play, Pause, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal, SectionHeading, SectionShell, SbImage, type SectionComponentProps } from '../render/primitives'

export function MusicSection({ section, props }: SectionComponentProps) {
  const [playing, setPlaying] = useState(false)
  
  return (
    <SectionShell section={section}>
      {props.title && <h2 className="sb-eyebrow mb-8 text-center">{props.title}</h2>}
      
      {props.variant === 'vinyl' ? (
        <Reveal className="flex flex-col items-center gap-6">
          <div className="relative w-48 h-48 @2xl:w-64 @2xl:h-64 cursor-pointer" onClick={() => setPlaying(!playing)}>
            <div className={cn("absolute inset-0 rounded-full bg-black shadow-2xl transition-transform duration-1000", playing && "sb-spin-slow")}>
               <div className="absolute inset-2 rounded-full border border-[#222] shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]" />
               <div className="absolute inset-6 rounded-full border border-[#333]" />
               <div className="absolute inset-10 rounded-full border border-[#222]" />
               <div className="absolute inset-[30%] rounded-full overflow-hidden">
                 <SbImage src={props.cover} className="w-full h-full object-cover" />
               </div>
               <div className="absolute inset-[46%] rounded-full bg-[#111] border border-white/20" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="sb-heading text-2xl">{props.songTitle}</h3>
            <p className="sb-muted text-sm mt-1">{props.artist}</p>
          </div>
          <button onClick={() => setPlaying(!playing)} className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition">
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
          </button>
        </Reveal>
      ) : props.variant === 'minimal' ? (
        <Reveal className="flex flex-col items-center text-center gap-4">
           <h3 className="sb-heading text-4xl">{props.songTitle}</h3>
           <p className="sb-muted italic">{props.artist}</p>
           <button onClick={() => setPlaying(!playing)} className="mt-4 flex items-center gap-3 px-6 py-2.5 rounded-full border hover:bg-black/5 transition">
             {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
             <span className="text-xs uppercase tracking-widest font-medium">{playing ? 'Durdur' : 'Dinle'}</span>
           </button>
        </Reveal>
      ) : (
        <Reveal className="sb-card p-4 @2xl:p-6 flex items-center gap-4 @2xl:gap-6 mx-auto max-w-md shadow-lg">
           <div className={cn("w-20 h-20 @2xl:w-24 @2xl:h-24 rounded-md overflow-hidden shrink-0 shadow-md", playing && "animate-pulse")}>
             <SbImage src={props.cover} className="w-full h-full object-cover" />
           </div>
           <div className="flex-1 text-left">
             <h3 className="sb-heading text-xl">{props.songTitle}</h3>
             <p className="sb-muted text-sm">{props.artist}</p>
           </div>
           <button onClick={() => setPlaying(!playing)} className="w-12 h-12 shrink-0 rounded-full sb-bg-accent text-white flex items-center justify-center hover:scale-105 transition">
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
           </button>
        </Reveal>
      )}
    </SectionShell>
  )
}

export function FaqSection({ section, props }: SectionComponentProps) {
  const items: any[] = props.items ?? []
  const [openId, setOpen] = useState(items[0]?.id)
  
  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />
      
      {props.layout === 'grid' ? (
        <div className="grid @3xl:grid-cols-2 gap-x-12 gap-y-10 text-left">
          {items.map(it => (
            <Reveal key={it.id} className="flex flex-col gap-3">
              <h3 className="sb-heading text-xl">{it.q}</h3>
              <p className="text-[15px] leading-relaxed sb-muted">{it.a}</p>
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto flex flex-col gap-3 text-left">
          {items.map(it => (
            <Reveal key={it.id} className="sb-card overflow-hidden">
              <button 
                onClick={() => setOpen(openId === it.id ? null : it.id)}
                className="w-full flex items-center justify-between p-5 @2xl:p-6 text-left"
              >
                <h3 className="sb-heading text-lg @2xl:text-xl pr-4">{it.q}</h3>
                <span className="shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-muted-foreground">
                  {openId === it.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>
              <div 
                className={cn("px-5 @2xl:px-6 overflow-hidden transition-all duration-300", openId === it.id ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0")}
              >
                <p className="text-[15px] leading-relaxed sb-muted">{it.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </SectionShell>
  )
}
