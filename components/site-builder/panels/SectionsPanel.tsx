'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useSiteEditorStore } from '@/store/site-editor-store'
import { SECTION_DEFINITIONS, SECTION_CATEGORIES } from '@/lib/site-builder/definitions'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function SectionsPanel() {
  const { addSection } = useSiteEditorStore()
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase('tr')
  const filteredDefinitions = SECTION_DEFINITIONS.filter((definition) =>
    `${definition.name} ${definition.description} ${definition.category}`.toLocaleLowerCase('tr').includes(normalizedQuery)
  )

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em]">Bölüm ekle</h3>
            <p className="mt-1 text-[10px] text-muted-foreground">Hazır bölümleri tuvalinize ekleyin.</p>
          </div>
          <span className="rounded-full bg-[#f5f1eb] px-2 py-1 text-[9px] font-medium text-midnight/70">{filteredDefinitions.length}</span>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bölüm ara..." aria-label="Bölüm ara" className="h-9 rounded-lg border-[#e7e0d7] bg-[#faf7f2] pl-8 text-[11px]" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          <motion.div key={query || 'all'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
            {SECTION_CATEGORIES.map((category) => {
              const definitions = filteredDefinitions.filter((definition) => definition.category === category)
              if (!definitions.length) return null
              return (
                <div key={category} className="mb-5">
                  <h4 className="mb-2 px-1 text-[9px] font-semibold uppercase tracking-[.18em] text-muted-foreground">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {definitions.map((definition) => {
                      const Icon = definition.icon
                      return (
                        <motion.button
                          key={definition.type}
                          type="button"
                          onClick={() => addSection(definition.type)}
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={cn(
                            'group flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-[18px] border border-[#e9e2d8] bg-white p-3 text-center shadow-sm transition-all duration-200 hover:border-[#111827]/25 hover:bg-[#faf7f2] hover:shadow-[0_14px_26px_-22px_rgba(17,24,39,0.5)]'
                          )}
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4efe8] text-[#111827]/80 shadow-inner transition group-hover:bg-[#111827] group-hover:text-white"><Icon className="h-4 w-4" /></span>
                          <span className="text-[10px] font-semibold text-midnight">{definition.name}</span>
                          <span className="line-clamp-2 text-[8px] leading-tight text-muted-foreground">{definition.description}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {!filteredDefinitions.length && <p className="rounded-xl border border-dashed border-[#ddd1c2] bg-[#faf7f2] p-5 text-center text-xs text-muted-foreground">Aramanızla eşleşen bölüm bulunamadı.</p>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}