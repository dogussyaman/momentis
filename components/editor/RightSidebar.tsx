import React from 'react'
import { useEditorStore } from '@/store/editor-store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EDITOR_FONTS, fontStack } from '@/lib/editor-fonts'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronsUpDown, Type, Image as ImageIcon, Sparkles, Shapes, Move, Maximize2, RotateCw, Palette, Type as TypeIcon, AlignLeft, AlignCenter, AlignRight, Layers, ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

function DebouncedColorPicker({ value, onChange, className }: { value: string, onChange: (v: string) => void, className?: string }) {
  const [color, setColor] = React.useState(value);
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  React.useEffect(() => {
    setColor(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newColor);
    }, 100);
  };

  return <input type="color" value={color} onChange={handleChange} className={className} />;
}

export function RightSidebar() {
  const { design, selectedIds, updateElement, arrangeElement } = useEditorStore()

  const selectedElement = selectedIds.length === 1
    ? design.elements.find(el => el.id === selectedIds[0])
    : null

  if (!selectedElement) {
    return (
      <div className="flex w-[260px] shrink-0 flex-col items-center justify-center gap-4 border-l border-border bg-white p-6 text-center text-sm text-muted-foreground">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-ivory-50 text-midnight/30 shadow-sm">
          <Sparkles className="h-7 w-7" />
        </div>
        <div>
          <p className="font-medium text-midnight">Tasarımınızı kişiselleştirin</p>
          <p className="mt-1 text-xs leading-relaxed">Tuvalde bir metin, görsel veya şekil seçin. Konum, boyut ve katman ayarları burada açılır.</p>
        </div>
        <div className="w-full rounded-xl border border-dashed border-border bg-ivory-50/70 p-3 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-midnight/70">Hızlı ipucu</p>
          <p className="mt-1 text-[10px] leading-relaxed">Bir öğeyi seçip sürükleyerek yerini değiştirin; köşelerinden tutup boyutlandırın.</p>
        </div>
      </div>
    )
  }

  const handleUpdate = (key: string, value: any) => {
    updateElement(selectedElement.id, { [key]: value })
  }

  return (
    <div className="relative z-10 flex h-full w-[260px] shrink-0 flex-col border-l border-border bg-white shadow-[-2px_0_18px_-16px_rgba(16,24,39,0.35)]">
      <div className="sticky top-0 flex items-center gap-3 border-b border-border bg-white px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ivory-50 text-midnight/70">
          {selectedElement.type === 'text' ? <Type className="h-4 w-4" /> :
            selectedElement.type === 'image' ? <ImageIcon className="h-4 w-4" /> :
              <Shapes className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold tracking-wide text-midnight">
          {selectedElement.type === 'text' ? 'Metin Özellikleri' :
            selectedElement.type === 'image' ? 'Süsleme Özellikleri' : 'Şekil Özellikleri'}
        </h3>
        <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Seçili öğe</p>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto bg-[#fdfcf9] p-3">

        {/* Pozisyon & Boyut */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-midnight mb-1">
            <Move className="w-3.5 h-3.5" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Konum</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-muted-foreground">X (Yatay)</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={e => handleUpdate('x', parseFloat(e.target.value))}
                className="h-8 text-xs font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-muted-foreground">Y (Dikey)</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={e => handleUpdate('y', parseFloat(e.target.value))}
                className="h-8 text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {selectedElement.width !== undefined && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-midnight mb-1">
              <Maximize2 className="w-3.5 h-3.5" />
              <h4 className="text-xs font-semibold uppercase tracking-wider">Boyut</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-muted-foreground">Genişlik</Label>
                <Input
                  type="number"
                  value={Math.round(selectedElement.width)}
                  onChange={e => handleUpdate('width', parseFloat(e.target.value))}
                  className="h-8 text-xs font-medium"
                />
              </div>
              {selectedElement.height !== undefined && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase text-muted-foreground">Yükseklik</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedElement.height)}
                    onChange={e => handleUpdate('height', parseFloat(e.target.value))}
                    className="h-8 text-xs font-medium"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-midnight mb-1">
            <RotateCw className="w-3.5 h-3.5" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Açı & Görünüm</h4>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] flex justify-between uppercase text-muted-foreground">
              <span>Dönüş Açısı</span>
              <span>{Math.round(selectedElement.rotation || 0)}°</span>
            </Label>
            <input
              type="range" min="0" max="360"
              value={selectedElement.rotation || 0}
              onChange={e => handleUpdate('rotation', parseFloat(e.target.value))}
              className="w-full accent-midnight"
            />
          </div>
          <div className="space-y-1.5 mt-4">
            <Label className="text-[10px] flex justify-between uppercase text-muted-foreground">
              <span>Opaklık (Saydamlık)</span>
              <span>{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
            </Label>
            <input
              type="range" min="0" max="1" step="0.01"
              value={selectedElement.opacity ?? 1}
              onChange={e => handleUpdate('opacity', parseFloat(e.target.value))}
              className="w-full accent-midnight"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-midnight mb-1">
            <Layers className="w-3.5 h-3.5" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Katman Düzeni</h4>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => arrangeElement(selectedElement.id, 'front')}
              className="flex flex-col items-center justify-center p-2 bg-ivory-50 border border-border rounded-lg hover:border-midnight/40 hover:bg-ivory transition-colors text-midnight"
              title="En Öne Al"
            >
              <ArrowUpToLine className="w-4 h-4 mb-1" />
              <span className="text-[8px] font-semibold uppercase">En Ön</span>
            </button>
            <button
              onClick={() => arrangeElement(selectedElement.id, 'up')}
              className="flex flex-col items-center justify-center p-2 bg-ivory-50 border border-border rounded-lg hover:border-midnight/40 hover:bg-ivory transition-colors text-midnight"
              title="Bir Üste Al"
            >
              <ArrowUp className="w-4 h-4 mb-1" />
              <span className="text-[8px] font-semibold uppercase">İleri</span>
            </button>
            <button
              onClick={() => arrangeElement(selectedElement.id, 'down')}
              className="flex flex-col items-center justify-center p-2 bg-ivory-50 border border-border rounded-lg hover:border-midnight/40 hover:bg-ivory transition-colors text-midnight"
              title="Bir Alta Gönder"
            >
              <ArrowDown className="w-4 h-4 mb-1" />
              <span className="text-[8px] font-semibold uppercase">Geri</span>
            </button>
            <button
              onClick={() => arrangeElement(selectedElement.id, 'back')}
              className="flex flex-col items-center justify-center p-2 bg-ivory-50 border border-border rounded-lg hover:border-midnight/40 hover:bg-ivory transition-colors text-midnight"
              title="En Arkaya Gönder"
            >
              <ArrowDownToLine className="w-4 h-4 mb-1" />
              <span className="text-[8px] font-semibold uppercase">En Arka</span>
            </button>
          </div>
        </div>

        {selectedElement.type === 'text' && (
          <div className="space-y-4 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-midnight mb-1">
              <TypeIcon className="w-3.5 h-3.5" />
              <h4 className="text-xs font-semibold uppercase tracking-wider">Metin Tasarımı</h4>
            </div>

            <div className="space-y-1.5 flex flex-col">
              <Label className="text-[10px] uppercase text-muted-foreground">Yazı Tipi Ailesi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex h-9 w-full items-center justify-between rounded-xl border border-border bg-white px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-midnight/20">
                    <span className="truncate" style={{ fontFamily: fontStack(selectedElement.fontFamily) }}>
                      {selectedElement.fontFamily || "Yazı Tipi Seçin"}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 shadow-xl rounded-xl border-border" align="start">
                  <Command className="w-full">
                    <CommandInput placeholder="Ör. 'Kaligrafi' veya 'Montserrat' ara" className="h-10 text-xs" />

                    <div className="flex gap-2 overflow-x-auto px-3 py-2 border-b scrollbar-none no-scrollbar">
                      <span className="shrink-0 text-[10px] bg-ivory border px-2 py-1 rounded-md text-midnight/70 font-medium">El Yazısı</span>
                      <span className="shrink-0 text-[10px] bg-ivory border px-2 py-1 rounded-md text-midnight/70 font-bold">Kalın</span>
                      <span className="shrink-0 text-[10px] bg-ivory border px-2 py-1 rounded-md text-midnight/70 font-serif">Klasik</span>
                      <span className="shrink-0 text-[10px] bg-ivory border px-2 py-1 rounded-md text-midnight/70 font-sans">Modern</span>
                      <span className="shrink-0 text-[10px] bg-ivory border px-2 py-1 rounded-md text-midnight/70 font-medium italic">Zarif</span>
                    </div>

                    <CommandList className="max-h-[300px]">
                      <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">Yazı tipi bulunamadı.</CommandEmpty>

                      <CommandGroup heading="Belge yazı tipleri" className="text-[10px] uppercase text-muted-foreground font-semibold px-1">
                        <CommandItem
                          value={selectedElement.fontFamily}
                          onSelect={() => { }}
                          className="flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-ivory"
                        >
                          <span className="text-base text-midnight" style={{ fontFamily: fontStack(selectedElement.fontFamily) }}>{selectedElement.fontFamily}</span>
                          <Check className="h-4 w-4" />
                        </CommandItem>
                      </CommandGroup>

                      <CommandGroup heading="Premium Fontlar" className="text-[10px] uppercase text-muted-foreground font-semibold px-1 mt-2">
                        {EDITOR_FONTS.map(y => (
                          <CommandItem
                            key={y.name}
                            value={y.name}
                            onSelect={(val) => handleUpdate('fontFamily', val)}
                            className="flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-ivory"
                          >
                            <span className="text-base text-midnight truncate" style={{ fontFamily: fontStack(y.name) }}>{y.name}</span>
                            {selectedElement.fontFamily === y.name && <Check className="h-4 w-4" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>

                      <CommandGroup heading="Klasik Fontlar" className="text-[10px] uppercase text-muted-foreground font-semibold px-1 mt-2">
                        {['Georgia', 'Arial', 'Times New Roman'].map(font => (
                          <CommandItem
                            key={font}
                            value={font}
                            onSelect={(val) => handleUpdate('fontFamily', val)}
                            className="flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-ivory"
                          >
                            <span className="text-sm text-midnight" style={{ fontFamily: fontStack(font) }}>{font}</span>
                            {selectedElement.fontFamily === font && <Check className="h-4 w-4" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                    <div className="p-2 border-t">
                      <button className="w-full rounded-lg border border-border bg-ivory-50 text-xs font-semibold p-2 flex items-center justify-center gap-2 hover:bg-ivory transition-colors text-midnight">
                        <span>Yazı tipi yükle</span>
                        <span className="px-1.5 py-0.5 bg-yellow-200 text-yellow-800 rounded-sm text-[8px] uppercase tracking-widest">Pro</span>
                      </button>
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-muted-foreground">Punto (Boyut)</Label>
                <Input
                  type="number"
                  value={Math.round(selectedElement.fontSize || 16)}
                  onChange={e => handleUpdate('fontSize', parseFloat(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-muted-foreground">Hizalama</Label>
                <ToggleGroup
                  type="single"
                  value={selectedElement.align || 'center'}
                  onValueChange={(val) => { if (val) handleUpdate('align', val) }}
                  className="justify-start gap-1"
                >
                  <ToggleGroupItem value="left" aria-label="Sola Hizala" className="h-9 w-9 px-0 data-[state=on]:bg-midnight/10 border border-transparent data-[state=on]:border-border">
                    <AlignLeft className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="center" aria-label="Ortala" className="h-9 w-9 px-0 data-[state=on]:bg-midnight/10 border border-transparent data-[state=on]:border-border">
                    <AlignCenter className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="right" aria-label="Sağa Hizala" className="h-9 w-9 px-0 data-[state=on]:bg-midnight/10 border border-transparent data-[state=on]:border-border">
                    <AlignRight className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1">
              <button onClick={() => handleUpdate('fontWeight', selectedElement.fontWeight === 700 ? 400 : 700)} className={`h-9 rounded-lg border text-sm font-bold ${selectedElement.fontWeight === 700 ? 'bg-midnight text-white border-midnight' : 'bg-white border-border'}`} title="Kalın">B</button>
              <button onClick={() => handleUpdate('fontStyle', selectedElement.fontStyle === 'italic' ? 'normal' : 'italic')} className={`h-9 rounded-lg border text-sm italic ${selectedElement.fontStyle === 'italic' ? 'bg-midnight text-white border-midnight' : 'bg-white border-border'}`} title="İtalik">I</button>
              <button onClick={() => handleUpdate('textDecoration', selectedElement.textDecoration === 'underline' ? '' : 'underline')} className={`h-9 rounded-lg border text-sm underline ${selectedElement.textDecoration === 'underline' ? 'bg-midnight text-white border-midnight' : 'bg-white border-border'}`} title="Altı çizili">U</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-muted-foreground">Satır Aralığı</Label>
                <Input type="number" step="0.05" min="0.7" max="3" value={selectedElement.lineHeight || 1.1} onChange={e => handleUpdate('lineHeight', parseFloat(e.target.value))} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-muted-foreground">Harf Aralığı</Label>
                <Input type="number" step="0.5" min="-10" max="30" value={selectedElement.letterSpacing || 0} onChange={e => handleUpdate('letterSpacing', parseFloat(e.target.value))} className="h-9 text-xs" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-muted-foreground flex justify-between items-center">
                <span>Yazı Rengi</span>
                <div
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: selectedElement.fill || '#000' }}
                />
              </Label>
              <div className="flex items-center gap-2">
                <DebouncedColorPicker
                  value={selectedElement.fill || '#000000'}
                  onChange={val => handleUpdate('fill', val)}
                  className="w-10 h-10 rounded cursor-pointer border-none p-0 outline-none"
                />
                <Input
                  type="text"
                  value={selectedElement.fill || '#000000'}
                  onChange={e => handleUpdate('fill', e.target.value)}
                  className="h-10 text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <Label className="text-[10px] uppercase text-muted-foreground">Metin İçeriği</Label>
              <Textarea
                value={selectedElement.text || ''}
                onChange={e => handleUpdate('text', e.target.value)}
                className="min-h-[80px] text-sm resize-none focus-visible:ring-midnight/30"
              />
            </div>
          </div>
        )}

        {(selectedElement.type === 'rect' || selectedElement.type === 'circle') && (
          <div className="space-y-4 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-midnight mb-1">
              <Palette className="w-3.5 h-3.5" />
              <h4 className="text-xs font-semibold uppercase tracking-wider">Şekil Renkleri</h4>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-muted-foreground flex justify-between items-center">
                <span>Dolgu Rengi</span>
                <div
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: selectedElement.fill || '#000' }}
                />
              </Label>
              <div className="flex items-center gap-2">
                <DebouncedColorPicker
                  value={selectedElement.fill || '#e9e4d9'}
                  onChange={val => handleUpdate('fill', val)}
                  className="w-10 h-10 rounded cursor-pointer border-none p-0 outline-none"
                />
                <Input
                  type="text"
                  value={selectedElement.fill || '#e9e4d9'}
                  onChange={e => handleUpdate('fill', e.target.value)}
                  className="h-10 text-xs font-mono uppercase"
                />
              </div>
            </div>

            {selectedElement.type === 'rect' && (
              <div className="space-y-1.5 mt-4">
                <Label className="text-[10px] flex justify-between uppercase text-muted-foreground">
                  <span>Köşe Ovallığı (Border Radius)</span>
                  <span>{selectedElement.cornerRadius || 0}px</span>
                </Label>
                <input
                  type="range" min="0" max="100"
                  value={selectedElement.cornerRadius || 0}
                  onChange={e => handleUpdate('cornerRadius', parseFloat(e.target.value))}
                  className="w-full accent-midnight"
                />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
