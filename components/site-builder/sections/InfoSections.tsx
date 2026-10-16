'use client'

import { Gift, Home, MapPin, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Reveal, SectionHeading, SectionShell, SbImage, SiteButtons, type SectionComponentProps, useSiteRender } from '../render/primitives'

export function GiftSection({ section, props }: SectionComponentProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const accounts: any[] = Array.isArray(props.accounts) ? props.accounts : []
  const legacyAccount = props.bankInfo
    ? [{ id: 'legacy-account', bank: props.bankInfo.bank || 'Banka', holder: props.bankInfo.name || '', iban: props.bankInfo.iban || '' }]
    : []
  const visibleAccounts = accounts.length ? accounts : legacyAccount
  const message = props.message || ''
  const canShowGiftContent = Boolean(message || visibleAccounts.length || props.registryUrl)

  const copy = async (value: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      window.setTimeout(() => setCopied((current) => current === value ? null : current), 1800)
    } catch {
      setCopied(null)
    }
  }

  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title || 'Birlikte olmanız yeterli'} subtitle={props.subtitle} />

      {canShowGiftContent && (
        <Reveal className="mx-auto flex max-w-2xl flex-col gap-6 text-left">
          {message && <p className="text-center text-[15px] leading-relaxed sb-muted">{message}</p>}

          {visibleAccounts.length > 0 && (
            <div className="sb-card overflow-hidden divide-y divide-current/10">
              <div className="border-b border-current/10 px-5 py-4">
                <h3 className="sb-heading text-lg">Hediye ve hesap bilgileri</h3>
                <p className="mt-1 text-xs sb-muted">Bilgileri kopyalamak için ilgili düğmeyi kullanabilirsiniz.</p>
              </div>
              {visibleAccounts.map((account, index) => (
                <div key={account.id || index} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{account.bank || 'Banka hesabı'}</p>
                    {account.holder && <p className="mt-0.5 text-xs sb-muted">{account.holder}</p>}
                    {account.iban && <p className="mt-2 break-all font-mono text-xs tracking-wide">{account.iban}</p>}
                  </div>
                  {account.iban && (
                    <button
                      type="button"
                      onClick={() => void copy(account.iban)}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-current/15 px-4 text-xs font-medium transition hover:bg-current/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30"
                      aria-label={copied === account.iban ? 'IBAN kopyalandı' : 'IBAN kopyala'}
                    >
                      {copied === account.iban ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied === account.iban ? 'Kopyalandı' : 'IBAN’ı kopyala'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {props.registryUrl && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-current/10 p-5 text-center">
              <p className="text-sm sb-muted">{props.registryLabel || 'Hediye listemiz'}</p>
              <a href={props.registryUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center rounded-full sb-bg-primary px-5 text-xs font-medium text-[var(--sb-on-primary)] transition hover:opacity-90">
                Hediye listesini görüntüle
              </a>
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
  const rawColors: any[] = Array.isArray(props.colors) ? props.colors : []
  const colors = rawColors
    .map((item) => typeof item === 'string' ? { color: item, name: '' } : item)
    .filter((item) => item && typeof item.color === 'string' && item.color)

  const notes = [
    props.womenNote ? { label: 'Kadınlar', text: props.womenNote } : null,
    props.menNote ? { label: 'Erkekler', text: props.menNote } : null,
    props.avoid ? { label: 'Küçük not', text: props.avoid } : null,
  ].filter(Boolean) as { label: string; text: string }[]

  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />
      <Reveal className="mx-auto mt-8 flex max-w-3xl flex-col gap-8">
        {props.text && <p className="text-lg leading-relaxed sb-muted">{props.text}</p>}

        {notes.length > 0 && (
          <div className="grid gap-3 text-left sm:grid-cols-2">
            {notes.map((note) => (
              <div key={note.label} className="sb-card rounded-2xl border border-current/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] sb-accent">{note.label}</p>
                <p className="mt-2 text-sm leading-relaxed sb-muted">{note.text}</p>
              </div>
            ))}
          </div>
        )}

        {colors.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-xs font-medium uppercase tracking-[0.18em] opacity-60">Renk paleti</span>
            <div className="flex flex-wrap justify-center gap-4">
              {colors.map((color, index) => (
                <div key={color.id || color.color + '-' + index} className="flex w-20 flex-col items-center gap-2">
                  <span
                    className="h-12 w-12 rounded-full border border-black/10 shadow-inner @2xl:h-14 @2xl:w-14"
                    style={{ backgroundColor: color.color }}
                    title={color.name || color.color}
                    aria-label={color.name || color.color}
                  />
                  {color.name && <span className="text-center text-[10px] sb-muted">{color.name}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        <SiteButtons buttons={props.buttons} />
      </Reveal>
    </SectionShell>
  )
}
