'use client'

import { useState } from 'react'
import { useSiteEditorStore } from '@/store/site-editor-store'
import { TEMPLATES } from '@/lib/site-builder/templates'
import { Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export function TemplatesPanel() {
  const { site, loadTemplate } = useSiteEditorStore()
  const activeTemplateId = site?.templateId
  const [query, setQuery] = useState('')
  const templates = TEMPLATES.filter((template) =>
    `${template.name} ${template.tagline}`.toLocaleLowerCase('tr').includes(query.trim().toLocaleLowerCase('tr'))
  )

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b border-border bg-white p-4">
        <div className="flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wider text-midnight">Şablonlar</h3><span className="rounded-full bg-ivory-50 px-2 py-1 text-[9px] text-muted-foreground">{templates.length}</span></div>
        <p className="mt-1 text-[10px] text-muted-foreground">Sitenizin genel görünümünü ve düzenini değiştirin.</p>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Şablon ara..." aria-label="Şablon ara" className="h-9 rounded-lg pl-8 text-[11px]" />
        </div>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {templates.map((tpl) => (
          <div 
            key={tpl.id}
            onClick={() => loadTemplate(tpl.id, false)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                loadTemplate(tpl.id, false)
              }
            }}
            className={cn(
              "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midnight/40",
              activeTemplateId === tpl.id ? "border-midnight ring-1 ring-midnight shadow-md" : "border-border hover:-translate-y-0.5 hover:border-midnight/40 hover:shadow-md"
            )}
          >
            <div className="relative h-32 w-full bg-ivory-50">
               <img src={tpl.preview} alt={tpl.name} className="w-full h-full object-cover" />
               {activeTemplateId === tpl.id && (
                 <div className="absolute top-2 right-2 w-6 h-6 bg-midnight text-white rounded-full flex items-center justify-center shadow-md">
                   <Check className="w-3.5 h-3.5" />
                 </div>
               )}
            </div>
            <div className="bg-white p-3">
              <h4 className="text-sm font-semibold text-midnight">{tpl.name}</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">{tpl.tagline}</p>
              
              <div className="flex items-center gap-1.5 mt-3">
                {tpl.swatches.map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
        ))}
        {!templates.length && <p className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">Şablon bulunamadı.</p>}
      </div>
    </div>
  )
}
