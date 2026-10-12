'use client'

import { useState } from 'react'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { selectVipSiteAndReturn } from '@/lib/vip-design/vip-sync'

export function Ozel1FooterActions() {
  const [loading, setLoading] = useState(false)

  const handleReturn = () => {
    window.location.href = '/tasarimlar/vip'
  }

  const handleSelect = () => {
    setLoading(true)
    selectVipSiteAndReturn('vip-site-1', 'ozel-1')
  }

  return (
    <div className="mx-auto grid max-w-xs gap-3 sm:max-w-sm">
      <button
        type="button"
        disabled={loading}
        onClick={handleSelect}
        className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#e7c98f] px-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#332a20] shadow-lg transition hover:bg-white active:scale-95 disabled:opacity-60 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Şablon Seçiliyor...</span>
          </>
        ) : (
          <>
            <Check className="h-4 w-4 stroke-[3]" />
            <span>Şablonu Seç</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleReturn}
        className="flex h-10 items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-[9px] uppercase tracking-wider text-white/70 transition hover:border-white/50 hover:text-white cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Geri Dön / İncelemeye Devam Et</span>
      </button>
    </div>
  )
}
