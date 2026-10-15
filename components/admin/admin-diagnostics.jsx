'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, AlertCircle, CheckCircle2, Database, Loader2, Lock, Mail, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react'
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

  const allHealthy = report?.checks?.database?.ok &&
    report?.checks?.failedMessages === 0 &&
    report?.checks?.lockedAccounts === 0 &&
    report?.checks?.pendingUsage === 0

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-white p-5 shadow-sm shadow-midnight/[0.03] sm:p-7 lg:p-8">
      {/* Arka plan dekoratif hafif ışıltı */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-champagne/10 blur-3xl" />
      
      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-champagne/15 text-champagne-dark">
              <Activity className="h-4 w-4" />
            </span>
            <h2 className="font-serif text-xl text-midnight sm:text-2xl">Sistem Sağlığı & Tanılama</h2>
            {report && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                allHealthy ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${allHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {allHealthy ? 'Tüm Servisler Operasyonel' : 'İnceleme Gerekebilir'}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
            Veritabanı bağlantısı, mesaj kuyruğu, kilitli oturumlar ve kota senkronizasyonu gerçek zamanlı denetlenir.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-xl border-border bg-white text-xs font-medium text-midnight shadow-none hover:bg-ivory-50 transition-all self-start sm:self-center"
          onClick={load}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-champagne-dark" /> : <RefreshCw className="mr-2 h-3.5 w-3.5 text-muted-foreground" />}
          Yeniden Kontrol Et
        </Button>
      </div>

      {error && (
        <div role="alert" className="mt-5 flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !report ? (
        <div role="status" className="flex min-h-36 items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-champagne-dark" /> Sistem telemetrisi alınıyor...
        </div>
      ) : report && (
        <div className="relative mt-6 space-y-6">
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            {/* MongoDB Card */}
            <article className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
              report.checks.database.ok
                ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-white'
                : 'border-destructive/30 bg-destructive/5'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Veritabanı</span>
                <Database className={`h-4 w-4 ${report.checks.database.ok ? 'text-emerald-600' : 'text-destructive'}`} />
              </div>
              <p className="mt-2 text-lg font-serif font-bold text-midnight">MongoDB</p>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant={report.checks.database.ok ? 'secondary' : 'destructive'} className="text-[10px] px-2 py-0.5">
                  {report.checks.database.ok ? 'Erişilebilir & Aktif' : 'Erişilemiyor'}
                </Badge>
              </div>
            </article>

            {/* Başarısız Gönderim Card */}
            <article className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
              report.checks.failedMessages === 0
                ? 'border-border bg-gradient-to-br from-ivory-50/40 via-white to-white'
                : 'border-amber-300 bg-amber-50/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">İletim Kuyruğu</span>
                <Mail className={`h-4 w-4 ${report.checks.failedMessages === 0 ? 'text-muted-foreground' : 'text-amber-600'}`} />
              </div>
              <p className="mt-2 text-lg font-serif font-bold tabular-nums text-midnight">
                {report.checks.failedMessages} <span className="text-xs font-normal text-muted-foreground">Hata</span>
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant={report.checks.failedMessages === 0 ? 'secondary' : 'destructive'} className="text-[10px] px-2 py-0.5">
                  {report.checks.failedMessages === 0 ? 'Kuyruk Temiz' : `${report.checks.failedMessages} Başarısız`}
                </Badge>
              </div>
            </article>

            {/* Kilitli Giriş Card */}
            <article className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
              report.checks.lockedAccounts === 0
                ? 'border-border bg-gradient-to-br from-ivory-50/40 via-white to-white'
                : 'border-destructive/30 bg-destructive/5'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Güvenlik Kilitleri</span>
                <Lock className={`h-4 w-4 ${report.checks.lockedAccounts === 0 ? 'text-muted-foreground' : 'text-destructive'}`} />
              </div>
              <p className="mt-2 text-lg font-serif font-bold tabular-nums text-midnight">
                {report.checks.lockedAccounts} <span className="text-xs font-normal text-muted-foreground">Hesap</span>
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant={report.checks.lockedAccounts === 0 ? 'secondary' : 'destructive'} className="text-[10px] px-2 py-0.5">
                  {report.checks.lockedAccounts === 0 ? 'Kilit Yok' : `${report.checks.lockedAccounts} Kilitli`}
                </Badge>
              </div>
            </article>

            {/* Bekleyen Kota İşlemleri Card */}
            <article className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
              report.checks.pendingUsage === 0
                ? 'border-border bg-gradient-to-br from-ivory-50/40 via-white to-white'
                : 'border-amber-300 bg-amber-50/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Kota Senkronizasyonu</span>
                <Sparkles className={`h-4 w-4 ${report.checks.pendingUsage === 0 ? 'text-muted-foreground' : 'text-amber-600'}`} />
              </div>
              <p className="mt-2 text-lg font-serif font-bold tabular-nums text-midnight">
                {report.checks.pendingUsage} <span className="text-xs font-normal text-muted-foreground">Bekleyen</span>
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant={report.checks.pendingUsage === 0 ? 'secondary' : 'destructive'} className="text-[10px] px-2 py-0.5">
                  {report.checks.pendingUsage === 0 ? 'Senkronize' : `${report.checks.pendingUsage} Bekleyen`}
                </Badge>
              </div>
            </article>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>Son kontrol zamanı: <strong className="text-midnight font-medium">{formatDate(report.checkedAt)}</strong></span>
            <span className="text-muted-foreground/80">Yalnızca kalıcı veritabanı kayıtları izlenir.</span>
          </div>

          {/* Son Başarısız Gönderim Kayıtları */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Son Başarısız İletim Kayıtları ({report.failures.length})
            </h3>
            {report.failures.length ? (
              <div className="space-y-2">
                {report.failures.map((item) => (
                  <article key={item.id} className="rounded-xl border border-destructive/20 bg-destructive/[0.02] p-3.5 transition-colors hover:border-destructive/40">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-destructive/30 text-destructive text-[10px] uppercase font-semibold">
                          {item.channel || 'Kanal'}
                        </Badge>
                        <span className="font-medium text-midnight">{item.type || 'Bilinmeyen Tür'}</span>
                        {item.projectId && <span className="font-mono text-[11px] text-muted-foreground">· Proje: {item.projectId}</span>}
                      </div>
                      <time className="text-[11px] text-muted-foreground">{formatDate(item.createdAt)}</time>
                    </div>
                    {item.error && <p className="mt-2 break-words font-mono text-[11px] leading-relaxed text-destructive/90 bg-white/80 p-2 rounded-lg border border-destructive/15">{item.error}</p>}
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-ivory-50/50 p-3.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Kaydedilmiş başarısız gönderim veya hata bulunmuyor. Mesajlaşma servisleri temiz durumda.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
