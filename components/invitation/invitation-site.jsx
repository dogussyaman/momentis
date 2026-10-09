'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import QRCode from 'qrcode'
import { MapPin, CalendarDays, Clock, Shirt, ChevronDown, Check, Gift, Music, Copy, Sparkles, QrCode, Download, UsersRound, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getEventType } from '@/lib/data/events'
import { formatEventDate, DEFAULT_MENU_OPTIONS, spotifyEmbedUrl } from '@/lib/projects'
import { AlbumSection } from '@/components/invitation/album-section'
import { InviteActions } from '@/components/invitation/invite-actions'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

const FALLBACK = { palette: { bg: '#F8F4EC', accent: '#C9A96E', text: '#101827', muted: '#8B8577' }, layout: 'classic', cover: null }

function useCountdown(date, time) {
  const target = useMemo(() => (date ? new Date(`${date}T${time || '12:00'}:00`).getTime() : null), [date, time])
  // `now` starts as null so the server render and the first client render are identical
  // (avoids hydration mismatch); the real time is filled in after mount.
  const [now, setNow] = useState(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!target) return null
  if (now === null) return { days: null, hours: null, minutes: null, seconds: null, passed: false, ready: false }
  const diff = Math.max(target - now, 0)
  return { ready: true, days: Math.floor(diff / 86400000), hours: Math.floor((diff / 3600000) % 24), minutes: Math.floor((diff / 60000) % 60), seconds: Math.floor((diff / 1000) % 60), passed: diff === 0 }
}

function Reveal({ children, className, delay = 0, style }) {
  return <motion.div style={style} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.9, delay, ease: EASE }} className={className}>{children}</motion.div>
}

// Deterministic sparkle positions (fixed to avoid SSR/client hydration mismatch).
const SPARKLE_POINTS = [
  { left: '5%', top: '18%', size: 16, delay: 0 },
  { left: '15%', top: '70%', size: 11, delay: 0.9 },
  { left: '28%', top: '30%', size: 9, delay: 1.6 },
  { left: '40%', top: '80%', size: 13, delay: 0.5 },
  { left: '52%', top: '12%', size: 10, delay: 1.2 },
  { left: '63%', top: '68%', size: 15, delay: 0.3 },
  { left: '74%', top: '28%', size: 11, delay: 1.8 },
  { left: '85%', top: '74%', size: 9, delay: 0.7 },
  { left: '93%', top: '22%', size: 14, delay: 1.4 },
  { left: '48%', top: '50%', size: 8, delay: 2.1 },
]

function SparkleField({ color }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden data-testid="countdown-sparkles">
      {SPARKLE_POINTS.map((s, i) => (
        <motion.span
          key={i} className="absolute" style={{ left: s.left, top: s.top, color }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 120, 0] }}
          transition={{ duration: 2.4, delay: s.delay, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
        >
          <Sparkles style={{ width: s.size, height: s.size }} className="fill-current" />
        </motion.span>
      ))}
    </div>
  )
}

export function InvitationSite({ project, template }) {
  const t = template || FALLBACK
  const p = project.palette || t.palette || FALLBACK.palette
  const siteFont = project.website_font || 'playfair'
  const isDark = p.bg && parseInt(p.bg.replace('#', '').slice(0, 2), 16) < 100
  const type = getEventType(project.event_type)
  const names = [project.host_a, project.host_b].filter(Boolean)
  const countdown = useCountdown(project.date, project.time)
  const isNear = !!countdown?.ready && !countdown.passed && countdown.days <= 7
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const coverY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const coverScale = useTransform(scrollYProgress, [0, 1], [1, 1.14])
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([project.venue, project.address, project.city].filter(Boolean).join(', '))}`
  const [deadlinePassed, setDeadlinePassed] = useState(false)
  const [qrImage, setQrImage] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  useEffect(() => {
    setDeadlinePassed(project.rsvp_deadline ? new Date(`${project.rsvp_deadline}T23:59:59`) < new Date() : false)
  }, [project.rsvp_deadline])
  const spotifyEmbed = spotifyEmbedUrl(project.spotify_url)
  useEffect(() => {
    const url = `${window.location.origin}/d/${project.slug || 'ornek-davet'}`
    setShareUrl(url)
    if (project.qr_enabled === false) {
      setQrImage('')
      return
    }
    let active = true
    QRCode.toDataURL(url, { width: 280, margin: 1, color: { dark: '#101827', light: '#FFFFFF' }, errorCorrectionLevel: 'H' })
      .then((image) => { if (active) setQrImage(image) })
      .catch(() => { if (active) setQrImage('') })
    return () => { active = false }
  }, [project.slug, project.qr_enabled])

  const copyShareUrl = async () => {
    try { await navigator.clipboard.writeText(shareUrl); toast.success('Davet sitesi bağlantısı kopyalandı') }
    catch { toast.error('Bağlantı kopyalanamadı') }
  }
  const copyIban = async () => {
    try { await navigator.clipboard.writeText((project.gift_iban || '').replace(/\s+/g, '')); toast.success('IBAN kopyalandı') } catch { toast.error('Kopyalanamadı') }
  }

  return (
    <div className="invitation-site min-h-screen" data-site-font={siteFont} style={{ backgroundColor: p.bg, color: p.text }} data-testid="invitation-site">
      {/* HERO */}
      <section ref={heroRef} className="relative flex min-h-[88svh] flex-col items-center justify-center overflow-hidden px-4 text-center sm:min-h-screen sm:px-6">
        {(project.hero_image || t.cover) && (
          <motion.img initial={{ scale: 1.08, opacity: 0 }} animate={{ scale: 1, opacity: Math.min(100, Math.max(0, Number(project.hero_image_opacity ?? (isDark ? 45 : 22)))) / 100 }} transition={{ duration: 2.4, ease: EASE }} style={{ y: coverY, scale: coverScale }} src={project.hero_image || t.cover} alt="" className="absolute inset-0 h-[120%] w-full object-cover will-change-transform" />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${p.bg}33 0%, ${p.bg}99 58%, ${p.bg} 100%)` }} />
        <div className="pointer-events-none absolute inset-6 border md:inset-10" style={{ borderColor: `${p.accent}55` }} />

        <div className="relative mt-12 w-full px-2 sm:mt-16 sm:px-0">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4, ease: EASE }}>
            <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }} className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] backdrop-blur-sm sm:mb-7 sm:px-4 sm:text-[10px]" style={{ borderColor: `${p.accent}66`, backgroundColor: `${p.bg}AA`, color: p.accent }}>
              <CalendarDays className="h-3 w-3" /> {type?.label || 'Özel davet'}
            </motion.span>
            <p className="text-[10px] uppercase tracking-[0.32em] sm:text-xs sm:tracking-[0.45em]" style={{ color: p.accent }}>{type?.greeting || 'Davetlisiniz'}</p>
            <h1 className="mx-auto mt-6 max-w-4xl text-balance font-serif text-4xl leading-tight sm:mt-8 sm:text-6xl md:text-7xl">
              {[project.host_a, project.host_b].filter(Boolean).join(' & ') || 'Özel Günümüz'}
            </h1>
            <div className="mx-auto my-6 h-px w-14 sm:my-8 sm:w-20" style={{ backgroundColor: p.accent }} />
            <p className="text-sm sm:text-base" style={{ color: p.muted }}>{formatEventDate(project.date, project.time)}</p>
            {(project.venue || project.city || project.address) && <div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2 sm:mt-6 sm:gap-2.5">
              {project.venue && <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] leading-tight backdrop-blur-md sm:px-4 sm:py-2 sm:text-xs" style={{ borderColor: `${p.accent}55`, backgroundColor: `${p.bg}B8`, color: p.text }}><MapPin className="h-3 w-3 shrink-0" style={{ color: p.accent }} /><span className="truncate">{project.venue}</span></span>}
              {project.city && <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] leading-tight backdrop-blur-md sm:px-4 sm:py-2 sm:text-xs" style={{ borderColor: `${p.accent}55`, backgroundColor: `${p.bg}B8`, color: p.text }}><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: p.accent }} /><span className="truncate">{project.city}</span></span>}
              {project.address && <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] leading-tight backdrop-blur-md transition-colors hover:bg-white/70 sm:px-4 sm:py-2 sm:text-xs" style={{ borderColor: `${p.accent}55`, backgroundColor: `${p.bg}B8`, color: p.text }}><MapPin className="h-3 w-3 shrink-0" style={{ color: p.accent }} /><span className="truncate">{project.address}</span></a>}
            </div>}
            <a href="#detaylar" className="mt-8 inline-flex min-h-10 items-center rounded-full border px-5 text-[10px] uppercase tracking-[0.2em] transition-colors sm:mt-10 sm:min-h-11 sm:px-6" style={{ borderColor: `${p.accent}88`, color: p.text }}>Etkinlik detayları</a>
          </motion.div>
        </div>
        <motion.a href="#detaylar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="absolute bottom-5 flex flex-col items-center gap-1.5 text-[9px] uppercase tracking-[0.25em] sm:bottom-8 sm:gap-2 sm:text-[10px] sm:tracking-[0.3em]" style={{ color: p.muted }}>Kaydır <ChevronDown className="h-4 w-4 animate-bounce" /></motion.a>
      </section>

      {/* COUNTDOWN */}
      {countdown && (
        <section className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-16 md:py-20" data-testid="countdown-section">
          {(isNear || countdown.passed) && <SparkleField color={p.accent} />}
          <div className="relative mx-auto max-w-3xl">
            {countdown.passed ? (
              <Reveal className="text-center" data-testid="countdown-celebration">
                <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: p.accent, color: p.bg }}>
                  <Sparkles className="h-7 w-7 fill-current" />
                </motion.div>
                <p className="mt-6 text-[11px] uppercase tracking-[0.4em]" style={{ color: p.accent }}>Nihayet</p>
                <h2 className="mt-4 font-serif text-3xl sm:text-4xl md:text-5xl">Bugün büyük gün!</h2>
              </Reveal>
            ) : (
              <>
                {isNear && (
                  <Reveal className="mb-8 text-center">
                    <motion.span
                      animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.3em]"
                      style={{ backgroundColor: `${p.accent}22`, color: p.accent, border: `1px solid ${p.accent}55` }}
                      data-testid="countdown-near-badge"
                    >
                      <Sparkles className="h-3 w-3 fill-current" /> {countdown.days === 0 ? 'Son saatler' : `Son ${countdown.days} gün`} · Heyecan dorukta
                    </motion.span>
                  </Reveal>
                )}
                <Reveal className="grid grid-cols-4 gap-2 text-center sm:gap-4" data-testid="countdown">
                  {[['Gün', countdown.days], ['Saat', countdown.hours], ['Dakika', countdown.minutes], ['Saniye', countdown.seconds]].map(([l, v], i) => (
                    <motion.div
                      key={l}
                      className="rounded-xl border py-4 sm:rounded-2xl sm:py-6"
                      style={{ borderColor: isNear ? `${p.accent}99` : `${p.accent}44`, boxShadow: isNear ? `0 18px 48px -22px ${p.accent}` : 'none' }}
                      animate={isNear ? { y: [0, -4, 0] } : {}}
                      transition={isNear ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 } : {}}
                    >
                      <p className="font-serif text-2xl sm:text-4xl md:text-5xl">{v === null ? '--' : String(v).padStart(2, '0')}</p>
                      <p className="mt-1 text-[8px] uppercase tracking-[0.16em] sm:mt-2 sm:text-[10px] sm:tracking-[0.3em]" style={{ color: p.muted }}>{l}</p>
                    </motion.div>
                  ))}
                </Reveal>
              </>
            )}
          </div>
        </section>
      )}

      {/* STORY */}
      {project.story && (
        <section className="px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] uppercase tracking-[0.4em]" style={{ color: p.accent }}>Hikâyemiz</p>
            <p className="mt-6 font-serif text-xl leading-relaxed sm:mt-8 sm:text-2xl md:text-3xl" data-testid="story">{project.story}</p>
          </Reveal>
        </section>
      )}

      {/* DETAILS */}
      <section id="detaylar" className="px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <Reveal className="text-center"><p className="text-[10px] uppercase tracking-[0.3em] sm:text-[11px] sm:tracking-[0.4em]" style={{ color: p.accent }}>Detaylar</p><h2 className="mt-4 font-serif text-3xl sm:mt-6 sm:text-4xl md:text-5xl">Sizi aramızda görmek istiyoruz</h2></Reveal>
          <div className="mt-8 grid gap-px sm:mt-14 md:grid-cols-3" style={{ backgroundColor: `${p.accent}33` }}>
            <Detail icon={CalendarDays} label="Tarih" value={project.date ? new Date(`${project.date}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }) : '—'} p={p} />
            <Detail icon={Clock} label="Saat" value={project.time || '—'} p={p} />
            <Detail icon={MapPin} label="Mekân" value={project.venue || '—'} sub={[project.address, project.city].filter(Boolean).join(', ')} link={project.venue ? { href: mapsUrl, label: 'Yol tarifi al' } : null} p={p} />
          </div>
          {(project.bride_mother || project.bride_father || project.groom_mother || project.groom_father) && (
            <Reveal className="mt-8 rounded-2xl border p-5 sm:mt-10 sm:rounded-3xl sm:p-7" style={{ borderColor: `${p.accent}44`, backgroundColor: `${p.accent}08` }}>
              <div className="mb-5 flex items-center justify-center gap-2 text-center">
                <UsersRound className="h-4 w-4" style={{ color: p.accent }} />
                <h3 className="font-serif text-xl sm:text-2xl">Ailelerimiz</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[[project.host_a, project.bride_mother, project.bride_father], [project.host_b, project.groom_mother, project.groom_father]].map(([person, mother, father], index) => (person || mother || father) && (
                  <div key={index} className="rounded-xl border p-4 sm:rounded-2xl sm:p-5" style={{ borderColor: `${p.accent}33`, backgroundColor: p.bg }}>
                    <p className="mb-3 text-center font-serif text-lg">{person || (index === 0 ? 'Gelin ailesi' : 'Damat ailesi')}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {mother && <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] sm:text-xs" style={{ borderColor: `${p.accent}44`, color: p.text }}><UserRound className="h-3 w-3" style={{ color: p.accent }} /> Anne · {mother}</span>}
                      {father && <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] sm:text-xs" style={{ borderColor: `${p.accent}44`, color: p.text }}><UserRound className="h-3 w-3" style={{ color: p.accent }} /> Baba · {father}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
          {project.dress_code && <Reveal className="mt-10 flex items-center justify-center gap-3 text-sm"><Shirt className="h-4 w-4" style={{ color: p.accent }} /> <span style={{ color: p.muted }}>Kıyafet:</span> {project.dress_code}</Reveal>}
          <Reveal><InviteActions project={project} p={p} /></Reveal>
        </div>
      </section>

      {/* PROGRAM */}
      {project.program?.length > 0 && (
        <section className="px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <div className="mx-auto max-w-2xl">
            <Reveal className="text-center"><p className="text-[11px] uppercase tracking-[0.4em]" style={{ color: p.accent }}>Program</p></Reveal>
            <ol className="mt-8 space-y-4 sm:mt-12 sm:space-y-6">
              {project.program.map((item, i) => (
                <Reveal key={i} delay={i * 0.06} className="flex items-baseline gap-4 border-b pb-4 sm:gap-6 sm:pb-6" style={{ borderColor: `${p.accent}33` }}>
                  <span className="w-14 shrink-0 font-serif text-lg sm:w-16 sm:text-xl" style={{ color: p.accent }}>{item.time}</span>
                  <span className="text-base sm:text-lg">{item.title}</span>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* SPOTIFY */}
      {spotifyEmbed && (
        <section className="px-4 py-12 sm:px-6 sm:py-16 md:py-20" data-testid="spotify-section">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.4em]" style={{ color: p.accent }}><Music className="h-3.5 w-3.5" /> Gecenin Sesi</p>
            <h2 className="mt-4 font-serif text-3xl sm:mt-6 sm:text-4xl md:text-5xl">Çalma listemiz</h2>
            <div className="mt-6 overflow-hidden rounded-2xl shadow-[0_30px_60px_-28px_rgba(16,24,39,0.5)] sm:mt-10 sm:rounded-3xl">
              <iframe title="Spotify" src={spotifyEmbed} width="100%" height="352" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style={{ display: 'block', border: 0 }} />
            </div>
            <a href={project.spotify_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] underline-offset-4 hover:underline" style={{ color: p.accent }}>
              <Music className="h-3.5 w-3.5" /> Spotify'da Aç
            </a>
          </Reveal>
        </section>
      )}

      {/* GIFT */}
      {project.gift_enabled && (
        <section id="hediye" className="px-4 py-12 sm:px-6 sm:py-16 md:py-20" data-testid="gift-section">
          <Reveal className="mx-auto max-w-xl text-center">
            <p className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.4em]" style={{ color: p.accent }}><Gift className="h-3.5 w-3.5" /> Hediye</p>
            <h2 className="mt-4 font-serif text-3xl sm:mt-6 sm:text-4xl md:text-5xl">Hediye tercihi</h2>
            {project.gift_message && <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed" style={{ color: p.muted }}>{project.gift_message}</p>}
            {(project.gift_iban || project.gift_account_name) && (
              <div className="mx-auto mt-6 rounded-2xl border p-5 text-left sm:mt-10 sm:rounded-3xl sm:p-7" style={{ borderColor: `${p.accent}55` }}>
                {project.gift_account_name && (
                  <div className="mb-4">
                    <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: p.muted }}>Hesap Sahibi</p>
                    <p className="mt-1 font-serif text-xl">{project.gift_account_name}</p>
                  </div>
                )}
                {project.gift_iban && (
                  <>
                    <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: p.muted }}>IBAN</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="break-all font-mono text-sm" data-testid="gift-iban">{project.gift_iban}</p>
                      <button type="button" onClick={copyIban} className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.18em] transition-opacity hover:opacity-80" style={{ backgroundColor: p.accent, color: p.bg }} data-testid="gift-copy-iban"><Copy className="h-3 w-3" /> Kopyala</button>
                    </div>
                  </>
                )}
              </div>
            )}
            {project.gift_url && (
              <a href={project.gift_url} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[11px] uppercase tracking-[0.2em] transition-opacity hover:opacity-90" style={{ backgroundColor: p.accent, color: p.bg }} data-testid="gift-url">
                Hediye Listesini Gör <Gift className="h-3.5 w-3.5" />
              </a>
            )}
          </Reveal>
        </section>
      )}

      {/* RSVP */}
      <section id="rsvp" className="px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-xl">
          <Reveal className="text-center">
            <p className="text-[11px] uppercase tracking-[0.4em]" style={{ color: p.accent }}>RSVP</p>
            <h2 className="mt-4 font-serif text-3xl sm:mt-6 sm:text-4xl md:text-5xl">Katılımınızı bildirin</h2>
            {project.rsvp_deadline && <p className="mt-4 text-sm" style={{ color: p.muted }}>Lütfen {new Date(`${project.rsvp_deadline}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} tarihine kadar yanıtlayın.</p>}
          </Reveal>
          <Reveal delay={0.1} className="mt-8 sm:mt-12">
            {deadlinePassed ? <p className="text-center" style={{ color: p.muted }}>RSVP süresi sona erdi. Sorularınız için ev sahipleriyle iletişime geçebilirsiniz.</p> : <RsvpForm project={project} p={p} isDark={isDark} />}
          </Reveal>
        </div>
      </section>

      {project.album_enabled !== false && <AlbumSection project={project} p={p} isDark={isDark} />}

      {project.qr_enabled !== false && (
        <section className="px-4 py-12 sm:px-6 sm:py-16 md:py-20" data-testid="site-qr-section">
          <Reveal className="mx-auto grid max-w-4xl items-center gap-8 rounded-[1.5rem] border p-5 sm:gap-10 sm:rounded-[2rem] sm:p-8 md:grid-cols-[1fr_auto] md:p-10" style={{ borderColor: `${p.accent}55`, backgroundColor: `${p.accent}0A` }}>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.2em] sm:text-[10px]" style={{ backgroundColor: `${p.accent}22`, color: p.accent }}><QrCode className="h-3.5 w-3.5" /> Kolay paylaşım</span>
              <h2 className="mt-4 font-serif text-2xl sm:mt-5 sm:text-3xl md:text-4xl">Davet sayfasına hızlıca ulaşın</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: p.muted }}>{project.qr_message || 'Bu QR kodunu paylaşarak davet sayfasına hızlıca ulaşabilirsiniz.'}</p>
              <p className="mt-3 break-all text-xs" style={{ color: p.muted }}>{shareUrl}</p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <button type="button" onClick={copyShareUrl} className="inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[10px] font-medium uppercase tracking-[0.16em] transition-transform hover:-translate-y-0.5 sm:min-h-11 sm:px-5" style={{ backgroundColor: p.accent, color: p.bg }}><Copy className="h-3.5 w-3.5" /> Bağlantıyı kopyala</button>
                {qrImage && <a href={qrImage} download={`${project.slug || 'davet'}-qr.png`} className="inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors hover:bg-white/50 sm:min-h-11 sm:px-5" style={{ borderColor: `${p.accent}66`, color: p.text }}><Download className="h-3.5 w-3.5" /> QR indir</a>}
              </div>
            </div>
            <div className="mx-auto rounded-2xl bg-white p-3 shadow-[0_18px_50px_-25px_rgba(16,24,39,0.4)] sm:p-4">
              {qrImage ? <img src={qrImage} alt="Davet sayfası QR kodu" className="h-36 w-36 sm:h-44 sm:w-44" /> : <div className="flex h-36 w-36 items-center justify-center sm:h-44 sm:w-44"><QrCode className="h-16 w-16" style={{ color: p.accent }} /></div>}
            </div>
          </Reveal>
        </section>
      )}

      <footer className="px-4 py-10 text-center sm:px-6 sm:py-12">
        <div className="mx-auto mb-6 h-px w-12" style={{ backgroundColor: p.accent }} />
        <p className="font-serif text-2xl">{names.join(' & ')}</p>
        {project.remove_branding !== true && <a href="/" className="mt-6 inline-block text-[10px] uppercase tracking-[0.35em]" style={{ color: p.muted }}>Momentis ile hazırlandı</a>}
      </footer>
    </div>
  )
}

function Detail({ icon: Icon, label, value, sub, link, p }) {
  return (
    <Reveal className="p-5 text-center sm:p-8" style={{ backgroundColor: p.bg }}>
      <Icon className="mx-auto h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.4} style={{ color: p.accent }} />
      <p className="mt-3 text-[9px] uppercase tracking-[0.2em] sm:mt-4 sm:text-[10px] sm:tracking-[0.3em]" style={{ color: p.muted }}>{label}</p>
      <p className="mt-2 break-words font-serif text-lg sm:text-xl">{value}</p>
      {sub && <p className="mt-1 text-sm" style={{ color: p.muted }}>{sub}</p>}
      {link && <a href={link.href} target="_blank" rel="noreferrer" className="mt-3 inline-block border-b text-[11px] uppercase tracking-[0.2em]" style={{ borderColor: p.accent, color: p.accent }}>{link.label}</a>}
    </Reveal>
  )
}

function RsvpForm({ project, p, isDark }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', attending: null, guest_count: 1, menu: '', note: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(null)
  const menuOptions = project.advanced_rsvp === false
    ? []
    : project.menu_options?.length ? project.menu_options : DEFAULT_MENU_OPTIONS
  const fieldStyle = { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: `${p.accent}66`, color: p.text }

  const submit = async (e) => {
    e.preventDefault()
    if (form.attending === null) { toast.error('Lütfen katılım durumunuzu seçin'); return }
    if (!form.email.trim() && !form.phone.trim()) { toast.error('Lütfen e-posta veya telefon numarası girin'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/public/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, slug: project.slug }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Yanıt gönderilemedi')
      setDone(data)
    } catch (err) { toast.error(err.message) } finally { setLoading(false) }
  }

  if (done) {
    return (
      <div className="rounded-3xl border p-10 text-center" style={{ borderColor: `${p.accent}66` }} data-testid="rsvp-success">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: p.accent, color: p.bg }}><Check className="h-5 w-5" /></div>
        <p className="mt-6 font-serif text-3xl">Teşekkürler!</p>
        <p className="mt-3" style={{ color: p.muted }}>{done.rsvp?.attending ? 'Katılımınız kaydedildi. Sizi aramızda görmek için sabırsızlanıyoruz.' : 'Yanıtınız kaydedildi. Sizi çok özleyeceğiz.'}</p>
        {done.confirmations?.some((c) => c.status !== 'failed') && <p className="mt-2 text-xs" style={{ color: p.muted }}>Onay mesajı gönderildi.</p>}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6" data-testid="rsvp-form">
      <div className="grid grid-cols-2 gap-3">
        {[{ v: true, l: 'Katılıyorum' }, { v: false, l: 'Katılamıyorum' }].map((o) => (
          <button key={String(o.v)} type="button" onClick={() => setForm({ ...form, attending: o.v })} data-testid={`rsvp-attending-${o.v}`} className="rounded-2xl border py-4 text-[11px] uppercase tracking-[0.2em] transition-all" style={form.attending === o.v ? { backgroundColor: p.accent, borderColor: p.accent, color: p.bg } : { borderColor: `${p.accent}66`, color: p.text }}>{o.l}</button>
        ))}
      </div>
      <div className="space-y-2"><Label className="text-[10px] uppercase tracking-[0.25em]" style={{ color: p.muted }}>Ad Soyad *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 rounded-2xl" style={fieldStyle} data-testid="rsvp-name" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-[0.25em]" style={{ color: p.muted }}>E-posta</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 rounded-2xl" style={fieldStyle} data-testid="rsvp-email" /></div>
        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-[0.25em]" style={{ color: p.muted }}>Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0532 123 45 67" className="h-12 rounded-2xl" style={fieldStyle} data-testid="rsvp-phone" /></div>
      </div>
      {form.attending && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-[0.25em]" style={{ color: p.muted }}>Kişi Sayısı</Label>
            <div className="flex gap-2">{[1, 2, 3, 4].map((n) => <button key={n} type="button" onClick={() => setForm({ ...form, guest_count: n })} data-testid={`rsvp-count-${n}`} className="h-12 flex-1 rounded-xl border font-serif text-lg" style={form.guest_count === n ? { backgroundColor: p.accent, borderColor: p.accent, color: p.bg } : { borderColor: `${p.accent}66` }}>{n}</button>)}</div>
          </div>
          {menuOptions.length > 0 && <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-[0.25em]" style={{ color: p.muted }}>Menü Tercihi</Label>
            <div className="flex flex-wrap gap-2">{menuOptions.map((m) => <button key={m} type="button" onClick={() => setForm({ ...form, menu: m })} data-testid={`rsvp-menu-${m}`} className="h-12 flex-1 rounded-xl border px-3 text-xs uppercase tracking-[0.15em]" style={form.menu === m ? { backgroundColor: p.accent, borderColor: p.accent, color: p.bg } : { borderColor: `${p.accent}66` }}>{m}</button>)}</div>
          </div>}
        </div>
      )}
      <div className="space-y-2"><Label className="text-[10px] uppercase tracking-[0.25em]" style={{ color: p.muted }}>Notunuz</Label><Textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="İletmek istediğiniz bir şey var mı?" className="rounded-2xl" style={fieldStyle} data-testid="rsvp-note" /></div>
      <p className="text-xs" style={{ color: p.muted }}>Onay mesajı alabilmeniz için e-posta veya telefon gereklidir.</p>
      <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl text-[12px] uppercase tracking-[0.22em] hover:opacity-90" style={{ backgroundColor: p.accent, color: p.bg }} data-testid="rsvp-submit">{loading ? 'Gönderiliyor…' : 'Yanıtımı Gönder'}</Button>
    </form>
  )
}
