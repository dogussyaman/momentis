'use client'

import { useState } from 'react'
import { ArrowLeft, Check, Loader2, X } from 'lucide-react'
import { selectVipSiteAndReturn } from '@/lib/vip-design/vip-sync'

export function Ozel1DemoBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  if (dismissed) return null

  const handleReturn = () => {
    window.location.href = '/tasarimlar/vip'
  }

  const handleSelect = () => {
    setLoading(true)
    selectVipSiteAndReturn('vip-site-1', 'ozel-1')
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-white/15 bg-[#2c302b]/95 px-4 py-3 text-white shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:px-5">
        <button
          type="button"
          onClick={handleReturn}
          title="Demoyu kapat ve geri dön"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[9px] uppercase tracking-wider text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Geri Dön</span>
        </button>

        <span className="h-6 w-px bg-white/15 shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] uppercase tracking-[0.18em] text-[#e7c98f]">Özel-1 · Ivory Atelier</p>
          <p className="truncate text-[10px] text-white/80">Canlı VIP Konsept Demosu</p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleSelect}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#e7c98f] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#332a20] shadow-md transition hover:bg-white hover:text-black active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Seçiliyor...</span>
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              <span>Şablonu Seç</span>
            </>
          )}
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
