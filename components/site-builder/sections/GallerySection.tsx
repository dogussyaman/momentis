'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal, SectionHeading, SectionShell, SbImage, useSiteRender, type SectionComponentProps } from '../render/primitives'

const ASPECT: Record<string, string> = { square: 'aspect-square', portrait: 'aspect-[3/4]', landscape: 'aspect-[4/3]' }

export function GallerySection({ section, props }: SectionComponentProps) {
  const { mode } = useSiteRender()
  const images: { id: string; src: string; caption?: string }[] = (props.images ?? []).filter((i: any) => i.src)
  const [open, setOpen] = useState<number | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const layout = props.layout ?? 'grid'
  const gap = props.gap ?? 12
  const cols = props.columns ?? 3

  const canOpen = mode === 'live' && props.lightbox !== false
  const tile = (img: (typeof images)[number], i: number, className?: string, key?: string) => (
    <Reveal key={key} className={cn('group relative overflow-hidden sb-radius', canOpen && 'cursor-zoom-in', className)}>
      <div onClick={() => canOpen && setOpen(i)} className="w-full h-full">
        <SbImage src={img.src} alt={img.caption} className={cn('w-full h-full transition-transform duration-700', props.hoverZoom !== false && 'group-hover:scale-110')} />
        {props.showCaptions && img.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-left text-sm text-white">{img.caption}</div>
        )}
      </div>
    </Reveal>
  )

  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />

      {layout === 'grid' && (
        <>
          <style>{`[data-section-id="${section.id}"] .sb-gal-grid{grid-template-columns:repeat(2,minmax(0,1fr))}@container (min-width:48rem){[data-section-id="${section.id}"] .sb-gal-grid{grid-template-columns:repeat(${cols},minmax(0,1fr))}}`}</style>
          <div className="sb-gal-grid grid" style={{ gap }}>
            {images.map((img, i) => (
              tile(img, i, ASPECT[props.aspect ?? 'square'], img.id)
            ))}
          </div>
        </>
      )}

      {layout === 'masonry' && (
        <>
          <style>{`[data-section-id="${section.id}"] .sb-gal-masonry{column-count:2}@container (min-width:48rem){[data-section-id="${section.id}"] .sb-gal-masonry{column-count:${cols}}}`}</style>
          <div className="sb-gal-masonry" style={{ columnGap: gap }}>
            {images.map((img, i) => (
              <div key={img.id} style={{ marginBottom: gap, breakInside: 'avoid' }}>
                {tile(img, i, i % 3 === 0 ? 'aspect-[3/4]' : i % 3 === 1 ? 'aspect-square' : 'aspect-[4/5]')}
              </div>
            ))}
          </div>
        </>
      )}

      {layout === 'collage' && (
        <div className="grid grid-cols-2 @3xl:grid-cols-4 auto-rows-[160px] @3xl:auto-rows-[200px]" style={{ gap }}>
          {images.map((img, i) => {
            const k = i % 6
            const span = k === 0 ? 'col-span-2 row-span-2' : k === 3 ? '@3xl:row-span-2' : k === 5 ? 'col-span-2' : ''
            return tile(img, i, span, img.id)
          })}
        </div>
      )}

      {layout === 'carousel' && (
        <div className="relative">
          <div ref={scroller} className="sb-no-scrollbar flex overflow-x-auto snap-x snap-mandatory scroll-smooth" style={{ gap }}>
            {images.map((img, i) => (
              <div key={img.id} className="snap-center shrink-0 w-[78%] @2xl:w-[45%] @4xl:w-[32%]">
                {tile(img, i, ASPECT[props.aspect ?? 'portrait'])}
              </div>
            ))}
          </div>
          {images.length > 1 && (
            <div className="mt-6 flex justify-center gap-3">
              {[-1, 1].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => scroller.current?.scrollBy({ left: d * scroller.current.clientWidth * 0.7, behavior: 'smooth' })}
                  className="w-11 h-11 rounded-full border flex items-center justify-center transition hover:bg-current/10"
                  style={{ borderColor: 'currentColor' }}
                >
                  {d < 0 ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Lightbox images={images} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </SectionShell>
  )
}

function Lightbox({ images, index, onClose, onIndex }: { images: { src: string; caption?: string }[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  useEffect(() => {
    if (index === null) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex((index + 1) % images.length)
      if (e.key === 'ArrowLeft') onIndex((index - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [index, images.length, onClose, onIndex])

  return (
    <AnimatePresence>
      {index !== null && images[index] && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <button className="absolute top-5 right-5 text-white/80 hover:text-white" onClick={onClose}><X className="w-7 h-7" /></button>
          <button className="absolute left-4 text-white/70 hover:text-white p-2" onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + images.length) % images.length) }}><ChevronLeft className="w-8 h-8" /></button>
          <motion.img
            key={index}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            src={images[index].src}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="absolute right-4 text-white/70 hover:text-white p-2" onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % images.length) }}><ChevronRight className="w-8 h-8" /></button>
          <div className="absolute bottom-6 text-white/80 text-sm">
            {images[index].caption ? `${images[index].caption} · ` : ''}{index + 1} / {images.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
