import Link from 'next/link'
import { ArrowUpRight, Eye, LayoutTemplate } from 'lucide-react'
import { TEMPLATES } from '@/lib/site-builder/templates'

export const metadata = {
  title: 'Site Şablonları | MOMENTIS Panel',
  robots: { index: false },
}

export default function SiteTemplatesPage() {
  return (
    <div className="mx-auto max-w-7xl" data-testid="site-template-gallery">
      <div className="flex flex-col justify-between gap-6 border-b border-midnight/10 pb-8 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <p className="mb-4 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.28em] text-champagne-dark">
            <span className="h-px w-8 bg-current" /> İlham koleksiyonu
          </p>
          <h1 className="font-serif text-4xl leading-tight tracking-tight text-midnight sm:text-5xl">Site şablonlarını <span className="italic text-champagne-dark">keşfedin.</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Etkinlik siteniz için farklı stillerde hazırlanmış örnekleri inceleyin. Bu alandaki önizlemeler yalnızca görüntüleme amaçlıdır.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-midnight/10 bg-white/60 px-3.5 py-2 text-[11px] uppercase tracking-[0.12em] text-midnight/60 sm:self-auto">
          <LayoutTemplate className="h-3.5 w-3.5 text-champagne-dark" />
          {TEMPLATES.length + 1} hazır görünüm
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map((template) => (
          <Link
            key={template.id}
            href={`/panel/sablonlar/${template.id}`}
            className="group overflow-hidden rounded-2xl border border-midnight/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-midnight/20 hover:shadow-xl"
            data-testid={`site-template-${template.id}`}
          >
            <div className="relative aspect-[1.55/1] overflow-hidden bg-midnight/5">
              <img src={template.preview} alt={`${template.name} site şablonu`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/55 via-transparent to-transparent" />
              <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/35 bg-midnight/30 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                <Eye className="h-3.5 w-3.5" /> Sadece önizleme
              </span>
              <span className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-midnight transition-colors group-hover:bg-champagne">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl text-midnight">{template.name}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{template.tagline}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-midnight/8 pt-4">
                <div className="flex items-center gap-1.5" aria-label="Renk paleti">
                  {template.swatches.map((color) => (
                    <span key={color} className="h-4 w-4 rounded-full border border-midnight/10" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-midnight/55 transition-colors group-hover:text-midnight">Örneği incele</span>
              </div>
            </div>
          </Link>
        ))}
        <Link
          href="/panel/sablonlar/portfolio"
          className="group overflow-hidden rounded-2xl border border-midnight/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-midnight/20 hover:shadow-xl"
          data-testid="site-template-portfolio"
        >
          <div className="relative aspect-[1.55/1] overflow-hidden bg-midnight/5">
            <img
              src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80"
              alt="Düğün şablonunda birlikte poz veren çift"
              loading="lazy"
              className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/55 via-transparent to-transparent" />
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/35 bg-midnight/30 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm">
              Canlı sayfa önizlemesi
            </span>
            <span className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-midnight transition-colors group-hover:bg-champagne">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <div className="p-5">
            <h2 className="font-serif text-2xl text-midnight">Modern Düğün</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Düğün hikâyeniz, etkinlik programı, RSVP ve QR anı albümü için düzenlenebilir tek site yapısı.
            </p>
            <div className="mt-5 flex items-center justify-between border-t border-midnight/8 pt-4">
              <div className="flex items-center gap-1.5" aria-label="Renk paleti">
                {["#fbf8f3", "#ad8059", "#f2ebe2"].map((color) => (
                  <span
                    key={color}
                    className="h-4 w-4 rounded-full border border-midnight/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-midnight/55 transition-colors group-hover:text-midnight">
                Örneği incele
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
