import React from 'react'
import { ZoomIn, ZoomOut, Maximize, Undo2, Redo2, Eye, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useEditorStore } from '@/store/editor-store'
import { EDITOR_FONTS } from '@/lib/editor-fonts'

export function EditorToolbar() {
  const { zoom, setZoom, selectedIds, design, updateElement } = useEditorStore()
  
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
    <div className="h-12 border-b bg-white flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Undo2 className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Redo2 className="w-4 h-4" /></Button>
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
                <SelectItem value="Georgia">Georgia</SelectItem>
                {EDITOR_FONTS.map(y => <SelectItem key={y.name} value={y.name} style={{ fontFamily: y.name }}>{y.name}</SelectItem>)}
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
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
               <input 
                 type="color" 
                 value={selectedElement.fill || '#000000'}
                 onChange={e => updateElement(selectedElement.id, { fill: e.target.value })}
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

        {selectedElement?.type === 'rect' && (
           <div className="flex items-center gap-2 bg-ivory-50 px-2 py-1 rounded-md border border-border">
              <span className="text-xs font-medium text-muted-foreground mr-1">Renk:</span>
              <input 
                type="color" 
                value={selectedElement.fill || '#e9e4d9'}
                onChange={e => updateElement(selectedElement.id, { fill: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer"
              />
           </div>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
        <span className="text-xs w-12 text-center font-medium">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setZoom(Math.min(3, zoom + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
        <div className="w-px h-4 bg-border mx-2" />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setZoom(1)}><Maximize className="w-4 h-4" /></Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 px-4 text-xs" onClick={handleDownload}>
          İndir (PNG)
        </Button>
        <Button variant="default" size="sm" className="h-8 px-4 bg-midnight text-ivory text-xs hover:bg-midnight/90">
          <Eye className="w-3.5 h-3.5 mr-1.5" /> Önizleme
        </Button>
      </div>
    </div>
  )
}
