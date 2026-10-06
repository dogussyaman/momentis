'use client'

import React, { useEffect, useRef } from 'react'
import { Transformer } from 'react-konva'
import { useEditorStore } from '@/store/editor-store'

export function SelectionTransformer() {
  const { selectedIds } = useEditorStore()
  const trRef = useRef<any>(null)

  useEffect(() => {
    if (selectedIds.length > 0 && trRef.current) {
      // we need to attach transformer manually
      const stage = trRef.current.getStage()
      if (stage) {
        const selectedNodes = selectedIds.map((id: string) => stage.findOne(`#${id}`)).filter(Boolean)
        trRef.current.nodes(selectedNodes)
        trRef.current.getLayer().batchDraw()
      }
    } else if (trRef.current) {
      trRef.current.nodes([])
    }
  }, [selectedIds])

  return (
    <Transformer
      ref={trRef}
      boundBoxFunc={(oldBox, newBox) => {
        // limit resize
        if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
          return oldBox
        }
        return newBox
      }}
      padding={5}
      anchorSize={8}
      anchorCornerRadius={4}
      borderStroke="#0A42E8"
      anchorStroke="#0A42E8"
      anchorFill="#FFFFFF"
      borderStrokeWidth={1.5}
      anchorStrokeWidth={1.5}
    />
  )
}
