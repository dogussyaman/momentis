'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { listMyVipDesignRequests } from '@/lib/vip-design/mock-service.mjs'
import { VIP_REQUEST_STATUSES, VIP_SITE_TEMPLATES, VIP_INVITATION_TEMPLATES } from '@/lib/vip-design/mock-data.mjs'

function identity(user) {
  return user?.id || user?._id || user?.email || ''
}

export function VipMyRequests() {
  const { user, status: authStatus } = useAuth()
  const [requests, setRequests] = useState([])
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    listMyVipDesignRequests(String(identity(user)))
      .then((items) => { setRequests(items); setState('ready') })
      .catch((cause) => { setError(cause instanceof Error ? cause.message : 'Talepler yüklenemedi.'); setState('error') })
  }, [user])

  if (authStatus === 'loading' || state === 'loading') return <p className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Talepler yükleniyor…</p>
  if (!user) return <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm">VIP taleplerinizi görüntülemek için giriş yapın.</p>

  return (
    <section className="mx-auto max-w-5xl">
      <p className="text-[10px] uppercase tracking-[0.22em] text-champagne-dark">MOMENTIS VIP · Demo talepler</p>
      <h1 className="mt-2 font-serif text-3xl text-midnight sm:text-4xl">VIP Taleplerim</h1>
      <p className="mt-3 max-w-2xl text-xs leading-5 text-muted-foreground">Bu tarayıcıda mock olarak oluşturduğunuz talepler listelenir. Veriler cihazlar arasında eşitlenmez ve gerçek hizmet siparişi değildir.</p>
      {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-xs text-red-700" role="alert">{error}</p>}
      {state === 'ready' && requests.length === 0 && <div className="mt-8 rounded-2xl border border-dashed border-midnight/20 bg-white p-8 text-center"><p className="font-serif text-2xl">Henüz VIP talebiniz yok</p><p className="mt-2 text-sm text-muted-foreground">VIP konseptleri inceleyip demo talebinizi oluşturabilirsiniz.</p><Link href="/tasarimlar/vip" className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-midnight underline underline-offset-4">VIP tasarımları keşfet <ArrowRight className="h-3.5 w-3.5" /></Link></div>}
      <div className="mt-6 space-y-4">
        {requests.map((request) => {
          const site = VIP_SITE_TEMPLATES.find((item) => item.id === request.selectedSiteTemplateId)
          const invite = VIP_INVITATION_TEMPLATES.find((item) => item.id === request.selectedInvitationTemplateId)
          const statusLabel = VIP_REQUEST_STATUSES.find((item) => item.id === request.status)?.label || request.status
          return <article key={request.id} className="rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{new Date(request.createdAt).toLocaleDateString('tr-TR')} · {request.id}</p><h2 className="mt-2 font-serif text-xl">{site?.title || 'VIP Site'}</h2><p className="mt-1 text-xs text-muted-foreground">Hediye davetiye: {invite?.title || 'Seçilmedi'}</p></div><span className="rounded-full bg-champagne/20 px-3 py-1.5 text-[10px] font-medium text-midnight">{statusLabel}</span></div><Link href={`/panel/vip-taleplerim/${encodeURIComponent(request.id)}`} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-midnight/15 px-4 text-xs font-medium hover:bg-ivory">Talep detayını gör <ArrowRight className="h-3.5 w-3.5" /></Link></article>
        })}
      </div>
    </section>
  )
}
