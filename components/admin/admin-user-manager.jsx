'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, Search, ShieldCheck, UserRoundCog } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/components/auth/auth-provider'

const ROLE_LABELS = { user: 'Kullanıcı', support: 'Destek', admin: 'Admin', super_admin: 'Super admin' }

function AdminUserCard({ account, packages, currentUserId, onChangeRole, onGrant, onRevoke, busy }) {
  const [packageId, setPackageId] = useState(packages[0]?.id || '')
  const [reason, setReason] = useState('')
  const [grantRequestId, setGrantRequestId] = useState('')
  useEffect(() => {
    if (!packages.some((plan) => plan.id === packageId) && packages[0]) setPackageId(packages[0].id)
  }, [packageId, packages])
  const canEditRole = account.role !== 'super_admin' && account.id !== currentUserId

  return (
    <article className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium text-midnight">{account.name || 'İsimsiz kullanıcı'}</h2>
            <Badge variant="outline">{ROLE_LABELS[account.role] || account.role}</Badge>
          </div>
          <p className="mt-1 break-all text-sm text-muted-foreground">{account.email}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Kredi: {account.quota.remainingCredits} kullanılabilir / {account.quota.totalCredits} toplam
          </p>
        </div>
        <div className="w-full sm:max-w-[220px]">
          <label className="text-xs font-medium text-midnight">Kullanıcı rolü</label>
          {canEditRole ? (
            <Select value={account.role} onValueChange={(role) => onChangeRole(account, role)} disabled={Boolean(busy)}>
              <SelectTrigger className="mt-2 rounded-xl" aria-label={`${account.email} rolü`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Kullanıcı</SelectItem>
                <SelectItem value="support">Destek — salt okunur</SelectItem>
                <SelectItem value="admin">Admin — ürün ayarları</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="mt-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {account.id === currentUserId ? 'Kendi rolünüz değiştirilemez' : 'Super admin rolü bootstrap ile yönetilir'}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-xs font-medium text-midnight">
            Kota paketi
            <Select value={packageId} onValueChange={setPackageId} disabled={!packages.length || Boolean(busy)}>
              <SelectTrigger className="mt-2 rounded-xl" aria-label={`${account.email} kota paketi`}><SelectValue placeholder="Aktif paket seçin" /></SelectTrigger>
              <SelectContent>
                {packages.map((plan) => <SelectItem key={plan.id} value={plan.id}>{plan.name} — {plan.eventCredits} kredi</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <label className="text-xs font-medium text-midnight">
            İşlem gerekçesi
            <Input value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} placeholder="En az 10 karakter" className="mt-2 rounded-xl" aria-label={`${account.email} kota gerekçesi`} />
          </label>
          <Button
            type="button"
            onClick={() => {
              const requestId = grantRequestId || crypto.randomUUID()
              setGrantRequestId(requestId)
              onGrant(account, packageId, reason, () => { setReason(''); setGrantRequestId('') }, requestId)
            }}
            disabled={!packageId || reason.trim().length < 10 || Boolean(busy)}
          >
            {busy === `grant:${account.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kota ver'}
          </Button>
        </div>
        {account.quota.grants.length > 0 && (
          <div className="mt-4 space-y-2">
            {account.quota.grants.map((grant) => (
              <div key={grant.id} className="flex flex-col justify-between gap-2 rounded-xl bg-ivory-50 px-3 py-2 text-xs sm:flex-row sm:items-center">
                <p>{grant.packageId} · {grant.remaining}/{grant.total} kredi · {grant.provider || 'ödeme'} · {grant.status}</p>
                {grant.provider === 'admin' && grant.status === 'active' && grant.remaining === grant.total && grant.assigned === 0 && (
                  <Button type="button" size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => onRevoke(account, grant, reason, () => setReason(''))}>
                    {busy === `revoke:${grant.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Geri al'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

export function AdminUserManager() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [usersResponse, packagesResponse] = await Promise.all([
        fetch(`/api/admin/users?q=${encodeURIComponent(query)}`, { credentials: 'include', cache: 'no-store' }),
        fetch('/api/admin/packages', { credentials: 'include', cache: 'no-store' }),
      ])
      const [usersData, packagesData] = await Promise.all([
        usersResponse.json().catch(() => ({})),
        packagesResponse.json().catch(() => ({})),
      ])
      if (!usersResponse.ok) throw new Error(usersData.error || 'Kullanıcılar yüklenemedi')
      if (!packagesResponse.ok) throw new Error(packagesData.error || 'Paket bilgileri yüklenemedi')
      setUsers(usersData.items || [])
      setPackages((packagesData.items || []).filter((plan) => plan.settings.is_active && plan.eventCredits > 0))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => { load() }, [load])

  const mutate = async ({ key, url, method, body, success, reset, headers = {} }) => {
    setBusy(key)
    setError('')
    setNotice('')
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Yönetim işlemi tamamlanamadı')
      setNotice(success)
      reset?.()
      await load()
    } catch (mutationError) {
      setError(mutationError.message)
    } finally {
      setBusy('')
    }
  }

  const changeRole = (account, role) => {
    if (!window.confirm(`${account.email} hesabının rolü "${ROLE_LABELS[role]}" olarak değiştirilsin mi?`)) return
    return mutate({
      key: `role:${account.id}`,
      url: `/api/admin/users/${encodeURIComponent(account.id)}/role`,
      method: 'PATCH',
      body: { role },
      success: `${account.email} rolü güncellendi.`,
    })
  }

  const grant = (account, packageId, reason, reset, requestId) => mutate({
    key: `grant:${account.id}`,
    url: `/api/admin/users/${encodeURIComponent(account.id)}/grants`,
    method: 'POST',
    body: { packageId, reason },
    headers: { 'Idempotency-Key': requestId },
    success: `${account.email} hesabına kota tanımlandı.`,
    reset,
  })

  const revoke = (account, quota, reason, reset) => {
    if (reason.trim().length < 10) {
      setError('Kota geri alma işlemi için en az 10 karakterlik gerekçe girin.')
      return
    }
    if (!window.confirm(`${quota.packageId} kota kaydı geri alınsın mı? Bu işlem yalnızca hiç kullanılmamış admin kotalarında mümkündür.`)) return
    return mutate({
      key: `revoke:${quota.id}`,
      url: `/api/admin/users/${encodeURIComponent(account.id)}/grants/${encodeURIComponent(quota.id)}`,
      method: 'PATCH',
      body: { action: 'revoke', reason },
      success: `${account.email} kota kaydı geri alındı.`,
      reset,
    })
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-champagne-dark"><UserRoundCog className="h-4 w-4" /> Super admin</p>
          <h1 className="mt-2 font-serif text-4xl text-midnight">Kullanıcılar ve kotalar</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Roller ve etkinlik kredileri yönetilebilir. Kota işlemleri mevcut paket tanımlarını kullanır, gerekçe ister ve denetim kaydına eklenir.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" /> Yenile</Button>
      </header>

      <p className="flex gap-2 rounded-xl border border-champagne/40 bg-champagne/10 p-4 text-xs leading-relaxed text-midnight"><ShieldCheck className="h-4 w-4 shrink-0" /> Super admin rolü bu panelden atanamaz/değiştirilemez. Kota geri alma yalnızca hiç kullanılmamış ve projeye atanmamış admin kredilerinde etkinleştirilir.</p>
      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-white p-4 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-700/20 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ad veya e-posta ara" className="pl-9" aria-label="Kullanıcı ara" />
      </div>

      {loading ? (
        <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" /> Kullanıcılar yükleniyor</div>
      ) : users.length ? (
        <section className="space-y-4" aria-label="Kullanıcı listesi">
          {users.map((account) => <AdminUserCard key={account.id} account={account} packages={packages} currentUserId={user?.id} onChangeRole={changeRole} onGrant={grant} onRevoke={revoke} busy={busy} />)}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center text-sm text-muted-foreground">Aramayla eşleşen kullanıcı yok.</div>
      )}
    </div>
  )
}
