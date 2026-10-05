'use client'

import { useEffect, useState } from 'react'
import { CalendarPlus, MessageCircle, Apple } from 'lucide-react'

// Build a floating-local datetime stamp: YYYYMMDDTHHMMSS
function stamp(date, timeStr, addHours = 0) {
  const [y, m, d] = String(date).split('-').map(Number)
  const [hh, mm] = String(timeStr || '12:00').split(':').map(Number)
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0)
  dt.setHours(dt.getHours() + addHours)
  const pad = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`
}
function dayStamp(date, addDays = 0) {
  const [y, m, d] = String(date).split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, (d || 1) + addDays)
  const pad = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}`
}

export function InviteActions({ project, p }) {
  const [url, setUrl] = useState('')
  useEffect(() => { setUrl(window.location.href.split('#')[0]) }, [])
  const hasTime = Boolean(project.time)
  const title = project.title || `${[project.host_a, project.host_b].filter(Boolean).join(' & ')} Daveti`
  const location = [project.venue, project.address, project.city].filter(Boolean).join(', ')
  const details = `${[project.host_a, project.host_b].filter(Boolean).join(' & ')} sizi aralarında görmek istiyor.${url ? `\\n\\nDavetiye: ${url}` : ''}`

  if (!project.date) return null

  const googleDates = hasTime
    ? `${stamp(project.date, project.time)}/${stamp(project.date, project.time, 4)}`
    : `${dayStamp(project.date)}/${dayStamp(project.date, 1)}`
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${googleDates}&ctz=Europe/Istanbul&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`

  const downloadIcs = () => {
    const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
    const start = hasTime ? stamp(project.date, project.time) : dayStamp(project.date)
    const end = hasTime ? stamp(project.date, project.time, 4) : dayStamp(project.date, 1)
    const dtLines = hasTime ? `DTSTART:${start}\nDTEND:${end}` : `DTSTART;VALUE=DATE:${start}\nDTEND;VALUE=DATE:${end}`
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Momentis//TR', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${project.slug}-${Date.now()}@momentis`, `DTSTAMP:${dtstamp}`, dtLines, `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(details)}`, `LOCATION:${esc(location)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\n')
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href; a.download = `${project.slug || 'davetiye'}.ics`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(href)
  }

  const waText = `${title}${url ? `\n${url}` : ''}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`

  const base = 'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[11px] uppercase tracking-[0.16em] transition-all hover:-translate-y-0.5'
  const outlineStyle = { border: `1px solid ${p.accent}66`, color: p.text }
  const solidStyle = { backgroundColor: p.accent, color: p.bg }

  return (
    <div className="mt-12 flex flex-wrap items-center justify-center gap-3" data-testid="invite-actions">
      <a href={googleUrl} target="_blank" rel="noreferrer" className={base} style={solidStyle} data-testid="cal-google">
        <CalendarPlus className="h-4 w-4" /> Google Takvim
      </a>
      <button type="button" onClick={downloadIcs} className={base} style={outlineStyle} data-testid="cal-apple">
        <Apple className="h-4 w-4" /> Apple / .ics
      </button>
      <a href={whatsappUrl} target="_blank" rel="noreferrer" className={base} style={outlineStyle} data-testid="share-whatsapp">
        <MessageCircle className="h-4 w-4" /> WhatsApp'ta Paylaş
      </a>
    </div>
  )
}
