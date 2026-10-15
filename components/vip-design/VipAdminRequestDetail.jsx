'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLink, PencilRuler, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/components/auth/auth-provider'
import { canManageAdmin, canReadAdmin } from '@/lib/admin/authorization'
import { fetchVipApi } from '@/lib/vip-design/api-client.mjs'
import { VIP_CANCELLATION_REASONS, VIP_INVITATION_TEMPLATES, VIP_SITE_TEMPLATES, VIP_STATUS_TRANSITIONS, VIP_WORKFLOW_STATUSES } from '@/lib/vip-design/mock-data.mjs'

export function VipAdminRequestDetail({ requestId }) {
  const router = useRouter()
  const { user, status: authStatus } = useAuth()
  const [request, setRequest] = useState(null)
  const [status, setStatus] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [invitationFile, setInvitationFile] = useState(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [creatingSiteDraft, setCreatingSiteDraft] = useState(false)
  const [siteDraftError, setSiteDraftError] = useState('')
  const [uploadingInvitation, setUploadingInvitation] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    if (!canReadAdmin(user)) return
    let active = true
    fetchVipApi(`/api/admin/vip-requests/${encodeURIComponent(requestId)}`)
      .then((result) => {
        if (!active) return
        setRequest(result.request)
        setStatus(result.request?.status || '')
        setLoading(false)
      })
      .catch((cause) => {
        if (!active) return
        setError(cause instanceof Error ? cause.message : 'Talep açılamadı.')
        setLoading(false)
      })
    return () => { active = false }
  }, [requestId, user])

  const availableStatuses = useMemo(() => {
    if (!request) return []
    const allowed = new Set([request.status, ...(VIP_STATUS_TRANSITIONS[request.status] || [])])
    return VIP_WORKFLOW_STATUSES.filter((item) =>
      allowed.has(item.id) && !(item.id === 'delivered' && (
        request.site_draft?.status !== 'published' || !request.gift_invitation_output
      ))
    )
  }, [request])

  const save = async () => {
    if (!request) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const body = {}
      if (status !== request.status) body.status = status
      if (note.trim()) body.note = note.trim()
      if (status === 'cancelled') body.cancellationReason = cancellationReason
      const result = await fetchVipApi(`/api/admin/vip-requests/${encodeURIComponent(requestId)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      const refreshed = await fetchVipApi(`/api/admin/vip-requests/${encodeURIComponent(requestId)}`)
      setRequest(refreshed.request)
      setStatus(refreshed.request.status)
      setNote('')
      setSaved(true)
      window.dispatchEvent(new Event('vip-request-updated'))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Talep güncellenemedi.')
    } finally {
      setSaving(false)
    }

    const createSiteDraft = async () => {
      setCreatingSiteDraft(true)
      setSiteDraftError('')
      try {
        await fetchVipApi(`/api/admin/vip-requests/${encodeURIComponent(requestId)}/site-draft`, {
          method: 'POST',
          body: JSON.stringify({}),
        })
        router.push(`/panel/admin/vip-talepler/${encodeURIComponent(requestId)}/site`)
      } catch (cause) {
        setSiteDraftError(cause instanceof Error ? cause.message : 'VIP site taslağı oluşturulamadı.')
      } finally {
        setCreatingSiteDraft(false)
      }
    }
  }

  const uploadInvitation = async () => {
    if (!invitationFile) {
      setUploadError('Yüklemek için tamamlanmış hediye davetiye çıktısını seçin.')
      return
    }
    setUploadingInvitation(true)
    setUploadError('')
    try {
      const form = new FormData()
      form.set('file', invitationFile)
      const result = await fetchVipApi(`/api/admin/vip-requests/${encodeURIComponent(requestId)}/delivery/invitation`, {
        method: 'POST',
        body: form,
      })
      setRequest(result.request)
      setInvitationFile(null)
      window.dispatchEvent(new Event('vip-request-updated'))
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : 'Hediye davetiye çıktısı yüklenemedi.')
    } finally {
      setUploadingInvitation(false)
    }
  }

  if (authStatus === 'loading' || loading) return <p className="py-16 text-center text-sm text-muted-foreground">Talep yükleniyor…</p>
  if (!canReadAdmin(user)) return <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center"><ShieldAlert className="mx-auto h-7 w-7 text-red-700" /><h1 className="mt-3 font-serif text-2xl">Erişim izni gerekli</h1><p className="mt-2 text-sm text-muted-foreground">Bu sayfa mevcut admin/support rolü gerektirir.</p></div>
  if (!request) return <div className="rounded-2xl border border-midnight/10 bg-white p-8 text-center"><p className="font-serif text-2xl">VIP talep bulunamadı</p><p className="mt-2 text-xs text-muted-foreground">{error}</p><Link href="/panel/admin/vip-talepler" className="mt-4 inline-block text-xs underline">Talep listesine dön</Link></div>

  const site = VIP_SITE_TEMPLATES.find((item) => item.id === request.selectedSiteTemplateId)
  const invitation = VIP_INVITATION_TEMPLATES.find((item) => item.id === request.selectedInvitationTemplateId)
  const hasChanges = status !== request.status || Boolean(note.trim()) ||
    (status === 'cancelled' && cancellationReason !== request.cancellation_decision?.reason)
  return (
    <article className="mx-auto max-w-6xl space-y-6">
      <Link href="/panel/admin/vip-talepler" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-midnight">← VIP talep kuyruğuna dön</Link>
      <header className="relative overflow-hidden rounded-[2rem] bg-midnight px-6 py-7 text-ivory shadow-xl sm:px-9 sm:py-9">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-champagne/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne">VIP talep · {request.id}</p><h1 className="mt-3 font-serif text-3xl sm:text-4xl">Talep inceleme</h1><p className="mt-3 text-sm text-ivory/70">{request.user_snapshot?.name || 'İsimsiz'} <span className="mx-1.5 text-ivory/35">·</span>{request.user_snapshot?.email}</p></div>
          <div className="rounded-2xl border border-ivory/10 bg-ivory/5 px-4 py-3"><p className="text-[9px] uppercase tracking-wider text-ivory/50">Mevcut aşama</p><span className="mt-1.5 inline-flex rounded-full bg-champagne/20 px-3 py-1.5 text-xs font-semibold text-champagne">{VIP_WORKFLOW_STATUSES.find((item) => item.id === request.status)?.label}</span></div>
        </div>
        <p className="relative mt-5 text-[11px] text-ivory/50">Gönderildi {new Date(request.createdAt).toLocaleString('tr-TR')}</p>
      </header>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Info title="Seçilen VIP site" value={site?.title} detail={site?.description} href={site ? `/tasarimlar/vip/${site.slug}` : undefined} linkLabel="VIP sayfa demosunu aç" />
        <Info title="Seçilen hediye davetiye" value={invitation?.title} detail={invitation?.description} />
        <Info
          title="Çift ve etkinlik"
          value={`${[request.eventDetails?.brideName, request.eventDetails?.groomName].filter(Boolean).join(' & ') || 'İsimsiz Etkinlik'} · ${request.eventDetails?.eventType || 'Özel Etkinlik'}`}
          detail={`Tarih: ${request.eventDetails?.date || 'Belirtilmedi'} ${request.eventDetails?.time || ''} · Mekân: ${request.eventDetails?.venue || 'Belirtilmedi'} · Adres: ${request.eventDetails?.address || 'Belirtilmedi'} · Aile: ${request.eventDetails?.familyInfo || 'Belirtilmedi'} · Davet notu: ${request.eventDetails?.invitationText || 'Belirtilmedi'}`}
        />
        <Info
          title="Tasarım tercihleri"
          value={`${request.preferences?.style || 'Standart'} · ${request.preferences?.colors || 'Renk belirtilmedi'}`}
          detail={`Bölümler: ${request.preferences?.sections?.join(', ') || 'Belirtilmedi'} · Referanslar: ${request.preferences?.referenceNotes || 'Yok'} · Ek istek: ${request.preferences?.description || 'Yok'}`}
        />
        <Info
          title="QR albüm tercihleri"
          value={request.albumPreferences?.wantsAlbum ? 'Albüm isteniyor' : 'Albüm istenmiyor'}
          detail={request.albumPreferences?.guestPhotoSharing ? 'Misafir QR fotoğraf paylaşımı isteniyor' : 'Misafir paylaşımı istenmiyor'}
        />
        <Info
          title="Yüklenen fotoğraflar"
          value={`${request.uploadedPhotoMetadata?.length || 0} dosya`}
          detail={request.uploadedPhotoMetadata?.map((photo) => `${photo.name} · ${photo.type} · ${Math.round(photo.size / 1024)} KB`).join(' | ') || 'Fotoğraf eklenmedi.'}
        />
      </div>
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-3xl border border-champagne/50 bg-white p-5 shadow-sm sm:p-7">
        <div className="max-w-2xl">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-champagne-dark">VIP sayfa entegrasyonu</p>
          <h2 className="mt-2 font-serif text-2xl text-midnight">{request.site_draft ? 'VIP site taslağı hazır' : 'Talep bilgileriyle VIP site taslağı'}</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Seçilen VIP konseptinin renkleri ve etkinlik bilgileri düzenlenebilir site editörüne aktarılır. Taslak yayınlanana kadar ziyaretçilere kapalıdır; talep onayı özel tasarım hizmetini satın alınmış saymaz.
          </p>
          {request.site_draft && <p className="mt-2 text-xs font-medium text-midnight">Durum: {request.site_draft.status === 'published' ? 'Yayında' : 'Yayınlanmamış taslak'} · {request.site_draft.templateTitle}</p>}
          {siteDraftError && <p className="mt-2 text-xs text-red-700" role="alert">{siteDraftError}</p>}
        </div>
        {canManageAdmin(user) && (request.site_draft ? (
          <Button asChild className="h-11 rounded-xl bg-midnight px-5 text-white">
            <Link href={`/panel/admin/vip-talepler/${encodeURIComponent(request.id)}/site`}><PencilRuler className="mr-2 h-4 w-4" />VIP siteyi düzenle</Link>
          </Button>
        ) : (
          <Button
            onClick={() => void createSiteDraft()}
            disabled={creatingSiteDraft || !['approved', 'in_progress'].includes(request.status)}
            className="h-11 rounded-xl bg-midnight px-5 text-white"
          >
            <PencilRuler className="mr-2 h-4 w-4" />{creatingSiteDraft ? 'Taslak hazırlanıyor…' : 'VIP sayfa taslağı oluştur'}
          </Button>
        ))}
        {!request.site_draft && !['approved', 'in_progress'].includes(request.status) && (
          <p className="w-full text-xs text-muted-foreground">Taslak oluşturmak için önce talebi onaylayın.</p>
        )}
      </section>
      <section className="rounded-3xl border border-midnight/10 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="font-serif text-2xl text-midnight">Hediye davetiye teslimat çıktısı</h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Teslim durumuna geçmek için VIP sitenin yayınlanmış ve kişiye özel hazırlanmış hediye davetiye çıktısının PDF veya görsel olarak yüklenmiş olması gerekir.</p>
        {request.gift_invitation_output ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-ivory p-4 text-xs">
            <span>{request.gift_invitation_output.name} · {request.gift_invitation_output.type} · {Math.ceil(request.gift_invitation_output.size / 1024)} KB</span>
            <a href={`/api/admin/vip-requests/${encodeURIComponent(request.id)}/delivery/invitation`} className="font-medium underline" download>Çıktıyı indir</a>
          </div>
        ) : canManageAdmin(user) && request.status === 'in_progress' ? (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1"><Label htmlFor="vip-invitation-output">Tamamlanmış çıktı (PDF veya görsel, en fazla 10 MB)</Label><input id="vip-invitation-output" type="file" accept="application/pdf,image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setInvitationFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-xs" /></div>
            <Button onClick={() => void uploadInvitation()} disabled={uploadingInvitation || !invitationFile} className="h-11 rounded-xl bg-midnight px-5 text-white">{uploadingInvitation ? 'Yükleniyor…' : 'Davetiye çıktısını kaydet'}</Button>
          </div>
        ) : <p className="mt-4 text-xs text-muted-foreground">Hediye davetiye çıktısı henüz yüklenmedi.</p>}
        {uploadError && <p className="mt-3 text-xs text-red-700" role="alert">{uploadError}</p>}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-midnight/10 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="font-serif text-2xl text-midnight">VIP kredi hareketleri</h2>
          <p className="mt-1 text-xs text-muted-foreground">İşlem, miktar, gerekçe, zaman ve admin bilgileri.</p>
          {!request.credit_movements?.length ? <p className="mt-4 text-xs text-muted-foreground">Hareket bulunamadı.</p> : (
            <ol className="mt-4 space-y-3">{request.credit_movements.map((movement, index) => (
              <li key={`${movement.kind}-${index}`} className="rounded-2xl bg-ivory p-3 text-xs">
                <p className="font-semibold">{movement.kind === 'debit' ? 'Kredi düşümü' : movement.kind === 'refund' ? 'Kredi iadesi' : 'İade yapılmadı'} · {movement.amount} kredi</p>
                <p className="mt-1 break-words text-muted-foreground">{movement.reason}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{new Date(movement.created_at).toLocaleString('tr-TR')} · Admin: {movement.admin_id || 'Sistem / kullanıcı işlemi'} · Talep: {movement.request_id} · Kullanıcı: {movement.user_id}</p>
              </li>
            ))}</ol>
          )}
        </div>
        <div className="rounded-3xl border border-midnight/10 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="font-serif text-2xl text-midnight">Bildirim ve e-posta durumu</h2>
          <p className="mt-1 text-xs text-muted-foreground">Resend yapılandırılmamışsa uygulama içi bildirimler yine kaydedilir.</p>
          {!request.email_notifications?.length ? <p className="mt-4 text-xs text-muted-foreground">Bu talep için bildirim kaydı bulunamadı.</p> : (
            <ol className="mt-4 space-y-3">{request.email_notifications.map((notification) => (
              <li key={notification.id} className="rounded-2xl bg-ivory p-3 text-xs">
                <p className="font-semibold">{notification.audience === 'admin' ? 'Admin bildirimi' : 'Kullanıcı bildirimi'} · {notification.title}</p>
                <p className="mt-1 text-muted-foreground">E-posta: {emailStatusLabel(notification.email?.status)} · {new Date(notification.created_at).toLocaleString('tr-TR')}</p>
                {notification.email?.last_error && <p className="mt-1 break-words text-red-700">{notification.email.last_error}</p>}
              </li>
            ))}</ol>
          )}
        </div>
      </section>
      {request.uploadedPhotoMetadata.some((photo) => photo.uploaded) && <ul className="mt-4 space-y-2">{request.uploadedPhotoMetadata.filter((photo) => photo.uploaded).map((photo) => <li key={photo.photoId}><a href={`/api/admin/vip-requests/${encodeURIComponent(request.id)}/photos/${encodeURIComponent(photo.photoId)}`} className="text-xs underline" download>{photo.name} · Fotoğrafı indir</a></li>)}</ul>}
      <section className="rounded-3xl border border-midnight/10 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage/25 text-midnight"><ShieldAlert className="h-5 w-5" /></span><div><h2 className="font-serif text-2xl text-midnight">İş akışı ve iç notlar</h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Talep başına 2 VIP kredisi kullanılır; ücretsiz proje kotası bu bakiyeye dahil değildir. Onay sonrası `Üretimde` durumu üretim başlangıcıdır. Bu aşamadan sonraki iptallerde mevcut politika gereği kredi iadesi yapılmaz.</p>
        </div></div>
        {canManageAdmin(user) ? <div className="mt-6 grid gap-4 rounded-2xl bg-ivory/60 p-4 sm:p-5 lg:grid-cols-[280px_260px_minmax(0,1fr)_auto] lg:items-end"><div className="min-w-0"><Label htmlFor="vip-status">Talep durumu</Label><Select value={status} onValueChange={setStatus}><SelectTrigger id="vip-status" className="mt-1 h-11 rounded-xl bg-white"><SelectValue placeholder="Durum seçin" /></SelectTrigger><SelectContent>{availableStatuses.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>{status === 'cancelled' && <div className="min-w-0"><Label htmlFor="vip-cancel-reason">İptal gerekçesi (zorunlu)</Label><Select value={cancellationReason} onValueChange={setCancellationReason}><SelectTrigger id="vip-cancel-reason" className="mt-1 h-11 rounded-xl bg-white"><SelectValue placeholder="Gerekçe seçin" /></SelectTrigger><SelectContent>{VIP_CANCELLATION_REASONS.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>}<div className="min-w-0"><Label htmlFor="vip-note">Yalnızca adminlerin görebileceği iç not {status === 'cancelled' && cancellationReason === 'other' && '(Diğer için zorunlu)'}</Label><textarea id="vip-note" maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-midnight/15 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne" placeholder="İç not ekleyin (isteğe bağlı)" /></div><Button disabled={saving || !hasChanges || (status === 'cancelled' && (!cancellationReason || (cancellationReason === 'other' && !note.trim())))} onClick={() => void save()} className="h-11 rounded-xl bg-midnight px-5 text-white">{saving ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}</Button></div> : <p className="mt-4 rounded-2xl bg-ivory px-4 py-3 text-xs text-muted-foreground">Support rolü talepleri görüntüleyebilir ancak durum veya iç not değiştiremez.</p>}
        {error && <p className="mt-3 text-xs text-red-700" role="alert">{error}</p>}
        {saved && <p className="mt-3 text-xs text-emerald-700" role="status">Talep güncellendi. Müşteri yalnızca durumu görür; iç notlar gizlidir.</p>}
        {request.internal_notes?.length > 0 && <section className="mt-5 border-t border-midnight/10 pt-4"><h3 className="text-xs font-semibold">Admin iç notları</h3><ol className="mt-3 space-y-2">{request.internal_notes.map((item, index) => <li key={`${item.createdAt}-${index}`} className="rounded-lg bg-ivory p-3 text-xs"><p>{item.note}</p><p className="mt-1 text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleString('tr-TR')} · Admin ID: {item.actorId}</p></li>)}</ol></section>}
        <div className="mt-6 border-t border-midnight/10 pt-5"><h3 className="font-serif text-xl text-midnight">Durum geçmişi</h3><ol className="mt-4 space-y-4">{request.timeline.map((item, index) => <li key={`${item.createdAt}-${index}`} className="flex gap-3 text-xs"><span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-champagne/20"><span className="h-2 w-2 rounded-full bg-champagne-dark" /></span><span className="min-w-0"><strong className="block font-medium text-midnight">{VIP_WORKFLOW_STATUSES.find((entry) => entry.id === item.status)?.label || item.status}</strong><span className="mt-1 block text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleString('tr-TR')}</span></span></li>)}</ol></div>
      </section>
    </article>
  )
}

function Info({ title, value, detail, href, linkLabel }) {
  return <section className="rounded-2xl border border-midnight/10 bg-white p-5"><h2 className="text-[9px] uppercase tracking-wider text-muted-foreground">{title}</h2><p className="mt-2 text-sm font-medium">{value || 'Belirtilmedi'}</p>{detail && <p className="mt-2 text-[10px] leading-5 text-muted-foreground">{detail}</p>}{href && <Link href={href} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-midnight underline underline-offset-4">{linkLabel}<ExternalLink className="h-3.5 w-3.5" /></Link>}</section>
}

function emailStatusLabel(status) {
  return ({
    sent: 'Gönderildi',
    failed: 'Gönderilemedi',
    not_configured: 'Resend yapılandırılmamış',
    not_available: 'E-posta adresi yok',
    not_requested: 'Gönderim istenmedi',
    pending: 'Bekliyor',
    sending: 'Gönderiliyor',
  })[status] || status || 'Bilinmiyor'
}
