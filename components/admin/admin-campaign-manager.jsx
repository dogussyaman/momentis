'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, CheckSquare, Globe, Loader2, RefreshCw, TicketPercent, UsersRound } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LuxuryLoader } from '@/components/ui/luxury-loader'

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
  const [targetMode, setTargetMode] = useState('all') // 'all' | 'filter' | 'selected'
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
  const [users, setUsers] = useState([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showUserList, setShowUserList] = useState(false)
  const [sendEmail, setSendEmail] = useState(true)
  const [couponForm, setCouponForm] = useState({
    code: '',
    credits_per_package: '1',
    packages: ['premium'],
    is_test_only: false,
    startsAt: defaultDate(),
    endsAt: defaultDate(14),
    totalLimit: '',
    perUserLimit: '1',
    terms: '',
  })
  const [revokingCoupon, setRevokingCoupon] = useState(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadUsers = useCallback(async () => {
    if (user?.role !== 'super_admin') return
    try {
      setLoadingUsers(true)
      const params = new URLSearchParams({ limit: '100', status: 'active' })
      if (query.trim()) params.set('q', query.trim())
      if (role !== 'all') params.set('role', role)
      if (packageId !== 'all') params.set('package', packageId)
      const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include', cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setUsers(data.items || [])
        setTotalUsers(data.total || 0)
      }
    } catch {
      // sessizce geç
    } finally {
      setLoadingUsers(false)
    }
  }, [user?.role, query, role, packageId])

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
      await loadUsers()
    } catch (loadError) {
      setError(loadError.message || 'Kampanya verileri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [user?.role, loadUsers])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadUsers() }, [loadUsers])

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

  const toggleSelectUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
    setPreview(null)
  }

  const toggleSelectAllUsers = () => {
    if (users.length > 0 && users.every((u) => selectedUserIds.includes(u.id))) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(users.map((u) => u.id))
    }
    setPreview(null)
  }

  const previewCredits = async () => {
    setBusy('preview')
    setError('')
    setNotice('')
    try {
      const payload = {
        creditsPerUser: Number(credits),
        reason,
        sendEmail,
      }
      if (targetMode === 'all') {
        payload.all = true
      } else if (targetMode === 'selected') {
        if (!selectedUserIds.length) {
          throw new Error('Lütfen listeden en az bir kullanıcı seçin veya "Tüm Aktif Kullanıcılar" sekmesine geçin.')
        }
        payload.userIds = selectedUserIds
      } else {
        payload.filters = { q: query, role, package: packageId }
      }
      const data = await submit('/api/admin/campaigns/bulk-preview', payload)
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
      const payload = {
        userIds: preview.userIds,
        creditsPerUser: Number(credits),
        reason,
        sendEmail,
      }
      const data = await submit('/api/admin/campaigns/credit-batch', payload, distributionKey || window.crypto.randomUUID())
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
    if (!couponForm.packages?.length) {
      setError('En az bir paket seçmelisiniz (Premium veya Atölye)')
      return
    }
    setBusy('coupon')
    setError('')
    setNotice('')
    try {
      await submit('/api/admin/coupons', {
        kind: 'credit_gift',
        code: couponForm.code,
        credits_per_package: Number(couponForm.credits_per_package),
        packages: couponForm.packages,
        is_test_only: Boolean(couponForm.is_test_only),
        startsAt: new Date(couponForm.startsAt).toISOString(),
        endsAt: new Date(couponForm.endsAt).toISOString(),
        totalLimit: couponForm.totalLimit ? Number(couponForm.totalLimit) : null,
        perUserLimit: Number(couponForm.perUserLimit),
        terms: couponForm.terms || '',
        active: true,
      })
      setCouponForm((current) => ({ ...current, code: '', terms: '' }))
      setNotice('Kredi kuponu başarıyla oluşturuldu.')
      await load()
    } catch (couponError) {
      setError(couponError.message)
    } finally {
      setBusy('')
    }
  }

  const revokeUnusedCredits = async (coupon) => {
    if (!revokeReason || revokeReason.trim().length < 10) {
      setError('İptal işlemi için en az 10 karakterlik gerekçe zorunludur')
      return
    }
    setBusy(`revoke-${coupon.id}`)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/admin/coupons/${encodeURIComponent(coupon.id)}/revoke-unused`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: revokeReason.trim() }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Kupon kredileri geri alınamadı')
      setNotice(data.message || `${data.revokedCount} adet kullanılmamış kredi paketi geri alındı.`)
      setRevokingCoupon(null)
      setRevokeReason('')
      await load()
    } catch (revokeError) {
      setError(revokeError.message)
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
    return (
      <div className="py-16">
        <LuxuryLoader variant="card" title="Yönetici Yetkisi Doğrulanıyor…" subtitle="MOMENTIS ADMIN · KAMPANYA YÖNETİMİ" icon={TicketPercent} />
      </div>
    )
  }

  if (user?.role !== 'super_admin') {
    return <p role="alert" className="rounded-xl border border-destructive/30 bg-white p-5 text-sm text-destructive">Bu bölümü görüntüleme yetkiniz yok.</p>
  }

  if (loading && !report) {
    return (
      <div className="py-16">
        <LuxuryLoader variant="card" title="Kampanya Raporları Hazırlanıyor…" subtitle="MOMENTIS ADMIN · VERİ ANALİTİĞİ" icon={TicketPercent} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-champagne-dark"><TicketPercent className="h-4 w-4" /> Super admin</p>
          <h1 className="mt-2 font-serif text-3xl text-midnight sm:text-4xl">Kredi kampanyaları</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Toplu premium etkinlik kredisi dağıtın, kredi hediyesi kuponları yönetin ve kampanya sonuçlarını görüntüleyin.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" /> Yenile</Button>
      </header>

      <CampaignError>{error}</CampaignError>
      {notice && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}

      <section className="space-y-5 rounded-2xl border border-border bg-white p-4 shadow-sm shadow-midnight/[0.025] sm:p-6 lg:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-serif text-xl text-midnight sm:text-2xl">Toplu kredi hediyesi</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sistemdeki tüm aktif kullanıcılara veya filtrelediğiniz hesaplara toplu Premium etkinlik kredisi tanımlayın.
            </p>
          </div>
          {totalUsers > 0 && (
            <Badge variant="secondary" className="self-start text-xs font-normal">
              Toplam {totalUsers} aktif kullanıcı
            </Badge>
          )}
        </div>

        {/* Hedef Kitle Seçimi Sekmeleri */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hedef Kitle Seçimi
          </label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => { setTargetMode('all'); setPreview(null) }}
              className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                targetMode === 'all'
                  ? 'border-champagne bg-champagne/10 ring-2 ring-champagne/20'
                  : 'border-border bg-white hover:border-champagne/50 hover:bg-ivory-50/50'
              }`}
            >
              <Globe className={`mt-0.5 h-5 w-5 shrink-0 ${targetMode === 'all' ? 'text-midnight' : 'text-muted-foreground'}`} />
              <div>
                <span className="block text-sm font-medium text-midnight">Tüm Aktif Kullanıcılar</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Sistemdeki tüm kayıtlı ve aktif hesaplar ({totalUsers || 'Tüm'} kullanıcı)
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setTargetMode('filter'); setPreview(null) }}
              className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                targetMode === 'filter'
                  ? 'border-champagne bg-champagne/10 ring-2 ring-champagne/20'
                  : 'border-border bg-white hover:border-champagne/50 hover:bg-ivory-50/50'
              }`}
            >
              <UsersRound className={`mt-0.5 h-5 w-5 shrink-0 ${targetMode === 'filter' ? 'text-midnight' : 'text-muted-foreground'}`} />
              <div>
                <span className="block text-sm font-medium text-midnight">Filtreye Göre</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Rol, paket veya isim/e-posta filtrelerine uyanlar
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTargetMode('selected')
                setPreview(null)
                setShowUserList(true)
                if (selectedUserIds.length === 0 && users.length > 0) {
                  setSelectedUserIds(users.map((u) => u.id))
                }
              }}
              className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                targetMode === 'selected'
                  ? 'border-champagne bg-champagne/10 ring-2 ring-champagne/20'
                  : 'border-border bg-white hover:border-champagne/50 hover:bg-ivory-50/50'
              }`}
            >
              <CheckSquare className={`mt-0.5 h-5 w-5 shrink-0 ${targetMode === 'selected' ? 'text-midnight' : 'text-muted-foreground'}`} />
              <div>
                <span className="block text-sm font-medium text-midnight">Listeden Kullanıcı Seç</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {selectedUserIds.length > 0 ? `${selectedUserIds.length} kullanıcı seçili` : 'Kullanıcıları tek tek veya toplu seçin'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Filtre ve Arama Alanları */}
        {(targetMode === 'filter' || targetMode === 'selected') && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPreview(null) }}
              placeholder="Ad veya e-posta ara"
              aria-label="Kullanıcı ara"
            />
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
          </div>
        )}

        {/* Kullanıcı Listesi / Tablosu (Listeden Seç veya İncele) */}
        {(targetMode === 'selected' || showUserList) && (
          <div className="space-y-3 rounded-xl border border-border bg-ivory-50/40 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="select-all-users"
                  checked={users.length > 0 && users.every((u) => selectedUserIds.includes(u.id))}
                  onChange={toggleSelectAllUsers}
                  className="h-4 w-4 rounded border-border accent-midnight"
                />
                <label htmlFor="select-all-users" className="cursor-pointer text-xs font-semibold text-midnight">
                  Tümünü Seç / Kaldır ({selectedUserIds.length} / {users.length} kullanıcı seçili)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => { setSelectedUserIds(users.map((u) => u.id)); setPreview(null) }}
                >
                  Tümünü Seç
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => { setSelectedUserIds([]); setPreview(null) }}
                >
                  Seçimi Temizle
                </Button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-lg border border-border bg-white">
              {loadingUsers ? (
                <div className="flex items-center justify-center p-6 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kullanıcılar yükleniyor...
                </div>
              ) : users.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">Filtreye uyan kullanıcı bulunamadı.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-ivory-50 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <tr>
                      <th className="w-10 px-3 py-2" />
                      <th className="px-3 py-2">Kullanıcı</th>
                      <th className="px-3 py-2">Rol</th>
                      <th className="px-3 py-2">Paket</th>
                      <th className="px-3 py-2">Kredi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((account) => {
                      const isSelected = selectedUserIds.includes(account.id)
                      return (
                        <tr
                          key={account.id}
                          onClick={() => toggleSelectUser(account.id)}
                          className={`cursor-pointer transition-colors hover:bg-ivory-50 ${isSelected ? 'bg-champagne/10' : ''}`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectUser(account.id)}
                              className="h-3.5 w-3.5 rounded border-border accent-midnight"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-medium text-midnight truncate max-w-[200px]">{account.name || 'İsimsiz'}</p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{account.email}</p>
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-[10px]">{account.role}</Badge>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {account.package?.name || 'Başlangıç'}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {account.quota?.remainingCredits ?? 0}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Bilgilendirme ve Liste Açma Butonu (Tüm Kullanıcılar Modunda) */}
        {targetMode === 'all' && (
          <div className="flex items-center justify-between rounded-xl border border-champagne/30 bg-champagne/5 p-3 text-xs text-midnight">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              Sistemdeki tüm aktif kullanıcılar ({totalUsers} kullanıcı) hedefleniyor.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowUserList(!showUserList)}
            >
              {showUserList ? 'Listeyi Gizle' : 'Kullanıcı Listesini İncele'}
            </Button>
          </div>
        )}

        {/* Kredi ve Açıklama Alanları */}
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-1 space-y-1">
            <label className="text-xs text-muted-foreground">Kullanıcı başına kredi</label>
            <Input
              type="number"
              min="1"
              max="1000"
              value={credits}
              onChange={(event) => { setCredits(event.target.value); setPreview(null) }}
              aria-label="Kullanıcı başına kredi"
            />
          </div>
          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs text-muted-foreground">Kampanya açıklaması / gerekçe (10-500 karakter)</label>
            <Input
              value={reason}
              onChange={(event) => { setReason(event.target.value); setPreview(null) }}
              maxLength={500}
              placeholder="Örn: Tüm kullanıcılara kampanya hediye kredisi"
            />
          </div>
        </div>

        {/* E-posta Bildirimi Seçeneği */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-ivory-50/50 p-3.5 transition-colors hover:border-champagne">
          <input
            type="checkbox"
            id="send-email-checkbox"
            checked={sendEmail}
            onChange={(e) => { setSendEmail(e.target.checked); setPreview(null) }}
            className="mt-0.5 h-4 w-4 rounded border-border accent-midnight cursor-pointer"
          />
          <label htmlFor="send-email-checkbox" className="cursor-pointer select-none text-xs leading-relaxed text-midnight">
            <span className="font-semibold block">Kullanıcılara e-posta bildirimi gönder</span>
            <span className="text-muted-foreground block text-[11px]">
              Kredi tanımlandığında kullanıcılara &quot;Hediye etkinlik kredisi hesabınıza eklendi&quot; konulu bilgilendirme e-postası iletilir.
            </span>
          </label>
        </div>

        <Button
          variant="outline"
          onClick={previewCredits}
          disabled={busy !== '' || reason.trim().length < 10 || Number(credits) < 1 || (targetMode === 'selected' && selectedUserIds.length === 0)}
        >
          {busy === 'preview' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UsersRound className="mr-2 h-4 w-4" />} Önizleme oluştur
        </Button>

        {preview && (
          <div className="space-y-3 rounded-2xl border border-champagne/50 bg-champagne/10 p-4 sm:p-5">
            <div className="grid gap-3 text-sm sm:grid-cols-4">
              <p className="rounded-xl border border-champagne/30 bg-white/70 p-3 text-xs text-muted-foreground">
                Hedef kullanıcı <strong className="mt-1 block font-serif text-2xl text-midnight">{preview.userCount}</strong>
              </p>
              <p className="rounded-xl border border-champagne/30 bg-white/70 p-3 text-xs text-muted-foreground">
                Kişi başı kredi <strong className="mt-1 block font-serif text-2xl text-midnight">{preview.creditsPerUser}</strong>
              </p>
              <p className="rounded-xl border border-champagne/30 bg-white/70 p-3 text-xs text-muted-foreground">
                Toplam dağıtım <strong className="mt-1 block font-serif text-2xl text-midnight">{preview.totalCredits}</strong>
              </p>
              <p className="rounded-xl border border-champagne/30 bg-white/70 p-3 text-xs text-muted-foreground">
                E-posta bildirimi <strong className={`mt-1 block font-serif text-base ${preview.sendEmail ? 'text-emerald-700' : 'text-muted-foreground'}`}>{preview.sendEmail ? '✉️ Gönderilecek' : '🚫 Kapalı'}</strong>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Açıklama: {preview.reason}</p>
            <Button onClick={distributeCredits} disabled={busy !== '' || !preview.userCount}>
              {busy === 'distribution' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Onayla ve dağıt ({preview.totalCredits} Kredi)
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-white p-4 shadow-sm shadow-midnight/[0.025] sm:p-6 lg:p-7">
        <div>
          <h2 className="font-serif text-xl text-midnight sm:text-2xl">Kredi kuponu oluştur</h2>
          <p className="mt-1 text-sm text-muted-foreground">Bu uygulama yalnızca ücretsiz kredi hediyesi kuponlarını destekler. Ödeme indirimi/indirim kodu mevcut değildir.</p>
        </div>
        <form onSubmit={createCoupon} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-xs text-muted-foreground">Benzersiz kod<Input required minLength={3} maxLength={32} pattern="[A-Za-z0-9_-]+" value={couponForm.code} onChange={(event) => setCouponForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} /></label>
          <label className="space-y-1 text-xs text-muted-foreground">Paket başına kredi<Input required type="number" min="1" max="1000" value={couponForm.credits_per_package} onChange={(event) => setCouponForm((current) => ({ ...current, credits_per_package: event.target.value }))} /></label>
          <div className="space-y-1 text-xs text-muted-foreground">
            <span className="block font-medium text-midnight">Uygulanacak paketler</span>
            <div className="flex flex-wrap gap-2 pt-1">
              <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-midnight transition hover:border-champagne cursor-pointer">
                <input
                  type="checkbox"
                  checked={couponForm.packages.includes('premium')}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...couponForm.packages, 'premium']
                      : couponForm.packages.filter((p) => p !== 'premium')
                    setCouponForm((cur) => ({ ...cur, packages: next }))
                  }}
                  className="h-4 w-4 rounded border-border accent-midnight"
                />
                <span>Premium</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-midnight transition hover:border-champagne cursor-pointer">
                <input
                  type="checkbox"
                  checked={couponForm.packages.includes('atolye')}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...couponForm.packages, 'atolye']
                      : couponForm.packages.filter((p) => p !== 'atolye')
                    setCouponForm((cur) => ({ ...cur, packages: next }))
                  }}
                  className="h-4 w-4 rounded border-border accent-midnight"
                />
                <span>Atölye</span>
              </label>
            </div>
          </div>
          <label className="space-y-1 text-xs text-muted-foreground">Toplam kullanım limiti (boş = sınırsız)<Input type="number" min="1" max="1000000" value={couponForm.totalLimit} onChange={(event) => setCouponForm((current) => ({ ...current, totalLimit: event.target.value }))} /></label>
          <label className="space-y-1 text-xs text-muted-foreground">Kullanıcı başına limit<Input required type="number" min="1" max="10" value={couponForm.perUserLimit} onChange={(event) => setCouponForm((current) => ({ ...current, perUserLimit: event.target.value }))} /></label>
          <div className="flex items-center rounded-xl border border-amber-300/70 bg-amber-50/70 p-3 sm:pt-0">
            <label className="flex items-start gap-2 text-xs font-medium leading-relaxed cursor-pointer text-midnight">
              <input
                type="checkbox"
                checked={couponForm.is_test_only}
                onChange={(e) => setCouponForm((cur) => ({ ...cur, is_test_only: e.target.checked }))}
                className="rounded border-border"
              />
              <span>Yalnızca test kuponu (Üretim ortamında genel kullanıcılara kapalı)</span>
            </label>
          </div>
          <label className="space-y-1 text-xs text-muted-foreground">Başlangıç<Input required type="datetime-local" value={couponForm.startsAt} onChange={(event) => setCouponForm((current) => ({ ...current, startsAt: event.target.value }))} /></label>
          <label className="space-y-1 text-xs text-muted-foreground">Bitiş<Input required type="datetime-local" value={couponForm.endsAt} onChange={(event) => setCouponForm((current) => ({ ...current, endsAt: event.target.value }))} /></label>
          <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2 xl:col-span-3">Koşullar / açıklama<textarea rows={2} maxLength={500} value={couponForm.terms} onChange={(event) => setCouponForm((current) => ({ ...current, terms: event.target.value }))} className="w-full min-h-20 rounded-xl border border-border bg-white p-3 text-sm outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/25" /></label>
          <div className="sm:col-span-2 xl:col-span-3"><Button type="submit" className="h-11 rounded-xl" disabled={busy !== ''}>{busy === 'coupon' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kupon oluştur</Button></div>
        </form>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-white p-5 sm:p-7">
        <h2 className="font-serif text-xl text-midnight sm:text-2xl">Kuponlar ve kampanya raporu</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-ivory-50 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><tr><th className="px-3 py-3">Kod / kampanya</th><th className="px-3 py-3">Tip / Paket</th><th className="px-3 py-3">Dağıtılan kredi</th><th className="px-3 py-3">Kullanım</th><th className="px-3 py-3">Durum</th><th className="px-3 py-3" /></tr></thead>
            <tbody className="divide-y divide-border">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="transition-colors hover:bg-ivory-50/70">
                  <td className="px-3 py-3 font-medium">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{coupon.code}</span>
                      {coupon.is_test_only && <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700 bg-amber-50">Test</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs space-y-0.5">
                      <p>Kredi: {coupon.credits_per_package || coupon.credits} / paket</p>
                      <p className="text-muted-foreground capitalize">{(coupon.packages || ['premium']).join(', ')}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3">{report?.find((item) => item.id === coupon.campaign_id)?.distributedCredits || 0}</td>
                  <td className="px-3 py-3">{coupon.redemption_count}{coupon.total_limit ? ` / ${coupon.total_limit}` : ''}</td>
                  <td className="px-3 py-3"><Badge variant={coupon.active ? 'secondary' : 'outline'}>{coupon.active ? 'Etkin' : 'Pasif'}</Badge></td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex min-w-[220px] justify-end gap-2 flex-wrap">
                      <Button variant="outline" size="sm" disabled={busy === coupon.id} onClick={() => openCouponHistory(coupon)}>Geçmiş</Button>
                      <Button variant="outline" size="sm" disabled={busy === coupon.id} onClick={() => toggleCoupon(coupon)}>{coupon.active ? 'Pasifleştir' : 'Etkinleştir'}</Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        disabled={busy.startsWith('revoke-')}
                        onClick={() => { setRevokingCoupon(coupon); setRevokeReason('') }}
                      >
                        Kullanılmayanları Geri Al
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {campaigns.filter((campaign) => campaign.kind === 'admin_gift').map((campaign) => (
                <tr key={campaign.id} className="transition-colors hover:bg-ivory-50/70">
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
        {revokingCoupon && (
          <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <h3 className="text-sm font-semibold text-destructive">
              Kullanılmamış Kredileri Geri Al: {revokingCoupon.code}
            </h3>
            <p className="text-xs text-muted-foreground">
              Bu işlem, bu kupon kullanılarak tanımlanmış ve <strong>henüz hiçbir projeye atanmamış ve harcanmamış</strong> kredileri iptal eder.
              Projeye atanmış veya kısmen kullanılmış haklar kullanıcı verisi bütünlüğünü korumak için muhafaza edilir.
            </p>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="İptal gerekçesi (en az 10 karakter)"
              rows={2}
              className="w-full min-h-20 rounded-xl border border-border bg-white p-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-champagne focus:ring-2 focus:ring-champagne/25"
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={busy === `revoke-${revokingCoupon.id}` || revokeReason.trim().length < 10}
                onClick={() => revokeUnusedCredits(revokingCoupon)}
              >
                {busy === `revoke-${revokingCoupon.id}` && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Onayla ve Geri Al
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy === `revoke-${revokingCoupon.id}`}
                onClick={() => { setRevokingCoupon(null); setRevokeReason('') }}
              >
                Vazgeç
              </Button>
            </div>
          </div>
        )}
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
          <h2 className="font-serif text-xl text-midnight sm:text-2xl">Toplu dağıtım geçmişi</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-ivory-50 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><tr><th className="px-3 py-3">Açıklama</th><th className="px-3 py-3">Kullanıcı</th><th className="px-3 py-3">Kişi başı</th><th className="px-3 py-3">Durum</th><th className="px-3 py-3" /></tr></thead>
              <tbody className="divide-y divide-border">
                {batches.map((batch) => (
                  <tr key={batch.id} className="transition-colors hover:bg-ivory-50/70">
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
