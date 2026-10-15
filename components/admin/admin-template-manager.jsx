'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Coins,
  Crown,
  Eye,
  EyeOff,
  Filter,
  Globe,
  Layers,
  LayoutTemplate,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CardGridSkeleton } from '@/components/ui/luxury-loader'

const TYPE_LABELS = { website: 'Davet sitesi', invitation: 'Davetiye' }

function CountBadge({ children }) {
  return (
    <span className="ml-1.5 rounded-full bg-ivory-100 px-2 py-0.5 text-[10px] tabular-nums font-semibold text-midnight data-[state=active]:bg-white/20 data-[state=active]:text-white transition-colors">
      {children}
    </span>
  )
}

export function AdminTemplateManager() {
  const [templates, setTemplates] = useState([])
  const [canManage, setCanManage] = useState(false)
  const [filter, setFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all') // 'all' | 'premium' | 'free'
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/templates', { credentials: 'include', cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Şablon listesi yüklenemedi')
      setTemplates(data.items || [])
      setCanManage(data.canManage === true)
    } catch (loadError) {
      setError(loadError.message)
      toast.error(loadError.message || 'Şablonlar yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Counts for KPI and tabs
  const counts = useMemo(() => {
    return {
      all: templates.length,
      website: templates.filter((t) => t.type === 'website').length,
      invitation: templates.filter((t) => t.type === 'invitation').length,
      inactive: templates.filter((t) => !t.active).length,
      premium: templates.filter((t) => t.tier === 'premium').length,
      free: templates.filter((t) => t.tier === 'free').length,
    }
  }, [templates])

  const filteredTemplates = useMemo(() => templates.filter((template) => {
    const matchesType = filter === 'all' || (filter === 'inactive' ? !template.active : template.type === filter)
    const matchesTier = tierFilter === 'all' || template.tier === tierFilter
    const needle = query.trim().toLocaleLowerCase('tr')
    const matchesQuery = !needle || `${template.name} ${template.description} ${template.key}`.toLocaleLowerCase('tr').includes(needle)
    return matchesType && matchesTier && matchesQuery
  }), [filter, tierFilter, query, templates])

  const updateTemplate = async (template, changes) => {
    const key = `${template.type}:${template.key}`
    setSavingKey(key)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/admin/templates/${template.type}/${template.key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(changes),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Şablon paketi güncellenemedi')
      setTemplates((current) => current.map((item) => (
        item.type === template.type && item.key === template.key ? { ...item, ...data.template } : item
      )))
      const msg = `${template.name} şablonu başarıyla güncellendi.`
      setNotice(msg)
      toast.success(msg)
    } catch (updateError) {
      setError(updateError.message)
      toast.error(updateError.message || 'Güncelleme başarısız oldu')
    } finally {
      setSavingKey('')
    }
  }

  const clearFilters = () => {
    setFilter('all')
    setTierFilter('all')
    setQuery('')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8 pb-12">
      {/* Luxury Hero Banner */}
      <header className="relative overflow-hidden rounded-[2.5rem] bg-midnight px-6 py-8 text-ivory shadow-xl sm:px-10 sm:py-10">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-champagne/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-champagne">
              <ShieldCheck className="h-4 w-4" /> MOMENTIS ADMIN · ŞABLON & KATALOG MİMARİSİ
            </p>
            <h1 className="font-serif text-3xl font-normal sm:text-4xl text-white tracking-tight">
              Şablon Yönetimi
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-ivory/70">
              Davet sitesi ve dijital davetiye tasarımlarını tek merkezden yönetin. Erişim paketlerini (Free / Premium) ve katalog görünürlüğünü tek dokunuşla belirleyin.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-2xl border-white/20 bg-white/10 px-4 text-xs font-medium text-ivory shadow-sm backdrop-blur hover:bg-white/20 hover:text-white"
              onClick={load}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-champagne" /> : <RefreshCw className="mr-2 h-4 w-4 text-champagne" />}
              Yenile
            </Button>
          </div>
        </div>
      </header>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Şablon istatistikleri">
        <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-xs transition hover:border-champagne/40">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <LayoutTemplate className="h-3.5 w-3.5 text-champagne-dark" /> Toplam
          </p>
          <p className="mt-2 font-serif text-2xl font-bold tabular-nums text-midnight">{counts.all}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">Kayıtlı tasarım</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-xs transition hover:border-champagne/40">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Globe className="h-3.5 w-3.5 text-blue-600" /> Siteler
          </p>
          <p className="mt-2 font-serif text-2xl font-bold tabular-nums text-midnight">{counts.website}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">Davet sitesi</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-xs transition hover:border-champagne/40">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-purple-600" /> Davetiyeler
          </p>
          <p className="mt-2 font-serif text-2xl font-bold tabular-nums text-midnight">{counts.invitation}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">Dijital kart</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-xs transition hover:border-champagne/40">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Crown className="h-3.5 w-3.5 text-amber-500" /> Premium
          </p>
          <p className="mt-2 font-serif text-2xl font-bold tabular-nums text-amber-700">{counts.premium}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">Ücretli paket</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-xs transition hover:border-champagne/40">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Coins className="h-3.5 w-3.5 text-emerald-600" /> Free
          </p>
          <p className="mt-2 font-serif text-2xl font-bold tabular-nums text-emerald-700">{counts.free}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">Ücretsiz erişim</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-xs transition hover:border-champagne/40">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <EyeOff className="h-3.5 w-3.5 text-destructive" /> Pasif
          </p>
          <p className="mt-2 font-serif text-2xl font-bold tabular-nums text-destructive">{counts.inactive}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">Katalogda gizli</p>
        </div>
      </section>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-700/20 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar with shadcn Tabs */}
      <section className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          {/* Main Type Tabs */}
          <Tabs value={filter} onValueChange={setFilter} className="min-w-0 flex-1">
            <TabsList aria-label="Şablon türü" className="h-auto w-wrap flex-wrap justify-start gap-1.5 rounded-2xl border border-midnight/10 bg-ivory-50/70 p-1.5">
              <TabsTrigger
                value="all"
                className="rounded-xl px-3.5 py-2 text-xs font-medium text-midnight/70 transition-all hover:text-midnight data-[state=active]:bg-midnight data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                Tümü <CountBadge>{counts.all}</CountBadge>
              </TabsTrigger>
              <TabsTrigger
                value="website"
                className="rounded-xl px-3.5 py-2 text-xs font-medium text-midnight/70 transition-all hover:text-midnight data-[state=active]:bg-midnight data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                Davet Siteleri <CountBadge>{counts.website}</CountBadge>
              </TabsTrigger>
              <TabsTrigger
                value="invitation"
                className="rounded-xl px-3.5 py-2 text-xs font-medium text-midnight/70 transition-all hover:text-midnight data-[state=active]:bg-midnight data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                Dijital Davetiyeler <CountBadge>{counts.invitation}</CountBadge>
              </TabsTrigger>
              <TabsTrigger
                value="inactive"
                className="rounded-xl px-3.5 py-2 text-xs font-medium text-midnight/70 transition-all hover:text-midnight data-[state=active]:bg-midnight data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                Pasif Şablonlar <CountBadge>{counts.inactive}</CountBadge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search Box */}
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Şablon adı veya anahtar ara..."
              className="h-11 rounded-2xl pl-9 pr-8 text-xs bg-ivory-50/50 border-border/80 focus-visible:border-champagne"
              aria-label="Şablon ara"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-ivory-100 hover:text-midnight"
                aria-label="Aramayı temizle"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Tier Quick Filter */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wider mr-1">
            <Filter className="h-3.5 w-3.5 text-champagne-dark" /> Paket Filtresi:
          </span>
          <button
            type="button"
            onClick={() => setTierFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              tierFilter === 'all'
                ? 'bg-midnight text-white'
                : 'bg-ivory-50 text-muted-foreground hover:bg-ivory-100 hover:text-midnight'
            }`}
          >
            Tüm Paketler ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setTierFilter('premium')}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              tierFilter === 'premium'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Crown className="mr-1 inline h-3 w-3" /> Yalnızca Premium ({counts.premium})
          </button>
          <button
            type="button"
            onClick={() => setTierFilter('free')}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              tierFilter === 'free'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Coins className="mr-1 inline h-3 w-3" /> Yalnızca Free ({counts.free})
          </button>

          {(filter !== 'all' || tierFilter !== 'all' || query) && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-champagne-dark hover:text-midnight transition"
            >
              <X className="h-3 w-3" /> Filtreleri sıfırla
            </button>
          )}
        </div>
      </section>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground" aria-live="polite">
          {loading ? 'Şablonlar taranıyor…' : `${filteredTemplates.length} şablon listeleniyor`}
        </p>
        {!canManage && (
          <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-50 border-amber-200">
            Salt-Okunur Yetki
          </Badge>
        )}
      </div>

      {/* Template Cards Grid */}
      {loading ? (
        <CardGridSkeleton count={6} columns="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" />
      ) : filteredTemplates.length ? (
        <>
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Düzenlenebilir şablonlar">
            {filteredTemplates.map((template) => {
              const key = `${template.type}:${template.key}`
              const isSaving = savingKey === key
              const isWebsite = template.type === 'website'

              return (
                <article
                  key={key}
                  className={`group relative flex flex-col overflow-hidden rounded-[24px] border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isSaving
                      ? 'border-champagne ring-2 ring-champagne/30'
                      : template.active
                      ? 'border-border/80 hover:border-champagne/60'
                      : 'border-border/60 opacity-80 hover:opacity-100 hover:border-border'
                  }`}
                >
                  {/* Media Preview */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-midnight/5">
                    <img
                      src={template.preview}
                      alt={template.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-midnight/60 via-transparent to-black/20" />

                    {/* Type Badge */}
                    <Badge className="absolute left-3.5 top-3.5 gap-1.5 rounded-full border border-white/20 bg-midnight/80 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md shadow-xs">
                      {isWebsite ? <Globe className="h-3 w-3 text-champagne" /> : <Sparkles className="h-3 w-3 text-champagne" />}
                      {TYPE_LABELS[template.type]}
                    </Badge>

                    {/* Tier Badge */}
                    <Badge
                      className={`absolute right-3.5 top-3.5 rounded-full px-3 py-1 text-[10px] font-bold shadow-xs ${
                        template.tier === 'premium'
                          ? 'border border-amber-300/40 bg-gradient-to-r from-[#D4AF37] to-[#B8942A] text-midnight shadow-md'
                          : 'border border-border/80 bg-white/90 text-midnight backdrop-blur'
                      }`}
                    >
                      {template.tier === 'premium' ? (
                        <span className="flex items-center gap-1">
                          <Crown className="h-3 w-3" /> Premium
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Coins className="h-3 w-3 text-muted-foreground" /> Free
                        </span>
                      )}
                    </Badge>

                    {/* Status Dot / Indicator */}
                    <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5 rounded-full bg-midnight/70 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
                      <span className={`h-2 w-2 rounded-full ${template.active ? 'bg-emerald-400 ring-2 ring-emerald-400/40' : 'bg-rose-400'}`} />
                      <span>{template.active ? 'Katalogda Aktif' : 'Pasif / Gizli'}</span>
                    </div>

                    {/* Key Watermark on preview */}
                    <span className="absolute bottom-3.5 right-3.5 font-mono text-[9px] uppercase tracking-wider text-white/70">
                      {template.key}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-serif text-xl font-medium text-midnight leading-snug group-hover:text-champagne-dark transition-colors">
                          {template.name}
                        </h2>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {template.description}
                      </p>
                    </div>

                    {/* Select Controls Box */}
                    <div className="rounded-2xl border border-border/70 bg-ivory-50/60 p-3.5 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-midnight/80">
                          Erişim Paketi
                          <Select
                            value={template.tier}
                            onValueChange={(tier) => updateTemplate(template, { tier })}
                            disabled={!canManage || Boolean(savingKey)}
                          >
                            <SelectTrigger
                              className="mt-1.5 h-10 rounded-xl bg-white text-xs border-border/80 focus:border-champagne"
                              aria-label={`${template.name} erişim paketi`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="free" className="text-xs">
                                <span className="flex items-center gap-1.5">
                                  <Coins className="h-3.5 w-3.5 text-emerald-600" /> Free — Ücretsiz
                                </span>
                              </SelectItem>
                              <SelectItem value="premium" className="text-xs">
                                <span className="flex items-center gap-1.5">
                                  <Crown className="h-3.5 w-3.5 text-amber-500" /> Premium — Ücretli
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </label>

                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-midnight/80">
                          Katalog Durumu
                          <Select
                            value={template.active ? 'active' : 'inactive'}
                            onValueChange={(value) => updateTemplate(template, { active: value === 'active' })}
                            disabled={!canManage || Boolean(savingKey)}
                          >
                            <SelectTrigger
                              className="mt-1.5 h-10 rounded-xl bg-white text-xs border-border/80 focus:border-champagne"
                              aria-label={`${template.name} katalog durumu`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="active" className="text-xs">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Aktif — Seçilebilir
                                </span>
                              </SelectItem>
                              <SelectItem value="inactive" className="text-xs">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Pasif — Gizli
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </label>
                      </div>

                      {/* Saving State Feedback */}
                      {isSaving && (
                        <p className="flex items-center gap-2 rounded-lg bg-champagne/15 px-3 py-1.5 text-xs font-medium text-midnight animate-pulse" role="status">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-champagne-dark" />
                          Değişiklik kaydediliyor…
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </section>

          {!canManage && (
            <p className="rounded-2xl border border-border bg-ivory-50 p-4 text-center text-xs text-muted-foreground">
              Bu hesap salt-okunur yönetim yetkisine sahiptir; şablon ayarlarını değiştirmek için yetkili süper yönetici oturumu gerekir.
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-white p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ivory-50 text-champagne-dark shadow-sm">
            <LayoutTemplate className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-medium text-midnight">Şablon Bulunamadı</h2>
          <p className="mt-2 max-w-sm text-xs text-muted-foreground">
            Arama teriminize veya seçtiğiniz filtrelere uygun şablon bulunamadı. Filtreleri temizleyerek tekrar deneyebilirsiniz.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="mt-6 h-10 rounded-2xl border-midnight/20 px-5 text-xs"
          >
            Filtreleri Temizle
          </Button>
        </div>
      )}
    </div>
  )
}
