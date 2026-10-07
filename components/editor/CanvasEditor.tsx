'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { LeftSidebar } from './LeftSidebar'
import { RightSidebar } from './RightSidebar'
import { EditorToolbar } from './EditorToolbar'

// Stage needs to be CSR only because Konva uses document/window
const CanvasStage = dynamic(() => import('./CanvasStage'), { ssr: false })

export function CanvasEditor({ topbarLeft, topbarRight }: { topbarLeft?: React.ReactNode, topbarRight?: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-b border-border bg-ivory">
      <EditorToolbar topbarLeft={topbarLeft} topbarRight={topbarRight} />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 relative bg-white">
          <CanvasStage />
        </div>
        <RightSidebar />
      </div>
    </div>
  )
}
