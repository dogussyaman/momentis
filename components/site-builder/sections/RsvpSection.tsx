'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Reveal, SectionHeading, SectionShell, SbImage, type SectionComponentProps, useSiteRender } from '../render/primitives'

export function RsvpSection({ section, props }: SectionComponentProps) {
  const { mode, site } = useSiteRender()
  const layout = props.layout ?? 'card'
  const maxG = props.maxGuests ?? 4
  const menuOpts = (props.menuOptions || '').split(',').map((s: string) => s.trim()).filter(Boolean)

  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [data, setData] = useState({ name: '', guests: 1, attending: 'yes', phone: '', email: '', menu: menuOpts[0] ?? '', song: '', note: '' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode !== 'live') return
    setStatus('loading')
    try {
      const response = await fetch('/api/public/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: site.slug,
          name: data.name,
          email: data.email,
          phone: data.phone,
          attending: data.attending === 'yes',
          guest_count: data.attending === 'yes' ? data.guests : 0,
          menu: data.menu,
          note: [data.note, data.song && `Şarkı isteği: ${data.song}`].filter(Boolean).join('\n'),
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Yanıtınız gönderilemedi')
      setStatus('success')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Yanıtınız gönderilemedi')
      setStatus('idle')
    }
  }

  const form = (
    <Reveal className={cn("flex flex-col gap-5 text-left w-full", layout === 'card' && 'sb-card p-8 @3xl:p-12 shadow-xl')}>
      {status === 'success' ? (
        <div className="flex flex-col items-center justify-center text-center py-12 gap-4">
          <div className="w-16 h-16 rounded-full sb-bg-accent flex items-center justify-center text-white"><Check className="w-8 h-8"/></div>
          <h3 className="sb-heading text-3xl">{props.successTitle}</h3>
          <p className="sb-muted max-w-sm">{props.successText}</p>
          <button type="button" onClick={() => setStatus('idle')} className="mt-4 text-xs underline sb-muted hover:opacity-100">Yeni bir cevap gönder</button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          {layout !== 'split' && <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} className="mb-6 items-center text-center" />}

          <div className="grid gap-5 @2xl:grid-cols-2">
            <div className="flex flex-col gap-1.5 @2xl:col-span-2">
              <label className="text-xs uppercase tracking-widest opacity-70">Adınız Soyadınız *</label>
              <input autoComplete="name" required disabled={mode !== 'live' || status === 'loading'} value={data.name} onChange={e=>setData(d=>({...d, name: e.target.value}))} className="sb-input" />
            </div>

            <div className="flex flex-col gap-1.5 @2xl:col-span-2">
              <label className="text-xs uppercase tracking-widest opacity-70">{props.askPhone ? 'E-posta (isteğe bağlı)' : 'E-posta *'}</label>
              <input type="email" autoComplete="email" required={!props.askPhone} disabled={mode !== 'live' || status === 'loading'} value={data.email} onChange={e=>setData(d=>({...d, email: e.target.value}))} className="sb-input" placeholder="ornek@mail.com" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest opacity-70">Katılım Durumu *</label>
              <select required disabled={mode !== 'live' || status === 'loading'} value={data.attending} onChange={e=>setData(d=>({...d, attending: e.target.value}))} className="sb-input">
                <option value="yes">Evet, katılıyorum</option>
                <option value="no">Maalesef katılamıyorum</option>
              </select>
            </div>

            {props.askGuests && data.attending === 'yes' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest opacity-70">Kişi Sayısı</label>
                <select disabled={mode !== 'live' || status === 'loading'} value={data.guests} onChange={e=>setData(d=>({...d, guests: Number(e.target.value)}))} className="sb-input">
                  {Array.from({length: maxG}).map((_, i) => <option key={i+1} value={i+1}>{i+1} Kişi</option>)}
                </select>
              </div>
            )}

            {props.askPhone && (
              <div className="flex flex-col gap-1.5 @2xl:col-span-2">
                <label className="text-xs uppercase tracking-widest opacity-70">Telefon Numarası</label>
                <input type="tel" autoComplete="tel" required disabled={mode !== 'live' || status === 'loading'} value={data.phone} onChange={e=>setData(d=>({...d, phone: e.target.value}))} className="sb-input" />
              </div>
            )}

            {props.askMenu && menuOpts.length > 0 && data.attending === 'yes' && (
              <div className="flex flex-col gap-1.5 @2xl:col-span-2">
                <label className="text-xs uppercase tracking-widest opacity-70">Menü Tercihi</label>
                <select disabled={mode !== 'live' || status === 'loading'} value={data.menu} onChange={e=>setData(d=>({...d, menu: e.target.value}))} className="sb-input">
                  {menuOpts.map((o: string) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )}

            {props.askSong && (
              <div className="flex flex-col gap-1.5 @2xl:col-span-2">
                <label className="text-xs uppercase tracking-widest opacity-70">Şarkı İsteği</label>
                <input disabled={mode !== 'live' || status === 'loading'} value={data.song} onChange={e=>setData(d=>({...d, song: e.target.value}))} className="sb-input" placeholder="Bu şarkı çalmalı..." />
              </div>
            )}

            {props.askNote && (
              <div className="flex flex-col gap-1.5 @2xl:col-span-2">
                <label className="text-xs uppercase tracking-widest opacity-70">Bize Bir Notunuz</label>
                <textarea disabled={mode !== 'live' || status === 'loading'} value={data.note} onChange={e=>setData(d=>({...d, note: e.target.value}))} className="sb-input resize-none" rows={3} />
              </div>
            )}
          </div>

          <button disabled={mode !== 'live' || status === 'loading'} className="mt-4 sb-bg-accent text-white py-4 rounded-md uppercase tracking-[0.2em] text-xs font-semibold hover:opacity-90 transition disabled:opacity-50">
            {status === 'loading' ? 'Gönderiliyor...' : props.submitLabel}
          </button>
        </form>
      )}
    </Reveal>
  )

  if (layout === 'split') {
    return (
      <SectionShell section={section} noContainer>
        <div className="grid @3xl:grid-cols-2" style={{ minHeight: '100%' }}>
          <div className="hidden @3xl:block relative">
            {props.image && <SbImage src={props.image} className="absolute inset-0 w-full h-full" />}
          </div>
          <div className="p-8 @3xl:p-20 flex flex-col justify-center">
            <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} className="text-left items-start" />
            {form}
          </div>
        </div>
      </SectionShell>
    )
  }

  return (
    <SectionShell section={section}>
      <div className={cn("mx-auto", layout === 'card' ? "max-w-2xl" : "max-w-xl")}>
        {form}
      </div>
    </SectionShell>
  )
}
