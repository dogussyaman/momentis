'use client'

import { useState } from 'react'
import { ArrowLeft, Check, X } from 'lucide-react'
import { selectVipSiteAndClose } from '@/lib/vip-design/vip-sync'

export function Ozel1DemoBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState(false)
  if (dismissed) return null

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
      window.close()
    } else {
      window.location.href = '/tasarimlar/vip'
    }
  }

  const handleSelect = () => {
    setSelectedNotice(true)
    selectVipSiteAndClose('vip-site-1', 'ozel-1')
  }

  if (selectedNotice) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        <div className="pointer-events-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl border border-emerald-400/40 bg-[#15271d]/95 px-5 py-3.5 text-white shadow-2xl backdrop-blur-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
              <Check className="h-4 w-4 stroke-[3]" />
            </span>
            <div>
              <p className="text-xs font-semibold text-emerald-200">Şablon Seçildi!</p>
              <p className="text-[11px] text-white/85">İlerlemeye bir önceki sayfadan devam edebilirsiniz.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.close()}
            className="shrink-0 rounded-xl bg-white px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#15271d] transition hover:bg-emerald-100 cursor-pointer"
          >
            Sekmeyi Kapat
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-white/15 bg-[#2c302b]/95 px-4 py-3 text-white shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:px-5">
        {/* Back / close button */}
        <button
          type="button"
          onClick={handleClose}
          title="Demoyu kapat ve geri dön"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[9px] uppercase tracking-wider text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Kapat</span>
        </button>

        <span className="h-6 w-px bg-white/15 shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] uppercase tracking-[0.18em] text-[#e7c98f]">Özel-1 · Ivory Atelier</p>
          <p className="truncate text-[10px] text-white/80">Bu konsepti seçip sihirbaza dönebilirsiniz.</p>
        </div>

        {/* Primary CTA: Select template & close tab */}
        <button
          type="button"
          onClick={handleSelect}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#e7c98f] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#332a20] shadow-md transition hover:bg-white hover:text-black active:scale-95 cursor-pointer"
        >
          <Check className="h-3.5 w-3.5 stroke-[3]" />
          <span>Bu Şablonu Seç ve Kapat</span>
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Banner'ı kapat"
          className="shrink-0 rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
