import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { temporal } from 'zundo'

export type ElementType = 'text' | 'image' | 'svg' | 'rect' | 'circle' | 'line' | 'group' | 'icon'
export type EditorTool = 'select' | 'pen' | 'line' | 'rectangle' | 'note' | 'text' | 'table'

export interface CanvasElement {
  id: string
  type: ElementType
  x: number
  y: number
  width?: number
  height?: number
  rotation?: number
  opacity?: number
  visible?: boolean
  locked?: boolean
  [key: string]: any // For text, fill, font properties, etc.
}

export interface CanvasDocument {
  id: string
  width: number
  height: number
  background: string
  elements: CanvasElement[]
  palette?: { id: string; name: string; colors: Record<string, string> }
}

type PalettePreview = {
  id: string
  name: string
  description: string
  category: 'Luxury' | 'Romantic' | 'Natural' | 'Modern' | 'Soft'
  colors: { primary: string; secondary: string; accent: string; background: string; foreground: string }
  custom?: boolean
}

interface EditorState {
  design: CanvasDocument
  palettePreview: PalettePreview | null
  selectedIds: string[]
  zoom: number // ratio, 1 = 100%
  activeTool: EditorTool
  toolColor: string
  toolStrokeWidth: number
  // Actions
  setActiveTool: (tool: EditorTool) => void
  setToolColor: (color: string) => void
  setToolStrokeWidth: (width: number) => void
  selectElement: (id: string | null) => void
  selectMultiple: (id: string) => void
  clearSelection: () => void
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
  deleteElement: (id: string) => void
  duplicateElement: (id: string) => void
  arrangeElement: (id: string, action: 'up' | 'down' | 'front' | 'back') => void
  setZoom: (zoom: number) => void
  setDesign: (design: CanvasDocument) => void
  resetDesign: () => void
  setPalettePreview: (palette: PalettePreview | null) => void
}

const initialDesign: CanvasDocument = {
  id: 'new_design',
  width: 1080,
  height: 1520, // Wedding Portrait preset
  background: '#FFFDF8',
  elements: [
    {
      id: 'text_1',
      type: 'text',
      x: 190,
      y: 350,
      width: 700,
      height: 100,
      rotation: 0,
      text: '{{coupleNames}}',
      fontFamily: 'Georgia, serif',
      fontSize: 72,
      fontWeight: 500,
      fill: '#1C2430',
      align: 'center',
      opacity: 1,
      visible: true,
      locked: false,
    },
    {
      id: 'rect_1',
      type: 'rect',
      x: 340,
      y: 500,
      width: 400,
      height: 200,
      rotation: 0,
      fill: '#C9A96E',
      opacity: 0.5,
      visible: true,
      locked: false,
    }
  ]
}

export const useEditorStore = create<EditorState>()(
  temporal(
    persist(
      (set) => ({
      design: initialDesign,
      palettePreview: null,
      selectedIds: [],
      zoom: 1,
      activeTool: 'select',
      toolColor: '#1C2430',
      toolStrokeWidth: 5,

      setActiveTool: (activeTool) => set({ activeTool }),
      setToolColor: (toolColor) => set({ toolColor }),
      setToolStrokeWidth: (toolStrokeWidth) => set({ toolStrokeWidth: Math.min(24, Math.max(1, toolStrokeWidth)) }),
      selectElement: (id) => set({ selectedIds: id ? [id] : [] }),
      selectMultiple: (id) => set((state) => ({ 
        selectedIds: state.selectedIds.includes(id) 
          ? state.selectedIds.filter(selectedId => selectedId !== id)
          : [...state.selectedIds, id]
      })),
      clearSelection: () => set({ selectedIds: [] }),

      updateElement: (id, updates) => set((state) => ({
        design: {
          ...state.design,
          elements: state.design.elements.map(el => 
            el.id === id ? { ...el, ...updates } : el
          )
        }
      })),
      
      deleteElement: (id) => set((state) => ({
        design: { ...state.design, elements: state.design.elements.filter(el => el.id !== id) },
        selectedIds: state.selectedIds.filter(sid => sid !== id)
      })),

      duplicateElement: (id) => set((state) => {
        const el = state.design.elements.find(e => e.id === id)
        if (!el) return state
        const newId = `${el.type}_${Math.random().toString(36).substr(2, 9)}`
        const newEl = { ...el, id: newId, x: el.x + 20, y: el.y + 20 }
        return {
          design: { ...state.design, elements: [...state.design.elements, newEl] },
          selectedIds: [newId]
        }
      }),

      arrangeElement: (id, action) => set((state) => {
        const elements = [...state.design.elements]
        const idx = elements.findIndex(e => e.id === id)
        if (idx === -1) return state

        const el = elements.splice(idx, 1)[0]
        
        if (action === 'front') elements.push(el)
        else if (action === 'back') elements.unshift(el)
        else if (action === 'up') elements.splice(Math.min(elements.length, idx + 1), 0, el)
        else if (action === 'down') elements.splice(Math.max(0, idx - 1), 0, el)

        return { design: { ...state.design, elements } }
      }),

      setZoom: (zoom) => set({ zoom }),
      setDesign: (design) => set({ design }),
      resetDesign: () => set({
        design: {
          ...initialDesign,
          elements: initialDesign.elements.map(element => ({ ...element })),
        },
        selectedIds: [],
        palettePreview: null,
      }),
      setPalettePreview: (palettePreview) => set({ palettePreview }),
    }),
    {
      name: 'momentis-editor-storage',
      partialize: (state) => ({ design: state.design }), // only save design state
    }
  ),
  {
    partialize: (state) => ({ design: state.design }), // zundo only tracks design changes
    limit: 50
  }
)
)
