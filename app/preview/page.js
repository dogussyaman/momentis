'use client'

import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InvitationSite } from '@/components/invitation/invitation-site'
import { SiteViewer } from '@/components/site-builder/SiteViewer'
import { DavetiyeKart } from '@/components/shared/davetiye-kart'
import { SABLONLAR } from '@/lib/davetiye-svg'
import { getEventType } from '@/lib/data/events'

import { buildSiteFromTemplate } from '@/lib/site-builder/templates'
import { resolveTokens, syncSiteEventData } from '@/lib/events/event-tokens'

export default function LivePreviewPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const cardRef = useRef(null)

  useEffect(() => {
    // 1) Eğer direkt tarayıcıdan /preview?template=sb-classic gibi gelindiyse
    const params = new URLSearchParams(window.location.search)
    const templateSlug = params.get('template')

    if (templateSlug) {
      // API'den tasarımı çek ve dummy bir proje oluştur
      fetch(`/api/templates/${templateSlug}`)
        .then(r => {
          if (!r.ok) throw new Error('Tasarım bulunamadı')
          return r.json()
        })
        .then(t => {
          // Eğer site builder (isWebsite) ise buildSiteFromTemplate ile tam tasarımı yükle
          const isWebsite = t.tags?.includes('web sitesi')
          if (isWebsite) {
            const builderId = t.slug.replace(/^sb-/, '') // 'sb-classic' -> 'classic'
            const eventData = {
              couple: { bride: 'Elif', groom: 'Kaan' },
              date: '2027-06-12',
              time: '19:00',
              venue: 'Feriye Sarayı',
              address: 'İstanbul',
              city: 'İstanbul',
              eventTypeLabel: 'Düğün',
            }
            const templateSite = buildSiteFromTemplate(builderId, { title: 'Elif & Kaan' })
            const siteData = syncSiteEventData(
              JSON.parse(resolveTokens(JSON.stringify(templateSite), eventData)),
              null,
              eventData,
            )
            
            setData({
              mode: 'site',
              project: {
                title: 'Elif & Kaan',
                host_a: 'Elif',
                host_b: 'Kaan',
                date: '2027-06-12',
                site_data: siteData
              },
              template: t
            })
          } else {
            setData({
              mode: 'preview',
              project: { title: 'Demo Çifti', host_a: 'Elif', host_b: 'Kaan' },
              template: t
            })
          }
          setLoading(false)
        })
        .catch(e => {
          setError(e.message)
          setLoading(false)
        })
      return
    }

    // 2) Eğer iframe içindeyse parent'tan bekle
    const handler = (e) => {
      if (e.data && e.data.type === 'UPDATE_PREVIEW') {
        setData(e.data.payload)
        setLoading(false)
      }
    }
    window.addEventListener('message', handler)
    
    if (window.parent) {
      window.parent.postMessage({ type: 'PREVIEW_READY' }, '*')
    }

    return () => window.removeEventListener('message', handler)
  }, [])

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-ivory text-sm text-destructive">{error}</div>
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory text-xs tracking-widest text-muted-foreground uppercase">
        Yükleniyor...
      </div>
    )
  }

  if (data.mode === 'card') {
    const project = data.project
    const cardTemplate = SABLONLAR[project.card_template] || SABLONLAR['Klasik Altın']
    const eventType = getEventType(project.event_type)
    const elements = cardTemplate.ogeler.map(([k, x, y, w, r]) => ({ k, x, y, w, r }))
    const rawTitle = String(project.title || '').trim()
    const titleParts = rawTitle.split(/\s*[·|–—]\s*/)
    const namePrefix = titleParts.slice(0, -1).join(' ').toLocaleLowerCase('tr-TR')
    const startsWithNames = [project.host_a, project.host_b].filter(Boolean).every((name) => namePrefix.includes(String(name).trim().split(/\s+/)[0].toLocaleLowerCase('tr-TR')))
    const isGeneratedTitle = titleParts.length > 1
      && titleParts.at(-1).toLocaleLowerCase('tr-TR') === eventType?.label?.toLocaleLowerCase('tr-TR')
      && startsWithNames
    const cardTitle = isGeneratedTitle ? '' : rawTitle
    const parsedDate = project.date ? new Date(`${project.date}T12:00:00`) : null
    const eventDate = parsedDate
      ? parsedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).toLocaleUpperCase('tr-TR')
      : ''
    const card = {
      tema: Number.isInteger(project.card_theme) ? project.card_theme : cardTemplate.tema,
      kagit: cardTemplate.kagit || 0,
      yazilar: {
        baslik: eventType?.greeting || 'Davetlisiniz',
        title: cardTitle,
        mesaj: project.card_message || 'Bu özel günümüzde sizleri de aramızda görmekten mutluluk duyarız.',
        isim1: project.host_a || 'İsim 1',
        isim2: project.host_b || '',
        tarih: eventDate,
        hafta_gunu: parsedDate ? parsedDate.toLocaleDateString('tr-TR', { weekday: 'long' }).toLocaleUpperCase('tr-TR') : '',
        saat: project.time || '',
        mekan: project.venue || '',
        sehir: project.city || '',
        adres: project.address || '',
        bride_mother: project.bride_mother || '',
        bride_father: project.bride_father || '',
        groom_mother: project.groom_mother || '',
        groom_father: project.groom_father || '',
      },
      ogeler: elements,
      layout: project.card_layout || 'classic',
    }

    const downloadCard = async (formatType) => {
      const source = cardRef.current?.querySelector('svg')
      if (!source) return
      const svg = source.cloneNode(true)
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      svg.setAttribute('width', '1080')
      svg.setAttribute('height', '1560')
      const markup = new XMLSerializer().serializeToString(svg)
      const svgBlob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
      let blob = svgBlob
      let extension = 'svg'

      if (formatType === 'png') {
        const objectUrl = URL.createObjectURL(svgBlob)
        try {
          const image = new Image()
          await new Promise((resolve, reject) => {
            image.onload = resolve
            image.onerror = reject
            image.src = objectUrl
          })
          const canvas = document.createElement('canvas')
          canvas.width = 1080
          canvas.height = 1560
          const context = canvas.getContext('2d')
          context.drawImage(image, 0, 0, canvas.width, canvas.height)
          blob = await new Promise((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG dışa aktarılamadı')), 'image/png'))
          extension = 'png'
        } catch {
          return
        } finally {
          URL.revokeObjectURL(objectUrl)
        }
      }

      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${project.slug || 'davetiye-karti'}.${extension}`
      link.click()
      URL.revokeObjectURL(downloadUrl)
    }

    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#e9e4d9] p-4 text-center sm:gap-4 sm:p-6">
        <div className="text-center"><p className="text-[9px] font-medium uppercase tracking-[0.22em] text-midnight/55 sm:text-[10px]">Davetiye kartı · {project.card_template || 'Klasik Altın'}</p><p className="mt-1 text-[10px] text-midnight/50">{({ classic: 'Klasik', editorial: 'Editoryal', modern: 'Modern', minimal: 'Minimal' })[card.layout]}</p></div>
        <div ref={cardRef} className="w-full" style={{ width: 'min(82vw, 460px, calc((100dvh - 130px) * 0.692))', maxWidth: '100%' }}><DavetiyeKart veri={card} scale={1.25} /></div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={() => downloadCard('png')} size="sm" className="h-9 rounded-full bg-midnight px-4 text-[9px] uppercase tracking-[0.14em] text-ivory hover:bg-midnight/90" data-testid="download-card-png"><Download className="mr-1.5 h-3.5 w-3.5" /> PNG indir</Button>
          <Button type="button" variant="outline" onClick={() => downloadCard('svg')} size="sm" className="h-9 rounded-full border-midnight/20 px-4 text-[9px] uppercase tracking-[0.14em]" data-testid="download-card-svg"><Download className="mr-1.5 h-3.5 w-3.5" /> SVG indir</Button>
        </div>
      </main>
    )
  }

  if (data.project.site_data) {
    return <SiteViewer site={data.project.site_data} />
  }

  return <InvitationSite project={data.project} template={data.template} />
}
