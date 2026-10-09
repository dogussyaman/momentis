'use client'

import { useSiteEditorStore } from '@/store/site-editor-store'
import { SECTION_DEFINITIONS } from '@/lib/site-builder/definitions'
import { Button } from '@/components/ui/button'
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Layers, Lock, Plus, Trash2, Unlock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LayersPanel() {
  const { site, selectedSectionId, selectSection, moveSectionBy, toggleVisibility, toggleLock, addSection, duplicateSection, removeSection } = useSiteEditorStore()

  if (!site) return null

  const sections = [...site.sections].reverse()

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-midnight">Katmanlar</h3>
            <p className="mt-1 text-[10px] text-muted-foreground">Bölümlerin sırasını ve görünürlüğünü yönetin.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-ivory-50 px-2 py-1 text-[9px] text-muted-foreground">{sections.length}</span>
            {!site.sections.some((section) => section.type === 'footer') && (
              <Button type="button" variant="outline" size="sm" onClick={() => addSection('footer')} className="h-7 px-2 text-[9px]">
                <Plus className="mr-1 h-3 w-3" /> Alt bilgi ekle
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {!sections.length && <p className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">Henüz bölüm eklenmedi.</p>}
        {sections.map((section, index) => {
          const definition = SECTION_DEFINITIONS.find((item) => item.type === section.type)
          const selected = selectedSectionId === section.id
          const originalIndex = site.sections.length - index - 1
          const Icon = definition?.icon || Layers

          return (
            <div key={section.id} className={cn('group flex items-center gap-1 rounded-xl border p-1.5 transition-colors', selected ? 'border-midnight/30 bg-ivory-50' : 'border-transparent hover:border-border hover:bg-ivory-50/60')}>
              <button type="button" onClick={() => selectSection(section.id)} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 text-left" aria-pressed={selected}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-midnight/60 shadow-sm"><Icon className="h-4 w-4"/></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-medium text-midnight">{definition?.name || section.type}</span>
                  <span className="block text-[9px] text-muted-foreground">Bölüm {originalIndex + 1}</span>
                </span>
              </button>
              <div className="flex shrink-0 items-center">
                <Button type="button" variant="ghost" size="icon" title="Yukarı taşı" aria-label={`${definition?.name || 'Bölüm'} yukarı taşı`} disabled={originalIndex === site.sections.length - 1} onClick={() => moveSectionBy(section.id, 1)} className="h-7 w-7 text-muted-foreground"><ArrowUp className="h-3.5 w-3.5"/></Button>
                <Button type="button" variant="ghost" size="icon" title="Aşağı taşı" aria-label={`${definition?.name || 'Bölüm'} aşağı taşı`} disabled={originalIndex === 0} onClick={() => moveSectionBy(section.id, -1)} className="h-7 w-7 text-muted-foreground"><ArrowDown className="h-3.5 w-3.5"/></Button>
                <Button type="button" variant="ghost" size="icon" title={section.visible ? 'Gizle' : 'Göster'} aria-label={`${definition?.name || 'Bölüm'} ${section.visible ? 'gizle' : 'göster'}`} onClick={() => toggleVisibility(section.id)} className="h-7 w-7 text-muted-foreground">{section.visible ? <Eye className="h-3.5 w-3.5"/> : <EyeOff className="h-3.5 w-3.5"/>}</Button>
                <Button type="button" variant="ghost" size="icon" title={section.locked ? 'Kilidi aç' : 'Kilitle'} aria-label={`${definition?.name || 'Bölüm'} ${section.locked ? 'kilidini aç' : 'kilitle'}`} onClick={() => toggleLock(section.id)} className="h-7 w-7 text-muted-foreground">{section.locked ? <Lock className="h-3.5 w-3.5"/> : <Unlock className="h-3.5 w-3.5"/>}</Button>
                <Button type="button" variant="ghost" size="icon" title="Çoğalt" aria-label={`${definition?.name || 'Bölüm'} çoğalt`} onClick={() => duplicateSection(section.id)} className="h-7 w-7 text-muted-foreground"><Copy className="h-3.5 w-3.5"/></Button>
                <Button type="button" variant="ghost" size="icon" title="Sil" aria-label={`${definition?.name || 'Bölüm'} sil`} onClick={() => removeSection(section.id)} className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5"/></Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
