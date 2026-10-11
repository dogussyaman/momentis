'use client'

import { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { selectVipSiteAndClose } from '@/lib/vip-design/vip-sync'

export function Ozel1FooterActions() {
  const [selectedNotice, setSelectedNotice] = useState(false)

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
      <div className="mx-auto max-w-sm rounded-2xl border border-emerald-400/40 bg-[#15271d]/90 p-5 text-center text-white shadow-xl backdrop-blur-md animate-in fade-in">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
          <Check className="h-5 w-5 stroke-[3]" />
        </div>
        <p className="mt-3 text-xs font-semibold text-emerald-200">Şablon Başarıyla Seçildi!</p>
        <p className="mt-1 text-[11px] text-white/80 leading-relaxed">
          İlerlemeye bir önceki sayfadan (talep sihirbazı sekmesinden) devam edebilirsiniz.
        </p>
        <button
          type="button"
          onClick={() => window.close()}
          className="mt-4 rounded-xl bg-white px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#15271d] shadow transition hover:bg-emerald-100 cursor-pointer"
        >
          Bu Sekmeyi Kapat
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-xs gap-3 sm:max-w-sm">
      <button
        type="button"
        onClick={handleSelect}
        className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#e7c98f] px-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#332a20] shadow-lg transition hover:bg-white active:scale-95 cursor-pointer"
      >
        <Check className="h-4 w-4 stroke-[3]" />
        <span>Bu Şablonu Seç ve Kapat</span>
      </button>

      <button
        type="button"
        onClick={handleClose}
        className="flex h-10 items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-[9px] uppercase tracking-wider text-white/70 transition hover:border-white/50 hover:text-white cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Demoyu Kapat / Geri Dön</span>
      </button>
    </div>
  )
}
