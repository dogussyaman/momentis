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
  Layers,
  ArrowUpRight,
} from 'lucide-react'
import { VipDemoBanner, VipFooterActions } from '@/components/vip-design/vip-controls'

const TARGET_DATE = new Date('2027-10-03T18:30:00').getTime()

const GALLERY = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    title: 'ARCHITECTURAL SILHOUETTE',
    subtitle: 'Ankara · Modern Salon',
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    title: 'CONTRAST & MINIMALISM',
    subtitle: 'Işık ve Gölgenin Dengesi',
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
    title: 'GEOMETRIC DETAILS',
    subtitle: 'Sade Çizgiler, Net Sözler',
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
    title: 'TIMELESS MONOCHROME',
    subtitle: 'Yalın ve Güçlü Bir Başlangıç',
  },
]

type GuestPhoto = { id: string; url: string; uploader: string; note?: string; time: string }
const INITIAL_GUEST_PHOTOS: GuestPhoto[] = [
  {
    id: 'g-401',
    url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=600&q=80',
    uploader: 'Kaan & Naz',
    note: 'Kusursuz bir tasarım, kusursuz bir birliktelik.',
    time: '30 dk önce',
  },
  {
    id: 'g-402',
    url: 'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&w=600&q=80',
    uploader: 'Sarp',
    note: 'Tebrikler Ada & Aras!',
    time: '1 saat önce',
  },
]

export function Ozel4Client() {
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
  const venueAddress = 'Modern Sanat Salonu, Çankaya Cad. No: 12, Çankaya / Ankara'

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [guestPhotos, setGuestPhotos] = useState<GuestPhoto[]>(INITIAL_GUEST_PHOTOS)
  const [uploader, setUploader] = useState('')
  const [note, setNote] = useState('')
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      QRCode.toDataURL(`${window.location.origin}/tasarimlar/vip/ozel-4#guest-album`, {
        width: 300,
        margin: 1,
        color: { dark: '#111213', light: '#ffffff' },
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
            note: note.trim() || 'Modern bir güne özel anı.',
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
    <div className="relative min-h-screen bg-[#f3f3f0] text-[#111213] antialiased selection:bg-[#111213] selection:text-white">
      <VipDemoBanner
        siteId="vip-site-4"
        siteSlug="ozel-4"
        siteTitle="Özel-4 · Modern Monochrome"
        accentColor="#111213"
        bgClass="bg-[#111213]/95"
      />

      {/* NAVBAR: MINIMAL BRUTALIST GRID */}
      <header className="fixed inset-x-0 top-0 z-40 bg-[#f3f3f0]/90 backdrop-blur-md border-b border-[#111213]/10 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <Link href="#home" className="font-mono text-sm tracking-widest uppercase font-bold">
            ADA & ARAS <span className="text-[#888] font-normal">/ 03.10.27</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.25em] font-mono text-[#555]">
            <a href="#couple" className="hover:text-black transition">01 / ÇİFT</a>
            <a href="#countdown" className="hover:text-black transition">02 / SAYAÇ</a>
            <a href="#details" className="hover:text-black transition">03 / PROGRAM</a>
            <a href="#location" className="hover:text-black transition">04 / KONUM</a>
            <a href="#gallery" className="hover:text-black transition">05 / GALERİ</a>
            <a href="#guest-album" className="hover:text-black transition">06 / QR ALBÜM</a>
            <a href="#rsvp" className="hover:text-black transition">07 / RSVP</a>
          </nav>
          <a
            href="#rsvp"
            className="rounded-none border border-[#111213] bg-[#111213] px-5 py-2 text-[10px] uppercase tracking-[0.2em] font-mono text-white hover:bg-transparent hover:text-[#111213] transition"
          >
            RSVP BİLDİR
          </a>
        </div>
      </header>

      {/* HERO: MODERN MONOCHROME */}
      <section id="home" className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-20 border-b border-[#111213]/10">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2000&q=80"
            alt="Modern Monochrome Hero"
            fill
            priority
            className="object-cover grayscale contrast-125 opacity-20"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#666]">
            TOGETHER, INTENTIONALLY · ÇAĞDAŞ MİNİMALİZM
          </p>
          <h1 className="mt-8 font-sans font-black text-6xl sm:text-8xl lg:text-9xl tracking-tighter uppercase text-[#111213]">
            ADA <span className="font-serif italic font-normal text-[#888]">&</span> ARAS
          </h1>
          <div className="mx-auto mt-8 h-1 w-16 bg-[#111213]" />
          <p className="mt-8 max-w-lg mx-auto text-sm leading-relaxed text-[#555] font-light">
            En sevdiğimiz şey, hayatın her hâlini yan yana ve net çizgilerle karşılamak. Çağdaş bir kutlamada bizimle olun.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 font-mono text-xs uppercase tracking-widest text-[#111213]">
            <span>03 EKİM 2027</span>
            <span>/</span>
            <span>18.30 KARŞILAMA</span>
            <span>/</span>
            <span>ANKARA</span>
          </div>
        </div>
      </section>

      {/* SECTIONS */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-14">

        {/* 01 ÇİFTİMİZ */}
        <section id="couple" className="rounded-2xl border border-[#111213]/15 bg-white p-8 sm:p-14 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#111213]/10 pb-6 mb-10">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">01 / BİYOGRAFİ</span>
              <h2 className="mt-1 font-sans font-bold text-3xl sm:text-4xl tracking-tight">ADA & ARAS</h2>
            </div>
            <p className="text-xs text-[#666] max-w-sm">Tasarım, mimari ve paylaşılan ortak vizyonun bir araya getirdiği iki hayat.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {[
              {
                name: 'ADA YILMAZ',
                role: 'GELİN / MİMAR',
                img: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
                desc: 'Net detaylar, estetik dinginlik ve modern çizgilerin peşinde.',
              },
              {
                name: 'ARAS KORHAN',
                role: 'DAMAT / TASARIMCI',
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
                desc: 'Her yapıda dengeyi ve kalıcı sadeliği arayan bir vizyon.',
              },
            ].map((p) => (
              <div key={p.name} className="group border border-[#111213]/15 bg-[#fafaf8] p-4 transition-all duration-300 hover:border-[#111213] hover:shadow-lg">
                <div className="relative aspect-[4/3] w-full overflow-hidden grayscale contrast-110 group-hover:grayscale-0 transition-all duration-700">
                  <Image src={p.img} alt={p.name} fill sizes="400px" className="object-cover" />
                  <span className="absolute bottom-3 left-3 bg-[#111213] px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-white">
                    {p.role}
                  </span>
                </div>
                <div className="pt-5">
                  <h3 className="font-mono font-bold text-xl">{p.name}</h3>
                  <p className="mt-2 text-xs text-[#555] leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 02 SAYAÇ */}
        <section id="countdown" className="rounded-2xl border border-[#111213] bg-[#111213] p-8 sm:p-14 text-white text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#888]">02 / HEDEF ZAMAN</span>
          <h2 className="mt-2 font-mono font-bold text-3xl sm:text-4xl tracking-tight">GERİ SAYIM</h2>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { val: timeLeft.days, label: 'GÜN' },
              { val: String(timeLeft.hours).padStart(2, '0'), label: 'SAAT' },
              { val: String(timeLeft.minutes).padStart(2, '0'), label: 'DAKİKA' },
              { val: String(timeLeft.seconds).padStart(2, '0'), label: 'SANİYE' },
            ].map((b) => (
              <div key={b.label} className="border border-white/20 p-6 bg-white/5 hover:border-white transition">
                <span className="font-mono text-4xl sm:text-5xl font-light text-white">{b.val}</span>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-[#888]">{b.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 03 PROGRAM */}
        <section id="details" className="rounded-2xl border border-[#111213]/15 bg-white p-8 sm:p-12">
          <div className="border-b border-[#111213]/10 pb-4 mb-8">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">03 / PROGRAM AKIŞI</span>
            <h2 className="mt-1 font-sans font-bold text-3xl">GÜNÜN ZAMAN ÇİZELGESİ</h2>
          </div>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { time: '18.30', title: 'KOKTEYL & KARŞILAMA', sub: 'Ana Galeri' },
              { time: '19.30', title: 'NİKÂH SEREMONİSİ', sub: 'Açık Avlu' },
              { time: '20.30', title: 'AKŞAM YEMEĞİ', sub: 'Modern Salon' },
              { time: '22.30', title: 'AFTER PARTY', sub: 'Lounge Bar' },
            ].map((s) => (
              <div key={s.time} className="border border-[#111213]/10 bg-[#fafaf8] p-6 hover:border-[#111213] transition">
                <span className="font-mono text-2xl font-bold">{s.time}</span>
                <p className="mt-3 font-mono text-xs font-semibold">{s.title}</p>
                <p className="mt-1 text-[11px] text-[#777]">{s.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 04 GOOGLE MAPS MONOCHROME */}
        <section id="location" className="rounded-2xl border border-[#111213]/15 bg-white p-6 sm:p-10">
          <div className="border-b border-[#111213]/10 pb-4 mb-8 flex justify-between items-end">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">04 / LOKASYON</span>
              <h2 className="mt-1 font-sans font-bold text-3xl">MODERN SALON · ANKARA</h2>
              <p className="mt-1 text-xs text-[#666]">{venueAddress}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(venueAddress)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="font-mono text-[10px] border border-[#111213] px-3 py-1.5 uppercase hover:bg-[#111213] hover:text-white transition"
            >
              {copied ? 'KOPYALANDI' : 'ADRESİ KOPYALA'}
            </button>
          </div>

          <div className="overflow-hidden border border-[#111213]/15">
            <div className="grid lg:grid-cols-[1.4fr_1fr]">
              <div className="relative min-h-[360px] w-full grayscale contrast-125">
                <iframe
                  title="Ankara Modern Sanat Harita"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d48900!2d32.85!3d39.9!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14d34f190a9ce805%3A0x7d0220a3d463b2f!2zw4dhbmtheWEsIEFua2FyYQ!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str"
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-between bg-[#fafaf8]">
                <div className="space-y-4">
                  <h3 className="font-mono text-lg font-bold">ULAŞIM & VALE</h3>
                  <div className="border border-[#111213]/10 bg-white p-4 text-xs font-mono">
                    <p className="font-bold flex items-center gap-2"><Car className="h-4 w-4" /> ÖZEL VALE HİZMETİ</p>
                    <p className="mt-1 text-[#666]">Mekân ana girişinde vale karşılama personeli hazır bulunacaktır.</p>
                  </div>
                  <div className="border border-[#111213]/10 bg-white p-4 text-xs font-mono">
                    <p className="font-bold">DRESS CODE</p>
                    <p className="mt-1 text-[#666]">Black tie / Minimalist Monokrom Şıklık.</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    href="https://www.google.com/maps/search/?api=1&query=Cankaya+Ankara"
                    target="_blank"
                    className="flex-1 bg-[#111213] py-3 text-center font-mono text-[10px] font-bold uppercase text-white hover:bg-[#333] transition"
                  >
                    GOOGLE HARİTALAR <ArrowUpRight className="inline h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 05 OTOMATİK KAYAN GALERİ */}
        <section id="gallery" className="rounded-2xl border border-[#111213]/15 bg-white p-8 sm:p-12">
          <div className="flex items-center justify-between mb-6 border-b border-[#111213]/10 pb-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">05 / GÖRSEL ARŞİV</span>
              <h2 className="mt-1 font-sans font-bold text-3xl">GÜZEL GÜNLERDEN KARELER</h2>
              <p className="mt-1 text-xs text-[#666]">Otomatik yatay akış · İncelemek için dokunun</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className="h-9 w-9 border border-[#111213]/20 flex items-center justify-center hover:bg-[#111213] hover:text-white transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className="h-9 w-9 border border-[#111213]/20 flex items-center justify-center hover:bg-[#111213] hover:text-white transition"
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
                className="group relative flex-none w-[280px] sm:w-[320px] aspect-[4/5] cursor-pointer overflow-hidden border border-[#111213]/20 bg-[#f0f0ed] transition-all duration-300 hover:border-[#111213] hover:shadow-xl"
              >
                <Image src={photo.src} alt={photo.title} fill sizes="320px" className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70 group-hover:opacity-90" />
                <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#aaa]">{photo.subtitle}</p>
                  <h4 className="mt-1 font-mono font-bold text-sm tracking-wide">{photo.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 06 SEN DE BİR KARE EKLE & QR ALBÜM */}
        <section id="guest-album" className="rounded-2xl border border-[#111213] bg-white p-8 sm:p-12 shadow-sm">
          <div className="border-b border-[#111213]/10 pb-6 sm:flex sm:items-center sm:justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest bg-[#111213] text-white px-3 py-1">
                06 / CANLI ARŞİV
              </span>
              <h2 className="mt-3 font-sans font-bold text-3xl">SEN DE BU GÜNE AİT BİR KARE EKLE</h2>
              <p className="mt-1.5 text-xs text-[#666]">
                Masadaki QR kodu tarayarak anında fotoğraf yükleyin ve ortak albüme katkıda bulunun.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="mt-4 sm:mt-0 font-mono text-[10px] border border-[#111213] px-4 py-2 uppercase hover:bg-[#111213] hover:text-white transition"
            >
              <QrCode className="inline h-3.5 w-3.5 mr-1" /> QR KODU BÜYÜT
            </button>
          </div>

          <div className="mt-8 grid lg:grid-cols-[1.1fr_1.3fr] gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 border border-[#111213]/15 bg-[#fafaf8] p-4">
                <div onClick={() => setIsQrModalOpen(true)} className="h-24 w-24 shrink-0 bg-white p-1.5 border border-[#111213]/20 cursor-pointer">
                  {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR" className="h-full w-full object-contain" />}
                </div>
                <div className="font-mono">
                  <p className="text-[10px] uppercase text-[#888]">MASA QR KODU</p>
                  <p className="text-xs font-bold text-[#111213]">KAMERAYLA OKUTUN</p>
                  <p className="mt-1 text-[10px] text-[#666]">Telefon kameranızla doğrudan web arayüzüne bağlanın.</p>
                </div>
              </div>

              <div className="border border-[#111213]/15 bg-[#fafaf8] p-5 space-y-3">
                <input
                  type="text"
                  value={uploader}
                  onChange={(e) => setUploader(e.target.value)}
                  placeholder="ADINIZ SOYADINIZ"
                  className="h-10 w-full border border-[#111213]/20 bg-white px-3 font-mono text-xs focus:border-[#111213] focus:outline-none"
                />
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="BİR NOT BIRAKIN"
                  className="h-10 w-full border border-[#111213]/20 bg-white px-3 font-mono text-xs focus:border-[#111213] focus:outline-none"
                />
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-[#111213] py-3 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-[#333] transition disabled:opacity-50"
                >
                  {isUploading ? 'YÜKLENİYOR...' : <><Camera className="inline h-4 w-4 mr-1" /> FOTOĞRAF YÜKLE</>}
                </button>
                {uploadSuccess && (
                  <p className="font-mono text-xs text-black text-center font-bold">FOTOĞRAF ARŞİVE EKLENDİ ✓</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 font-mono text-xs">
                <span className="font-bold">MİSAFİR FOTOĞRAFLARI</span>
                <span>{guestPhotos.length} ADET</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {guestPhotos.map((p) => (
                  <div key={p.id} className="relative aspect-square border border-[#111213]/15 overflow-hidden group grayscale hover:grayscale-0 transition-all">
                    <img src={p.url} alt={p.uploader} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-[9px] text-white font-mono">
                      <p className="font-bold truncate">{p.uploader}</p>
                      <p className="text-white/60">{p.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 07 RSVP */}
        <section id="rsvp" className="rounded-2xl border border-[#111213]/15 bg-white p-8 sm:p-12 text-center">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">07 / KATILIM BİLDİRİMİ</span>
          <h2 className="mt-2 font-mono font-bold text-3xl">RSVP FORMU</h2>
          <div className="mt-8 max-w-xl mx-auto grid sm:grid-cols-2 gap-3 text-left font-mono">
            <label className="text-[10px] uppercase text-[#666]">
              İSİM SOYİSİM
              <input disabled placeholder="Örn: Can Demir" className="mt-1 h-10 w-full border border-[#111213]/20 bg-[#fafaf8] px-3 text-xs" />
            </label>
            <label className="text-[10px] uppercase text-[#666]">
              DURUM
              <select disabled defaultValue="yes" className="mt-1 h-10 w-full border border-[#111213]/20 bg-[#fafaf8] px-3 text-xs">
                <option value="yes">KATILIYORUM</option>
                <option value="no">KATILAMIYORUM</option>
              </select>
            </label>
            <button disabled className="sm:col-span-2 mt-2 h-11 bg-[#111213] text-[10px] font-mono font-bold uppercase text-white opacity-50">
              DEMO MODU · YANIT KAPALI
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="rounded-2xl border border-[#111213]/15 bg-white p-10 text-center font-mono">
          <h3 className="text-2xl font-bold tracking-tight">ADA & ARAS</h3>
          <p className="mt-2 text-xs text-[#777]">03 EKİM 2027 · ANKARA</p>
          <div className="my-8 h-px w-16 bg-[#111213]/20 mx-auto" />
          <VipFooterActions siteId="vip-site-4" siteSlug="ozel-4" accentColor="#111213" />
          <p className="mt-8 text-[9px] uppercase tracking-widest text-[#999]">MOMENTIS VIP · ÖZEL-4 MODERN MONOCHROME</p>
        </footer>

      </div>

      {/* MODALS */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsQrModalOpen(false)}>
          <div className="relative max-w-sm w-full bg-white border border-[#111213] p-6 text-center font-mono" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsQrModalOpen(false)} className="absolute top-4 right-4 h-8 w-8 border border-[#111213] flex items-center justify-center"><X className="h-4 w-4" /></button>
            <h4 className="text-xl font-bold">MASA QR KODU</h4>
            <p className="text-xs text-[#666] mt-1">Kameranızla okutarak fotoğraflarınızı yükleyin</p>
            <div className="mx-auto my-5 h-56 w-56 border border-[#111213]/20 p-3 flex items-center justify-center bg-white">
              {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR" className="h-full w-full object-contain" />}
            </div>
            <p className="text-[10px] text-[#888]">ADA & ARAS · MODERN SALON</p>
          </div>
        </div>
      )}

      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxPhoto(null)}>
          <div className="relative max-w-4xl w-full bg-black border border-white/20 p-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightboxPhoto(null)} className="absolute top-4 right-4 z-10 h-10 w-10 bg-white text-black flex items-center justify-center"><X className="h-5 w-5" /></button>
            <div className="relative aspect-[16/10] w-full">
              <Image src={lightboxPhoto.src} alt={lightboxPhoto.title} fill className="object-cover" />
            </div>
            <div className="p-4 text-center text-white font-mono">
              <p className="text-xs text-[#888]">{lightboxPhoto.subtitle}</p>
              <h3 className="text-xl font-bold mt-1">{lightboxPhoto.title}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
