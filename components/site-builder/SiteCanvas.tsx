'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { useSiteEditorStore } from '@/store/site-editor-store'
import type { SiteOverlayElement, SiteSection } from '@/lib/site-builder/schema'
import { sectionRegistry } from './sections'
import { SiteRenderProvider } from './render/primitives'
import { SiteNavigation } from './SiteViewer'
import { getSiteRootStyle } from '@/lib/site-builder/render-style'
import { loadGoogleFonts } from '@/lib/site-builder/fonts'
import { cn } from '@/lib/utils'
import { EDITOR_FONT_NAMES } from '@/lib/editor-fonts'
import { AlignCenter, AlignLeft, AlignRight, Bold, Copy, Eye, EyeOff, GripVertical, Italic, Lock, Minus, Plus, Trash2, Underline, Unlock } from 'lucide-react'

type SelectedElement = {
  sectionId: string
  key: string
  element: HTMLElement
  kind: 'text' | 'image' | 'overlay'
}

type ToolbarPosition = { left: number; top: number }
type OverlayDrag = { element: HTMLElement; pointerId: number; startX: number; startY: number; sectionWidth: number; sectionHeight: number; x: number; y: number; moved: boolean }

function SortableSection({ section, onSelectElement }: { section: SiteSection; onSelectElement: (selection: SelectedElement | null) => void }) {
  const store = useSiteEditorStore()
  const [dragging, setDragging] = useState(false)
  const selected = store.selectedSectionId === section.id
  const hidden = !section.visible

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const editableImage = target.closest<HTMLElement>('[data-editable-image-section]')
    if (editableImage) {
      const sectionId = editableImage.dataset.editableImageSection
      const key = editableImage.dataset.editableImageKey
      if (sectionId && key) onSelectElement({ sectionId, key, element: editableImage, kind: 'image' })
      return
    }

    const overlay = target.closest<HTMLElement>('[data-site-overlay-id][data-site-overlay-section]')
    if (overlay) {
      const sectionId = overlay.dataset.siteOverlaySection
      const key = overlay.dataset.siteOverlayId
      if (sectionId && key) onSelectElement({ sectionId, key, element: overlay, kind: 'overlay' })
      return
    }

    const editableText = target.closest<HTMLElement>('[data-editable-section][data-editable-key]')
    if (editableText) {
      const sectionId = editableText.dataset.editableSection
      const key = editableText.dataset.editableKey
      if (sectionId && key) onSelectElement({ sectionId, key, element: editableText, kind: 'text' })
      return
    }

    onSelectElement(null)
    store.selectSection(section.id)
  }

  return (
    <div
      onDragEnd={() => setDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const id = event.dataTransfer.getData('text/momentis-section')
        if (!id || id === section.id) return
        const site = useSiteEditorStore.getState().site
        if (!site) return
        const from = site.sections.findIndex((item) => item.id === id)
        const to = site.sections.findIndex((item) => item.id === section.id)
        if (from >= 0 && to >= 0) useSiteEditorStore.getState().moveSection(from, to)
      }}
      onClick={handleClick}
      className={cn('relative group transition-all', selected ? 'ring-2 ring-midnight z-10' : 'hover:ring-2 hover:ring-midnight/30', dragging && 'opacity-40', hidden && 'opacity-40')}
    >
      <div className={cn('absolute right-2 top-2 z-30 flex items-center gap-1 rounded-lg border bg-white/95 p-1 shadow-lg backdrop-blur', selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
        <button
          type="button"
          draggable={!section.locked}
          onClick={(event) => event.stopPropagation()}
          onDragStart={(event) => {
            if (section.locked) {
              event.preventDefault()
              return
            }
            setDragging(true)
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/momentis-section', section.id)
          }}
          className="cursor-grab rounded p-1.5 hover:bg-ivory-50"
          title="Bölümü taşı"
          aria-label="Bölümü taşımak için sürükleyin"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button onClick={(event) => { event.stopPropagation(); store.toggleVisibility(section.id) }} className="p-1.5 hover:bg-ivory-50 rounded" title="Gizle/Göster">{hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
        <button onClick={(event) => { event.stopPropagation(); store.toggleLock(section.id) }} className="p-1.5 hover:bg-ivory-50 rounded" title="Kilitle/Kilidi aç">{section.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}</button>
        <button onClick={(event) => { event.stopPropagation(); store.duplicateSection(section.id) }} className="p-1.5 hover:bg-ivory-50 rounded" title="Çoğalt"><Copy className="w-3.5 h-3.5" /></button>
        <button onClick={(event) => { event.stopPropagation(); store.removeSection(section.id) }} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Sil"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      {hidden ? <div className="min-h-20 flex items-center justify-center border border-dashed bg-white text-xs text-muted-foreground">Bu bölüm gizli</div> : (() => {
        const Component = sectionRegistry[section.type]?.component
        return Component ? <Component section={section} props={section.props} /> : <div className="p-8 text-center text-red-500">Bilinmeyen bölüm: {section.type}</div>
      })()}
    </div>
  )
}

function InlineTextToolbar({ selection, onStyleChange, onClose }: {
  selection: SelectedElement
  onStyleChange: (style: Record<string, string | number>) => void
  onClose: () => void
}) {
  const readStyle = () => window.getComputedStyle(selection.element)
  const [fontFamily, setFontFamily] = useState(() => readStyle().fontFamily.split(',')[0].replace(/["']/g, ''))
  const [fontSize, setFontSize] = useState(() => Math.round(parseFloat(readStyle().fontSize) || 16))

  const apply = (style: Record<string, string | number>) => {
    onStyleChange(style)
    if (style.fontFamily) setFontFamily(String(style.fontFamily))
    if (style.fontSize) setFontSize(Number.parseInt(String(style.fontSize), 10))
  }

  const current = readStyle()
  const isBold = Number.parseInt(current.fontWeight, 10) >= 600
  const isItalic = current.fontStyle === 'italic'
  const isUnderlined = current.textDecorationLine.includes('underline')

  const buttonClass = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-midnight/70 transition hover:bg-ivory'

  return (
    <div
      className="relative z-[100] flex max-w-[calc(100vw-24px)] items-center gap-1 overflow-x-auto rounded-xl border border-midnight/10 bg-white p-2 shadow-[0_12px_40px_-12px_rgba(16,24,39,0.35)]"
      onMouseDown={(event) => { if ((event.target as HTMLElement).tagName === 'BUTTON') event.preventDefault() }}
      data-testid="inline-text-toolbar"
    >
      <select aria-label="Yazı tipi" value={fontFamily} onChange={(event) => apply({ fontFamily: `'${event.target.value}', sans-serif` })} className="h-8 max-w-32 rounded-lg border-0 bg-ivory-50 px-2 text-xs outline-none">
        {EDITOR_FONT_NAMES.map((font) => <option key={font} value={font}>{font}</option>)}
      </select>
      <div className="flex h-8 shrink-0 items-center rounded-lg bg-ivory-50 px-1">
        <button type="button" className={buttonClass} onClick={() => apply({ fontSize: `${Math.max(8, fontSize - 1)}px` })} aria-label="Yazıyı küçült">−</button>
        <input aria-label="Yazı boyutu" type="number" min="8" max="160" value={fontSize} onChange={(event) => apply({ fontSize: `${Math.min(160, Math.max(8, Number(event.target.value) || 8))}px` })} className="w-10 bg-transparent text-center text-xs outline-none" />
        <button type="button" className={buttonClass} onClick={() => apply({ fontSize: `${Math.min(160, fontSize + 1)}px` })} aria-label="Yazıyı büyüt">+</button>
      </div>
      <label className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-midnight/70 hover:bg-ivory" title="Yazı rengi">
        <span className="relative flex h-5 w-5 items-center justify-center text-sm font-bold">A<span className="absolute bottom-0 h-1 w-4 bg-champagne" /></span>
        <input aria-label="Yazı rengi" type="color" value={current.color.startsWith('rgb') ? '#101827' : current.color} onChange={(event) => apply({ color: event.target.value })} className="absolute h-px w-px opacity-0" />
      </label>
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      <button type="button" className={cn(buttonClass, isBold && 'bg-ivory text-midnight')} onClick={() => apply({ fontWeight: isBold ? '400' : '700' })} aria-label="Kalın"><Bold className="h-4 w-4" /></button>
      <button type="button" className={cn(buttonClass, isItalic && 'bg-ivory text-midnight')} onClick={() => apply({ fontStyle: isItalic ? 'normal' : 'italic' })} aria-label="İtalik"><Italic className="h-4 w-4" /></button>
      <button type="button" className={cn(buttonClass, isUnderlined && 'bg-ivory text-midnight')} onClick={() => apply({ textDecoration: isUnderlined ? 'none' : 'underline' })} aria-label="Altı çizili"><Underline className="h-4 w-4" /></button>
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      <button type="button" className={buttonClass} onClick={() => apply({ textAlign: 'left' })} aria-label="Sola hizala"><AlignLeft className="h-4 w-4" /></button>
      <button type="button" className={buttonClass} onClick={() => apply({ textAlign: 'center' })} aria-label="Ortala"><AlignCenter className="h-4 w-4" /></button>
      <button type="button" className={buttonClass} onClick={() => apply({ textAlign: 'right' })} aria-label="Sağa hizala"><AlignRight className="h-4 w-4" /></button>
      <button type="button" className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-midnight/40 hover:bg-ivory hover:text-midnight" onClick={onClose} aria-label="Biçimlendirme araç çubuğunu kapat">×</button>
    </div>
  )
}

function OverlayQuickToolbar({ overlay, onChange, onDelete }: {
  overlay: SiteOverlayElement
  onChange: (patch: Partial<SiteOverlayElement>) => void
  onDelete: () => void
}) {
  const controlClass = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-midnight/70 transition hover:bg-ivory'
  const radius = overlay.borderRadius ?? 24

  return (
    <div
      className="flex max-w-[calc(100vw-24px)] items-center gap-1 overflow-x-auto rounded-xl border border-midnight/10 bg-white p-2 shadow-[0_12px_40px_-12px_rgba(16,24,39,0.35)]"
      onMouseDown={(event) => { if ((event.target as HTMLElement).closest('button')) event.preventDefault() }}
      data-testid="overlay-quick-toolbar"
    >
      <button type="button" className={controlClass} onClick={() => onChange({ fontSize: Math.max(10, overlay.fontSize - 1) })} aria-label="Yazıyı küçült"><Minus className="h-4 w-4" /></button>
      <span className="w-7 text-center text-xs tabular-nums">{overlay.fontSize}</span>
      <button type="button" className={controlClass} onClick={() => onChange({ fontSize: Math.min(120, overlay.fontSize + 1) })} aria-label="Yazıyı büyüt"><Plus className="h-4 w-4" /></button>
      <label className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sm font-bold text-midnight/70 hover:bg-ivory" title="Yazı rengi">
        A
        <input aria-label="Yazı rengi" type="color" value={overlay.color} onChange={(event) => onChange({ color: event.target.value })} className="absolute h-px w-px opacity-0" />
      </label>
      {overlay.type === 'button' && <>
        <span className="mx-1 h-5 w-px shrink-0 bg-border" />
        <label className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-midnight/70 hover:bg-ivory" title="Buton rengi">
          <span className="h-4 w-4 rounded border border-midnight/20" style={{ backgroundColor: overlay.backgroundColor || '#C9A96E' }} />
          <input aria-label="Buton rengi" type="color" value={overlay.backgroundColor || '#C9A96E'} onChange={(event) => onChange({ backgroundColor: event.target.value })} className="absolute h-px w-px opacity-0" />
        </label>
        {[0, 12, 24, 48].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange({ borderRadius: value })}
            className={`h-7 min-w-7 rounded-md px-1 text-[10px] transition ${radius === value ? 'bg-midnight text-white' : 'text-midnight/70 hover:bg-ivory'}`}
            aria-label={`Köşe yuvarlaklığı ${value}`}
            title={`Köşe yuvarlaklığı ${value}px`}
          >
            {value}
          </button>
        ))}
      </>}
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      <button type="button" className={`${controlClass} text-red-500 hover:bg-red-50`} onClick={onDelete} aria-label="Katmanı sil"><Trash2 className="h-4 w-4" /></button>
    </div>
  )
}

export function SiteCanvas() {
  const { site, selectSection, selectOverlay, updateSectionProps, setInspectorTab } = useSiteEditorStore()
  const [selection, setSelection] = useState<SelectedElement | null>(null)
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition | null>(null)
  const overlayDragRef = useRef<OverlayDrag | null>(null)
  const ignoreCanvasClickRef = useRef(false)

  useEffect(() => {
    loadGoogleFonts([site?.theme.headingFont, site?.theme.bodyFont, site?.theme.scriptFont])
  }, [site?.theme.headingFont, site?.theme.bodyFont, site?.theme.scriptFont])

  const updateToolbarPosition = useCallback(() => {
    if (!selection || selection.kind === 'image' || !selection.element.isConnected) {
      setToolbarPosition(null)
      return
    }
    const rect = selection.element.getBoundingClientRect()
    const toolbarWidth = Math.min(selection.kind === 'text' ? 640 : 360, window.innerWidth - 24)
    setToolbarPosition({
      left: Math.max(toolbarWidth / 2 + 12, Math.min(window.innerWidth - toolbarWidth / 2 - 12, rect.left + rect.width / 2)),
      top: rect.top > 72 ? rect.top - 58 : rect.bottom + 8,
    })
  }, [selection])

  useEffect(() => {
    updateToolbarPosition()
    window.addEventListener('resize', updateToolbarPosition)
    window.addEventListener('scroll', updateToolbarPosition, true)
    return () => {
      window.removeEventListener('resize', updateToolbarPosition)
      window.removeEventListener('scroll', updateToolbarPosition, true)
    }
  }, [updateToolbarPosition])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        event.shiftKey ? useSiteEditorStore.getState().redo() : useSiteEditorStore.getState().undo()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        useSiteEditorStore.getState().redo()
      }
      if (event.key === 'Delete' && !target.isContentEditable && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        const state = useSiteEditorStore.getState()
        if (state.selectedOverlayId && state.selectedSectionId) {
          const section = state.site?.sections.find(item => item.id === state.selectedSectionId)
          if (section && Array.isArray(section.props.overlayElements)) {
            event.preventDefault()
            state.updateSectionProps(section.id, {
              overlayElements: section.props.overlayElements.filter((item: Record<string, any>) => item.id !== state.selectedOverlayId),
            })
            state.selectOverlay(null)
            setSelection(null)
            return
          }
        }
        const id = useSiteEditorStore.getState().selectedSectionId
        if (id) useSiteEditorStore.getState().removeSection(id)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!site) return null

  const handleSelectElement = (nextSelection: SelectedElement | null) => {
    if (!nextSelection) {
      setSelection(null)
      setToolbarPosition(null)
      selectOverlay(null)
      return
    }
    setSelection(nextSelection)
    selectSection(nextSelection.sectionId)
    selectOverlay(nextSelection.kind === 'overlay' ? nextSelection.key : null)
    updateToolbarPosition()
    if (nextSelection.kind === 'overlay') setInspectorTab('content')
    if (nextSelection.kind === 'image') {
      setToolbarPosition(null)
      setInspectorTab(nextSelection.key === 'bgImage' ? 'style' : 'content')
      requestAnimationFrame(() => {
        document.querySelector(`[data-image-field-key="${CSS.escape(nextSelection.key)}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    }
  }

  const saveText = (event: React.FocusEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const overlay = target.closest<HTMLElement>('[data-site-overlay-id][data-site-overlay-section]')
    if (overlay && target.dataset.editableOverlay === 'true') {
      const sectionId = overlay.dataset.siteOverlaySection
      const overlayId = overlay.dataset.siteOverlayId
      const section = useSiteEditorStore.getState().site?.sections.find(item => item.id === sectionId)
      const elements = section?.props.overlayElements
      if (sectionId && overlayId && Array.isArray(elements)) {
        useSiteEditorStore.getState().updateSectionProps(sectionId, {
          overlayElements: elements.map((item: Record<string, any>) =>
            item.id === overlayId ? { ...item, text: target.innerText } : item
          ),
        })
      }
      return
    }
    const sectionId = target.dataset.editableSection
    const key = target.dataset.editableKey
    if (!sectionId || !key) return
    const value = target.innerText
    const section = useSiteEditorStore.getState().site?.sections.find((item) => item.id === sectionId)
    if (key === 'buttons') {
      const index = Number(target.dataset.editableIndex)
      const buttons = section?.props.buttons
      if (Array.isArray(buttons) && Number.isInteger(index) && buttons[index]?.label !== value) {
        const updated = buttons.map((button: Record<string, unknown>, buttonIndex: number) => buttonIndex === index ? { ...button, label: value } : button)
        useSiteEditorStore.getState().updateSectionProps(sectionId, { buttons: updated })
      }
      return
    }
    if (!section) return
    const path = key.split('.')
    const rootKey = path.shift()
    if (!rootKey) return
    let original: any = section.props[rootKey]
    for (const part of path) original = original?.[part]
    if (original === value) return
    if (!path.length) {
      useSiteEditorStore.getState().updateSectionProps(sectionId, { [rootKey]: value })
      return
    }
    const updated = JSON.parse(JSON.stringify(section.props[rootKey]))
    let parent = updated
    for (const part of path.slice(0, -1)) parent = parent[part]
    parent[path[path.length - 1]] = value
    useSiteEditorStore.getState().updateSectionProps(sectionId, { [rootKey]: updated })
  }

  const selectedOverlay = selection?.kind === 'overlay'
    ? site.sections.find((section) => section.id === selection.sectionId)?.props.overlayElements?.find((item: SiteOverlayElement) => item.id === selection.key)
    : null

  const updateSelectedOverlay = (patch: Partial<SiteOverlayElement>) => {
    if (!selection || selection.kind !== 'overlay') return
    const currentSection = useSiteEditorStore.getState().site?.sections.find((item) => item.id === selection.sectionId)
    const overlays = currentSection?.props.overlayElements
    if (!Array.isArray(overlays)) return
    updateSectionProps(selection.sectionId, {
      overlayElements: overlays.map((item: SiteOverlayElement) => item.id === selection.key ? { ...item, ...patch } : item),
    })
  }

  const deleteSelectedOverlay = () => {
    if (!selection || selection.kind !== 'overlay') return
    const currentSection = useSiteEditorStore.getState().site?.sections.find((item) => item.id === selection.sectionId)
    const overlays = currentSection?.props.overlayElements
    if (Array.isArray(overlays)) {
      updateSectionProps(selection.sectionId, {
        overlayElements: overlays.filter((item: SiteOverlayElement) => item.id !== selection.key),
      })
    }
    selectOverlay(null)
    setSelection(null)
    setToolbarPosition(null)
  }

  const applyInlineStyle = (style: Record<string, string | number>) => {
    if (!selection) return
    const state = useSiteEditorStore.getState()
    const section = state.site?.sections.find((item) => item.id === selection.sectionId)
    if (!section) return
    if (selection.key === 'buttons') {
      const index = Number(selection.element.dataset.editableIndex)
      const buttons = section.props.buttons
      if (!Array.isArray(buttons) || !Number.isInteger(index) || !buttons[index]) return
      const updated = buttons.map((button: Record<string, any>, buttonIndex: number) => buttonIndex === index
        ? { ...button, inlineStyle: { ...(button.inlineStyle ?? {}), ...style } }
        : button)
      state.updateSectionProps(selection.sectionId, { buttons: updated })
      updateToolbarPosition()
      return
    }
    const inlineStyles = section.props.inlineStyles ?? {}
    state.updateSectionProps(selection.sectionId, {
      inlineStyles: { ...inlineStyles, [selection.key]: { ...(inlineStyles[selection.key] ?? {}), ...style } },
    })
    updateToolbarPosition()
  }

  const handleOverlayPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const handle = target.closest<HTMLElement>('[data-overlay-drag-handle]')
    const element = handle?.closest<HTMLElement>('[data-site-overlay-id][data-site-overlay-section]')
      ?? target.closest<HTMLElement>('[data-site-overlay-type="button"][data-site-overlay-id][data-site-overlay-section]')
    const section = element?.closest<HTMLElement>('[data-overlay-canvas]')
    if (!element || !section) return
    event.preventDefault()
    event.stopPropagation()
    const sectionId = element.dataset.siteOverlaySection
    const overlayId = element.dataset.siteOverlayId
    if (!sectionId || !overlayId) return
    const bounds = section.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    setSelection({ sectionId, key: overlayId, element, kind: 'overlay' })
    selectSection(sectionId)
    selectOverlay(overlayId)
    overlayDragRef.current = {
      element,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      sectionWidth: bounds.width,
      sectionHeight: bounds.height,
      x: Number(element.dataset.overlayX ?? 50),
      y: Number(element.dataset.overlayY ?? 50),
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleOverlayPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = overlayDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (!drag.moved) {
      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY)
      if (distance < 4) return
      drag.moved = true
    }
    const x = Number(Math.max(0, Math.min(100, drag.x + (event.clientX - drag.startX) / drag.sectionWidth * 100)).toFixed(1))
    const y = Number(Math.max(0, Math.min(100, drag.y + (event.clientY - drag.startY) / drag.sectionHeight * 100)).toFixed(1))
    drag.element.style.left = `${x}%`
    drag.element.style.top = `${y}%`
  }

  const handleOverlayPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = overlayDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    ignoreCanvasClickRef.current = true
    window.setTimeout(() => { ignoreCanvasClickRef.current = false }, 0)
    if (!drag.moved) {
      overlayDragRef.current = null
      return
    }
    const x = Number(Math.max(0, Math.min(100, drag.x + (event.clientX - drag.startX) / drag.sectionWidth * 100)).toFixed(1))
    const y = Number(Math.max(0, Math.min(100, drag.y + (event.clientY - drag.startY) / drag.sectionHeight * 100)).toFixed(1))
    drag.element.style.left = `${x}%`
    drag.element.style.top = `${y}%`
    const sectionId = drag.element.dataset.siteOverlaySection
    const overlayId = drag.element.dataset.siteOverlayId
    const section = useSiteEditorStore.getState().site?.sections.find(item => item.id === sectionId)
    if (sectionId && overlayId && section && Array.isArray(section.props.overlayElements)) {
      updateSectionProps(sectionId, {
        overlayElements: section.props.overlayElements.map((item: Record<string, any>) =>
          item.id === overlayId ? { ...item, x, y } : item
        ),
      })
    }
    overlayDragRef.current = null
  }

  const handleOverlayPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    const drag = overlayDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    drag.element.style.left = `${drag.x}%`
    drag.element.style.top = `${drag.y}%`
    overlayDragRef.current = null
  }

  return (
    <SiteRenderProvider value={{ site, mode: 'editor' }}>
      <div
        id="site-start"
        data-site-root
        data-template-id={site.templateId}
        className="sb-root sb-editor-canvas relative flex min-h-full w-full flex-col bg-white"
        onPointerDown={handleOverlayPointerDown}
        onPointerMove={handleOverlayPointerMove}
        onPointerUp={handleOverlayPointerUp}
        onPointerCancel={handleOverlayPointerCancel}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            if (ignoreCanvasClickRef.current) {
              ignoreCanvasClickRef.current = false
              return
            }
            setSelection(null)
            selectSection(null)
          }
        }}
        onBlurCapture={saveText}
        style={getSiteRootStyle(site)}
      >
        {site.settings.showNavbar !== false && <SiteNavigation site={site} />}
        {site.sections.length ? site.sections.map((section) => (
          <SortableSection key={section.id} section={section} onSelectElement={handleSelectElement} />
        )) : (
          <div className="flex min-h-[70vh] items-center justify-center p-12 text-center text-midnight/40">
            <div><p className="text-sm font-medium">Henüz bölüm yok</p><p className="mt-2 text-xs">Soldan bir bölüm ekleyin veya bir şablon seçin.</p></div>
          </div>
        )}
        {selection?.kind === 'text' && toolbarPosition && (
          <div style={{ position: 'fixed', left: toolbarPosition.left, top: toolbarPosition.top, transform: 'translateX(-50%)', zIndex: 100 }}>
            <InlineTextToolbar selection={selection} onStyleChange={applyInlineStyle} onClose={() => setSelection(null)} />
          </div>
        )}
        {selection?.kind === 'overlay' && selectedOverlay?.type === 'button' && toolbarPosition && (
          <div style={{ position: 'fixed', left: toolbarPosition.left, top: toolbarPosition.top, transform: 'translateX(-50%)', zIndex: 100 }}>
            <OverlayQuickToolbar
              overlay={selectedOverlay}
              onChange={updateSelectedOverlay}
              onDelete={deleteSelectedOverlay}
            />
          </div>
        )}
        {selection?.kind === 'image' && (
          <div className="fixed left-1/2 top-4 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-midnight/10 bg-white px-4 py-2.5 text-xs text-midnight shadow-lg" data-testid="inline-image-toolbar">
            Görsel seçildi · Ayarları sağ panelden düzenleyin
            <button type="button" onClick={() => setSelection(null)} className="ml-1 text-midnight/45 hover:text-midnight" aria-label="Seçimi kapat">×</button>
          </div>
        )}
      </div>
    </SiteRenderProvider>
  )
}
