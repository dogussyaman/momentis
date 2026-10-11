'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TYPE_LABELS = { website: 'Davet sitesi', invitation: 'Davetiye' }

export function AdminTemplateManager() {
  const [templates, setTemplates] = useState([])
  const [canManage, setCanManage] = useState(false)
  const [filter, setFilter] = useState('all')
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
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filteredTemplates = useMemo(() => templates.filter((template) => {
    const matchesType = filter === 'all' || (filter === 'inactive' ? !template.active : template.type === filter)
    const needle = query.trim().toLocaleLowerCase('tr')
    const matchesQuery = !needle || `${template.name} ${template.description}`.toLocaleLowerCase('tr').includes(needle)
    return matchesType && matchesQuery
  }), [filter, query, templates])

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
      setNotice(`${template.name} şablonu güncellendi.`)
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setSavingKey('')
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-champagne-dark"><ShieldCheck className="h-4 w-4" /> Admin · Ürün erişimi</p>
          <h1 className="mt-2 font-serif text-4xl text-midnight">Şablon Yönetimi</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Davet sitesi ve dijital davetiye şablonlarını tek tek Free veya Premium olarak sınıflandırın. Değişiklikler kullanıcı kataloglarına, rozetlere ve sunucu erişim kontrollerine uygulanır.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" /> Yenile</Button>
      </header>

      {error && <p className="rounded-xl border border-destructive/30 bg-white p-4 text-sm text-destructive" role="alert">{error}</p>}
      {notice && <p className="rounded-xl border border-emerald-700/20 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">{notice}</p>}

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={setFilter} className="min-w-0">
          <TabsList aria-label="Şablon türü" className="h-auto w-fit max-w-full flex-wrap justify-start gap-2 rounded-xl bg-transparent p-0">
            <TabsTrigger value="all" className="rounded-xl border border-border bg-ivory-50 data-[state=active]:border-midnight data-[state=active]:bg-midnight data-[state=active]:text-ivory">Tümü</TabsTrigger>
            <TabsTrigger value="website" className="rounded-xl border border-border bg-ivory-50 data-[state=active]:border-midnight data-[state=active]:bg-midnight data-[state=active]:text-ivory">Davet siteleri</TabsTrigger>
            <TabsTrigger value="invitation" className="rounded-xl border border-border bg-ivory-50 data-[state=active]:border-midnight data-[state=active]:bg-midnight data-[state=active]:text-ivory">Dijital davetiyeler</TabsTrigger>
            <TabsTrigger value="inactive" className="rounded-xl border border-border bg-ivory-50 data-[state=active]:border-midnight data-[state=active]:bg-midnight data-[state=active]:text-ivory">Pasif şablonlar</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Şablon ara..." className="pl-9" aria-label="Şablon ara" />
        </div>
      </section>

      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground" aria-live="polite">{loading ? 'Yükleniyor…' : `${filteredTemplates.length} şablon`}</p>
      {loading ? (
        <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" /> Şablonlar yükleniyor</div>
      ) : filteredTemplates.length ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Düzenlenebilir şablonlar">
            {filteredTemplates.map((template) => {
              const key = `${template.type}:${template.key}`
              return (
                <article key={key} className="overflow-hidden rounded-2xl border border-border bg-white">
                  <div className="relative aspect-[16/9] bg-midnight/5">
                    <img src={template.preview} alt="" loading="lazy" className="h-full w-full object-cover" />
                    <Badge className="absolute left-3 top-3 bg-midnight/90 text-white hover:bg-midnight/90">{TYPE_LABELS[template.type]}</Badge>
                    <Badge className={`absolute right-3 top-3 ${template.tier === 'premium' ? 'bg-champagne text-midnight hover:bg-champagne' : 'bg-white text-midnight hover:bg-white'}`}>
                      {template.tier === 'premium' ? 'Premium' : 'Free'}
                    </Badge>
                    {!template.active && <Badge className="absolute bottom-3 left-3 bg-destructive text-white hover:bg-destructive">Pasif</Badge>}
                  </div>
                  <div className="space-y-4 p-4">
                    <div>
                      <h2 className="font-serif text-xl text-midnight">{template.name}</h2>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{template.description}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs font-medium text-midnight">
                        Erişim paketi
                        <Select value={template.tier} onValueChange={(tier) => updateTemplate(template, { tier })} disabled={!canManage || Boolean(savingKey)}>
                          <SelectTrigger className="mt-2 h-10 rounded-xl" aria-label={`${template.name} erişim paketi`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free — ücretsiz paket</SelectItem>
                            <SelectItem value="premium">Premium — ücretli paket</SelectItem>
                          </SelectContent>
                        </Select>
                      </label>
                      <label className="block text-xs font-medium text-midnight">
                        Katalog durumu
                        <Select value={template.active ? 'active' : 'inactive'} onValueChange={(value) => updateTemplate(template, { active: value === 'active' })} disabled={!canManage || Boolean(savingKey)}>
                          <SelectTrigger className="mt-2 h-10 rounded-xl" aria-label={`${template.name} katalog durumu`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Aktif — seçilebilir</SelectItem>
                            <SelectItem value="inactive">Pasif — yeni seçim kapalı</SelectItem>
                          </SelectContent>
                        </Select>
                      </label>
                    </div>
                    {savingKey === key && <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Kaydediliyor…</p>}
                  </div>
                </article>
              )
            })}
          </section>
          {!canManage && <p className="text-xs text-muted-foreground">Bu hesap salt-okunur yönetim yetkisine sahip; şablon ayarları değiştirilemez.</p>}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
          <p className="font-serif text-2xl text-midnight">Şablon bulunamadı</p>
          <p className="mt-2 text-sm text-muted-foreground">Arama terimini veya şablon türü filtresini değiştirin.</p>
        </div>
      )}
    </div>
  )
}
