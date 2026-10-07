import React from 'react'
import { ZoomIn, ZoomOut, Maximize, Undo2, Redo2, Eye, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useEditorStore } from '@/store/editor-store'
import { EDITOR_FONTS, fontStack } from '@/lib/editor-fonts'

function DebouncedColorPicker({ value, onChange, className, title }: { value: string, onChange: (v: string) => void, className?: string, title?: string }) {
  const [color, setColor] = React.useState(value);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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

  return <input type="color" value={color} onChange={handleChange} className={className} title={title} />;
}

export function EditorToolbar({ topbarLeft, topbarRight }: { topbarLeft?: React.ReactNode, topbarRight?: React.ReactNode }) {
  const { zoom, setZoom, selectedIds, design, updateElement, duplicateElement, deleteElement } = useEditorStore()
  
  const selectedElement = selectedIds.length === 1 ? design.elements.find(el => el.id === selectedIds[0]) : null

  const handleDownload = () => {
    // Find the Konva canvas wrapper
    const canvas = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement
    if (!canvas) return
    const dataURL = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataURL
    a.download = 'davetiye.png'
    a.click()
  }
  
  return (
    <div className="z-20 flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-white px-3 shadow-sm sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
        {topbarLeft && (
          <>
            {topbarLeft}
            <div className="w-px h-5 bg-border mx-2" />
          </>
        )}
        <Button variant="ghost" size="icon" title="Geri al (Ctrl+Z)" aria-label="Geri al" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => (useEditorStore as any).temporal.getState().undo()}><Undo2 className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" title="Yinele (Ctrl+Y)" aria-label="Yinele" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => (useEditorStore as any).temporal.getState().redo()}><Redo2 className="w-4 h-4" /></Button>
        <div className="w-px h-4 bg-border mx-2" />
        
        {/* Dynamic Context Toolbar */}
        {selectedElement?.type === 'text' && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-md border border-border bg-ivory-50 shadow-sm ml-4">
            
            <Select 
              value={selectedElement.fontFamily} 
              onValueChange={val => updateElement(selectedElement.id, { fontFamily: val })}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs border-transparent bg-transparent hover:bg-black/5 shadow-none">
                <SelectValue placeholder="Yazı Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Georgia" style={{ fontFamily: fontStack('Georgia') }}>Georgia</SelectItem>
                {EDITOR_FONTS.map(y => <SelectItem key={y.name} value={y.name} style={{ fontFamily: fontStack(y.name) }}>{y.name}</SelectItem>)}
                <SelectItem value="Arial" style={{ fontFamily: fontStack('Arial') }}>Arial</SelectItem>
                <SelectItem value="Times New Roman" style={{ fontFamily: fontStack('Times New Roman') }}>Times New Roman</SelectItem>
              </SelectContent>
            </Select>

            <div className="w-px h-4 bg-border mx-1" />
            
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-xs hover:bg-black/5" onClick={() => updateElement(selectedElement.id, { fontSize: Math.max(10, (selectedElement.fontSize || 16) - 2) })}>-</Button>
              <span className="text-xs w-6 text-center font-medium">{Math.round(selectedElement.fontSize || 16)}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-xs hover:bg-black/5" onClick={() => updateElement(selectedElement.id, { fontSize: (selectedElement.fontSize || 16) + 2 })}>+</Button>
            </div>

            <div className="flex items-center gap-0.5">
              <Button variant={selectedElement.fontWeight === 700 ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 700 ? 400 : 700 })}><Bold className="h-3.5 w-3.5" /></Button>
              <Button variant={selectedElement.fontStyle === 'italic' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic className="h-3.5 w-3.5" /></Button>
              <Button variant={selectedElement.textDecoration === 'underline' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => updateElement(selectedElement.id, { textDecoration: selectedElement.textDecoration === 'underline' ? '' : 'underline' })}><Underline className="h-3.5 w-3.5" /></Button>
            </div>

            <div className="w-px h-4 bg-border mx-1" />

            <div className="flex items-center gap-1.5 px-2">
               <DebouncedColorPicker 
                 value={selectedElement.fill || '#000000'}
                 onChange={val => updateElement(selectedElement.id, { fill: val })}
                 className="w-5 h-5 rounded cursor-pointer border-none p-0 outline-none"
                 title="Metin Rengi"
               />
            </div>

            <div className="w-px h-4 bg-border mx-1" />

            <ToggleGroup 
              type="single" 
              value={selectedElement.align || 'center'} 
              onValueChange={(val) => { if(val) updateElement(selectedElement.id, { align: val }) }}
            >
              <ToggleGroupItem value="left" aria-label="Sola Hizala" className="h-7 w-7 p-0 data-[state=on]:bg-midnight/10">
                <AlignLeft className="h-3.5 w-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" aria-label="Ortala" className="h-7 w-7 p-0 data-[state=on]:bg-midnight/10">
                <AlignCenter className="h-3.5 w-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Sağa Hizala" className="h-7 w-7 p-0 data-[state=on]:bg-midnight/10">
                <AlignRight className="h-3.5 w-3.5" />
              </ToggleGroupItem>
            </ToggleGroup>
            
          </div>
        )}

        {(selectedElement?.type === 'rect' || selectedElement?.type === 'circle' || selectedElement?.type === 'svg' || selectedElement?.type === 'icon') && (
           <div className="flex items-center gap-2 bg-ivory-50 px-2 py-1 rounded-md border border-border">
              <span className="text-xs font-medium text-muted-foreground mr-1">Renk:</span>
              <DebouncedColorPicker 
                value={selectedElement.fill || '#e9e4d9'}
                onChange={val => updateElement(selectedElement.id, { fill: val })}
                className="w-6 h-6 rounded cursor-pointer"
              />
           </div>
        )}
        {selectedIds.length > 0 && (
          <div className="ml-1 flex shrink-0 items-center gap-1 rounded-lg border border-border bg-white px-1">
            <span className="hidden px-2 text-[10px] text-muted-foreground sm:inline">
              {selectedIds.length > 1 ? `${selectedIds.length} öğe seçili` : 'Öğe seçili'}
            </span>
            {selectedIds.length === 1 && (
              <Button variant="ghost" size="icon" title="Çoğalt (Ctrl+D)" aria-label="Seçili öğeyi çoğalt" className="h-8 w-8" onClick={() => duplicateElement(selectedIds[0])}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" title="Sil (Delete)" aria-label="Seçili öğeleri sil" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => selectedIds.forEach(deleteElement)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border/70 bg-ivory-50/70 px-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
        <span className="w-12 text-center text-[11px] font-semibold tabular-nums">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setZoom(Math.min(3, zoom + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
        <div className="w-px h-4 bg-border mx-2" />
        <Button variant="ghost" size="icon" title="Tuvale sığdır" aria-label="Tuvale sığdır" className="h-8 w-8 text-muted-foreground" onClick={() => setZoom(1)}><Maximize className="w-4 h-4" /></Button>
      </div>
      
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden text-[10px] text-muted-foreground xl:inline">{design.width} × {design.height} px</span>
        <Button variant="outline" size="sm" className="h-8 px-3 text-[11px]" onClick={handleDownload}>
          İndir (PNG)
        </Button>
        <Button variant="default" size="sm" className="h-8 bg-midnight px-3 text-[11px] text-ivory hover:bg-midnight/90">
          <Eye className="w-3.5 h-3.5 mr-1.5" /> Önizleme
        </Button>
        {topbarRight && (
          <>
            <div className="w-px h-5 bg-border mx-2" />
            {topbarRight}
          </>
        )}
      </div>
    </div>
  )
}
