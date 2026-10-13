'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, TicketPercent, UsersRound } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function defaultDate(days = 0) {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function CampaignError({ children }) {
  return children ? <p role="alert" className="rounded-xl border border-destructive/30 bg-white p-3 text-sm text-destructive">{children}</p> : null
}

export function AdminCampaignManager() {
  const { user, status: authStatus } = useAuth()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const [packageId, setPackageId] = useState('all')
  const [credits, setCredits] = useState('1')
  const [reason, setReason] = useState('')
  const [preview, setPreview] = useState(null)
  const [distributionKey, setDistributionKey] = useState('')
  const [report, setReport] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [coupons, setCoupons] = useState([])
  const [batches, setBatches] = useState([])
  const [batchReport, setBatchReport] = useState(null)
  const [couponUsage, setCouponUsage] = useState(null)
  const [packages, setPackages] = useState([])
  const [couponForm, setCouponForm] = useState({
    code: '',
    credits: '1',
    startsAt: defaultDate(),
    endsAt: defaultDate(14),
    totalLimit: '',
    perUserLimit: '1',
    terms: '',
  })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    if (user?.role !== 'super_admin') return
    setLoading(true)
    setError('')
    try {
      const [campaignResponse, reportResponse, packageResponse] = await Promise.all([
        fetch('/api/admin/campaigns', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/admin/campaigns/report', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/admin/packages', { credentials: 'include', cache: 'no-store' }),
      ])
      const [campaignData, reportData, packageData] = await Promise.all([
        campaignResponse.json().catch(() => ({})),
        reportResponse.json().catch(() => ({})),
        packageResponse.json().catch(() => ({})),
      ])
      if (!campaignResponse.ok) throw new Error(campaignData.error || 'Kampanyalar yüklenemedi')
      if (!reportResponse.ok) throw new Error(reportData.error || 'Kampanya raporu yüklenemedi')
      if (!packageResponse.ok) throw new Error(packageData.error || 'Paketler yüklenemedi')
      setCampaigns(campaignData.campaigns || [])
      setCoupons(campaignData.coupons || [])
      setBatches(campaignData.batches || [])
      setReport(reportData.items || [])
      setPackages(packageData.items || [])
    } catch (loadError) {
      setError(loadError.message || 'Kampanya verileri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [user?.role])

  useEffect(() => { load() }, [load])

  const submit = async (url, body, requestKey = null) => {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(requestKey ? { 'Idempotency-Key': requestKey } : {}),
      },
      body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'İşlem tamamlanamadı')
    return data
  }

  const previewCredits = async () => {
    setBusy('preview')
    setError('')
    setNotice('')
    try {
      const data = await submit('/api/admin/campaigns/bulk-preview', {
        filters: { q: query, role, package: packageId },
        creditsPerUser: Number(credits),
        reason,
      })
      setPreview(data)
      setDistributionKey(window.crypto.randomUUID())
    } catch (previewError) {
      setPreview(null)
      setError(previewError.message)
    } finally {
      setBusy('')
    }
  }

  const distributeCredits = async () => {
    if (!preview?.userIds?.length) return
    setBusy('distribution')
    setError('')
    setNotice('')
    try {
      const data = await submit('/api/admin/campaigns/credit-batch', {
        userIds: preview.userIds,
        creditsPerUser: Number(credits),
        reason,
      }, distributionKey || window.crypto.randomUUID())
      setNotice(`Dağıtım tamamlandı: ${data.summary.succeeded} başarılı, ${data.summary.failed} başarısız, ${data.summary.skipped} atlandı. Toplam ${data.summary.succeeded * Number(credits)} kredi.`)
      setBatchReport(data)
      setPreview(null)
      setDistributionKey('')
      await load()
    } catch (distributionError) {
      setError(distributionError.message)
    } finally {
      setBusy('')
    }
  }

  const createCoupon = async (event) => {
    event.preventDefault()
    setBusy('coupon')
    setError('')
    setNotice('')
    try {
      await submit('/api/admin/coupons', {
        kind: 'credit_gift',
        ...couponForm,
        credits: Number(couponForm.credits),
        startsAt: new Date(couponForm.startsAt).toISOString(),
        endsAt: new Date(couponForm.endsAt).toISOString(),
        totalLimit: couponForm.totalLimit ? Number(couponForm.totalLimit) : null,
        perUserLimit: Number(couponForm.perUserLimit),
        active: true,
      })
      setCouponForm((current) => ({ ...current, code: '', terms: '' }))
      setNotice('Kredi kuponu oluşturuldu.')
      await load()
    } catch (couponError) {
      setError(couponError.message)
    } finally {
      setBusy('')
    }
  }

  const toggleCoupon = async (coupon) => {
    setBusy(coupon.id)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/admin/coupons/${encodeURIComponent(coupon.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !coupon.active }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Kupon durumu güncellenemedi')
      setNotice(coupon.active ? 'Kupon devre dışı bırakıldı.' : 'Kupon etkinleştirildi.')
      await load()
    } catch (toggleError) {
      setError(toggleError.message)
    } finally {
      setBusy('')
    }
  }

  const openBatchReport = async (batchId) => {
    setBusy(batchId)
    setError('')
    try {
      const response = await fetch(`/api/admin/campaigns/batches/${encodeURIComponent(batchId)}`, { credentials: 'include', cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Dağıtım raporu alınamadı')
      setBatchReport(data)
    } catch (reportError) {
      setError(reportError.message)
    } finally {
      setBusy('')
    }
  }

  const retryBatch = async (batchId) => {
    setBusy(batchId)
    setError('')
    setNotice('')
    try {
      const data = await submit(`/api/admin/campaigns/batches/${encodeURIComponent(batchId)}/retry`)
      setBatchReport(data)
      setNotice(`Dağıtım yeniden denendi: ${data.summary.succeeded} başarılı, ${data.summary.failed} başarısız, ${data.summary.skipped} atlandı.`)
      await load()
    } catch (retryError) {
      setError(retryError.message)
    } finally {
      setBusy('')
    }
  }

  const openCouponHistory = async (coupon) => {
    setBusy(coupon.id)
    setError('')
    try {
      const response = await fetch(`/api/admin/coupons/${encodeURIComponent(coupon.id)}/redemptions`, { credentials: 'include', cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Kupon kullanım geçmişi alınamadı')
      setCouponUsage({ code: coupon.code, items: data.items || [] })
    } catch (historyError) {
      setError(historyError.message)
    } finally {
      setBusy('')
    }
  }

  if (authStatus === 'loading') {
    return <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" /> Kampanyalar yükleniyor</div>
  }

  if (user?.role !== 'super_admin') {
    return <p role="alert" className="rounded-xl border border-destructive/30 bg-white p-5 text-sm text-destructive">Bu bölümü görüntüleme yetkiniz yok.</p>
  }

  if (loading && !report) {
    return <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" /> Kampanyalar yükleniyor</div>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-champagne-dark"><TicketPercent className="h-4 w-4" /> Super admin</p>
          <h1 className="mt-2 font-serif text-4xl text-midnight">Kredi kampanyaları</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Toplu premium etkinlik kredisi dağıtın, kredi hediyesi kuponları yönetin ve kampanya sonuçlarını görüntüleyin.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" /> Yenile</Button>
      </header>

      <CampaignError>{error}</CampaignError>
      {notice && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}

      <section className="space-y-4 rounded-2xl border border-border bg-white p-5 sm:p-7">
        <div>
          <h2 className="font-serif text-2xl text-midnight">Toplu kredi hediyesi</h2>
          <p className="mt-1 text-sm text-muted-foreground">Filtreye uyan en fazla 100 etkin hesabın her birine Premium etkinlik kredisi verilir. Büyük işler için dağıtım sınırı bilinçli olarak uygulanır.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Input value={query} onChange={(event) => { setQuery(event.target.value); setPreview(null) }} placeholder="Ad veya e-posta ara" aria-label="Kullanıcı ara" />
          <Select value={role} onValueChange={(value) => { setRole(value); setPreview(null) }}>
            <SelectTrigger aria-label="Rol filtresi"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm roller</SelectItem>
              <SelectItem value="user">Kullanıcı</SelectItem>
              <SelectItem value="support">Destek</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={packageId} onValueChange={(value) => { setPackageId(value); setPreview(null) }}>
            <SelectTrigger aria-label="Paket filtresi"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm paketler</SelectItem>
              {packages.map((plan) => <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" min="1" max="1000" value={credits} onChange={(event) => { setCredits(event.target.value); setPreview(null) }} aria-label="Kullanıcı başına kredi" />
        </div>
        <textarea value={reason} onChange={(event) => { setReason(event.target.value); setPreview(null) }} maxLength={500} minLength={10} rows={3} placeholder="Açıklama / kampanya gerekçesi (10–500 karakter)" className="w-full rounded-xl border border-border bg-white p-3 text-sm outline-none focus:border-champagne focus:ring-1 focus:ring-champagne" />
        <Button variant="outline" onClick={previewCredits} disabled={busy !== '' || reason.trim().length < 10 || Number(credits) < 1}>
          {busy === 'preview' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UsersRound className="mr-2 h-4 w-4" />} Önizleme oluştur
        </Button>
        {preview && (
          <div className="space-y-3 rounded-xl border border-champagne/50 bg-champagne/10 p-4">
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <p>Hedef kullanıcı: <strong>{preview.userCount}</strong></p>
              <p>Kişi başı kredi: <strong>{preview.creditsPerUser}</strong></p>
              <p>Toplam dağıtım: <strong>{preview.totalCredits}</strong></p>
            </div>
            <p className="text-xs text-muted-foreground">Açıklama: {preview.reason}</p>
            <Button onClick={distributeCredits} disabled={busy !== '' || !preview.userCount}>
              {busy === 'distribution' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Onayla ve dağıt
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-white p-5 sm:p-7">
        <div>
          <h2 className="font-serif text-2xl text-midnight">Kredi kuponu oluştur</h2>
          <p className="mt-1 text-sm text-muted-foreground">Bu uygulama yalnızca ücretsiz kredi hediyesi kuponlarını destekler. Ödeme indirimi/indirim kodu mevcut değildir.</p>
        </div>
        <form onSubmit={createCoupon} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-xs text-muted-foreground">Benzersiz kod<Input required minLength={3} maxLength={32} pattern="[A-Za-z0-9_-]+" value={couponForm.code} onChange={(event) => setCouponForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} /></label>
          <label className="space-y-1 text-xs text-muted-foreground">Kredi hediyesi<Input required type="number" min="1" max="1000" value={couponForm.credits} onChange={(event) => setCouponForm((current) => ({ ...current, credits: event.target.value }))} /></label>
          <label className="space-y-1 text-xs text-muted-foreground">Toplam kullanım limiti (boş = sınırsız)<Input type="number" min="1" max="1000000" value={couponForm.totalLimit} onChange={(event) => setCouponForm((current) => ({ ...current, totalLimit: event.target.value }))} /></label>
          <label className="space-y-1 text-xs text-muted-foreground">Kullanıcı başına limit<Input required type="number" min="1" max="10" value={couponForm.perUserLimit} onChange={(event) => setCouponForm((current) => ({ ...current, perUserLimit: event.target.value }))} /></label>
          <label className="space-y-1 text-xs text-muted-foreground">Başlangıç<Input required type="datetime-local" value={couponForm.startsAt} onChange={(event) => setCouponForm((current) => ({ ...current, startsAt: event.target.value }))} /></label>
          <label className="space-y-1 text-xs text-muted-foreground">Bitiş<Input required type="datetime-local" value={couponForm.endsAt} onChange={(event) => setCouponForm((current) => ({ ...current, endsAt: event.target.value }))} /></label>
          <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2 xl:col-span-3">Koşullar / açıklama<textarea rows={2} maxLength={500} value={couponForm.terms} onChange={(event) => setCouponForm((current) => ({ ...current, terms: event.target.value }))} className="w-full rounded-xl border border-border bg-white p-3 text-sm outline-none focus:border-champagne focus:ring-1 focus:ring-champagne" /></label>
          <div className="sm:col-span-2 xl:col-span-3"><Button type="submit" disabled={busy !== ''}>{busy === 'coupon' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kupon oluştur</Button></div>
        </form>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-white p-5 sm:p-7">
        <h2 className="font-serif text-2xl text-midnight">Kuponlar ve kampanya raporu</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-ivory-50 text-xs text-muted-foreground"><tr><th className="px-3 py-3">Kod / kampanya</th><th className="px-3 py-3">Tip</th><th className="px-3 py-3">Dağıtılan kredi</th><th className="px-3 py-3">Kullanım</th><th className="px-3 py-3">Durum</th><th className="px-3 py-3" /></tr></thead>
            <tbody className="divide-y divide-border">
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-3 py-3 font-medium">{coupon.code}</td>
                  <td className="px-3 py-3">Kredi hediyesi ({coupon.credits})</td>
                  <td className="px-3 py-3">{report?.find((item) => item.id === coupon.campaign_id)?.distributedCredits || 0}</td>
                  <td className="px-3 py-3">{coupon.redemption_count}{coupon.total_limit ? ` / ${coupon.total_limit}` : ''}</td>
                  <td className="px-3 py-3"><Badge variant={coupon.active ? 'secondary' : 'outline'}>{coupon.active ? 'Etkin' : 'Pasif'}</Badge></td>
                  <td className="px-3 py-3 text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" disabled={busy === coupon.id} onClick={() => openCouponHistory(coupon)}>Geçmiş</Button><Button variant="outline" size="sm" disabled={busy === coupon.id} onClick={() => toggleCoupon(coupon)}>{coupon.active ? 'Pasifleştir' : 'Etkinleştir'}</Button></div></td>
                </tr>
              ))}
              {campaigns.filter((campaign) => campaign.kind === 'admin_gift').map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-3 py-3 font-medium">{campaign.label}</td>
                  <td className="px-3 py-3">Toplu hediye</td>
                  <td className="px-3 py-3">{report?.find((item) => item.id === campaign.id)?.distributedCredits || 0}</td>
                  <td className="px-3 py-3">{report?.find((item) => item.id === campaign.id)?.redemptionCount || 0} kullanıcı</td>
                  <td className="px-3 py-3"><Badge variant="secondary">Tamamlandı</Badge></td>
                  <td className="px-3 py-3" />
                </tr>
              ))}
              {!coupons.length && !campaigns.some((campaign) => campaign.kind === 'admin_gift') && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Henüz kampanya yok.</td></tr>}
            </tbody>
          </table>
        </div>
        {couponUsage && (
          <div className="space-y-2 rounded-xl border border-border bg-ivory-50 p-4">
            <h3 className="text-sm font-medium">{couponUsage.code} kullanım geçmişi</h3>
            {couponUsage.items.length
              ? couponUsage.items.map((item) => <p key={item.id} className="break-all text-xs text-muted-foreground">{item.user_id} · {item.credits} kredi · {new Date(item.created_at).toLocaleString('tr-TR')}</p>)
              : <p className="text-xs text-muted-foreground">Henüz kullanım yok.</p>}
          </div>
        )}
      </section>

      {batches.length > 0 && (
        <section className="space-y-4 rounded-2xl border border-border bg-white p-5 sm:p-7">
          <h2 className="font-serif text-2xl text-midnight">Toplu dağıtım geçmişi</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-ivory-50 text-xs text-muted-foreground"><tr><th className="px-3 py-3">Açıklama</th><th className="px-3 py-3">Kullanıcı</th><th className="px-3 py-3">Kişi başı</th><th className="px-3 py-3">Durum</th><th className="px-3 py-3" /></tr></thead>
              <tbody className="divide-y divide-border">
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-3 py-3">{batch.reason}</td>
                    <td className="px-3 py-3">{batch.userCount}</td>
                    <td className="px-3 py-3">{batch.amountPerUser}</td>
                    <td className="px-3 py-3"><Badge variant={batch.status === 'completed' ? 'secondary' : 'outline'}>{batch.status}</Badge></td>
                    <td className="px-3 py-3 text-right"><Button variant="outline" size="sm" disabled={busy === batch.id} onClick={() => openBatchReport(batch.id)}>Rapor</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {batchReport && (
            <div className="space-y-3 rounded-xl border border-border bg-ivory-50 p-4">
              <p className="text-sm font-medium">Başarılı: {batchReport.summary.succeeded} · Başarısız: {batchReport.summary.failed} · Atlanan: {batchReport.summary.skipped}</p>
              {batchReport.summary.failed > 0 && <Button variant="outline" size="sm" disabled={busy !== ''} onClick={() => retryBatch(batchReport.id)}>Başarısızları yeniden dene</Button>}
              {batchReport.results.map((item) => (
                <p key={item.user_id} className="text-xs text-muted-foreground">
                  {item.user_id} · {item.status}{item.error ? ` · ${item.error}` : ''}
                </p>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
