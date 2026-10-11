'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, ShieldAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/auth/auth-provider'
import { canManageAdmin, canReadAdmin } from '@/lib/admin/authorization'
import { listAdminVipDesignRequests } from '@/lib/vip-design/mock-service.mjs'
import { VIP_INVITATION_TEMPLATES, VIP_REQUEST_STATUSES, VIP_SITE_TEMPLATES } from '@/lib/vip-design/mock-data.mjs'

export function VipAdminRequests() {
  const { user, status: authStatus } = useAuth()
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!canReadAdmin(user)) return
    const timer = setTimeout(() => {
      listAdminVipDesignRequests({ status, query })
        .then((items) => { setRequests(items); setLoading(false); setError('') })
        .catch((cause) => { setError(cause instanceof Error ? cause.message : 'VIP talepleri yüklenemedi.'); setLoading(false) })
    }, 150)
    return () => clearTimeout(timer)
  }, [user, status, query])

  if (authStatus === 'loading') return <p className="py-16 text-center text-sm text-muted-foreground">Admin oturumu doğrulanıyor…</p>
  if (!canReadAdmin(user)) return <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center"><ShieldAlert className="mx-auto h-7 w-7 text-red-700" /><h1 className="mt-3 font-serif text-2xl">Erişim izni gerekli</h1><p className="mt-2 text-sm text-muted-foreground">VIP talepleri yalnızca mevcut admin/support rolleriyle görüntülenebilir.</p></div>

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-[10px] uppercase tracking-[0.22em] text-champagne-dark">Yönetim · VIP</p>
      <h1 className="mt-2 font-serif text-3xl text-midnight sm:text-4xl">VIP Tasarım Talepleri</h1>
      <p className="mt-3 max-w-3xl text-xs leading-5 text-muted-foreground">Liste yalnızca bu tarayıcıdaki demo kayıtlarını gösterir; gerçek backend, bildirim veya müşteri teslim süreci yoktur. Admin/support mevcut rol kontrolüyle görüntüler; durumu yalnızca admin rolleri değiştirebilir.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Talep ara" value={query} onChange={(event) => { setQuery(event.target.value); setLoading(true) }} placeholder="Talep no, kullanıcı veya e-posta ara" className="h-11 rounded-xl bg-white pl-9" /></div>
        <select aria-label="Duruma göre filtrele" value={status} onChange={(event) => { setStatus(event.target.value); setLoading(true) }} className="h-11 rounded-xl border border-midnight/15 bg-white px-3 text-sm"><option value="all">Tüm durumlar</option>{VIP_REQUEST_STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
      </div>
      {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-xs text-red-700" role="alert">{error}</p>}
      {loading && <p className="mt-8 text-center text-sm text-muted-foreground">Mock kayıtlar yükleniyor…</p>}
      {!loading && !error && requests.length === 0 && <div className="mt-8 rounded-2xl border border-dashed border-midnight/20 bg-white p-10 text-center"><p className="font-serif text-2xl">Demo talep bulunamadı</p><p className="mt-2 text-xs text-muted-foreground">Bu tarayıcıda henüz VIP talep oluşturulmamış veya filtreyle eşleşen kayıt yok.</p></div>}
      {!loading && requests.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-midnight/10 bg-white">
          <div className="hidden grid-cols-[1.1fr_1fr_1fr_1fr_1fr_auto] gap-3 border-b bg-ivory px-5 py-3 text-[9px] uppercase tracking-wider text-muted-foreground lg:grid"><span>Talep / kullanıcı</span><span>Etkinlik</span><span>VIP site</span><span>Hediye davetiye</span><span>Oluşturulma</span><span>Durum</span></div>
          <ul className="divide-y divide-midnight/10">
            {requests.map((request) => {
              const site = VIP_SITE_TEMPLATES.find((item) => item.id === request.selectedSiteTemplateId)
              const invite = VIP_INVITATION_TEMPLATES.find((item) => item.id === request.selectedInvitationTemplateId)
              const label = VIP_REQUEST_STATUSES.find((item) => item.id === request.status)?.label || request.status
              return <li key={request.id} className="grid gap-3 p-4 lg:grid-cols-[1.1fr_1fr_1fr_1fr_1fr_auto] lg:items-center lg:px-5"><div><Link href={`/panel/admin/vip-talepler/${encodeURIComponent(request.id)}`} className="text-xs font-semibold underline-offset-4 hover:underline">{request.id}</Link><p className="mt-1 text-[10px] text-muted-foreground">{request.userName || 'İsimsiz'} · {request.userEmail}</p></div><p className="text-xs">{request.eventDetails.brideName} & {request.eventDetails.groomName}<span className="block text-[10px] text-muted-foreground">{request.eventDetails.date}</span></p><p className="text-xs">{site?.title || '—'}</p><p className="text-xs">{invite?.title || '—'}</p><p className="text-xs">{new Date(request.createdAt).toLocaleDateString('tr-TR')}</p><span className="w-fit rounded-full bg-champagne/20 px-2.5 py-1 text-[9px]">{label}</span></li>
            })}
          </ul>
        </div>
      )}
      <p className="mt-4 text-[10px] text-muted-foreground">{canManageAdmin(user) ? 'Durum veya mock iç not eklemek için talep detayını açın.' : 'Support rolü talepleri görüntüleyebilir; düzenleme yetkisi yoktur.'}</p>
    </section>
  )
}
