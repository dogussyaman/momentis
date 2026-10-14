'use client'

import React from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  Italic,
  Trash2,
  Underline,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useEditorStore } from '@/store/editor-store'
import { EDITOR_FONTS, fontStack } from '@/lib/editor-fonts'

function DebouncedColorPicker({
  value,
  onChange,
  className,
  title,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
  title?: string
}) {
  const [color, setColor] = React.useState(value)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    setColor(value)
  }, [value])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextColor = event.target.value
    setColor(nextColor)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => onChange(nextColor), 100)
  }

  return <input type="color" value={color} onChange={handleChange} className={className} title={title} />
}

export function CanvasContextToolbar() {
  const { selectedIds, design, updateElement, duplicateElement, deleteElement } = useEditorStore()
  const selectedElement = selectedIds.length === 1
    ? design.elements.find(element => element.id === selectedIds[0])
    : null

  if (!selectedIds.length) return null

  return (
    <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-between gap-1.5 rounded-2xl border border-[#E8E1D5] bg-white/95 p-1.5 shadow-[0_8px_24px_-10px_rgba(16,24,39,0.25)] backdrop-blur sm:gap-2 sm:p-2">
      {selectedElement?.type === 'text' && (
        <div className="flex flex-1 flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="flex items-center gap-1 shrink-0">
            <Select
              value={selectedElement.fontFamily || 'Georgia'}
              onValueChange={value => updateElement(selectedElement.id, { fontFamily: value })}
            >
              <SelectTrigger className="h-7 sm:h-8 w-[110px] sm:w-[130px] border-transparent bg-transparent text-xs shadow-none hover:bg-black/5 px-2">
                <SelectValue placeholder="Yazı tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Georgia" style={{ fontFamily: fontStack('Georgia') }}>Georgia</SelectItem>
                {EDITOR_FONTS.map(font => (
                  <SelectItem key={font.name} value={font.name} style={{ fontFamily: fontStack(font.name) }}>
                    {font.name}
                  </SelectItem>
                ))}
                <SelectItem value="Arial" style={{ fontFamily: fontStack('Arial') }}>Arial</SelectItem>
                <SelectItem value="Times New Roman" style={{ fontFamily: fontStack('Times New Roman') }}>Times New Roman</SelectItem>
              </SelectContent>
            </Select>

            <div className="h-4 w-px bg-border shrink-0" />
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Yazı boyutunu küçült"
                className="h-7 w-7"
                onClick={() => updateElement(selectedElement.id, { fontSize: Math.max(10, (selectedElement.fontSize || 16) - 2) })}
              >
                -
              </Button>
              <span className="w-6 text-center text-xs font-medium">{Math.round(selectedElement.fontSize || 16)}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Yazı boyutunu büyüt"
                className="h-7 w-7"
                onClick={() => updateElement(selectedElement.id, { fontSize: (selectedElement.fontSize || 16) + 2 })}
              >
                +
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-0.5">
              <Button
                variant={selectedElement.fontWeight === 700 ? 'secondary' : 'ghost'}
                size="icon"
                aria-label="Kalın"
                aria-pressed={selectedElement.fontWeight === 700}
                className="h-7 w-7"
                onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 700 ? 400 : 700 })}
              >
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={selectedElement.fontStyle === 'italic' ? 'secondary' : 'ghost'}
                size="icon"
                aria-label="İtalik"
                aria-pressed={selectedElement.fontStyle === 'italic'}
                className="h-7 w-7"
                onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
              >
                <Italic className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={selectedElement.textDecoration === 'underline' ? 'secondary' : 'ghost'}
                size="icon"
                aria-label="Altı çizili"
                aria-pressed={selectedElement.textDecoration === 'underline'}
                className="h-7 w-7"
                onClick={() => updateElement(selectedElement.id, { textDecoration: selectedElement.textDecoration === 'underline' ? '' : 'underline' })}
              >
                <Underline className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="h-4 w-px bg-border shrink-0" />
            <DebouncedColorPicker
              value={selectedElement.fill || '#000000'}
              onChange={value => updateElement(selectedElement.id, { fill: value })}
              className="h-6 w-6 cursor-pointer rounded border-0 p-0"
              title="Metin rengi"
            />
          </div>

          <div className="flex items-center shrink-0">
            <ToggleGroup
              type="single"
              value={selectedElement.align || 'center'}
              onValueChange={value => { if (value) updateElement(selectedElement.id, { align: value }) }}
              className="gap-0.5"
            >
              <ToggleGroupItem value="left" aria-label="Sola hizala" className="h-7 w-7 p-0 data-[state=on]:bg-midnight/10">
                <AlignLeft className="h-3.5 w-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Ortala" className="h-7 w-7 p-0 data-[state=on]:bg-midnight/10">
                <AlignCenter className="h-3.5 w-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Sağa hizala" className="h-7 w-7 p-0 data-[state=on]:bg-midnight/10">
                <AlignRight className="h-3.5 w-3.5" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      )}

      {selectedElement && ['rect', 'circle', 'svg', 'icon'].includes(selectedElement.type) && (
        <div className="flex items-center gap-2 rounded-md bg-ivory-50 px-2 py-1 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">Renk:</span>
          <DebouncedColorPicker
            value={selectedElement.fill || '#e9e4d9'}
            onChange={value => updateElement(selectedElement.id, { fill: value })}
            className="h-6 w-6 cursor-pointer rounded"
          />
        </div>
      )}

      <div className="flex items-center gap-1 shrink-0 ml-auto">
        {selectedIds.length > 1 && (
          <span className="shrink-0 px-1 text-[10px] text-muted-foreground">
            {selectedIds.length} öğe
          </span>
        )}
        {selectedIds.length === 1 && (
          <Button
            variant="ghost"
            size="icon"
            title="Çoğalt (Ctrl+D)"
            aria-label="Seçili öğeyi çoğalt"
            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
            onClick={() => duplicateElement(selectedIds[0])}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          title="Sil (Delete)"
          aria-label="Seçili öğeleri sil"
          className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => selectedIds.forEach(deleteElement)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
