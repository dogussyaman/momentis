'use client'

import { useState } from 'react'
import { MessageSquareQuote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal, SectionHeading, SectionShell, type SectionComponentProps, useSiteRender } from '../render/primitives'

export function GuestbookSection({ section, props }: SectionComponentProps) {
  const { mode } = useSiteRender()
  const layout = props.layout ?? 'grid'
  const items: any[] = props.messages ?? []
  
  const [formOpen, setFormOpen] = useState(false)
  const [data, setData] = useState({ name: '', text: '' })
  
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode !== 'live') return
    setFormOpen(false)
    setData({ name: '', text: '' })
    alert('Mesajınız gönderildi!')
  }
  
  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />
      
      {props.allowNew && (
        <Reveal className="mb-12">
          {!formOpen ? (
            <button onClick={() => setFormOpen(true)} className="px-6 py-3 sb-bg-accent text-white rounded-full text-sm font-medium hover:opacity-90 transition flex items-center gap-2 mx-auto shadow-lg">
              <MessageSquareQuote className="w-4 h-4" />
              Mesaj Bırak
            </button>
          ) : (
            <form onSubmit={submit} className="sb-card max-w-md mx-auto p-6 flex flex-col gap-4 text-left shadow-xl">
              <h4 className="sb-heading text-lg">Mesajınız</h4>
              <input required disabled={mode !== 'live'} value={data.name} onChange={e=>setData(d=>({...d, name: e.target.value}))} placeholder="Adınız" className="sb-input" />
              <textarea required disabled={mode !== 'live'} value={data.text} onChange={e=>setData(d=>({...d, text: e.target.value}))} placeholder="Güzel dilekleriniz..." className="sb-input resize-none" rows={4} />
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm opacity-70 hover:opacity-100">İptal</button>
                <button disabled={mode !== 'live'} className="px-4 py-2 sb-bg-accent text-white rounded text-sm font-medium hover:opacity-90">Gönder</button>
              </div>
            </form>
          )}
        </Reveal>
      )}

      {items.length > 0 && (
        layout === 'grid' ? (
          <div className="grid @2xl:grid-cols-2 lg:grid-cols-3 gap-6 text-left masonry">
             {items.map((it, i) => (
               <Reveal key={i} className="sb-card p-6 break-inside-avoid mb-6 shadow-sm">
                 <MessageSquareQuote className="w-6 h-6 opacity-20 mb-4" />
                 <p className="text-[15px] italic sb-muted mb-4">"{it.text}"</p>
                 <span className="text-sm font-semibold text-foreground">— {it.name}</span>
               </Reveal>
             ))}
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar">
             {items.map((it, i) => (
               <Reveal key={i} className="sb-card p-8 shrink-0 w-[85vw] max-w-md snap-center shadow-md">
                 <MessageSquareQuote className="w-8 h-8 opacity-20 mb-6 mx-auto" />
                 <p className="text-lg italic sb-muted mb-6">"{it.text}"</p>
                 <span className="font-semibold text-foreground">— {it.name}</span>
               </Reveal>
             ))}
          </div>
        )
      )}
    </SectionShell>
  )
}
