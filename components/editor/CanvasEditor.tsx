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
import { PanelLeft, SlidersHorizontal, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

// Stage needs to be CSR only because Konva uses document/window
const CanvasStage = dynamic(() => import('./CanvasStage'), { ssr: false })

export function CanvasEditor({ topbarLeft, topbarRight, projectId, eventData }: { topbarLeft?: React.ReactNode, topbarRight?: React.ReactNode, projectId?: string | null, eventData?: Record<string, any> }) {
  const [stage, setStage] = useState<KonvaStage | null>(null)
  const [mobilePanel, setMobilePanel] = useState<'tools' | 'properties' | null>(null)
  const [drawingOpen, setDrawingOpen] = useState(false)
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
          <LeftSidebar eventData={eventData} />
        </ResizableSidebar>}
        <div className="relative min-h-0 min-w-0 flex-1 bg-white">
          {compactLayout && (
            <div className="absolute inset-x-2.5 top-2 z-30 flex items-center justify-between gap-1 rounded-2xl border border-midnight/10 bg-white/95 p-1 shadow-[0_4px_16px_rgba(15,23,42,0.08)] backdrop-blur-md">
              <Button
                type="button"
                variant={mobilePanel === 'tools' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setMobilePanel('tools')}
                className="flex-1 h-8 rounded-xl px-2 text-[11px] font-medium text-midnight hover:bg-champagne/20"
              >
                <PanelLeft className="mr-1.5 h-3.5 w-3.5 text-champagne-dark shrink-0" />
                <span className="truncate">Şablon & Ögeler</span>
              </Button>

              <div className="h-4 w-px bg-border shrink-0" />

              <Button
                type="button"
                variant={drawingOpen ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDrawingOpen(prev => !prev)}
                className={cn(
                  'flex-1 h-8 rounded-xl px-2 text-[11px] font-medium transition-all',
                  drawingOpen ? 'bg-midnight text-white shadow-sm' : 'text-midnight hover:bg-champagne/20'
                )}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5 text-champagne shrink-0" />
                <span className="truncate">Çizim Araçları</span>
              </Button>

              <div className="h-4 w-px bg-border shrink-0" />

              <Button
                type="button"
                variant={mobilePanel === 'properties' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setMobilePanel('properties')}
                className="flex-1 h-8 rounded-xl px-2 text-[11px] font-medium text-midnight hover:bg-champagne/20"
              >
                <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-champagne-dark shrink-0" />
                <span className="truncate">Özellikler</span>
              </Button>
            </div>
          )}

          <CanvasStage onStageChange={setStage} />

          {/* Context Toolbar: Placed at top below controls; wraps gracefully on mobile without horizontal scrolling */}
          <div
            className={cn(
              "pointer-events-none absolute z-30 -translate-x-1/2 transition-all duration-200",
              compactLayout
                ? "top-14 left-1/2 w-[calc(100%-1.25rem)] max-w-md"
                : "top-3 left-1/2 w-max max-w-[calc(100%-24px)]"
            )}
          >
            <CanvasContextToolbar />
          </div>

          {compactLayout ? (
            <FloatingToolBar
              isOpen={drawingOpen}
              onClose={() => setDrawingOpen(false)}
              showTrigger={false}
              className="absolute left-2.5 top-13 z-30 select-none animate-in fade-in slide-in-from-top-2 duration-200"
            />
          ) : (
            <FloatingToolBar />
          )}
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
          <div className="min-h-0 flex-1 overflow-y-auto">
            <LeftSidebar
              eventData={eventData}
              onSelectTemplate={() => setMobilePanel(null)}
              onItemSelect={() => setMobilePanel(null)}
            />
          </div>
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
