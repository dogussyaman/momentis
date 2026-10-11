import Link from 'next/link'
import { ArrowUpRight, Sparkles } from 'lucide-react'

export function VipInvitationCard({ template, href, selected = false, onSelect }) {
  const style = {
    '--invite-bg': template.preview.background,
    '--invite-fg': template.preview.foreground,
    '--invite-accent': template.preview.accent,
  }

  const contents = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-[22px] bg-[#f0ede7] p-5 sm:p-7">
        <div className="mx-auto flex h-full max-w-[210px] flex-col items-center justify-center border border-[var(--invite-accent)]/60 bg-[var(--invite-bg)] px-3 text-center text-[var(--invite-fg)] shadow-sm">
          <span className="mb-3 text-[8px] uppercase tracking-[0.3em] text-[var(--invite-accent)]">Özel gününüze davetlisiniz</span>
          <span className="font-serif text-xl leading-tight sm:text-2xl">Lal <i className="text-[var(--invite-accent)]">&</i> Emir</span>
          <span className="my-2 h-px w-9 bg-[var(--invite-accent)]" />
          <span className="text-[8px] tracking-[0.17em]">12 EYLÜL · İSTANBUL</span>
          <span aria-hidden className="absolute right-7 top-7 text-xl text-[var(--invite-accent)]"><Sparkles className="h-4 w-4" /></span>
        </div>
        {selected && <span className="absolute right-4 top-4 rounded-full bg-midnight px-3 py-1 text-[9px] uppercase tracking-wider text-white">Seçildi</span>}
      </div>
      <div className="p-4">
        <p className="font-serif text-lg text-midnight">{template.title}</p>
        <p className="mt-1 min-h-10 text-xs leading-relaxed text-muted-foreground">{template.description}</p>
        {onSelect ? (
          <button type="button" aria-pressed={selected} onClick={onSelect} className={`mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne ${selected ? 'border-midnight bg-midnight text-white' : 'border-midnight/15 text-midnight hover:bg-midnight hover:text-white'}`}>
            {selected ? 'Seçimi kaldır' : 'Bu davetiyeyi seç'}
          </button>
        ) : (
          <Link href={href} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-midnight/15 text-xs font-medium text-midnight transition hover:bg-midnight hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne">
            Önizlemeyi incele <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </>
  )

  return (
    <article style={style} className={`overflow-hidden rounded-[22px] border bg-white shadow-[0_18px_50px_-38px_rgba(16,24,39,0.5)] transition ${selected ? 'border-midnight ring-2 ring-midnight/15' : 'border-midnight/10'}`}>
      {contents}
    </article>
  )
}
