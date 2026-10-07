import React, { useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export const FONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Montserrat:wght@300;400;500&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Inter:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300&family=Nunito+Sans:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&family=Italiana&family=Manrope:wght@300;400;500&display=swap"

export const ease = [0.22, 1, 0.36, 1]

export const Reveal = ({ children, delay = 0, className = '', y = 28 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.9, delay, ease }}
  >
    {children}
  </motion.div>
)

export const useParallax = (from, to, range = 700) => {
  const { scrollY } = useScroll()
  return useTransform(scrollY, [0, range], [from, to])
}

export function downloadICS(project) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Momentis//TR',
    'BEGIN:VEVENT',
    `UID:momentis-davet-${project.slug}@momentis`,
    `DTSTART:${(project.date || '').replace(/-/g, '')}T${(project.time || '16:00').replace(':', '')}00`,
    `DTEND:${(project.date || '').replace(/-/g, '')}T235900`,
    `SUMMARY:${project.host_a} & ${project.host_b} Etkinliği`,
    `LOCATION:${project.venue}, ${project.address}`,
    'DESCRIPTION:Sizi aramızda görmekten mutluluk duyarız.',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'davet.ics'
  a.click()
  URL.revokeObjectURL(url)
}

export const getMapsUrl = (project) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((project.venue || '') + ' ' + (project.address || ''))}`

export const Btn = ({ children, className = '', ...p }) => (
  <motion.button
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.97 }}
    transition={{ duration: 0.25, ease }}
    className={className}
    {...p}
  >
    {children}
  </motion.button>
)

export function Rsvp({ c, project }) {
  const [f, setF] = useState({ name: '', guests: 1, attend: 'yes' })
  const [sent, setSent] = useState(false)
  if (sent)
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={c.ok}
      >
        {f.attend === 'yes'
          ? `Teşekkürler ${f.name}, sizi aramızda görmek için sabırsızlanıyoruz.`
          : `Teşekkürler ${f.name}, yanıtınız bize ulaştı. Sizi özleyeceğiz.`}
      </motion.div>
    )
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (f.name.trim()) setSent(true)
      }}
      className="space-y-4"
    >
      <input
        required
        value={f.name}
        onChange={(e) => setF({ ...f, name: e.target.value })}
        placeholder="Adınız ve soyadınız"
        className={c.input}
      />
      <div className="flex gap-3">
        {[
          ['yes', 'Katılıyorum'],
          ['no', 'Katılamıyorum'],
        ].map(([v, l]) => (
          <button
            type="button"
            key={v}
            onClick={() => setF({ ...f, attend: v })}
            className={f.attend === v ? c.on : c.off}
          >
            {l}
          </button>
        ))}
      </div>
      {f.attend === 'yes' && (
        <select
          value={f.guests}
          onChange={(e) => setF({ ...f, guests: +e.target.value })}
          className={c.input}
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n} className="text-black">
              {n} kişi
            </option>
          ))}
        </select>
      )}
      <Btn type="submit" className={c.btn}>
        Yanıtı gönder
      </Btn>
    </form>
  )
}

export const VenueBlock = ({ btn, text = '', project }) => (
  <div className="space-y-3">
    <h3 className="text-3xl">{project.venue || 'Mekân Adı'}</h3>
    <p className={`leading-relaxed ${text}`}>{project.address || 'Mekân Adresi'}</p>
    <div className="flex flex-wrap gap-3 pt-3">
      <Btn className={btn} onClick={() => window.open(getMapsUrl(project), '_blank')}>
        Yol tarifi al
      </Btn>
      <Btn className={btn} onClick={() => downloadICS(project)}>
        Takvime ekle
      </Btn>
    </div>
  </div>
)
