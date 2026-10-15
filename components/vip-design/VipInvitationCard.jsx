import Link from 'next/link'
import { ArrowUpRight, Check, Gift, Sparkles } from 'lucide-react'

export function VipInvitationCard({ template, href, selected = false, onSelect }) {
  const style = {
    '--invite-bg': template.preview?.background || '#f0ede7',
    '--invite-fg': template.preview?.foreground || '#101827',
    '--invite-accent': template.preview?.accent || '#C9A96E',
  }

  const contents = (
    <>
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-[22px] bg-ivory-100 flex items-center justify-center">
        {template.image ? (
          <img
            src={template.image}
            alt={template.title}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="mx-auto flex h-full max-w-[210px] flex-col items-center justify-center border border-[var(--invite-accent)]/60 bg-[var(--invite-bg)] px-3 text-center text-[var(--invite-fg)] shadow-sm">
            <span className="mb-3 text-[8px] uppercase tracking-[0.3em] text-[var(--invite-accent)]">
              Özel gününüze davetlisiniz
            </span>
            <span className="font-serif text-xl leading-tight sm:text-2xl">
              Lal <i className="text-[var(--invite-accent)]">&</i> Emir
            </span>
            <span className="my-2 h-px w-9 bg-[var(--invite-accent)]" />
            <span className="text-[8px] tracking-[0.17em]">12 EYLÜL · İSTANBUL</span>
            <span aria-hidden="true" className="absolute right-7 top-7 text-xl text-[var(--invite-accent)]">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
        )}

        {/* Hediye Davetiye Badge */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-champagne/40 bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-midnight shadow-sm backdrop-blur-sm">
          <Gift className="h-3 w-3 text-champagne-dark" /> Hediye
        </span>

        {selected && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-midnight px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-champagne shadow-md">
            <Check className="h-3 w-3 text-champagne" /> Seçildi
          </span>
        )}
      </div>

      <div className="flex flex-col justify-between flex-1 p-5">
        <div>
          <p className="font-serif text-lg text-midnight group-hover:text-champagne-dark transition-colors">
            {template.title}
          </p>
          <p className="mt-1.5 min-h-10 text-xs leading-relaxed text-muted-foreground">
            {template.description}
          </p>
        </div>

        {onSelect ? (
          <button
            type="button"
            aria-pressed={selected}
            onClick={onSelect}
            className={`mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne ${
              selected
                ? 'border border-midnight bg-midnight text-champagne shadow-sm'
                : 'border border-midnight/15 bg-white text-midnight hover:bg-midnight hover:text-white'
            }`}
          >
            {selected ? (
              <>
                <Check className="h-3.5 w-3.5" /> Seçimi Kaldır
              </>
            ) : (
              'Bu Davetiyeyi Seç'
            )}
          </button>
        ) : (
          <Link
            href={href || '/tasarimlar/vip/talep/yeni'}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-midnight/15 bg-white text-xs font-semibold uppercase tracking-wider text-midnight transition hover:bg-midnight hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne shadow-2xs"
          >
            Bu Davetiye ile Seç <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </>
  )

  return (
    <article
      style={style}
      className={`group flex flex-col overflow-hidden rounded-[24px] border bg-white shadow-[0_18px_50px_-38px_rgba(16,24,39,0.5)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        selected
          ? 'border-midnight ring-2 ring-midnight/20'
          : 'border-midnight/10 hover:border-champagne/70'
      }`}
    >
      {contents}
    </article>
  )
}
