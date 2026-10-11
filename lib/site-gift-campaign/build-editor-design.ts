import type { CanvasDocument } from '@/store/editor-store'

type GiftTemplate = {
  id: string
  title: string
  preview: {
    background: string
    foreground: string
    accent: string
    secondary: string
    ornament: string
  }
}

function textElement(id: string, text: string, x: number, y: number, width: number, fontSize: number, fontFamily: string, fill: string, options: Record<string, unknown> = {}) {
  return {
    id,
    type: 'text' as const,
    x,
    y,
    width,
    height: fontSize * 1.5,
    rotation: 0,
    text,
    fontFamily,
    fontSize,
    fontWeight: 500,
    fill,
    align: 'center',
    opacity: 1,
    visible: true,
    locked: false,
    ...options,
  }
}

export function buildGiftInvitationDesign(template: GiftTemplate, eventData?: Record<string, any> | null): CanvasDocument {
  const { preview } = template
  const names = [eventData?.couple?.bride, eventData?.couple?.groom].filter(Boolean)
  const coupleNames = names.length ? names.join(' & ') : '{{coupleNames}}'
  const eventDate = eventData?.date ? String(eventData.date) : '{{eventDate}}'
  const isMidnight = template.id === 'midnight'
  const isModern = template.id === 'modern-classic'
  const borderInset = isModern ? 72 : 48
  const titleFont = isModern ? 'Montserrat' : 'Playfair Display'
  const nameFont = isMidnight ? 'Great Vibes' : 'Cormorant Garamond'
  const elements: CanvasDocument['elements'] = [
    {
      id: 'gift-frame',
      type: 'rect',
      x: borderInset,
      y: borderInset,
      width: 1080 - borderInset * 2,
      height: 1520 - borderInset * 2,
      fill: preview.background,
      stroke: preview.accent,
      strokeWidth: isModern ? 2 : 4,
      opacity: 0.9,
      visible: true,
      locked: false,
    },
    {
      id: 'gift-divider',
      type: 'line',
      x: 290,
      y: 990,
      width: 500,
      height: 0,
      points: [0, 0, 500, 0],
      stroke: preview.accent,
      strokeWidth: 3,
      opacity: 0.8,
      visible: true,
      locked: false,
    },
    textElement('gift-kicker', 'ÖZEL GÜNÜMÜZE DAVETLİSİNİZ', 140, 330, 800, 26, titleFont, preview.accent, { letterSpacing: 3 }),
    textElement('gift-names', coupleNames, 140, 575, 800, isMidnight ? 82 : 76, nameFont, preview.foreground),
    textElement('gift-date', eventDate, 140, 1065, 800, 36, titleFont, preview.foreground, { letterSpacing: 2 }),
    textElement('gift-message', 'Bu mutlu günümüzde sizleri de aramızda görmekten mutluluk duyarız.', 210, 1190, 660, 30, titleFont, preview.foreground, { lineHeight: 1.5 }),
  ]

  if (preview.ornament === 'stars' || preview.ornament === 'flowers' || preview.ornament === 'leaves') {
    elements.push(textElement('gift-ornament-top', preview.ornament === 'stars' ? '✦  ✧  ✦' : preview.ornament === 'flowers' ? '❀  ❀  ❀' : '❧  ❧  ❧', 300, 180, 480, 42, 'Georgia', preview.accent))
    elements.push(textElement('gift-ornament-bottom', preview.ornament === 'stars' ? '✦  ✧  ✦' : preview.ornament === 'flowers' ? '❀  ❀  ❀' : '❧  ❧  ❧', 300, 1360, 480, 42, 'Georgia', preview.accent))
  }

  return {
    id: `site-gift-${template.id}`,
    width: 1080,
    height: 1520,
    background: preview.background,
    elements,
  }
}
