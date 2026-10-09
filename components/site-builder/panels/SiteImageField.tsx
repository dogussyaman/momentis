'use client'

import { useRef, useState } from 'react'
import { Check, ChevronDown, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { compressImageFile } from '@/lib/compress-image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SITE_MEDIA_LIBRARY } from '@/lib/site-builder/media'

export function SiteImageField({ label, fieldKey, value, onChange }: { label: string; fieldKey: string; value?: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [categoryId, setCategoryId] = useState(SITE_MEDIA_LIBRARY[0].id)
  const category = SITE_MEDIA_LIBRARY.find((item) => item.id === categoryId) ?? SITE_MEDIA_LIBRARY[0]
  const isSvg = value?.split('?')[0].toLowerCase().endsWith('.svg')

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      onChange(await compressImageFile(file))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Görsel yüklenemedi')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-2" data-image-field-key={fieldKey}>
      <label className="text-[9px] text-muted-foreground">{label}</label>
      <Input value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder="Görsel bağlantısı veya cihazınızdan yükleyin" className="h-8 text-[11px]" />
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} className="hidden" />
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" aria-expanded={libraryOpen} onClick={() => setLibraryOpen((open) => !open)} className="h-8 flex-1 text-[10px]">
          {libraryOpen ? 'Kütüphaneyi kapat' : 'Hazır görsel seç'}
          <ChevronDown className={`ml-1.5 h-3.5 w-3.5 transition-transform ${libraryOpen ? 'rotate-180' : ''}`} />
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()} className="h-8 flex-1 text-[10px]">
          {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="mr-1.5 h-3.5 w-3.5" />}
          {uploading ? 'Yükleniyor…' : 'Görsel yükle'}
        </Button>
        {value && <Button type="button" variant="ghost" size="icon" onClick={() => onChange('')} className="h-8 w-8 text-muted-foreground" aria-label="Görseli kaldır"><Trash2 className="h-3.5 w-3.5" /></Button>}
      </div>
      {libraryOpen && (
        <div className="space-y-2 rounded-lg border bg-ivory-50/60 p-2">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {SITE_MEDIA_LIBRARY.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategoryId(item.id)}
                aria-pressed={categoryId === item.id}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] transition ${categoryId === item.id ? 'bg-midnight text-white' : 'bg-white text-midnight/70 hover:bg-white/80'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="grid max-h-56 grid-cols-3 gap-1.5 overflow-y-auto">
            {category.items.map((asset) => {
              const selected = value === asset.src
              return (
                <button
                  key={asset.src}
                  type="button"
                  onClick={() => onChange(asset.src)}
                  aria-label={`${asset.label} görselini seç`}
                  aria-pressed={selected}
                  title={asset.label}
                  className={`group relative overflow-hidden rounded-md border bg-white transition hover:ring-2 hover:ring-midnight/25 ${selected ? 'ring-2 ring-midnight' : ''}`}
                >
                  <img src={asset.src} alt="" loading="lazy" className="h-16 w-full object-contain p-1" />
                  {selected && <span className="absolute right-1 top-1 rounded-full bg-midnight p-0.5 text-white"><Check className="h-3 w-3" /></span>}
                  <span className="block truncate px-1 pb-1 text-[8px] text-midnight/70">{asset.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      {value && <img src={value} alt={`${label} önizleme`} className={`h-20 w-full rounded-lg border ${isSvg ? 'bg-white object-contain p-1' : 'object-cover'}`} />}
      <p className="text-[9px] text-muted-foreground">JPG, PNG veya WEBP · En fazla 12 MB; yüklemeden önce sıkıştırılır.</p>
    </div>
  )
}
