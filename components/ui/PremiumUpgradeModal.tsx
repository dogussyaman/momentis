'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Check, Crown, Sparkles, ArrowRight, X } from 'lucide-react'
import { BILLING_PLANS } from '@/lib/billing/plans'
import { formatPrice } from '@/lib/data/packages'

const PREMIUM_PLANS = Object.values(BILLING_PLANS).filter((p) => p.price > 0)

export function PremiumUpgradeModal({ open, onClose, templateName }: { open: boolean; onClose: () => void; templateName?: string }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[460px] max-h-[calc(100dvh-2rem)] border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
        <div className="relative flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[26px] border border-[#e5dac8] bg-[#faf7f2] shadow-2xl shadow-black/25">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/20 text-white/80 backdrop-blur-md transition hover:bg-black/35 hover:text-white"
            aria-label="Kapat"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Header */}
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#172033] via-[#1d2940] to-[#111827] px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6 text-white">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#c9a96e]/20 blur-2xl" />
            <div className="flex items-center gap-3 sm:gap-3.5 pr-8 sm:pr-0">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4af37] via-[#c59e2b] to-[#996515] shadow-md shadow-[#d4af37]/25">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <DialogHeader className="text-left space-y-0.5 min-w-0 pr-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#d4af37]">
                    Premium Şablon
                  </span>
                </div>
                <DialogTitle className="font-serif text-base sm:text-lg lg:text-xl leading-snug text-white break-words">
                  {templateName ? `"${templateName}"` : 'Bu Şablon'} Premium Pakete Dahil
                </DialogTitle>
                <DialogDescription className="text-[11px] leading-relaxed text-white/70">
                  Bu tasarımla devam etmek ve sınırsız özelliklere erişmek için yükseltin.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* Highlights / Badges */}
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-[#e9e0d3] bg-[#f3ede2] px-4 py-2 sm:px-6 sm:py-2.5">
            {['Tüm Premium Şablonlar', 'Sınırsız Davetli', 'QR Albüm', 'RSVP & Harita'].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-[#5c5549] shadow-xs"
              >
                <Check className="h-2.5 w-2.5 text-[#a67c38]" />
                {item}
              </span>
            ))}
          </div>

          {/* Plans Comparison */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-2.5">
            {PREMIUM_PLANS.map((plan) => {
              const isRecommended = Boolean(plan.highlighted)
              return (
                <div
                  key={plan.id}
                  className={`group relative flex items-center justify-between gap-2.5 sm:gap-3 rounded-2xl border p-3 sm:p-3.5 transition-all ${
                    isRecommended
                      ? 'border-[#c9a96e] bg-gradient-to-r from-[#fffcf7] to-[#fbf4e6] shadow-[0_4px_16px_-6px_rgba(201,169,110,0.35)]'
                      : 'border-[#e7decf] bg-white hover:border-[#cfc3b0]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3 className="font-serif text-sm font-semibold text-[#172033] truncate">{plan.name}</h3>
                      {isRecommended && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#c9a96e] px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider text-white">
                          <Sparkles className="h-2 w-2" /> Popüler
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#787165]">
                      <span className="font-bold text-[#947238]">{formatPrice(plan.price)}</span>
                      <span className="text-[10px] text-[#9b9487]"> · {plan.period}</span>
                    </p>
                  </div>

                  <a
                    href="/fiyatlandirma"
                    className={`inline-flex h-8 shrink-0 items-center gap-1 sm:gap-1.5 rounded-xl px-3 sm:px-3.5 text-xs font-semibold transition ${
                      isRecommended
                        ? 'bg-[#172033] text-white hover:bg-[#25314a] shadow-sm'
                        : 'border border-[#dcd2c1] bg-white text-[#172033] hover:bg-[#f3ece0]'
                    }`}
                  >
                    Seç
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-[#e9e0d3] bg-[#faf7f2] px-4 py-3 sm:px-6 text-center">
            <button
              onClick={onClose}
              className="text-[11px] text-[#8c8579] hover:text-[#172033] transition py-1"
            >
              Şimdilik ücretsiz şablonlarla devam et
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

