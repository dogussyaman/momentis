'use client'

import { useSiteEditorStore } from '@/store/site-editor-store'
import { TEMPLATES } from '@/lib/site-builder/templates'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TemplatesPanel() {
  const { site, loadTemplate } = useSiteEditorStore()
  const activeTemplateId = site?.templateId

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-border bg-ivory-50/50">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-midnight">Şablonlar</h3>
        <p className="text-[10px] text-muted-foreground mt-1">Sitenizin genel görünümünü ve tasarımını tek tıkla değiştirin.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {TEMPLATES.map((tpl) => (
          <div 
            key={tpl.id}
            onClick={() => loadTemplate(tpl.id, false)}
            className={cn(
              "group relative flex flex-col rounded-xl overflow-hidden border cursor-pointer transition-all",
              activeTemplateId === tpl.id ? "border-midnight ring-1 ring-midnight shadow-md" : "border-border hover:border-midnight/40 hover:shadow-sm"
            )}
          >
            <div className="h-32 w-full bg-ivory-50 relative">
               <img src={tpl.preview} alt={tpl.name} className="w-full h-full object-cover" />
               {activeTemplateId === tpl.id && (
                 <div className="absolute top-2 right-2 w-6 h-6 bg-midnight text-white rounded-full flex items-center justify-center shadow-md">
                   <Check className="w-3.5 h-3.5" />
                 </div>
               )}
            </div>
            <div className="p-3 bg-white">
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
      </div>
    </div>
  )
}
