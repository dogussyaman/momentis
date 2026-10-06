'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text, Circle, Line } from 'react-konva'
import { useEditorStore } from '@/store/editor-store'
import { SelectionTransformer } from './SelectionTransformer'

export default function CanvasStage() {
  const { design, selectElement, clearSelection, updateElement, deleteElement, duplicateElement, arrangeElement, zoom } = useEditorStore()
  const stageRef = useRef<any>(null)
  const [stageSize, setStageSize] = useState({ width: 1000, height: 800 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, elementId: string | null }>({ visible: false, x: 0, y: 0, elementId: null })
  const [editingText, setEditingText] = useState<{
    id: string, text: string, x: number, y: number, width: number, height: number, fontSize: number, fontFamily: string, fill: string, align: string, rotation: number
  } | null>(null)
  
  const verticalGuideRef = useRef<any>(null)
  const horizontalGuideRef = useRef<any>(null)

  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }))
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        })
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background'
    if (clickedOnEmpty) {
      clearSelection()
    }
  }

  const handleDragMove = (e: any, element: any) => {
    const node = e.target
    const SNAP_TOLERANCE = 10

    const isCentered = element.centered

    // Node bounds
    const width = node.width() * node.scaleX()
    const height = node.height() * node.scaleY()
    const x = node.x()
    const y = node.y()
    
    const nodeCenterX = isCentered ? x : x + width / 2
    const nodeCenterY = isCentered ? y : y + height / 2

    const canvasCenterX = design.width / 2
    const canvasCenterY = design.height / 2

    let snappedX = x
    let snappedY = y
    
    let showV = false
    let showH = false

    // Snap Vertical (X axis)
    if (Math.abs(nodeCenterX - canvasCenterX) < SNAP_TOLERANCE) {
      snappedX = isCentered ? canvasCenterX : canvasCenterX - width / 2
      showV = true
      if (verticalGuideRef.current) {
         verticalGuideRef.current.points([canvasCenterX, 0, canvasCenterX, design.height])
         verticalGuideRef.current.visible(true)
      }
    } else {
      if (verticalGuideRef.current) verticalGuideRef.current.visible(false)
    }

    // Snap Horizontal (Y axis)
    if (Math.abs(nodeCenterY - canvasCenterY) < SNAP_TOLERANCE) {
      snappedY = isCentered ? canvasCenterY : canvasCenterY - height / 2
      showH = true
      if (horizontalGuideRef.current) {
         horizontalGuideRef.current.points([0, canvasCenterY, design.width, canvasCenterY])
         horizontalGuideRef.current.visible(true)
      }
    } else {
      if (horizontalGuideRef.current) horizontalGuideRef.current.visible(false)
    }

    node.x(snappedX)
    node.y(snappedY)
  }

  const handleDragEnd = (e: any, id: string) => {
    if (verticalGuideRef.current) verticalGuideRef.current.visible(false)
    if (horizontalGuideRef.current) horizontalGuideRef.current.visible(false)
    updateElement(id, {
      x: e.target.x(),
      y: e.target.y()
    })
  }

  const handleTransformEnd = (e: any, id: string) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // reset scale
    node.scaleX(1)
    node.scaleY(1)

    updateElement(id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation()
    })
  }

  const handleContextMenu = (e: any) => {
    e.evt.preventDefault()
    const target = e.target
    const isBackground = target === target.getStage() || target.name() === 'background'
    
    if (!isBackground) {
      selectElement(target.id())
      let x = e.evt.clientX
      let y = e.evt.clientY
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        x -= rect.left
        y -= rect.top
      }
      // Keep menu within bounds somewhat
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        if (x + 200 > rect.width) x = rect.width - 200
        if (y + 250 > rect.height) y = Math.max(0, rect.height - 250)
      }
      setContextMenu({ visible: true, x, y, elementId: target.id() })
    } else {
      setContextMenu({ visible: false, x: 0, y: 0, elementId: null })
    }
  }

  // Calculate scaling so document fits within container with margin
  const margin = 60
  const scale = Math.min(
    (stageSize.width - margin * 2) / design.width,
    (stageSize.height - margin * 2) / design.height
  ) * zoom

  const stageX = stageSize.width / 2 - (design.width * scale) / 2
  const stageY = stageSize.height / 2 - (design.height * scale) / 2

  return (
    <div ref={containerRef} className="h-full w-full bg-[#f5f5f5] flex items-center justify-center overflow-hidden relative">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        pixelRatio={typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 2) : 2}
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
        onContextMenu={handleContextMenu}
      >
        <Layer x={stageX} y={stageY} scaleX={scale} scaleY={scale}>
          {/* Document Background */}
          <Rect
            x={0}
            y={0}
            width={design.width}
            height={design.height}
            fill={design.background}
            name="background"
            shadowColor="rgba(0,0,0,0.15)"
            shadowBlur={20}
            shadowOffset={{ x: 0, y: 10 }}
          />

          {design.elements.map((el) => {
            if (el.type === 'text') {
              return (
                <Text
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  rotation={el.rotation || 0}
                  text={el.text}
                  fontFamily={el.fontFamily}
                  fontSize={el.fontSize}
                  fill={el.fill}
                  align={el.align}
                  opacity={editingText?.id === el.id ? 0 : (el.opacity || 1)}
                  draggable
                  onClick={(e) => {
                    e.cancelBubble = true
                    selectElement(el.id)
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true
                    selectElement(el.id)
                  }}
                  onDblClick={(e) => {
                    e.cancelBubble = true
                    const textNode = e.target
                    const absPos = textNode.getAbsolutePosition()
                    setEditingText({
                      id: el.id,
                      text: el.text || '',
                      x: absPos.x,
                      y: absPos.y,
                      width: textNode.width() * textNode.getAbsoluteScale().x,
                      height: textNode.height() * textNode.getAbsoluteScale().y,
                      fontSize: (el.fontSize || 16) * textNode.getAbsoluteScale().y,
                      fontFamily: el.fontFamily || 'sans-serif',
                      fill: el.fill || '#000000',
                      align: el.align || 'left',
                      rotation: textNode.rotation()
                    })
                  }}
                  onDblTap={(e) => {
                    e.cancelBubble = true
                    const textNode = e.target
                    const absPos = textNode.getAbsolutePosition()
                    setEditingText({
                      id: el.id,
                      text: el.text || '',
                      x: absPos.x,
                      y: absPos.y,
                      width: textNode.width() * textNode.getAbsoluteScale().x,
                      height: textNode.height() * textNode.getAbsoluteScale().y,
                      fontSize: (el.fontSize || 16) * textNode.getAbsoluteScale().y,
                      fontFamily: el.fontFamily || 'sans-serif',
                      fill: el.fill || '#000000',
                      align: el.align || 'left',
                      rotation: textNode.rotation()
                    })
                  }}
                  onDragMove={(e) => handleDragMove(e, el)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                />
              )
            }
            if (el.type === 'rect') {
              return (
                <Rect
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  rotation={el.rotation || 0}
                  fill={el.fill}
                  opacity={el.opacity || 1}
                  draggable
                  onClick={(e) => {
                    e.cancelBubble = true
                    selectElement(el.id)
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true
                    selectElement(el.id)
                  }}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                />
              )
            }
            if (el.type === 'circle') {
              return (
                <Circle
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  radius={el.width / 2}
                  fill={el.fill}
                  opacity={el.opacity || 1}
                  draggable
                  onClick={(e) => {
                    e.cancelBubble = true
                    selectElement(el.id)
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true
                    selectElement(el.id)
                  }}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => {
                    const node = e.target
                    const scaleX = node.scaleX()
                    node.scaleX(1)
                    node.scaleY(1)
                    updateElement(el.id, {
                      x: node.x(),
                      y: node.y(),
                      width: Math.max(5, node.width() * scaleX),
                      height: Math.max(5, node.width() * scaleX) // Keep it a circle
                    })
                  }}
                />
              )
            }
            if (el.type === 'image') {
              return <CanvasImage 
                key={el.id} 
                element={el} 
                onDragMove={(e: any) => handleDragMove(e, el)}
                onDragEnd={(e: any) => handleDragEnd(e, el.id)}
              />
            }
            return null
          })}
          <SelectionTransformer />
          {/* Render Snapping Guides (Directly mutated via refs) */}
          <Line
            ref={verticalGuideRef}
            points={[0, 0, 0, 0]}
            stroke="#FF007F"
            strokeWidth={1.5 / scale}
            dash={[4 / scale, 4 / scale]}
            visible={false}
            listening={false}
          />
          <Line
            ref={horizontalGuideRef}
            points={[0, 0, 0, 0]}
            stroke="#FF007F"
            strokeWidth={1.5 / scale}
            dash={[4 / scale, 4 / scale]}
            visible={false}
            listening={false}
          />
        </Layer>
      </Stage>

      {editingText && (
        <textarea
          autoFocus
          value={editingText.text}
          onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
          onBlur={() => {
            updateElement(editingText.id, { text: editingText.text })
            setEditingText(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              updateElement(editingText.id, { text: editingText.text })
              setEditingText(null)
            }
          }}
          style={{
            position: 'absolute',
            top: editingText.y,
            left: editingText.x,
            width: Math.max(editingText.width, 100) + 20, // Some extra padding so it doesn't wrap abruptly
            height: editingText.height + 40,
            fontSize: `${editingText.fontSize}px`,
            fontFamily: editingText.fontFamily,
            color: editingText.fill,
            textAlign: editingText.align as any,
            transform: `rotate(${editingText.rotation}deg)`,
            transformOrigin: 'left top',
            background: 'transparent',
            border: '1px dashed #C9A96E',
            padding: 0,
            margin: 0,
            outline: 'none',
            resize: 'none',
            overflow: 'hidden',
            lineHeight: 1.1,
            zIndex: 100
          }}
        />
      )}

      {contextMenu.visible && contextMenu.elementId && (
        <div 
          className="absolute z-50 bg-white border border-border shadow-lg rounded-xl py-1.5 w-48 text-sm flex flex-col"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button onClick={() => arrangeElement(contextMenu.elementId!, 'front')} className="w-full text-left px-4 py-2 hover:bg-black/5 text-midnight">En Öne Getir</button>
          <button onClick={() => arrangeElement(contextMenu.elementId!, 'up')} className="w-full text-left px-4 py-2 hover:bg-black/5 text-midnight">Bir Üste Taşı</button>
          <button onClick={() => arrangeElement(contextMenu.elementId!, 'down')} className="w-full text-left px-4 py-2 hover:bg-black/5 text-midnight">Bir Alta Taşı</button>
          <button onClick={() => arrangeElement(contextMenu.elementId!, 'back')} className="w-full text-left px-4 py-2 hover:bg-black/5 text-midnight">En Arkaya Gönder</button>
          <div className="h-px bg-border my-1 w-full" />
          <button onClick={() => duplicateElement(contextMenu.elementId!)} className="w-full text-left px-4 py-2 hover:bg-black/5 text-midnight">Çoğalt</button>
          <div className="h-px bg-border my-1 w-full" />
          <button onClick={() => deleteElement(contextMenu.elementId!)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-medium">Sil</button>
        </div>
      )}
    </div>
  )
}

function CanvasImage({ element, onDragMove, onDragEnd }: { element: any, onDragMove: any, onDragEnd: any }) {
  const { selectElement, updateElement } = useEditorStore()
  const [image] = React.useMemo(() => {
    if (typeof window === 'undefined') return [null]
    const img = new window.Image()
    img.src = element.src
    img.crossOrigin = 'Anonymous'
    return [img]
  }, [element.src])

  const [loaded, setLoaded] = useState(false)
  
  useEffect(() => {
    if (image) {
      image.onload = () => setLoaded(true)
    }
  }, [image])

  // Need a generic Image component, we can import from react-konva if not already
  const { Image: KonvaImage } = require('react-konva')
  
  const width = element.width || (image ? image.width : 100)
  const height = element.height || (image ? image.height : 100)
  
  if (!loaded || !image) return null;

  return (
    <KonvaImage
      id={element.id}
      image={image}
      x={element.x}
      y={element.y}
      offsetX={element.centered ? width / 2 : 0}
      offsetY={element.centered ? height / 2 : 0}
      width={width}
      height={height}
      rotation={element.rotation || 0}
      opacity={element.opacity || 1}
      draggable
      onClick={(e: any) => {
        e.cancelBubble = true
        selectElement(element.id)
      }}
      onTap={(e: any) => {
        e.cancelBubble = true
        selectElement(element.id)
      }}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTransformEnd={(e: any) => {
        const node = e.target
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        node.scaleX(1)
        node.scaleY(1)
        updateElement(element.id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: node.rotation()
        })
      }}
    />
  )
}

