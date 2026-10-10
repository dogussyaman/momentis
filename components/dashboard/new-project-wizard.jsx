'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Sparkles, Image as ImageIcon, LayoutTemplate, Globe, Heart, Moon, Gem, HeartHandshake, Gift, Smile, Briefcase, Clock3, Check, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EVENT_TYPES_LIST, EVENT_CONFIG } from '@/lib/events/event-config'
import { NEW_PROJECT_DRAFT_KEY } from '@/lib/events/event-draft'
import { useEditorStore } from '@/store/editor-store'
import { useSiteEditorStore } from '@/store/site-editor-store'
import { BILLING_PLANS } from '@/lib/billing/plans'
import { formatPrice } from '@/lib/data/packages'

const ICONS = {
  Rings: Heart,
  Moon: Moon,
  Ring: Gem,
  HeartHandshake: HeartHandshake,
  Cake: Gift,
  Baby: Smile,
  Briefcase: Briefcase
}

const TIME_OPTIONS = Array.from(
  { length: 48 },
  (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`,
)
const UNSPECIFIED_TIME = 'unspecified'

export function NewProjectWizard() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestedPackage = searchParams.get('paket')
  const packageIntent = requestedPackage || 'baslangic'
  const [selectedPackage, setSelectedPackage] = useState(packageIntent)
  const [step, setStep] = useState(1)
  const [openingEditor, setOpeningEditor] = useState(null)
  const [billingSnapshot, setBillingSnapshot] = useState(null)
  const [billingError, setBillingError] = useState('')
  const [lockedDeliverables, setLockedDeliverables] = useState(null)
  const [busyPackage, setBusyPackage] = useState('')

  const [eventType, setEventType] = useState(null)
  const [eventData, setEventData] = useState({})

  const config = eventType ? EVENT_CONFIG[eventType] : null

  useEffect(() => {
    setOpeningEditor(null)
  }, [pathname])

  useEffect(() => {
    setSelectedPackage(packageIntent)
  }, [packageIntent])

  useEffect(() => {
    let active = true
    fetch('/api/billing/account', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Paket hakları alınamadı')
        if (active) setBillingSnapshot(data)
      })
      .catch((error) => { if (active) setBillingError(error.message) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(NEW_PROJECT_DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw)
      if (!EVENT_CONFIG[draft.eventType]) return
      const restoredPackage = requestedPackage && BILLING_PLANS[requestedPackage] ? requestedPackage : draft.packageId
      if (!BILLING_PLANS[restoredPackage]) return
      setSelectedPackage(restoredPackage)
      setEventType(draft.eventType)
      setEventData(draft.eventData || {})
      setStep(3)
    } catch {
      window.sessionStorage.removeItem(NEW_PROJECT_DRAFT_KEY)
    }
  }, [packageIntent])

  const handleTypeSelect = (id) => {
    setEventType(id)
    setEventData({})
    setStep(2)
  }

  const handleFieldChange = (field, value) => {
    setEventData(prev => ({ ...prev, [field]: value }))
  }

  const canProceedToDeliverables = () => {
    if (!config) return false
    return config.required.every(field => !!eventData[field]?.trim())
  }

  const hasDeliverableRights = (deliverables, packageId = selectedPackage, snapshot = billingSnapshot) => {
    if (!snapshot) return false
    const credits = snapshot.grants
      .filter((grant) => grant.package_id === packageId)
      .reduce((total, grant) => total + (grant.remaining_event_credits || 0), 0)
    const projectAvailable = packageId === 'baslangic'
      ? (snapshot.usage.free_projects || 0) < snapshot.quotas.freeProjects
      : credits > 0 && snapshot.usage.projects < snapshot.quotas.projects
    const siteAvailable = !deliverables.site || (
      packageId === 'baslangic'
        ? (snapshot.usage.websites || 0) < 1
        : true
    )
    const invitationAvailable = !deliverables.invitation || (
      packageId === 'baslangic'
        ? (snapshot.usage.invitations || 0) < 1
        : true
    )
    return projectAvailable && siteAvailable && invitationAvailable
  }

  const selectDeliverable = (deliverables) => {
    if (!billingSnapshot) {
      toast.error(billingError || 'Paket hakları yüklenirken bekleyin.')
      return
    }
    if (!hasDeliverableRights(deliverables)) {
      try {
        window.sessionStorage.setItem(NEW_PROJECT_DRAFT_KEY, JSON.stringify({
          eventType,
          eventData,
          deliverables,
          packageId: selectedPackage,
          idempotencyKey: window.crypto.randomUUID(),
        }))
      } catch (error) {
        toast.error(error.message || 'Etkinlik bilgileri kaydedilemedi.')
      }
      setLockedDeliverables(deliverables)
      return
    }
    startEditing(deliverables)
  }

  const saveDraftPackage = (packageId) => {
    try {
      const draft = JSON.parse(window.sessionStorage.getItem(NEW_PROJECT_DRAFT_KEY) || 'null')
      if (draft) window.sessionStorage.setItem(NEW_PROJECT_DRAFT_KEY, JSON.stringify({ ...draft, packageId }))
    } catch {
      toast.error('Paket seçimi bu oturumda kaydedilemedi. Lütfen etkinlik bilgilerinizi yeniden kontrol edin.')
    }
  }

  const buyPackage = async (plan) => {
    const deliverables = lockedDeliverables
    setBusyPackage(plan.id)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': window.crypto.randomUUID() },
        credentials: 'include',
        body: JSON.stringify({ packageId: plan.id }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Satın alma başlatılamadı')

      const confirmation = await fetch('/api/billing/mock-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ purchaseId: data.purchase.id }),
      })
      const confirmationData = await confirmation.json().catch(() => ({}))
      if (!confirmation.ok) throw new Error(confirmationData.error || 'Satın alma onaylanamadı')

      const accountResponse = await fetch('/api/billing/account', { credentials: 'include', cache: 'no-store' })
      const accountData = await accountResponse.json().catch(() => ({}))
      if (!accountResponse.ok) throw new Error(accountData.error || 'Yeni paket hakkı alınamadı')
      setBillingSnapshot(accountData)
      setSelectedPackage(plan.id)
      saveDraftPackage(plan.id)
      setLockedDeliverables(null)
      toast.success(`${plan.name} paketi test ortamında etkinleştirildi.`)
      if (deliverables) startEditing(deliverables, plan.id, accountData)
    } catch (error) {
      toast.error(error.message || 'Paket satın alınamadı.')
    } finally {
      setBusyPackage('')
    }
  }

  const startEditing = (deliverables, packageId = selectedPackage, snapshot = billingSnapshot) => {
    if (!canProceedToDeliverables()) {
      toast.error('Lütfen zorunlu alanları doldurun.')
      return
    }

    if (!BILLING_PLANS[packageId]) {
      toast.error('Geçersiz paket seçimi.')
      return
    }
    if (!snapshot) {
      toast.error(billingError || 'Paket hakları yüklenirken bekleyin.')
      return
    }

    try {
      let savedDraft = null
      try { savedDraft = JSON.parse(window.sessionStorage.getItem(NEW_PROJECT_DRAFT_KEY) || 'null') } catch {}
      const draft = {
        eventType,
        eventData,
        deliverables,
        packageId,
        idempotencyKey: savedDraft?.packageId === packageId ? savedDraft.idempotencyKey : window.crypto.randomUUID(),
      }
      if (!hasDeliverableRights(deliverables, packageId, snapshot)) {
        window.sessionStorage.setItem(NEW_PROJECT_DRAFT_KEY, JSON.stringify(draft))
        setLockedDeliverables(deliverables)
        return
      }

      window.sessionStorage.setItem(NEW_PROJECT_DRAFT_KEY, JSON.stringify(draft))
      useEditorStore.getState().resetDesign()
      useEditorStore.temporal.getState().clear()
      useSiteEditorStore.getState().reset()
      const mode = deliverables.site ? 'site' : 'card'
      setOpeningEditor(deliverables.site && deliverables.invitation ? 'both' : deliverables.site ? 'site' : 'invitation')
      router.push(`/panel/etkinlik/new/duzenle?mode=${mode}&new=1`)
    } catch (error) {
      toast.error(error.message || 'Editör açılamadı. Lütfen tekrar deneyin.')
      setOpeningEditor(null)
      return
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] w-full items-center justify-center bg-ivory px-6 py-12 lg:min-h-[100dvh]">
      <div className="w-full max-w-4xl">

        {/* Step Indicator */}
        <div className="mb-12 flex items-center justify-center gap-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <span className={step >= 1 ? 'text-midnight' : ''}>1. Etkinlik</span>
          <span className="h-px w-8 bg-border"></span>
          <span className={step >= 2 ? 'text-midnight' : ''}>2. Bilgiler</span>
          <span className="h-px w-8 bg-border"></span>
          <span className={step >= 3 ? 'text-midnight' : ''}>3. Ne Hazırlıyoruz?</span>
        </div>

        {/* STEP 1: EVENT TYPE */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h1 className="font-serif text-4xl text-midnight md:text-5xl">Ne kutluyorsunuz?</h1>
              <p className="mt-4 text-muted-foreground">Etkinliğinizin türünü seçerek başlayalım.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {EVENT_TYPES_LIST.map((type) => {
                const Icon = ICONS[type.icon] || Sparkles
                return (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className="group flex flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-white p-6 text-center transition-all hover:border-champagne hover:shadow-lg"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ivory-50 text-champagne-dark group-hover:bg-champagne/10">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-midnight">{type.label}</h3>
                      <p className="mt-1 text-[10px] text-muted-foreground">{type.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 2: EVENT INFO */}
        {step === 2 && config && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 flex items-center justify-between">
               <div>
                  <h2 className="font-serif text-3xl text-midnight">Etkinlik Bilgileri</h2>
                  <p className="mt-2 text-sm text-muted-foreground">İhtiyacımız olan temel detayları girin.</p>
               </div>
               <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground">
                 <ArrowLeft className="mr-2 h-4 w-4" /> Geri
               </Button>
            </div>

            <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
               <div className="space-y-10">
                  {config.groups.map(group => {
                     const fields = group.fields.filter(f => config.required.includes(f) || config.optional.includes(f))
                     if (!fields.length) return null

                     return (
                        <div key={group.id}>
                           <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.15em] text-midnight">{group.label}</h3>
                           <div className="grid gap-6 md:grid-cols-2">
                              {fields.map(field => (
                                 <div key={field} className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">
                                       {config.fieldLabels[field] || field}
                                       {config.required.includes(field) && <span className="ml-1 text-destructive">*</span>}
                                    </Label>
                                    {field === 'date' ? (
                                      <DatePickerField
                                        value={eventData.date || ''}
                                        onChange={(date) => handleFieldChange('date', date)}
                                        placeholder="Gün, ay ve yıl seçin"
                                        className="h-11 rounded-xl bg-ivory-50"
                                        testid="new-event-date"
                                      />
                                    ) : field === 'time' ? (
                                      <Select
                                        value={eventData.time || UNSPECIFIED_TIME}
                                        onValueChange={(time) => handleFieldChange('time', time === UNSPECIFIED_TIME ? '' : time)}
                                      >
                                        <SelectTrigger className="h-11 w-full rounded-xl border-border bg-ivory-50" aria-label="Etkinlik saati" data-testid="new-event-time">
                                          <span className="flex min-w-0 items-center gap-2">
                                            <Clock3 className="h-4 w-4 shrink-0 text-champagne-dark" />
                                            <SelectValue />
                                          </span>
                                        </SelectTrigger>
                                        <SelectContent className="max-h-64">
                                          <SelectItem value={UNSPECIFIED_TIME}>Saat seçin</SelectItem>
                                          {TIME_OPTIONS.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input
                                        value={eventData[field] || ''}
                                        onChange={(e) => handleFieldChange(field, e.target.value)}
                                        className="h-11 rounded-xl border-border bg-ivory-50"
                                      />
                                    )}
                                 </div>
                              ))}
                           </div>
                        </div>
                     )
                  })}
               </div>

               <div className="mt-10 flex justify-end">
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!canProceedToDeliverables()}
                    className="h-12 rounded-full bg-midnight px-8 text-sm uppercase tracking-[0.15em] text-ivory hover:bg-midnight-700"
                  >
                    Devam Et
                  </Button>
               </div>
            </div>
          </div>
        )}

        {/* STEP 3: DELIVERABLES */}
        {step === 3 && config && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="mb-8 flex items-center justify-between">
               <div>
                  <h2 className="font-serif text-3xl text-midnight">Ne hazırlamak istiyorsunuz?</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Etkinliğiniz için hangi formatı kullanacaksınız?</p>
               </div>
               <Button variant="ghost" onClick={() => setStep(2)} className="text-muted-foreground">
                 <ArrowLeft className="mr-2 h-4 w-4" /> Geri
               </Button>
            </div>

            {billingError && <p role="alert" className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{billingError}</p>}
            {!billingSnapshot && !billingError && <p role="status" className="mb-4 text-center text-sm text-muted-foreground">Paket hakları yükleniyor…</p>}
            {billingSnapshot && !BILLING_PLANS[selectedPackage] && <p role="alert" className="mb-4 text-center text-sm text-destructive">Bilinmeyen paket seçimi. Lütfen paket ekranından yeniden başlayın.</p>}

            {billingSnapshot && (
               <section className="mb-6 rounded-3xl border border-border bg-white p-5 sm:p-6" aria-labelledby="project-package-heading">
                 <div className="mb-4">
                   <h3 id="project-package-heading" className="font-serif text-xl text-midnight">Bu etkinlikte hangi paketi kullanalım?</h3>
                   <p className="mt-1 text-sm text-muted-foreground">Ücretli krediler yalnızca seçtiğiniz etkinliğe uygulanır; hesap paketiniz Başlangıç olarak görünmeye devam edebilir.</p>
                 </div>
                 <div className="grid gap-3 sm:grid-cols-3">
                   {Object.values(BILLING_PLANS)
                     .filter((plan) => plan.id === 'baslangic' || billingSnapshot.grants.some((grant) => grant.package_id === plan.id))
                     .map((plan) => {
                       const credits = plan.id === 'baslangic'
                         ? null
                         : billingSnapshot.grants
                           .filter((grant) => grant.package_id === plan.id)
                           .reduce((total, grant) => total + (grant.remaining_event_credits || 0), 0)
                       const available = plan.id === 'baslangic'
                         ? (billingSnapshot.usage?.free_projects || 0) < billingSnapshot.quotas.freeProjects
                         : credits > 0 && billingSnapshot.usage.projects < billingSnapshot.quotas.projects
                       const selected = selectedPackage === plan.id
                       return (
                         <button
                           key={plan.id}
                           type="button"
                           onClick={() => setSelectedPackage(plan.id)}
                           disabled={!available}
                           aria-pressed={selected}
                           className={`rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'border-champagne bg-champagne/10 ring-1 ring-champagne' : 'border-border hover:border-midnight/40'}`}
                         >
                           <span className="block font-medium text-midnight">{plan.name}</span>
                           <span className="mt-1 block text-xs text-muted-foreground">
                             {plan.id === 'baslangic' ? 'Ücretsiz proje hakkı' : `${credits} kullanılabilir etkinlik kredisi`}
                           </span>
                         </button>
                       )
                     })}
                 </div>
               </section>
            )}

            <div className="grid gap-6 md:grid-cols-3">
               <DeliverableCard
                  icon={Globe}
                  title="Davet Sitesi"
                  desc="Modern, interaktif, mobil uyumlu davet sitesi."
                  availability={hasDeliverableRights({ site: true, invitation: false }) ? (selectedPackage === 'baslangic' ? '1 / 1 kullanılabilir' : 'Etkinlik kredisi kullanılabilir') : 'Hak yok · Paket seçin'}
                  onClick={() => selectDeliverable({ site: true, invitation: false })}
                  loading={openingEditor === 'site'}
                  busy={Boolean(openingEditor)}
                  disabled={!billingSnapshot}
               />
               <DeliverableCard
                  icon={ImageIcon}
                  title="Dijital Davetiye"
                  desc="Paylaşılabilir ve indirilebilir dijital davetiye."
                  availability={hasDeliverableRights({ site: false, invitation: true }) ? (selectedPackage === 'baslangic' ? '1 / 1 kullanılabilir' : 'Etkinlik kredisi kullanılabilir') : 'Hak yok · Paket seçin'}
                  onClick={() => selectDeliverable({ site: false, invitation: true })}
                  loading={openingEditor === 'invitation'}
                  busy={Boolean(openingEditor)}
                  disabled={!billingSnapshot}
               />
               <DeliverableCard
                  icon={LayoutTemplate}
                  title="Site + Davetiye"
                  desc="İkisini birlikte hazırlayın."
                  availability={hasDeliverableRights({ site: true, invitation: true }) ? (selectedPackage === 'baslangic' ? 'Site ve davetiye hakkı kullanılabilir' : 'Etkinlik kredisi kullanılabilir') : 'Hak yok · Paket seçin'}
                  highlight
                  onClick={() => selectDeliverable({ site: true, invitation: true })}
                  loading={openingEditor === 'both'}
                  busy={Boolean(openingEditor)}
                  disabled={!billingSnapshot}
               />
            </div>

            <Dialog open={Boolean(lockedDeliverables)} onOpenChange={(open) => { if (!open && !busyPackage) setLockedDeliverables(null) }}>
              <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl border-[#e8dfd1] bg-[#fbf9f5] p-5 sm:max-w-2xl sm:p-7">
                <DialogHeader>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a28453]">Paket hakkı gerekli</p>
                  <DialogTitle className="font-serif text-2xl text-[#172033]">Bu format için bir paket seçin</DialogTitle>
                  <DialogDescription className="text-sm leading-6 text-[#77746f]">
                    {lockedDeliverables?.site && lockedDeliverables?.invitation
                      ? 'Site ve dijital davetiyeyi birlikte hazırlamak için kullanılabilir etkinlik hakkınız bulunmuyor.'
                      : `Bu ${lockedDeliverables?.site ? 'davet sitesi' : 'dijital davetiye'} hakkınız dolmuş. Var olan etkinlik kredinizi kullanabilir veya bir paket alabilirsiniz.`}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.values(BILLING_PLANS).filter((plan) => plan.price > 0).map((plan) => {
                    const credits = billingSnapshot?.grants
                      .filter((grant) => grant.package_id === plan.id)
                      .reduce((total, grant) => total + (grant.remaining_event_credits || 0), 0) || 0
                    const canUseCredit = credits > 0 && billingSnapshot.usage.projects < billingSnapshot.quotas.projects
                    const isBusy = busyPackage === plan.id
                    return (
                      <article key={plan.id} className="flex flex-col rounded-2xl border border-[#e8dfd1] bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-serif text-xl text-[#172033]">{plan.name}</h3>
                            <p className="mt-1 text-sm font-medium text-[#8f744b]">{formatPrice(plan.price)} <span className="font-normal text-[#77746f]">· {plan.period}</span></p>
                          </div>
                          {plan.highlighted && <span className="rounded-full bg-[#f2e6d2] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-[#8f744b]">Önerilen</span>}
                        </div>
                        <ul className="my-4 flex-1 space-y-2 text-xs leading-5 text-[#68645d]">
                          {plan.features.slice(0, 4).map((feature) => (
                            <li key={feature} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#809184]" />{feature}</li>
                          ))}
                        </ul>
                        <Button
                          type="button"
                          className="h-10 rounded-xl bg-[#172033] text-xs text-white hover:bg-[#25314a]"
                          disabled={Boolean(busyPackage) || (!canUseCredit && !billingSnapshot?.mockPaymentAvailable)}
                          onClick={() => {
                            if (canUseCredit) {
                              setSelectedPackage(plan.id)
                              saveDraftPackage(plan.id)
                              setLockedDeliverables(null)
                              if (lockedDeliverables) startEditing(lockedDeliverables, plan.id, billingSnapshot)
                            } else {
                              buyPackage(plan)
                            }
                          }}
                        >
                          {isBusy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> İşleniyor</> : canUseCredit ? `${credits} krediyi kullan` : billingSnapshot?.mockPaymentAvailable ? 'Test satın alımı' : 'Ödeme kullanılamıyor'}
                        </Button>
                      </article>
                    )
                  })}
                </div>
                {billingSnapshot?.mockPaymentAvailable && (
                  <p className="rounded-xl bg-[#f2eee6] px-4 py-3 text-xs leading-5 text-[#68645d]">
                    Bu ortamda satın alma yalnızca test amaçlıdır; gerçek ödeme alınmaz.
                  </p>
                )}
                {!billingSnapshot?.mockPaymentAvailable && (
                  <p className="rounded-xl bg-[#f2eee6] px-4 py-3 text-xs leading-5 text-[#68645d]">
                    Online ödeme henüz etkin değil. Paketleri ve ödeme seçeneklerini incelemek için{' '}
                    <a href="/fiyatlandirma" className="font-semibold text-[#8f744b] underline underline-offset-2">fiyatlandırma sayfasını açın</a>.
                  </p>
                )}
                <DialogFooter className="sm:justify-between">
                  <Button type="button" variant="ghost" className="text-xs text-[#77746f]" disabled={Boolean(busyPackage)} onClick={() => setLockedDeliverables(null)}>Şimdilik vazgeç</Button>
                  <a href="/panel/paketim" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e8dfd1] bg-white px-4 text-xs font-medium text-[#172033] hover:bg-[#f7f4ee]">
                    Paketimi görüntüle <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </DialogFooter>
              </DialogContent>
            </Dialog>
           </div>
        )}
      </div>
    </div>
  )
}

function DeliverableCard({ icon: Icon, title, desc, availability, onClick, loading, busy, disabled, highlight }) {
  return (
    <button
      onClick={onClick}
      disabled={busy || disabled}
      aria-busy={Boolean(loading)}
      className={`group relative flex flex-col items-start rounded-3xl border p-6 text-left transition-all hover:shadow-lg ${highlight ? 'border-champagne bg-champagne/5' : 'border-border bg-white hover:border-midnight/30'}`}
    >
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${highlight ? 'bg-champagne text-midnight' : 'bg-ivory-50 text-midnight'}`}>
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Icon className="h-6 w-6" />}
      </div>
      <h3 className="font-serif text-xl text-midnight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>

      <div className="mt-6 flex w-full items-center justify-between border-t border-border/50 pt-4">
         <span className="text-xs font-medium text-sage">{availability}</span>
         <ArrowLeft className="h-4 w-4 rotate-135 text-muted-foreground group-hover:text-midnight transition-colors" />
      </div>
    </button>
  )
}
