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
