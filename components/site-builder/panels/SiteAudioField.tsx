'use client'

import { useRef, useState } from 'react'
import { AudioLines, Check, Pause, Play, Volume2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SITE_AUDIO_LIBRARY } from '@/lib/site-builder/media'

export function SiteAudioField({
  label,
  value,
  onChange,
}: {
  label: string
  value?: string
  onChange: (value: string) => void
}) {
  const previewRef = useRef<HTMLAudioElement>(null)
  const [previewingSrc, setPreviewingSrc] = useState('')
  const [previewError, setPreviewError] = useState('')

  const preview = async (src: string) => {
    const audio = previewRef.current
    if (!audio) return

    if (previewingSrc === src && !audio.paused) {
      audio.pause()
      return
    }

    setPreviewError('')
    audio.src = src
    setPreviewingSrc(src)
    try {
      await audio.play()
    } catch {
      setPreviewingSrc('')
      setPreviewError('Önizleme başlatılamadı. Ses dosyasının bağlantısını kontrol edin.')
    }
  }

  return (
    <div className="space-y-3">
      <audio
        ref={previewRef}
        preload="none"
        onPause={() => setPreviewingSrc('')}
        onEnded={() => setPreviewingSrc('')}
        className="hidden"
      />
      <div className="rounded-xl border border-[#e9e2d6] bg-gradient-to-br from-[#fbf8f2] to-white p-3">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0e7d8] text-[#9a7136]">
            <Volume2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold text-midnight">{label}</p>
            <p className="mt-0.5 text-[9px] text-muted-foreground">Ziyaretçiler başlatmak için dokunur</p>
          </div>
        </div>
        <div className="space-y-1.5">
        {SITE_AUDIO_LIBRARY.map((track) => {
          const selected = value === track.src
          const isPreviewing = previewingSrc === track.src
          return (
            <div
              key={track.src}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition ${selected ? 'border-[#b89966] bg-white shadow-sm' : 'border-[#eee8de] bg-white/75 hover:border-[#d5c4a5]'}`}
            >
              <button
                type="button"
                onClick={() => onChange(track.src)}
                aria-pressed={selected}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-[#f3eadb] text-[#9a7136]' : 'bg-[#f7f5f1] text-[#9a8d78]'}`}>
                  <AudioLines className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-midnight">{track.label}</span>
                {selected && <Check className="h-3.5 w-3.5 shrink-0 text-[#9a7136]" />}
              </button>
              <button
                type="button"
                onClick={() => void preview(track.src)}
                aria-label={`${isPreviewing ? 'Önizlemeyi durdur' : 'Önizle'}: ${track.label}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-midnight/65 transition hover:bg-[#f3eadb] hover:text-midnight"
              >
                {isPreviewing ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
              </button>
            </div>
          )
        })}
        </div>
      </div>
      {previewError && <p role="status" className="text-[9px] text-red-600">{previewError}</p>}
      <details className="group rounded-lg border border-dashed border-border px-2.5 py-2">
        <summary className="cursor-pointer list-none text-[9px] font-medium text-muted-foreground transition hover:text-midnight">
          Kendi MP3 bağlantını kullan
        </summary>
        <Input
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://.../muzik.mp3"
          aria-label={`${label} MP3 bağlantısı`}
          className="mt-2 h-8 text-[10px]"
        />
      </details>
    </div>
  )
}
