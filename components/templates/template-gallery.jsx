'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TemplateCard } from './template-card'
import { EVENT_TYPES, TEMPLATE_STYLES } from '@/lib/data/events'
import { cn } from '@/lib/utils'

export function TemplateGallery() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [category, setCategory] = useState(searchParams.get('kategori') || 'all')
  const [style, setStyle] = useState('all')
  const [tier, setTier] = useState('all')
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)
    if (style !== 'all') params.set('style', style)
    if (tier !== 'all') params.set('tier', tier)
    if (debouncedQ) params.set('q', debouncedQ)
    setLoading(true)
    setError(null)
    fetch(`/api/templates?${params.toString()}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error('Tasarımlar yüklenemedi')
        return r.json()
      })
      .then((data) => {
        if (controller.signal.aborted) return
        setItems(data?.items || [])
        setLoading(false)
      })
      .catch((e) => { 
        if (controller.signal.aborted) return
        setError(e.message) 
        setLoading(false)
      })
    return () => controller.abort()
  }, [category, style, tier, debouncedQ])

  const onCategory = (id) => {
    setCategory(id)
    const params = new URLSearchParams(window.location.search)
    if (id === 'all') params.delete('kategori'); else params.set('kategori', id)
    router.replace(`/tasarimlar${params.toString() ? `?${params}` : ''}`, { scroll: false })
  }

  const categories = useMemo(() => [{ id: 'all', label: 'Tümü' }, ...EVENT_TYPES], [])

  return (
    <div data-testid="template-gallery">
      <div className="flex flex-col gap-6 border-y border-border py-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Etkinlik türü">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={category === c.id}
              onClick={() => onCategory(c.id)}
              data-testid={`filter-category-${c.id}`}
              className={cn(
                'border px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition-all duration-300',
                category === c.id ? 'border-midnight bg-midnight text-ivory' : 'border-border bg-transparent text-midnight/70 hover:border-midnight/50 hover:text-midnight'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tasarım ara…" className="h-10 w-full rounded-2xl border-border bg-transparent pl-9 sm:w-56" data-testid="template-search" />
          </div>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="h-10 w-full rounded-2xl border-border bg-transparent sm:w-40" data-testid="filter-style">
              <SlidersHorizontal className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Stil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Stiller</SelectItem>
              {TEMPLATE_STYLES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger className="h-10 w-full rounded-2xl border-border bg-transparent sm:w-36" data-testid="filter-tier">
              <SelectValue placeholder="Paket" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Paketler</SelectItem>
              <SelectItem value="free">Ücretsiz</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span data-testid="template-count">{loading ? 'Yükleniyor…' : `${items.length} tasarım`}</span>
      </div>

      {error && <p className="mt-10 text-center text-sm text-destructive" data-testid="template-error">{error}</p>}

      {loading ? (
        <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="block">
              <Skeleton className="aspect-[3/4] w-full rounded-2xl bg-midnight/5" />
              <div className="mt-3 flex items-center gap-1.5">
                {Array.from({ length: 4 }).map((_, j) => (
                   <Skeleton key={j} className="h-2.5 w-2.5 rounded-full bg-midnight/5" />
                ))}
                <Skeleton className="ml-2 h-3 w-16 bg-midnight/5" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 && !error ? (
        <div className="mt-20 text-center" data-testid="template-empty">
          <p className="font-serif text-3xl text-midnight">Bu kriterlere uygun tasarım bulunamadı.</p>
          <p className="mt-3 text-muted-foreground">Filtreleri sadeleştirerek yeniden deneyin.</p>
        </div>
      ) : (
        <motion.div layout className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {items.map((t, i) => (
              <motion.div key={t.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.5, delay: i * 0.04 }}>
                <TemplateCard template={t} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
