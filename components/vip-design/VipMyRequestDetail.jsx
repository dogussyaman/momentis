'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Clock3, Gift, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { fetchVipApi } from '@/lib/vip-design/api-client.mjs'
import { VIP_INVITATION_TEMPLATES, VIP_SITE_TEMPLATES, VIP_WORKFLOW_STATUSES } from '@/lib/vip-design/mock-data.mjs'

export function VipMyRequestDetail({ requestId }) {
  const { user, status: authStatus } = useAuth()
  const [request, setRequest] = useState(null)
  const [vipCreditBalance, setVipCreditBalance] = useState(null)
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    let active = true
    fetchVipApi(`/api/vip/requests/${encodeURIComponent(requestId)}`)
      .then((result) => {
        if (!active) return
        setRequest(result.request)
        setVipCreditBalance(result.vipCreditBalance)
        setState(result.request ? 'ready' : 'empty')
      })
      .catch((cause) => {
        if (!active) return
        setError(cause instanceof Error ? cause.message : 'Talep yüklenemedi.')
        setState('error')
      })
    return () => { active = false }
  }, [requestId, user])

  if (authStatus === 'loading' || state === 'loading') return <p className="py-20 text-center text-sm text-muted-foreground">Talep yükleniyor…</p>
  if (!user) return <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm">Talep detayını görmek için giriş yapın.</p>
  if (state === 'error') return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>
  if (!request) return <div className="rounded-2xl border border-midnight/10 bg-white p-8 text-center"><p className="font-serif text-2xl">Talep bulunamadı</p><Link href="/panel/vip-taleplerim" className="mt-4 inline-block text-xs underline">Taleplerime dön</Link></div>

  const site = VIP_SITE_TEMPLATES.find((item) => item.id === request.selectedSiteTemplateId)
  const invitation = VIP_INVITATION_TEMPLATES.find((item) => item.id === request.selectedInvitationTemplateId)
  const statusLabel = VIP_WORKFLOW_STATUSES.find((item) => item.id === request.status)?.label || request.status
  return (
    <article className="mx-auto max-w-6xl space-y-6">
      <Link href="/panel/vip-taleplerim" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-midnight"><ArrowLeft className="h-3.5 w-3.5" /> Taleplerime dön</Link>
      <header className="relative overflow-hidden rounded-[2rem] bg-midnight px-6 py-7 text-ivory shadow-xl sm:px-9 sm:py-9">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-champagne/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne">MOMENTIS VIP · {request.id}</p><h1 className="mt-3 font-serif text-3xl sm:text-4xl">Talep özeti</h1><p className="mt-3 text-sm text-ivory/65">Oluşturulma {new Date(request.createdAt).toLocaleString('tr-TR')}</p></div>
          <div className="rounded-2xl border border-ivory/10 bg-ivory/5 px-4 py-3"><p className="text-[9px] uppercase tracking-wider text-ivory/50">Güncel aşama</p><span className="mt-1.5 inline-flex rounded-full bg-champagne/20 px-3 py-1.5 text-xs font-semibold text-champagne">{statusLabel}</span></div>
        </div>
        <p className="relative mt-5 max-w-3xl text-[11px] leading-5 text-ivory/55">Bu talepte 2 VIP kredisi kullanıldı. Ücretsiz proje hakkı VIP kredisi değildir. Talebin gönderilmiş olması özel tasarım hizmetinin satın alınmış olduğu anlamına gelmez.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Info title="Mevcut VIP kredi bakiyesi" value={vipCreditBalance === null ? 'Yükleniyor…' : `${vipCreditBalance} kredi`} detail="Yalnızca kullanılabilir etkinlik kredileri VIP talebinde harcanabilir." />
        <Info
          title="Bu talebin kredi / iade durumu"
          value={request.creditStatus?.refundStatus === 'refunded'
            ? `${request.creditStatus.refunded} kredi iade edildi`
            : request.creditStatus?.refundStatus === 'not_refunded_after_production'
              ? `${request.creditStatus.charged} kredi kullanıldı · üretim sonrası iptal nedeniyle iade yok`
              : `${request.creditStatus?.charged || 0} kredi kullanıldı`}
          detail={request.creditStatus?.refundReason || 'Talep başına 2 kredi kullanılır. Ret veya üretim öncesi iptal durumunda kredi iade edilir.'}
        />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Summary icon={Gift} label="VIP site konsepti" value={site?.title || 'Seçilmedi'} />
        <Summary icon={CalendarDays} label="Hediye davetiye" value={invitation?.title || 'Seçilmedi'} />
      </div>
      {request.publishedSite && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-champagne/50 bg-white p-5 shadow-sm">
          <div><h2 className="font-serif text-xl text-midnight">VIP sayfanız yayında</h2><p className="mt-1 text-xs text-muted-foreground">{request.publishedSite.title}</p></div>
          <a href={`/d/${request.publishedSite.slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-full bg-midnight px-5 text-xs font-medium text-white transition hover:bg-midnight/90">Sayfamı görüntüle</a>
        </section>
      )}
      {request.status === 'delivered' && request.giftInvitationOutput && (
        <section className="rounded-3xl border border-champagne/50 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl text-midnight">Hediye davetiye çıktınız</h2>
          <p className="mt-1 text-xs text-muted-foreground">{request.giftInvitationOutput.name}</p>
          <a
            href={`/api/vip/requests/${encodeURIComponent(request.id)}/delivery/invitation`}
            className="mt-4 inline-flex min-h-10 items-center rounded-full bg-midnight px-5 text-xs font-medium text-white transition hover:bg-midnight/90"
            download
          >
            Çıktıyı indir
          </a>
        </section>
      )}
      <section className="grid gap-4 md:grid-cols-2">
        <Info
          title="Çift ve etkinlik"
          value={`${[request.eventDetails?.brideName, request.eventDetails?.groomName].filter(Boolean).join(' & ') || 'İsimsiz Etkinlik'} · ${request.eventDetails?.eventType || 'Özel Etkinlik'}`}
          detail={`${request.eventDetails?.date || 'Belirtilmedi'} ${request.eventDetails?.time || ''} · ${request.eventDetails?.venue || 'Mekân belirtilmedi'} · ${request.eventDetails?.address || 'Adres belirtilmedi'}`}
        />
        <Info
          title="Tasarım tercihleri"
          value={`${request.preferences?.style || 'Standart'} · ${request.preferences?.colors || 'Renk belirtilmedi'}`}
          detail={`${request.preferences?.sections?.join(', ') || 'Belirtilmedi'} ${request.preferences?.description ? `· ${request.preferences.description}` : ''}`}
        />
        <Info
          title="QR albümü"
          value={request.albumPreferences?.wantsAlbum ? 'Talep edildi' : 'Talep edilmedi'}
          detail={request.albumPreferences?.guestPhotoSharing ? 'Misafir fotoğraf paylaşımı istendi.' : 'Misafir paylaşımı istenmedi.'}
        />
        <Info
          title="Yüklenen fotoğraflar"
          value={`${request.uploadedPhotoMetadata?.length || 0} dosya`}
          detail={request.uploadedPhotoMetadata?.map((photo) => photo.uploaded ? `${photo.name} (${Math.round(photo.size / 1024)} KB)` : `${photo.name} (yüklenemedi)`).join(', ') || 'Fotoğraf eklenmedi.'}
        />
      </section>
      {request.uploadedPhotoMetadata.some((photo) => photo.uploaded) && <section className="rounded-3xl border border-midnight/10 bg-white p-5 shadow-sm"><h2 className="font-serif text-xl text-midnight">Eklenen dosyalar</h2><ul className="mt-3 flex flex-wrap gap-2">{request.uploadedPhotoMetadata.filter((photo) => photo.uploaded).map((photo) => <li key={photo.photoId}><a href={`/api/vip/requests/${encodeURIComponent(request.id)}/photos/${encodeURIComponent(photo.photoId)}`} className="inline-flex min-h-10 items-center rounded-xl border border-midnight/10 px-3 text-xs font-medium transition hover:bg-ivory" download>{photo.name} · İndir</a></li>)}</ul></section>}
      <section className="rounded-3xl border border-midnight/10 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage/25 text-midnight"><Clock3 className="h-5 w-5" /></span><div><h2 className="font-serif text-2xl text-midnight">Durum geçmişi</h2><p className="mt-0.5 text-xs text-muted-foreground">Talebinizde yapılan güncellemeler</p></div></div>
        <ol className="mt-6 space-y-4">{request.timeline.map((item, index) => <li key={`${item.createdAt}-${index}`} className="flex gap-3 text-xs"><span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-champagne/20 text-champagne-dark"><ShieldCheck className="h-3.5 w-3.5" /></span><span className="min-w-0"><strong className="block font-medium text-midnight">{VIP_WORKFLOW_STATUSES.find((status) => status.id === item.status)?.label || item.status}</strong><span className="mt-1 block text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleString('tr-TR')}</span></span></li>)}</ol>
      </section>
    </article>
  )
}

function Summary({ icon: Icon, label, value }) {
  return <div className="flex items-center gap-4 rounded-3xl border border-midnight/10 bg-white p-5 shadow-sm"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-champagne/20 text-champagne-dark"><Icon className="h-5 w-5" /></span><span className="min-w-0"><span className="block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span><span className="mt-1 block truncate font-serif text-xl text-midnight">{value}</span></span></div>
}

function Info({ title, value, detail }) {
  return <div className="rounded-3xl border border-midnight/10 bg-white p-5 shadow-sm"><p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p><p className="mt-2 text-sm font-medium text-midnight">{value || 'Belirtilmedi'}</p>{detail && <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>}</div>
}
