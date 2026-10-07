'use client'

import { Minus, MousePointer2, Pencil, Square, StickyNote, Table2, Type } from 'lucide-react'
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

export function FloatingToolBar() {
  const activeTool = useEditorStore(state => state.activeTool)
  const setActiveTool = useEditorStore(state => state.setActiveTool)
  const toolColor = useEditorStore(state => state.toolColor)
  const setToolColor = useEditorStore(state => state.setToolColor)

  return (
    <div
      aria-label="Tuval araçları"
      className="sb-no-scrollbar absolute left-3 top-1/2 z-30 flex max-h-[calc(100%-24px)] -translate-y-1/2 flex-col items-center gap-1.5 overflow-x-hidden overflow-y-auto rounded-2xl border border-[#E8E1D5] bg-white p-2.5 shadow-[0_12px_32px_-12px_rgba(16,24,39,0.35)]"
      role="toolbar"
    >
      {tools.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={activeTool === id}
          onClick={() => setActiveTool(id)}
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
            activeTool === id
              ? 'bg-midnight text-white shadow-md'
              : 'text-midnight/70 hover:bg-[#F5F1E9] hover:text-midnight'
          }`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </button>
      ))}
      <div aria-hidden className="my-1 h-px w-7 shrink-0 bg-border" />
      <span className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">Renk</span>
      {colors.map(color => (
        <button
          key={color.value}
          type="button"
          title={`${color.label} çizgi rengi`}
          aria-label={`${color.label} çizgi rengi`}
          aria-pressed={toolColor === color.value}
          onClick={() => setToolColor(color.value)}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
            toolColor === color.value ? 'ring-2 ring-midnight ring-offset-2' : 'hover:ring-1 hover:ring-midnight/25'
          }`}
        >
          <span className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: color.value }} />
        </button>
      ))}
    </div>
  )
}
