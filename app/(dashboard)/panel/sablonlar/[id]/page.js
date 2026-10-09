import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Eye } from 'lucide-react'
import { SiteViewer } from '@/components/site-builder/SiteViewer'
import { buildSiteFromTemplate, TEMPLATES } from '@/lib/site-builder/templates'
import { resolveTokens, syncSiteEventData } from '@/lib/events/event-tokens'

export function generateStaticParams() {
  return TEMPLATES.map((template) => ({ id: template.id }))
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const template = TEMPLATES.find((item) => item.id === id)
  return {
    title: template ? `${template.name} Önizleme | MOMENTIS Panel` : 'Şablon bulunamadı | MOMENTIS Panel',
    robots: { index: false },
  }
}

export default async function SiteTemplatePreviewPage({ params }) {
  const { id } = await params
  const template = TEMPLATES.find((item) => item.id === id)
  if (!template) notFound()

  const previewEventData = {
    couple: { bride: 'Elif', groom: 'Kaan' },
    date: '2026-09-14',
    time: '19:00',
    venue: 'Feriye Sarayı',
    address: 'İstanbul',
    city: 'İstanbul',
    eventTypeLabel: 'Düğün',
  }
  const templateSite = buildSiteFromTemplate(template.id, {
    id: `preview-${template.id}`,
    userId: 'preview',
    title: 'Elif & Kaan',
    slug: `ornek-${template.id}`,
  })
  const site = syncSiteEventData(
    JSON.parse(resolveTokens(JSON.stringify(templateSite), previewEventData)),
    null,
    previewEventData,
  )

  return (
    <div className="mx-auto max-w-7xl" data-testid="site-template-preview">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/panel/sablonlar" className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-midnight">
            <ArrowLeft className="h-3.5 w-3.5" /> Tüm site şablonları
          </Link>
          <p className="mt-6 font-serif text-3xl text-midnight sm:text-4xl">{template.name}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{template.tagline}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-champagne-dark/20 bg-champagne/10 px-3.5 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-midnight/70">
          <Eye className="h-3.5 w-3.5 text-champagne-dark" /> Salt okunur örnek
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-midnight/15 bg-white shadow-[0_24px_80px_-36px_rgba(16,24,39,0.35)]">
        <div className="flex h-10 items-center gap-1.5 border-b border-midnight/10 bg-white px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e7a59a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#e8c77a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#9bc69c]" />
          <span className="ml-3 truncate rounded-md bg-ivory px-3 py-1 text-[10px] text-midnight/45">momentis.com / örnek / {template.id}</span>
        </div>
        <div className="max-h-[78vh] overflow-y-auto overscroll-contain" data-testid="site-template-live-preview">
          <SiteViewer site={site} mode="preview" />
        </div>
      </div>
    </div>
  )
}
