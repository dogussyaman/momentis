'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, CircleHelp, Search, X } from 'lucide-react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Button } from '@/components/ui/button'
import { FAQ_CATEGORIES, FAQ_ITEMS, filterFaqItems, type FaqCategoryId } from '@/lib/data/faq'
import { cn } from '@/lib/utils'

export function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<'all' | FaqCategoryId>('all')
  const [query, setQuery] = useState('')
  const filteredItems = useMemo(
    () => filterFaqItems(FAQ_ITEMS, activeCategory, query),
    [activeCategory, query],
  )

  return (
    <div className="overflow-hidden bg-ivory pb-20 pt-28 sm:pb-28 sm:pt-36">
      <section className="container">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 flex items-center justify-center gap-3 text-[10px] font-medium uppercase tracking-[0.3em] text-champagne-dark sm:text-[11px]">
            <span className="h-px w-8 bg-current" /> MOMENTIS · Yardım merkezi
          </p>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight text-midnight sm:text-5xl md:text-7xl">
            Aklındaki sorulara,
            <span className="mt-1 block italic text-champagne-dark">net cevaplar.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:mt-7 sm:text-lg">
            Davetiyeni hazırlarken, paylaşırken veya hesabını yönetirken merak ettiklerini burada bulabilirsin.
          </p>

          <div className="mx-auto mt-8 max-w-2xl sm:mt-10">
            <label htmlFor="faq-search" className="sr-only">Sıkça sorulan sorularda ara</label>
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-midnight/10 bg-white px-4 shadow-[0_14px_45px_-34px_rgba(17,24,39,0.55)] transition focus-within:border-champagne-dark focus-within:ring-2 focus-within:ring-champagne/30 sm:h-16 sm:px-5">
              <Search className="h-5 w-5 shrink-0 text-champagne-dark" aria-hidden="true" />
              <input
                id="faq-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Aklındaki soruyu yaz…"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-midnight outline-none placeholder:text-midnight/40 sm:text-base"
                aria-controls="faq-results"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium text-midnight/60 transition hover:bg-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne-dark"
                  aria-label="Aramayı temizle"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Temizle</span>
                </button>
              )}
            </div>
            <p className="mt-3 text-left text-[11px] text-muted-foreground sm:text-xs">Soru, cevap ve kategoriler içinde ara.</p>
          </div>
        </div>
      </section>

      <section className="container mt-12 sm:mt-16" aria-label="Sıkça sorulan sorular">
        <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex w-max min-w-full gap-2 sm:w-auto sm:flex-wrap sm:justify-center" role="group" aria-label="Soruları kategoriye göre filtrele">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              aria-pressed={activeCategory === 'all'}
              className={`min-h-10 rounded-full border px-4 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne-dark focus-visible:ring-offset-2 ${activeCategory === 'all' ? 'border-midnight bg-midnight text-ivory' : 'border-midnight/10 bg-white text-midnight/65 hover:border-champagne-dark/50 hover:text-midnight'}`}
            >
              Tümü
            </button>
            {FAQ_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                aria-pressed={activeCategory === category.id}
                className={`min-h-10 rounded-full border px-4 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne-dark focus-visible:ring-offset-2 ${activeCategory === category.id ? 'border-midnight bg-midnight text-ivory' : 'border-midnight/10 bg-white text-midnight/65 hover:border-champagne-dark/50 hover:text-midnight'}`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-5 max-w-4xl sm:mt-8">
          <div className="mb-4 flex min-h-8 flex-wrap items-center justify-between gap-2 border-b border-midnight/10 pb-3">
            <p className="text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
              <span className="font-semibold text-midnight">{filteredItems.length}</span>
              {' '}soru bulundu
              {activeCategory !== 'all' && (
                <span> · {FAQ_CATEGORIES.find((category) => category.id === activeCategory)?.label}</span>
              )}
            </p>
            {(query || activeCategory !== 'all') && (
              <button
                type="button"
                onClick={() => { setQuery(''); setActiveCategory('all') }}
                className="rounded-sm text-xs font-medium text-champagne-dark underline decoration-champagne/60 underline-offset-4 hover:text-midnight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne-dark"
              >
                Tüm filtreleri temizle
              </button>
            )}
          </div>

          {filteredItems.length ? (
            <AccordionPrimitive.Root type="single" collapsible className="w-full" id="faq-results">
              {filteredItems.map((item) => (
                <AccordionPrimitive.Item key={item.id} value={item.id} className="border-b border-midnight/10">
                  <AccordionPrimitive.Header className="flex">
                    <AccordionPrimitive.Trigger className="group flex flex-1 items-center justify-between gap-4 rounded-md py-5 text-left font-serif text-base leading-snug text-midnight transition-colors hover:text-champagne-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne-dark sm:py-6 sm:text-xl">
                      <span>{item.question}</span>
                      <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-midnight/10 text-midnight/55 transition group-data-[state=open]:rotate-180 group-data-[state=open]:border-champagne/50 group-data-[state=open]:text-champagne-dark">
                        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" focusable="false">
                          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionPrimitive.Content className="overflow-hidden text-sm leading-7 text-muted-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <div className="pb-5 pr-6 sm:pb-6 sm:text-[15px]">{item.answer}</div>
                  </AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
              ))}
            </AccordionPrimitive.Root>
          ) : (
            <div id="faq-results" className="rounded-3xl border border-dashed border-champagne/70 bg-white/70 px-5 py-12 text-center sm:px-10 sm:py-16">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-champagne/15 text-champagne-dark">
                <CircleHelp className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-serif text-2xl text-midnight">Bu aramayla eşleşen bir soru bulamadık.</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Farklı bir kelime deneyebilir veya destek ekibimize yazabilirsin.</p>
              <Button asChild className="mt-6 rounded-full bg-midnight px-5 text-ivory hover:bg-midnight/90">
                <a href="mailto:merhaba@momentis.app?subject=MOMENTIS%20destek%20talebi">
                  Bize ulaş <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="container mt-16 sm:mt-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-midnight px-6 py-10 text-center text-ivory sm:px-12 sm:py-14 lg:px-20">
          <span aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-champagne/15" />
          <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-champagne/10" />
          <p className="relative text-[10px] font-medium uppercase tracking-[0.28em] text-champagne">Yanındayız</p>
          <h2 className="relative mt-3 font-serif text-3xl leading-tight sm:text-4xl">Sorunun cevabını bulamadın mı?</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm leading-6 text-ivory/65">Bize yaz; MOMENTIS ekibi yardımcı olmak için burada.</p>
          <Button asChild className="relative mt-7 h-12 rounded-full bg-champagne px-6 text-sm font-medium text-midnight hover:bg-champagne-light">
            <a href="mailto:merhaba@momentis.app?subject=MOMENTIS%20destek%20talebi">
              Bize ulaş <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <p className="relative mt-4 text-xs text-ivory/45">
          veya <a href="mailto:merhaba@momentis.app" className="text-ivory/75 underline decoration-champagne/70 underline-offset-4 hover:text-ivory">merhaba@momentis.app</a>
          </p>
        </div>
      </section>
    </div>
  )
}
