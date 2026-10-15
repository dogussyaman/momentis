'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coins,
  Compass,
  Copy,
  Crown,
  Eye,
  EyeOff,
  Gift,
  Globe,
  History,
  LayoutDashboard,
  Loader2,
  Mail,
  Palette,
  PanelsTopLeft,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TicketPercent,
  User,
  UsersRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminDiagnostics } from '@/components/admin/admin-diagnostics'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function timeAgo(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return 'Az önce'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} dk önce`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} sa önce`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} gün önce`
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(date)
}

function summarizeAuditChange(value) {
  if (Array.isArray(value)) return `${value.length} öğe`
  if (!value || typeof value !== 'object') {
    return typeof value === 'string' ? value : 'Değişiklik ayrıntısı yok'
  }
  const entries = Object.entries(value)
  if (!entries.length) return 'Değişiklik ayrıntısı yok'
  const keys = entries.slice(0, 3).map(([key, val]) => `${key}: ${typeof val === 'object' ? '...' : String(val)}`)
  return `${keys.join(' · ')}${entries.length > 3 ? ` (+${entries.length - 3})` : ''}`
}

function getAuditActionMeta(action = '') {
  if (action.includes('credit') || action.includes('grant') || action.includes('coupon')) {
    return { label: action, badgeColor: 'border-emerald-200 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' }
  }
  if (action.includes('suspend') || action.includes('delete') || action.includes('revoke')) {
    return { label: action, badgeColor: 'border-destructive/30 bg-destructive/10 text-destructive', dot: 'bg-destructive' }
  }
  if (action.includes('package') || action.includes('tier') || action.includes('template')) {
    return { label: action, badgeColor: 'border-blue-200 bg-blue-50 text-blue-800', dot: 'bg-blue-500' }
  }
  if (action.includes('vip')) {
    return { label: action, badgeColor: 'border-amber-300 bg-amber-50 text-amber-900', dot: 'bg-amber-500' }
  }
  return { label: action, badgeColor: 'border-champagne/40 bg-champagne/10 text-midnight', dot: 'bg-champagne-dark' }
}

export function AdminDashboard() {
  const [overview, setOverview] = useState(null)
  const [packages, setPackages] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingPackage, setSavingPackage] = useState('')
  const [error, setError] = useState('')
  const [auditFilter, setAuditFilter] = useState('all') // all, credits, packages, users, vip
  const [auditSearch, setAuditSearch] = useState('')
  const [copiedId, setCopiedId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const responses = await Promise.all([
        fetch('/api/admin/overview', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/admin/packages', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/admin/audit-logs?limit=40', { credentials: 'include', cache: 'no-store' }),
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

  const copyToClipboard = (text, id) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(''), 2000)
  }

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

  // Filtrelenmiş audit logları
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Kategori filtresi
      if (auditFilter === 'credits') {
        if (!log.action?.includes('credit') && !log.action?.includes('grant') && !log.action?.includes('quota')) return false
      } else if (auditFilter === 'packages') {
        if (!log.action?.includes('package') && !log.action?.includes('tier') && !log.action?.includes('template')) return false
      } else if (auditFilter === 'users') {
        if (!log.action?.includes('user.') && !log.action?.includes('role') && !log.action?.includes('status')) return false
      } else if (auditFilter === 'vip') {
        if (!log.action?.includes('vip')) return false
      }

      // Arama filtresi
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase().trim()
        const matchAction = log.action?.toLowerCase().includes(q)
        const matchTarget = log.target_id?.toLowerCase().includes(q)
        const matchActor = log.actor_user_id?.toLowerCase().includes(q)
        const matchReason = log.reason?.toLowerCase().includes(q)
        if (!matchAction && !matchTarget && !matchActor && !matchReason) return false
      }

      return true
    })
  }, [auditLogs, auditFilter, auditSearch])

  if (loading && !overview) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-sm text-muted-foreground" role="status">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-champagne/30 bg-champagne/10 shadow-lg shadow-champagne/5">
          <Loader2 className="h-7 w-7 animate-spin text-champagne-dark" />
        </div>
        <p className="font-serif text-lg text-midnight">Yönetim komuta merkezi yükleniyor...</p>
      </div>
    )
  }

  if (error && !overview) {
    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-destructive/30 bg-white p-8 text-center shadow-lg shadow-destructive/5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-serif text-2xl text-midnight">Yönetim Paneline Erişilemedi</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-5 rounded-xl border-border hover:bg-ivory-50" onClick={load}>
          Tekrar dene
        </Button>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 sm:space-y-9 pb-12">
      {/* 1. ÜST BAŞLIK & KOMUTA MERKEZİ BANNER */}
      <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-white via-ivory-50/60 to-champagne/15 p-6 shadow-sm shadow-midnight/[0.03] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-champagne/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 bottom-0 h-40 w-80 -translate-x-1/2 bg-midnight/[0.02] blur-2xl" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-champagne/40 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-champagne-dark backdrop-blur-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                Yönetim Komuta Merkezi
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-midnight px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ivory">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {overview?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <h1 className="font-serif text-3xl text-midnight sm:text-4xl tracking-tight">
              Yönetim Özeti & Platform Durumu
            </h1>
            <p className="max-w-2xl text-xs text-muted-foreground sm:text-sm leading-relaxed">
              Platform istatistikleri, satış & paket yapılandırmaları, sistem telemetrisi ve canlı denetim hareketleri.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              className="h-10 rounded-xl border-border bg-white text-xs font-medium text-midnight shadow-sm hover:bg-ivory-50 transition-all"
              onClick={load}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-champagne-dark" /> : <RefreshCw className="mr-2 h-4 w-4 text-muted-foreground" />}
              Yenile
            </Button>
            <Button asChild size="sm" className="h-10 rounded-xl bg-midnight px-4 text-xs font-medium text-white hover:bg-midnight-700 shadow-sm transition-all">
              <Link href="/panel">
                <LayoutDashboard className="mr-2 h-4 w-4 text-champagne" />
                Kullanıcı Paneli
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. ANA KPI METRİK KARTLARI (4'LÜ GRİD) */}
      <section aria-label="Temel Metrikler" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Kullanıcılar */}
        <article className="group relative overflow-hidden rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-sm shadow-midnight/[0.025] transition-all hover:border-champagne/50 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Kayıtlı Kullanıcı</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-champagne/15 text-champagne-dark transition-transform group-hover:scale-105">
              <UsersRound className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-serif text-3xl font-bold tabular-nums text-midnight">
            {overview?.stats?.users ?? '—'}
          </p>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
            <span className="text-muted-foreground">Aktif & doğrulanmış</span>
            <Link href="/panel/admin/users" className="flex items-center gap-1 font-medium text-midnight hover:text-champagne-dark transition-colors">
              Yönet <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </article>

        {/* Etkinlik Projeleri */}
        <article className="group relative overflow-hidden rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-sm shadow-midnight/[0.025] transition-all hover:border-champagne/50 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Etkinlik Projesi</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-105">
              <PanelsTopLeft className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-serif text-3xl font-bold tabular-nums text-midnight">
            {overview?.stats?.projects ?? '—'}
          </p>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
            <span className="text-muted-foreground">Düğün, kına & davet</span>
            <Link href="/panel/admin/templates" className="flex items-center gap-1 font-medium text-midnight hover:text-champagne-dark transition-colors">
              Şablonlar <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </article>

        {/* Aktif Hak & Kredi Paketleri */}
        <article className="group relative overflow-hidden rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-sm shadow-midnight/[0.025] transition-all hover:border-champagne/50 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Aktif Kredi Hakkı</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-105">
              <TicketPercent className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-serif text-3xl font-bold tabular-nums text-midnight">
            {overview?.stats?.activeGrants ?? '—'}
          </p>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
            <span className="text-muted-foreground">Kullanıma hazır kota</span>
            <Link href="/panel/admin/campaigns" className="flex items-center gap-1 font-medium text-midnight hover:text-champagne-dark transition-colors">
              Kampanyalar <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </article>

        {/* Denetim Kayıtları */}
        <article className="group relative overflow-hidden rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-sm shadow-midnight/[0.025] transition-all hover:border-champagne/50 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Denetim Hareketi</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-midnight/5 text-midnight transition-transform group-hover:scale-105">
              <History className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-serif text-3xl font-bold tabular-nums text-midnight">
            {overview?.stats?.auditEntries ?? '—'}
          </p>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
            <span className="text-muted-foreground">Güvenlik & işlem logu</span>
            <span className="text-muted-foreground/80">Canlı kayıt</span>
          </div>
        </article>
      </section>

      {/* 3. HIZLI YÖNETİM MODÜLLERİ (KOMUTA KARTLARI) */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Yönetim Araçları & Modüller
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Link
            href="/panel/admin/users"
            className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-4 transition-all hover:border-champagne/60 hover:bg-ivory-50/50 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-champagne/15 text-champagne-dark group-hover:scale-105 transition-transform">
                <User className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-midnight" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-midnight">Kullanıcılar</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Rol atama, askıya alma ve bakiye tanımlama</p>
            </div>
          </Link>

          <Link
            href="/panel/admin/campaigns"
            className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-4 transition-all hover:border-champagne/60 hover:bg-ivory-50/50 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                <TicketPercent className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-midnight" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-midnight">Kampanyalar</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Toplu kredi hediyesi ve kupon dağıtımı</p>
            </div>
          </Link>

          <Link
            href="/panel/admin/vip-talepler"
            className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-4 transition-all hover:border-champagne/60 hover:bg-ivory-50/50 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 group-hover:scale-105 transition-transform">
                <Crown className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-midnight" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-midnight">VIP Talepleri</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Özel tasarım ve stüdyo üretim onayları</p>
            </div>
          </Link>

          <Link
            href="/panel/admin/templates"
            className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-4 transition-all hover:border-champagne/60 hover:bg-ivory-50/50 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                <PanelsTopLeft className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-midnight" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-midnight">Şablonlar</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Free/Premium kademe ve katalog görünürlüğü</p>
            </div>
          </Link>

          <Link
            href="/panel/admin/email-templates"
            className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-4 transition-all hover:border-champagne/60 hover:bg-ivory-50/50 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
                <Mail className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-midnight" />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-midnight">E-posta Şablonları</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Sistem bildirimleri ve şablon içerikleri</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. PAKET SATIŞ VE KATALOG KONTROLLERİ */}
      <section className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm shadow-midnight/[0.025]">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-champagne/15 text-champagne-dark">
                <Coins className="h-4 w-4" />
              </span>
              <h2 className="font-serif text-xl text-midnight sm:text-2xl">Paket Satış & Katalog Kontrolü</h2>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
              Aktiflik ve katalog görünürlüğü yeni satış ve atamaları denetler; kazanılmış mevcut müşteri hakları korunur.
            </p>
          </div>
          <Badge variant="outline" className="self-start text-[11px] text-muted-foreground sm:self-center">
            {packages.length} Tanımlı Paket
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((plan) => {
            const isPremium = plan.id === 'premium'
            const isAtolye = plan.id === 'atolye'
            const isBaslangic = plan.id === 'baslangic'

            return (
              <article
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                  isPremium
                    ? 'border-champagne/50 bg-gradient-to-b from-champagne/5 to-white shadow-sm ring-1 ring-champagne/20'
                    : 'border-border bg-white hover:border-border/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        isPremium ? 'bg-champagne/20 text-champagne-dark' : isAtolye ? 'bg-amber-100 text-amber-800' : 'bg-ivory-100 text-muted-foreground'
                      }`}>
                        {isPremium ? <Crown className="h-4 w-4" /> : isAtolye ? <Sparkles className="h-4 w-4" /> : <Compass className="h-4 w-4" />}
                      </div>
                      <h3 className="font-serif text-lg font-bold text-midnight">{plan.name}</h3>
                    </div>
                    {isPremium && (
                      <Badge variant="outline" className="border-champagne bg-champagne/15 text-[10px] text-midnight font-medium">
                        Popüler
                      </Badge>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {plan.tagline || (isBaslangic ? 'Ücretsiz başlangıç projesi' : `${plan.eventCredits} etkinlik kredisi içerir`)}
                  </p>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="font-serif text-2xl font-bold tabular-nums text-midnight">
                      {plan.price > 0 ? `${plan.price.toLocaleString('tr-TR')} ₺` : 'Ücretsiz'}
                    </span>
                    <span className="text-xs text-muted-foreground">· {plan.eventCredits} kredi</span>
                  </div>

                  {/* Durum Hapları */}
                  <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-border/50">
                    <Badge variant={plan.settings.is_active ? 'secondary' : 'outline'} className={`text-[10px] px-2 py-0.5 ${plan.settings.is_active ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : ''}`}>
                      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${plan.settings.is_active ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                      {plan.settings.is_active ? 'Satışta (Aktif)' : 'Satışa Kapalı'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground">
                      {plan.settings.is_public ? <Eye className="mr-1 h-3 w-3 text-champagne-dark inline" /> : <EyeOff className="mr-1 h-3 w-3 inline" />}
                      {plan.settings.is_public ? 'Katalogda Açık' : 'Katalogda Gizli'}
                    </Badge>
                  </div>
                </div>

                {/* Eylem Düğmeleri */}
                {overview?.canManage && (
                  <div className="mt-5 grid grid-cols-2 gap-2 pt-3 border-t border-border/50">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs"
                      disabled={Boolean(savingPackage)}
                      onClick={() => updatePackage(plan, 'is_active', !plan.settings.is_active)}
                    >
                      {savingPackage === plan.id ? (
                        <Loader2 className="h-3 w-3 animate-spin text-champagne-dark" />
                      ) : plan.settings.is_active ? (
                        'Devre Dışı'
                      ) : (
                        'Aktifleştir'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs"
                      disabled={Boolean(savingPackage) || !plan.settings.is_active}
                      onClick={() => updatePackage(plan, 'is_public', !plan.settings.is_public)}
                    >
                      {plan.settings.is_public ? 'Gizle' : 'Katalogda Aç'}
                    </Button>
                  </div>
                )}
              </article>
            )
          })}
        </div>

        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
          Fiyat ve hak tanımları güvenlik amacıyla kod içerisindeki merkezi paket kaynağında tutulur. Bu yönetim ekranı yalnızca satış durumunu ve katalog görünürlüğünü canlı olarak günceller.
        </p>
      </section>

      {/* 5. SİSTEM SAĞLIĞI & TANILAMA MODÜLÜ */}
      {overview?.canManage && <AdminDiagnostics />}

      {/* 6. SON YÖNETİM İŞLEMLERİ (DENETİM GÜNLÜĞÜ EXPLORER) */}
      <section className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-sm shadow-midnight/[0.025]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-champagne/15 text-champagne-dark">
                <History className="h-4 w-4" />
              </span>
              <h2 className="font-serif text-xl text-midnight sm:text-2xl">Son Yönetim İşlemleri</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Yetkili yöneticiler tarafından gerçekleştirilen tüm kredi, paket, kullanıcı ve şablon hareketleri.
            </p>
          </div>

          {/* Hızlı Arama */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="İşlem, kullanıcı veya gerekçe ara..."
              className="h-9 rounded-xl pl-8 text-xs"
            />
          </div>
        </div>

        {/* Kategori Filtre Sekmeleri */}
        <div className="mt-4 border-b border-border/50 pb-3">
          <Tabs value={auditFilter} onValueChange={setAuditFilter}>
            <TabsList aria-label="Denetim günlüğü kategori filtreleri" className="h-auto w-wrap flex-wrap justify-start gap-1.5 rounded-xl bg-transparent p-0">
              {[
                { id: 'all', label: 'Tüm İşlemler' },
                { id: 'credits', label: 'Krediler & Kotalar' },
                { id: 'packages', label: 'Paketler & Şablonlar' },
                { id: 'users', label: 'Kullanıcı İşlemleri' },
                { id: 'vip', label: 'VIP Talepleri' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors bg-ivory-50 text-muted-foreground hover:bg-ivory-100 hover:text-midnight data-[state=active]:bg-midnight data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Tablo & İşlem Listesi */}
        {filteredAuditLogs.length ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-ivory-50 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold">İşlem / Tür</th>
                    <th className="px-4 py-3 font-semibold">Hedef Varlık</th>
                    <th className="px-4 py-3 font-semibold">Yönetici</th>
                    <th className="px-4 py-3 font-semibold">Değişiklik Detayı</th>
                    <th className="px-4 py-3 font-semibold">Gerekçe</th>
                    <th className="px-4 py-3 font-semibold text-right">Zaman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAuditLogs.map((item) => {
                    const meta = getAuditActionMeta(item.action)
                    const isCopied = copiedId === item.id

                    return (
                      <tr key={item.id} className="align-top transition-colors hover:bg-ivory-50/70">
                        {/* İşlem Adı */}
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${meta.badgeColor}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                            {item.action || 'İşlem'}
                          </span>
                        </td>

                        {/* Hedef ID */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[11px] text-midnight truncate max-w-[120px]">
                              {item.target_id || '—'}
                            </span>
                            {item.target_id && (
                              <button
                                type="button"
                                title="Kopyala"
                                onClick={() => copyToClipboard(item.target_id, item.id)}
                                className="rounded p-1 text-muted-foreground hover:bg-ivory-100 hover:text-midnight transition-colors"
                              >
                                {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Yönetici */}
                        <td className="px-4 py-3.5 text-muted-foreground font-medium">
                          {item.actor_user_id ? (
                            <span className="truncate max-w-[130px] block" title={item.actor_user_id}>
                              {item.actor_user_id}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold text-champagne-dark">
                              Sistem / Bootstrap
                            </span>
                          )}
                        </td>

                        {/* Değişiklik Özeti ve Accordion */}
                        <td className="max-w-[240px] px-4 py-3.5">
                          {item.after && typeof item.after === 'object' ? (
                            <details className="group">
                              <summary className="cursor-pointer list-none rounded-lg p-1 text-midnight outline-none transition hover:bg-midnight/5">
                                <span className="block truncate font-mono text-[11px] text-midnight">
                                  {summarizeAuditChange(item.after)}
                                </span>
                                <span className="mt-0.5 block text-[10px] text-muted-foreground group-open:text-champagne-dark">
                                  Ayrıntıları gör ↓
                                </span>
                              </summary>
                              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-ivory-50 p-2.5 font-mono text-[10px] text-midnight">
                                {JSON.stringify(item.after, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="break-words text-muted-foreground">{item.after || '—'}</span>
                          )}
                        </td>

                        {/* Gerekçe */}
                        <td className="max-w-[160px] px-4 py-3.5 text-muted-foreground leading-relaxed">
                          <p className="truncate" title={item.reason || ''}>
                            {item.reason || '—'}
                          </p>
                        </td>

                        {/* Zaman */}
                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                          <span className="block font-medium text-midnight" title={formatDate(item.created_at)}>
                            {timeAgo(item.created_at)}
                          </span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            {formatDate(item.created_at)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-ivory-50/30 px-5 py-12 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-semibold text-midnight">Kriterlere Uyan Denetim Hareketi Bulunamadı</p>
            <p className="mt-1 text-xs text-muted-foreground">Farklı bir filtre seçebilir veya arama terimini temizleyebilirsiniz.</p>
          </div>
        )}
      </section>
    </div>
  )
}

