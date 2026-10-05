import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/components/shared/section-heading'
import { Reveal } from '@/components/shared/reveal'
import { PACKAGES, formatPrice } from '@/lib/data/packages'
import { cn } from '@/lib/utils'

export function PricingSection({ showHeading = true }) {
  return (
    <section className="bg-ivory py-28" data-testid="pricing">
      <div className="container">
        {showHeading && (
          <SectionHeading
            align="center"
            eyebrow="Fiyatlandırma"
            title={<>Tek seferlik, <span className="italic text-champagne-dark">şeffaf</span> fiyatlar.</>}
            description="Abonelik yok, gizli ücret yok. Etkinliğiniz için bir kez ödeyin; davetiyeniz 12 ay boyunca yayında kalsın."
          />
        )}
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {PACKAGES.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 0.1} className={cn('relative flex flex-col border p-10', pkg.highlighted ? 'border-champagne bg-midnight text-ivory lg:-translate-y-4' : 'border-border bg-ivory-50 text-midnight')} >
              {pkg.highlighted && (
                <span className="absolute -top-3 left-10 bg-champagne px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-midnight">En çok tercih edilen</span>
              )}
              <p className={cn('text-[11px] uppercase tracking-[0.3em]', pkg.highlighted ? 'text-champagne-light' : 'text-champagne-dark')}>{pkg.tagline}</p>
              <h3 className="mt-4 font-serif text-3xl">{pkg.name}</h3>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-serif text-5xl" data-testid={`price-${pkg.id}`}>{formatPrice(pkg.price)}</span>
                {pkg.price > 0 && <span className={cn('text-xs uppercase tracking-[0.18em]', pkg.highlighted ? 'text-ivory/60' : 'text-muted-foreground')}>{pkg.period}</span>}
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" />
                    <span className={pkg.highlighted ? 'text-ivory/85' : 'text-midnight/85'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className={cn('mt-10 h-12 rounded-2xl text-[12px] uppercase tracking-[0.2em]', pkg.highlighted ? 'bg-champagne text-midnight hover:bg-champagne-light' : 'bg-midnight text-ivory hover:bg-midnight-700')}>
                <Link href={`/kayit?paket=${pkg.id}`} data-testid={`pricing-cta-${pkg.id}`}>{pkg.cta}</Link>
              </Button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
