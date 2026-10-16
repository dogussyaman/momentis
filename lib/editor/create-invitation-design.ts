import { GRADYANLAR, KAGITLAR, SABLONLAR, SEMBOLLER, TEMALAR } from '@/lib/davetiye-svg'
import type { CanvasDocument, CanvasElement } from '@/store/editor-store'
import { getStoredTokenValue } from '@/lib/events/event-tokens'

const PAPER_BACKGROUNDS = ['#fbf4e5', '#ffffff', '#fff0f3', '#f1f5ec', '#151a2a']

type DesignDimensions = Pick<CanvasDocument, 'id' | 'width' | 'height'>

function toSymbolDataUrl(svg: string, palette: { p1: string; p2: string }) {
  const definitions = GRADYANLAR
    .replace(/var\(--p1\)/g, palette.p1)
    .replace(/var\(--p2\)/g, palette.p2)
    .replace(/var\(--l1\)/g, '#739274')
    .replace(/var\(--l2\)/g, '#466b4b')
  const source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>' +
    definitions + '</defs>' + svg + '</svg>'
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source)
}

function resolveTemplateCopy(value: string, eventData?: Record<string, any>) {
  if (!eventData) return value
  const text = String(value || '')
  const normalized = text.replace(/\s+/g, ' ').trim()
  const coupleNames = getStoredTokenValue('{{coupleNames}}', eventData)
  const eventDate = getStoredTokenValue('{{eventDate}}', eventData)
  const eventTime = getStoredTokenValue('{{eventTime}}', eventData)
  const venueName = getStoredTokenValue('{{venueName}}', eventData)
  const venueAddress = getStoredTokenValue('{{venueAddress}}', eventData)

  const words = normalized.split(/\s+/).filter(Boolean)
  const looksLikeNames = normalized.length <= 60 &&
    words.length <= 6 &&
    (normalized.includes('&') || /\bve\b/i.test(normalized))
  if (coupleNames && looksLikeNames) return coupleNames

  const looksLikeDate = /\d{4}/.test(normalized) && /\d/.test(normalized)
  if (eventDate && looksLikeDate) {
    const hasTime = /saat|[:]\d{2}|\|\s*\d{1,2}\.\d{2}/i.test(normalized)
    return hasTime && eventTime
      ? eventDate.toLocaleUpperCase('tr-TR') + ' · ' + eventTime
      : eventDate.toLocaleUpperCase('tr-TR')
  }

  const looksLikeVenue = /(tesis|salon|bahçe|bahcesi|saray|otel|mekân|mekan|istanbul|bursa)/i.test(normalized) &&
    !/(davetiyesi|davetlisiniz|davetlisiniz|düğün daveti)/i.test(normalized)
  if (venueName && looksLikeVenue) {
    return [venueName, venueAddress].filter(Boolean).join('\n')
  }

  return text
}

/**
 * Build a real invitation document from a catalog template.
 * Text and ornamental assets are separate canvas elements, so each can be edited.
 */
export function createEditableInvitationDesign(
  templateName = 'Klasik Altın',
  dimensions: DesignDimensions = { id: 'new_design', width: 1080, height: 1520 },
  eventData?: Record<string, any>,
): CanvasDocument {
  const template = SABLONLAR[templateName] || SABLONLAR['Klasik Altın']
  const palette = TEMALAR[template.tema] || TEMALAR[0]
  const paper = KAGITLAR[template.kagit || 0] || KAGITLAR[0]
  const scaleX = dimensions.width / 360
  const scaleY = dimensions.height / 560
  const slug = templateName.toLocaleLowerCase('tr').replace(/[^a-z0-9]+/g, '-')

  const decorations: CanvasElement[] = template.ogeler.map((item: any[], index: number) => {
    const [key, centerX, centerY, baseWidth, rotation] = item
    const symbol = SEMBOLLER[key as keyof typeof SEMBOLLER]
    if (!symbol) return null
    const width = baseWidth * scaleX
    const height = (symbol.h / symbol.w) * baseWidth * scaleY
    return {
      id: 'svg_' + slug + '_' + index,
      type: 'image',
      src: toSymbolDataUrl(symbol.svg, palette),
      x: centerX * scaleX,
      y: centerY * scaleY,
      width,
      height,
      rotation: rotation || 0,
      opacity: 1,
      visible: true,
      locked: false,
      centered: true,
    } as CanvasElement
  }).filter(Boolean) as CanvasElement[]

  const texts: CanvasElement[] = template.metinler.map((item: any, index: number) => ({
    id: 'text_' + slug + '_' + index,
    type: 'text',
    text: resolveTemplateCopy(item.t, eventData),
    x: item.x * scaleX - item.w / 2,
    y: item.y * scaleY,
    width: item.w,
    height: Math.max(item.s * 1.6, 44),
    fontFamily: item.f,
    fontSize: item.s,
    fill: paper.yazi,
    align: 'center',
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
  }))

  return {
    id: dimensions.id || 'new_design',
    width: dimensions.width,
    height: dimensions.height,
    background: PAPER_BACKGROUNDS[template.kagit] || '#fffdf8',
    elements: [...decorations, ...texts],
  }
}
