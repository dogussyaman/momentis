'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, Loader2, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function AdminDiagnostics() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/diagnostics', { credentials: 'include', cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Sistem kontrolleri yüklenemedi')
      setReport(data)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <section className="rounded-3xl border border-border bg-white p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-2xl text-midnight"><Activity className="h-5 w-5" /> Sistem sağlığı ve hatalar</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">Veritabanı erişimi, kaydedilmiş başarısız gönderimler, kilitli giriş denemeleri ve tamamlanmamış kota işlemleri.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" /> Kontrol et</Button>
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-white p-3 text-sm text-destructive">{error}</p>}
      {loading && !report ? (
        <p role="status" className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Kontroller çalışıyor</p>
      ) : report && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['MongoDB', report.checks.database.ok ? 'Erişilebilir' : 'Erişilemiyor', report.checks.database.ok],
              ['Başarısız gönderim', report.checks.failedMessages, report.checks.failedMessages === 0],
              ['Kilitli giriş', report.checks.lockedAccounts, report.checks.lockedAccounts === 0],
              ['Bekleyen kota işlemi', report.checks.pendingUsage, report.checks.pendingUsage === 0],
            ].map(([label, value, ok]) => (
              <article key={label} className="rounded-xl border border-border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                <Badge variant={ok ? 'secondary' : 'destructive'} className="mt-2">{value}</Badge>
              </article>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Son kontrol: {formatDate(report.checkedAt)}. Uygulama genelindeki tüm sunucu hataları kalıcı loglanmıyor; burada mevcut veritabanına yazılmış olaylar gösterilir.</p>
          <div className="mt-5">
            <h3 className="text-sm font-medium text-midnight">Son başarısız gönderimler</h3>
            {report.failures.length ? (
              <div className="mt-3 space-y-2">
                {report.failures.map((item) => (
                  <article key={item.id} className="rounded-xl border border-border bg-ivory-50 p-3">
                    <div className="flex flex-wrap justify-between gap-2 text-xs">
                      <span>{item.channel || 'kanal bilinmiyor'} · {item.type || 'tür bilinmiyor'} · Proje {item.projectId || '—'}</span>
                      <time>{formatDate(item.createdAt)}</time>
                    </div>
                    {item.error && <p className="mt-2 break-words text-xs text-destructive">{item.error}</p>}
                  </article>
                ))}
              </div>
            ) : <p className="mt-2 text-sm text-muted-foreground">Kaydedilmiş başarısız gönderim yok.</p>}
          </div>
        </>
      )}
    </section>
  )
}
