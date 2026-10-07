import type { ButtonConfig, WeddingSite } from './schema'

export function normalizePhone(v = '') {
  return v.replace(/[^\d+]/g, '')
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIcsDate(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
}

export function downloadIcs(opts: { title: string; start: string; location?: string; description?: string; hours?: number }) {
  const start = new Date(opts.start)
  if (isNaN(start.getTime())) return
  const end = new Date(start.getTime() + (opts.hours ?? 6) * 3600_000)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MOMENTIS//Wedding//TR',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@momentis`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${opts.title}`,
    opts.location ? `LOCATION:${opts.location}` : '',
    opts.description ? `DESCRIPTION:${opts.description}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'dugun.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function mapUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

export function scrollToSection(id: string) {
  const el = document.querySelector(`[data-section-id="${id}"]`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Executes a button action on the live (preview / published) site. */
export function runButtonAction(btn: ButtonConfig, site: WeddingSite) {
  const s = site.settings
  const target = btn.target?.trim() || ''
  const open = (url: string, newTab = true) => {
    if (newTab) window.open(url, '_blank', 'noopener,noreferrer')
    else window.location.href = url
  }

  switch (btn.action) {
    case 'scroll':
      if (target) scrollToSection(target)
      else document.querySelector('[data-site-root]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      break
    case 'rsvp': {
      const rsvp = site.sections.find((x) => x.type === 'rsvp' && x.visible)
      if (rsvp) scrollToSection(rsvp.id)
      break
    }
    case 'link':
      if (target) open(target.startsWith('http') ? target : `https://${target}`, btn.newTab !== false)
      break
    case 'map':
      open(mapUrl(target || s.venueAddress || s.venueName || ''))
      break
    case 'calendar':
      downloadIcs({
        title: btn.eventTitle || site.title || `${s.brideName ?? ''} & ${s.groomName ?? ''} Düğünü`,
        start: target || s.eventDate || '',
        location: btn.eventLocation || [s.venueName, s.venueAddress].filter(Boolean).join(', '),
      })
      break
    case 'phone':
      open(`tel:${normalizePhone(target || s.contactPhone)}`, false)
      break
    case 'whatsapp':
      open(`https://wa.me/${normalizePhone(target || s.contactPhone).replace('+', '')}`)
      break
    case 'email':
      open(`mailto:${target}`, false)
      break
  }
}

export const ACTION_OPTIONS = [
  { value: 'none', label: 'Aksiyon yok' },
  { value: 'scroll', label: 'Bölüme kaydır' },
  { value: 'rsvp', label: 'LCV formuna git' },
  { value: 'link', label: 'Bağlantı aç' },
  { value: 'map', label: 'Haritada aç' },
  { value: 'calendar', label: 'Takvime ekle' },
  { value: 'phone', label: 'Telefon et' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-posta gönder' },
]

export const ACTION_TARGET_HINT: Record<string, string | null> = {
  none: null,
  scroll: 'section',
  rsvp: null,
  link: 'https://…',
  map: 'Adres (boşsa mekan adresi)',
  calendar: 'Tarih (boşsa düğün tarihi)',
  phone: '+90 5xx xxx xx xx',
  whatsapp: '+90 5xx xxx xx xx',
  email: 'ornek@mail.com',
}
