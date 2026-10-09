'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Camera, ImagePlus, Loader2, QrCode, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { compressImageFile } from '@/lib/compress-image'
import { cn } from '@/lib/utils'
import { Reveal, SectionHeading, SectionShell, useSiteRender, type SectionComponentProps } from '../render/primitives'

type AlbumPhoto = { id: string; data_url: string; uploader_name: string }

export function AlbumUploadSection({ section, props }: SectionComponentProps) {
  const { site, mode } = useSiteRender()
  const fileInput = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<AlbumPhoto[]>([])
  const [uploader, setUploader] = useState('')
  const [qr, setQr] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [albumEnabled, setAlbumEnabled] = useState(true)
  const canUpload = mode === 'live' && albumEnabled

  useEffect(() => {
    if (mode !== 'live' || !site.slug) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/public/album/${encodeURIComponent(site.slug)}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Anı albümü yüklenemedi')
        return response.json()
      })
      .then((data) => {
        if (!cancelled) {
          setPhotos(Array.isArray(data.items) ? data.items : [])
          setAlbumEnabled(data.enabled !== false)
        }
      })
      .catch((error) => {
        if (!cancelled && mode === 'live') toast.error(error.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [mode, site.slug])

  useEffect(() => {
    if (!site.slug || typeof window === 'undefined') return
    QRCode.toDataURL(`${window.location.origin}/d/${encodeURIComponent(site.slug)}#${section.id}`, {
      width: 240,
      margin: 1,
      color: { dark: site.theme.textColor, light: site.theme.backgroundColor },
    }).then(setQr).catch(() => toast.error('Albüm QR kodu oluşturulamadı'))
  }, [section.id, site.slug, site.theme.backgroundColor, site.theme.textColor])

  const uploadPhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 12)
    if (!files.length) return
    setUploading(true)
    try {
      const compressed: string[] = []
      for (const file of files) compressed.push(await compressImageFile(file))
      const response = await fetch(`/api/public/album/${encodeURIComponent(site.slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': window.crypto.randomUUID() },
        body: JSON.stringify({ uploader: uploader.trim() || 'Misafir', photos: compressed }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Fotoğraflar albüme eklenemedi')
      toast.success(`${data.uploaded} fotoğraf albüme eklendi`)
      const refreshed = await fetch(`/api/public/album/${encodeURIComponent(site.slug)}`, { cache: 'no-store' })
      const gallery = await refreshed.json().catch(() => ({}))
      if (!refreshed.ok) throw new Error(gallery.error || 'Albüm yenilenemedi')
      setPhotos(Array.isArray(gallery.items) ? gallery.items : [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fotoğraflar yüklenemedi')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />
      <div className="grid gap-8 @3xl:grid-cols-[minmax(0,1fr)_240px]">
        <Reveal className="sb-card flex flex-col gap-5 p-5 text-left @2xl:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl sb-bg-accent text-white"><Camera className="h-5 w-5" /></span>
            <div><h3 className="sb-heading text-xl">Anılarınızı paylaşın</h3><p className="mt-1 text-xs sb-muted">JPG, PNG veya WEBP · En fazla 12 fotoğraf</p></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`album-uploader-${section.id}`} className="text-[10px] uppercase tracking-[0.16em] sb-muted">Adınız</Label>
            <Input id={`album-uploader-${section.id}`} value={uploader} onChange={(event) => setUploader(event.target.value)} disabled={!canUpload} placeholder="Örn. Zeynep" className="sb-input h-11" />
          </div>
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={uploadPhotos} data-testid="site-album-file-input" />
          <Button type="button" disabled={!canUpload || uploading} onClick={() => fileInput.current?.click()} className="h-12 rounded-xl sb-bg-accent text-white hover:opacity-90" data-testid="site-album-upload">
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {mode !== 'live' ? 'Önizlemede yükleme kapalı' : !albumEnabled ? 'Albüm şu anda kapalı' : uploading ? 'Yükleniyor…' : 'Fotoğraf seç ve yükle'}
          </Button>
        </Reveal>
        <Reveal className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-current/10 p-5 text-center">
          {qr ? <img src={qr} alt="Anı albümü QR kodu" className="h-36 w-36 rounded-xl bg-white p-2" /> : <QrCode className="h-12 w-12 opacity-40" />}
          <p className="text-[10px] uppercase tracking-[0.16em] sb-muted">Albümü QR ile aç</p>
        </Reveal>
      </div>
      <div className="mt-8">
        {loading ? <div className="flex items-center justify-center gap-2 py-8 text-sm sb-muted"><Loader2 className="h-4 w-4 animate-spin" /> Albüm yükleniyor…</div> : photos.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 @3xl:grid-cols-4" data-testid="site-album-gallery">
            {photos.map((photo) => <figure key={photo.id} className="overflow-hidden rounded-xl border border-current/10"><img src={photo.data_url} alt={`${photo.uploader_name} tarafından paylaşıldı`} loading="lazy" className="aspect-square w-full object-cover" /><figcaption className="truncate px-3 py-2 text-[10px] sb-muted">{photo.uploader_name}</figcaption></figure>)}
          </div>
        ) : (
          <div className={cn('flex flex-col items-center gap-3 rounded-2xl border border-dashed border-current/15 py-10 text-center')}><ImagePlus className="h-7 w-7 opacity-40" /><p className="text-sm sb-muted">{canUpload ? 'Albüm henüz boş. İlk fotoğrafı siz ekleyin.' : 'Yayınlanan sitede fotoğraflar bu alanda görünür.'}</p></div>
        )}
      </div>
    </SectionShell>
  )
}
