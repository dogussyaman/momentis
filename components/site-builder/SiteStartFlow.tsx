'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Eye, Layers3, MousePointer2, Palette, PanelsTopLeft, Plus, Search, Sparkles, Type, Crown, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TEMPLATES, type SiteTemplate } from '@/lib/site-builder/templates'
import { PremiumUpgradeModal } from '@/components/ui/PremiumUpgradeModal'
import { cn } from '@/lib/utils'
import { SITE_TEMPLATE_CATEGORIES, filterSiteTemplates, type SiteTemplateCategory } from '@/lib/site-builder/template-categories'
import { SiteTemplatePreviewDialog, SiteTemplateThumbnail } from './SiteTemplatePreview'

interface SiteStartFlowProps {
  eventTitle: string
  eventData?: Record<string, any>
  stage: 'intro' | 'templates'
  canUsePremiumTemplates?: boolean
  onBack: () => void
  onContinue: () => void
  onChooseTemplate: (template: SiteTemplate) => void
  onOpenGiftCampaign?: () => void
}

const editorTools = [
  { icon: PanelsTopLeft, title: 'Bölümler', description: 'Kapak, çift, hikâye ve etkinlik gibi içerikleri ekleyin.' },
  { icon: MousePointer2, title: 'Tuval', description: 'Sayfanızı ortadaki alanda görün ve bölümleri düzenleyin.' },
  { icon: Palette, title: 'Tasarım', description: 'Renkleri, yazı tiplerini ve görünümü özelleştirin.' },
  { icon: Layers3, title: 'Katmanlar', description: 'Bölümlerin sırasını ve görünürlüğünü yönetin.' },
]

export function SiteStartFlow({ eventTitle, eventData, stage, canUsePremiumTemplates, onBack, onContinue, onChooseTemplate, onOpenGiftCampaign }: SiteStartFlowProps) {
  const [templateTiers, setTemplateTiers] = useState<Record<string, string>>({})
  const [availableTemplateIds, setAvailableTemplateIds] = useState<string[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState('')
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; templateName: string }>({ open: false, templateName: '' })
  const [templateQuery, setTemplateQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<SiteTemplateCategory>('Tümü')
  const [previewTemplate, setPreviewTemplate] = useState<SiteTemplate | null>(null)

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    setTemplatesError('')
    try {
      const response = await fetch('/api/templates?type=website', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Site şablonları yüklenemedi')
      const items: { id: string; tier: string }[] = data.items || []
      setTemplateTiers(Object.fromEntries(items.map((item) => [item.id.slice(3), item.tier])))
      setAvailableTemplateIds(items.map((item) => item.id.slice(3)))
    } catch (error) {
      setTemplatesError(error instanceof Error ? error.message : 'Site şablonları yüklenemedi')
      setAvailableTemplateIds([])
    } finally {
      setTemplatesLoading(false)
    }
  }, [])

  useEffect(() => { loadTemplates() }, [loadTemplates])

  const visibleTemplates = filterSiteTemplates(
    TEMPLATES.filter((template) => availableTemplateIds.includes(template.id)),
    selectedCategory,
    templateQuery,
  )

  return (
    <div className="min-h-dvh overflow-y-auto bg-[#f7f4ee] px-5 py-8 text-[#172033] sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#94805c]">Momentis · Site stüdyosu</p>
            <p className="mt-1 font-serif text-sm text-[#172033]">{eventTitle || 'Yeni etkinliğiniz'}</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#81796d]">
            <span className={stage === 'intro' ? 'text-[#172033]' : ''}>Editörü tanıyın</span>
            <span className="h-px w-6 bg-[#d9d0c2]" />
            <span className={stage === 'templates' ? 'text-[#172033]' : ''}>Şablon seçin</span>
          </div>
        </div>

        {stage === 'intro' ? (
          <motion.main
            key="intro"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl"
          >
            <div className="mb-10 text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e5dac8] bg-white text-[#b18a4a] shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl">Davet sitenizi birlikte hazırlayalım</h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#77746f]">
                Düğün sitenizin başlangıç düzenini açın. Kapak, gezinme, hikâye, program, RSVP ve QR albümünü etkinliğinize göre düzenleyin.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {editorTools.map(({ icon: Icon, title, description }, index) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="flex gap-4 rounded-2xl border border-[#e9e1d6] bg-white p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6f1e8] text-[#8f744b]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{title}</h2>
                    <p className="mt-1 text-xs leading-5 text-[#77746f]">{description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-2xl border border-[#e9e1d6] bg-[#f1ece3] p-4">
                <Type className="mt-0.5 h-4 w-4 shrink-0 text-[#8f744b]" />
                <p className="text-xs leading-5 text-[#68645d]">Sağdaki özellik panelinden metinleri, görselleri ve bölüm ayarlarını değiştirebilirsiniz.</p>
              </div>
              <div className="flex gap-3 rounded-2xl border border-[#e9e1d6] bg-[#f1ece3] p-4">
                <Eye className="mt-0.5 h-4 w-4 shrink-0 text-[#8f744b]" />
                <p className="text-xs leading-5 text-[#68645d]">Önizleme ile sitenizin mobil ve masaüstünde nasıl göründüğünü kontrol edebilirsiniz.</p>
              </div>
            </div>

            <div className="mt-9 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
              <Button variant="ghost" onClick={onBack} className="text-xs text-[#77746f]">
                <ArrowLeft className="mr-2 h-4 w-4" /> Geri dön
              </Button>
              <Button onClick={onContinue} className="h-11 rounded-full bg-[#172033] px-6 text-xs text-white hover:bg-[#25314a]">
                Şablonları incele ve seç <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.main>
        ) : (
          <motion.main
            key="templates"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a28453]">İlk adım · Görünümünüzü seçin</p>
                <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Düğün sitenizin başlangıç düzeni</h1>
                <p className="mt-2 text-sm text-[#77746f]">Düğün odaklı başlangıç düzeninizi seçin; tüm bölümler, içerik ve görseller stüdyoda sizin kontrolünüzde.</p>
              </div>
              <Button variant="ghost" onClick={onBack} className="w-fit text-xs text-[#77746f]">
                <ArrowLeft className="mr-2 h-4 w-4" /> Tanıtıma dön
              </Button>
            </div>

            {onOpenGiftCampaign && (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#e4d5b8] bg-[#f3eddf] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#967746]">MOMENTIS seçkisi</p>
                  <h2 className="mt-1 font-serif text-lg">Site Alımına Özel Hediyen</h2>
                  <p className="mt-1 text-xs leading-5 text-[#77746f]">Site tasarımınıza eşlik edecek özel davetiye seçeneklerini de inceleyin.</p>
                </div>
                <Button type="button" variant="outline" onClick={onOpenGiftCampaign} className="shrink-0 rounded-xl border-[#caba9d] bg-white">
                  Davetiye seçeneklerini incele <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {!templatesLoading && !templatesError && availableTemplateIds.length > 0 && (
              <section className="mb-6 rounded-2xl border border-[#e8e0d4] bg-white p-4 shadow-[0_10px_28px_-24px_rgba(23,32,51,0.22)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a7a48]">Size uygun stili bulun</p>
                    <p className="mt-1 text-xs text-[#77746f]">Önce görünümü inceleyin; beğendiğiniz tasarımı sonradan tamamen düzenleyebilirsiniz.</p>
                  </div>
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#968c7d]" />
                    <input
                      type="search"
                      value={templateQuery}
                      onChange={(event) => setTemplateQuery(event.target.value)}
                      placeholder="Stil veya şablon ara..."
                      aria-label="Site şablonu ara"
                      className="h-10 w-full rounded-xl border border-[#e6ded2] bg-[#fbf9f5] pl-9 pr-3 text-xs text-[#172033] outline-none transition focus:border-[#b99a68] focus:ring-2 focus:ring-[#b99a68]/15"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {SITE_TEMPLATE_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      aria-pressed={selectedCategory === category}
                      className={cn(
                        'shrink-0 rounded-full border px-3.5 py-2 text-[10px] font-medium transition',
                        selectedCategory === category
                          ? 'border-[#172033] bg-[#172033] text-white shadow-sm'
                          : 'border-[#e7e0d7] bg-white text-[#67645e] hover:border-[#b99a68] hover:bg-[#fbf8f2]'
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-[#8a8277]">
                  <span>{visibleTemplates.length} şablon</span>
                  <span>Önizleme gerçek sayfa düzenini gösterir</span>
                </div>
              </section>
            )}

            {templatesLoading ? (
              <p role="status" className="rounded-2xl border border-[#e5ded2] bg-white p-6 text-sm text-[#77746f]">Kullanılabilir site şablonları yükleniyor…</p>
            ) : templatesError ? (
              <div className="rounded-2xl border border-red-200 bg-white p-6" role="alert">
                <p className="text-sm text-red-700">{templatesError}</p>
                <Button variant="outline" onClick={loadTemplates} className="mt-4">Tekrar dene</Button>
              </div>
            ) : availableTemplateIds.length === 0 ? (
              <p className="rounded-2xl border border-[#e5ded2] bg-white p-6 text-sm text-[#77746f]">Şu anda seçilebilir site şablonu bulunmuyor.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleTemplates.map((template, index) => {
                const isPremium = templateTiers[template.id] === 'premium'
                const isLocked = isPremium && !canUsePremiumTemplates

                return (
                  <motion.article
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.025, 0.3) }}
                    className={cn(
                      'group overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5',
                      isLocked
                        ? 'border-amber-200/80 shadow-[0_8px_30px_-24px_rgba(180,130,50,0.3)] hover:shadow-[0_18px_38px_-24px_rgba(180,130,50,0.4)]'
                        : 'border-[#e5ded2] shadow-[0_8px_30px_-24px_rgba(23,32,51,0.45)] hover:shadow-[0_18px_38px_-24px_rgba(23,32,51,0.36)]'
                    )}
                  >
                    <div className="relative h-44 overflow-hidden bg-[#eee9df]">
                      <SiteTemplateThumbnail template={template} className="h-full w-full transition-transform duration-300 group-hover:scale-[1.01]" />
                      
                      {/* Tier Badge */}
                      <Badge
                        variant="outline"
                        className={cn(
                          'absolute right-3 top-3 shadow-sm flex items-center gap-1 font-medium',
                          isPremium
                            ? 'border-0 bg-gradient-to-r from-[#d4af37] via-[#c59e2b] to-[#b8860b] text-white hover:opacity-95'
                            : 'border border-white/80 bg-white text-[#172033] hover:bg-white'
                        )}
                      >
                        {isPremium ? (
                          <>
                            <Crown className="h-3 w-3" /> Premium
                          </>
                        ) : (
                          'Free'
                        )}
                      </Badge>

                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5" aria-label={`${template.name} renk paleti`}>
                        {template.swatches.map((color, colorIndex) => (
                          <span key={`${template.id}-${colorIndex}`} className="h-4 w-4 rounded-full border border-white/80 shadow-sm" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-serif text-lg font-medium text-[#172033]">{template.name}</h2>
                        {isLocked && (
                          <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700 border border-amber-200">
                            <Lock className="h-2.5 w-2.5" /> Kilitli
                          </span>
                        )}
                      </div>
                      <p className="mt-1 min-h-10 text-xs leading-5 text-[#77746f]">{template.tagline}</p>
                      <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setPreviewTemplate(template)}
                          className="h-9 rounded-xl border-[#e3d9ca] bg-white px-3 text-[10px] font-medium text-[#172033] hover:bg-[#f8f4ed]"
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> Önizle
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            if (isLocked) {
                              setUpgradeModal({ open: true, templateName: template.name })
                              return
                            }
                            onChooseTemplate(template)
                          }}
                          className={cn(
                            'h-9 min-w-0 rounded-xl px-3 text-[10px] font-medium transition sm:text-xs',
                            isLocked
                              ? 'border border-amber-500/30 bg-gradient-to-r from-[#172033] to-[#25314a] text-amber-300 shadow-sm hover:text-amber-200'
                              : 'bg-[#172033] text-white hover:bg-[#25314a]'
                          )}
                        >
                          {isLocked ? (
                            <>
                              <Crown className="mr-1.5 h-3.5 w-3.5 shrink-0 text-amber-400" /> Kilidi Aç
                            </>
                          ) : (
                            <>
                              <Plus className="mr-1.5 h-3.5 w-3.5 shrink-0" /> Seç
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
            {visibleTemplates.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#e5ded2] bg-white p-8 text-center">
                <Search className="mx-auto h-5 w-5 text-[#b0a594]" />
                <p className="mt-3 text-sm font-medium text-[#172033]">Bu filtrelerle eşleşen şablon bulunamadı.</p>
                <p className="mt-1 text-xs text-[#77746f]">Farklı bir arama yapın veya başka bir stil seçin.</p>
                <Button type="button" variant="outline" onClick={() => { setTemplateQuery(''); setSelectedCategory('Tümü') }} className="mt-4 rounded-full border-[#ded4c5] text-xs">Filtreleri temizle</Button>
              </div>
            )}
              </div>
            )}
          </motion.main>
        )}
      </div>

      <SiteTemplatePreviewDialog
        template={previewTemplate}
        eventData={eventData}
        open={Boolean(previewTemplate)}
        onOpenChange={(open) => { if (!open) setPreviewTemplate(null) }}
        onUseTemplate={(template) => {
          const isPremium = templateTiers[template.id] === 'premium'
          if (isPremium && !canUsePremiumTemplates) {
            setUpgradeModal({ open: true, templateName: template.name })
            setPreviewTemplate(null)
            return
          }
          setPreviewTemplate(null)
          onChooseTemplate(template)
        }}
      />
      <PremiumUpgradeModal
        open={upgradeModal.open}
        templateName={upgradeModal.templateName}
        onClose={() => setUpgradeModal({ open: false, templateName: '' })}
      />
    </div>
  )
}

