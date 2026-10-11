'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TemplateStartButton({ templateKey, isWebsite }) {
  const [state, setState] = useState('loading')

  useEffect(() => {
    let active = true
    const endpoint = isWebsite
      ? `/api/templates/sb-${encodeURIComponent(templateKey.slice(3))}`
      : `/api/templates/${encodeURIComponent(templateKey)}`
    fetch(endpoint, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Şablon durumu alınamadı')
        if (active) setState(data.active === false ? 'inactive' : 'active')
      })
      .catch(() => { if (active) setState('error') })
    return () => { active = false }
  }, [isWebsite, templateKey])

  if (state !== 'active') {
    const label = state === 'inactive' ? 'Şablon şu an kullanılamıyor' : state === 'error' ? 'Şablon durumu alınamadı' : 'Şablon kontrol ediliyor…'
    return <Button size="lg" disabled className="h-14 flex-1 rounded-2xl text-[12px] uppercase tracking-[0.12em]">{label}</Button>
  }

  return (
    <Button asChild size="lg" className="group h-14 flex-1 rounded-2xl bg-midnight text-[12px] uppercase tracking-[0.2em] text-ivory hover:bg-midnight-700">
      <Link href={`/kayit?tasarim=${encodeURIComponent(templateKey)}`} data-testid="start-with-template">Bu Tasarımla Başla <ArrowRight className="ml-3 h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" /></Link>
    </Button>
  )
}
