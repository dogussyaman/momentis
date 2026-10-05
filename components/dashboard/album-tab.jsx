'use client'

import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Trash2, Download, QrCode, Images, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

export function AlbumTab({ projectId, project, onChanged }) {
  const [items, setItems] = useState(null)
  const [qr, setQr] = useState(null)
  const [enabled, setEnabled] = useState(project.album_enabled !== false)
  const [toggling, setToggling] = useState(false)

  const albumUrl = `${project.url}#album`

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/album`, { credentials: 'include', cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      setItems(Array.isArray(data.items) ? data.items : [])
      if (typeof data.enabled === 'boolean') setEnabled(data.enabled)
    } catch { setItems([]) }
  }, [projectId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    QRCode.toDataURL(albumUrl, { width: 480, margin: 1, color: { dark: '#101827', light: '#FFFFFF' } })
      .then(setQr).catch(() => setQr(null))
  }, [albumUrl])

  const toggle = async (next) => {
    setToggling(true)
    setEnabled(next)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ album_enabled: next }) })
      if (!res.ok) throw new Error()
      toast.success(next ? 'Anı albümü açıldı' : 'Anı albümü kapatıldı')
      onChanged?.()
    } catch {
      setEnabled(!next)
      toast.error('Güncellenemedi')
    } finally { setToggling(false) }
  }

  const removePhoto = async (photoId) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/album/${photoId}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error()
      setItems((arr) => (arr || []).filter((p) => p.id !== photoId))
      toast.success('Fotoğraf silindi')
      onChanged?.()
    } catch { toast.error('Silinemedi') }
  }

  return (
    <div className="space-y-8" data-testid="album-tab">
      {/* QR + toggle */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col items-center rounded-3xl border border-border bg-ivory-50 p-7 text-center">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground"><QrCode className="h-3.5 w-3.5 text-champagne-dark" /> QR Kod</p>
          <div className="mt-5 rounded-2xl border border-border bg-white p-3">
            {qr ? <img src={qr} alt="Albüm QR kodu" className="h-40 w-40 rounded-xl" data-testid="album-qr" /> : <div className="h-40 w-40 animate-pulse rounded-xl bg-muted" />}
          </div>
          {qr && (
            <Button asChild variant="outline" size="sm" className="mt-5 rounded-xl border-midnight/20 text-[10px] uppercase tracking-[0.18em]">
              <a href={qr} download={`momentis-album-${project.slug}.png`}><Download className="mr-2 h-3.5 w-3.5" /> QR'ı indir</a>
            </Button>
          )}
        </div>

        <div className="lg:col-span-2 rounded-3xl border border-border bg-ivory-50 p-7">
          <h3 className="font-serif text-2xl text-midnight">QR Anı Albümü</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Masalara yerleştireceğiniz QR kodu okutan konuklarınız, uygulama indirmeden fotoğraflarını ortak albüme yükler.
            Yüklenen tüm kareler aşağıda görünür; uygun bulmadıklarınızı silebilirsiniz.
          </p>
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4">
            <div>
              <p className="text-sm font-medium text-midnight">Albümü {enabled ? 'açık' : 'kapalı'}</p>
              <p className="text-xs text-muted-foreground">{enabled ? 'Konuklar fotoğraf yükleyebilir.' : 'Yükleme ve galeri gizli.'}</p>
            </div>
            <Switch checked={enabled} disabled={toggling} onCheckedChange={toggle} data-testid="album-toggle" />
          </div>
          <p className="mt-4 break-all text-xs text-muted-foreground">Bağlantı: {albumUrl}</p>
        </div>
      </div>

      {/* Gallery */}
      <div>
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground"><Images className="h-3.5 w-3.5 text-champagne-dark" /> Yüklenen Fotoğraflar {items ? `· ${items.length}` : ''}</p>
        {items === null ? (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}</div>
        ) : items.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-border bg-ivory-50 px-8 py-16 text-center">
            <p className="font-serif text-2xl text-midnight">Henüz fotoğraf yok</p>
            <p className="mt-2 text-sm text-muted-foreground">QR kodu paylaştığınızda konuklarınızın yüklediği anılar burada toplanır.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" data-testid="album-admin-gallery">
            {items.map((ph) => (
              <div key={ph.id} className="group relative overflow-hidden rounded-2xl border border-border">
                <img src={ph.data_url} alt={ph.uploader_name} loading="lazy" className="aspect-square w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-8 text-[10px] uppercase tracking-[0.15em] text-white/90">{ph.uploader_name}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition-opacity hover:bg-destructive group-hover:opacity-100" aria-label="Sil" data-testid={`album-delete-${ph.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader><AlertDialogTitle className="font-serif text-2xl">Fotoğrafı sil?</AlertDialogTitle><AlertDialogDescription>Bu fotoğraf albümden kalıcı olarak kaldırılacak.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel className="rounded-2xl">Vazgeç</AlertDialogCancel><AlertDialogAction onClick={() => removePhoto(ph.id)} className="rounded-2xl bg-destructive text-ivory hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
