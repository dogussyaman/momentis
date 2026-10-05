'use client'

import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export const CARD_MESSAGE_TEMPLATES = [
  {
    title: 'Samimi',
    message: 'Bu özel günümüzde mutluluğumuzu sizinle paylaşmak isteriz. Katılımınız bizi çok mutlu edecek.',
  },
  {
    title: 'Romantik',
    message: 'Sevgiyle çıktığımız bu yolda, en güzel anımızı sizinle paylaşmanın heyecanını yaşıyoruz.',
  },
  {
    title: 'Kısa ve zarif',
    message: 'Yeni başlangıcımıza tanıklık etmeniz dileğiyle, bu güzel günümüzde sizleri de aramızda görmek isteriz.',
  },
  {
    title: 'Aileden davet',
    message: 'Ailelerimizin mutluluğuna ortak olmanız ve bu anlamlı günde yanımızda bulunmanız dileğiyle.',
  },
]

export function CardMessageTemplates({ value = '', onSelect }) {
  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <Sparkles className="h-3 w-3 text-champagne-dark" /> Hazır mesaj örnekleri
      </p>
      <div className="grid grid-cols-2 gap-2">
        {CARD_MESSAGE_TEMPLATES.map((item) => {
          const active = value === item.message
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => onSelect(item.message)}
              aria-pressed={active}
              className={cn(
                'group relative min-h-[92px] rounded-xl border p-2.5 text-left transition-colors hover:border-midnight/50',
                active ? 'border-midnight bg-midnight/[0.04] ring-1 ring-midnight/20' : 'border-border bg-white/60'
              )}
            >
              <span className="flex items-center justify-between gap-2 text-[10px] font-semibold text-midnight">
                {item.title}
                {active && <Check className="h-3.5 w-3.5 shrink-0 text-midnight" />}
              </span>
              <span className="mt-1.5 line-clamp-3 block text-[9px] leading-relaxed text-muted-foreground">{item.message}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
