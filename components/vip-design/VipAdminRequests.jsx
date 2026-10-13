'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock3, FileSearch, Search, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/components/auth/auth-provider'
import { canManageAdmin, canReadAdmin } from '@/lib/admin/authorization'
import { fetchVipApi } from '@/lib/vip-design/api-client.mjs'
import { VIP_INVITATION_TEMPLATES, VIP_SITE_TEMPLATES, VIP_WORKFLOW_STATUSES } from '@/lib/vip-design/mock-data.mjs'

export function VipAdminRequests() {
  const { user, status: authStatus } = useAuth()
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [requests, setRequests] = useState([])
  const [counts, setCounts] = useState({ incoming: 0, processing: 0, completed: 0, all: 0 })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!canReadAdmin(user)) return
    let active = true
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ status, page: String(page), limit: '20' })
      const summaryParams = new URLSearchParams({ status: 'summary' })
      if (query.trim()) {
        params.set('q', query.trim())
        summaryParams.set('q', query.trim())
      }
      try {
        const [result, summary] = await Promise.all([
          fetchVipApi(`/api/admin/vip-requests?${params}`),
          fetchVipApi(`/api/admin/vip-requests?${summaryParams}`),
        ])
        if (!active) return
        setRequests(result.items)
        setTotal(result.total)
        setTotalPages(result.totalPages)
        setCounts(summary.counts)
        setLoading(false)
        setError('')
      } catch (cause) {
        if (!active) return
        setError(cause instanceof Error ? cause.message : 'VIP talepleri yüklenemedi.')
        setLoading(false)
      }
    }, 150)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [user, status, query, page])

  if (authStatus === 'loading') return <p className="py-16 text-center text-sm text-muted-foreground">Admin oturumu doğrulanıyor…</p>
  if (!canReadAdmin(user)) return <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center"><ShieldAlert className="mx-auto h-7 w-7 text-red-700" /><h1 className="mt-3 font-serif text-2xl">Erişim izni gerekli</h1><p className="mt-2 text-sm text-muted-foreground">VIP talepleri yalnızca mevcut admin/support rolleriyle görüntülenebilir.</p></div>

  return (
    <section className="mx-auto max-w-7xl space-y-7">
      <header className="relative overflow-hidden rounded-[2rem] bg-midnight px-6 py-8 text-ivory shadow-xl sm:px-9 sm:py-10">
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-champagne/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-champagne"><span className="h-px w-8 bg-current" /> Yönetim · VIP iş akışı</p>
            <h1 className="mt-4 font-serif text-3xl sm:text-4xl">VIP tasarım talepleri</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ivory/65">Gelen talepleri inceleyin, süreci güncelleyin ve kullanıcıya net aşama bilgisi verin. Support talepleri görüntüleyebilir; yalnızca admin rolleri değişiklik yapabilir.</p>
          </div>
          <div className="flex min-w-40 items-center gap-3 rounded-2xl border border-ivory/10 bg-ivory/5 px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-champagne/15 text-champagne"><Clock3 className="h-5 w-5" /></span>
            <div><p className="text-[9px] uppercase tracking-wider text-ivory/55">{status === 'incoming' ? 'Gelen talepler' : status === 'processing' ? 'İşlemdeki talepler' : status === 'completed' ? 'Sonuçlanan talepler' : 'Toplam talep'}</p><p className="mt-0.5 font-serif text-2xl">{loading ? '—' : total}</p></div>
          </div>
        </div>
      </header>
      <div className="grid gap-3 rounded-3xl border border-midnight/10 bg-white p-4 shadow-sm sm:grid-cols-[1fr_240px] sm:p-5">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Talep ara" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); setLoading(true) }} placeholder="Talep no, kullanıcı veya e-posta ara" className="h-11 rounded-xl bg-ivory/50 pl-9" /></div>
        <p className="flex items-center gap-2 px-2 text-xs text-muted-foreground"><Clock3 className="h-4 w-4 text-champagne-dark" /> Kullanıcıya her aşamada güncel durum iletilir.</p>
      </div>
      <Tabs value={status} onValueChange={(value) => { setStatus(value); setPage(1); setLoading(true) }}>
        <TabsList aria-label="VIP talep aşamaları" className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-midnight/10 bg-white p-1.5 shadow-sm sm:grid-cols-4">
          <TabsTrigger value="all" className="min-h-11 gap-2 rounded-xl text-xs data-[state=active]:bg-midnight data-[state=active]:text-white [&[data-state=active]>span]:bg-white/15 [&[data-state=active]>span]:text-white">Tümü <Count>{counts.all}</Count></TabsTrigger>
          <TabsTrigger value="incoming" className="min-h-11 gap-2 rounded-xl text-xs data-[state=active]:bg-midnight data-[state=active]:text-white [&[data-state=active]>span]:bg-white/15 [&[data-state=active]>span]:text-white">Gelenler <Count>{counts.incoming}</Count></TabsTrigger>
          <TabsTrigger value="processing" className="min-h-11 gap-2 rounded-xl text-xs data-[state=active]:bg-midnight data-[state=active]:text-white [&[data-state=active]>span]:bg-white/15 [&[data-state=active]>span]:text-white">İşlemdekiler <Count>{counts.processing}</Count></TabsTrigger>
          <TabsTrigger value="completed" className="min-h-11 gap-2 rounded-xl text-xs data-[state=active]:bg-midnight data-[state=active]:text-white [&[data-state=active]>span]:bg-white/15 [&[data-state=active]>span]:text-white">Sonuçlananlar <Count>{counts.completed}</Count></TabsTrigger>
        </TabsList>
      </Tabs>
      {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-xs text-red-700" role="alert">{error}</p>}
      {loading && <div className="flex min-h-40 items-center justify-center gap-2 rounded-3xl border border-midnight/10 bg-white text-sm text-muted-foreground"><FileSearch className="h-4 w-4 animate-pulse" /> Talepler yükleniyor…</div>}
      {!loading && !error && requests.length === 0 && <div className="rounded-3xl border border-dashed border-midnight/20 bg-white p-10 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ivory text-muted-foreground"><FileSearch className="h-5 w-5" /></span><p className="mt-4 font-serif text-2xl">Talep bulunamadı</p><p className="mt-2 text-sm text-muted-foreground">Seçili filtrelerle eşleşen VIP talebi yok.</p></div>}
      {!loading && requests.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-midnight/10 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.1fr_1fr_1fr_1fr_1fr_auto] gap-3 border-b bg-ivory px-5 py-3 text-[9px] uppercase tracking-wider text-muted-foreground lg:grid"><span>Talep / kullanıcı</span><span>Etkinlik</span><span>VIP site</span><span>Hediye davetiye</span><span>Oluşturulma</span><span>Durum</span></div>
          <ul className="divide-y divide-midnight/10">
            {requests.map((request) => {
              const site = VIP_SITE_TEMPLATES.find((item) => item.id === request.selectedSiteTemplateId)
              const invite = VIP_INVITATION_TEMPLATES.find((item) => item.id === request.selectedInvitationTemplateId)
              const label = VIP_WORKFLOW_STATUSES.find((item) => item.id === request.status)?.label || request.status
              return <li key={request.id} className="grid gap-3 p-4 transition hover:bg-ivory/40 lg:grid-cols-[1.15fr_1fr_1fr_1fr_0.75fr_auto] lg:items-center lg:px-5"><div><Link href={`/panel/admin/vip-talepler/${encodeURIComponent(request.id)}`} className="text-xs font-semibold text-midnight underline-offset-4 hover:underline">{request.user_snapshot?.name || 'İsimsiz'} <ArrowRight className="ml-1 inline h-3 w-3" /></Link><p className="mt-1 text-[10px] text-muted-foreground">{request.user_snapshot?.email} · {request.id}</p></div><p className="text-xs">{request.eventDetails.brideName} & {request.eventDetails.groomName}<span className="block text-[10px] text-muted-foreground">{request.eventDetails.date}</span></p><p className="text-xs">{site?.title || '—'}</p><p className="text-xs">{invite?.title || '—'}</p><p className="text-xs">{new Date(request.createdAt).toLocaleDateString('tr-TR')}</p><span className="w-fit rounded-full bg-champagne/20 px-2.5 py-1.5 text-[10px] font-medium">{label}</span></li>
            })}
          </ul>
        </div>
      )}
      {!loading && !error && totalPages > 1 && <nav aria-label="VIP talep sayfaları" className="flex items-center justify-between rounded-2xl border border-midnight/10 bg-white p-3"><p className="text-xs text-muted-foreground">{total} talep · Sayfa {page} / {totalPages}</p><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage((current) => current - 1); setLoading(true) }}>Önceki</Button><Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => { setPage((current) => current + 1); setLoading(true) }}>Sonraki</Button></div></nav>}
      <p className="text-[10px] text-muted-foreground">{canManageAdmin(user) ? 'Durum ve admin iç notu için talep detayını açın.' : 'Support rolü talepleri görüntüleyebilir; düzenleme yetkisi yoktur.'}</p>
    </section>
  )
}

function Count({ children }) {
  return <span className="rounded-full bg-ivory px-2 py-0.5 text-[10px] tabular-nums text-midnight data-[state=active]:bg-white/15 data-[state=active]:text-white">{children}</span>
}
