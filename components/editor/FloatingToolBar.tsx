'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Minus, MousePointer2, Pencil, Square, StickyNote, Table2, Type } from 'lucide-react'
import { EditorTool, useEditorStore } from '@/store/editor-store'

const tools: Array<{ id: EditorTool; label: string; icon: typeof MousePointer2 }> = [
  { id: 'select', label: 'Seçim', icon: MousePointer2 },
  { id: 'pen', label: 'Kalem', icon: Pencil },
  { id: 'line', label: 'Çizgi', icon: Minus },
  { id: 'rectangle', label: 'Dikdörtgen', icon: Square },
  { id: 'note', label: 'Yapışkan not', icon: StickyNote },
  { id: 'text', label: 'Metin', icon: Type },
  { id: 'table', label: 'Tablo', icon: Table2 },
]

const colors = [
  { value: '#1C2430', label: 'Lacivert' },
  { value: '#2563EB', label: 'Mavi' },
  { value: '#EF4444', label: 'Kırmızı' },
  { value: '#C9A96E', label: 'Altın' },
]

interface FloatingToolBarProps {
  isOpen?: boolean
  onClose?: () => void
  showTrigger?: boolean
  className?: string
}

export function FloatingToolBar({
  isOpen: controlledIsOpen,
  onClose,
  showTrigger = true,
  className,
}: FloatingToolBarProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof controlledIsOpen === 'boolean'
  const isOpen = isControlled ? controlledIsOpen : internalOpen

  const handleClose = () => {
    if (isControlled) {
      onClose?.()
    } else {
      setInternalOpen(false)
    }
  }

  const handleOpen = () => {
    if (!isControlled) {
      setInternalOpen(true)
    }
  }

  const activeTool = useEditorStore(state => state.activeTool)
  const setActiveTool = useEditorStore(state => state.setActiveTool)
  const toolColor = useEditorStore(state => state.toolColor)
  const setToolColor = useEditorStore(state => state.setToolColor)

  useEffect(() => {
    if (!isControlled && typeof window !== 'undefined' && window.innerWidth >= 1280) {
      setInternalOpen(true)
    }
  }, [isControlled])

  const currentToolObj = tools.find(t => t.id === activeTool) || tools[0]
  const ActiveIcon = currentToolObj.icon

  if (!isOpen && !showTrigger) {
    return null
  }

  return (
    <div className={className || "absolute left-2.5 sm:left-3 top-1/2 z-30 -translate-y-1/2 select-none"}>
      {!isOpen ? (
        <button
          type="button"
          onClick={handleOpen}
          title="Çizim ve düzenleme araçlarını aç"
          aria-label="Çizim ve düzenleme araçlarını aç"
          aria-expanded={false}
          className="group flex h-10 items-center gap-1.5 rounded-full border border-[#E8E1D5] bg-white/95 py-1.5 pl-2 pr-2.5 sm:pr-3 text-midnight shadow-[0_8px_24px_-8px_rgba(16,24,39,0.25)] backdrop-blur transition-all duration-200 hover:scale-105 hover:border-champagne hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midnight"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-midnight text-white transition-colors group-hover:bg-[#111827]">
            <ActiveIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-medium tracking-tight">Araçlar</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      ) : (
        <div
          aria-label="Tuval araçları"
          className="sb-no-scrollbar flex max-h-[calc(100dvh-120px)] flex-col items-center gap-1.5 overflow-x-hidden overflow-y-auto rounded-2xl border border-[#E8E1D5] bg-white/98 p-2 shadow-[0_16px_36px_-12px_rgba(16,24,39,0.35)] backdrop-blur transition-all duration-200 animate-in fade-in-0 zoom-in-95"
          role="toolbar"
        >
          <div className="flex w-full items-center justify-between gap-1 border-b border-border/80 px-1 pb-1.5">
            <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Pencil className="h-3 w-3 text-champagne-dark" />
              <span>Araçlar</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              title="Araç panelini kapat"
              aria-label="Araç panelini kapat"
              className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[#F5F1E9] hover:text-midnight"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          {tools.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={activeTool === id}
              onClick={() => setActiveTool(id)}
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                activeTool === id
                  ? 'bg-midnight text-white shadow-md'
                  : 'text-midnight/70 hover:bg-[#F5F1E9] hover:text-midnight'
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}

          <div aria-hidden className="my-0.5 h-px w-6 shrink-0 bg-border" />
          <span className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">Renk</span>
          {colors.map(color => (
            <button
              key={color.value}
              type="button"
              title={`${color.label} çizgi rengi`}
              aria-label={`${color.label} çizgi rengi`}
              aria-pressed={toolColor === color.value}
              onClick={() => setToolColor(color.value)}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                toolColor === color.value ? 'ring-2 ring-midnight ring-offset-2' : 'hover:ring-1 hover:ring-midnight/25'
              }`}
            >
              <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color.value }} />
            </button>
          ))}

          <button
            type="button"
            onClick={handleClose}
            title="Gizle"
            className="mt-1 flex w-full items-center justify-center rounded-lg border border-dashed border-border py-1 text-[8px] font-medium text-muted-foreground transition-colors hover:bg-[#F5F1E9] hover:text-midnight"
          >
            Gizle
          </button>
        </div>
      )}
    </div>
  )
}
