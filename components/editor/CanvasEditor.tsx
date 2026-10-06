'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { LeftSidebar } from './LeftSidebar'
import { RightSidebar } from './RightSidebar'
import { EditorToolbar } from './EditorToolbar'

// Stage needs to be CSR only because Konva uses document/window
const CanvasStage = dynamic(() => import('./CanvasStage'), { ssr: false })

export function CanvasEditor() {
  return (
    <div className="flex flex-col w-full h-full bg-ivory rounded-xl border border-border overflow-hidden">
      <EditorToolbar />
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
