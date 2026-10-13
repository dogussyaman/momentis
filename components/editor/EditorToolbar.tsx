import React from 'react'
import { ZoomIn, ZoomOut, Maximize, Undo2, Redo2, Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/store/editor-store'
import { toast } from 'sonner'
import type { Stage as KonvaStage } from 'konva/lib/Stage'
import { getCanvasExportOptions } from '@/lib/editor/canvas-export'

export function EditorToolbar({ topbarLeft, topbarRight, projectId, stage }: { topbarLeft?: React.ReactNode, topbarRight?: React.ReactNode, projectId?: string | null, stage: KonvaStage | null }) {
  const { zoom, setZoom, design } = useEditorStore()

  const handleDownload = async () => {
    if (!projectId) { toast.error('Dışa aktarmadan önce etkinliği kaydedin'); return }
    const layer = stage?.getLayers()[0]
    if (!stage || !layer) { toast.error('Davetiye dışa aktarılamadı'); return }
    let dataURL: string
    const transformer = stage.findOne('Transformer')
    const transformerWasVisible = transformer?.visible() ?? false
    try {
      transformer?.visible(false)
      layer.batchDraw()
      dataURL = stage.toDataURL(getCanvasExportOptions(design, layer))
    } catch {
      toast.error('Davetiye görseli oluşturulamadı')
      return
    } finally {
      if (transformer) {
        transformer.visible(transformerWasVisible)
        layer.batchDraw()
      }
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
    <div className="z-20 flex min-h-14 min-w-0 w-full shrink-0 flex-wrap items-center gap-x-2 gap-y-1 overflow-hidden border-b border-border bg-white px-2 py-1 shadow-sm sm:justify-between sm:gap-3 sm:px-4 lg:flex-nowrap lg:py-0">
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
        {topbarLeft && (
          <>
            <div className="shrink-0">{topbarLeft}</div>
            <div className="mx-1 h-5 w-px shrink-0 bg-border sm:mx-2" />
          </>
        )}
        <Button variant="ghost" size="icon" title="Geri al (Ctrl+Z)" aria-label="Geri al" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => (useEditorStore as any).temporal.getState().undo()}><Undo2 className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" title="Yinele (Ctrl+Y)" aria-label="Yinele" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => (useEditorStore as any).temporal.getState().redo()}><Redo2 className="w-4 h-4" /></Button>
      </div>
      
      <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/70 bg-ivory-50/70 px-0.5 sm:gap-1 sm:px-1">
        <Button variant="ghost" size="icon" title="Uzaklaştır" aria-label="Uzaklaştır" className="h-8 w-8 text-muted-foreground" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
        <span className="w-9 text-center text-[10px] font-semibold tabular-nums sm:w-12 sm:text-[11px]">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" title="Yakınlaştır" aria-label="Yakınlaştır" className="h-8 w-8 text-muted-foreground" onClick={() => setZoom(Math.min(3, zoom + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
        <div className="mx-0.5 h-4 w-px bg-border sm:mx-1" />
        <Button variant="ghost" size="icon" title="Tuvale sığdır" aria-label="Tuvale sığdır" className="h-8 w-8 text-muted-foreground" onClick={() => setZoom(1)}><Maximize className="w-4 h-4" /></Button>
      </div>
      
      <div className="flex w-full shrink-0 items-center justify-end gap-1 sm:gap-2 lg:w-auto">
        <span className="hidden text-[10px] text-muted-foreground xl:inline">{design.width} × {design.height} px</span>
        <Button variant="outline" size="icon" title="PNG indir" aria-label="PNG indir" className="h-8 w-8 sm:hidden" onClick={handleDownload} disabled={!projectId}>
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="hidden h-8 px-3 text-[11px] sm:inline-flex" onClick={handleDownload} disabled={!projectId}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> PNG indir
        </Button>
        <Button variant="default" size="icon" title="Önizleme" aria-label="Önizleme" className="h-8 w-8 bg-midnight text-ivory hover:bg-midnight/90 sm:hidden">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="default" size="sm" className="hidden h-8 bg-midnight px-3 text-[11px] text-ivory hover:bg-midnight/90 sm:inline-flex">
          <Eye className="mr-1.5 h-3.5 w-3.5" /> Önizleme
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
