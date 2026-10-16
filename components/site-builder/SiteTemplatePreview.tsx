'use client'

import { useMemo } from 'react'
import { Eye, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { syncSiteEventData } from '@/lib/events/event-tokens'
import { buildSiteFromTemplate, type SiteTemplate } from '@/lib/site-builder/templates'
import type { WeddingSite } from '@/lib/site-builder/schema'
import { SiteViewer } from './SiteViewer'

const DEMO_EVENT_DATA = {
  eventTypeLabel: 'Düğün',
  date: '2027-07-18',
  time: '18:30',
  venue: 'Garden Davet',
  address: 'Nilüfer, Bursa',
  city: 'Bursa',
  couple: { bride: 'Zeynep', groom: 'Emre' },
  family: {},
  program: [
    { title: 'Karşılama', time: '18:00', note: 'Sevdiklerimizle buluşma' },
    { title: 'Nikâh töreni', time: '18:30', note: 'Birlikte yeni bir başlangıç' },
    { title: 'Kutlama', time: '20:00', note: 'Müzik ve güzel anlar' },
  ],
}

function mergePreviewEventData(eventData?: Record<string, any>) {
  return {
    ...DEMO_EVENT_DATA,
    ...(eventData || {}),
    couple: { ...DEMO_EVENT_DATA.couple, ...(eventData?.couple || {}) },
    family: { ...DEMO_EVENT_DATA.family, ...(eventData?.family || {}) },
    program: Array.isArray(eventData?.program) && eventData.program.length
      ? eventData.program
      : DEMO_EVENT_DATA.program,
  }
}

export function buildSiteTemplatePreview(
  template: SiteTemplate,
  eventData?: Record<string, any>,
): WeddingSite {
  const data = mergePreviewEventData(eventData)
  const site = buildSiteFromTemplate(template.id)
  return syncSiteEventData(site, null, data)
}

export function SiteTemplateThumbnail({
  template,
  className = '',
}: {
  template: SiteTemplate
  className?: string
}) {
  const heroSection = template.sections.find(([type]) => type === 'hero')
  const heroProps = heroSection?.[1]?.props || {}
  const heroStyle = heroSection?.[1]?.style || {}
  const heroLayout = heroProps.layout || 'center'
  const heroImage = heroStyle.bgImage || heroProps.sideImage || template.preview
  const titleFont = heroProps.titleFont === 'script'
    ? template.theme.scriptFont
    : heroProps.titleFont === 'body'
      ? template.theme.bodyFont
      : template.theme.headingFont
  const overlay = Math.max(0, Math.min(100, Number(heroStyle.overlayOpacity ?? 35))) / 100
  const coverStyle = {
    backgroundImage: 'linear-gradient(rgba(17,24,39,' + overlay + '), rgba(17,24,39,' + overlay + ')), url("' + heroImage + '")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }

  if (heroLayout === 'split') {
    return (
      <div className={'relative grid h-full min-h-[148px] grid-cols-[1.12fr_0.88fr] overflow-hidden ' + className} aria-label={template.name + ' site başlık önizlemesi'}>
        <div className="flex flex-col items-start justify-center gap-2 p-3 sm:p-4" style={{ backgroundColor: template.theme.backgroundColor, color: template.theme.textColor }}>
          <span className="text-[6px] font-semibold uppercase tracking-[0.2em] sm:text-[7px]" style={{ color: template.theme.accentColor }}>YOU ARE INVITED</span>
          <span className="max-w-full break-words text-lg leading-[0.95] sm:text-2xl" style={{ fontFamily: titleFont + ', Georgia, serif' }}>Zeynep <span style={{ color: template.theme.accentColor }}>&</span> Emre</span>
          <span className="text-[7px] uppercase tracking-[0.12em] opacity-70 sm:text-[8px]">18 TEMMUZ 2027 · BURSA</span>
          <span className="mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-[6px] font-semibold text-white sm:text-[7px]" style={{ backgroundColor: template.theme.primaryColor }}>DAVETİYEMİZ</span>
        </div>
        <div className="relative overflow-hidden" style={{ backgroundImage: 'url("' + heroImage + '")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0" style={{ backgroundColor: template.theme.primaryColor, opacity: 0.08 }} />
          <div className="absolute inset-2 border sm:inset-3" style={{ borderColor: template.theme.accentColor, opacity: 0.6 }} />
        </div>
        <span className="pointer-events-none absolute left-0 top-0 h-1 w-full" style={{ backgroundColor: template.theme.accentColor }} />
      </div>
    )
  }

  return (
    <div
      className={'relative flex h-full min-h-[148px] items-center justify-center overflow-hidden p-4 text-center sm:min-h-[176px] ' + className}
      style={coverStyle}
      aria-label={template.name + ' site başlık önizlemesi'}
    >
      <div className="pointer-events-none absolute inset-2 sm:inset-3" style={{ border: heroLayout === 'frame' ? '1px solid ' + template.theme.accentColor : '1px solid rgba(255,255,255,0.22)' }} />
      <div className="relative z-10 flex max-w-full flex-col items-center gap-2 text-white">
        <span className="text-[6px] font-semibold uppercase tracking-[0.24em] sm:text-[7px]">TOGETHER WITH OUR FAMILIES</span>
        <span className="max-w-full break-words text-2xl leading-[0.95] sm:text-3xl" style={{ fontFamily: titleFont + ', Georgia, serif' }}>Zeynep <span style={{ color: template.theme.accentColor }}>&</span> Emre</span>
        <span className="text-[7px] uppercase tracking-[0.18em] sm:text-[8px]">18 TEMMUZ 2027 · BURSA</span>
        <span className="mt-1 h-px w-10" style={{ backgroundColor: template.theme.accentColor }} />
        <span className="rounded-full border px-3 py-1 text-[6px] font-medium uppercase tracking-[0.12em] sm:text-[7px]" style={{ borderColor: template.theme.accentColor }}>Katılım bildir</span>
      </div>
    </div>
  )
}

export function SiteTemplatePreview({
  template,
  eventData,
  className = '',
}: {
  template: SiteTemplate
  eventData?: Record<string, any>
  className?: string
}) {
  const site = useMemo(
    () => buildSiteTemplatePreview(template, eventData),
    [template, eventData],
  )

  return (
    <div className={'overflow-hidden rounded-xl border border-[#e8e1d7] bg-[#f4f1eb] ' + className}>
      <SiteViewer site={site} mode="editor" viewportHeight={760} />
    </div>
  )
}

export function SiteTemplatePreviewDialog({
  template,
  eventData,
  open,
  onOpenChange,
  onUseTemplate,
}: {
  template: SiteTemplate | null
  eventData?: Record<string, any>
  open: boolean
  onOpenChange: (open: boolean) => void
  onUseTemplate?: (template: SiteTemplate) => void
}) {
  return (
    <Dialog open={open && Boolean(template)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] max-w-6xl flex-col gap-3 overflow-hidden border-[#e7dfd3] bg-[#fbf9f5] p-3 sm:p-5">
        <DialogHeader className="shrink-0 pr-7 text-left">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#947447]">
            <Eye className="h-3.5 w-3.5" /> Canlı tasarım önizlemesi
          </div>
          <DialogTitle className="font-serif text-xl text-[#172033] sm:text-2xl">
            {template?.name || 'Site şablonu'}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-[#77746f]">
            Şablonun gerçek bölüm düzenini inceleyin. Önizlemede örnek bilgiler kullanılır; kendi etkinlik bilgileriniz editöre geçince uygulanır.
          </DialogDescription>
        </DialogHeader>

        {template && (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-white">
            <SiteTemplatePreview template={template} eventData={eventData} />
          </div>
        )}

        <DialogFooter className="shrink-0 flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full rounded-xl border-[#d9d0c3] bg-white text-xs sm:w-auto">
            Kapat
          </Button>
          {template && onUseTemplate && (
            <Button
              type="button"
              onClick={() => onUseTemplate(template)}
              className="w-full rounded-xl bg-[#172033] text-xs text-white hover:bg-[#27344d] sm:w-auto"
            >
              <Check className="mr-2 h-3.5 w-3.5" /> Bu tasarımla devam et
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
