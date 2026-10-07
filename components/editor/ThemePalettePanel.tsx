'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Dice5, Palette, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useEditorStore } from '@/store/editor-store'
import {
  COLOR_PALETTES,
  PALETTE_CATEGORIES,
  PALETTE_COLOR_KEYS,
  PALETTE_COLOR_LABELS,
  applyPaletteToDesign,
  createRandomPalette,
  getContrastRatio,
  type ColorPalette,
  type PaletteColors,
} from '@/lib/themes/color-palettes'

const CUSTOM_PALETTES_KEY = 'momentis-editor-custom-palettes-v1'
const INITIAL_COLORS: PaletteColors = { ...COLOR_PALETTES[0].colors }

function ColorFields({ colors, onChange }: { colors: PaletteColors; onChange: (key: keyof PaletteColors, value: string) => void }) {
  const [hexValues, setHexValues] = useState<PaletteColors>({ ...colors })

  useEffect(() => setHexValues({ ...colors }), [colors])

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {PALETTE_COLOR_KEYS.map((key) => (
        <label key={key} className="flex min-w-0 items-center gap-2 rounded-lg border border-[#EAE5DC] bg-white px-2.5 py-2">
          <input
            type="color"
            aria-label={`${PALETTE_COLOR_LABELS[key]} rengini seç`}
            value={colors[key]}
            onChange={(event) => onChange(key, event.target.value.toUpperCase())}
            className="h-7 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
          />
          <span className="min-w-0 flex-1 truncate text-[9px] text-midnight/65">{PALETTE_COLOR_LABELS[key]}</span>
          <input
            aria-label={`${PALETTE_COLOR_LABELS[key]} HEX kodu`}
            value={hexValues[key]}
            onChange={(event) => {
              const value = event.target.value.toUpperCase()
              setHexValues((current) => ({ ...current, [key]: value }))
              if (/^#[0-9A-F]{6}$/.test(value)) onChange(key, value)
            }}
            onBlur={(event) => {
              if (!/^#[0-9A-F]{6}$/.test(event.target.value)) setHexValues((current) => ({ ...current, [key]: colors[key] }))
            }}
            maxLength={7}
            className="w-[76px] rounded-md border border-transparent bg-ivory-50 px-1.5 py-1 font-mono text-[9px] text-midnight outline-none focus:border-champagne"
          />
        </label>
      ))}
    </div>
  )
}

export function ThemePalettePanel() {
  const { design, setDesign, setPalettePreview } = useEditorStore()
  const [mode, setMode] = useState<'presets' | 'custom'>('presets')
  const [category, setCategory] = useState<(typeof PALETTE_CATEGORIES)[number]>('Tümü')
  const [query, setQuery] = useState('')
  const [customPalettes, setCustomPalettes] = useState<ColorPalette[]>([])
  const [activePalette, setActivePalette] = useState<ColorPalette>(COLOR_PALETTES[0])
  const [draftColors, setDraftColors] = useState<PaletteColors>(INITIAL_COLORS)
  const [draftName, setDraftName] = useState('')
  const [copied, setCopied] = useState('')
  const [storageError, setStorageError] = useState(false)
  const appliedPaletteId = design.palette?.id

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CUSTOM_PALETTES_KEY)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        if (!Array.isArray(parsed) || parsed.some((item) => !item?.id || !item?.name || !item?.colors)) {
          throw new Error('Kaydedilmiş özel renk paletleri geçersiz.')
        }
        setCustomPalettes(parsed)
      }
    } catch (error) {
      console.error('Özel renk paletleri okunamadı:', error)
      setStorageError(true)
    }
    return () => setPalettePreview(null)
  }, [setPalettePreview])

  const allPalettes = useMemo(() => [...COLOR_PALETTES, ...customPalettes], [customPalettes])
  const filteredPalettes = useMemo(() => allPalettes.filter((palette) => {
    const matchesCategory = category === 'Tümü' || palette.category === category
    const haystack = `${palette.name} ${palette.description} ${palette.category}`.toLocaleLowerCase('tr')
    return matchesCategory && haystack.includes(query.trim().toLocaleLowerCase('tr'))
  }), [allPalettes, category, query])

  const updateDraftColor = (key: keyof PaletteColors, value: string) => {
    if (!/^#[0-9A-F]{6}$/i.test(value)) {
      setDraftColors((current) => ({ ...current, [key]: value }))
      return
    }
    setDraftColors((current) => ({ ...current, [key]: value.toUpperCase() }))
    setActivePalette((current) => ({ ...current, colors: { ...current.colors, [key]: value.toUpperCase() } }))
  }

  const applyPalette = (palette: ColorPalette) => {
    setDesign(applyPaletteToDesign(design, palette))
    setPalettePreview(null)
    setActivePalette(palette)
    setDraftColors({ ...palette.colors })
    toast.success(`${palette.name} paleti davetiyeye uygulandı`)
  }

  const choosePalette = (palette: ColorPalette) => {
    setActivePalette(palette)
    setDraftColors({ ...palette.colors })
  }

  const randomize = () => {
    const choices = COLOR_PALETTES.filter((palette) => palette.id !== appliedPaletteId)
    const palette = choices[Math.floor(Math.random() * choices.length)] ?? createRandomPalette()
    applyPalette(palette)
  }

  const persistCustomPalettes = (palettes: ColorPalette[]) => {
    try {
      window.localStorage.setItem(CUSTOM_PALETTES_KEY, JSON.stringify(palettes))
      setCustomPalettes(palettes)
      setStorageError(false)
    } catch (error) {
      console.error('Özel renk paleti kaydedilemedi:', error)
      setStorageError(true)
      toast.error('Özel palet tarayıcıya kaydedilemedi')
    }
  }

  const savePalette = () => {
    const name = draftName.trim()
    if (!name) {
      toast.error('Palet için bir isim yazın')
      return
    }
    if (PALETTE_COLOR_KEYS.some((key) => !/^#[0-9A-F]{6}$/i.test(draftColors[key]))) {
      toast.error('Her renk için geçerli bir HEX kodu girin')
      return
    }
    const palette: ColorPalette = {
      id: `custom-${crypto.randomUUID()}`,
      name,
      description: 'Kendi oluşturduğun palet',
      category: 'Modern',
      colors: { ...draftColors },
      custom: true,
    }
    persistCustomPalettes([palette, ...customPalettes])
    setDraftName('')
    choosePalette(palette)
    toast.success('Özel palet kaydedildi')
  }

  const duplicatePalette = (palette: ColorPalette) => {
    const copy: ColorPalette = {
      ...palette,
      id: `custom-${crypto.randomUUID()}`,
      name: `${palette.name} · Kopya`,
      description: 'Düzenlemek için kopyalandı',
      category: palette.category,
      custom: true,
    }
    persistCustomPalettes([copy, ...customPalettes])
    setMode('custom')
    choosePalette(copy)
    setDraftName(copy.name)
  }

  const copyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(hex)
      window.setTimeout(() => setCopied(''), 1300)
    } catch (error) {
      console.error('Renk kodu panoya kopyalanamadı:', error)
      toast.error('Renk kodu kopyalanamadı')
    }
  }

  const contrast = getContrastRatio(draftColors.foreground, draftColors.background)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#EAE5DC] bg-gradient-to-br from-[#FBF8F1] to-white p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-midnight text-champagne"><Palette className="h-4 w-4" /></span>
          <div className="min-w-0">
            <h3 className="text-[11px] font-semibold text-midnight">Davetiyenin renk dünyası</h3>
            <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">Bir palet seç, tüm tasarımın renklerini tek dokunuşla uyumla.</p>
          </div>
        </div>
        <button type="button" onClick={randomize} className="mt-3 flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-[#DCD1BD] bg-white text-[9px] font-semibold text-midnight transition hover:border-champagne hover:bg-[#FBF8F1]">
          <Dice5 className="h-3.5 w-3.5" /> Uyumlu rastgele palet
        </button>
      </div>

      <div className="grid grid-cols-2 rounded-lg border border-[#EAE5DC] bg-[#F7F5F0] p-1">
        {([
          ['presets', 'Hazır paletler'],
          ['custom', 'Özel renkler'],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setMode(key)} className={`rounded-md px-2 py-2 text-[9px] font-medium transition ${mode === key ? 'bg-white text-midnight shadow-sm' : 'text-midnight/50 hover:text-midnight'}`}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {mode === 'presets' ? (
          <motion.div key="presets" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }} className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-midnight/35" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Palet ara..." aria-label="Renk paletlerinde ara" className="h-9 w-full rounded-lg border border-[#EAE5DC] bg-white pl-9 pr-3 text-[10px] outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/15" />
            </div>
            <div className="sb-no-scrollbar flex gap-1 overflow-x-auto pb-1">
              {PALETTE_CATEGORIES.map((item) => (
                <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[8px] transition ${category === item ? 'border-midnight bg-midnight text-white' : 'border-[#EAE5DC] bg-white text-midnight/60 hover:border-champagne'}`}>
                  {item}
                </button>
              ))}
            </div>
            {storageError && <p className="rounded-md bg-amber-50 px-2 py-1.5 text-[9px] text-amber-800">Özel paletler tarayıcıdan okunamadı. Hazır paletler kullanılabilir.</p>}
            <p className="text-[9px] text-muted-foreground">{filteredPalettes.length} palet · Renk koduna dokunarak kopyala</p>
            <div className="space-y-2">
              {filteredPalettes.map((palette, index) => {
                const applied = appliedPaletteId === palette.id
                return (
                  <motion.article
                    key={palette.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, delay: Math.min(index * 0.012, 0.12) }}
                    onMouseEnter={() => setPalettePreview(palette)}
                    onMouseLeave={() => setPalettePreview(null)}
                    onFocus={() => setPalettePreview(palette)}
                    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setPalettePreview(null) }}
                    className={`overflow-hidden rounded-xl border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${applied ? 'border-champagne ring-1 ring-champagne/35 shadow-sm' : 'border-[#EAE5DC] hover:border-champagne/70'}`}
                    data-testid={`palette-card-${palette.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 px-3 pb-2.5 pt-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="truncate text-[10px] font-semibold text-midnight">{palette.name}</h4>
                          {applied && <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#F4EBD8] px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wide text-[#8B6A32]"><Check className="h-2.5 w-2.5" /> Aktif</span>}
                        </div>
                        <p className="mt-0.5 truncate text-[8px] text-muted-foreground">{palette.description}</p>
                      </div>
                      <button type="button" onClick={() => duplicatePalette(palette)} title="Paleti kopyala ve özelleştir" aria-label={`${palette.name} paletini kopyala`} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-midnight/35 transition hover:bg-ivory-50 hover:text-midnight"><Copy className="h-3 w-3" /></button>
                    </div>
                    <div className="flex h-8 px-3">
                      {PALETTE_COLOR_KEYS.map((key) => (
                        <button key={key} type="button" title={`${PALETTE_COLOR_LABELS[key]} · ${palette.colors[key]} · Kopyala`} onClick={() => void copyHex(palette.colors[key])} className="group/color relative min-w-0 flex-1 first:rounded-l-md last:rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-midnight" style={{ backgroundColor: palette.colors[key] }} aria-label={`${palette.colors[key]} HEX kodunu kopyala`}>
                          {copied === palette.colors[key] && <span className="absolute inset-x-0 bottom-0 bg-midnight/85 py-0.5 text-center text-[6px] font-semibold text-white">Copied</span>}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-[8px] text-muted-foreground">{palette.custom ? 'Benim paletim' : palette.category}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => { choosePalette(palette); setMode('custom') }} className="rounded-md px-1.5 py-1.5 text-[8px] font-medium text-midnight/65 transition hover:bg-ivory-50 hover:text-midnight">Özelleştir</button>
                        <button type="button" onClick={() => applyPalette(palette)} className={`rounded-md px-2 py-1.5 text-[8px] font-semibold transition ${applied ? 'bg-[#F4EBD8] text-[#7A5D2D]' : 'bg-midnight text-white hover:bg-midnight/85'}`}>
                          {applied ? 'Uygulandı' : 'Kullan'}
                        </button>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
              {!filteredPalettes.length && <p className="rounded-lg border border-dashed border-[#EAE5DC] px-3 py-6 text-center text-[9px] text-muted-foreground">Bu aramayla palet bulunamadı.</p>}
            </div>
          </motion.div>
        ) : (
          <motion.div key="custom" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }} className="space-y-3">
            <div>
              <h3 className="text-[10px] font-semibold text-midnight">Paletini özelleştir</h3>
              <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">Hazır paleti düzenle veya beş renginle kendine özel bir tema oluştur.</p>
            </div>
            <ColorFields colors={draftColors} onChange={updateDraftColor} />
            {contrast < 4.5 && <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[9px] text-amber-800">Düşük kontrast: metin ve zemin arasındaki oran {contrast.toFixed(1)}:1.</p>}
            <button
              type="button"
              onClick={() => applyPalette({ ...activePalette, id: `custom-edit-${activePalette.id}`, name: activePalette.name, colors: { ...draftColors }, custom: true })}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-midnight text-[9px] font-semibold text-white transition hover:bg-midnight/85"
            >
              <Sparkles className="h-3.5 w-3.5 text-champagne" /> Düzenlenmiş renkleri uygula
            </button>
            <div className="space-y-2 border-t border-[#EAE5DC] pt-3">
              <label className="block space-y-1 text-[9px] font-medium text-midnight/70">
                Palet adı
                <input value={draftName} onChange={(event) => setDraftName(event.target.value)} maxLength={48} placeholder="Bizim düğün temamız" className="h-9 w-full rounded-lg border border-[#EAE5DC] bg-white px-3 text-[10px] text-midnight outline-none focus:border-champagne" />
              </label>
              <button type="button" onClick={savePalette} className="h-9 w-full rounded-lg border border-[#D9C8A7] bg-[#FBF8F1] text-[9px] font-semibold text-midnight transition hover:border-champagne hover:bg-white">Paleti kaydet</button>
            </div>
            {customPalettes.length > 0 && (
              <div className="space-y-2 border-t border-[#EAE5DC] pt-3">
                <h4 className="text-[9px] font-semibold uppercase tracking-wider text-midnight/65">Benim paletlerim</h4>
                {customPalettes.map((palette) => (
                  <div key={palette.id} className="flex items-center gap-2 rounded-lg border border-[#EAE5DC] bg-white p-2">
                    <button type="button" onClick={() => choosePalette(palette)} className="min-w-0 flex-1 text-left text-[9px] font-medium text-midnight">{palette.name}</button>
                    <div className="flex h-5 w-16 overflow-hidden rounded">
                      {PALETTE_COLOR_KEYS.map((key) => <span key={key} className="flex-1" style={{ backgroundColor: palette.colors[key] }} />)}
                    </div>
                    <button type="button" onClick={() => persistCustomPalettes(customPalettes.filter((item) => item.id !== palette.id))} title="Özel paleti sil" className="px-1 text-[8px] text-red-500 hover:underline">Sil</button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
