'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminDiagnostics } from '@/components/admin/admin-diagnostics'

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
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
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-champagne-dark"><ShieldCheck className="h-4 w-4" /> Yönetim</p>
          <h1 className="mt-2 font-serif text-4xl text-midnight">Admin Paneli</h1>
          <p className="mt-2 text-sm text-muted-foreground">Paket durumu, sistem özeti ve yönetim işlem geçmişi.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" /> Yenile</Button>
      </header>

      {error && <p className="rounded-xl border border-destructive/30 bg-white p-4 text-sm text-destructive" role="alert">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Sistem özeti">
        {[
          ['Kullanıcı', overview?.stats?.users],
          ['Etkinlik', overview?.stats?.projects],
          ['Aktif hak kaydı', overview?.stats?.activeGrants],
          ['Denetim kaydı', overview?.stats?.auditEntries],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-border bg-white p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
            <p className="mt-2 font-serif text-3xl text-midnight">{value ?? '—'}</p>
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
            <article key={plan.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-medium text-midnight">{plan.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{plan.settings.is_active ? 'Aktif' : 'Pasif'} · {plan.settings.is_public ? 'Katalogda görünür' : 'Katalogda gizli'} · {plan.eventCredits} etkinlik kredisi</p>
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
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="border-b text-xs uppercase tracking-wider text-muted-foreground"><th className="py-3 pr-4 font-medium">İşlem</th><th className="py-3 pr-4 font-medium">Hedef</th><th className="py-3 pr-4 font-medium">Yönetici</th><th className="py-3 pr-4 font-medium">Değişiklik</th><th className="py-3 pr-4 font-medium">Gerekçe</th><th className="py-3 font-medium">Zaman</th></tr></thead>
              <tbody>{auditLogs.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">{item.action}</td>
                  <td className="py-3 pr-4">{item.target_id}</td>
                  <td className="py-3 pr-4">{item.actor_user_id || 'Bootstrap'}</td>
                  <td className="py-3 pr-4 text-xs">{JSON.stringify(item.after || {})}</td>
                  <td className="py-3 pr-4 text-xs">{item.reason || '—'}</td>
                  <td className="py-3">{formatDate(item.created_at)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="mt-3 text-sm text-muted-foreground">Henüz yönetim işlemi kaydedilmedi.</p>}
      </section>
    </div>
  )
}
