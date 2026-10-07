'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/store/editor-store'

// Load Stage dynamically since Konva uses window
const CanvasStage = dynamic(() => import('@/components/editor/CanvasStage'), { ssr: false })

export function DavetiyeCanvasPreview({ project }) {
  const { setDesign, design } = useEditorStore()
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (project?.canvas_design) {
      setDesign(project.canvas_design)
    }
  }, [project, setDesign])

  const handleDownload = () => {
    if (!wrapperRef.current) return
    const canvas = wrapperRef.current.querySelector('.konvajs-content canvas')
    if (!canvas) return
    const dataURL = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataURL
    a.download = `${project?.slug || 'davetiye-karti'}.png`
    a.click()
  }

  if (!project?.canvas_design) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Henüz bir kart tasarımı kaydedilmemiş.
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center bg-[#e9e4d9] p-4 sm:p-6 w-full">
      <div className="flex w-full items-center justify-between mb-4 px-2">
        <div>
          <h2 className="font-serif text-xl text-midnight">Davetiye Kartı</h2>
          <p className="text-xs text-muted-foreground mt-1">Önizleme ve indirme seçenekleri</p>
        </div>
        <Button onClick={handleDownload} size="sm" className="h-9 rounded-full bg-midnight px-4 text-[10px] uppercase tracking-[0.14em] text-ivory hover:bg-midnight/90">
          <Download className="mr-1.5 h-3.5 w-3.5" /> PNG indir
        </Button>
      </div>
      
      {/* Container that maintains aspect ratio and fits the modal. */}
      <div 
        ref={wrapperRef}
        className="w-full relative rounded-lg overflow-hidden border-4 border-midnight bg-ivory shadow-lg pointer-events-none"
        style={{ 
          // Match standard canvas ratio roughly (e.g. 1080x1560 -> ~0.692)
          aspectRatio: `${design.width} / ${design.height}`,
          maxHeight: '70vh'
        }}
      >
        <CanvasStage />
      </div>
    </div>
  )
}
