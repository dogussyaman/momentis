import { TRUST_ITEMS } from '@/lib/data/site'

export function TrustStrip() {
  const items = [...TRUST_ITEMS, ...TRUST_ITEMS]
  return (
    <div className="overflow-hidden border-y border-border bg-ivory-50 py-5" data-testid="trust-strip">
      <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
        {items.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-12 text-[11px] font-medium uppercase tracking-[0.3em] text-midnight/60">
            {item}
            <span className="h-1 w-1 rounded-full bg-champagne" />
          </span>
        ))}
      </div>
    </div>
  )
}
