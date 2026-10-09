import React from 'react'
import { ZoomIn, ZoomOut, Maximize, Undo2, Redo2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/store/editor-store'
import { toast } from 'sonner'

export function EditorToolbar({ topbarLeft, topbarRight, projectId }: { topbarLeft?: React.ReactNode, topbarRight?: React.ReactNode, projectId?: string | null }) {
  const { zoom, setZoom, design } = useEditorStore()

  const handleDownload = async () => {
    // Find the Konva canvas wrapper
    const canvas = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement
    if (!canvas) { toast.error('Davetiye dışa aktarılamadı'); return }
    if (!projectId) { toast.error('Dışa aktarmadan önce etkinliği kaydedin'); return }
    let dataURL: string
    try {
      dataURL = canvas.toDataURL('image/png')
    } catch {
      toast.error('Davetiye görseli oluşturulamadı')
      return
    }
    try {
      const response = await fetch(`/api/projects/${projectId}/exports`, {
        method: 'POST',
        headers: { 'Idempotency-Key': window.crypto.randomUUID() },
        credentials: 'include',
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Dışa aktarma hakkı kullanılamıyor')
      const a = document.createElement('a')
      a.href = dataURL
      a.download = 'davetiye.png'
      a.click()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Davetiye indirilemedi')
    }
  }
  
  return (
    <div className="z-20 flex min-h-14 min-w-0 max-w-full shrink-0 items-center justify-between gap-3 overflow-hidden border-b border-border bg-white px-3 shadow-sm sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
        {topbarLeft && (
          <>
            <div className="shrink-0 pl-8">{topbarLeft}</div>
            <div className="w-px h-5 bg-border mx-2" />
          </>
        )}
        <Button variant="ghost" size="icon" title="Geri al (Ctrl+Z)" aria-label="Geri al" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => (useEditorStore as any).temporal.getState().undo()}><Undo2 className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" title="Yinele (Ctrl+Y)" aria-label="Yinele" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => (useEditorStore as any).temporal.getState().redo()}><Redo2 className="w-4 h-4" /></Button>
        <div className="w-px h-4 bg-border mx-2" />
        
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
        <Button variant="outline" size="sm" className="h-8 px-3 text-[11px]" onClick={handleDownload} disabled={!projectId}>
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
