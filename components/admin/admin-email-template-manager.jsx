'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, Loader2, Mail, RefreshCw, Save, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const FIELD_DEFINITIONS = [
  { key: 'subject', label: 'E-posta konusu', maxLength: 180 },
  { key: 'eyebrow', label: 'Üst etiket', maxLength: 180 },
  { key: 'title', label: 'Başlık', maxLength: 180 },
  { key: 'intro', label: 'Mesaj', maxLength: 1000, multiline: true },
  { key: 'ctaLabel', label: 'Buton metni', maxLength: 180 },
  { key: 'footer', label: 'Alt bilgi', maxLength: 1000, multiline: true },
]

export function AdminEmailTemplateManager() {
  const [items, setItems] = useState([])
  const [selectedKey, setSelectedKey] = useState('')
  const [fields, setFields] = useState(null)
  const [preview, setPreview] = useState(null)
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const selectedKeyRef = useRef('')

  const selected = useMemo(() => items.find((item) => item.key === selectedKey) || null, [items, selectedKey])
  const hasUnsavedChanges = Boolean(selected && fields && JSON.stringify(fields) !== JSON.stringify(selected.fields))

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/email-templates', { credentials: 'include', cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'E-posta şablonları yüklenemedi')
      const selectedItem = data.items?.find((item) => item.key === selectedKeyRef.current) || data.items?.[0]
      setItems(data.items || [])
      setCanManage(data.canManage === true)
      selectedKeyRef.current = selectedItem?.key || ''
      setSelectedKey(selectedItem?.key || '')
      setFields(selectedItem ? { ...selectedItem.fields } : null)
      setPreview(selectedItem?.preview || null)
    } catch (loadError) {
      setError(loadError.message || 'E-posta şablonları yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const updateField = (key, value) => {
    setFields((current) => ({ ...current, [key]: value }))
    setPreview(null)
    setNotice('')
  }

  const selectTemplate = (key) => {
    if (hasUnsavedChanges && !window.confirm('Kaydedilmemiş değişiklikler var. Başka şablona geçerseniz bu değişiklikler silinecek. Devam edilsin mi?')) return
    const next = items.find((item) => item.key === key)
    selectedKeyRef.current = key
    setSelectedKey(key)
    setFields(next ? { ...next.fields } : null)
    setPreview(next?.preview || null)
    setError('')
    setNotice('')
  }

  const uploadImage = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy('image')
    setError('')
    setNotice('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      const response = await fetch('/api/admin/email-templates/assets', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Görsel yüklenemedi')
      setFields((current) => ({ ...current, imageUrl: data.imageUrl }))
      setPreview(null)
      setNotice('Görsel yüklendi. E-posta önizlemesini yenileyip kaydedin.')
    } catch (uploadError) {
      setError(uploadError.message || 'Görsel yüklenemedi')
    } finally {
      setBusy('')
    }
  }

  const previewTemplate = async () => {
    setBusy('preview')
    setError('')
    try {
      const response = await fetch('/api/admin/email-templates/preview', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: selectedKey, fields }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Önizleme oluşturulamadı')
      setPreview(data.preview)
    } catch (previewError) {
      setError(previewError.message || 'Önizleme oluşturulamadı')
    } finally {
      setBusy('')
    }
  }

  const saveTemplate = async () => {
    setBusy('save')
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/admin/email-templates/${encodeURIComponent(selectedKey)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'E-posta şablonu kaydedilemedi')
      setItems((current) => current.map((item) => (
        item.key === selectedKey
          ? { ...item, fields: data.fields, updatedAt: data.updatedAt }
          : item
      )))
      const previewResponse = await fetch('/api/admin/email-templates/preview', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: selectedKey, fields: data.fields }),
      })
      const previewData = await previewResponse.json().catch(() => ({}))
      if (!previewResponse.ok) throw new Error(previewData.error || 'Şablon kaydedildi ancak önizleme yenilenemedi')
      setPreview(previewData.preview)
      setNotice('E-posta şablonu kaydedildi. Yeni gönderimlerde kullanılacak.')
    } catch (saveError) {
      setError(saveError.message || 'E-posta şablonu kaydedilemedi')
    } finally {
      setBusy('')
    }
  }

  if (loading && !items.length) {
    return <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" /> E-posta şablonları yükleniyor</div>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-champagne-dark"><Mail className="h-4 w-4" /> Admin · Bildirimler</p>
          <h1 className="mt-2 font-serif text-4xl text-midnight">E-posta şablonları</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Hesap, etkinlik, VIP ve yönetim bildirimlerinin konu ve metinlerini düzenleyin; kaydetmeden önce örnek e-postayı kontrol edin.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading || hasUnsavedChanges}><RefreshCw className="mr-2 h-4 w-4" /> Yenile</Button>
      </header>

      {error && <p className="rounded-xl border border-destructive/30 bg-white p-4 text-sm text-destructive" role="alert">{error}</p>}
      {notice && <p className="rounded-xl border border-emerald-700/20 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">{notice}</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section className="space-y-5 rounded-2xl border border-border bg-white p-5 sm:p-7">
          <div className="space-y-2">
            <label htmlFor="email-template" className="text-sm font-medium text-midnight">Bildirim türü</label>
            <Select value={selectedKey} onValueChange={selectTemplate}>
              <SelectTrigger id="email-template" aria-label="E-posta şablonu seç"><SelectValue placeholder="Şablon seçin" /></SelectTrigger>
              <SelectContent>
                {items.map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selected && fields && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{selected.audience}</Badge>
                <span>Değişkenler: <code>{'{{subject}}'}</code>, <code>{'{{title}}'}</code>, <code>{'{{message}}'}</code></span>
              </div>
              {FIELD_DEFINITIONS.map((field) => (
                <label key={field.key} className="block space-y-1.5 text-xs font-medium text-midnight">
                  {field.label}
                  {field.multiline
                    ? <textarea rows={field.key === 'intro' ? 4 : 3} maxLength={field.maxLength} value={fields[field.key] || ''} onChange={(event) => updateField(field.key, event.target.value)} className="w-full rounded-xl border border-border bg-white p-3 text-sm font-normal outline-none focus:border-champagne focus:ring-1 focus:ring-champagne" />
                    : <Input maxLength={field.maxLength} value={fields[field.key] || ''} onChange={(event) => updateField(field.key, event.target.value)} />}
                </label>
              ))}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-midnight">E-posta görseli (URL veya Dosya)</p>
                  <p className="text-xs text-muted-foreground">HTTPS URL veya 4 MB dosya</p>
                </div>
                
                <div className="space-y-2">
                  <Input
                    type="url"
                    value={fields.imageUrl || ''}
                    onChange={(event) => updateField('imageUrl', event.target.value)}
                    placeholder="https://... görsel bağlantısı"
                    className="h-10 text-xs font-mono"
                    disabled={!canManage || busy !== ''}
                  />
                  {canManage && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => updateField('imageUrl', 'https://momentis-mu.vercel.app/home-hero/davetiye.png')}
                        disabled={busy !== ''}
                      >
                        Davetiye Görseli URL
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => updateField('imageUrl', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80')}
                        disabled={busy !== ''}
                      >
                        Site Görseli URL (İnternet)
                      </Button>
                      <label className="inline-flex cursor-pointer items-center rounded-md border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-midnight hover:bg-ivory-50">
                        {busy === 'image' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="mr-1.5 h-3.5 w-3.5" />}
                        Dosya Yükle
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={uploadImage} disabled={busy !== ''} />
                      </label>
                      {fields.imageUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] text-destructive hover:text-destructive"
                          onClick={() => updateField('imageUrl', '')}
                          disabled={busy !== ''}
                        >
                          <X className="mr-1 h-3.5 w-3.5" /> Kaldır
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {fields.imageUrl && (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-ivory-50 p-2.5">
                    <img
                      src={fields.imageUrl}
                      alt="E-posta görsel önizlemesi"
                      className="h-16 w-28 rounded-lg border border-border object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                    <div className="min-w-0 flex-1 text-xs text-muted-foreground">
                      <p className="truncate font-mono text-[11px] text-midnight">{fields.imageUrl}</p>
                      <p className="mt-0.5 text-[10px]">Önizlemeyi yenileyerek e-posta içindeki görünümü kontrol edin.</p>
                    </div>
                  </div>
                )}
              </div>
              <label className={`flex items-start gap-3 rounded-xl border border-border bg-ivory-50 p-3 ${canManage ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}>
                <input
                  type="checkbox"
                  checked={fields.showVipShowcase === true}
                  onChange={(event) => updateField('showVipShowcase', event.target.checked)}
                  disabled={!canManage || busy !== ''}
                  className="mt-0.5 h-4 w-4 accent-[#C9A96E]"
                />
                <span>
                  <span className="block text-sm font-medium text-midnight">VIP tasarım vitrini ekle</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">E-postanın alt bölümünde üç gerçek VIP site tasarımı marka logolu kartlar halinde görünür. Hesap açılışı ve VIP kullanıcı e-postalarında varsayılan olarak açıktır.</span>
                </span>
              </label>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={previewTemplate} disabled={busy !== ''}>
                  {busy === 'preview' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Önizlemeyi güncelle
                </Button>
                {hasUnsavedChanges && <Button type="button" variant="outline" onClick={() => { setFields({ ...selected.fields }); setPreview(selected.preview); setNotice('Kaydedilmemiş değişiklikler geri alındı.') }} disabled={busy !== ''}>Değişiklikleri geri al</Button>}
                <Button onClick={saveTemplate} disabled={!canManage || busy !== '' || !hasUnsavedChanges}>
                  {busy === 'save' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Kaydet
                </Button>
              </div>
              {!canManage && <p className="text-xs text-muted-foreground">Salt-okunur yönetim rolü: önizleme açık, düzenleme kapalı.</p>}
            </>
          )}
        </section>

        <section className="min-w-0 space-y-3 rounded-2xl border border-border bg-white p-5 sm:p-7">
          <div>
            <h2 className="font-serif text-2xl text-midnight">E-posta önizlemesi</h2>
            <p className="mt-1 break-all text-sm text-muted-foreground">Konu: {preview?.subject || 'Önizleme oluşturun'}</p>
          </div>
          {preview?.html
            ? <iframe title="E-posta şablonu önizlemesi" sandbox="" srcDoc={preview.html} className="h-[620px] w-full rounded-xl border border-border bg-ivory-50" />
            : <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">Önizleme henüz oluşturulmadı.</div>}
          <p className="text-xs leading-relaxed text-muted-foreground">MOMENTIS logosu tüm bildirim e-postalarında otomatik gösterilir. VIP tasarım kartlarının görünürlüğünü soldaki seçenekten kontrol edebilirsin. Davetiye gönderimi, RSVP, şifre sıfırlama ve Resend bağlantı testi ayrı e-posta akışlarıdır.</p>
        </section>
      </div>
    </div>
  )
}
