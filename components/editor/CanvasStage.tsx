'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Group, Rect, Text, Circle, Line } from 'react-konva'
import { useEditorStore } from '@/store/editor-store'
import { SelectionTransformer } from './SelectionTransformer'
import { fontStack } from '@/lib/editor-fonts'
import { SEMBOLLER, GRADYANLAR } from '@/lib/davetiye-svg'
import { applyPaletteToDesign } from '@/lib/themes/color-palettes'

export default function CanvasStage() {
  const { design, palettePreview, selectElement, clearSelection, updateElement, deleteElement, duplicateElement, arrangeElement, zoom, selectedIds, activeTool, toolColor } = useEditorStore()
  const displayDesign = palettePreview ? applyPaletteToDesign(design, palettePreview) : design
  const stageRef = useRef<any>(null)
  const [stageSize, setStageSize] = useState({ width: 1000, height: 800 })
  const containerRef = useRef<HTMLDivElement>(null)
  const drawingRef = useRef<any>(null)
  const [draftLine, setDraftLine] = useState<any>(null)
  const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, elementId: string | null }>({ visible: false, x: 0, y: 0, elementId: null })
  const [editingText, setEditingText] = useState<{
    id: string, text: string, x: number, y: number, width: number, height: number, fontSize: number, fontFamily: string, fontStyle: string, fontWeight: number, textDecoration: string, letterSpacing: number, lineHeight: number, fill: string, align: string, rotation: number
  } | null>(null)
  
  const verticalGuideRef = useRef<any>(null)
  const horizontalGuideRef = useRef<any>(null)

  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }))
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  // Keyboard shortcuts (Delete, Undo, Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if typing in an input, textarea, or editing a canvas text
      if (
        editingText || 
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable)
      ) return

      if (e.key === 'Escape') {
        clearSelection()
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          selectedIds.forEach((id: string) => deleteElement(id))
          clearSelection()
        }
      }

      // Undo (Ctrl+Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        // @ts-ignore
        useEditorStore.temporal.getState().undo()
      }
      
      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        // @ts-ignore
        useEditorStore.temporal.getState().redo()
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedIds.length === 1) {
        e.preventDefault()
        duplicateElement(selectedIds[0])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds, editingText, deleteElement, duplicateElement, clearSelection])

  // Font loading mechanism for Canvas
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return
    
    let isMounted = true
    let needsRender = false

    const loadMissingFonts = async () => {
      const fontsToLoad = new Set<string>()
      design.elements.forEach((el) => {
        if (el.type === 'text' && el.fontFamily) {
          // Standard CSS font string format for document.fonts
          fontsToLoad.add(`16px "${el.fontFamily}"`)
        }
      })

      for (const font of Array.from(fontsToLoad)) {
        try {
          if (!document.fonts.check(font)) {
            await document.fonts.load(font)
            needsRender = true
          }
        } catch (e) {
          console.warn("Font yüklenemedi:", font, e)
        }
      }

      if (isMounted && needsRender) {
        // Trigger a tiny dummy state update to force Konva to re-render the canvas
        setStageSize(prev => ({ ...prev }))
      }
    }

    loadMissingFonts()
    
    return () => { isMounted = false }
  }, [design.elements])

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

  const getCanvasPoint = () => {
    const pointer = stageRef.current?.getPointerPosition()
    if (!pointer || !scale) return null
    const x = (pointer.x - stageX) / scale
    const y = (pointer.y - stageY) / scale
    if (x < 0 || y < 0 || x > design.width || y > design.height) return null
    return { x, y }
  }

  const addToolElement = (tool: string, x: number, y: number) => {
    const id = `tool_${Math.random().toString(36).slice(2, 10)}`
    let elements: any[] = []
    let selectedId = id

    if (tool === 'rectangle') {
      elements = [{
        id, type: 'rect', x, y, width: 220, height: 140,
        fill: toolColor, opacity: 0.22, stroke: toolColor, strokeWidth: 2, visible: true, locked: false
      }]
    } else if (tool === 'text') {
      elements = [{
        id, type: 'text', x, y, width: 420, height: 70, text: 'Metninizi buraya yazın',
        fontFamily: 'Playfair Display', fontSize: 42, fill: '#1C2430', align: 'left',
        opacity: 1, visible: true, locked: false
      }]
    } else if (tool === 'note') {
      const textId = `${id}_text`
      selectedId = textId
      elements = [
        {
          id, type: 'rect', x, y, width: 280, height: 190, fill: '#FEF08A',
          opacity: 1, visible: true, locked: false
        },
        {
          id: textId, type: 'text', x: x + 18, y: y + 18, width: 244, height: 154,
          text: 'Notunuzu yazın', fontFamily: 'Georgia', fontSize: 30,
          fill: '#3B3320', align: 'left', opacity: 1, visible: true, locked: false
        }
      ]
    } else if (tool === 'table') {
      const width = 360
      const height = 240
      const rows = 3
      const columns = 3
      elements = [{
        id, type: 'rect', x, y, width, height, fill: '#FFFFFF',
        opacity: 1, visible: true, locked: false
      }]
      for (let row = 1; row < rows; row += 1) {
        elements.push({
          id: `${id}_row_${row}`, type: 'line', x: 0, y: 0,
          points: [x, y + (height * row) / rows, x + width, y + (height * row) / rows],
          stroke: '#9CA3AF', strokeWidth: 2, opacity: 1, visible: true, locked: false
        })
      }
      for (let column = 1; column < columns; column += 1) {
        elements.push({
          id: `${id}_column_${column}`, type: 'line', x: 0, y: 0,
          points: [x + (width * column) / columns, y, x + (width * column) / columns, y + height],
          stroke: '#9CA3AF', strokeWidth: 2, opacity: 1, visible: true, locked: false
        })
      }
      elements.push({
        id: `${id}_border`, type: 'line', x: 0, y: 0,
        points: [x, y, x + width, y, x + width, y + height, x, y + height, x, y],
        stroke: '#9CA3AF', strokeWidth: 2, opacity: 1, visible: true, locked: false
      })
    }

    if (elements.length) {
      useEditorStore.setState(state => ({
        design: { ...state.design, elements: [...state.design.elements, ...elements] },
        selectedIds: [selectedId]
      }))
    }
  }

  const handleStagePointerDown = (e: any) => {
    if (activeTool === 'select') {
      checkDeselect(e)
      return
    }

    const point = getCanvasPoint()
    if (!point) return
    e.cancelBubble = true
    e.evt.preventDefault()

    if (activeTool === 'pen' || activeTool === 'line') {
      const line = {
        id: `draw_${Math.random().toString(36).slice(2, 10)}`,
        type: 'line',
        x: 0,
        y: 0,
        points: [point.x, point.y, point.x, point.y],
        stroke: toolColor,
        strokeWidth: activeTool === 'pen' ? 5 : 3,
        lineCap: 'round',
        lineJoin: 'round',
        tension: activeTool === 'pen' ? 0.35 : 0,
        opacity: 1,
        visible: true,
        locked: false,
      }
      drawingRef.current = line
      setDraftLine(line)
      clearSelection()
      return
    }

    addToolElement(activeTool, point.x, point.y)
  }

  const handleStagePointerMove = (e: any) => {
    const line = drawingRef.current
    if (!line) return
    const point = getCanvasPoint()
    if (!point) return
    line.points = activeTool === 'pen'
      ? [...line.points, point.x, point.y]
      : [line.points[0], line.points[1], point.x, point.y]
    setDraftLine({ ...line, points: [...line.points] })
    e.cancelBubble = true
  }

  const handleStagePointerUp = () => {
    const line = drawingRef.current
    if (!line) return
    drawingRef.current = null
    setDraftLine(null)
    if (line.points.length < 4 || (line.points[0] === line.points[2] && line.points[1] === line.points[3])) return
    useEditorStore.setState(state => ({
      design: { ...state.design, elements: [...state.design.elements, line] },
      selectedIds: [line.id]
    }))
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

    const element = design.elements.find((el: any) => el.id === id)

    if (element?.type === 'text') {
      updateElement(id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        fontSize: Math.max(8, (element.fontSize || 16) * scaleY),
        rotation: node.rotation()
      })
    } else {
      updateElement(id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation()
      })
    }
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

  const addSidebarElementAtPosition = React.useCallback((data: any, clientX: number, clientY: number) => {
    if (!containerRef.current || !scale) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(design.width, (clientX - rect.left - stageX) / scale))
    const y = Math.max(0, Math.min(design.height, (clientY - rect.top - stageY) / scale))

    if (data.kind === 'asset') {
      const asset = data.asset
      const assetScale = Math.min(1, 700 / Math.max(asset.width, asset.height))
      const width = Math.round(asset.width * assetScale)
      const height = Math.round(asset.height * assetScale)
      useEditorStore.setState(state => ({
        design: { ...state.design, elements: [...state.design.elements, {
          id: 'asset_' + Math.random().toString(36).slice(2, 10),
          type: 'image',
          src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(asset.svg),
          x: Math.max(width / 2, Math.min(state.design.width - width / 2, x)),
          y: Math.max(height / 2, Math.min(state.design.height - height / 2, y)),
          width, height, rotation: 0, opacity: 1, visible: true, locked: false,
          centered: true, assetId: asset.id, assetCategory: asset.category
        }] }
      }))
      return
    }

    if (data.kind === 'ornament') {
      const sembol = SEMBOLLER[data.key as keyof typeof SEMBOLLER]
      if (!sembol) return
      const width = sembol.varsayilanGenislik * 1.5
      const height = (sembol.h / sembol.w) * width
      const defs = GRADYANLAR
        .replace(/var\(--p1\)/g, '#d9a441')
        .replace(/var\(--p2\)/g, '#b8742a')
        .replace(/var\(--l1\)/g, '#5f9564')
        .replace(/var\(--l2\)/g, '#3f7a4f')
      const fullSvg = '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs>' + defs + '</defs>' + sembol.svg + '</svg>'
      const src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(fullSvg)))
      useEditorStore.setState(state => ({
        design: { ...state.design, elements: [...state.design.elements, {
          id: 'svg_' + Math.random().toString(36).slice(2, 10),
          type: 'image', src,
          x: Math.max(width / 2, Math.min(state.design.width - width / 2, x)),
          y: Math.max(height / 2, Math.min(state.design.height - height / 2, y)),
          width, height, rotation: 0, opacity: 1, visible: true, locked: false, centered: true
        }] }
      }))
      return
    }

    if (data.kind === 'shape') {
      const width = 150, height = 150
      useEditorStore.setState(state => ({
        design: { ...state.design, elements: [...state.design.elements, {
          id: 'shape_' + Math.random().toString(36).slice(2, 10),
          type: data.shapeType,
          x: Math.max(0, Math.min(state.design.width - width, x - width / 2)),
          y: Math.max(0, Math.min(state.design.height - height, y - height / 2)),
          width, height, fill: '#e9e4d9', rotation: 0, opacity: 1, visible: true, locked: false
        } as any] }
      }))
    }
  }, [design.width, design.height, stageX, stageY, scale])

  useEffect(() => {
    const handleSidebarDrop = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      const { clientX, clientY, ...data } = detail
      if (typeof clientX !== 'number' || typeof clientY !== 'number') return
      addSidebarElementAtPosition(data, clientX, clientY)
    }
    window.addEventListener('momentis-editor-sidebar-drop', handleSidebarDrop)
    return () => window.removeEventListener('momentis-editor-sidebar-drop', handleSidebarDrop)
  }, [addSidebarElementAtPosition])

  return (
    <div ref={containerRef} className="relative flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden bg-[#f5f5f5]" style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        pixelRatio={typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 2) : 2}
        onMouseDown={handleStagePointerDown}
        onTouchStart={handleStagePointerDown}
        onMouseMove={handleStagePointerMove}
        onTouchMove={handleStagePointerMove}
        onMouseUp={handleStagePointerUp}
        onTouchEnd={handleStagePointerUp}
        onContextMenu={handleContextMenu}
      >
        <Layer x={stageX} y={stageY} scaleX={scale} scaleY={scale}>
          <Rect
            x={0}
            y={0}
            width={design.width}
            height={design.height}
            fill={displayDesign.background}
            name="background"
            shadowColor="rgba(0,0,0,0.15)"
            shadowBlur={20}
            shadowOffset={{ x: 0, y: 10 }}
          />

          <Group clipX={0} clipY={0} clipWidth={design.width} clipHeight={design.height}>
            {displayDesign.elements.map((el: any) => {
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
                  fontFamily={fontStack(el.fontFamily)}
                  fontSize={el.fontSize}
                  fontStyle={`${el.fontStyle === 'italic' ? 'italic ' : ''}${el.fontWeight === 700 ? 'bold' : 'normal'}`.trim()}
                  textDecoration={el.textDecoration || ''}
                  letterSpacing={el.letterSpacing || 0}
                  lineHeight={el.lineHeight || 1.1}
                  fill={el.fill}
                  align={el.align}
                  opacity={editingText?.id === el.id ? 0 : (el.opacity || 1)}
                  draggable={activeTool === 'select' && !el.locked}
                  onClick={(e) => {
                    e.cancelBubble = true
                    if (activeTool === 'select') selectElement(el.id)
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true
                    if (activeTool === 'select') selectElement(el.id)
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
                      fontStyle: el.fontStyle || 'normal',
                      fontWeight: el.fontWeight || 400,
                      textDecoration: el.textDecoration || '',
                      letterSpacing: el.letterSpacing || 0,
                      lineHeight: el.lineHeight || 1.1,
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
                      fontStyle: el.fontStyle || 'normal',
                      fontWeight: el.fontWeight || 400,
                      textDecoration: el.textDecoration || '',
                      letterSpacing: el.letterSpacing || 0,
                      lineHeight: el.lineHeight || 1.1,
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
                  cornerRadius={el.cornerRadius || 0}
                  stroke={el.stroke}
                  strokeWidth={el.strokeWidth || 0}
                  draggable={activeTool === 'select' && !el.locked}
                  onClick={(e) => {
                    e.cancelBubble = true
                    if (activeTool === 'select') selectElement(el.id)
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true
                    if (activeTool === 'select') selectElement(el.id)
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
                  draggable={activeTool === 'select' && !el.locked}
                  onClick={(e) => {
                    e.cancelBubble = true
                    if (activeTool === 'select') selectElement(el.id)
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true
                    if (activeTool === 'select') selectElement(el.id)
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
                activeTool={activeTool}
                onDragMove={(e: any) => handleDragMove(e, el)}
                onDragEnd={(e: any) => handleDragEnd(e, el.id)}
              />
            }
            if (el.type === 'icon') {
              return <CanvasIcon 
                key={el.id} 
                element={el} 
                activeTool={activeTool}
                onDragMove={(e: any) => handleDragMove(e, el)}
                onDragEnd={(e: any) => handleDragEnd(e, el.id)}
              />
            }
            if (el.type === 'line') {
              return (
                <Line
                  key={el.id}
                  id={el.id}
                  x={el.x || 0}
                  y={el.y || 0}
                  points={el.points || []}
                  stroke={el.stroke || '#1C2430'}
                  strokeWidth={el.strokeWidth || 3}
                  lineCap={el.lineCap || 'round'}
                  lineJoin={el.lineJoin || 'round'}
                  tension={el.tension || 0}
                  opacity={el.opacity ?? 1}
                  draggable={activeTool === 'select' && !el.locked}
                  onClick={(e) => {
                    e.cancelBubble = true
                    if (activeTool === 'select') selectElement(el.id)
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true
                    if (activeTool === 'select') selectElement(el.id)
                  }}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                />
              )
            }
            return null
          })}
          {draftLine && (
            <Line
              points={draftLine.points}
              stroke={draftLine.stroke}
              strokeWidth={draftLine.strokeWidth}
              lineCap="round"
              lineJoin="round"
              tension={draftLine.tension}
              listening={false}
            />
          )}
          </Group>
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
            top: Math.max(0, Math.min(editingText.y, stageSize.height - 40)),
            left: Math.max(0, Math.min(editingText.x, stageSize.width - 100)),
            width: Math.max(100, Math.min(editingText.width + 20, stageSize.width - editingText.x - 8)),
            maxWidth: '100%',
            height: Math.max(40, Math.min(editingText.height + 40, stageSize.height - editingText.y - 8)),
            boxSizing: 'border-box',
            fontSize: `${editingText.fontSize}px`,
            fontFamily: fontStack(editingText.fontFamily),
            fontStyle: editingText.fontStyle,
            fontWeight: editingText.fontWeight,
            textDecoration: editingText.textDecoration,
            letterSpacing: editingText.letterSpacing,
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
            overflow: 'auto',
            overflowWrap: 'anywhere',
            lineHeight: editingText.lineHeight,
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
          <button onClick={() => {
            const el = design.elements.find((e: any) => e.id === contextMenu.elementId);
            if (el) updateElement(el.id, { locked: !el.locked });
            setContextMenu({ ...contextMenu, visible: false });
          }} className="w-full text-left px-4 py-2 hover:bg-black/5 text-midnight">
            {design.elements.find((e: any) => e.id === contextMenu.elementId)?.locked ? 'Kilidi Aç' : 'Ögeyi Sabitle'}
          </button>
          <div className="h-px bg-border my-1 w-full" />
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

function CanvasImage({ element, activeTool, onDragMove, onDragEnd }: { element: any, activeTool: string, onDragMove: any, onDragEnd: any }) {
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
      draggable={activeTool === 'select' && !element.locked}
      onClick={(e: any) => {
        e.cancelBubble = true
        if (activeTool === 'select') selectElement(element.id)
      }}
      onTap={(e: any) => {
        e.cancelBubble = true
        if (activeTool === 'select') selectElement(element.id)
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

function CanvasIcon({ element, activeTool, onDragMove, onDragEnd }: { element: any, activeTool: string, onDragMove: any, onDragEnd: any }) {
  const { selectElement, updateElement } = useEditorStore()
  const [image, setImage] = useState<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const img = new window.Image()
    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100" height="100" fill="none" stroke="${element.fill || '#3b2f27'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${element.svgContent}</svg>`
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(fullSvg)))}`
    img.crossOrigin = 'Anonymous'
    img.onload = () => setImage(img)
  }, [element.svgContent, element.fill])

  const { Image: KonvaImage } = require('react-konva')
  
  const width = element.width || 50
  const height = element.height || 50
  
  if (!image) return null;

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
      draggable={activeTool === 'select' && !element.locked}
      onClick={(e: any) => {
        e.cancelBubble = true
        if (activeTool === 'select') selectElement(element.id)
      }}
      onTap={(e: any) => {
        e.cancelBubble = true
        if (activeTool === 'select') selectElement(element.id)
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
