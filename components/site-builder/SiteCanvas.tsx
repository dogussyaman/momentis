'use client'
import { useEffect, useState } from 'react'
import { useSiteEditorStore } from '@/store/site-editor-store'
import type { SiteSection } from '@/lib/site-builder/schema'
import { sectionRegistry } from './sections'
import { SiteRenderProvider } from './render/primitives'
import { cn } from '@/lib/utils'
import { GripVertical, Copy, Trash2, Eye, EyeOff, Lock, Unlock } from 'lucide-react'

function SortableSection({ section }: { section: SiteSection }) {
  const store = useSiteEditorStore()
  const [dragging, setDragging] = useState(false)
  const selected = store.selectedSectionId === section.id
  const hidden = !section.visible
  return <div draggable={!section.locked} onDragStart={e=>{if(section.locked){e.preventDefault();return}setDragging(true);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/momentis-section',section.id)}} onDragEnd={()=>setDragging(false)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('text/momentis-section');if(!id||id===section.id)return;const site=useSiteEditorStore.getState().site;if(!site)return;const from=site.sections.findIndex(s=>s.id===id),to=site.sections.findIndex(s=>s.id===section.id);if(from>=0&&to>=0)useSiteEditorStore.getState().moveSection(from,to)}} onClick={e=>{e.stopPropagation();if(!section.locked)store.selectSection(section.id)}} className={cn('relative group transition-all',selected?'ring-2 ring-midnight z-10':'hover:ring-2 hover:ring-midnight/30',dragging&&'opacity-40',hidden&&'opacity-40')}>
    <div className={cn('absolute right-2 top-2 z-30 flex items-center gap-1 rounded-lg border bg-white/95 p-1 shadow-lg backdrop-blur',selected?'opacity-100':'opacity-0 group-hover:opacity-100')}>
      <button className="p-1.5 cursor-grab hover:bg-ivory-50 rounded" title="Taşı"><GripVertical className="w-3.5 h-3.5"/></button>
      <button onClick={e=>{e.stopPropagation();store.toggleVisibility(section.id)}} className="p-1.5 hover:bg-ivory-50 rounded" title="Gizle/Göster">{hidden?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button>
      <button onClick={e=>{e.stopPropagation();store.toggleLock(section.id)}} className="p-1.5 hover:bg-ivory-50 rounded" title="Kilitle/Kilidi aç">{section.locked?<Lock className="w-3.5 h-3.5"/>:<Unlock className="w-3.5 h-3.5"/>}</button>
      <button onClick={e=>{e.stopPropagation();store.duplicateSection(section.id)}} className="p-1.5 hover:bg-ivory-50 rounded" title="Çoğalt"><Copy className="w-3.5 h-3.5"/></button>
      <button onClick={e=>{e.stopPropagation();store.removeSection(section.id)}} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Sil"><Trash2 className="w-3.5 h-3.5"/></button>
    </div>
    {hidden?<div className="min-h-20 flex items-center justify-center border border-dashed bg-white text-xs text-muted-foreground">Bu bölüm gizli</div>:<div className="pointer-events-none">{(()=>{const Component=sectionRegistry[section.type]?.component;return Component?<Component section={section} props={section.props}/>:<div className="p-8 text-center text-red-500">Bilinmeyen bölüm: {section.type}</div>})()}</div>}
  </div>
}
export function SiteCanvas(){
 const {site,selectSection}=useSiteEditorStore()
 useEffect(()=>{const h=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?useSiteEditorStore.getState().redo():useSiteEditorStore.getState().undo()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();useSiteEditorStore.getState().redo()}if(e.key==='Delete'){const id=useSiteEditorStore.getState().selectedSectionId;if(id)useSiteEditorStore.getState().removeSection(id)}};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[])
 if(!site)return null
 return <SiteRenderProvider value={{site,mode:'editor'}}><div className="w-full min-h-full bg-white flex flex-col relative" onClick={()=>selectSection(null)} style={{backgroundColor:site.theme.backgroundColor,color:site.theme.textColor}}>{site.sections.length?<>{site.sections.map(s=><SortableSection key={s.id} section={s}/>)}</>:<div className="flex min-h-[70vh] items-center justify-center p-12 text-center text-midnight/40"><div><p className="text-sm font-medium">Henüz bölüm yok</p><p className="mt-2 text-xs">Soldan bir bölüm ekleyin veya bir şablon seçin.</p></div></div>}</div></SiteRenderProvider>
}