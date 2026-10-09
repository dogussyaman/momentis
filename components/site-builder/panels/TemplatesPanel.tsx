'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useSiteEditorStore } from '@/store/site-editor-store'
import { TEMPLATES } from '@/lib/site-builder/templates'
import { Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { SiteTemplate } from '@/lib/site-builder/templates'

export function TemplatesPanel({ eventData }: { eventData?: Record<string, any> }) {
  const { site, loadTemplate } = useSiteEditorStore()
  const activeTemplateId = site?.templateId
  const [query, setQuery] = useState('')
  const [pendingTemplate, setPendingTemplate] = useState<SiteTemplate | null>(null)
  const templates = TEMPLATES.filter((template) =>
    `${template.name} ${template.tagline}`.toLocaleLowerCase('tr').includes(query.trim().toLocaleLowerCase('tr'))
  )

  const applyTemplate = (keepContent: boolean) => {
    if (!pendingTemplate) return
    loadTemplate(pendingTemplate.id, keepContent, eventData)
    setPendingTemplate(null)
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-midnight">Şablonlar</h3>
          <span className="rounded-full bg-[#f5f1eb] px-2 py-1 text-[9px] font-medium text-midnight/70">{templates.length}</span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">Sitenizin genel görünümünü ve düzenini değiştirin.</p>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Şablon ara..." aria-label="Şablon ara" className="h-9 rounded-lg border-[#e7e0d7] bg-[#faf7f2] pl-8 text-[11px]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {templates.map((tpl) => {
              const isActive = activeTemplateId === tpl.id
              return (
                <motion.button
                  key={tpl.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  onClick={() => {
                    if (!isActive) setPendingTemplate(tpl)
                  }}
                  className={cn(
                    'group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-[20px] border text-left shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111827]/30',
                    isActive
                      ? 'border-[#111827] bg-[#f9f5f0] shadow-[0_18px_45px_-28px_rgba(17,24,39,0.7)] ring-1 ring-[#111827]/10'
                      : 'border-[#e9e2d8] bg-white hover:-translate-y-0.5 hover:border-[#111827]/25 hover:shadow-[0_16px_35px_-26px_rgba(17,24,39,0.45)]'
                  )}
                  type="button"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-[#f3efe8]">
                    <img src={tpl.preview} alt={tpl.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/20 via-transparent to-transparent" />
                    {isActive && (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#111827] text-white shadow-lg shadow-[#111827]/20"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </motion.div>
                    )}
                  </div>

                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-midnight">{tpl.name}</h4>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{tpl.tagline}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5">
                      {tpl.swatches.map((c, index) => (
                        <div key={`${tpl.id}-${index}`} className="h-4 w-4 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </AnimatePresence>

        {!templates.length && (
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-xl border border-dashed border-[#ddd1c2] bg-[#faf7f2] p-5 text-center text-xs text-muted-foreground">
            Şablon bulunamadı.
          </motion.p>
        )}
      </div>

      <Dialog open={!!pendingTemplate} onOpenChange={(open) => !open && setPendingTemplate(null)}>
        <DialogContent className="rounded-2xl border-0 bg-ivory">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-midnight">Şablon değişikliğini seçin</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {pendingTemplate?.name} şablonu için mevcut bölümlerinizi koruyabilir veya yeni şablonun bölüm düzenini uygulayabilirsiniz. Etkinlik bilgileriniz korunur.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingTemplate(null)} className="rounded-xl">Vazgeç</Button>
            <Button type="button" variant="outline" onClick={() => applyTemplate(true)} className="rounded-xl border-midnight/20 bg-white text-midnight hover:bg-ivory-50">
              Renk ve yazı tipini uygula
            </Button>
            <Button type="button" onClick={() => applyTemplate(false)} className="rounded-xl bg-midnight text-ivory hover:bg-midnight/90">
              Bölüm düzenini değiştir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
