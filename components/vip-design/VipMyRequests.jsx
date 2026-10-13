'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Gift, LoaderCircle, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/auth-provider'
import { fetchVipApi } from '@/lib/vip-design/api-client.mjs'
import { VIP_INVITATION_TEMPLATES, VIP_SITE_TEMPLATES, VIP_WORKFLOW_STATUSES } from '@/lib/vip-design/mock-data.mjs'

export function VipMyRequests() {
  const { user, status: authStatus } = useAuth()
  const [requests, setRequests] = useState([])
  const [total, setTotal] = useState(0)
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    let active = true
    setState('loading')
    setError('')
    fetchVipApi('/api/vip/requests')
      .then((result) => {
        if (!active) return
        setRequests(result.items)
        setTotal(result.total)
        setState('ready')
      })
      .catch((cause) => {
        if (!active) return
        setError(cause instanceof Error ? cause.message : 'Talepler yüklenemedi.')
        setState('error')
      })
    return () => { active = false }
  }, [user])

  if (authStatus === 'loading') return <p className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Talepler yükleniyor…</p>
  if (!user) return <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm">VIP taleplerinizi görüntülemek için giriş yapın.</p>

  return (
    <section className="mx-auto max-w-6xl space-y-7">
      <header className="relative overflow-hidden rounded-[2rem] bg-midnight px-6 py-8 text-ivory shadow-xl sm:px-9 sm:py-10">
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-champagne/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-champagne"><span className="h-px w-8 bg-current" /> MOMENTIS VIP · Hesabınız</p>
            <h1 className="mt-4 font-serif text-3xl sm:text-4xl">VIP tasarım taleplerim</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ivory/65">Talep sürecinizi ve güncellemeleri tek bir yerden takip edin. Talep göndermek standart etkinlik kredisi kullanmaz; özel tasarım hizmeti ayrıca değerlendirilir.</p>
          </div>
          <Button asChild className="h-11 w-fit rounded-2xl bg-champagne px-5 text-xs font-semibold text-midnight hover:bg-champagne-light">
            <Link href="/tasarimlar/vip/talep/yeni"><Plus className="mr-2 h-4 w-4" /> Yeni VIP talebi</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard icon={Gift} label="Gönderilen talepler" value={state === 'ready' ? total : '—'} detail="Hesabınıza bağlı toplam VIP talebi" />
        <SummaryCard icon={Sparkles} label="Hizmet kapsamı" value="Ayrı değerlendirme" detail="Talep gönderimi satın alma veya ücretsiz hizmet onayı değildir" tone="gold" />
      </div>

      {error && <p className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{error}</p>}
      {state === 'loading' && <div className="flex min-h-40 items-center justify-center gap-2 rounded-3xl border border-midnight/10 bg-white text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Talepler yükleniyor…</div>}
      {state === 'ready' && requests.length === 0 && (
        <div className="rounded-3xl border border-dashed border-midnight/20 bg-white px-6 py-12 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-champagne/20 text-champagne-dark"><Gift className="h-6 w-6" /></span>
          <h2 className="mt-5 font-serif text-2xl text-midnight">Henüz bir VIP talebiniz yok</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">VIP konseptlerini inceleyip size uygun tasarımla talebinizi başlatabilirsiniz.</p>
          <Button asChild variant="outline" className="mt-6 rounded-xl">
            <Link href="/tasarimlar/vip">VIP tasarımlarını keşfet <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      )}
      {state === 'ready' && requests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-champagne-dark">Başvurularınız</p><h2 className="mt-1 font-serif text-2xl text-midnight">Talep geçmişi</h2></div>
            <span className="rounded-full border border-midnight/10 bg-white px-3 py-1.5 text-xs text-muted-foreground">{total} talep</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {requests.map((request) => {
              const site = VIP_SITE_TEMPLATES.find((item) => item.id === request.selectedSiteTemplateId)
              const invite = VIP_INVITATION_TEMPLATES.find((item) => item.id === request.selectedInvitationTemplateId)
              const status = VIP_WORKFLOW_STATUSES.find((item) => item.id === request.status)
              return (
                <article key={request.id} className="group rounded-3xl border border-midnight/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-champagne/70 hover:shadow-md sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage/25 text-midnight"><Gift className="h-5 w-5" /></span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-champagne/20 px-3 py-1.5 text-[10px] font-semibold text-midnight"><span className="h-1.5 w-1.5 rounded-full bg-champagne-dark" />{status?.label || request.status}</span>
                  </div>
                  <p className="mt-5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{new Date(request.createdAt).toLocaleDateString('tr-TR')} <span className="mx-1.5">·</span> {request.id}</p>
                  <h3 className="mt-2 font-serif text-2xl text-midnight">{site?.title || 'VIP site tasarımı'}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Hediye davetiye: {invite?.title || 'Seçilmedi'}</p>
                  <Link href={`/panel/vip-taleplerim/${encodeURIComponent(request.id)}`} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-midnight/15 px-4 text-xs font-medium text-midnight transition hover:border-midnight hover:bg-midnight hover:text-white">
                    Talep detayını gör <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </Link>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

function SummaryCard({ icon: Icon, label, value, detail, tone = 'sage' }) {
  return (
    <div className="rounded-3xl border border-midnight/10 bg-white p-5 shadow-sm sm:p-6">
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone === 'gold' ? 'bg-champagne/20 text-champagne-dark' : 'bg-sage/25 text-midnight'}`}><Icon className="h-5 w-5" /></span>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-2xl text-midnight">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  )
}
