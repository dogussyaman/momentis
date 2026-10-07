'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { compressImageFile } from '@/lib/compress-image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function SiteImageField({ label, fieldKey, value, onChange }: { label: string; fieldKey: string; value?: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

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
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()} className="h-8 flex-1 text-[10px]">
          {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="mr-1.5 h-3.5 w-3.5" />}
          {uploading ? 'Yükleniyor…' : 'Görsel yükle'}
        </Button>
        {value && <Button type="button" variant="ghost" size="icon" onClick={() => onChange('')} className="h-8 w-8 text-muted-foreground" aria-label="Görseli kaldır"><Trash2 className="h-3.5 w-3.5" /></Button>}
      </div>
      {value && <img src={value} alt={`${label} önizleme`} className="h-20 w-full rounded-lg border object-cover" />}
      <p className="text-[9px] text-muted-foreground">JPG, PNG veya WEBP · En fazla 12 MB; yüklemeden önce sıkıştırılır.</p>
    </div>
  )
}
