'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'
import { SiteEditor } from '@/components/site-builder/SiteEditor'
import { SiteViewer } from '@/components/site-builder/SiteViewer'
import { Button } from '@/components/ui/button'
import { canManageAdmin, canReadAdmin } from '@/lib/admin/authorization'
import { fetchVipApi } from '@/lib/vip-design/api-client.mjs'

export function VipAdminSiteDraft({ requestId }) {
  const { user, status: authStatus } = useAuth()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const loadRequest = useCallback(async () => {
    if (!canReadAdmin(user)) return
    try {
      const result = await fetchVipApi(`/api/admin/vip-requests/${encodeURIComponent(requestId)}`)
      setRequest(result.request)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'VIP talep yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [requestId, user])

  useEffect(() => {
    void loadRequest()
  }, [loadRequest])

  const saveSite = async (siteData) => {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const result = await fetchVipApi(`/api/admin/vip-requests/${encodeURIComponent(requestId)}/site-draft`, {
        method: 'PATCH',
        body: JSON.stringify({ siteData }),
      })
      setRequest(result.request)
      setSaved(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'VIP site taslağı kaydedilemedi.')
      throw cause
    } finally {
      setSaving(false)
    }
  }

  const publish = async () => {
    setPublishing(true)
    setError('')
    try {
      const result = await fetchVipApi(`/api/admin/vip-requests/${encodeURIComponent(requestId)}/site-draft/publish`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      setRequest(result.request)
      window.dispatchEvent(new Event('vip-request-updated'))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'VIP sitesi yayınlanamadı.')
    } finally {
      setPublishing(false)
    }
  }

  if (authStatus === 'loading' || loading) {
    return <p className="py-16 text-center text-sm text-muted-foreground">VIP site taslağı yükleniyor…</p>
  }
  if (!canReadAdmin(user)) {
    return <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center"><h1 className="font-serif text-2xl">Erişim izni gerekli</h1><p className="mt-2 text-sm text-muted-foreground">Bu sayfa admin/support rolü gerektirir.</p></div>
  }
  if (!request || error && !request.site_draft) {
    return <div className="mx-auto max-w-xl rounded-2xl border border-midnight/10 bg-white p-8 text-center"><h1 className="font-serif text-2xl">VIP taslak açılamadı</h1><p className="mt-2 text-sm text-muted-foreground">{error || 'VIP talebi bulunamadı.'}</p><Link href={`/panel/admin/vip-talepler/${encodeURIComponent(requestId)}`} className="mt-4 inline-block text-xs underline">Talebe dön</Link></div>
  }
  if (!request.site_draft) {
    return <div className="mx-auto max-w-xl rounded-2xl border border-midnight/10 bg-white p-8 text-center"><h1 className="font-serif text-2xl">Henüz VIP taslağı yok</h1><Link href={`/panel/admin/vip-talepler/${encodeURIComponent(requestId)}`} className="mt-4 inline-block text-xs underline">Talep detayına dön</Link></div>
  }

  const siteDraft = request.site_draft
  const canPublish = request.status === 'in_progress' && siteDraft.status === 'draft'
  return (
    <main className="flex h-full min-h-[600px] flex-col bg-ivory">
      <header className="z-30 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-midnight/10 bg-white px-4 py-2 shadow-sm sm:px-6">
        <div className="min-w-0">
          <Link href={`/panel/admin/vip-talepler/${encodeURIComponent(requestId)}`} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-midnight">← VIP talep detayına dön</Link>
          <p className="mt-1 truncate text-sm font-medium text-midnight">{siteDraft.templateTitle} · {siteDraft.status === 'published' ? 'Yayında' : 'Yayınlanmamış taslak'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saved && <span className="text-[10px] text-emerald-700" role="status">{saving ? 'Kaydediliyor…' : 'Kaydedildi'}</span>}
          {siteDraft.status === 'published' ? (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <a href={`/d/${siteDraft.slug}`} target="_blank" rel="noreferrer">Yayındaki sayfayı aç</a>
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={!canManageAdmin(user) || !canPublish || publishing || saving}
              onClick={() => void publish()}
              className="rounded-full bg-midnight text-white"
            >
              {publishing ? 'Yayınlanıyor…' : 'Yayınla'}
            </Button>
          )}
        </div>
      </header>
      {error && <p className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700" role="alert">{error}</p>}
      {!canManageAdmin(user) && <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">Support rolü taslağı görüntüleyebilir ancak düzenleyemez veya yayınlayamaz.</p>}
      {!canPublish && siteDraft.status === 'draft' && <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">Yayınlamak için talep durumunu önce “Üretimde” olarak güncelleyin.</p>}
      {siteDraft.status === 'published' && canManageAdmin(user) && <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">Yayındaki taslakta yapacağınız ve kaydedeceğiniz değişiklikler hemen herkese açık sayfaya yansır.</p>}
      <div className="min-h-0 flex-1">
        {canManageAdmin(user) ? (
          <SiteEditor
            key={siteDraft.site_data.id}
            initialSite={siteDraft.site_data}
            onSwitchToCard={() => {}}
            onSave={saveSite}
            isUpdate
            saveButtonLabel={saving ? 'Kaydediliyor…' : 'VIP taslağını kaydet'}
            showSwitchToCard={false}
            autoSaveEnabled={false}
            canUsePremiumTemplates
          />
        ) : <SiteViewer site={siteDraft.site_data} />}
      </div>
    </main>
  )
}
