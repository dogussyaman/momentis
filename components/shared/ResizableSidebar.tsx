'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'

type ResizableSidebarProps = {
  id: string
  label: string
  side: 'left' | 'right'
  initialWidth: number
  minWidth?: number
  maxWidth?: number
  className?: string
  children: ReactNode
}

type DragState = { pointerId: number; startX: number; startWidth: number }

export function ResizableSidebar({
  id,
  label,
  side,
  initialWidth,
  minWidth = 240,
  maxWidth = 560,
  className = '',
  children,
}: ResizableSidebarProps) {
  const storageKey = `momentis-sidebar-width:${id}:v1`
  const [width, setWidth] = useState(initialWidth)
  const [ready, setReady] = useState(false)
  const dragRef = useRef<DragState | null>(null)

  const clamp = (value: number) => Math.max(minWidth, Math.min(maxWidth, value))

  useEffect(() => {
    const savedWidth = Number(window.localStorage.getItem(storageKey))
    if (Number.isFinite(savedWidth) && savedWidth > 0) setWidth(clamp(savedWidth))
    setReady(true)
  }, [storageKey, minWidth, maxWidth])

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKey, String(width))
  }, [ready, storageKey, width])

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startWidth: width }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const direction = side === 'left' ? 1 : -1
    setWidth(clamp(drag.startWidth + (event.clientX - drag.startX) * direction))
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = side === 'left' ? 1 : -1
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const delta = event.key === 'ArrowRight' ? 16 : -16
      setWidth((current) => clamp(current + delta * direction))
      event.preventDefault()
    } else if (event.key === 'Home') {
      setWidth(minWidth)
      event.preventDefault()
    } else if (event.key === 'End') {
      setWidth(maxWidth)
      event.preventDefault()
    }
  }

  return (
    <div
      className={`relative flex h-full min-h-0 min-w-0 shrink-0 ${className}`}
      style={{ width, flexBasis: width }}
    >
      {children}
      <div
        role="separator"
        aria-label={`${label} genişliğini ayarla`}
        aria-orientation="vertical"
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
        aria-valuenow={Math.round(width)}
        tabIndex={0}
        title="Sürükleyerek genişliği ayarla · çift tıklayarak varsayılana dön"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        onDoubleClick={() => setWidth(initialWidth)}
        className={`group absolute inset-y-0 z-30 flex w-2 cursor-col-resize touch-none items-center justify-center outline-none ${side === 'left' ? '-right-1' : '-left-1'}`}
      >
        <span className="h-10 w-1 rounded-full bg-transparent transition-colors group-hover:bg-champagne group-focus-visible:bg-champagne group-active:bg-champagne" />
      </div>
    </div>
  )
}
