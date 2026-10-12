'use client'

import { useState } from 'react'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { selectVipSiteAndReturn } from '@/lib/vip-design/vip-sync'

interface VipDemoBannerProps {
  siteId: string
  siteSlug: string
  siteTitle: string
  accentColor?: string
  bgClass?: string
}

export function VipDemoBanner({
  siteId,
  siteSlug,
  siteTitle,
  accentColor = '#d3b77e',
  bgClass = 'bg-[#101a2b]/95',
}: VipDemoBannerProps) {
  const [loading, setLoading] = useState(false)

  const handleReturn = () => {
    window.location.href = '/tasarimlar/vip'
  }

  const handleSelect = () => {
    setLoading(true)
    selectVipSiteAndReturn(siteId, siteSlug)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className={`pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-white/15 ${bgClass} px-4 py-3 text-white shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:px-5`}>
        <button
          type="button"
          onClick={handleReturn}
          title="Listeye geri dön"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[9px] uppercase tracking-wider text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Geri Dön</span>
        </button>

        <div className="h-4 w-px bg-white/15" />

        <div className="min-w-0 flex-1 truncate">
          <p className="truncate text-xs font-medium text-white">{siteTitle}</p>
          <p className="truncate text-[10px] text-white/60">Canlı VIP Konsept Demosu</p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleSelect}
          style={{ backgroundColor: accentColor }}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-midnight shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-60 cursor-pointer"
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
      </div>
    </div>
  )
}

export function VipFooterActions({
  siteId,
  siteSlug,
  accentColor = '#d3b77e',
}: {
  siteId: string
  siteSlug: string
  accentColor?: string
}) {
  const [loading, setLoading] = useState(false)

  const handleReturn = () => {
    window.location.href = '/tasarimlar/vip'
  }

  const handleSelect = () => {
    setLoading(true)
    selectVipSiteAndReturn(siteId, siteSlug)
  }

  return (
    <div className="mx-auto grid max-w-xs gap-3 sm:max-w-sm">
      <button
        type="button"
        disabled={loading}
        onClick={handleSelect}
        style={{ backgroundColor: accentColor }}
        className="flex h-11 items-center justify-center gap-2 rounded-full px-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-midnight shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-60 cursor-pointer"
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
