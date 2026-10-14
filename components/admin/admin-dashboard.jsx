'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminDiagnostics } from '@/components/admin/admin-diagnostics'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function summarizeAuditChange(value) {
  if (Array.isArray(value)) return `${value.length} öğe`
  if (!value || typeof value !== 'object') {
    return typeof value === 'string' ? value : 'Değişiklik ayrıntısı yok'
  }
  const entries = Object.entries(value)
  if (!entries.length) return 'Değişiklik ayrıntısı yok'
  const keys = entries.slice(0, 2).map(([key]) => key)
  return `${keys.join(' · ')}${entries.length > 2 ? ` +${entries.length - 2}` : ''}`
}

export function AdminDashboard() {
  const [overview, setOverview] = useState(null)
  const [packages, setPackages] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingPackage, setSavingPackage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const responses = await Promise.all([
        fetch('/api/admin/overview', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/admin/packages', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/admin/audit-logs?limit=20', { credentials: 'include', cache: 'no-store' }),
      ])
      const data = await Promise.all(responses.map((response) => response.json().catch(() => ({}))))
      const failed = responses.findIndex((response) => !response.ok)
      if (failed >= 0) throw new Error(data[failed].error || 'Yönetim bilgileri alınamadı')
      setOverview(data[0])
      setPackages(data[1].items || [])
      setAuditLogs(data[2].items || [])
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const updatePackage = async (plan, field, value) => {
    const action = value ? 'etkinleştirmek' : 'devre dışı bırakmak'
    if (!value && !window.confirm(`${plan.name} paketini ${action} istediğinizden emin misiniz? Mevcut kullanıcı hakları korunur; yeni kullanım ve satış engellenebilir.`)) return

    setSavingPackage(plan.id)
    setError('')
    try {
      const response = await fetch(`/api/admin/packages/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [field]: value }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Paket durumu güncellenemedi')
      await load()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSavingPackage('')
    }
  }

  if (loading && !overview) {
    return <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" /> Yönetim paneli yükleniyor</div>
  }

  if (error && !overview) {
    return <section className="mx-auto max-w-2xl rounded-3xl border border-destructive/30 bg-white p-8 text-center">
      <p className="text-sm text-destructive">{error}</p>
      <Button variant="outline" className="mt-4" onClick={load}>Tekrar dene</Button>
    </section>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-champagne-dark"><ShieldCheck className="h-4 w-4" /> Yönetim</p>
          <h1 className="mt-2 font-serif text-3xl text-midnight sm:text-4xl">Admin Paneli</h1>
          <p className="mt-2 text-sm text-muted-foreground">Paket durumu, sistem özeti ve yönetim işlem geçmişi.</p>
        </div>
        <Button variant="outline" className="h-10 rounded-xl" onClick={load} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Yenile</Button>
      </header>

      {error && <p className="rounded-xl border border-destructive/30 bg-white p-4 text-sm text-destructive" role="alert">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Sistem özeti">
        {[
          ['Kullanıcı', overview?.stats?.users],
          ['Etkinlik', overview?.stats?.projects],
          ['Aktif hak kaydı', overview?.stats?.activeGrants],
          ['Denetim kaydı', overview?.stats?.auditEntries],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-border bg-white p-5 shadow-sm shadow-midnight/[0.025] transition-colors hover:border-midnight/15">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
            <p className="mt-2 font-serif text-3xl tabular-nums text-midnight">{value ?? '—'}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-border bg-white p-6 sm:p-8">
        <div className="mb-5">
          <h2 className="font-serif text-2xl text-midnight">Paket durumu</h2>
          <p className="mt-1 text-sm text-muted-foreground">Aktiflik ve katalog görünürlüğü yeni satış/atamaları yönetir; mevcut satın alınmış haklar değiştirilmez.</p>
        </div>
        <div className="space-y-3">
          {packages.map((plan) => (
            <article key={plan.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-midnight/20 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-medium text-midnight">{plan.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2"><Badge variant={plan.settings.is_active ? 'secondary' : 'outline'}>{plan.settings.is_active ? 'Aktif' : 'Pasif'}</Badge><Badge variant="outline">{plan.settings.is_public ? 'Katalogda görünür' : 'Katalogda gizli'}</Badge><span className="text-xs text-muted-foreground">{plan.eventCredits} etkinlik kredisi</span></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {overview?.canManage && (
                  <>
                    <Button size="sm" variant="outline" disabled={Boolean(savingPackage)} onClick={() => updatePackage(plan, 'is_active', !plan.settings.is_active)}>
                      {savingPackage === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : plan.settings.is_active ? 'Devre dışı bırak' : 'Etkinleştir'}
                    </Button>
                    <Button size="sm" variant="outline" disabled={Boolean(savingPackage) || !plan.settings.is_active} onClick={() => updatePackage(plan, 'is_public', !plan.settings.is_public)}>
                      {plan.settings.is_public ? 'Katalogdan gizle' : 'Katalogda göster'}
                    </Button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Fiyat ve hak tanımları kod içindeki merkezi paket kaynağında kalır. Bu panel güvenli biçimde yalnızca satış aktifliğini ve katalog görünürlüğünü değiştirir.</p>
      </section>

      {overview?.canManage && <AdminDiagnostics />}

      <section className="rounded-3xl border border-border bg-white p-6 sm:p-8">
        <h2 className="font-serif text-2xl text-midnight">Son yönetim işlemleri</h2>
        {auditLogs.length ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-ivory-50 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 font-semibold">İşlem</th>
                    <th className="px-4 py-3 font-semibold">Hedef</th>
                    <th className="px-4 py-3 font-semibold">Yönetici</th>
                    <th className="px-4 py-3 font-semibold">Değişiklik</th>
                    <th className="px-4 py-3 font-semibold">Gerekçe</th>
                    <th className="px-4 py-3 font-semibold">Zaman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLogs.map((item) => (
                    <tr key={item.id} className="align-top transition-colors hover:bg-ivory-50/70">
                      <td className="whitespace-nowrap px-4 py-3.5"><Badge variant="outline" className="font-medium">{item.action || 'İşlem'}</Badge></td>
                      <td className="max-w-[160px] break-all px-4 py-3.5 font-mono text-[11px] text-muted-foreground">{item.target_id || '—'}</td>
                      <td className="max-w-[160px] break-all px-4 py-3.5 text-xs">{item.actor_user_id || 'Bootstrap'}</td>
                      <td className="max-w-[260px] px-4 py-3.5 text-xs">
                        {item.after && typeof item.after === 'object' ? (
                          <details className="group">
                            <summary className="cursor-pointer list-none rounded-lg px-2 py-1.5 text-midnight outline-none transition hover:bg-midnight/5 focus-visible:ring-2 focus-visible:ring-champagne">
                              <span className="block truncate font-medium">{summarizeAuditChange(item.after)}</span>
                              <span className="mt-1 block text-[10px] text-muted-foreground group-open:text-champagne-dark">Ayrıntıları görüntüle</span>
                            </summary>
                            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-ivory-50 p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">{JSON.stringify(item.after, null, 2)}</pre>
                          </details>
                        ) : <span className="break-words text-muted-foreground">{item.after || '—'}</span>}
                      </td>
                      <td className="max-w-[180px] px-4 py-3.5 text-xs leading-relaxed text-muted-foreground">{item.reason || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">{formatDate(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : <div className="mt-5 rounded-xl border border-dashed border-border px-5 py-10 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-muted-foreground/60" /><p className="mt-3 text-sm font-medium text-midnight">Henüz yönetim işlemi yok</p><p className="mt-1 text-xs text-muted-foreground">Yönetim değişiklikleri burada listelenir.</p></div>}
      </section>
    </div>
  )
}
