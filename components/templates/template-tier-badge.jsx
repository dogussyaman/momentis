'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

export function TemplateTierBadge({ type, templateKey }) {
  const [tier, setTier] = useState(null)
  const [templateActive, setTemplateActive] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    const endpoint = type === 'website'
      ? `/api/templates/sb-${encodeURIComponent(templateKey)}`
      : `/api/templates/${encodeURIComponent(templateKey)}`
    fetch(endpoint, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Paket bilgisi alınamadı')
        if (active) {
          setTier(data.tier)
          setTemplateActive(data.active !== false)
        }
      })
      .catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [templateKey, type])

  if (failed) {
    return <Badge variant="outline" className="rounded-full border-destructive/30 text-[10px] text-destructive">Paket bilgisi alınamadı</Badge>
  }
  if (!tier) {
    return <Badge variant="outline" className="rounded-full border-midnight/20 text-[10px]">Paket bilgisi yükleniyor…</Badge>
  }
  if (!templateActive) {
    return <Badge variant="outline" className="rounded-full border-destructive/30 text-[10px] text-destructive">Şu an kullanılamıyor</Badge>
  }
  return tier === 'premium'
    ? <Badge className="rounded-full border-0 bg-champagne text-[10px] uppercase tracking-[0.2em] text-midnight hover:bg-champagne">Premium</Badge>
    : <Badge className="rounded-full border-0 bg-midnight text-[10px] uppercase tracking-[0.2em] text-ivory hover:bg-midnight">Free</Badge>
}
