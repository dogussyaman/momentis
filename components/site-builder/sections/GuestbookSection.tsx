'use client'

import { useEffect, useState } from 'react'
import { MessageSquareQuote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal, SectionHeading, SectionShell, type SectionComponentProps, useSiteRender } from '../render/primitives'
import { toast } from 'sonner'

export function GuestbookSection({ section, props }: SectionComponentProps) {
  const { mode, site } = useSiteRender()
  const layout = props.layout ?? 'grid'
  const configuredItems = (Array.isArray(props.entries) ? props.entries : []).map((item: any) => ({
    id: item.id,
    name: item.name,
    text: item.message ?? item.text,
  })).filter((item: any) => item.name && item.text)
  const [items, setItems] = useState<Array<{ id: string; name: string; message: string }>>([])
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [data, setData] = useState({ name: '', text: '' })

  useEffect(() => {
    if (mode !== 'live' || !site.slug) return
    let active = true
    setLoading(true)
    fetch(`/api/public/guestbook/${encodeURIComponent(site.slug)}`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.error || 'Mesajlar yüklenemedi')
        if (active) setItems(Array.isArray(result.items) ? result.items : [])
      })
      .catch((error) => {
        if (active) toast.error(error instanceof Error ? error.message : 'Mesajlar yüklenemedi')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [mode, site.slug])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode !== 'live') return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/public/guestbook/${encodeURIComponent(site.slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, message: data.text }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Mesajınız gönderilemedi')
      setFormOpen(false)
      setSubmitted(true)
      setData({ name: '', text: '' })
      toast.success('Mesajınız onay için iletildi')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Mesajınız gönderilemedi')
    } finally {
      setSubmitting(false)
    }
  }

  const displayItems = [...configuredItems, ...items.map((item) => ({ id: item.id, name: item.name, text: item.message }))]
  
  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />
      
      {props.allowNew && (
        <Reveal className="mb-12">
          {submitted && <p className="mb-5 text-center text-sm sb-muted" role="status">Mesajınız alındı. Yayında görünmesi için onay bekliyor.</p>}
          {!formOpen ? (
            <button onClick={() => setFormOpen(true)} className="px-6 py-3 sb-bg-accent text-white rounded-full text-sm font-medium hover:opacity-90 transition flex items-center gap-2 mx-auto shadow-lg">
              <MessageSquareQuote className="w-4 h-4" />
              Mesaj Bırak
            </button>
          ) : (
            <form onSubmit={submit} className="sb-card max-w-md mx-auto p-6 flex flex-col gap-4 text-left shadow-xl">
              <h4 className="sb-heading text-lg">Mesajınız</h4>
              <input required maxLength={60} disabled={mode !== 'live' || submitting} value={data.name} onChange={e=>setData(d=>({...d, name: e.target.value}))} placeholder="Adınız" className="sb-input" />
              <textarea required maxLength={500} disabled={mode !== 'live' || submitting} value={data.text} onChange={e=>setData(d=>({...d, text: e.target.value}))} placeholder="Güzel dilekleriniz..." className="sb-input resize-none" rows={4} />
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" disabled={submitting} onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm opacity-70 hover:opacity-100">İptal</button>
                <button disabled={mode !== 'live' || submitting} className="px-4 py-2 sb-bg-accent text-white rounded text-sm font-medium hover:opacity-90">{submitting ? 'Gönderiliyor…' : 'Gönder'}</button>
              </div>
            </form>
          )}
        </Reveal>
      )}

      {loading && <p className="py-6 text-center text-sm sb-muted">Mesajlar yükleniyor…</p>}
      {displayItems.length > 0 && (
        layout === 'grid' ? (
          <div className="grid @2xl:grid-cols-2 lg:grid-cols-3 gap-6 text-left masonry">
             {displayItems.map((it, i) => (
               <Reveal key={it.id || i} className="sb-card p-6 break-inside-avoid mb-6 shadow-sm">
                 <MessageSquareQuote className="w-6 h-6 opacity-20 mb-4" />
                 <p className="text-[15px] italic sb-muted mb-4">"{it.text}"</p>
                 <span className="text-sm font-semibold text-foreground">— {it.name}</span>
               </Reveal>
             ))}
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar">
             {displayItems.map((it, i) => (
               <Reveal key={it.id || i} className="sb-card p-8 shrink-0 w-[85vw] max-w-md snap-center shadow-md">
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
