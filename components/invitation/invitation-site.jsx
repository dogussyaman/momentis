'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { MapPin, CalendarDays, Clock, Shirt, ChevronDown, Check, Gift, Music, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getEventType } from '@/lib/data/events'
import { formatEventDate, DEFAULT_MENU_OPTIONS, spotifyEmbedUrl } from '@/lib/projects'
import { AlbumSection } from '@/components/invitation/album-section'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

const FALLBACK = { palette: { bg: '#F8F4EC', accent: '#C9A96E', text: '#101827', muted: '#8B8577' }, layout: 'classic', cover: null }

function useCountdown(date, time) {
  const target = useMemo(() => (date ? new Date(`${date}T${time || '12:00'}:00`).getTime() : null), [date, time])
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  if (!target) return null
  const diff = Math.max(target - now, 0)
  return { days: Math.floor(diff / 86400000), hours: Math.floor((diff / 3600000) % 24), minutes: Math.floor((diff / 60000) % 60), seconds: Math.floor((diff / 1000) % 60), passed: diff === 0 }
}

function Reveal({ children, className, delay = 0, style }) {
  return <motion.div style={style} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.9, delay, ease: EASE }} className={className}>{children}</motion.div>
}

export function InvitationSite({ project, template }) {
  const t = template || FALLBACK
  const p = project.palette || t.palette || FALLBACK.palette
  const isDark = p.bg && parseInt(p.bg.replace('#', '').slice(0, 2), 16) < 100
  const type = getEventType(project.event_type)
  const names = [project.host_a, project.host_b].filter(Boolean)
  const countdown = useCountdown(project.date, project.time)
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const coverY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const coverScale = useTransform(scrollYProgress, [0, 1], [1, 1.14])
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([project.venue, project.address, project.city].filter(Boolean).join(', '))}`
  const deadlinePassed = project.rsvp_deadline ? new Date(`${project.rsvp_deadline}T23:59:59`) < new Date() : false
  const spotifyEmbed = spotifyEmbedUrl(project.spotify_url)
  const copyIban = async () => {
    try { await navigator.clipboard.writeText((project.gift_iban || '').replace(/\s+/g, '')); toast.success('IBAN kopyalandı') } catch { toast.error('Kopyalanamadı') }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: p.bg, color: p.text }} data-testid="invitation-site">
      {/* HERO */}
      <section ref={heroRef} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        {t.cover && (
          <motion.img initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: isDark ? 0.45 : 0.22 }} transition={{ duration: 2.4, ease: EASE }} style={{ y: coverY, scale: coverScale }} src={t.cover} alt="" className="absolute inset-0 h-[120%] w-full object-cover will-change-transform" />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${p.bg}22 0%, ${p.bg}AA 55%, ${p.bg} 100%)` }} />
        <div className="pointer-events-none absolute inset-6 border md:inset-10" style={{ borderColor: `${p.accent}55` }} />

        <div className="relative">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4, ease: EASE }} className="text-[11px] uppercase tracking-[0.45em]" style={{ color: p.accent }}>{type?.greeting || 'Davetlisiniz'}</motion.p>
          <h1 className="mt-8 font-serif leading-[1.02]" style={{ fontSize: 'clamp(2.75rem, 9vw, 7rem)' }}>
            {names.map((n, i) => (
              <span key={n} className="block overflow-hidden">
                <motion.span initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 1.1, delay: 0.6 + i * 0.2, ease: EASE }} className="block" data-testid={`hero-name-${i}`}>{i === 1 && <span className="mr-4 font-serif italic" style={{ color: p.accent }}>&amp;</span>}{n}</motion.span>
              </span>
            ))}
          </h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.3 }} className="mt-10 space-y-2">
            <div className="mx-auto h-px w-12" style={{ backgroundColor: p.accent }} />
            <p className="text-sm uppercase tracking-[0.28em]" data-testid="hero-date">{formatEventDate(project.date, project.time)}</p>
            {project.venue && <p className="text-sm" style={{ color: p.muted }}>{[project.venue, project.city].filter(Boolean).join(', ')}</p>}
          </motion.div>
        </div>
        <motion.a href="#detaylar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="absolute bottom-10 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em]" style={{ color: p.muted }}>Kaydır <ChevronDown className="h-4 w-4 animate-bounce" /></motion.a>
      </section>

      {/* COUNTDOWN */}
      {countdown && !countdown.passed && (
        <section className="px-6 py-20">
          <Reveal className="mx-auto grid max-w-3xl grid-cols-4 gap-4 text-center" data-testid="countdown">
            {[['Gün', countdown.days], ['Saat', countdown.hours], ['Dakika', countdown.minutes], ['Saniye', countdown.seconds]].map(([l, v]) => (
              <div key={l} className="rounded-2xl border py-6" style={{ borderColor: `${p.accent}44` }}>
                <p className="font-serif text-4xl md:text-5xl">{String(v).padStart(2, '0')}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.3em]" style={{ color: p.muted }}>{l}</p>
              </div>
            ))}
          </Reveal>
        </section>
      )}

      {/* STORY */}
      {project.story && (
        <section className="px-6 py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] uppercase tracking-[0.4em]" style={{ color: p.accent }}>Hikâyemiz</p>
            <p className="mt-8 font-serif text-2xl leading-relaxed md:text-3xl" data-testid="story">{project.story}</p>
          </Reveal>
        </section>
      )}

      {/* DETAILS */}
      <section id="detaylar" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <Reveal className="text-center"><p className="text-[11px] uppercase tracking-[0.4em]" style={{ color: p.accent }}>Detaylar</p><h2 className="mt-6 font-serif text-4xl md:text-5xl">Sizi aramızda görmek istiyoruz</h2></Reveal>
          <div className="mt-14 grid gap-px md:grid-cols-3" style={{ backgroundColor: `${p.accent}33` }}>
            <Detail icon={CalendarDays} label="Tarih" value={project.date ? new Date(`${project.date}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }) : '—'} p={p} />
            <Detail icon={Clock} label="Saat" value={project.time || '—'} p={p} />
            <Detail icon={MapPin} label="Mekân" value={project.venue || '—'} sub={[project.address, project.city].filter(Boolean).join(', ')} link={project.venue ? { href: mapsUrl, label: 'Yol tarifi al' } : null} p={p} />
          </div>
          {project.dress_code && <Reveal className="mt-10 flex items-center justify-center gap-3 text-sm"><Shirt className="h-4 w-4" style={{ color: p.accent }} /> <span style={{ color: p.muted }}>Kıyafet:</span> {project.dress_code}</Reveal>}
        </div>
      </section>

      {/* PROGRAM */}
      {project.program?.length > 0 && (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-2xl">
            <Reveal className="text-center"><p className="text-[11px] uppercase tracking-[0.4em]" style={{ color: p.accent }}>Program</p></Reveal>
            <ol className="mt-12 space-y-6">
              {project.program.map((item, i) => (
                <Reveal key={i} delay={i * 0.06} className="flex items-baseline gap-6 border-b pb-6" style={{ borderColor: `${p.accent}33` }}>
                  <span className="w-16 shrink-0 font-serif text-xl" style={{ color: p.accent }}>{item.time}</span>
                  <span className="text-lg">{item.title}</span>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* SPOTIFY */}
      {spotifyEmbed && (
        <section className="px-6 py-20" data-testid="spotify-section">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.4em]" style={{ color: p.accent }}><Music className="h-3.5 w-3.5" /> Gecenin Sesi</p>
            <h2 className="mt-6 font-serif text-4xl md:text-5xl">Çalma listemiz</h2>
            <div className="mt-10 overflow-hidden rounded-3xl shadow-[0_30px_60px_-28px_rgba(16,24,39,0.5)]">
              <iframe title="Spotify" src={spotifyEmbed} width="100%" height="352" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style={{ display: 'block', border: 0 }} />
            </div>
          </Reveal>
        </section>
      )}

      {/* GIFT */}
      {project.gift_enabled && (
        <section id="hediye" className="px-6 py-20" data-testid="gift-section">
          <Reveal className="mx-auto max-w-xl text-center">
            <p className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.4em]" style={{ color: p.accent }}><Gift className="h-3.5 w-3.5" /> Hediye</p>
            <h2 className="mt-6 font-serif text-4xl md:text-5xl">Hediye tercihi</h2>
            {project.gift_message && <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed" style={{ color: p.muted }}>{project.gift_message}</p>}
            {(project.gift_iban || project.gift_account_name) && (
              <div className="mx-auto mt-10 rounded-3xl border p-7 text-left" style={{ borderColor: `${p.accent}55` }}>
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
      <section id="rsvp" className="px-6 py-24">
        <div className="mx-auto max-w-xl">
          <Reveal className="text-center">
            <p className="text-[11px] uppercase tracking-[0.4em]" style={{ color: p.accent }}>RSVP</p>
            <h2 className="mt-6 font-serif text-4xl md:text-5xl">Katılımınızı bildirin</h2>
            {project.rsvp_deadline && <p className="mt-4 text-sm" style={{ color: p.muted }}>Lütfen {new Date(`${project.rsvp_deadline}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} tarihine kadar yanıtlayın.</p>}
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            {deadlinePassed ? <p className="text-center" style={{ color: p.muted }}>RSVP süresi sona erdi. Sorularınız için ev sahipleriyle iletişime geçebilirsiniz.</p> : <RsvpForm project={project} p={p} isDark={isDark} />}
          </Reveal>
        </div>
      </section>

      {project.album_enabled !== false && <AlbumSection project={project} p={p} isDark={isDark} />}

      <footer className="px-6 py-12 text-center">
        <div className="mx-auto mb-6 h-px w-12" style={{ backgroundColor: p.accent }} />
        <p className="font-serif text-2xl">{names.join(' & ')}</p>
        <a href="/" className="mt-6 inline-block text-[10px] uppercase tracking-[0.35em]" style={{ color: p.muted }}>Momentis ile hazırlandı</a>
      </footer>
    </div>
  )
}

function Detail({ icon: Icon, label, value, sub, link, p }) {
  return (
    <Reveal className="p-8 text-center" style={{ backgroundColor: p.bg }}>
      <Icon className="mx-auto h-5 w-5" strokeWidth={1.4} style={{ color: p.accent }} />
      <p className="mt-4 text-[10px] uppercase tracking-[0.3em]" style={{ color: p.muted }}>{label}</p>
      <p className="mt-2 font-serif text-xl">{value}</p>
      {sub && <p className="mt-1 text-sm" style={{ color: p.muted }}>{sub}</p>}
      {link && <a href={link.href} target="_blank" rel="noreferrer" className="mt-3 inline-block border-b text-[11px] uppercase tracking-[0.2em]" style={{ borderColor: p.accent, color: p.accent }}>{link.label}</a>}
    </Reveal>
  )
}

function RsvpForm({ project, p, isDark }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', attending: null, guest_count: 1, menu: '', note: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(null)
  const menuOptions = project.menu_options?.length ? project.menu_options : DEFAULT_MENU_OPTIONS
  const fieldStyle = { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: `${p.accent}66`, color: p.text }

  const submit = async (e) => {
    e.preventDefault()
    if (form.attending === null) { toast.error('Lütfen katılım durumunuzu seçin'); return }
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
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-[0.25em]" style={{ color: p.muted }}>Menü Tercihi</Label>
            <div className="flex flex-wrap gap-2">{menuOptions.map((m) => <button key={m} type="button" onClick={() => setForm({ ...form, menu: m })} data-testid={`rsvp-menu-${m}`} className="h-12 flex-1 rounded-xl border px-3 text-xs uppercase tracking-[0.15em]" style={form.menu === m ? { backgroundColor: p.accent, borderColor: p.accent, color: p.bg } : { borderColor: `${p.accent}66` }}>{m}</button>)}</div>
          </div>
        </div>
      )}
      <div className="space-y-2"><Label className="text-[10px] uppercase tracking-[0.25em]" style={{ color: p.muted }}>Notunuz</Label><Textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="İletmek istediğiniz bir şey var mı?" className="rounded-2xl" style={fieldStyle} data-testid="rsvp-note" /></div>
      <p className="text-xs" style={{ color: p.muted }}>Onay mesajı alabilmeniz için e-posta veya telefon gereklidir.</p>
      <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl text-[12px] uppercase tracking-[0.22em] hover:opacity-90" style={{ backgroundColor: p.accent, color: p.bg }} data-testid="rsvp-submit">{loading ? 'Gönderiliyor…' : 'Yanıtımı Gönder'}</Button>
    </form>
  )
}
