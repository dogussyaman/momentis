'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Maximize2, X, Sparkles, Heart } from 'lucide-react'

// Selected high-res luxury wedding photos
const GALLERY_ITEMS = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    title: 'Göz Göze Bir An',
    subtitle: 'Kapadokya Gün Doğumu',
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80',
    title: 'Sonsuzluğa Adım',
    subtitle: 'Sahil Yürüyüşü',
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
    title: 'Aşkımızın Nişanesi',
    subtitle: 'Yüzükler & Zarif Detaylar',
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
    title: 'İlk Dans Provası',
    subtitle: 'Gülümseyen Bakışlar',
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    title: 'Çiçekler Arasında',
    subtitle: 'Doğal Işık Altında',
  },
  {
    id: 6,
    src: 'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&w=1200&q=80',
    title: 'Birlikte Yeni Bir Yol',
    subtitle: 'El Ele Bir Ömür',
  },
  {
    id: 7,
    src: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
    title: 'Tören Işıkları',
    subtitle: 'Masalsı Atmosfer',
  },
]

export function Ozel1GallerySlider() {
  const [selectedPhoto, setSelectedPhoto] = useState<typeof GALLERY_ITEMS[0] | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Automatic smooth scroll horizontally
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let animationFrameId: number

    const scrollStep = () => {
      if (!isPaused && el) {
        // If reached end, loop back smoothly
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
          el.scrollLeft = 0
        } else {
          el.scrollLeft += 0.85
        }
      }
      animationFrameId = requestAnimationFrame(scrollStep)
    }

    animationFrameId = requestAnimationFrame(scrollStep)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isPaused])

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const offset = direction === 'left' ? -360 : 360
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <div className="relative w-full">
      {/* Slider Controls */}
      <div className="mb-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-xs text-midnight/55">
          <Sparkles className="h-3.5 w-3.5 text-[#a98756]" />
          <span className="text-[11px] font-medium tracking-wide">
            Otomatik akan galeri · Üzerine gelerek durdurabilir, dilediğiniz kareyi büyütebilirsiniz
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9cbb6] bg-white text-midnight/70 transition-all hover:bg-[#a98756] hover:text-white hover:shadow-md"
            aria-label="Önceki fotoğraflar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9cbb6] bg-white text-midnight/70 transition-all hover:bg-[#a98756] hover:text-white hover:shadow-md"
            aria-label="Sonraki fotoğraflar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Auto-scrolling Gallery Track */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none scroll-smooth select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Render twice for continuous loop feeling */}
        {[...GALLERY_ITEMS, ...GALLERY_ITEMS].map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            onClick={() => setSelectedPhoto(item)}
            className="group relative flex-none w-[270px] sm:w-[320px] aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl bg-[#eee8de] shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border border-[#e9e1d5]"
          >
            <Image
              src={item.src}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 270px, 320px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            {/* Elegant gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-85" />

            {/* Hover floating badge */}
            <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-midnight/80 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75 shadow-sm">
              <Maximize2 className="h-4 w-4 text-[#a98756]" />
            </div>

            {/* Bottom Caption */}
            <div className="absolute bottom-0 inset-x-0 p-5 text-white transition-transform duration-300 transform group-hover:translate-y-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#e7c98f]">
                {item.subtitle}
              </p>
              <h4 className="mt-1 font-serif text-lg leading-snug drop-shadow-sm text-white">
                {item.title}
              </h4>
              <div className="mt-2 flex items-center gap-1.5 text-[9px] text-white/70">
                <Heart className="h-3 w-3 text-[#e7c98f] fill-[#e7c98f]/40" />
                <span>Büyütmek için dokunun</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-3xl bg-[#1e221d] p-3 shadow-2xl border border-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-5 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-[#a98756]"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full max-h-[72vh] overflow-hidden rounded-2xl">
              <Image
                src={selectedPhoto.src}
                alt={selectedPhoto.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-cover"
              />
            </div>

            <div className="p-4 sm:p-5 text-center text-white">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#e7c98f]">
                {selectedPhoto.subtitle}
              </p>
              <h3 className="mt-1 font-serif text-2xl text-white">
                {selectedPhoto.title}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
