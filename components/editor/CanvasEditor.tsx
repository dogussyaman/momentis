'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import type { Stage as KonvaStage } from 'konva/lib/Stage'
import { LeftSidebar } from './LeftSidebar'
import { RightSidebar } from './RightSidebar'
import { EditorToolbar } from './EditorToolbar'
import { FloatingToolBar } from './FloatingToolBar'
import { CanvasContextToolbar } from './CanvasContextToolbar'
import { ResizableSidebar } from '@/components/shared/ResizableSidebar'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { PanelLeft, SlidersHorizontal } from 'lucide-react'

// Stage needs to be CSR only because Konva uses document/window
const CanvasStage = dynamic(() => import('./CanvasStage'), { ssr: false })

export function CanvasEditor({ topbarLeft, topbarRight, projectId }: { topbarLeft?: React.ReactNode, topbarRight?: React.ReactNode, projectId?: string | null }) {
  const [stage, setStage] = useState<KonvaStage | null>(null)
  const [mobilePanel, setMobilePanel] = useState<'tools' | 'properties' | null>(null)
  const [compactLayout, setCompactLayout] = useState(false)

  React.useEffect(() => {
    const query = window.matchMedia('(max-width: 1279px)')
    const updateLayout = () => setCompactLayout(query.matches)
    updateLayout()
    query.addEventListener('change', updateLayout)
    return () => query.removeEventListener('change', updateLayout)
  }, [])

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-b border-border bg-ivory">
      <EditorToolbar topbarLeft={topbarLeft} topbarRight={topbarRight} projectId={projectId} stage={stage} />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {!compactLayout && <ResizableSidebar id="invitation-left" label="Davetiye araç paneli" side="left" initialWidth={340} minWidth={260} maxWidth={520} className="border-r border-border bg-white shadow-[2px_0_18px_-16px_rgba(16,24,39,0.35)]">
          <LeftSidebar />
        </ResizableSidebar>}
        <div className="relative min-h-0 min-w-0 flex-1 bg-white">
          {compactLayout && <div className="absolute inset-x-2 top-2 z-30 flex items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setMobilePanel('tools')} className="h-9 rounded-full bg-white/95 px-3 text-xs shadow-sm">
              <PanelLeft className="mr-2 h-4 w-4" /> Tasarım araçları
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setMobilePanel('properties')} className="h-9 rounded-full bg-white/95 px-3 text-xs shadow-sm">
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Özellikler
            </Button>
          </div>}
          <CanvasStage onStageChange={setStage} />
          <div className="pointer-events-none absolute left-1/2 top-2 z-30 w-max max-w-[calc(100%-24px)] -translate-x-1/2">
            <CanvasContextToolbar />
          </div>
          <FloatingToolBar />
        </div>
        {!compactLayout && <ResizableSidebar id="invitation-right" label="Davetiye özellik paneli" side="right" initialWidth={300} minWidth={240} maxWidth={480} className="border-l border-border bg-white">
          <RightSidebar />
        </ResizableSidebar>}
      </div>
      {compactLayout && <>
      <Drawer open={mobilePanel === 'tools'} onOpenChange={(open) => setMobilePanel(open ? 'tools' : null)}>
        <DrawerContent className="h-[85dvh] max-h-[85dvh] rounded-t-3xl p-0">
          <DrawerHeader className="shrink-0 border-b px-5 py-3 text-left">
            <DrawerTitle className="font-serif text-lg">Davetiye araçları</DrawerTitle>
            <DrawerDescription>Şablon, metin, süsleme ve renkleri seçin.</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto"><LeftSidebar /></div>
        </DrawerContent>
      </Drawer>
      <Drawer open={mobilePanel === 'properties'} onOpenChange={(open) => setMobilePanel(open ? 'properties' : null)}>
        <DrawerContent className="h-[85dvh] max-h-[85dvh] rounded-t-3xl p-0">
          <DrawerHeader className="shrink-0 border-b px-5 py-3 text-left">
            <DrawerTitle className="font-serif text-lg">Davetiye özellikleri</DrawerTitle>
            <DrawerDescription>Seçili öğenin konumunu, boyutunu ve stilini düzenleyin.</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto"><RightSidebar /></div>
        </DrawerContent>
      </Drawer>
      </>}
    </div>
  )
}
