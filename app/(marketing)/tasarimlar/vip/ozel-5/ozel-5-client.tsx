'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  CalendarDays,
  Clock3,
  MapPin,
  Car,
  ChevronLeft,
  ChevronRight,
  X,
  QrCode,
  Camera,
  Leaf,
  Wind,
} from 'lucide-react'
import { VipDemoBanner, VipFooterActions } from '@/components/vip-design/vip-controls'

const TARGET_DATE = new Date('2027-05-09T17:30:00').getTime()

const GALLERY = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    title: 'Zeytin Ağaçları Arasında',
    subtitle: 'Muğla · Doğanın Kucağında',
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80',
    title: 'Akdeniz Esintisi',
    subtitle: 'Dingin ve Huzurlu Adımlar',
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
    title: 'Adaçayı & Zeytin Dalları',
    subtitle: 'Doğal Buket ve Yüzükler',
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
    title: 'Kuş Sesleri Altında',
    subtitle: 'Sonsuz Bir Yolculuk',
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    title: 'Gün Batımında Bahçe',
    subtitle: 'Sıcak ve Samimi Anlar',
  },
]

type GuestPhoto = { id: string; url: string; uploader: string; note?: string; time: string }
const INITIAL_GUEST_PHOTOS: GuestPhoto[] = [
  {
    id: 'g-501',
    url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80',
    uploader: 'Deniz & Cem',
    note: 'Zeytinlerin gölgesinde en güzel başlangıca şahit oluyoruz 🌿',
    time: '12 dk önce',
  },
  {
    id: 'g-502',
    url: 'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&w=600&q=80',
    uploader: 'Aylin',
    note: 'Huzur dolu bir gün, mutluluklar dilerim!',
    time: '35 dk önce',
  },
]

export function Ozel5Client() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = TARGET_DATE - Date.now()
      if (diff <= 0) return
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

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

  const [copied, setCopied] = useState(false)
  const venueAddress = 'Zeytinli Bahçe Kır Alanı, Akyaka Cad. No: 24, Ula / Muğla'

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
      QRCode.toDataURL(`${window.location.origin}/tasarimlar/vip/ozel-5#guest-album`, {
        width: 300,
        margin: 1,
        color: { dark: '#354239', light: '#f8faf5' },
      }).then(setQrCodeDataUrl).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsQrModalOpen(false)
        setLightboxPhoto(null)
        setSelectedGuestPhoto(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
            note: note.trim() || 'Zeytinli Bahçe’den güzel bir anı 🌿',
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

  return (
    <div className="relative min-h-screen bg-[#edf2e8] text-[#354239] antialiased selection:bg-[#82947a]/30 selection:text-[#354239]">
      <VipDemoBanner
        siteId="vip-site-5"
        siteSlug="ozel-5"
        siteTitle="Özel-5 · Botanical Sage"
        accentColor="#82947a"
        bgClass="bg-[#354239]/95"
      />

      {/* NAVBAR */}
      <header className="fixed inset-x-0 top-0 z-40 bg-[#edf2e8]/85 backdrop-blur-md border-b border-[#82947a]/20 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <Link href="#home" className="flex items-center gap-2 font-serif text-2xl text-[#354239]">
            <Leaf className="h-5 w-5 text-[#82947a]" />
            Ece <i className="text-[#82947a]">&</i> Deniz
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] text-[#354239]/80">
            <a href="#couple" className="hover:text-[#82947a] transition">Biz</a>
            <a href="#countdown" className="hover:text-[#82947a] transition">Geri Sayım</a>
            <a href="#details" className="hover:text-[#82947a] transition">Doğada Program</a>
            <a href="#location" className="hover:text-[#82947a] transition">Konum</a>
            <a href="#gallery" className="hover:text-[#82947a] transition">Galeri</a>
            <a href="#guest-album" className="hover:text-[#82947a] transition">QR Albüm</a>
            <a href="#rsvp" className="hover:text-[#82947a] transition">RSVP</a>
          </nav>
          <a
            href="#rsvp"
            className="rounded-full bg-[#82947a] px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-white shadow-sm hover:bg-[#6c7d65] transition"
          >
            Katılım Bildir
          </a>
        </div>
      </header>

      {/* HERO: BOTANICAL SAGE */}
      <section id="home" className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80"
            alt="Botanical Sage Hero"
            fill
            priority
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#edf2e8]/70 via-[#edf2e8]/40 to-[#edf2e8]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#82947a]/40 bg-white/70 px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] text-[#55674f]">
            <Leaf className="h-3.5 w-3.5 text-[#82947a]" /> Doğanın İçinde, Birlikte
          </span>
          <h1 className="mt-8 font-serif text-6xl sm:text-8xl text-[#354239] font-light">
            Ece <span className="italic text-[#82947a]">&</span> Deniz
          </h1>
          <div className="mx-auto mt-6 h-px w-20 bg-[#82947a]/40" />
          <p className="mt-6 max-w-lg mx-auto text-sm sm:text-base leading-relaxed text-[#354239]/80 font-light">
            Zeytin dallarının dinginliği, Ege rüzgârı ve sevdiğimiz insanların gülümsemeleriyle yeni hayatımıza adım atıyoruz.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-widest text-[#354239]/90 font-medium">
            <span>09 Mayıs 2027 · Pazar</span>
            <span>•</span>
            <span>17.30 Karşılama</span>
            <span>•</span>
            <span>Zeytinli Bahçe · Muğla</span>
          </div>
        </div>
      </section>

      {/* SECTIONS */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-12">

        {/* ÇİFTİMİZ */}
        <section id="couple" className="rounded-3xl border border-[#d6e0cf] bg-white p-8 sm:p-14 shadow-md">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#82947a]">Bizim Dünyamız</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Ece & Deniz</h2>
            <p className="mt-3 text-xs text-[#354239]/70">Doğaya tutkulu, birbirinin sesinde dinginliği bulan iki yolcu.</p>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: 'Ece Karaca',
                role: 'Gelin',
                img: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
                desc: 'Doğanın saflığını ve samimiyetini her adımında yaşatan bir zarafet.',
              },
              {
                name: 'Deniz Yalçın',
                role: 'Damat',
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
                desc: 'Denizin ferahlığı gibi sakin, kalbiyle seven bir hayat ortağı.',
              },
            ].map((p) => (
              <div
                key={p.name}
                className="group overflow-hidden rounded-2xl border border-[#d6e0cf] bg-[#f8faf6] transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:border-[#82947a]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image src={p.img} alt={p.name} fill sizes="400px" className="object-cover transition-transform duration-700 group-hover:scale-108" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[9px] uppercase tracking-wider text-[#55674f] font-semibold">
                    {p.role}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl group-hover:text-[#82947a] transition-colors">{p.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#354239]/70">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* GERİ SAYIM */}
        <section id="countdown" className="rounded-3xl border border-[#d6e0cf] bg-[#f4f7f1] p-8 sm:p-14 text-center shadow-md">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#82947a]">Zeytinlerin Altında Buluşmaya</span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Geri Sayım</h2>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { val: timeLeft.days, label: 'GÜN' },
              { val: String(timeLeft.hours).padStart(2, '0'), label: 'SAAT' },
              { val: String(timeLeft.minutes).padStart(2, '0'), label: 'DAKİKA' },
              { val: String(timeLeft.seconds).padStart(2, '0'), label: 'SANİYE' },
            ].map((b) => (
              <div key={b.label} className="rounded-2xl border border-[#d6e0cf] bg-white p-6 shadow-xs hover:border-[#82947a] hover:-translate-y-1 transition">
                <span className="font-serif text-4xl sm:text-5xl text-[#82947a]">{b.val}</span>
                <p className="mt-2 text-[9px] uppercase tracking-widest text-[#354239]/60">{b.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PROGRAM DETAYLARI */}
        <section id="details" className="rounded-3xl border border-[#d6e0cf] bg-white p-8 sm:p-12 shadow-md">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#82947a]">Doğada Bir Gün</span>
            <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Kutlama Programı</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Wind, time: '17.30', title: 'Zeytinlik Karşılaması', sub: 'Akustik Müzik & Kokteyl' },
              { icon: Leaf, time: '18.30', title: 'Açık Hava Nikâhı', sub: 'Yaşlı Zeytin Ağacı Altında' },
              { icon: CalendarDays, time: '19.45', title: 'Ege Sofrası & Müzik', sub: 'Doğal Lezzetler ve Dans' },
            ].map((s) => (
              <div key={s.time} className="rounded-2xl border border-[#d6e0cf] bg-[#f8faf6] p-6 text-center hover:shadow-md hover:border-[#82947a] transition">
                <s.icon className="mx-auto h-6 w-6 text-[#82947a]" />
                <span className="mt-3 block font-serif text-2xl text-[#82947a]">{s.time}</span>
                <p className="mt-2 font-semibold text-sm">{s.title}</p>
                <p className="mt-1 text-xs text-[#354239]/60">{s.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* GOOGLE HARİTALAR MODERN UI */}
        <section id="location" className="rounded-3xl border border-[#d6e0cf] bg-white p-6 sm:p-10 shadow-lg">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#82947a]">Konum & Ulaşım</span>
            <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Zeytinli Bahçe'ye Yolculuk</h2>
            <p className="mt-2 text-xs text-[#354239]/70">{venueAddress}</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d6e0cf]">
            <div className="grid lg:grid-cols-[1.3fr_1fr]">
              <div className="relative min-h-[340px] w-full">
                <iframe
                  title="Muğla Ula Harita"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d49000!2d28.4!3d37.1!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14bf6893693e506d%3A0xc6443cfa5dcf7409!2sUla%2C%20Mu%C4%9Fla!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str"
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-between bg-[#f8faf6]">
                <div className="space-y-4">
                  <h3 className="font-serif text-2xl">Mekân & Ulaşım Notları</h3>
                  <div className="rounded-xl border border-[#d6e0cf] bg-white p-4 text-xs space-y-1">
                    <p className="font-semibold flex items-center gap-1.5"><Car className="h-4 w-4 text-[#82947a]" /> Otopark ve Ulaşım Kolaylığı</p>
                    <p className="text-[#354239]/60">Bahçe girişinde konuklarımıza özel geniş araç park alanı mevcuttur.</p>
                  </div>
                  <div className="rounded-xl border border-[#d6e0cf] bg-white p-4 text-xs space-y-1">
                    <p className="font-semibold">Akşam Esintisi</p>
                    <p className="text-[#354239]/60">Gün batımı sonrası bahçe serin olabileceğinden yanınıza hafif bir şal almanız önerilir.</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    href="https://www.google.com/maps/search/?api=1&query=Ula+Mugla"
                    target="_blank"
                    className="flex-1 rounded-xl bg-[#82947a] py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#6c7d65]"
                  >
                    Google Haritalar
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(venueAddress)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="rounded-xl border border-[#d6e0cf] bg-white px-4 py-3 text-[10px] uppercase tracking-wider text-[#354239] transition hover:bg-[#edf2e8]"
                  >
                    {copied ? 'Kopyalandı' : 'Adresi Kopyala'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* OTOMATİK KAYAN GALERİ */}
        <section id="gallery" className="rounded-3xl border border-[#d6e0cf] bg-white p-8 sm:p-12 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#82947a]">Fotoğraf Defterimiz</span>
              <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Güzel Günlerden Küçük Kareler</h2>
              <p className="mt-1 text-xs text-[#354239]/70">Otomatik akan doğa albümü · Dokunarak büyütebilirsiniz</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className="h-9 w-9 rounded-full border border-[#d6e0cf] flex items-center justify-center hover:bg-[#82947a] hover:text-white transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className="h-9 w-9 rounded-full border border-[#d6e0cf] flex items-center justify-center hover:bg-[#82947a] hover:text-white transition"
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
                className="group relative flex-none w-[280px] sm:w-[320px] aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl border border-[#d6e0cf] bg-[#f8faf6] transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
              >
                <Image src={photo.src} alt={photo.title} fill sizes="320px" className="object-cover transition-transform duration-700 group-hover:scale-108" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-80" />
                <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                  <p className="text-[9px] uppercase tracking-widest text-[#d6e0cf]">{photo.subtitle}</p>
                  <h4 className="mt-1 font-serif text-lg">{photo.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEN DE BİR RESİM EKLE & QR ALBÜM */}
        <section id="guest-album" className="rounded-3xl border border-[#82947a]/40 bg-[#f8faf6] p-8 sm:p-12 shadow-lg">
          <div className="border-b border-[#d6e0cf] pb-6 sm:flex sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#82947a]/15 px-3 py-1 text-[9px] uppercase tracking-widest text-[#55674f] font-semibold">
                <Leaf className="h-3 w-3" /> Ortak Doğa Albümü
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Sen de Bu Güne Ait Bir Resim Ekle</h2>
              <p className="mt-1.5 text-xs text-[#354239]/70">
                Masalardaki QR kodu okutarak çektiğiniz fotoğrafları doğrudan bu albüme yükleyin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-full border border-[#82947a] px-4 py-2 text-[10px] uppercase tracking-wider text-[#55674f] hover:bg-[#82947a] hover:text-white transition"
            >
              <QrCode className="h-4 w-4" /> QR Kodu Büyüt
            </button>
          </div>

          <div className="mt-8 grid lg:grid-cols-[1.1fr_1.3fr] gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border border-[#d6e0cf] bg-white p-4">
                <div onClick={() => setIsQrModalOpen(true)} className="h-24 w-24 shrink-0 rounded-xl bg-white p-1.5 cursor-pointer border border-[#d6e0cf] shadow-xs">
                  {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR" className="h-full w-full object-contain" />}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#82947a] font-semibold">Masa QR Kodu</p>
                  <p className="text-xs font-semibold">Kameranızla Tara & Yükle</p>
                  <p className="mt-1 text-[10px] text-[#354239]/60">Anında telefonunuzun galerisine bağlanır.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#d6e0cf] bg-white p-5 space-y-3">
                <input
                  type="text"
                  value={uploader}
                  onChange={(e) => setUploader(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="h-10 w-full rounded-xl border border-[#d6e0cf] px-3 text-xs focus:border-[#82947a] focus:outline-none"
                />
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Kısa bir tebrik notu"
                  className="h-10 w-full rounded-xl border border-[#d6e0cf] px-3 text-xs focus:border-[#82947a] focus:outline-none"
                />
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#82947a] py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#6c7d65] transition disabled:opacity-50"
                >
                  {isUploading ? 'Yükleniyor...' : <><Camera className="h-4 w-4" /> Fotoğraf Çek / Yükle</>}
                </button>
                {uploadSuccess && (
                  <p className="text-xs text-emerald-800 text-center font-medium">Fotoğrafınız albüme eklendi 🌿</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold">Misafirlerden Gelen Kareler</span>
                <span className="text-[#82947a]">{guestPhotos.length} Fotoğraf</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {guestPhotos.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedGuestPhoto(p)}
                    className="relative aspect-square rounded-xl overflow-hidden border border-[#d6e0cf] group cursor-pointer"
                  >
                    <img src={p.url} alt={p.uploader} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-[9px] text-white">
                      <p className="font-semibold truncate">{p.uploader}</p>
                      <p className="text-white/70">{p.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DİJİTAL DAVETİYE KARTI */}
        <section id="invitation" className="rounded-3xl border border-[#d6e0cf] bg-white p-8 sm:p-14 text-center shadow-md">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#82947a]">VIP Dijital Davetiye</span>
          <div className="mt-8 max-w-md mx-auto rounded-3xl border border-[#82947a]/40 bg-[#f8faf6] p-10 shadow-lg">
            <Leaf className="mx-auto h-6 w-6 text-[#82947a]" />
            <p className="mt-4 text-[9px] uppercase tracking-[0.25em] text-[#82947a]">Doğanın İçinde, Birlikte</p>
            <h3 className="mt-4 font-serif text-5xl">Ece & Deniz</h3>
            <div className="my-5 h-px w-16 bg-[#82947a]/30 mx-auto" />
            <p className="text-xs uppercase tracking-widest text-[#354239]/70">09 Mayıs 2027 · 17.30</p>
            <p className="mt-1 text-xs text-[#354239]/60">Zeytinli Bahçe · Muğla</p>
          </div>
        </section>

        {/* RSVP */}
        <section id="rsvp" className="rounded-3xl border border-[#d6e0cf] bg-white p-8 sm:p-12 text-center shadow-md">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#82947a]">Katılım Yanıtı</span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Bizimle Olmanız Bizi Mutlu Eder</h2>
          <div className="mt-8 max-w-xl mx-auto grid sm:grid-cols-2 gap-3 text-left">
            <label className="text-[10px] uppercase tracking-wider text-[#354239]/70">
              Adınız Soyadınız
              <input disabled placeholder="Örn: Mehmet Öz" className="mt-1.5 h-10 w-full rounded-xl border border-[#d6e0cf] bg-[#edf2e8] px-3 text-xs" />
            </label>
            <label className="text-[10px] uppercase tracking-wider text-[#354239]/70">
              Katılım Durumu
              <select disabled defaultValue="yes" className="mt-1.5 h-10 w-full rounded-xl border border-[#d6e0cf] bg-[#edf2e8] px-3 text-xs">
                <option value="yes">Katılıyorum</option>
                <option value="no">Katılamıyorum</option>
              </select>
            </label>
            <button disabled className="sm:col-span-2 mt-2 h-11 rounded-xl bg-[#82947a] text-[10px] font-bold uppercase tracking-wider text-white opacity-50">
              Demo Modu · Yanıt Gönderimi Kapalı
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="rounded-3xl border border-[#d6e0cf] bg-white p-10 text-center shadow-md">
          <h3 className="font-serif text-3xl">Ece <i className="text-[#82947a]">&</i> Deniz</h3>
          <p className="mt-2 text-xs uppercase tracking-widest text-[#354239]/50">09 Mayıs 2027 · Muğla</p>
          <div className="my-8 h-px w-16 bg-[#82947a]/20 mx-auto" />
          <VipFooterActions siteId="vip-site-5" siteSlug="ozel-5" accentColor="#82947a" />
          <p className="mt-8 text-[9px] uppercase tracking-widest text-[#354239]/30">MOMENTIS VIP · Özel-5 Botanical Sage</p>
        </footer>

      </div>

      {/* MODALS */}
      {isQrModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Masa QR Kodu"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl bg-white border border-[#82947a]/30 p-5 sm:p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQrModalOpen(false)}
              aria-label="Kapat"
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-[#edf2e8] flex items-center justify-center text-[#354239] hover:bg-[#82947a] hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
            <h4 className="font-serif text-xl sm:text-2xl pr-8">Masa QR Kodu</h4>
            <p className="text-xs text-[#354239]/60 mt-1">Kameranızla okutarak fotoğraflarınızı albüme ekleyin</p>
            <div className="mx-auto my-5 h-48 w-48 sm:h-56 sm:w-56 max-w-full aspect-square rounded-2xl bg-[#edf2e8] p-3 flex items-center justify-center">
              {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR" className="h-full w-full object-contain" />}
            </div>
            <p className="text-[10px] text-[#82947a]">Ece & Deniz · Zeytinli Bahçe</p>
          </div>
        </div>
      )}

      {lightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fotoğraf detay görünümü"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-h-[calc(100dvh-2rem)] max-w-4xl w-full overflow-y-auto rounded-2xl bg-white p-2 sm:p-2.5 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              aria-label="Kapat"
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="relative aspect-[4/3] sm:aspect-[16/10] max-h-[65vh] w-full shrink-0 overflow-hidden rounded-xl">
              <Image src={lightboxPhoto.src} alt={lightboxPhoto.title} fill sizes="(max-width: 1024px) 100vw, 900px" className="object-cover" />
            </div>
            <div className="p-3 sm:p-4 text-center shrink-0">
              <p className="text-[10px] sm:text-xs text-[#82947a] uppercase tracking-widest">{lightboxPhoto.subtitle}</p>
              <h3 className="font-serif text-lg sm:text-2xl mt-1 break-words">{lightboxPhoto.title}</h3>
            </div>
          </div>
        </div>
      )}

      {/* GUEST PHOTO MODAL */}
      {selectedGuestPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Misafir fotoğrafı detay görünümü"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md"
          onClick={() => setSelectedGuestPhoto(null)}
        >
          <div
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white border border-[#d6e0cf] p-2.5 sm:p-3 text-[#354239] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedGuestPhoto(null)}
              aria-label="Kapat"
              className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-[#82947a]"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative aspect-square w-full max-h-[60vh] overflow-hidden rounded-2xl">
              <img src={selectedGuestPhoto.url} alt={selectedGuestPhoto.uploader} className="h-full w-full object-cover" />
            </div>
            <div className="p-3 sm:p-4 text-center">
              <p className="font-serif text-lg sm:text-xl text-[#354239] break-words">{selectedGuestPhoto.uploader}</p>
              {selectedGuestPhoto.note && <p className="mt-1 text-xs text-[#82947a] italic break-words">"{selectedGuestPhoto.note}"</p>}
              <p className="mt-2 text-[9px] uppercase tracking-wider text-[#354239]/50">{selectedGuestPhoto.time}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
