'use client'
import { useSiteEditorStore } from '@/store/site-editor-store'
import { SECTION_DEFINITIONS, SECTION_CATEGORIES } from '@/lib/site-builder/definitions'
import { cn } from '@/lib/utils'

export function SectionsPanel(){
 const {addSection}=useSiteEditorStore()
 return <div className="flex h-full flex-col bg-white">
  <div className="border-b bg-ivory-50/50 p-4"><h3 className="text-xs font-semibold uppercase tracking-wider">Bölüm Ekle</h3><p className="mt-1 text-[10px] text-muted-foreground">Hazır bölümlerden seçin. Ekledikten sonra sırasını ve ayarlarını düzenleyebilirsiniz.</p></div>
  <div className="flex-1 overflow-y-auto p-3">
   {SECTION_CATEGORIES.map(cat=>{const defs=SECTION_DEFINITIONS.filter(x=>x.category===cat);if(!defs.length)return null;return <div key={cat} className="mb-5"><h4 className="mb-2 px-1 text-[9px] font-semibold uppercase tracking-[.18em] text-muted-foreground">{cat}</h4><div className="grid grid-cols-2 gap-2">{defs.map(d=>{const Icon=d.icon;return <button key={d.type} onClick={()=>addSection(d.type)} className={cn('flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-ivory-50 p-3 text-center transition hover:border-midnight/40 hover:bg-ivory')}><Icon className="h-5 w-5 text-midnight/60"/><span className="text-[10px] font-semibold">{d.name}</span><span className="line-clamp-2 text-[8px] leading-tight text-muted-foreground">{d.description}</span></button>})}</div></div>})}
  </div>
 </div>
}