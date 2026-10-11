'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, ExternalLink, LoaderCircle, LockKeyhole, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/auth/auth-provider'
import { VipInvitationCard } from './VipInvitationCard'
import { createVipDesignRequest } from '@/lib/vip-design/mock-service.mjs'
import { VIP_FORM_OPTIONS, VIP_INVITATION_TEMPLATES, VIP_SITE_TEMPLATES } from '@/lib/vip-design/mock-data.mjs'
import { subscribeToVipSiteSelection } from '@/lib/vip-design/vip-sync'

const DRAFT_KEY = 'momentis:vip-design:request-draft:v1'
const STEPS = ['Site konsepti', 'Etkinlik bilgileri', 'Tasarım tercihleri', 'QR fotoğraf albümü', 'Hediye davetiye', 'Özet & gönderim']
const inputClass = 'mt-1 h-11 rounded-xl border-midnight/15 bg-white'

function initialForm(siteSlug, invitationSlug) {
  const site = VIP_SITE_TEMPLATES.find((item) => item.slug === siteSlug)
  const invitation = VIP_INVITATION_TEMPLATES.find((item) => item.slug === invitationSlug)
  return {
    siteId: site?.id || '',
    invitationId: invitation?.id || '',
    event: { brideName: '', groomName: '', eventType: 'Düğün', date: '', time: '', venue: '', address: '', familyInfo: '', invitationText: '' },
    preferences: { colors: '', style: 'Romantik', referenceNotes: '', sections: ['Hikâyemiz', 'Program', 'Galeri'], description: '' },
    album: { wantsAlbum: true, guestPhotoSharing: true },
    photos: [],
  }
}

export function VipRequestWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, status: authStatus } = useAuth()
  const siteSlug = searchParams.get('site') || ''
  const invitationSlug = searchParams.get('invitation') || ''
  const [form, setForm] = useState(() => initialForm(siteSlug, invitationSlug))
  const [step, setStep] = useState(0)
  const [restored, setRestored] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [notification, setNotification] = useState('')

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(DRAFT_KEY)
      if (saved) {
        const draft = JSON.parse(saved)
        if (draft?.form) {
          setForm((current) => ({ ...current, ...draft.form, photos: Array.isArray(draft.form.photos) ? draft.form.photos : [] }))
          setStep(Math.min(Math.max(Number(draft.step) || 0, 0), STEPS.length - 1))
        }
      }
    } catch {
      setError('Kaydedilmiş taslak açılamadı. Formu yeniden doldurabilirsiniz.')
    } finally {
      setRestored(true)
    }
  }, [])

  useEffect(() => {
    if (!restored || success) return
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step }))
    } catch {
      setError('Taslak bu sekmede saklanamadı. Sayfayı kapatmadan önce talebinizi gönderin.')
    }
  }, [form, step, restored, success])

  useEffect(() => {
    const unsubscribe = subscribeToVipSiteSelection((siteId, slug) => {
      const match = VIP_SITE_TEMPLATES.find(
        (item) => item.id === siteId || item.slug === slug || item.slug === siteId
      )
      if (match) {
        setForm((current) => ({ ...current, siteId: match.id }))
        setNotification(`${match.title} konsepti seçildi!`)
      }
    })
    return () => unsubscribe()
  }, [])

  const selectedSite = useMemo(() => VIP_SITE_TEMPLATES.find((item) => item.id === form.siteId), [form.siteId])
  const selectedInvitation = useMemo(() => VIP_INVITATION_TEMPLATES.find((item) => item.id === form.invitationId), [form.invitationId])
  const updateEvent = (key, value) => setForm((current) => ({ ...current, event: { ...current.event, [key]: value } }))
  const updatePreference = (key, value) => setForm((current) => ({ ...current, preferences: { ...current.preferences, [key]: value } }))
  const updateAlbum = (key, value) => setForm((current) => ({ ...current, album: { ...current.album, [key]: value } }))

  const validateStep = () => {
    if (step === 0 && !form.siteId) return 'Devam etmek için bir VIP site konsepti seçin.'
    if (step === 1) {
      if (!form.event.brideName.trim() || !form.event.groomName.trim()) return 'Gelin ve damat adlarını girin.'
      if (!form.event.date || !form.event.venue.trim()) return 'Etkinlik tarihi ve mekân bilgilerini girin.'
    }
    if (step === 4 && !form.invitationId) return 'Bir hediye davetiye konsepti seçin.'
    if (step === 5 && (!selectedSite || !selectedInvitation)) return 'Site ve davetiye seçimlerinizi kontrol edin.'
    return ''
  }

  const next = () => {
    const message = validateStep()
    if (message) { setError(message); return }
    setError('')
    setStep((value) => Math.min(value + 1, STEPS.length - 1))
  }

  const submit = async () => {
    const message = validateStep()
    if (message) { setError(message); return }
    if (!user) {
      const nextUrl = `${window.location.pathname}${window.location.search}`
      router.push(`/giris?next=${encodeURIComponent(nextUrl)}`)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const ownerId = user.id || user._id || user.email
      const request = await createVipDesignRequest({
        userId: String(ownerId),
        userName: String(user.name || user.fullName || ''),
        userEmail: String(user.email || ''),
        selectedSiteTemplateId: form.siteId,
        selectedInvitationTemplateId: form.invitationId,
        eventDetails: form.event,
        preferences: form.preferences,
        albumPreferences: form.album,
        uploadedPhotoMetadata: form.photos,
      })
      window.sessionStorage.removeItem(DRAFT_KEY)
      setSuccess(request)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Mock talep oluşturulamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  const onPhotoChange = (event) => {
    const files = Array.from(event.target.files || [])
    if (form.photos.length + files.length > 8) {
      setError('En fazla 8 görsel metadata kaydı ekleyebilirsiniz.')
      event.target.value = ''
      return
    }
    const invalid = files.find((file) => !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024)
    if (invalid) {
      setError('Yalnızca görsel dosyası seçin; her dosya en fazla 10 MB olabilir.')
      event.target.value = ''
      return
    }
    setError('')
    setForm((current) => ({
      ...current,
      photos: [...current.photos, ...files.map((file) => ({ name: file.name, type: file.type, size: file.size }))],
    }))
    event.target.value = ''
  }

  if (!restored || authStatus === 'loading') {
    return <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Talep sihirbazı hazırlanıyor…</div>
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl rounded-[28px] border border-midnight/10 bg-white p-6 text-center shadow-xl sm:p-10" role="status">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Check className="h-6 w-6" /></span>
        <p className="mt-5 text-[10px] uppercase tracking-[0.24em] text-champagne-dark">Mock/demo talep kaydı</p>
        <h1 className="mt-3 font-serif text-3xl">Talep özeti hazır</h1>
        <p className="mt-3 text-sm text-muted-foreground">Bu numara yalnızca demo kaydını belirtir. Gerçek bir sipariş oluşturulmadı ve admin bildirimi gönderilmedi.</p>
        <div className="mt-6 rounded-2xl bg-ivory p-5 text-left text-sm">
          <p><strong>Talep no:</strong> {success.id}</p>
          <p className="mt-2"><strong>Site:</strong> {selectedSite?.title}</p>
          <p className="mt-2"><strong>Hediye davetiye:</strong> {selectedInvitation?.title}</p>
          <p className="mt-2"><strong>Durum:</strong> Talep oluşturuldu (demo)</p>
        </div>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => router.push('/panel/vip-taleplerim')} className="rounded-xl bg-midnight text-white">VIP Taleplerim</Button>
          <Button variant="outline" onClick={() => router.push('/tasarimlar/vip')} className="rounded-xl">VIP konseptlere dön</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/tasarimlar/vip" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-midnight"><ArrowLeft className="h-3.5 w-3.5" /> VIP tanıtımına dön</Link>
      <header className="mt-7">
        <p className="text-[10px] uppercase tracking-[0.24em] text-champagne-dark">MOMENTIS VIP · Talep sihirbazı</p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Kişiye özel tasarım talebi</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Talebiniz demo kaydı olarak bu tarayıcıda tutulur. Admin incelemesi, hizmet siparişi veya gerçek bildirim gerçekleşmez.</p>
      </header>

      <nav className="mt-7 overflow-x-auto pb-2" aria-label="Talep adımları">
        <ol className="flex min-w-max gap-2">
          {STEPS.map((title, index) => <li key={title}><button type="button" onClick={() => index < step && setStep(index)} aria-current={step === index ? 'step' : undefined} className={`rounded-full border px-3 py-2 text-[10px] transition ${step === index ? 'border-midnight bg-midnight text-white' : index < step ? 'border-midnight/25 bg-white text-midnight' : 'border-midnight/10 text-muted-foreground'}`}><span className="mr-1.5">{index + 1}.</span>{title}</button></li>)}
        </ol>
      </nav>

      {notification && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3.5 text-emerald-950 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
              <Check className="h-4 w-4 stroke-[3]" />
            </span>
            <div>
              <p className="text-xs font-semibold">{notification}</p>
              <p className="text-[11px] text-emerald-700">İlerlemeye bu sayfadan adımları tamamlayarak devam edebilirsiniz.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step === 0 && (
              <button
                type="button"
                onClick={() => {
                  setNotification('')
                  setStep(1)
                }}
                className="shrink-0 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white shadow transition hover:bg-emerald-800"
              >
                2. Adıma Geç →
              </button>
            )}
            <button
              type="button"
              onClick={() => setNotification('')}
              className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
              aria-label="Bildirimi kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <section className="mt-5 rounded-[26px] border border-midnight/10 bg-white p-5 shadow-sm sm:p-8" aria-live="polite">
        {step === 0 && (
          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-serif text-2xl text-midnight">Site konseptinizi seçin</h2>
                <p className="mt-1 text-xs text-muted-foreground">Beş konsept birbirinden bağımsızdır; davetiye seçimini daha sonra ayrıca yapacaksınız.</p>
              </div>
              <span className="text-[11px] font-medium text-champagne-dark">
                {form.siteId ? `1 konsept seçildi` : 'Lütfen bir konsept belirleyin'}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {VIP_SITE_TEMPLATES.map((site) => {
                const isSelected = form.siteId === site.id
                return (
                  <div
                    key={site.id}
                    onClick={() => setForm((current) => ({ ...current, siteId: site.id }))}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setForm((current) => ({ ...current, siteId: site.id }))
                      }
                    }}
                    aria-pressed={isSelected}
                    className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white p-3.5 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne ${
                      isSelected
                        ? 'border-midnight ring-2 ring-midnight/15 shadow-md bg-stone-50/40'
                        : 'border-midnight/10 hover:border-midnight/30 hover:shadow-sm'
                    }`}
                  >
                    {/* Visual preview with screenshot or editorial image */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-ivory/60 border border-midnight/5">
                      {site.image ? (
                        <img
                          src={site.image}
                          alt={site.title}
                          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      ) : (
                        <span
                          className="flex h-full w-full items-center justify-center p-3 font-serif text-xl"
                          style={{ background: site.preview.background, color: site.preview.foreground }}
                        >
                          {site.design.couple.join(' & ')}
                        </span>
                      )}

                      {/* Top Badges */}
                      <div className="absolute inset-x-2.5 top-2.5 flex items-center justify-between gap-1 pointer-events-none">
                        {site.hasLiveDemo ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 shadow-sm backdrop-blur-md border border-emerald-200/50">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Canlı Demo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-medium text-midnight/80 shadow-sm backdrop-blur-md border border-midnight/10">
                            {site.tag || 'Konsept'}
                          </span>
                        )}

                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors shadow-sm ${
                            isSelected
                              ? 'bg-midnight text-white'
                              : 'bg-white/90 text-transparent border border-midnight/15 group-hover:border-midnight/40'
                          }`}
                        >
                          <Check className={`h-3.5 w-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                        </span>
                      </div>

                      {/* Live Demo Link Button */}
                      {site.hasLiveDemo && (
                        <a
                          href={`/tasarimlar/vip/${site.slug}`}
                          target="_blank"
                          rel="opener"
                          onClick={(e) => e.stopPropagation()}
                          title="Canlı demoyu yeni sekmede aç"
                          className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-midnight/90 px-2 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur-md transition hover:bg-midnight hover:shadow"
                        >
                          <span>Siteyi Gör</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                      <span className="text-champagne-dark font-semibold tracking-wider uppercase text-[10px]">
                        {site.design.couple.join(' & ')}
                      </span>
                      <span className="text-[10px] text-midnight/50">
                        {site.design.date}
                      </span>
                    </div>

                    <h3 className="mt-1 font-serif text-base font-medium text-midnight tracking-tight">
                      {site.title}
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {site.description}
                    </p>

                    {/* Features footer */}
                    <div className="mt-3 pt-2.5 border-t border-midnight/5 flex items-center justify-between text-[10px] text-midnight/60">
                      <span className="truncate max-w-[70%]">{site.design.venue}</span>
                      <span className="uppercase tracking-wider font-medium text-champagne-dark">
                        {site.design.layout}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-serif text-2xl">Etkinlik ve çift bilgileri</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="bride">Gelin adı *</Label><Input id="bride" autoComplete="given-name" maxLength={80} value={form.event.brideName} onChange={(e) => updateEvent('brideName', e.target.value)} className={inputClass} required /></div>
              <div><Label htmlFor="groom">Damat adı *</Label><Input id="groom" autoComplete="off" maxLength={80} value={form.event.groomName} onChange={(e) => updateEvent('groomName', e.target.value)} className={inputClass} required /></div>
              <div><Label htmlFor="event-type">Etkinlik türü</Label><select id="event-type" value={form.event.eventType} onChange={(e) => updateEvent('eventType', e.target.value)} className={`${inputClass} w-full rounded-xl border px-3 text-sm`}>{VIP_FORM_OPTIONS.eventTypes.map((type) => <option key={type}>{type}</option>)}</select></div>
              <div><Label htmlFor="date">Etkinlik tarihi *</Label><Input id="date" type="date" value={form.event.date} onChange={(e) => updateEvent('date', e.target.value)} className={inputClass} required /></div>
              <div><Label htmlFor="time">Saat</Label><Input id="time" type="time" value={form.event.time} onChange={(e) => updateEvent('time', e.target.value)} className={inputClass} /></div>
              <div><Label htmlFor="venue">Mekân *</Label><Input id="venue" maxLength={160} value={form.event.venue} onChange={(e) => updateEvent('venue', e.target.value)} className={inputClass} required /></div>
              <div className="sm:col-span-2"><Label htmlFor="address">Adres</Label><Input id="address" maxLength={300} value={form.event.address} onChange={(e) => updateEvent('address', e.target.value)} className={inputClass} /></div>
              <div><Label htmlFor="family">Aile bilgileri (isteğe bağlı)</Label><textarea id="family" maxLength={500} value={form.event.familyInfo} onChange={(e) => updateEvent('familyInfo', e.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-midnight/15 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne" /></div>
              <div><Label htmlFor="invitation-text">Davet metni / özel not</Label><textarea id="invitation-text" maxLength={1000} value={form.event.invitationText} onChange={(e) => updateEvent('invitationText', e.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-midnight/15 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne" /></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-serif text-2xl">Görsel ve tasarım tercihleri</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Görsel seçimi yalnızca dosya adlarını ve temel metadata’yı mock talep özetine ekler. Dosyalar yüklenmez veya saklanmaz.</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div><Label htmlFor="photo-input">Fotoğraf seçimi (en fazla 8, her biri 10 MB)</Label><label htmlFor="photo-input" className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-midnight/25 bg-ivory/50 px-4 text-center text-xs hover:bg-ivory"><Upload className="mb-2 h-5 w-5 text-champagne-dark" />Dosyaları seçin · demo metadata</label><input id="photo-input" type="file" accept="image/*" multiple className="sr-only" onChange={onPhotoChange} /><ul className="mt-3 space-y-1 text-[10px] text-muted-foreground">{form.photos.map((photo, index) => <li key={`${photo.name}-${index}`} className="flex items-center justify-between gap-2"><span className="truncate">{photo.name} · {(photo.size / 1024).toFixed(0)} KB</span><button type="button" aria-label={`${photo.name} kaldır`} onClick={() => setForm((current) => ({ ...current, photos: current.photos.filter((_, i) => i !== index) }))}><X className="h-3.5 w-3.5" /></button></li>)}</ul></div>
              <div className="space-y-4">
                <div><Label htmlFor="colors">Tercih edilen renkler</Label><Input id="colors" maxLength={160} placeholder="Örn. adaçayı, fildişi" value={form.preferences.colors} onChange={(e) => updatePreference('colors', e.target.value)} className={inputClass} /></div>
                <div><Label htmlFor="style">Stil</Label><select id="style" value={form.preferences.style} onChange={(e) => updatePreference('style', e.target.value)} className={`${inputClass} w-full rounded-xl border px-3 text-sm`}>{VIP_FORM_OPTIONS.styles.map((style) => <option key={style}>{style}</option>)}</select></div>
                <div><Label htmlFor="references">Referans notları</Label><textarea id="references" maxLength={800} value={form.preferences.referenceNotes} onChange={(e) => updatePreference('referenceNotes', e.target.value)} className="mt-1 min-h-20 w-full rounded-xl border border-midnight/15 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne" /></div>
              </div>
              <fieldset className="sm:col-span-2"><legend className="text-xs font-medium">İstenen site bölümleri</legend><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{VIP_FORM_OPTIONS.sections.map((section) => <label key={section} className="flex items-center gap-2 rounded-xl border border-midnight/10 p-3 text-xs"><input type="checkbox" checked={form.preferences.sections.includes(section)} onChange={(e) => updatePreference('sections', e.target.checked ? [...form.preferences.sections, section] : form.preferences.sections.filter((item) => item !== section))} className="accent-midnight" />{section}</label>)}</div></fieldset>
              <div className="sm:col-span-2"><Label htmlFor="description">Ek açıklama / istekler</Label><textarea id="description" maxLength={2000} value={form.preferences.description} onChange={(e) => updatePreference('description', e.target.value)} className="mt-1 min-h-28 w-full rounded-xl border border-midnight/15 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne" /></div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-serif text-2xl">QR fotoğraf albümü</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Talebinizde QR bağlantılı fotoğraf albümü isteyebilirsiniz. Konukların QR üzerinden fotoğraf paylaşması, galeride görüntüleme ve fotoğrafların toplu indirilmesi deneyimi tasarım talebinde değerlendirilir.</p>
            <div className="mt-6 grid gap-5 md:grid-cols-[1fr_0.8fr]">
              <div className="space-y-3">
                <label className="flex items-center gap-3 rounded-2xl border border-midnight/10 p-4 text-sm"><input type="checkbox" checked={form.album.wantsAlbum} onChange={(e) => updateAlbum('wantsAlbum', e.target.checked)} className="h-4 w-4 accent-midnight" /> QR fotoğraf albümü istiyorum</label>
                <label className="flex items-center gap-3 rounded-2xl border border-midnight/10 p-4 text-sm"><input type="checkbox" checked={form.album.guestPhotoSharing} onChange={(e) => updateAlbum('guestPhotoSharing', e.target.checked)} className="h-4 w-4 accent-midnight" /> Misafirlerin QR ile fotoğraf paylaşmasını istiyorum</label>
                <p className="text-[10px] leading-5 text-muted-foreground">Bunlar yalnızca talep tercihleridir; bu mock modülde çalışan bir albüm veya QR bağlantısı oluşturulmaz.</p>
              </div>
              <div className="flex items-center gap-5 rounded-2xl bg-ivory p-5">
                <div aria-label="Temsili QR örneği, çalışmıyor" className="grid h-24 w-24 shrink-0 grid-cols-5 gap-1 rounded-lg border border-midnight/15 bg-white p-2" role="img">{Array.from({ length: 25 }, (_, i) => <span key={i} className={`rounded-[2px] ${[0,1,2,4,5,7,9,10,12,14,15,17,19,20,21,23,24].includes(i) ? 'bg-midnight' : 'bg-midnight/10'}`} />)}</div>
                <div><p className="font-serif text-lg">Örnek albüm alanı</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Yalnızca mock görünüm · aktif QR değil</p></div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-serif text-2xl">Hediye davetiye tasarımı seçin</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Davetiye kataloğu site konseptinden bağımsızdır. Herhangi bir VIP davetiye tasarımını seçebilirsiniz.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {VIP_INVITATION_TEMPLATES.map((template) => <VipInvitationCard key={template.id} template={template} selected={form.invitationId === template.id} onSelect={() => setForm((current) => ({ ...current, invitationId: current.invitationId === template.id ? '' : template.id }))} />)}
            </div>
            {!form.invitationId && <p className="mt-4 text-xs text-amber-800">Devam etmek için tam olarak bir tasarım seçin.</p>}
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="font-serif text-2xl">Talep özeti ve gönderim</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Geri dönerek istediğiniz adımı düzenleyebilirsiniz. Gönderim bir demo kaydı oluşturur; gerçek hizmet veya bildirim başlatmaz.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Summary title="VIP site konsepti" value={selectedSite?.title || 'Seçilmedi'} detail={selectedSite?.description} />
              <Summary title="Hediye davetiye" value={selectedInvitation?.title || 'Seçilmedi'} detail={selectedInvitation?.description} />
              <Summary title="Etkinlik bilgileri" value={`${form.event.brideName} & ${form.event.groomName}`} detail={`${form.event.eventType} · ${form.event.date} · ${form.event.time || 'Saat belirtilmedi'} · ${form.event.venue}`} />
              <Summary title="Tasarım tercihleri" value={`${form.preferences.style}${form.preferences.colors ? ` · ${form.preferences.colors}` : ''}`} detail={form.preferences.sections.join(', ') || 'Bölüm seçilmedi'} />
              <Summary title="QR fotoğraf albümü" value={form.album.wantsAlbum ? 'Talep edildi' : 'Talep edilmedi'} detail={form.album.guestPhotoSharing ? 'Misafir paylaşımı tercihi açık' : 'Misafir paylaşımı tercihi kapalı'} />
              <Summary title="Mock fotoğraf metadata" value={`${form.photos.length} görsel seçildi`} detail={form.photos.map((photo) => photo.name).join(', ') || 'Dosyalar yüklenmedi'} />
            </div>
            {!user && <div className="mt-5 flex gap-3 rounded-2xl border border-champagne/50 bg-champagne/10 p-4 text-xs leading-5"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /><p>Talebi hesabınızla ilişkilendirmek için giriş yapın. Form taslağınız bu sekmede tutulur ve girişten sonra devam edebilirsiniz.</p></div>}
          </div>
        )}

        {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-xs text-red-700" role="alert">{error}</p>}
        <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-midnight/10 pt-5 sm:flex-row">
          <Button type="button" variant="outline" disabled={step === 0 || submitting} onClick={() => { setError(''); setStep((value) => Math.max(value - 1, 0)) }} className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" /> Geri</Button>
          {step < STEPS.length - 1 ? <Button type="button" onClick={next} className="rounded-xl bg-midnight text-white">Devam et <ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button type="button" onClick={() => void submit()} disabled={submitting || authStatus === 'error'} className="rounded-xl bg-midnight text-white">{submitting ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Mock kayıt oluşturuluyor</> : user ? 'Mock talep oluştur' : 'Giriş yap ve devam et'}</Button>}
        </div>
      </section>
    </div>
  )
}

function Summary({ title, value, detail }) {
  return <div className="rounded-2xl border border-midnight/10 bg-ivory/60 p-4"><p className="text-[9px] uppercase tracking-[0.17em] text-muted-foreground">{title}</p><p className="mt-2 text-sm font-medium">{value}</p>{detail && <p className="mt-1 text-[10px] leading-5 text-muted-foreground">{detail}</p>}</div>
}
