'use client'

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
            <h3 className="text-xs font-semibold uppercase tracking-wider">Bölüm ekle</h3>
            <p className="mt-1 text-[10px] text-muted-foreground">Hazır bölümleri tuvalinize ekleyin.</p>
          </div>
          <span className="rounded-full bg-ivory-50 px-2 py-1 text-[9px] font-medium text-muted-foreground">{filteredDefinitions.length}</span>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bölüm ara..." aria-label="Bölüm ara" className="h-9 rounded-lg pl-8 text-[11px]" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
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
                    <button key={definition.type} type="button" onClick={() => addSection(definition.type)} className={cn('group flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-midnight/40 hover:bg-ivory-50 hover:shadow')}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ivory-50 text-midnight/70 transition group-hover:bg-white"><Icon className="h-4 w-4" /></span>
                      <span className="text-[10px] font-semibold">{definition.name}</span>
                      <span className="line-clamp-2 text-[8px] leading-tight text-muted-foreground">{definition.description}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        {!filteredDefinitions.length && <p className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">Aramanızla eşleşen bölüm bulunamadı.</p>}
      </div>
    </div>
  )
}