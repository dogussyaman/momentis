'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'
import { getMyVipDesignRequest } from '@/lib/vip-design/mock-service.mjs'
import { VIP_REQUEST_STATUSES, VIP_SITE_TEMPLATES, VIP_INVITATION_TEMPLATES } from '@/lib/vip-design/mock-data.mjs'

export function VipMyRequestDetail({ requestId }) {
  const { user, status: authStatus } = useAuth()
  const [request, setRequest] = useState(null)
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    getMyVipDesignRequest(requestId, String(user.id || user._id || user.email || ''))
      .then((result) => { setRequest(result); setState(result ? 'ready' : 'empty') })
      .catch((cause) => { setError(cause instanceof Error ? cause.message : 'Talep yüklenemedi.'); setState('error') })
  }, [requestId, user])

  if (authStatus === 'loading' || state === 'loading') return <p className="py-20 text-center text-sm text-muted-foreground">Talep yükleniyor…</p>
  if (state === 'error') return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>
  if (!request) return <div className="rounded-2xl border border-midnight/10 bg-white p-8 text-center"><p className="font-serif text-2xl">Talep bulunamadı</p><Link href="/panel/vip-taleplerim" className="mt-4 inline-block text-xs underline">Taleplerime dön</Link></div>

  const site = VIP_SITE_TEMPLATES.find((item) => item.id === request.selectedSiteTemplateId)
  const invitation = VIP_INVITATION_TEMPLATES.find((item) => item.id === request.selectedInvitationTemplateId)
  const statusLabel = VIP_REQUEST_STATUSES.find((item) => item.id === request.status)?.label || request.status
  return (
    <article className="mx-auto max-w-4xl">
      <Link href="/panel/vip-taleplerim" className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-midnight">← VIP Taleplerim</Link>
      <div className="mt-5 rounded-[26px] border border-midnight/10 bg-white p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[9px] uppercase tracking-widest text-muted-foreground">Demo talep · {request.id}</p><h1 className="mt-2 font-serif text-3xl">Talep özeti</h1></div><span className="rounded-full bg-champagne/20 px-3 py-1.5 text-xs">{statusLabel}</span></div>
        <p className="mt-3 text-xs text-muted-foreground">Oluşturulma: {new Date(request.createdAt).toLocaleString('tr-TR')} · Mock kayıt yalnızca bu tarayıcıda tutulur.</p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <Info title="VIP site konsepti" value={site?.title} />
          <Info title="Hediye davetiye" value={invitation?.title} />
          <Info title="Çift / etkinlik" value={`${request.eventDetails.brideName} & ${request.eventDetails.groomName} · ${request.eventDetails.eventType}`} detail={`${request.eventDetails.date} ${request.eventDetails.time || ''} · ${request.eventDetails.venue} · ${request.eventDetails.address}`} />
          <Info title="Tasarım tercihleri" value={`${request.preferences.style} · ${request.preferences.colors || 'Renk belirtilmedi'}`} detail={`${request.preferences.sections.join(', ')} ${request.preferences.description ? `· ${request.preferences.description}` : ''}`} />
          <Info title="QR albümü" value={request.albumPreferences.wantsAlbum ? 'Talep edildi' : 'Talep edilmedi'} detail={request.albumPreferences.guestPhotoSharing ? 'Misafir fotoğraf paylaşımı istendi.' : 'Misafir paylaşımı istenmedi.'} />
          <Info title="Görsel metadata" value={`${request.uploadedPhotoMetadata.length} dosya kaydı`} detail={request.uploadedPhotoMetadata.map((photo) => `${photo.name} (${photo.type}, ${Math.round(photo.size / 1024)} KB)`).join(', ') || 'Fotoğraf seçilmedi. Görseller yüklenmedi.'} />
        </div>
        <section className="mt-7 border-t border-midnight/10 pt-5"><h2 className="font-serif text-xl">Durum geçmişi</h2><ol className="mt-4 space-y-3">{request.timeline.map((item, index) => <li key={`${item.createdAt}-${index}`} className="flex gap-3 text-xs"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-champagne-dark" /><span><strong>{VIP_REQUEST_STATUSES.find((status) => status.id === item.status)?.label || item.status}</strong><span className="ml-2 text-muted-foreground">{new Date(item.createdAt).toLocaleString('tr-TR')}</span><span className="mt-1 block text-muted-foreground">{item.note}</span></span></li>)}</ol></section>
      </div>
    </article>
  )
}

function Info({ title, value, detail }) {
  return <div className="rounded-2xl bg-ivory/70 p-4"><p className="text-[9px] uppercase tracking-wider text-muted-foreground">{title}</p><p className="mt-2 text-sm font-medium">{value || 'Belirtilmedi'}</p>{detail && <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{detail}</p>}</div>
}
