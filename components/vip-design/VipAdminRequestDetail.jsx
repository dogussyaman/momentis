'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/auth/auth-provider'
import { canManageAdmin, canReadAdmin } from '@/lib/admin/authorization'
import { getAdminVipDesignRequest, updateMockVipRequestStatus } from '@/lib/vip-design/mock-service.mjs'
import { VIP_INVITATION_TEMPLATES, VIP_REQUEST_STATUSES, VIP_SITE_TEMPLATES } from '@/lib/vip-design/mock-data.mjs'

export function VipAdminRequestDetail({ requestId }) {
  const { user, status: authStatus } = useAuth()
  const [request, setRequest] = useState(null)
  const [status, setStatus] = useState('created')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!canReadAdmin(user)) return
    getAdminVipDesignRequest(requestId)
      .then((item) => { setRequest(item); if (item) setStatus(item.status); setLoading(false) })
      .catch((cause) => { setError(cause instanceof Error ? cause.message : 'Talep açılamadı.'); setLoading(false) })
  }, [requestId, user])

  const save = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const updated = await updateMockVipRequestStatus(requestId, status, note)
      setRequest(updated)
      setNote('')
      setSaved(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Mock durum güncellenemedi.')
    } finally {
      setSaving(false)
    }
  }

  if (authStatus === 'loading' || loading) return <p className="py-16 text-center text-sm text-muted-foreground">Talep yükleniyor…</p>
  if (!canReadAdmin(user)) return <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center"><ShieldAlert className="mx-auto h-7 w-7 text-red-700" /><h1 className="mt-3 font-serif text-2xl">Erişim izni gerekli</h1><p className="mt-2 text-sm text-muted-foreground">Bu sayfa mevcut admin/support rolü gerektirir.</p></div>
  if (!request) return <div className="rounded-2xl border border-midnight/10 bg-white p-8 text-center"><p className="font-serif text-2xl">Demo talep bulunamadı</p><p className="mt-2 text-xs text-muted-foreground">Bu tarayıcıdaki mock depoda böyle bir kayıt yok.</p><Link href="/panel/admin/vip-talepler" className="mt-4 inline-block text-xs underline">Talep listesine dön</Link></div>

  const site = VIP_SITE_TEMPLATES.find((item) => item.id === request.selectedSiteTemplateId)
  const invitation = VIP_INVITATION_TEMPLATES.find((item) => item.id === request.selectedInvitationTemplateId)
  return (
    <article className="mx-auto max-w-5xl">
      <Link href="/panel/admin/vip-talepler" className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-midnight">← VIP talepler</Link>
      <header className="mt-5 flex flex-wrap items-start justify-between gap-3"><div><p className="text-[9px] uppercase tracking-widest text-muted-foreground">Mock talep · {request.id}</p><h1 className="mt-2 font-serif text-3xl">Talep inceleme</h1></div><span className="rounded-full bg-champagne/20 px-3 py-1.5 text-xs">{VIP_REQUEST_STATUSES.find((item) => item.id === request.status)?.label}</span></header>
      <p className="mt-3 text-xs text-muted-foreground">{request.userName || 'İsimsiz'} · {request.userEmail} · {new Date(request.createdAt).toLocaleString('tr-TR')}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Info title="Seçilen VIP site" value={site?.title} detail={site?.description} />
        <Info title="Seçilen hediye davetiye" value={invitation?.title} detail={invitation?.description} />
        <Info title="Çift ve etkinlik" value={`${request.eventDetails.brideName} & ${request.eventDetails.groomName} · ${request.eventDetails.eventType}`} detail={`Tarih: ${request.eventDetails.date} ${request.eventDetails.time || ''} · Mekân: ${request.eventDetails.venue} · Adres: ${request.eventDetails.address || 'Belirtilmedi'} · Aile: ${request.eventDetails.familyInfo || 'Belirtilmedi'} · Davet notu: ${request.eventDetails.invitationText || 'Belirtilmedi'}`} />
        <Info title="Tasarım tercihleri" value={`${request.preferences.style} · ${request.preferences.colors || 'Renk belirtilmedi'}`} detail={`Bölümler: ${request.preferences.sections.join(', ') || 'Belirtilmedi'} · Referanslar: ${request.preferences.referenceNotes || 'Yok'} · Ek istek: ${request.preferences.description || 'Yok'}`} />
        <Info title="QR albüm tercihleri" value={request.albumPreferences.wantsAlbum ? 'Albüm isteniyor' : 'Albüm istenmiyor'} detail={request.albumPreferences.guestPhotoSharing ? 'Misafir QR fotoğraf paylaşımı isteniyor' : 'Misafir paylaşımı istenmiyor'} />
        <Info title="Fotoğraf metadata / önizleme" value={`${request.uploadedPhotoMetadata.length} mock dosya kaydı`} detail={request.uploadedPhotoMetadata.map((photo) => `${photo.name} · ${photo.type} · ${Math.round(photo.size / 1024)} KB`).join(' | ') || 'Fotoğraf yok. Gerçek dosya yüklenmedi.'} />
      </div>
      <section className="mt-6 rounded-2xl border border-midnight/10 bg-white p-5">
        <h2 className="font-serif text-xl">Mock durum ve iç not</h2>
        {canManageAdmin(user) ? <div className="mt-4 grid gap-4 md:grid-cols-[240px_1fr_auto] md:items-end"><div><Label htmlFor="vip-status">Talep durumu</Label><select id="vip-status" value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-midnight/15 bg-white px-3 text-sm">{VIP_REQUEST_STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div><div><Label htmlFor="vip-note">Mock iç not (isteğe bağlı)</Label><textarea id="vip-note" maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-midnight/15 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne" placeholder="Yalnızca demo kaydına eklenir" /></div><Button disabled={saving} onClick={() => void save()} className="rounded-xl bg-midnight text-white">{saving ? 'Kaydediliyor…' : 'Mock durumu güncelle'}</Button></div> : <p className="mt-3 text-xs text-muted-foreground">Support rolü talepleri inceleyebilir ancak mevcut izinler gereği durum veya iç not değiştiremez.</p>}
        {error && <p className="mt-3 text-xs text-red-700" role="alert">{error}</p>}
        {saved && <p className="mt-3 text-xs text-emerald-700" role="status">Mock durum yerel demo deposunda güncellendi. Harici bildirim gönderilmedi.</p>}
        <ol className="mt-5 space-y-3 border-t border-midnight/10 pt-4">{request.timeline.map((item, index) => <li key={`${item.createdAt}-${index}`} className="text-xs"><strong>{VIP_REQUEST_STATUSES.find((entry) => entry.id === item.status)?.label || item.status}</strong><span className="ml-2 text-muted-foreground">{new Date(item.createdAt).toLocaleString('tr-TR')}</span><p className="mt-1 text-muted-foreground">{item.note}</p></li>)}</ol>
      </section>
    </article>
  )
}

function Info({ title, value, detail }) {
  return <section className="rounded-2xl border border-midnight/10 bg-white p-5"><h2 className="text-[9px] uppercase tracking-wider text-muted-foreground">{title}</h2><p className="mt-2 text-sm font-medium">{value || 'Belirtilmedi'}</p>{detail && <p className="mt-2 text-[10px] leading-5 text-muted-foreground">{detail}</p>}</section>
}
