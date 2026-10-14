'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  CalendarDays,
  Clock3,
  MapPin,
  Sparkles,
  Heart,
  Navigation,
  Compass,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  QrCode,
  Camera,
  ImagePlus,
  CheckCircle2,
  Music2,
  BedDouble,
  Car,
  Gift,
  ArrowRight,
  Menu,
} from 'lucide-react'
import { VipDemoBanner, VipFooterActions } from '@/components/vip-design/vip-controls'

// ── DATA & MEDIA ──
const TARGET_DATE = new Date('2027-06-24T19:00:00').getTime()

const GALLERY = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    title: 'Gece ve Şehir Işıkları',
    subtitle: 'İzmir Rıhtımında İlk Bakış',
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    title: 'Editoryal Silüet',
    subtitle: 'Mavi Saatlerin Büyüsü',
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80',
    title: 'Rıhtımda Dans',
    subtitle: 'Rüzgarda Yankılanan Gülüşler',
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
    title: 'Zarif Ayrıntılar',
    subtitle: 'Altın ve Gece Mavisi Uyum',
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
    title: 'Sonsuz Sözler',
    subtitle: 'Deniz Kenarında Yemin',
  },
]

type GuestPhoto = { id: string; url: string; uploader: string; note?: string; time: string }
const INITIAL_GUEST_PHOTOS: GuestPhoto[] = [
  {
    id: 'g-201',
    url: 'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&w=600&q=80',
    uploader: 'Bora & Aslı',
    note: 'Gecenin en asil çiftine sonsuz mutluluklar! 🥂',
    time: '15 dk önce',
  },
  {
    id: 'g-202',
    url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=600&q=80',
    uploader: 'Melis',
    note: 'Işıklar altında harika görünüyorsunuz ✨',
    time: '40 dk önce',
  },
]

export function Ozel2Client() {
  // ── COUNTDOWN ──
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = TARGET_DATE - Date.now()
      if (diff <= 0) return
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  // ── AUTO-SCROLL GALLERY ──
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<typeof GALLERY[0] | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let animId: number
    const step = () => {
      if (!isPaused && el) {
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
          el.scrollLeft = 0
        } else {
          el.scrollLeft += 0.8
        }
      }
      animId = requestAnimationFrame(step)
    }
    animId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animId)
  }, [isPaused])

  // ── MAP COPY & TAB ──
  const [copied, setCopied] = useState(false)
  const [mapTab, setMapTab] = useState<'map' | 'satellite'>('map')
  const venueAddress = 'Rıhtım Teras, Kordon Boyu No: 18, Konak / İzmir'

  // ── GUEST UPLOAD & QR ──
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [guestPhotos, setGuestPhotos] = useState<GuestPhoto[]>(INITIAL_GUEST_PHOTOS)
  const [uploader, setUploader] = useState('')
  const [note, setNote] = useState('')
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [selectedGuestPhoto, setSelectedGuestPhoto] = useState<GuestPhoto | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      QRCode.toDataURL(`${window.location.origin}/tasarimlar/vip/ozel-2#guest-album`, {
        width: 300,
        margin: 1,
        color: { dark: '#101a2b', light: '#ffffff' },
      }).then(setQrCodeDataUrl).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!isQrModalOpen && !lightboxPhoto && !selectedGuestPhoto) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsQrModalOpen(false)
        setLightboxPhoto(null)
        setSelectedGuestPhoto(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isQrModalOpen, lightboxPhoto, selectedGuestPhoto])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.[0]) return
    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result as string
      setTimeout(() => {
        setGuestPhotos((prev) => [
          {
            id: `upload-${Date.now()}`,
            url,
            uploader: uploader.trim() || 'Misafir',
            note: note.trim() || 'Bu geceyi ölümsüzleştiren an ✨',
            time: 'Şimdi',
          },
          ...prev,
        ])
        setIsUploading(false)
        setUploadSuccess(true)
        setNote('')
        setTimeout(() => setUploadSuccess(false), 3500)
      }, 700)
    }
    reader.readAsDataURL(files[0])
    e.target.value = ''
  }

  // ── NAV SCROLL ──
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#0d1522] text-[#f8f3e8] antialiased selection:bg-[#d3b77e]/30 selection:text-[#f8f3e8]">
      {/* Floating Demo Banner */}
      <VipDemoBanner
        siteId="vip-site-2"
        siteSlug="ozel-2"
        siteTitle="Özel-2 · Midnight Editorial"
        accentColor="#d3b77e"
        bgClass="bg-[#101a2b]/95"
      />

      {/* ── NAVBAR ── */}
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
          scrolled ? 'bg-[#0d1522]/90 backdrop-blur-xl border-b border-[#d3b77e]/15 py-3.5 shadow-2xl' : 'bg-transparent py-6'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 sm:px-8">
          <Link href="#home" className="flex items-center gap-2 tracking-[0.25em] text-xs uppercase font-light text-[#f8f3e8]">
            <span className="font-serif text-xl tracking-tight text-[#d3b77e]">D & A</span>
            <span className="hidden sm:inline border-l border-[#d3b77e]/30 pl-3 text-[10px] text-white/50">Defne & Atlas</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] text-white/70">
            <a href="#couple" className="transition hover:text-[#d3b77e]">Çiftimiz</a>
            <a href="#countdown" className="transition hover:text-[#d3b77e]">Geri Sayım</a>
            <a href="#details" className="transition hover:text-[#d3b77e]">Program</a>
            <a href="#location" className="transition hover:text-[#d3b77e]">Konum</a>
            <a href="#gallery" className="transition hover:text-[#d3b77e]">Galeri</a>
            <a href="#guest-album" className="transition hover:text-[#d3b77e]">QR Albüm</a>
            <a href="#rsvp" className="transition hover:text-[#d3b77e]">RSVP</a>
          </nav>

          <a
            href="#rsvp"
            className="rounded-full border border-[#d3b77e] px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-[#d3b77e] transition hover:bg-[#d3b77e] hover:text-[#0d1522] font-semibold"
          >
            Katılım Bildir
          </a>
        </div>
      </header>

      {/* ── HERO SECTION (MIDNIGHT EDITORIAL) ── */}
      <section id="home" className="relative min-h-[95vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80"
            alt="Midnight Wedding Hero"
            fill
            priority
            className="object-cover object-center opacity-30 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1522] via-[#0d1522]/60 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0d1522]/70 to-[#0d1522]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center pt-24 sm:pt-28">
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#d3b77e] font-light">
            THE NIGHT IS OURS · EDİTORYAL VIP KONSEPTE HOŞ GELDİNİZ
          </p>
          <h1 className="mt-6 font-serif text-6xl sm:text-8xl lg:text-9xl font-normal tracking-tight text-white">
            Defne <span className="font-serif italic text-[#d3b77e] font-light">&</span> Atlas
          </h1>
          <div className="mt-8 mx-auto h-px w-24 bg-gradient-to-r from-transparent via-[#d3b77e] to-transparent" />
          <p className="mt-8 mx-auto max-w-xl font-light text-sm sm:text-base leading-relaxed text-white/80">
            İki ayrı yol, aynı ufukta buluştu. Ege’nin rüzgârı ve yıldızların ışığında hayatımızın en anlamlı gecesini bizimle kutlayın.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-[0.2em] text-white/80">
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#d3b77e]" /> 24 Haziran 2027</span>
            <span className="h-3 w-px bg-white/20" />
            <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#d3b77e]" /> 19.00 Kokteyl</span>
            <span className="h-3 w-px bg-white/20" />
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#d3b77e]" /> Rıhtım Teras · İzmir</span>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT SECTIONS ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-14">

        {/* ── ÇİFTİMİZ ── */}
        <section id="couple" className="rounded-3xl border border-white/10 bg-[#121c2d]/80 p-8 sm:p-14 backdrop-blur-md shadow-2xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d3b77e]">Karakter & Duruş</span>
            <h2 className="mt-3 font-serif text-3xl sm:text-5xl text-white">Çiftimiz</h2>
            <p className="mt-4 text-xs text-white/60 leading-relaxed font-light">
              Birlikte geçen her anı tutkuyla, dostlukla ve sonsuz bir sadakatle inşa eden iki ruh.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 max-w-4xl mx-auto">
            {[
              {
                name: 'Defne Alkan',
                role: 'Gelin',
                img: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
                desc: 'Denizin dinginliği gibi derin, sanatın inceliğiyle dolu bir zarafet.',
              },
              {
                name: 'Atlas Soydan',
                role: 'Damat',
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
                desc: 'Her fırtınada güven veren bir liman, hayatı macerayla kucaklayan bir yol arkadaşı.',
              },
            ].map((p) => (
              <div
                key={p.name}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#162438] transition-all duration-500 hover:-translate-y-2 hover:border-[#d3b77e]/60 hover:shadow-2xl"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  <Image
                    src={p.img}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 450px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101a2b] via-transparent to-transparent opacity-80" />
                  <span className="absolute top-4 left-4 rounded-full border border-[#d3b77e]/40 bg-[#101a2b]/80 px-3 py-1 text-[9px] uppercase tracking-wider text-[#d3b77e] backdrop-blur-md">
                    {p.role}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl text-white group-hover:text-[#d3b77e] transition-colors">{p.name}</h3>
                  <p className="mt-2 text-xs text-white/70 font-light leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── GERİ SAYIM (EDİTORYAL GECE SAYACI) ── */}
        <section id="countdown" className="relative overflow-hidden rounded-3xl border border-[#d3b77e]/30 bg-gradient-to-b from-[#152338] to-[#0f1826] p-8 sm:p-14 text-center shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#d3b77e] to-transparent" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#d3b77e]">Büyük Geceye Doğru</span>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl text-white font-normal">Geri Sayım</h2>
          <p className="mt-2 text-xs text-white/60">24 Haziran 2027 · Rıhtım Teras, İzmir</p>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { val: timeLeft.days, label: 'GÜN' },
              { val: String(timeLeft.hours).padStart(2, '0'), label: 'SAAT' },
              { val: String(timeLeft.minutes).padStart(2, '0'), label: 'DAKİKA' },
              { val: String(timeLeft.seconds).padStart(2, '0'), label: 'SANİYE' },
            ].map((box) => (
              <div
                key={box.label}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-all duration-300 hover:border-[#d3b77e] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(211,183,126,0.15)]"
              >
                <div className="font-serif text-4xl sm:text-5xl font-light text-[#d3b77e]">{box.val}</div>
                <div className="mt-2 text-[9px] uppercase tracking-[0.25em] text-white/50">{box.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROGRAM & SAAT DETAYLARI ── */}
        <section id="details" className="rounded-3xl border border-white/10 bg-[#121c2d]/80 p-8 sm:p-12 backdrop-blur-md">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d3b77e]">Zaman & Akış</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-white">Gecenin Programı</h2>
          </div>

          <div className="mt-10 grid sm:grid-cols-4 gap-4">
            {[
              { time: '19.00', title: 'Gün Batımı Kokteyli', sub: 'Rıhtım İskelesi' },
              { time: '20.00', title: 'Yemin & Nikâh Töreni', sub: 'Ana Teras' },
              { time: '21.00', title: 'Akşam Yemeği', sub: 'Deniz Salonu' },
              { time: '23.00', title: 'Yıldızlar Altında Dans', sub: 'Gece Kulübü & Bar' },
            ].map((prog) => (
              <div
                key={prog.time}
                className="group rounded-2xl border border-white/10 bg-[#18263b] p-6 text-center transition-all duration-300 hover:border-[#d3b77e]/60 hover:-translate-y-1.5 hover:shadow-xl"
              >
                <span className="font-serif text-3xl text-[#d3b77e]">{prog.time}</span>
                <p className="mt-3 text-sm font-semibold text-white">{prog.title}</p>
                <p className="mt-1 text-[11px] text-white/50">{prog.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── KONUM (GOOGLE MAPS EDİTORYAL UI) ── */}
        <section id="location" className="rounded-3xl border border-white/10 bg-[#121c2d]/90 p-6 sm:p-10 shadow-2xl">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d3b77e]">Ulaşım & Harita</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-white">Rıhtım Teras'a Yolculuk</h2>
            <p className="mt-2 text-xs text-white/60">Canlı Google Haritalar navigasyonu ve yol tarifi</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#17253b]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#111c2e] px-5 py-3 text-xs">
              <div className="flex items-center gap-2 text-white">
                <MapPin className="h-4 w-4 text-[#d3b77e]" />
                <span className="font-semibold">{venueAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(venueAddress)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-wider text-white transition hover:bg-[#d3b77e] hover:text-[#101a2b]"
                >
                  {copied ? 'Kopyalandı' : 'Adresi Kopyala'}
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.4fr_1fr]">
              <div className="relative min-h-[360px] w-full">
                <iframe
                  title="İzmir Rıhtım Harita"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d50000!2d27.13!3d38.42!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14bbd862a762049f%3A0x66f6c8d76c66cf64!2sKonak%2C%20%C4%B0zmir!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str"
                  className="h-full w-full border-0 contrast-125"
                  loading="lazy"
                />
              </div>

              <div className="p-6 sm:p-8 flex flex-col justify-between bg-[#132034] text-white">
                <div className="space-y-4">
                  <h3 className="font-serif text-2xl text-white">Ulaşım Bilgileri</h3>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs space-y-2">
                    <p className="flex items-center gap-2 font-medium"><Car className="h-4 w-4 text-[#d3b77e]" /> Ücretsiz Vale & Otopark Mevcuttur</p>
                    <p className="text-white/60 text-[11px]">Giriş kapısında vale görevlileri aracınızı teslim alacaktır.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs space-y-2">
                    <p className="flex items-center gap-2 font-medium"><Clock3 className="h-4 w-4 text-[#d3b77e]" /> Karşılama Saati: 19.00</p>
                    <p className="text-white/60 text-[11px]">Kordon trafiği sebebiyle 18.30 civarı varılması önerilir.</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    href="https://www.google.com/maps/search/?api=1&query=R%C4%B1ht%C4%B1m+Teras+%C4%B0zmir"
                    target="_blank"
                    className="flex-1 rounded-xl bg-[#d3b77e] py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#0d1522] transition hover:bg-white"
                  >
                    Google Haritalar
                  </Link>
                  <Link
                    href="https://maps.apple.com/?q=Rihtim+Teras+Izmir"
                    target="_blank"
                    className="flex-1 rounded-xl border border-white/20 bg-white/5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-white/15"
                  >
                    Apple Haritalar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── OTOMATİK KAYAN FOTOĞRAF GALERİSİ ── */}
        <section id="gallery" className="rounded-3xl border border-white/10 bg-[#121c2d]/80 p-8 sm:p-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#d3b77e]">Fotoğraf Günlüğü</span>
              <h2 className="mt-1 font-serif text-3xl sm:text-4xl text-white">Güzel Günlerden Kareler</h2>
              <p className="mt-1 text-xs text-white/60">Otomatik akan galeri · Üzerine gelerek durdurabilir ve büyütebilirsiniz</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className="h-9 w-9 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-[#d3b77e] hover:text-[#0d1522] transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className="h-9 w-9 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-[#d3b77e] hover:text-[#0d1522] transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-none select-none"
            style={{ scrollbarWidth: 'none' }}
          >
            {[...GALLERY, ...GALLERY].map((photo, i) => (
              <div
                key={`${photo.id}-${i}`}
                onClick={() => setLightboxPhoto(photo)}
                className="group relative flex-none w-[280px] sm:w-[320px] aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#162438] transition-all duration-500 hover:-translate-y-2 hover:border-[#d3b77e] hover:shadow-2xl"
              >
                <Image
                  src={photo.src}
                  alt={photo.title}
                  fill
                  sizes="320px"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1522] via-black/30 to-transparent opacity-70 group-hover:opacity-90" />
                <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#d3b77e]">{photo.subtitle}</p>
                  <h4 className="mt-1 font-serif text-lg">{photo.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SEN DE BU GÜNE AİT BİR RESİM EKLE & QR ALBÜM ── */}
        <section id="guest-album" className="rounded-3xl border border-[#d3b77e]/30 bg-[#121c2d] p-8 sm:p-12 shadow-2xl">
          <div className="border-b border-white/10 pb-6 sm:flex sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d3b77e]/20 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-[#d3b77e]">
                <Sparkles className="h-3 w-3" /> Canlı Misafir Anı Albümü
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-white">Sen de Bu Geceye Ait Bir Kare Ekle</h2>
              <p className="mt-1.5 text-xs text-white/60">
                Masadaki QR kodu telefonunuzla okutun veya aşağıdan doğrudan fotoğraf yükleyerek gecemizi ölümsüzleştirin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-full border border-[#d3b77e] px-4 py-2 text-[10px] uppercase tracking-wider text-[#d3b77e] transition hover:bg-[#d3b77e] hover:text-[#101a2b]"
            >
              <QrCode className="h-4 w-4" /> QR Kodu Büyüt
            </button>
          </div>

          <div className="mt-8 grid lg:grid-cols-[1.1fr_1.3fr] gap-8">
            {/* Yükleme & QR Alanı */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div
                  onClick={() => setIsQrModalOpen(true)}
                  className="h-24 w-24 shrink-0 rounded-xl bg-white p-1.5 cursor-pointer shadow-md"
                >
                  {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR" className="h-full w-full object-contain" />}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#d3b77e] font-semibold">Masadan Hızlı Yükle</p>
                  <p className="text-xs text-white font-medium">Telefon Kameranızla Tarayın</p>
                  <p className="mt-1 text-[10px] text-white/60">Doğrudan albüm ekranına bağlanarak telefonunuzdaki kareleri gönderin.</p>
                </div>
              </div>

              {/* Form */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
                <input
                  type="text"
                  value={uploader}
                  onChange={(e) => setUploader(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="h-10 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-xs text-white placeholder:text-white/40 focus:border-[#d3b77e] focus:outline-none"
                />
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Kısa bir tebrik notu"
                  className="h-10 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-xs text-white placeholder:text-white/40 focus:border-[#d3b77e] focus:outline-none"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#d3b77e] py-3 text-xs font-bold uppercase tracking-wider text-[#0d1522] transition hover:bg-white disabled:opacity-50"
                >
                  {isUploading ? 'Yükleniyor...' : <><Camera className="h-4 w-4" /> Fotoğraf Seç / Çek ve Paylaş</>}
                </button>
                {uploadSuccess && (
                  <p className="text-xs text-emerald-400 text-center font-medium">Harika! Fotoğrafınız albüme eklendi 🎉</p>
                )}
              </div>
            </div>

            {/* Misafir Galerisi */}
            <div>
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold text-white">Misafirlerden Gelen Kareler</span>
                <span className="text-[#d3b77e]">{guestPhotos.length} Fotoğraf</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {guestPhotos.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedGuestPhoto(p)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 cursor-pointer"
                  >
                    <img src={p.url} alt={p.uploader} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-[9px] text-white">
                      <p className="font-semibold truncate">{p.uploader}</p>
                      <p className="text-white/70">{p.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── DİJİTAL DAVETİYE KARTI ── */}
        <section id="invitation" className="rounded-3xl border border-white/10 bg-[#121c2d]/80 p-8 sm:p-14 text-center">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#d3b77e]">VIP Dijital Davetiye</span>
          <div className="mt-8 max-w-md mx-auto rounded-3xl border border-[#d3b77e]/40 bg-gradient-to-b from-[#18263b] to-[#101a2b] p-10 shadow-2xl">
            <Sparkles className="mx-auto h-6 w-6 text-[#d3b77e]" />
            <p className="mt-4 text-[9px] uppercase tracking-[0.3em] text-[#d3b77e]">The Night Is Ours</p>
            <h3 className="mt-4 font-serif text-5xl text-white">Defne & Atlas</h3>
            <div className="my-5 h-px w-16 bg-[#d3b77e]/40 mx-auto" />
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">24 Haziran 2027 · 19.00</p>
            <p className="mt-1 text-xs text-white/60">Rıhtım Teras · İzmir</p>
          </div>
        </section>

        {/* ── RSVP ── */}
        <section id="rsvp" className="rounded-3xl border border-white/10 bg-[#121c2d]/80 p-8 sm:p-12 text-center">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#d3b77e]">Katılım Yanıtı</span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-white">Lütfen Katılımınızı Bildirin</h2>
          <div className="mt-8 max-w-xl mx-auto grid sm:grid-cols-2 gap-3 text-left">
            <label className="text-[10px] uppercase tracking-wider text-white/70">
              Adınız Soyadınız
              <input disabled placeholder="Örn: Burak Kaya" className="mt-1.5 h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-xs text-white placeholder:text-white/30" />
            </label>
            <label className="text-[10px] uppercase tracking-wider text-white/70">
              Katılım Durumu
              <select disabled defaultValue="yes" className="mt-1.5 h-10 w-full rounded-xl border border-white/15 bg-[#17253b] px-3 text-xs text-white">
                <option value="yes">Katılıyorum (1 Kişi)</option>
                <option value="no">Katılamıyorum</option>
              </select>
            </label>
            <button disabled className="sm:col-span-2 mt-2 h-11 rounded-xl bg-[#d3b77e] text-[10px] font-bold uppercase tracking-wider text-[#0d1522] opacity-50">
              Demo Modu · Yanıt Gönderimi Kapalı
            </button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="rounded-3xl border border-white/10 bg-[#121c2d] p-10 text-center">
          <h3 className="font-serif text-3xl text-white">Defne <i className="text-[#d3b77e]">&</i> Atlas</h3>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/50">24 Haziran 2027 · Rıhtım Teras, İzmir</p>
          <div className="my-8 h-px w-16 bg-white/10 mx-auto" />
          <VipFooterActions siteId="vip-site-2" siteSlug="ozel-2" accentColor="#d3b77e" />
          <p className="mt-8 text-[9px] uppercase tracking-widest text-white/30">MOMENTIS VIP · Özel-2 Midnight Editorial</p>
        </footer>

      </div>

      {/* QR MODAL */}
      {isQrModalOpen && (
        <div role="dialog" aria-modal="true" aria-label="Masa QR kodu" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm" onClick={() => setIsQrModalOpen(false)}>
          <div className="relative max-w-sm w-full max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-[#121c2d] border border-[#d3b77e]/40 p-4 sm:p-6 text-center text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsQrModalOpen(false)} aria-label="Kapat" className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"><X className="h-4 w-4" /></button>
            <h4 className="font-serif text-xl sm:text-2xl text-white break-words">Masa QR Kodu</h4>
            <p className="text-xs text-white/60 mt-1">Kameranızla okutarak fotoğraflarınızı doğrudan yükleyin</p>
            <div className="mx-auto my-4 sm:my-5 h-48 w-48 sm:h-56 sm:w-56 max-w-full aspect-square rounded-2xl bg-white p-2.5 sm:p-3 flex items-center justify-center">
              {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR" className="h-full w-full object-contain" />}
            </div>
            <p className="text-[10px] text-[#d3b77e]">Defne & Atlas · Rıhtım Teras</p>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxPhoto && (
        <div role="dialog" aria-modal="true" aria-label="Fotoğraf detay görünümü" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md" onClick={() => setLightboxPhoto(null)}>
          <div className="relative max-h-[calc(100dvh-2rem)] max-w-4xl w-full overflow-y-auto rounded-2xl bg-[#101a2b] border border-white/20 p-2 sm:p-2.5 flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightboxPhoto(null)} aria-label="Kapat" className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition"><X className="h-4 w-4 sm:h-5 sm:w-5" /></button>
            <div className="relative aspect-[4/3] sm:aspect-[16/10] max-h-[65vh] w-full shrink-0 overflow-hidden rounded-xl">
              <Image src={lightboxPhoto.src} alt={lightboxPhoto.title} fill sizes="(max-width: 1024px) 100vw, 900px" className="object-cover" />
            </div>
            <div className="p-3 sm:p-4 text-center text-white shrink-0">
              <p className="text-[10px] sm:text-xs text-[#d3b77e] uppercase tracking-widest">{lightboxPhoto.subtitle}</p>
              <h3 className="font-serif text-lg sm:text-2xl mt-1 break-words">{lightboxPhoto.title}</h3>
            </div>
          </div>
        </div>
      )}

      {/* GUEST PHOTO MODAL */}
      {selectedGuestPhoto && (
        <div role="dialog" aria-modal="true" aria-label="Misafir fotoğrafı detay görünümü" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md" onClick={() => setSelectedGuestPhoto(null)}>
          <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-[#121c2d] border border-white/20 p-2.5 sm:p-3 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedGuestPhoto(null)} aria-label="Kapat" className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-[#d3b77e]"><X className="h-4 w-4" /></button>
            <div className="relative aspect-square w-full max-h-[60vh] overflow-hidden rounded-2xl">
              <img src={selectedGuestPhoto.url} alt={selectedGuestPhoto.uploader} className="h-full w-full object-cover" />
            </div>
            <div className="p-3 sm:p-4 text-center">
              <p className="font-serif text-lg sm:text-xl text-white break-words">{selectedGuestPhoto.uploader}</p>
              {selectedGuestPhoto.note && <p className="mt-1 text-xs text-[#d3b77e] italic break-words">"{selectedGuestPhoto.note}"</p>}
              <p className="mt-2 text-[9px] uppercase tracking-wider text-white/50">{selectedGuestPhoto.time}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
