'use client'

import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import {
  QrCode,
  Upload,
  Camera,
  ImagePlus,
  Sparkles,
  Heart,
  CheckCircle2,
  X,
  Maximize2,
  Share2,
} from 'lucide-react'
import Image from 'next/image'

type SharedPhoto = {
  id: string
  url: string
  uploader: string
  note?: string
  time: string
}

// Initial community demo photos for realistic showcase
const INITIAL_GUEST_PHOTOS: SharedPhoto[] = [
  {
    id: 'g-1',
    url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80',
    uploader: 'Selin & Mert',
    note: 'Sizi böyle mutlu görmek harika!',
    time: '10 dk önce',
  },
  {
    id: 'g-2',
    url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=600&q=80',
    uploader: 'Deniz Kaya',
    note: 'Kadehler en güzel çifte kalkıyor 🥂',
    time: '25 dk önce',
  },
  {
    id: 'g-3',
    url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80',
    uploader: 'Kemal Amca',
    note: 'Ömür boyu mutluluklar canlarım.',
    time: '1 saat önce',
  },
]

export function Ozel1GuestUploadCard() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [guestPhotos, setGuestPhotos] = useState<SharedPhoto[]>(INITIAL_GUEST_PHOTOS)
  const [uploaderName, setUploaderName] = useState('')
  const [uploaderNote, setUploaderNote] = useState('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<SharedPhoto | null>(null)

  // Generate QR Code on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const targetUrl = `${window.location.origin}/tasarimlar/vip/ozel-1#guest-album`
      QRCode.toDataURL(targetUrl, {
        width: 320,
        margin: 1,
        color: {
          dark: '#2c302b',
          light: '#ffffff',
        },
      })
        .then(setQrCodeDataUrl)
        .catch(() => {})
    }
  }, [])

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setIsUploading(true)

    // Simulate responsive upload preview via FileReader
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setTimeout(() => {
        const newPhoto: SharedPhoto = {
          id: `upload-${Date.now()}`,
          url: dataUrl,
          uploader: uploaderName.trim() || 'Davetli Misafir',
          note: uploaderNote.trim() || 'Bu mutlu güne özel bir hatıra ✨',
          time: 'Şimdi',
        }

        setGuestPhotos((prev) => [newPhoto, ...prev])
        setIsUploading(false)
        setUploadSuccess(true)
        setUploaderNote('')
        setTimeout(() => setUploadSuccess(false), 4000)
      }, 700)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div id="guest-album" className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-3xl border border-[#dfd3c2] bg-white shadow-xl">
        {/* Banner Header */}
        <div className="border-b border-[#eee3d3] bg-[#faf6f0] px-6 py-6 sm:px-10 sm:py-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7c98f]/25 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a98756]">
              <Sparkles className="h-3 w-3" /> Ortak Canlı Anı Albümü
            </span>
            <h3 className="mt-2 font-serif text-2xl sm:text-3xl text-midnight">
              Sen de Bu Güne Ait Bir Kare Ekle
            </h3>
            <p className="mt-1.5 text-xs text-midnight/65 max-w-xl">
              Tören boyunca çektiğiniz en özel ve eğlenceli fotoğrafları masanızdaki QR kodu okutarak veya doğrudan buradan albüme ekleyebilirsiniz.
            </p>
          </div>

          <div className="mt-4 sm:mt-0 shrink-0 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[#d9cbb6] bg-white px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-midnight shadow-xs transition hover:bg-[#a98756] hover:text-white hover:border-[#a98756]"
            >
              <QrCode className="h-4 w-4" /> QR Kodu Büyüt
            </button>
          </div>
        </div>

        {/* Content Body: Left Upload / QR - Right Guest Gallery */}
        <div className="grid lg:grid-cols-[1.1fr_1.4fr] divide-y lg:divide-y-0 lg:divide-x divide-[#eee3d3]">
          {/* Upload and QR Column */}
          <div className="p-6 sm:p-8 flex flex-col justify-between bg-[#fcfbfa]">
            <div className="space-y-5">
              {/* QR Mini Preview Card */}
              <div className="flex items-center gap-4 rounded-2xl border border-[#ebd8c0] bg-white p-4 shadow-xs">
                <div
                  onClick={() => setIsQrModalOpen(true)}
                  className="group relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[#eee4d5] bg-white p-1.5 transition hover:shadow-md"
                >
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="Davet Albümü QR Kodu" className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <QrCode className="h-8 w-8 text-[#a98756]" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Maximize2 className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="flex-1 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#a98756]">Masadan Hızlı Yükleme</p>
                  <p className="mt-0.5 text-xs font-semibold text-midnight">Telefonunuzla QR'ı Okutun</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-midnight/55">
                    Kamera uygulamanızı açıp koda tuttuğunuzda yükleme alanı anında cep telefonunuzda açılır.
                  </p>
                </div>
              </div>

              {/* Direct Web Form */}
              <div className="rounded-2xl border border-[#ebd8c0] bg-white p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-midnight/70">
                    Doğrudan Fotoğraf Seç
                  </p>
                  <span className="text-[9px] text-midnight/40">JPG, PNG, WEBP</span>
                </div>

                <div>
                  <input
                    type="text"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                    placeholder="Adınız & Soyadınız (Örn. Zeynep)"
                    className="h-10 w-full rounded-xl border border-[#e5d9c9] bg-[#faf8f4] px-3.5 text-xs text-midnight placeholder:text-midnight/40 focus:border-[#a98756] focus:outline-none"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={uploaderNote}
                    onChange={(e) => setUploaderNote(e.target.value)}
                    placeholder="Kısa bir tebrik notu (İsteğe bağlı)"
                    className="h-10 w-full rounded-xl border border-[#e5d9c9] bg-[#faf8f4] px-3.5 text-xs text-midnight placeholder:text-midnight/40 focus:border-[#a98756] focus:outline-none"
                  />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#a98756] py-3 text-xs font-medium uppercase tracking-wider text-white shadow-md transition hover:bg-[#8f7044] hover:shadow-lg disabled:opacity-50"
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Fotoğraf Yükleniyor...
                    </span>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" /> Fotoğraf Seç / Kamera ile Çek
                    </>
                  )}
                </button>

                {uploadSuccess && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800 border border-emerald-200 animate-in fade-in">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Harika! Fotoğrafınız anı albümüne başarıyla eklendi 🎉</span>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-4 text-[9px] text-center text-midnight/40 italic">
              * Yüklenen fotoğraflar çiftin özel düğün anı albümünde güvenle saklanır.
            </p>
          </div>

          {/* Right Column: Live Guest Photos Wall */}
          <div className="p-6 sm:p-8 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-midnight">
                  Misafirlerden Gelen Kareler
                </p>
                <p className="text-[10px] text-midnight/50">Canlı olarak güncellenir</p>
              </div>
              <span className="rounded-full bg-[#f8f5ef] px-3 py-1 text-[10px] font-semibold text-[#a98756]">
                {guestPhotos.length} Hatıra Paylaşıldı
              </span>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {guestPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-[#eee4d6] bg-[#fbf9f5] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <img
                    src={photo.url}
                    alt={photo.uploader}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Subtle hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  
                  <div className="absolute bottom-0 inset-x-0 p-2.5 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="text-[10px] font-semibold truncate">{photo.uploader}</p>
                    <p className="text-[8px] text-white/70 truncate">{photo.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add memory CTA card inside grid */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#cbbb9f] bg-[#fcfbfa] py-3 text-center transition hover:border-[#a98756] hover:bg-[#f6f2ea]"
            >
              <ImagePlus className="h-4 w-4 text-[#a98756]" />
              <span className="text-xs font-medium text-midnight/70">
                Sen de anını eklemek için tıkla
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Big Zoom Modal */}
      {isQrModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 text-center shadow-2xl border border-[#ebd8c0]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#f8f5ef] text-midnight/70 transition hover:bg-[#e7c98f]"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#a98756]/15 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#a98756]">
              <QrCode className="h-3.5 w-3.5" /> Masa QR Kodu
            </span>

            <h4 className="mt-3 font-serif text-2xl text-midnight">Fotoğraf Yükleme Kodu</h4>
            <p className="mt-1 text-xs text-midnight/60">
              Telefonunuzun kamerasını koda yaklaştırarak doğrudan albüme bağlanabilirsiniz.
            </p>

            <div className="mx-auto my-5 flex h-56 w-56 items-center justify-center rounded-2xl border border-[#eee4d5] bg-white p-3 shadow-inner">
              {qrCodeDataUrl && (
                <img src={qrCodeDataUrl} alt="QR Kod Büyük Görünüm" className="h-full w-full object-contain" />
              )}
            </div>

            <p className="text-[10px] text-midnight/50">
              Lal & Emir · 12 Eylül 2027 Anı Albümü
            </p>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-md overflow-hidden rounded-3xl bg-[#1e221d] p-3 shadow-2xl border border-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-5 right-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-[#a98756]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.uploader}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-4 text-center text-white">
              <p className="font-serif text-xl text-white">{selectedPhoto.uploader}</p>
              {selectedPhoto.note && (
                <p className="mt-1 text-xs text-[#e7c98f] italic">"{selectedPhoto.note}"</p>
              )}
              <p className="mt-2 text-[9px] uppercase tracking-wider text-white/50">{selectedPhoto.time}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
