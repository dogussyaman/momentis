'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, ImagePlus, Loader2, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EASE } from '@/lib/motion'

// Resize + compress an image file in the browser so uploads stay small.
function compressImage(file, maxSize = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize }
        else if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function AlbumSection({ project, p, isDark }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploader, setUploader] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const [liked, setLiked] = useState(() => new Set())
  const fileRef = useRef(null)

  const likesKey = `momentis_album_likes_${project.slug}`
  const maxLikes = photos.reduce((m, x) => Math.max(m, x.likes || 0), 0)

  const fieldStyle = { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: `${p.accent}66`, color: p.text }

  useEffect(() => {
    try { const n = localStorage.getItem('momentis_album_name'); if (n) setUploader(n) } catch {}
    try { const raw = localStorage.getItem(likesKey); if (raw) setLiked(new Set(JSON.parse(raw))) } catch {}
    // eslint-disable-next-line
  }, [])

  const toggleLike = async (ph) => {
    const isLiked = liked.has(ph.id)
    const next = new Set(liked)
    if (isLiked) next.delete(ph.id); else next.add(ph.id)
    setLiked(next)
    try { localStorage.setItem(likesKey, JSON.stringify([...next])) } catch {}
    setPhotos((arr) => arr.map((x) => (x.id === ph.id ? { ...x, likes: Math.max(0, (x.likes || 0) + (isLiked ? -1 : 1)) } : x)))
    if (lightbox?.id === ph.id) setLightbox((l) => ({ ...l, likes: Math.max(0, (l.likes || 0) + (isLiked ? -1 : 1)) }))
    try {
      await fetch(`/api/public/album/${project.slug}/like`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: ph.id, liked: !isLiked }),
      })
    } catch { /* best effort */ }
  }

  const load = async () => {
    try {
      const res = await fetch(`/api/public/album/${project.slug}`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      setPhotos(Array.isArray(data.items) ? data.items : [])
    } catch { /* noop */ } finally { setLoading(false) }
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [project.slug])

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 12)
    if (!files.length) return
    if (uploader.trim()) { try { localStorage.setItem('momentis_album_name', uploader.trim()) } catch {} }
    setUploading(true)
    try {
      const compressed = []
      for (const f of files) {
        if (!f.type.startsWith('image/')) continue
        try { compressed.push(await compressImage(f)) } catch { /* skip */ }
      }
      if (!compressed.length) { toast.error('Fotoğraflar işlenemedi'); return }
      const res = await fetch(`/api/public/album/${project.slug}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploader: uploader.trim() || 'Misafir', photos: compressed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Yükleme başarısız')
      toast.success(`${data.uploaded} fotoğraf albüme eklendi · teşekkürler!`)
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <section id="album" className="px-6 py-24" data-testid="album-section">
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.9, ease: EASE }} className="text-center">
          <p className="text-[11px] uppercase tracking-[0.4em]" style={{ color: p.accent }}>Anı Albümü</p>
          <h2 className="mt-6 font-serif text-4xl md:text-5xl">Gecenin her karesi</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed" style={{ color: p.muted }}>
            Çektiğiniz fotoğrafları bizimle paylaşın; uygulama indirmeden, tek dokunuşla ortak albümümüze eklensin.
          </p>
        </motion.div>

        {/* Upload card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
          className="mx-auto mt-12 max-w-xl rounded-3xl border p-7 text-center" style={{ borderColor: `${p.accent}55`, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)' }}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: p.accent, color: p.bg }}>
            <Camera className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div className="mx-auto mt-6 max-w-xs space-y-2 text-left">
            <Label className="text-[10px] uppercase tracking-[0.25em]" style={{ color: p.muted }}>Adınız</Label>
            <Input value={uploader} onChange={(e) => setUploader(e.target.value)} placeholder="Örn. Zeynep" className="h-12 rounded-2xl" style={fieldStyle} data-testid="album-uploader" />
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPick} data-testid="album-file-input" />
          <Button
            type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
            className="mt-6 h-14 w-full rounded-2xl text-[12px] uppercase tracking-[0.22em] hover:opacity-90"
            style={{ backgroundColor: p.accent, color: p.bg }} data-testid="album-upload-btn"
          >
            {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yükleniyor…</> : <><Upload className="mr-2 h-4 w-4" /> Fotoğraf Yükle</>}
          </Button>
          <p className="mt-3 text-[11px]" style={{ color: p.muted }}>Birden fazla fotoğraf seçebilirsiniz · JPG, PNG, WEBP</p>
        </motion.div>

        {/* Gallery */}
        <div className="mt-14">
          {loading ? (
            <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-[3/4] w-full animate-pulse rounded-2xl" style={{ backgroundColor: `${p.accent}22` }} />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-3xl border py-20 text-center" style={{ borderColor: `${p.accent}44` }}>
              <ImagePlus className="mx-auto h-8 w-8" strokeWidth={1.3} style={{ color: p.accent }} />
              <p className="mt-5 font-serif text-xl">İlk anıyı sen paylaş</p>
              <p className="mt-2 text-sm" style={{ color: p.muted }}>Albüm henüz boş. Yüklediğin fotoğraflar burada belirir.</p>
            </motion.div>
          ) : (
            <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4" data-testid="album-gallery">
              {photos.map((ph, i) => {
                const isLiked = liked.has(ph.id)
                const isTop = (ph.likes || 0) > 0 && (ph.likes || 0) === maxLikes
                return (
                  <motion.div
                    key={ph.id}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.7, delay: (i % 8) * 0.05, ease: EASE }}
                    className="group relative block w-full overflow-hidden rounded-2xl"
                    style={{ boxShadow: isTop ? `0 22px 48px -20px ${p.accent}` : '0 20px 40px -24px rgba(16,24,39,0.5)' }}
                  >
                    {isTop && (
                      <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ backgroundColor: p.accent, color: p.bg }}>
                        <Heart className="h-2.5 w-2.5 fill-current" /> En Beğenilen
                      </span>
                    )}
                    <button type="button" onClick={() => setLightbox(ph)} className="block w-full" aria-label="Fotoğrafı büyüt">
                      <img src={ph.data_url} alt={`${ph.uploader_name} tarafından`} loading="lazy" className="w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </button>
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/55 to-transparent px-3 pb-2 pt-8 text-left text-[10px] uppercase tracking-[0.15em] text-white/90 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="h-3 w-3" /> {ph.uploader_name}
                    </span>
                    <button
                      type="button" onClick={() => toggleLike(ph)} data-testid={`album-like-${ph.id}`}
                      className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur transition-all hover:bg-black/60"
                      aria-label="Beğen"
                    >
                      <Heart className={`h-3.5 w-3.5 transition-colors ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                      {(ph.likes || 0) > 0 && <span>{ph.likes}</span>}
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={() => setLightbox(null)} data-testid="album-lightbox"
          >
            <button className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={() => setLightbox(null)} aria-label="Kapat">
              <X className="h-5 w-5" />
            </button>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} onClick={(e) => e.stopPropagation()} className="max-h-[88vh] max-w-3xl overflow-hidden rounded-3xl">
              <img src={lightbox.data_url} alt={lightbox.uploader_name} className="max-h-[88vh] w-auto object-contain" />
            </motion.div>
            <p className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-white/70">
              {lightbox.uploader_name}
              <button type="button" onClick={() => toggleLike(lightbox)} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-white hover:bg-white/20" aria-label="Beğen" data-testid="lightbox-like">
                <Heart className={`h-3.5 w-3.5 ${liked.has(lightbox.id) ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                {(lightbox.likes || 0) > 0 && <span>{lightbox.likes}</span>}
              </button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
