'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { LeftSidebar } from './LeftSidebar'
import { RightSidebar } from './RightSidebar'
import { EditorToolbar } from './EditorToolbar'
import { FloatingToolBar } from './FloatingToolBar'
import { CanvasContextToolbar } from './CanvasContextToolbar'

// Stage needs to be CSR only because Konva uses document/window
const CanvasStage = dynamic(() => import('./CanvasStage'), { ssr: false })

export function CanvasEditor({ topbarLeft, topbarRight }: { topbarLeft?: React.ReactNode, topbarRight?: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-b border-border bg-ivory">
      <EditorToolbar topbarLeft={topbarLeft} topbarRight={topbarRight} />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="relative min-h-0 min-w-0 flex-1 bg-white">
          <CanvasStage />
          <div className="pointer-events-none absolute left-1/2 top-2 z-30 w-max max-w-[calc(100%-24px)] -translate-x-1/2">
            <CanvasContextToolbar />
          </div>
          <FloatingToolBar />
        </div>
        <RightSidebar />
      </div>
    </div>
  )
}
