'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, RefreshCw, Search, ShieldCheck, UserRoundCog } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/components/auth/auth-provider'

const ROLE_LABELS = { user: 'Kullanıcı', support: 'Destek', admin: 'Admin', super_admin: 'Super admin' }

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('tr-TR') : '—'
}

export function AdminUserManager() {
  const { user, status: authStatus } = useAuth()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [packageId, setPackageId] = useState('all')
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState([])
  const [packages, setPackages] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState({ field: 'created_at', direction: 'desc' })
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkStatus, setBulkStatus] = useState('none')
  const [bulkReason, setBulkReason] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    if (user?.role !== 'super_admin') return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25', sort: sort.field, direction: sort.direction })
      if (query.trim()) params.set('q', query.trim())
      if (role !== 'all') params.set('role', role)
      if (status !== 'all') params.set('status', status)
      if (packageId !== 'all') params.set('package', packageId)
      const [usersResponse, packagesResponse] = await Promise.all([
        fetch(`/api/admin/users?${params}`, { credentials: 'include', cache: 'no-store' }),
        fetch('/api/admin/packages', { credentials: 'include', cache: 'no-store' }),
      ])
      const [usersData, packagesData] = await Promise.all([
        usersResponse.json().catch(() => ({})),
        packagesResponse.json().catch(() => ({})),
      ])
      if (!usersResponse.ok) throw new Error(usersData.error || 'Kullanıcılar yüklenemedi')
      if (!packagesResponse.ok) throw new Error(packagesData.error || 'Paket bilgileri yüklenemedi')
      setUsers(usersData.items || [])
      setTotal(usersData.total || 0)
      setTotalPages(usersData.totalPages || 0)
      setPackages(packagesData.items || [])
    } catch (loadError) {
      setError(loadError.message || 'Kullanıcılar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [page, query, role, status, packageId, user?.role, sort])

  useEffect(() => { load() }, [load])

  const changeSort = (field) => {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const toggleUser = (userId) => {
    setSelectedIds((current) => current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId])
  }

  const togglePage = () => {
    const pageIds = users.map((item) => item.id)
    setSelectedIds((current) => pageIds.every((id) => current.includes(id))
      ? current.filter((id) => !pageIds.includes(id))
      : [...new Set([...current, ...pageIds])])
  }

  const applyBulkStatus = async () => {
    if (!['active', 'suspended'].includes(bulkStatus) || bulkReason.trim().length < 10) return
    setBulkBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/users/bulk-status', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedIds, status: bulkStatus, reason: bulkReason.trim() }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Toplu işlem tamamlanamadı')
      setNotice(`${data.changed.length} hesap güncellendi, ${data.unchanged.length} hesap atlandı.`)
      setSelectedIds([])
      setBulkStatus('none')
      setBulkReason('')
      await load()
    } catch (bulkError) {
      setError(bulkError.message || 'Toplu işlem tamamlanamadı')
    } finally {
      setBulkBusy(false)
    }
  }

  if (authStatus === 'loading') {
    return <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" /> Yetki doğrulanıyor</div>
  }

  if (user?.role !== 'super_admin') {
    return <p role="alert" className="rounded-xl border border-destructive/30 bg-white p-5 text-sm text-destructive">Bu bölümü görüntüleme yetkiniz yok.</p>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-champagne-dark"><UserRoundCog className="h-4 w-4" /> Super admin</p>
          <h1 className="mt-2 font-serif text-3xl text-midnight sm:text-4xl">Kullanıcı yönetimi</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Kullanıcı profilleri, paket/kredi bakiyeleri ve hesap durumlarını yönetin. Kredi hareketleri ve yönetim değişiklikleri kayda alınır.</p>
        </div>
        <Button variant="outline" className="h-10 rounded-xl" onClick={load} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Yenile</Button>
      </header>

      <p className="flex gap-2 rounded-2xl border border-champagne/40 bg-champagne/10 p-4 text-xs leading-relaxed text-midnight">
        <ShieldCheck className="h-4 w-4 shrink-0" /> Super admin rolü bu panelden atanamaz. Silme işlemi, bağlantılı etkinlik/kredi/sipariş kayıtları olan hesaplarda engellenir.
      </p>
      {error && <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}

      <div className="grid gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm shadow-midnight/[0.025] sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Ad veya e-posta ara" className="h-11 rounded-xl pl-9" aria-label="Kullanıcı ara" />
        </div>
        <Select value={role} onValueChange={(value) => { setRole(value); setPage(1) }}>
          <SelectTrigger className="h-11 rounded-xl" aria-label="Role göre filtrele"><SelectValue placeholder="Tüm roller" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm roller</SelectItem>
            <SelectItem value="user">Kullanıcı</SelectItem>
            <SelectItem value="support">Destek</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super_admin">Super admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1) }}>
          <SelectTrigger className="h-11 rounded-xl" aria-label="Hesap durumuna göre filtrele"><SelectValue placeholder="Tüm durumlar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm durumlar</SelectItem>
            <SelectItem value="active">Etkin</SelectItem>
            <SelectItem value="suspended">Askıda</SelectItem>
          </SelectContent>
        </Select>
        <Select value={packageId} onValueChange={(value) => { setPackageId(value); setPage(1) }}>
          <SelectTrigger className="h-11 rounded-xl" aria-label="Pakete göre filtrele"><SelectValue placeholder="Tüm paketler" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm paketler</SelectItem>
            {packages.map((plan) => <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" /> Kullanıcılar yükleniyor</div>
      ) : (
        <>
          {selectedIds.length > 0 && (
            <div className="grid gap-3 rounded-2xl border border-champagne/35 bg-champagne/5 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center"><p className="text-xs font-semibold text-midnight sm:col-span-3">{selectedIds.length} hesap seçildi · Toplu işlem</p>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="h-10 rounded-xl" aria-label="Toplu hesap durumu"><SelectValue placeholder="Durum seçin" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Durum seçin</SelectItem>
                  <SelectItem value="suspended">Askıya al</SelectItem>
                  <SelectItem value="active">Etkinleştir</SelectItem>
                </SelectContent>
              </Select>
              <Input className="h-10 rounded-xl" value={bulkReason} onChange={(event) => setBulkReason(event.target.value)} placeholder="Gerekçe (en az 10 karakter)" maxLength={500} />
              <Button onClick={applyBulkStatus} disabled={bulkBusy || selectedIds.length > 100 || !['active', 'suspended'].includes(bulkStatus) || bulkReason.trim().length < 10}>
                {bulkBusy ? 'Uygulanıyor…' : `${selectedIds.length} hesabı güncelle`}
              </Button>
            </div>
          )}
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm shadow-midnight/[0.025]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-ivory-50 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium"><input type="checkbox" className="h-4 w-4 rounded border-border accent-midnight" aria-label="Bu sayfadaki kullanıcıları seç" checked={users.length > 0 && users.every((item) => selectedIds.includes(item.id))} onChange={togglePage} /></th>
                    <th className="px-4 py-3 font-medium"><button type="button" onClick={() => changeSort('name')}>Kullanıcı {sort.field === 'name' ? (sort.direction === 'asc' ? '↑' : '↓') : ''}</button> <button type="button" className="ml-1 text-[10px] underline" onClick={() => changeSort('email')}>E-posta {sort.field === 'email' ? (sort.direction === 'asc' ? '↑' : '↓') : ''}</button></th>
                    <th className="px-4 py-3 font-medium"><button type="button" onClick={() => changeSort('created_at')}>Kayıt tarihi {sort.field === 'created_at' ? (sort.direction === 'asc' ? '↑' : '↓') : ''}</button></th>
                    <th className="px-4 py-3 font-medium"><button type="button" onClick={() => changeSort('role')}>Rol {sort.field === 'role' ? (sort.direction === 'asc' ? '↑' : '↓') : ''}</button></th>
                    <th className="px-4 py-3 font-medium"><button type="button" onClick={() => changeSort('account_status')}>Hesap {sort.field === 'account_status' ? (sort.direction === 'asc' ? '↑' : '↓') : ''}</button></th>
                    <th className="px-4 py-3 font-medium">Paket</th>
                    <th className="px-4 py-3 font-medium">Kredi bakiyesi</th>
                    <th className="px-4 py-3 font-medium"><span className="sr-only">Detay</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((account) => (
                    <tr key={account.id} className={`transition-colors hover:bg-ivory-50/70 ${selectedIds.includes(account.id) ? 'bg-champagne/[0.07]' : ''}`}>
                      <td className="px-4 py-4"><input type="checkbox" className="h-4 w-4 rounded border-border accent-midnight" aria-label={`${account.name || account.email} seç`} checked={selectedIds.includes(account.id)} onChange={() => toggleUser(account.id)} /></td>
                      <td className="max-w-[280px] px-4 py-4">
                        <p className="truncate font-medium text-midnight">{account.name || 'İsimsiz kullanıcı'}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{account.email}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs">{formatDate(account.createdAt)}</td>
                      <td className="px-4 py-4"><Badge variant="outline">{ROLE_LABELS[account.role] || account.role}</Badge></td>
                      <td className="px-4 py-4"><Badge variant={account.status === 'suspended' ? 'destructive' : 'secondary'}>{account.status === 'suspended' ? 'Askıda' : 'Etkin'}</Badge></td>
                      <td className="px-4 py-4 text-xs">{[account.package?.name, ...account.quota.packages.map((item) => item.name)].filter(Boolean).filter((item, index, all) => all.indexOf(item) === index).join(', ') || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs">{account.quota.remainingCredits} kullanılabilir / {account.quota.totalCredits} toplam</td>
                      <td className="px-4 py-4 text-right"><Button asChild size="sm" variant="outline" className="h-9 rounded-lg"><Link href={`/panel/admin/users/${encodeURIComponent(account.id)}`}>Yönet</Link></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!users.length && <p className="p-10 text-center text-sm text-muted-foreground">Filtrelerle eşleşen kullanıcı bulunamadı.</p>}
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-white px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>{total} kullanıcı · Sayfa {page} / {Math.max(totalPages, 1)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Önceki</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>Sonraki</Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
