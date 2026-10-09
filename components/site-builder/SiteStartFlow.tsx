'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Eye, Layers3, MousePointer2, Palette, PanelsTopLeft, Plus, Sparkles, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TEMPLATES, type SiteTemplate } from '@/lib/site-builder/templates'

interface SiteStartFlowProps {
  eventTitle: string
  stage: 'intro' | 'templates'
  onBack: () => void
  onContinue: () => void
  onChooseTemplate: (template: SiteTemplate) => void
}

const editorTools = [
  { icon: PanelsTopLeft, title: 'Bölümler', description: 'Kapak, çift, hikâye ve etkinlik gibi içerikleri ekleyin.' },
  { icon: MousePointer2, title: 'Tuval', description: 'Sayfanızı ortadaki alanda görün ve bölümleri düzenleyin.' },
  { icon: Palette, title: 'Tasarım', description: 'Renkleri, yazı tiplerini ve görünümü özelleştirin.' },
  { icon: Layers3, title: 'Katmanlar', description: 'Bölümlerin sırasını ve görünürlüğünü yönetin.' },
]

export function SiteStartFlow({ eventTitle, stage, onBack, onContinue, onChooseTemplate }: SiteStartFlowProps) {
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
                Başlamadan önce editörde neler yapabileceğinize göz atın. Henüz bir site oluşturmadık; önce size uygun şablonu seçeceksiniz.
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
                <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Şimdi siteleri inceleyin</h1>
                <p className="mt-2 text-sm text-[#77746f]">Bir tasarım seçin; içeriklerini editörde dilediğiniz gibi değiştirebilirsiniz.</p>
              </div>
              <Button variant="ghost" onClick={onBack} className="w-fit text-xs text-[#77746f]">
                <ArrowLeft className="mr-2 h-4 w-4" /> Tanıtıma dön
              </Button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((template, index) => (
                <motion.article
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.025, 0.3) }}
                  className="group overflow-hidden rounded-2xl border border-[#e5ded2] bg-white shadow-[0_8px_30px_-24px_rgba(23,32,51,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-24px_rgba(23,32,51,0.36)]"
                >
                  <div className="relative h-44 overflow-hidden bg-[#eee9df]">
                    <img src={template.preview} alt={`${template.name} davet sitesi şablonu`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#172033]/35 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5" aria-label={`${template.name} renk paleti`}>
                      {template.swatches.map((color, colorIndex) => (
                        <span key={`${template.id}-${colorIndex}`} className="h-4 w-4 rounded-full border border-white/80 shadow-sm" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <h2 className="font-serif text-lg">{template.name}</h2>
                    <p className="mt-1 min-h-10 text-xs leading-5 text-[#77746f]">{template.tagline}</p>
                    <Button onClick={() => onChooseTemplate(template)} className="mt-3 h-9 w-full rounded-xl bg-[#172033] text-xs text-white hover:bg-[#25314a]">
                      <Plus className="mr-2 h-3.5 w-3.5" /> Bu tasarımla başla
                    </Button>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.main>
        )}
      </div>
    </div>
  )
}
