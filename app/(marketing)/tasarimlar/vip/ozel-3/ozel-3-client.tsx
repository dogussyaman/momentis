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
  Car,
  ChevronLeft,
  ChevronRight,
  X,
  QrCode,
  Camera,
  Flower2,
} from 'lucide-react'
import { VipDemoBanner, VipFooterActions } from '@/components/vip-design/vip-controls'

const TARGET_DATE = new Date('2027-07-18T18:00:00').getTime()

const GALLERY = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
    title: 'Gül Bahçesinde Bir An',
    subtitle: 'Bursa · Lavanta & Gül Bahçesi',
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    title: 'Çiçek Açan Mutluluk',
    subtitle: 'Pudra Tonlarında İlk Dans',
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
    title: 'Yüzükler & Kır Çiçekleri',
    subtitle: 'Doğal Işık Altında Detaylar',
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
    title: 'Sonsuz Bahar',
    subtitle: 'El Ele Bir Ömür',
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80',
    title: 'Masalsı Gün Batımı',
    subtitle: 'Lavanta Kokulu Esintiler',
  },
]

type GuestPhoto = { id: string; url: string; uploader: string; note?: string; time: string }
const INITIAL_GUEST_PHOTOS: GuestPhoto[] = [
  {
    id: 'g-301',
    url: 'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&w=600&q=80',
    uploader: 'Ece & Berk',
    note: 'Masal gibi bir bahçede en güzel güne tanık oluyoruz 💕',
    time: '20 dk önce',
  },
  {
    id: 'g-302',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
    uploader: 'Gül Teyze',
    note: 'Çiçekleriniz hiç solmasın canlarım 🌸',
    time: '45 dk önce',
  },
]

export function Ozel3Client() {
  // Countdown
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

  // Auto-scroll gallery
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

  // Map & Address
  const [copied, setCopied] = useState(false)
  const venueAddress = 'Lavanta Bahçesi Kır Düğün Alanı, Çalı Yolu No: 88, Nilüfer / Bursa'

  // Guest upload & QR
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
      QRCode.toDataURL(`${window.location.origin}/tasarimlar/vip/ozel-3#guest-album`, {
        width: 300,
        margin: 1,
        color: { dark: '#573f43', light: '#fff9f7' },
      }).then(setQrCodeDataUrl).catch(() => {})
    }
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
            note: note.trim() || 'Bu güzel bahçeden bir hatıra 🌸',
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
    <div className="relative min-h-screen bg-[#faf3f0] text-[#573f43] antialiased selection:bg-[#bb8583]/20 selection:text-[#573f43]">
      <VipDemoBanner
        siteId="vip-site-3"
        siteSlug="ozel-3"
        siteTitle="Özel-3 · Blush Garden"
        accentColor="#bb8583"
        bgClass="bg-[#573f43]/95"
      />

      {/* NAVBAR */}
      <header className="fixed inset-x-0 top-0 z-40 bg-[#faf3f0]/85 backdrop-blur-md border-b border-[#bb8583]/15 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <Link href="#home" className="flex items-center gap-2 font-serif text-2xl text-[#573f43]">
            <Flower2 className="h-5 w-5 text-[#bb8583]" />
            Mina <i className="text-[#bb8583]">&</i> Can
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] text-[#573f43]/80">
            <a href="#couple" className="hover:text-[#bb8583] transition">Biz</a>
            <a href="#countdown" className="hover:text-[#bb8583] transition">Geri Sayım</a>
            <a href="#details" className="hover:text-[#bb8583] transition">Program</a>
            <a href="#location" className="hover:text-[#bb8583] transition">Konum</a>
            <a href="#gallery" className="hover:text-[#bb8583] transition">Galeri</a>
            <a href="#guest-album" className="hover:text-[#bb8583] transition">QR Albüm</a>
            <a href="#rsvp" className="hover:text-[#bb8583] transition">RSVP</a>
          </nav>
          <a
            href="#rsvp"
            className="rounded-full bg-[#bb8583] px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-white shadow-sm hover:bg-[#a6716f] transition"
          >
            Katılım Bildir
          </a>
        </div>
      </header>

      {/* HERO: BLUSH GARDEN */}
      <section id="home" className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80"
            alt="Blush Garden Hero"
            fill
            priority
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#faf3f0]/60 via-[#faf3f0]/40 to-[#faf3f0]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#bb8583]/40 bg-white/70 px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] text-[#bb8583]">
            <Flower2 className="h-3.5 w-3.5" /> Sevgiyle Büyüyen Bir Hikâye
          </span>
          <h1 className="mt-8 font-serif text-6xl sm:text-8xl text-[#573f43] font-light">
            Mina <span className="italic text-[#bb8583]">&</span> Can
          </h1>
          <div className="mx-auto mt-6 h-px w-20 bg-[#bb8583]/40" />
          <p className="mt-6 max-w-lg mx-auto text-sm sm:text-base leading-relaxed text-[#573f43]/80">
            Küçük anılarımızın kocaman bir bahçeye dönüştüğü bu özel günde, çiçeklerin kokusu eşliğinde yanımızda olmanızı dileriz.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-widest text-[#573f43]/90">
            <span>18 Temmuz 2027 · Pazar</span>
            <span>•</span>
            <span>18.00 Karşılama</span>
            <span>•</span>
            <span>Lavanta Bahçesi · Bursa</span>
          </div>
        </div>
      </section>

      {/* SECTIONS */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-12">

        {/* ÇİFTİMİZ (ROMANTIC SPLIT) */}
        <section id="couple" className="rounded-3xl border border-[#e8d5d0] bg-white p-8 sm:p-14 shadow-lg">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#bb8583]">Hikâyenin Kahramanları</span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Mina & Can</h2>
            <p className="mt-3 text-xs text-[#573f43]/70">Birbirine bakan iki göz, aynı yöne uzanan iki el.</p>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: 'Mina Arslan',
                role: 'Gelin',
                img: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
                desc: 'Baharda açan çiçekler gibi güleç, etrafına daima huzur yayan biri.',
              },
              {
                name: 'Can Ertekin',
                role: 'Damat',
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
                desc: 'En sakin sabahlarda bile kalbi sevgiyle çarpan bir yol arkadaşı.',
              },
            ].map((p) => (
              <div
                key={p.name}
                className="group overflow-hidden rounded-2xl border border-[#ebd8d4] bg-[#fffaf8] transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:border-[#bb8583]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image src={p.img} alt={p.name} fill sizes="400px" className="object-cover transition-transform duration-700 group-hover:scale-108" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[9px] uppercase tracking-wider text-[#bb8583] font-semibold">
                    {p.role}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl group-hover:text-[#bb8583] transition-colors">{p.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#573f43]/70">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* GERİ SAYIM (BLUSH CARDS) */}
        <section id="countdown" className="rounded-3xl border border-[#e8d5d0] bg-[#fdf8f6] p-8 sm:p-14 text-center shadow-md">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#bb8583]">Kavuşma Vaktine</span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Geri Sayım</h2>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { val: timeLeft.days, label: 'GÜN' },
              { val: String(timeLeft.hours).padStart(2, '0'), label: 'SAAT' },
              { val: String(timeLeft.minutes).padStart(2, '0'), label: 'DAKİKA' },
              { val: String(timeLeft.seconds).padStart(2, '0'), label: 'SANİYE' },
            ].map((b) => (
              <div key={b.label} className="rounded-2xl border border-[#e8d5d0] bg-white p-6 shadow-xs hover:border-[#bb8583] hover:-translate-y-1 transition">
                <span className="font-serif text-4xl sm:text-5xl text-[#bb8583]">{b.val}</span>
                <p className="mt-2 text-[9px] uppercase tracking-widest text-[#573f43]/60">{b.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DÜĞÜN PROGRAMI */}
        <section id="details" className="rounded-3xl border border-[#e8d5d0] bg-white p-8 sm:p-12 shadow-md">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#bb8583]">Günün Ahengi</span>
            <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Kutlama Programı</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { icon: CalendarDays, time: '18.00', title: 'Bahçe Karşılaması', sub: 'Limonata & Müzik' },
              { icon: Clock3, time: '19.00', title: 'Nikâh Töreni', sub: 'Lavanta Çardağı' },
              { icon: Heart, time: '20.00', title: 'Yemek & Kutlama', sub: 'Kır Masaları' },
            ].map((s) => (
              <div key={s.time} className="rounded-2xl border border-[#ebd8d4] bg-[#fffaf8] p-6 text-center hover:shadow-md hover:border-[#bb8583] transition">
                <s.icon className="mx-auto h-6 w-6 text-[#bb8583]" />
                <span className="mt-3 block font-serif text-2xl text-[#bb8583]">{s.time}</span>
                <p className="mt-2 font-semibold text-sm">{s.title}</p>
                <p className="mt-1 text-xs text-[#573f43]/60">{s.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* GOOGLE HARİTALAR MODERN UI */}
        <section id="location" className="rounded-3xl border border-[#e8d5d0] bg-white p-6 sm:p-10 shadow-lg">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#bb8583]">Yol Tarifi</span>
            <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Lavanta Bahçesi'nde Buluşalım</h2>
            <p className="mt-2 text-xs text-[#573f43]/70">{venueAddress}</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#ebd8d4]">
            <div className="grid lg:grid-cols-[1.3fr_1fr]">
              <div className="relative min-h-[340px] w-full">
                <iframe
                  title="Bursa Lavanta Harita"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d48000!2d28.95!3d40.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14ca15f8d6896245%3A0x6b3074c5d3d4b6!2sNil%C3%BCfer%2C%20Bursa!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str"
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-between bg-[#fffaf8]">
                <div className="space-y-4">
                  <h3 className="font-serif text-2xl">Mekân Notları</h3>
                  <div className="rounded-xl border border-[#ebd8d4] bg-white p-4 text-xs space-y-1">
                    <p className="font-semibold flex items-center gap-1.5"><Car className="h-4 w-4 text-[#bb8583]" /> Geniş Otopark Alanı</p>
                    <p className="text-[#573f43]/60">Bahçe girişinde konuklarımız için ücretsiz araç park yeri mevcuttur.</p>
                  </div>
                  <div className="rounded-xl border border-[#ebd8d4] bg-white p-4 text-xs space-y-1">
                    <p className="font-semibold">Kıyafet Önerisi</p>
                    <p className="text-[#573f43]/60">Çim zemin olması sebebiyle rahat ve kır düğününe uygun ayakkabılar tavsiye edilir.</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    href="https://www.google.com/maps/search/?api=1&query=Nilufer+Bursa"
                    target="_blank"
                    className="flex-1 rounded-xl bg-[#bb8583] py-3 text-center text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#a6716f]"
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
                    className="rounded-xl border border-[#ebd8d4] bg-white px-4 py-3 text-[10px] uppercase tracking-wider text-[#573f43] transition hover:bg-[#faf3f0]"
                  >
                    {copied ? 'Kopyalandı' : 'Adresi Kopyala'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* OTOMATİK KAYAN GALERİ */}
        <section id="gallery" className="rounded-3xl border border-[#e8d5d0] bg-white p-8 sm:p-12 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#bb8583]">Fotoğraf Albümümüz</span>
              <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Güzel Günlerden Küçük Kareler</h2>
              <p className="mt-1 text-xs text-[#573f43]/70">Otomatik akan bahçe galerisi · Dokunarak büyütebilirsiniz</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className="h-9 w-9 rounded-full border border-[#ebd8d4] flex items-center justify-center hover:bg-[#bb8583] hover:text-white transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className="h-9 w-9 rounded-full border border-[#ebd8d4] flex items-center justify-center hover:bg-[#bb8583] hover:text-white transition"
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
                className="group relative flex-none w-[280px] sm:w-[320px] aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl border border-[#ebd8d4] bg-[#fbf5f3] transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
              >
                <Image src={photo.src} alt={photo.title} fill sizes="320px" className="object-cover transition-transform duration-700 group-hover:scale-108" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-80" />
                <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                  <p className="text-[9px] uppercase tracking-widest text-[#f5d0cd]">{photo.subtitle}</p>
                  <h4 className="mt-1 font-serif text-lg">{photo.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEN DE BU GÜNE AİT BİR RESİM EKLE & QR ALBÜM */}
        <section id="guest-album" className="rounded-3xl border border-[#bb8583]/40 bg-[#fffaf8] p-8 sm:p-12 shadow-lg">
          <div className="border-b border-[#ebd8d4] pb-6 sm:flex sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#bb8583]/15 px-3 py-1 text-[9px] uppercase tracking-widest text-[#bb8583] font-semibold">
                <Sparkles className="h-3 w-3" /> Ortak Fotoğraf Albümü
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Sen de Bu Güne Ait Bir Resim Ekle</h2>
              <p className="mt-1.5 text-xs text-[#573f43]/70">
                Masadaki QR kodu telefonunuzun kamerasıyla okutarak çektiğiniz kareleri albümümüze hemen yükleyin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-full border border-[#bb8583] px-4 py-2 text-[10px] uppercase tracking-wider text-[#bb8583] hover:bg-[#bb8583] hover:text-white transition"
            >
              <QrCode className="h-4 w-4" /> QR Kodu Büyüt
            </button>
          </div>

          <div className="mt-8 grid lg:grid-cols-[1.1fr_1.3fr] gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border border-[#ebd8d4] bg-white p-4">
                <div onClick={() => setIsQrModalOpen(true)} className="h-24 w-24 shrink-0 rounded-xl bg-white p-1.5 cursor-pointer border border-[#ebd8d4] shadow-xs">
                  {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR" className="h-full w-full object-contain" />}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#bb8583] font-semibold">Masa QR Kodu</p>
                  <p className="text-xs font-semibold">Kameranızla Tara & Yükle</p>
                  <p className="mt-1 text-[10px] text-[#573f43]/60">Telefondan anında açılır, uygulama yüklemeniz gerekmez.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#ebd8d4] bg-white p-5 space-y-3">
                <input
                  type="text"
                  value={uploader}
                  onChange={(e) => setUploader(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="h-10 w-full rounded-xl border border-[#ebd8d4] px-3 text-xs focus:border-[#bb8583] focus:outline-none"
                />
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Kısa bir tebrik notu"
                  className="h-10 w-full rounded-xl border border-[#ebd8d4] px-3 text-xs focus:border-[#bb8583] focus:outline-none"
                />
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#bb8583] py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#a6716f] transition disabled:opacity-50"
                >
                  {isUploading ? 'Yükleniyor...' : <><Camera className="h-4 w-4" /> Fotoğraf Çek / Galeriden Yükle</>}
                </button>
                {uploadSuccess && (
                  <p className="text-xs text-emerald-700 text-center font-medium">Fotoğrafınız albüme eklendi 🌸</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold">Misafirlerden Gelen Hatıralar</span>
                <span className="text-[#bb8583]">{guestPhotos.length} Fotoğraf</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {guestPhotos.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedGuestPhoto(p)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-[#ebd8d4] cursor-pointer"
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
        <section id="invitation" className="rounded-3xl border border-[#e8d5d0] bg-white p-8 sm:p-14 text-center shadow-md">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#bb8583]">VIP Dijital Davetiye</span>
          <div className="mt-8 max-w-md mx-auto rounded-3xl border border-[#bb8583]/40 bg-[#fff9f7] p-10 shadow-lg">
            <Flower2 className="mx-auto h-6 w-6 text-[#bb8583]" />
            <p className="mt-4 text-[9px] uppercase tracking-[0.25em] text-[#bb8583]">Sevgiyle Büyüyen Bir Hikâye</p>
            <h3 className="mt-4 font-serif text-5xl">Mina & Can</h3>
            <div className="my-5 h-px w-16 bg-[#bb8583]/30 mx-auto" />
            <p className="text-xs uppercase tracking-widest text-[#573f43]/70">18 Temmuz 2027 · 18.00</p>
            <p className="mt-1 text-xs text-[#573f43]/60">Lavanta Bahçesi · Bursa</p>
          </div>
        </section>

        {/* RSVP */}
        <section id="rsvp" className="rounded-3xl border border-[#e8d5d0] bg-white p-8 sm:p-12 text-center shadow-md">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#bb8583]">Katılım Bildirimi</span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Sizi Aramızda Görmek İsteriz</h2>
          <div className="mt-8 max-w-xl mx-auto grid sm:grid-cols-2 gap-3 text-left">
            <label className="text-[10px] uppercase tracking-wider text-[#573f43]/70">
              Adınız Soyadınız
              <input disabled placeholder="Örn: Elif Yıldız" className="mt-1.5 h-10 w-full rounded-xl border border-[#ebd8d4] bg-[#faf3f0] px-3 text-xs" />
            </label>
            <label className="text-[10px] uppercase tracking-wider text-[#573f43]/70">
              Katılım Durumu
              <select disabled defaultValue="yes" className="mt-1.5 h-10 w-full rounded-xl border border-[#ebd8d4] bg-[#faf3f0] px-3 text-xs">
                <option value="yes">Katılıyorum</option>
                <option value="no">Katılamıyorum</option>
              </select>
            </label>
            <button disabled className="sm:col-span-2 mt-2 h-11 rounded-xl bg-[#bb8583] text-[10px] font-bold uppercase tracking-wider text-white opacity-50">
              Demo Modu · Yanıt Gönderimi Kapalı
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="rounded-3xl border border-[#e8d5d0] bg-white p-10 text-center shadow-md">
          <h3 className="font-serif text-3xl">Mina <i className="text-[#bb8583]">&</i> Can</h3>
          <p className="mt-2 text-xs uppercase tracking-widest text-[#573f43]/50">18 Temmuz 2027 · Bursa</p>
          <div className="my-8 h-px w-16 bg-[#bb8583]/20 mx-auto" />
          <VipFooterActions siteId="vip-site-3" siteSlug="ozel-3" accentColor="#bb8583" />
          <p className="mt-8 text-[9px] uppercase tracking-widest text-[#573f43]/30">MOMENTIS VIP · Özel-3 Blush Garden</p>
        </footer>

      </div>

      {/* MODALS */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setIsQrModalOpen(false)}>
          <div className="relative max-w-sm w-full rounded-3xl bg-white border border-[#bb8583]/30 p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsQrModalOpen(false)} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-[#faf3f0] flex items-center justify-center"><X className="h-4 w-4" /></button>
            <h4 className="font-serif text-2xl">Masa QR Kodu</h4>
            <p className="text-xs text-[#573f43]/60 mt-1">Kameranızla okutarak fotoğraflarınızı albüme ekleyin</p>
            <div className="mx-auto my-5 h-56 w-56 rounded-2xl bg-[#faf3f0] p-3 flex items-center justify-center">
              {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR" className="h-full w-full object-contain" />}
            </div>
            <p className="text-[10px] text-[#bb8583]">Mina & Can · Lavanta Bahçesi</p>
          </div>
        </div>
      )}

      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md" onClick={() => setLightboxPhoto(null)}>
          <div className="relative max-w-4xl w-full rounded-2xl overflow-hidden bg-white p-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightboxPhoto(null)} className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/60 flex items-center justify-center text-white"><X className="h-5 w-5" /></button>
            <div className="relative aspect-[16/10] w-full">
              <Image src={lightboxPhoto.src} alt={lightboxPhoto.title} fill className="object-cover" />
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-[#bb8583] uppercase tracking-widest">{lightboxPhoto.subtitle}</p>
              <h3 className="font-serif text-2xl mt-1">{lightboxPhoto.title}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
