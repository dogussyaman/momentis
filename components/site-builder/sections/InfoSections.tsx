'use client'

import { Gift, Home, MapPin, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Reveal, SectionHeading, SectionShell, SbImage, SiteButtons, type SectionComponentProps, useSiteRender } from '../render/primitives'

export function GiftSection({ section, props }: SectionComponentProps) {
  const [copied, setCopied] = useState<string | null>(null)
  
  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }
  
  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />
      
      {props.variant === 'minimal' ? (
        <Reveal className="max-w-2xl mx-auto flex flex-col gap-6 text-[15px] leading-relaxed sb-muted">
           <Gift className="w-8 h-8 mx-auto opacity-50 mb-2" />
           <p className="whitespace-pre-line">{props.message}</p>
        </Reveal>
      ) : (
        <Reveal className="sb-card max-w-xl mx-auto p-8 @2xl:p-12 shadow-xl flex flex-col gap-8">
          {props.message && <p className="text-[15px] leading-relaxed sb-muted">{props.message}</p>}
          
          {props.bankInfo && (
            <div className="flex flex-col gap-4 text-left bg-black/5 p-6 rounded-lg">
              <h4 className="font-medium text-foreground">Banka Hesap Bilgileri</h4>
              <div className="flex flex-col gap-2 font-mono text-sm">
                <div className="flex justify-between items-center group">
                  <span className="opacity-80">IBAN:</span>
                  <div className="flex items-center gap-3">
                    <span>{props.bankInfo.iban}</span>
                    <button onClick={() => copy(props.bankInfo.iban)} className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-black/10 rounded">
                      {copied === props.bankInfo.iban ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="opacity-80">Alıcı:</span>
                  <div className="flex items-center gap-3">
                    <span>{props.bankInfo.name}</span>
                    <button onClick={() => copy(props.bankInfo.name)} className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-black/10 rounded">
                      {copied === props.bankInfo.name ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Reveal>
      )}
    </SectionShell>
  )
}

export function AccommodationSection({ section, props }: SectionComponentProps) {
  const items: any[] = props.items ?? []
  
  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />
      
      <div className={cn("grid gap-8", items.length === 1 ? "max-w-xl mx-auto" : "@2xl:grid-cols-2 lg:grid-cols-3")}>
        {items.map((it) => (
          <Reveal key={it.id} className="sb-card flex flex-col overflow-hidden text-left shadow-lg group">
            {it.image ? (
              <div className="w-full aspect-video overflow-hidden">
                <SbImage src={it.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
              </div>
            ) : (
               <div className="w-full h-32 bg-black/5 flex items-center justify-center">
                 <Home className="w-8 h-8 opacity-20" />
               </div>
            )}
            <div className="p-6 flex flex-col gap-3">
              <h3 className="sb-heading text-xl">{it.name}</h3>
              {it.desc && <p className="text-sm sb-muted line-clamp-2">{it.desc}</p>}
              <div className="flex flex-col gap-1.5 mt-2 text-sm">
                 <div className="flex items-start gap-2 opacity-80">
                   <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                   <span>{it.distance}</span>
                 </div>
              </div>
              <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                {it.url && <a href={it.url} target="_blank" rel="noreferrer" className="text-xs uppercase tracking-widest font-medium border px-3 py-1.5 rounded hover:bg-black/5 transition">Websitesi</a>}
                {it.phone && <a href={`tel:${it.phone}`} className="text-xs uppercase tracking-widest font-medium border px-3 py-1.5 rounded hover:bg-black/5 transition">Ara</a>}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}

export function DresscodeSection({ section, props }: SectionComponentProps) {
  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />
      <Reveal className="max-w-2xl mx-auto flex flex-col gap-10 mt-8">
        <p className="text-lg @2xl:text-xl sb-muted leading-relaxed">{props.text}</p>
        {props.colors && props.colors.length > 0 && (
          <div className="flex flex-col gap-4 items-center">
            <span className="text-xs uppercase tracking-widest opacity-60">Renk Paleti</span>
            <div className="flex gap-4">
              {props.colors.map((c: string, i: number) => (
                <div key={i} className="w-12 h-12 @2xl:w-16 @2xl:h-16 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        )}
        <SiteButtons buttons={props.buttons} />
      </Reveal>
    </SectionShell>
  )
}
