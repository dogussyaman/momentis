'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, RotateCcw, Save, ExternalLink, Smartphone, Tablet, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { InvitationPreview } from '@/components/shared/invitation-preview'
import { EVENT_TYPES } from '@/lib/data/events'
import { EVENT_CONFIG } from '@/lib/events/event-config'
import { TEMPLATES } from '@/lib/data/templates'
import { formatEventDate } from '@/lib/projects'
import { cn } from '@/lib/utils'
import { StoryTemplatesModal } from './story-templates-modal'
import { CARD_LAYOUTS, SABLONLAR, TEMALAR } from '@/lib/davetiye-svg'
import { DavetiyeKart } from '@/components/shared/davetiye-kart'
import { QrCode, Download, Copy } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { compressImageFile } from '@/lib/compress-image'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { CardMessageTemplates } from './card-message-templates'
import { CanvasEditor } from '@/components/editor/CanvasEditor'
import { useEditorStore } from '@/store/editor-store'
import { useSiteEditorStore } from '@/store/site-editor-store'
import { SiteEditor } from '@/components/site-builder/SiteEditor'
import { SiteStartFlow } from '@/components/site-builder/SiteStartFlow'
import { buildSiteFromTemplate } from '@/lib/site-builder/templates'
import { normalizeSiteForEditor } from '@/lib/site-builder/normalize-site'
import { resolveTokens, syncEventTokens, syncSiteEventData } from '@/lib/events/event-tokens'
import { createProjectDraft, NEW_PROJECT_DRAFT_KEY } from '@/lib/events/event-draft'
import { syncEventDataFromForm } from '@/lib/events/event-normalize'
import { BILLING_PLANS } from '@/lib/billing/plans'

const inputCls = 'h-11 rounded-2xl border-border bg-ivory-50'
const PALETTE_KEYS = [['bg', 'Zemin'], ['accent', 'Vurgu'], ['text', 'Metin'], ['muted', 'İkincil']]
const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`)

function pick(project) {
  return {
    host_a: project.host_a || '', host_b: project.host_b || '',
    bride_mother: project.bride_mother || '', bride_father: project.bride_father || '',
    groom_mother: project.groom_mother || '', groom_father: project.groom_father || '',
    title: project.title || '', event_type: project.event_type || 'dugun',
    date: project.date || '', time: project.time || '', venue: project.venue || '', address: project.address || '', city: project.city || '',
    story: project.story || '', dress_code: project.dress_code || '', rsvp_deadline: project.rsvp_deadline || '',
    program: Array.isArray(project.program) ? project.program : [],
    menu_options: Array.isArray(project.menu_options) ? project.menu_options : [],
    template_slug: project.template_slug && !SABLONLAR[project.template_slug] ? project.template_slug : 'aurelia',
    card_template: project.card_template || (SABLONLAR[project.template_slug] ? project.template_slug : 'Klasik Altın'),
    card_theme: Number.isInteger(project.card_theme) ? project.card_theme : SABLONLAR[project.card_template || project.template_slug]?.tema || 0,
    card_layout: project.card_layout || 'classic',
    card_message: project.card_message || '',
    palette: project.palette || null,
    website_font: project.website_font || 'playfair',
    hero_image: project.hero_image || '',
    hero_image_opacity: Number.isFinite(Number(project.hero_image_opacity)) ? Number(project.hero_image_opacity) : 52,
    qr_enabled: project.qr_enabled !== false,
    qr_message: project.qr_message || 'Bu QR kodunu paylaşarak davet sayfasına hızlıca ulaşabilirsiniz.',
    spotify_url: project.spotify_url || '',
    gift_enabled: Boolean(project.gift_enabled),
    gift_message: project.gift_message || '',
    gift_iban: project.gift_iban || '',
    gift_account_name: project.gift_account_name || '',
    gift_url: project.gift_url || '',
    slug: project.slug || '',
    canvas_design: project.canvas_design || null,
    site_data: project.site_data || null,
  }
}

function missingRequiredProjectField(form, eventData) {
  const config = EVENT_CONFIG[form?.event_type]
  if (!config) return null
  const values = {
    brideName: eventData?.couple?.bride,
    groomName: eventData?.couple?.groom,
    celebrantName: eventData?.celebrant?.name,
    parentNames: eventData?.baby?.parents,
    companyName: eventData?.company?.name,
    eventTitle: eventData?.eventTitle || form?.title,
    date: eventData?.date || form?.date,
  }
  const field = config.required.find((key) => !String(values[key] || '').trim())
  return field ? config.fieldLabels[field] || field : null
}

export function ProjectEditor() {
  const { id } = useParams()
  const isUnsavedProject = id === 'new'
  const router = useRouter()
  const [project, setProject] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [menuInput, setMenuInput] = useState('')
  const [device, setDevice] = useState('mobile') // mobile, tablet, desktop
  const pendingMutationKey = useRef(null)
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') === 'card' ? 'card' : 'site'
  const isNewFlow = searchParams.get('new') === '1' || isUnsavedProject
  const [showOnboarding, setShowOnboarding] = useState(isNewFlow)
  const [siteStartStage, setSiteStartStage] = useState(
    isNewFlow && initialMode === 'site' ? 'intro' : 'editor',
  )
  const [previewMode, setPreviewMode] = useState(initialMode)
  const [designTarget, setDesignTarget] = useState(initialMode)
  const [openSection, setOpenSection] = useState('details')
  const iframeRef = useRef(null)

  const { design: canvasDesign, setDesign } = useEditorStore()
  const initSite = useSiteEditorStore((state) => state.initSite)
  const eventData = useMemo(
    () => form ? syncEventDataFromForm(form, project?.event_data) : project?.event_data,
    [form, project?.event_data],
  )

  useEffect(() => {
    if (isUnsavedProject) {
      try {
        const rawDraft = window.sessionStorage.getItem(NEW_PROJECT_DRAFT_KEY)
        if (!rawDraft) throw new Error('Etkinlik taslağı bulunamadı. Lütfen yeniden başlayın.')
        const draftInput = JSON.parse(rawDraft)
        const draft = createProjectDraft(draftInput.eventType, draftInput.eventData || {}, draftInput.deliverables || {})
        const idempotencyKey = draftInput.idempotencyKey || window.crypto.randomUUID()
        const localProject = {
          ...draft,
          id: 'new',
          slug: '',
          billing_package_id: draftInput.packageId || 'baslangic',
          creation_request_id: idempotencyKey,
        }
        if (!draftInput.idempotencyKey) {
          window.sessionStorage.setItem(NEW_PROJECT_DRAFT_KEY, JSON.stringify({ ...draftInput, idempotencyKey }))
        }
        setProject(localProject)
        setForm(pick(localProject))

        if (draft.event_data) {
          const currentDesign = useEditorStore.getState().design
          const hydrated = JSON.parse(resolveTokens(JSON.stringify(currentDesign), draft.event_data))
          setDesign(hydrated)
        }
      } catch (error) {
        toast.error(error.message || 'Etkinlik taslağı açılamadı.')
        router.replace('/panel/yeni')
      }
      return
    }

    fetch(`/api/projects/${id}`, { credentials: 'include', cache: 'no-store' }).then((r) => r.json()).then((d) => { 
      if (d.project) { 
        setProject(d.project); 
        setForm(pick(d.project));
        if (d.project.canvas_design) {
          setDesign(d.project.canvas_design);
        } else if (d.project.event_data) {
          // Hydrate the default design with event data
          const currentDesign = useEditorStore.getState().design;
          const hydrated = JSON.parse(resolveTokens(JSON.stringify(currentDesign), d.project.event_data));
          setDesign(hydrated);
        }
      } 
    }).catch(() => {})
  }, [id, isUnsavedProject, router, setDesign])

  // Davetiye-svg temalarını Next.js'in beklediği palet yapısına uyarlama
  const activeTemaIndex = form?.card_theme ?? (SABLONLAR[form?.card_template || 'Klasik Altın']?.tema || 0)
  const effectivePalette = form?.palette || { bg: '#F8F4EC', accent: '#C9A96E', text: '#101827', muted: '#8B8577' }
  const selectedSiteTemplate = TEMPLATES.find((item) => item.slug === form?.template_slug) || TEMPLATES[0]
  const previewTemplate = { ...selectedSiteTemplate, palette: effectivePalette }
  const eventType = EVENT_TYPES.find((e) => e.id === form?.event_type)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const changeDesignTarget = (target) => { setDesignTarget(target); setPreviewMode(target === 'site' ? 'site' : 'card'); setOpenSection('design') }
  const chooseSiteTemplate = (template) => {
    const starter = buildSiteFromTemplate(template.id)
    const hydrated = eventData
      ? syncSiteEventData(
          JSON.parse(resolveTokens(JSON.stringify(starter), eventData)),
          null,
          eventData,
        )
      : starter
    initSite(hydrated)
    setShowOnboarding(false)
    setSiteStartStage('editor')
  }
  const handleHeroImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const image = await compressImageFile(file)
      setForm((f) => ({ ...f, hero_image: image }))
      toast.success('Hero görseli eklendi')
    } catch (error) { toast.error(error.message) }
    e.target.value = ''
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.data && e.data.type === 'PREVIEW_READY') {
        iframeRef.current?.contentWindow?.postMessage({ type: 'UPDATE_PREVIEW', payload: { project: form, template: previewTemplate, mode: previewMode } }, '*')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [form, previewTemplate, previewMode])

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'UPDATE_PREVIEW', payload: { project: form, template: previewTemplate, mode: previewMode } }, '*')
  }, [form, previewTemplate, previewMode])

  const setPaletteColor = (k, v) => setForm((f) => ({ ...f, palette: { ...(f.palette || effectivePalette), [k]: v.toUpperCase() } }))
  const resetPalette = () => setForm((f) => ({ ...f, palette: null }))
  const updateProgram = (i, k, v) => setForm((f) => ({ ...f, program: f.program.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)) }))
  const addProgram = () => setForm((f) => ({ ...f, program: [...f.program, { time: '', title: '' }] }))
  const removeProgram = (i) => setForm((f) => ({ ...f, program: f.program.filter((_, idx) => idx !== i) }))

  const addMenu = () => {
    const v = menuInput.trim()
    if (!v || form.menu_options.includes(v)) return
    setForm((f) => ({ ...f, menu_options: [...f.menu_options, v] }))
    setMenuInput('')
  }
  const removeMenu = (m) => setForm((f) => ({ ...f, menu_options: f.menu_options.filter((x) => x !== m) }))

  const siteDataMemo = useMemo(() => {
    if (!form?.site_data) return null;
    const synchronized = syncSiteEventData(form.site_data, project?.event_data, eventData)
    return normalizeSiteForEditor(synchronized, {
      title: form.title || 'Bizim Düğün',
      slug: form.slug || project?.slug || 'bizim-dugun',
      templateId: form.template_slug || 'portfolio',
      userId: project?.user_id || 'demo'
    });
  }, [form?.site_data, form?.title, form?.slug, form?.template_slug, project?.event_data, eventData, project?.slug, project?.user_id]);

  useEffect(() => {
    if (designTarget !== 'site' || !eventData || !siteDataMemo) return
    const state = useSiteEditorStore.getState()
    if (!state.site || state.site.id !== siteDataMemo.id) return
    const synchronized = syncSiteEventData(state.site, project?.event_data, eventData)
    if (JSON.stringify(synchronized) !== JSON.stringify(state.site)) state.initSite(synchronized)
  }, [designTarget, eventData, project?.event_data, siteDataMemo])

  const hasNextStep = isNewFlow && designTarget === 'site' && project?.deliverables?.invitation?.enabled
  const saveLabel = hasNextStep ? 'Kaydet & Devam Et' : (isNewFlow ? 'Tamamla' : (saving ? 'Güncelleniyor…' : 'Güncelle'))

  const submitProjectSave = async (body, isCreating, requestKey) => {
    const url = isCreating ? '/api/projects' : `/api/projects/${project?.id || id}`
    const send = () => fetch(url, {
      method: isCreating ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey },
      credentials: 'include',
      body: JSON.stringify(body),
    })

    let response = await send()
    let data = await response.json().catch(() => ({}))
    if (!response.ok && data.code === 'FEATURE_REQUIRED' && data.packageId === 'premium') {
      const billingResponse = await fetch('/api/billing/account', { credentials: 'include', cache: 'no-store' })
      const billingData = await billingResponse.json().catch(() => ({}))
      if (!billingResponse.ok) throw new Error(billingData.error || data.error || 'Premium paket hakları doğrulanamadı')
      const grant = billingData.grants?.find((item) =>
        item.remaining_event_credits > 0 &&
        BILLING_PLANS[item.package_id]?.entitlements.premiumTemplates,
      )
      const plan = grant && BILLING_PLANS[grant.package_id]
      if (grant && plan && window.confirm(
        `Bu özellik Premium paket gerektiriyor. ${plan.name} paketinizden 1 etkinlik kredisi kullanarak bu projeyi Premium olarak kaydetmek ister misiniz?`,
      )) {
        body.billing_package_id = plan.id
        setProject((current) => current ? { ...current, billing_package_id: plan.id } : current)
        try {
          const savedDraft = JSON.parse(window.sessionStorage.getItem(NEW_PROJECT_DRAFT_KEY) || 'null')
          if (savedDraft) window.sessionStorage.setItem(NEW_PROJECT_DRAFT_KEY, JSON.stringify({ ...savedDraft, packageId: plan.id }))
        } catch {}
        response = await send()
        data = await response.json().catch(() => ({}))
      }
    }

    if (!response.ok) throw new Error(data?.error || 'Kaydedilemedi')
    return data
  }

  const save = async (asDraft = false) => {
    const isManual = designTarget === 'card'
    const missingField = missingRequiredProjectField(form, eventData)
    if (missingField) { toast.error(`${missingField} zorunludur`); return }
    setSaving(true)
    try {
      const selectedDeliverables = project?.deliverables
      const body = { 
        ...form, 
        event_type: project?.event_type || form.event_type,
        event_data: eventData || null,
        published: asDraft ? false : project?.published ?? true,
        ...(selectedDeliverables ? { deliverables: {
          site: {
            ...selectedDeliverables.site,
            status: asDraft || !isManual ? 'draft' : selectedDeliverables.site.status,
          },
          invitation: {
            ...selectedDeliverables.invitation,
            status: asDraft || isManual ? 'draft' : selectedDeliverables.invitation.status,
          },
        } } : {}),
        host_a: form.host_a,
        date: form.date,
        palette: form.palette && Object.keys(form.palette).length === 4 ? form.palette : null,
        canvas_design: isManual ? canvasDesign : form.canvas_design,
        site_data: form.site_data ? syncSiteEventData(form.site_data, project?.event_data, eventData) : form.site_data,
        ...(isUnsavedProject || project?.id === 'new' ? { billing_package_id: project?.billing_package_id || 'baslangic' } : {}),
      }
      const isCreating = isUnsavedProject || project?.id === 'new'
      const requestKey = isCreating ? project?.creation_request_id : (pendingMutationKey.current || window.crypto.randomUUID())
      if (!requestKey) throw new Error('Etkinlik kaydı için istek anahtarı oluşturulamadı')
      if (!isCreating) pendingMutationKey.current = requestKey
      const data = await submitProjectSave(body, isCreating, requestKey)
      setProject(data.project)
      setForm(pick(data.project))
      pendingMutationKey.current = null
      if (isCreating) window.sessionStorage.removeItem(NEW_PROJECT_DRAFT_KEY)
      toast.success(asDraft ? 'Etkinlik taslaklara kaydedildi.' : isCreating ? 'Etkinliğiniz kaydedildi.' : 'Değişiklikler kaydedildi')
      if (isCreating && isNewFlow && !isManual && data.project.deliverables?.invitation?.enabled) {
        changeDesignTarget('card')
        router.replace(`/panel/etkinlik/${data.project.id}/duzenle?mode=card&new=1`)
        return
      }
      if (isNewFlow && !hasNextStep) {
         router.replace(asDraft || !data.project.published ? '/panel/taslaklar' : '/panel')
      }
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const handleSiteSave = async (siteData, asDraft = false) => {
    const missingField = missingRequiredProjectField(form, eventData)
    if (missingField) { toast.error(`${missingField} zorunludur`); return }
    setSaving(true)
    try {
      const selectedDeliverables = project?.deliverables
      const body = { 
        ...form, 
        event_type: project?.event_type || form.event_type,
        event_data: eventData || null,
        published: asDraft ? false : project?.published ?? true,
        ...(selectedDeliverables ? { deliverables: {
          site: { ...selectedDeliverables.site, status: 'draft' },
          invitation: { ...selectedDeliverables.invitation, ...(asDraft ? { status: 'draft' } : {}) },
        } } : {}),
        host_a: form.host_a,
        date: form.date,
        palette: form.palette && Object.keys(form.palette).length === 4 ? form.palette : null,
        site_data: siteData,
        ...(isUnsavedProject || project?.id === 'new' ? { billing_package_id: project?.billing_package_id || 'baslangic' } : {}),
      }
      const isCreating = isUnsavedProject || project?.id === 'new'
      const requestKey = isCreating ? project?.creation_request_id : (pendingMutationKey.current || window.crypto.randomUUID())
      if (!requestKey) throw new Error('Etkinlik kaydı için istek anahtarı oluşturulamadı')
      if (!isCreating) pendingMutationKey.current = requestKey
      const data = await submitProjectSave(body, isCreating, requestKey)
      setProject(data.project)
      setForm(pick(data.project))
      pendingMutationKey.current = null
      if (isCreating) window.sessionStorage.removeItem(NEW_PROJECT_DRAFT_KEY)
      toast.success(asDraft ? 'Site taslağınız kaydedildi.' : isCreating ? 'Etkinliğiniz ve site tasarımınız kaydedildi.' : 'Site tasarımı güncellendi')

      if (isNewFlow && data.project.deliverables?.invitation?.enabled) {
         changeDesignTarget('card')
         router.replace(`/panel/etkinlik/${data.project.id}/duzenle?mode=card&new=1`)
      } else if (isNewFlow) {
         router.replace(asDraft || !data.project.published ? '/panel/taslaklar' : '/panel')
      }
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const applyEventDataToInvitation = () => {
    if (!eventData) {
      toast.error('Etkinlik bilgileri bulunamadı.')
      return
    }
    setDesign(syncEventTokens(canvasDesign, project?.event_data, eventData))
    toast.success('Etkinlik bilgileri davetiyeye aktarıldı.')
  }

  if (!form) return <div className="space-y-6"><Skeleton className="h-12 w-1/2 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>

  const onboardingDialog = (
    <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
      <DialogContent className="sm:max-w-md bg-ivory rounded-2xl border-0">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-midnight">Stüdyoya Hoş Geldiniz!</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Bilgileriniz tasarıma eklendi. İçeriği düzenleyin; etkinliğiniz ancak ilk kez Kaydet'e bastığınızda oluşturulup kaydedilir.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button onClick={() => setShowOnboarding(false)} className="w-full rounded-xl bg-midnight text-ivory">Harika, Başlayalım</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (designTarget === 'site') {
    if (isNewFlow && siteStartStage !== 'editor') {
      return (
        <SiteStartFlow
          eventTitle={form.title || [form.host_a, form.host_b].filter(Boolean).join(' & ')}
          stage={siteStartStage}
          onBack={() => {
            if (siteStartStage === 'templates') setSiteStartStage('intro')
            else router.back()
          }}
          onContinue={() => setSiteStartStage('templates')}
          onChooseTemplate={chooseSiteTemplate}
        />
      )
    }

    return (
      <div className="flex flex-col h-[calc(100dvh-4rem)] lg:h-[100dvh] w-full" data-testid="project-editor-site">
        <SiteEditor
          key={project?.id || 'project-site'}
          initialSite={siteDataMemo}
          eventData={eventData}
          onSwitchToCard={() => changeDesignTarget('card')}
          showSwitchToCard={project?.deliverables?.invitation?.enabled ?? true}
          isUpdate={true}
          onSave={handleSiteSave}
          onSaveDraft={(siteData) => handleSiteSave(siteData, true)}
          saveButtonLabel={saveLabel}
          autoSaveEnabled={project?.id !== 'new'}
        />
        {onboardingDialog}
      </div>
    )
  }

  if (designTarget === 'card') {
    return (
      <div className="flex flex-col h-[calc(100dvh-4rem)] lg:h-[100dvh] w-full" data-testid="project-editor-canvas">
        <div className="flex-1 w-full relative overflow-hidden bg-ivory">
          <CanvasEditor 
            projectId={project?.id !== 'new' ? project?.id : null}
            topbarLeft={
              <div className="pl-6 lg:pl-10">
                <Button variant="default" onClick={() => {
                  if (project?.deliverables?.site?.enabled) changeDesignTarget('site')
                  else router.back()
                }} className="h-8 rounded-full bg-champagne text-midnight hover:bg-champagne-light px-4 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                  <ArrowLeft className="w-3.5 h-3.5 mr-2" /> {project?.deliverables?.site?.enabled ? 'Site Tasarımına Dön' : 'Ürün Seçimine Dön'}
                </Button>
              </div>
            }
            topbarRight={
              <div className="flex gap-2">
                <Button onClick={applyEventDataToInvitation} variant="outline" size="sm" className="h-8 rounded-full border-midnight/20 text-[10px] uppercase tracking-[0.12em]">
                  Bilgileri davetiyeye uygula
                </Button>
                <Button asChild variant="outline" size="sm" className="h-8 rounded-full border-midnight/20 text-[10px] uppercase tracking-[0.18em]">
                   <a href={`/d/${project?.slug || form.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-3 w-3" /> Yayında Gör</a>
                </Button>
                <Button onClick={() => save(true)} disabled={saving} size="sm" variant="outline" className="h-8 rounded-full border-midnight/20 px-4 text-[10px] uppercase tracking-[0.18em] text-midnight">
                  <Save className="mr-1.5 h-3 w-3" /> Taslak
                </Button>
                <Button onClick={() => save(false)} disabled={saving} size="sm" className="h-8 rounded-full bg-champagne px-5 text-[10px] uppercase tracking-[0.18em] text-midnight hover:bg-champagne-light">
                  <Save className="mr-1.5 h-3 w-3" /> {saveLabel}
                </Button>
              </div>
            }
          />
          {onboardingDialog}
        </div>
      </div>
    )
  }

  return (
    <div className="-mt-2 flex min-h-[calc(100dvh-5rem)] flex-col gap-3 pb-3 lg:-mt-4 lg:h-[calc(100dvh-6rem)] lg:min-h-0 lg:flex-row lg:gap-6" data-testid="project-editor">
      {/* LEFT SIDEBAR */}
      <div className="flex h-[54dvh] min-h-[360px] max-h-[560px] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-ivory shadow-sm lg:h-auto lg:min-h-0 lg:max-h-none lg:w-[400px] xl:w-[460px]">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5 lg:gap-4 lg:p-6">
          <div className="flex items-center justify-between">
            <Link href={`/panel`} className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-midnight" data-testid="editor-back">
              <ArrowLeft className="h-3.5 w-3.5" /> Geri
            </Link>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="h-8 rounded-full border-midnight/20 text-[10px] uppercase tracking-[0.18em]">
                <a href={`/d/${project?.slug || form.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-3 w-3" /> Yayında Gör</a>
              </Button>
              <Button onClick={() => save(true)} disabled={saving} size="sm" variant="outline" className="h-8 rounded-full border-midnight/20 px-4 text-[10px] uppercase tracking-[0.18em] text-midnight" data-testid="editor-save-draft">
                <Save className="mr-1.5 h-3 w-3" /> Taslak
              </Button>
              <Button onClick={() => save(false)} disabled={saving} size="sm" className="h-8 rounded-full bg-champagne px-5 text-[10px] uppercase tracking-[0.18em] text-midnight hover:bg-champagne-light" data-testid="editor-save">
                <Save className="mr-1.5 h-3 w-3" /> {saveLabel}
              </Button>
            </div>
          </div>
          <div>
            <h1 className="font-serif text-2xl text-midnight">Düzenle: {form.host_a} & {form.host_b || '...'}</h1>
            <p className="mt-1 text-xs text-muted-foreground">Tüm değişiklikler anında yan tarafta görünür.</p>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-ivory-50 p-1" aria-label="Düzenleme alanı">
            <Button type="button" variant="ghost" onClick={() => changeDesignTarget('site')} className={cn('h-9 rounded-lg text-[10px] font-medium uppercase tracking-[0.14em]', designTarget === 'site' ? 'bg-midnight text-ivory hover:bg-midnight hover:text-ivory' : 'text-midnight/60')}>Davet sitesi</Button>
            <Button type="button" variant="ghost" onClick={() => changeDesignTarget('card')} className={cn('h-9 rounded-lg text-[10px] font-medium uppercase tracking-[0.14em]', designTarget === 'card' ? 'bg-midnight text-ivory hover:bg-midnight hover:text-ivory' : 'text-midnight/60')}>Davetiye kartı</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <Accordion type="single" collapsible value={openSection} onValueChange={setOpenSection} className="w-full">
            <AccordionItem value="details" className="border-b-0">
              <AccordionTrigger className="rounded-xl px-4 py-4 text-[11px] uppercase tracking-[0.2em] hover:bg-ivory-50 hover:no-underline">Temel Bilgiler</AccordionTrigger>
              <AccordionContent className="px-4 pb-6 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Gelin adı soyadı *" value={form.host_a} onChange={set('host_a')} testid="edit-host-a" />
                  <Field label="Damat adı soyadı" value={form.host_b} onChange={set('host_b')} testid="edit-host-b" />
                  <Field label="Gelin annesi" value={form.bride_mother} onChange={set('bride_mother')} />
                  <Field label="Gelin babası" value={form.bride_father} onChange={set('bride_father')} />
                  <Field label="Damat annesi" value={form.groom_mother} onChange={set('groom_mother')} />
                  <Field label="Damat babası" value={form.groom_father} onChange={set('groom_father')} />
                  <Field label="Başlık" value={form.title} onChange={set('title')} testid="edit-title" className="sm:col-span-2" />
                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-[0.2em]">Etkinlik tarihi *</Label>
                    <DatePickerField value={form.date} onChange={(date) => setForm((f) => ({ ...f, date }))} placeholder="Gün, ay ve yıl seçin" testid="edit-date" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-[0.2em]">Saat</Label>
                    <Select value={form.time || undefined} onValueChange={(value) => setForm((f) => ({ ...f, time: value }))}>
                      <SelectTrigger className={cn(inputCls, 'w-full')} aria-label="Etkinlik saati" data-testid="edit-time"><SelectValue placeholder="Saat seçin" /></SelectTrigger>
                      <SelectContent className="max-h-64">{TIME_OPTIONS.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Field label="Mekân" value={form.venue} onChange={set('venue')} testid="edit-venue" />
                  <Field label="Şehir" value={form.city} onChange={set('city')} testid="edit-city" />
                  <Field label="Adres" value={form.address} onChange={set('address')} testid="edit-address" className="sm:col-span-2" />
                  <Field label="Kıyafet Kodu" value={form.dress_code} onChange={set('dress_code')} testid="edit-dress" />
                  <Field label="Bağlantı (slug)" value={form.slug} onChange={set('slug')} testid="edit-slug" />
                </div>
                <div className="mt-4 space-y-2">
                  <Label className="text-[11px] uppercase tracking-[0.2em]">Etkinlik Türü</Label>
                  <div className="flex flex-wrap gap-2">{EVENT_TYPES.map((e) => <button key={e.id} type="button" onClick={() => setForm((f) => ({ ...f, event_type: e.id }))} className={cn('border px-3 py-2 text-[11px] uppercase tracking-[0.18em]', form.event_type === e.id ? 'border-midnight bg-midnight text-ivory' : 'border-border text-midnight/70')}>{e.label}</button>)}</div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="design" className="border-b-0">
              <AccordionTrigger className="rounded-xl px-4 py-4 text-[11px] uppercase tracking-[0.2em] hover:bg-ivory-50 hover:no-underline">{designTarget === 'site' ? 'Davet Sitesi Ayarları' : 'Davetiye Kartı Ayarları'}</AccordionTrigger>
              <AccordionContent className="space-y-6 px-4 pb-6 pt-2">
                <div className={designTarget === 'site' ? '' : 'hidden'}>
                  <div className="mb-3 border-b border-border pb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-champagne-dark">1 · Davet sitesi</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Web sayfanızın renklerini ve yazı tipini karttan bağımsız belirleyin.</p>
                  </div>
                  <div className="mb-4 space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.2em]">Site şablonu</Label>
                    <Select value={form.template_slug} onValueChange={(value) => setForm((f) => ({ ...f, template_slug: value }))}>
                      <SelectTrigger className={cn(inputCls, 'w-full')} aria-label="Davet sitesi şablonu"><SelectValue placeholder="Şablon seçin" /></SelectTrigger>
                      <SelectContent>{TEMPLATES.map((item) => <SelectItem key={item.slug} value={item.slug}>{item.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="mb-4 space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.2em]">Yazı tipi</Label>
                    <Select value={form.website_font} onValueChange={(value) => setForm((f) => ({ ...f, website_font: value }))}>
                      <SelectTrigger className={cn(inputCls, 'w-full')} aria-label="Davet sitesi yazı tipi"><SelectValue placeholder="Yazı tipi seçin" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="playfair">Playfair Display · Zarif</SelectItem>
                        <SelectItem value="dm-sans">DM Sans · Modern</SelectItem>
                        <SelectItem value="georgia">Georgia · Klasik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mb-5 space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.2em]">Hero arka plan görseli</Label>
                    <Input type="url" value={form.hero_image?.startsWith('data:') ? '' : form.hero_image} onChange={set('hero_image')} placeholder="https://... görsel bağlantısı" className={cn(inputCls, 'h-10 text-xs')} />
                    <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleHeroImage} className="h-10 cursor-pointer rounded-xl border-border bg-ivory-50 text-xs file:mr-3 file:h-7 file:rounded-lg file:border-0 file:bg-midnight file:px-3 file:text-[10px] file:uppercase file:tracking-wider file:text-ivory" aria-label="Hero arka plan görseli yükle" />
                    {form.hero_image && <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-2">
                      <div className="flex min-w-0 items-center gap-2"><img src={form.hero_image} alt="Hero görseli küçük önizleme" className="h-10 w-14 rounded-lg object-cover" /><span className="truncate text-[10px] text-muted-foreground">Görsel hazır</span></div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, hero_image: '' }))} className="h-7 px-2 text-[10px]">Kaldır</Button>
                    </div>}
                    <p className="text-[10px] leading-relaxed text-muted-foreground">Bir görsel bağlantısı ekleyin veya cihazınızdan yükleyin. Yüklenen görsel otomatik küçültülür.</p>
                    <div className="space-y-2 rounded-xl bg-ivory-50 px-3 py-2.5">
                      <div className="flex items-center justify-between"><Label className="text-[9px] uppercase tracking-[0.18em]">Görsel opaklığı</Label><span className="text-xs font-medium tabular-nums text-midnight">{form.hero_image_opacity}%</span></div>
                      <Slider min={0} max={100} step={1} value={[form.hero_image_opacity]} onValueChange={([value]) => setForm((f) => ({ ...f, hero_image_opacity: value }))} aria-label="Hero görseli opaklığı" />
                    </div>
                  </div>
                  <div className="mb-5 space-y-3 rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-3"><div><Label className="text-[10px] uppercase tracking-[0.2em]">Sayfada QR alanı</Label><p className="mt-1 text-[10px] text-muted-foreground">Ziyaretçiler bağlantıyı kopyalayabilir veya QR kodunu indirebilir.</p></div><Switch checked={form.qr_enabled} onCheckedChange={(value) => setForm((f) => ({ ...f, qr_enabled: value }))} aria-label="QR alanını göster" /></div>
                    {form.qr_enabled && <Input value={form.qr_message} onChange={set('qr_message')} maxLength={240} placeholder="QR alanı açıklaması" className={cn(inputCls, 'h-9 text-xs')} />}
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase tracking-[0.2em]">Site renkleri</Label>
                    {form.palette && <Button type="button" variant="ghost" size="sm" onClick={resetPalette} className="h-6 px-2 text-[10px]"><RotateCcw className="mr-1 h-3 w-3" /> Sıfırla</Button>}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {PALETTE_KEYS.map(([k, label]) => (
                      <div key={k} className="space-y-1.5">
                        <Label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={effectivePalette?.[k] || '#000000'} onChange={(e) => setPaletteColor(k, e.target.value)} className="h-8 w-8 shrink-0 cursor-pointer border border-border bg-transparent p-0.5" aria-label={`Site ${label}`} />
                          <Input value={effectivePalette?.[k] || ''} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setPaletteColor(k, e.target.value)} className={cn(inputCls, 'h-8 min-w-0 px-2 font-mono text-xs uppercase')} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={designTarget === 'card' ? 'border-t border-border pt-5' : 'hidden'}>
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-champagne-dark">2 · Davetiye kartı</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Paylaşabileceğiniz basılı kart tasarımını ayrı seçin.</p>
                  </div>
                  <Label className="text-[11px] uppercase tracking-[0.2em]">Kart şablonu</Label>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {Object.keys(SABLONLAR).map((sablonKey) => {
                      const sablon = SABLONLAR[sablonKey]
                      const ogelerObjects = sablon.ogeler.map(arr => ({ k: arr[0], x: arr[1], y: arr[2], w: arr[3], r: arr[4] }))
                      const thumbVeri = {
                        tema: sablon.tema,
                        kagit: sablon.kagit || 0,
                        yazilar: { baslik: '', isim1: '', isim2: '', tarih: '', mekan: '' },
                        ogeler: ogelerObjects
                      }
                      
                      return (
                        <button 
                          key={sablonKey} 
                          type="button" 
                          onClick={() => setForm((f) => ({ ...f, card_template: sablonKey, card_theme: sablon.tema }))} 
                          className={cn('group border p-2 text-left transition-all', form.card_template === sablonKey ? 'border-midnight ring-1 ring-midnight' : 'border-border hover:border-midnight/40')}
                        >
                          <div className="aspect-[3/4] overflow-hidden rounded bg-ivory flex items-center justify-center pointer-events-none">
                             <DavetiyeKart veri={thumbVeri} scale={0.3} />
                          </div>
                          <p className="mt-2 truncate font-serif text-[11px] text-midnight">{sablonKey}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
                  <div className={designTarget === 'card' ? 'space-y-3' : 'hidden'}>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-[0.2em]">Davetiye mesajı</Label>
                      <Textarea rows={3} maxLength={220} value={form.card_message} onChange={set('card_message')} placeholder="Bu özel günümüzde sizleri de aramızda görmekten mutluluk duyarız." className="rounded-xl border-border bg-ivory-50 text-xs" />
                      <CardMessageTemplates value={form.card_message} onSelect={(message) => setForm((f) => ({ ...f, card_message: message }))} />
                    </div>
                    <div><Label className="text-[10px] uppercase tracking-[0.2em]">Kart düzeni</Label><p className="mt-1 text-[10px] text-muted-foreground">İsimler ve etkinlik bilgileri seçilen kompozisyona göre yerleşir.</p></div>
                    <div className="grid grid-cols-2 gap-2">
                      {CARD_LAYOUTS.map((layout) => <button key={layout.id} type="button" onClick={() => setForm((f) => ({ ...f, card_layout: layout.id }))} className={cn('rounded-xl border p-3 text-left transition-colors', form.card_layout === layout.id ? 'border-midnight bg-midnight text-ivory' : 'border-border bg-ivory-50 text-midnight hover:border-midnight/40')} aria-pressed={form.card_layout === layout.id}>
                        <span className="block text-xs font-medium">{layout.name}</span><span className={cn('mt-1 block text-[9px] leading-relaxed', form.card_layout === layout.id ? 'text-ivory/70' : 'text-muted-foreground')}>{layout.description}</span>
                      </button>)}
                    </div>
                  </div>
                <div className={designTarget === 'card' ? '' : 'hidden'}>
                  <Label className="text-[10px] uppercase tracking-[0.2em]">Kart renk teması</Label>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {TEMALAR.map((t, index) => {
                      const active = activeTemaIndex === index
                      return (
                        <button
                          key={index} type="button" onClick={() => setForm(f => ({ ...f, card_theme: index }))}
                          className={cn('group overflow-hidden rounded-2xl border p-3 text-left transition-all', active ? 'border-midnight ring-2 ring-midnight/70' : 'border-border hover:border-midnight/40 hover:-translate-y-0.5')}
                        >
                          <div className="flex h-10 w-full items-center justify-center gap-0 rounded-xl overflow-hidden">
                            <span className="h-full w-1/2" style={{ backgroundColor: t.p1 }} />
                            <span className="h-full w-1/2" style={{ backgroundColor: t.p2 }} />
                          </div>
                          <p className="mt-2 text-center truncate text-[10px] font-medium uppercase tracking-[0.12em] text-midnight">{t.ad}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="content" className={cn('border-b-0', designTarget === 'site' ? '' : 'hidden')}>
              <AccordionTrigger className="rounded-xl px-4 py-4 text-[11px] uppercase tracking-[0.2em] hover:bg-ivory-50 hover:no-underline">Hikâye & Program</AccordionTrigger>
              <AccordionContent className="space-y-6 px-4 pb-6 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] uppercase tracking-[0.2em]">Hikâyeniz</Label>
                    <StoryTemplatesModal onSelect={(content) => setForm((f) => ({ ...f, story: content }))} />
                  </div>
                  <Textarea rows={5} value={form.story} onChange={set('story')} className="rounded-2xl border-border bg-ivory-50 text-sm" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] uppercase tracking-[0.2em]">Program Akışı</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={addProgram} className="h-6 px-2 text-[10px]"><Plus className="mr-1 h-3 w-3" /> Ekle</Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {form.program.length === 0 && <p className="text-xs text-muted-foreground">Henüz program eklenmedi.</p>}
                    {form.program.map((p, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={p.time} onChange={(e) => updateProgram(i, 'time', e.target.value)} placeholder="19:00" className={cn(inputCls, 'h-9 w-20 px-2 text-xs')} />
                        <Input value={p.title} onChange={(e) => updateProgram(i, 'title', e.target.value)} placeholder="Nikâh" className={cn(inputCls, 'h-9 px-3 text-xs')} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeProgram(i)} className="h-9 w-9 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="media" className={cn('border-b-0', designTarget === 'site' ? '' : 'hidden')}>
              <AccordionTrigger className="rounded-xl px-4 py-4 text-[11px] uppercase tracking-[0.2em] hover:bg-ivory-50 hover:no-underline">Medya & Müzik</AccordionTrigger>
              <AccordionContent className="space-y-6 px-4 pb-6 pt-2">
                 <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[0.2em]">Spotify Çalma Listesi</Label>
                  <p className="text-[10px] text-muted-foreground">Bağlantıyı yapıştırın, davetiyede gömülü çalar görünsün.</p>
                  <Input value={form.spotify_url} onChange={set('spotify_url')} placeholder="https://open.spotify.com/..." className={cn(inputCls, 'h-9 text-xs')} />
                </div>
                <div className="rounded-2xl border border-dashed border-border p-4 text-center">
                   <p className="text-xs text-muted-foreground">Görsel Yükleme özelliği yakında eklenecek.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rsvp" className={cn('border-b-0', designTarget === 'site' ? '' : 'hidden')}>
              <AccordionTrigger className="rounded-xl px-4 py-4 text-[11px] uppercase tracking-[0.2em] hover:bg-ivory-50 hover:no-underline">RSVP & Hediyeler</AccordionTrigger>
              <AccordionContent className="space-y-6 px-4 pb-6 pt-2">
                <div className="space-y-2"><Label className="text-[11px] uppercase tracking-[0.2em]">RSVP son yanıt tarihi</Label><DatePickerField value={form.rsvp_deadline} onChange={(date) => setForm((f) => ({ ...f, rsvp_deadline: date }))} placeholder="Son yanıt tarihini seçin" testid="edit-rsvp-deadline" /></div>
                <div>
                  <Label className="text-[11px] uppercase tracking-[0.2em]">Menü Seçenekleri</Label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.menu_options.map((m) => <span key={m} className="flex items-center gap-1.5 rounded-xl border border-border bg-ivory-50 px-2 py-1 text-xs">{m}<button type="button" onClick={() => removeMenu(m)} className="text-muted-foreground hover:text-destructive">×</button></span>)}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input value={menuInput} onChange={(e) => setMenuInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMenu() } }} placeholder="Örn. Vegan" className={cn(inputCls, 'h-9 text-xs')} />
                    <Button type="button" variant="outline" onClick={addMenu} className="h-9 rounded-xl px-3 text-xs">Ekle</Button>
                  </div>
                </div>
                <div className="space-y-4 border-t border-border pt-5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] uppercase tracking-[0.2em]">Hediye & IBAN</Label>
                    <Switch checked={form.gift_enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, gift_enabled: v }))} />
                  </div>
                  {form.gift_enabled && (
                    <div className="grid gap-3">
                      <div className="space-y-1"><Label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Mesaj</Label><Textarea rows={2} value={form.gift_message} onChange={set('gift_message')} className="rounded-2xl border-border bg-ivory-50 text-xs" /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Hesap Sahibi</Label><Input value={form.gift_account_name} onChange={set('gift_account_name')} className={cn(inputCls, 'h-9 text-xs')} /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">IBAN</Label><Input value={form.gift_iban} onChange={set('gift_iban')} className={cn(inputCls, 'h-9 font-mono text-xs')} /></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Hediye Listesi Bağlantısı</Label><Input value={form.gift_url} onChange={set('gift_url')} className={cn(inputCls, 'h-9 text-xs')} /></div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="share" className={cn('border-b-0', designTarget === 'site' ? '' : 'hidden')}>
              <AccordionTrigger className="rounded-xl px-4 py-4 text-[11px] uppercase tracking-[0.2em] hover:bg-ivory-50 hover:no-underline">Paylaşım & QR Kod</AccordionTrigger>
              <AccordionContent className="space-y-6 px-4 pb-6 pt-2">
                 <div className="space-y-4">
                  <div>
                    <Label className="text-[11px] uppercase tracking-[0.2em]">Davetiye Bağlantınız</Label>
                    <div className="mt-2 flex items-center gap-2">
                       <Input value={`https://momentis.com/d/${project?.slug || form.slug}`} readOnly className={cn(inputCls, 'h-9 text-xs')} />
                       <Button type="button" variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(`https://momentis.com/d/${project?.slug || form.slug}`); toast.success('Bağlantı kopyalandı!') }} className="h-9 w-9 shrink-0 rounded-2xl border-border"><Copy className="h-4 w-4 text-midnight/70" /></Button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border p-4 bg-ivory-50 flex flex-col items-center text-center">
                     <QrCode className="h-10 w-10 text-midnight/40 mb-3" />
                     <p className="text-xs font-medium text-midnight mb-1">QR Kodunuz Hazır</p>
                     <p className="text-[10px] text-muted-foreground mb-4">Davetiyenize özel karekodu indirip baskılarda veya mesajlarda kullanabilirsiniz.</p>
                     <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" className="h-8 rounded-xl text-[10px] uppercase tracking-[0.15em] border-midnight/20 hover:bg-midnight hover:text-ivory">
                           <Download className="mr-1.5 h-3 w-3" /> PNG İndir
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-8 rounded-xl text-[10px] uppercase tracking-[0.15em] border-midnight/20 hover:bg-midnight hover:text-ivory">
                           <Download className="mr-1.5 h-3 w-3" /> SVG İndir
                        </Button>
                     </div>
                  </div>
                 </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* RIGHT PREVIEW */}
      <div className="relative flex h-[58dvh] min-h-[440px] w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-[#e9e4d9] px-2 pb-3 pt-16 sm:px-4 lg:h-auto lg:min-h-0 lg:p-8">
        <div className="absolute top-3 z-10 flex w-full flex-col items-center gap-2 px-2 sm:top-4 sm:flex-row sm:justify-between sm:px-4">
          <div className="flex items-center gap-1 rounded-full border border-midnight/10 bg-ivory/90 p-1 backdrop-blur-md">
            <Button variant="ghost" size="sm" onClick={() => changeDesignTarget('site')} className={cn('h-7 rounded-full px-3 text-[9px] font-medium uppercase tracking-wider sm:text-[10px]', previewMode === 'site' ? 'bg-midnight text-ivory' : 'text-midnight/60 hover:text-midnight')}>Davet sitesi</Button>
            <Button variant="ghost" size="sm" onClick={() => changeDesignTarget('card')} className={cn('h-7 rounded-full px-3 text-[9px] font-medium uppercase tracking-wider sm:text-[10px]', previewMode === 'card' ? 'bg-midnight text-ivory' : 'text-midnight/60 hover:text-midnight')}>Davetiye kartı</Button>
          </div>
          {previewMode === 'site' && <div className="flex items-center gap-0.5 rounded-full border border-midnight/10 bg-ivory/90 p-1 backdrop-blur-md">
            <Button variant="ghost" size="sm" onClick={() => setDevice('mobile')} className={cn('h-6 gap-1 rounded-full px-2 text-[9px] font-medium uppercase tracking-wider sm:h-7 sm:gap-1.5 sm:px-3 sm:text-[10px]', device === 'mobile' ? 'bg-midnight text-ivory' : 'text-midnight/60 hover:text-midnight')}><Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Mobil</Button>
            <Button variant="ghost" size="sm" onClick={() => setDevice('tablet')} className={cn('h-6 gap-1 rounded-full px-2 text-[9px] font-medium uppercase tracking-wider sm:h-7 sm:gap-1.5 sm:px-3 sm:text-[10px]', device === 'tablet' ? 'bg-midnight text-ivory' : 'text-midnight/60 hover:text-midnight')}><Tablet className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Tablet</Button>
            <Button variant="ghost" size="sm" onClick={() => setDevice('desktop')} className={cn('h-6 gap-1 rounded-full px-2 text-[9px] font-medium uppercase tracking-wider sm:h-7 sm:gap-1.5 sm:px-3 sm:text-[10px]', device === 'desktop' ? 'bg-midnight text-ivory' : 'text-midnight/60 hover:text-midnight')}><Monitor className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Masaüstü</Button>
          </div>}
        </div>

        {/* Device Frame */}
        <div className={cn(
          'relative transition-all duration-500 ease-out',
          previewMode === 'card' ? 'h-full max-h-full w-full max-w-none overflow-visible rounded-none border-0 bg-transparent shadow-none' :
          device === 'mobile' ? 'mt-2 h-[min(700px,calc(100%-0.5rem))] max-h-[78dvh] w-[min(88vw,340px)] overflow-hidden rounded-[2rem] border-[5px] border-midnight bg-ivory shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] sm:rounded-[2.5rem] sm:border-[6px]' :
          device === 'tablet' ? 'mt-2 h-[min(700px,calc(100%-0.5rem))] max-h-[78dvh] w-[min(92vw,560px)] overflow-hidden rounded-[1.5rem] border-[5px] border-midnight bg-ivory shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] sm:rounded-[2rem] sm:border-[6px]' :
          'mt-2 h-[min(700px,calc(100%-0.5rem))] max-h-[78dvh] w-full max-w-[1000px] overflow-hidden rounded-xl border-[5px] border-midnight bg-ivory shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] sm:rounded-2xl sm:border-[6px]'
        )}>
          <iframe
            ref={iframeRef}
            src="/preview"
            className={cn('h-full w-full border-0', previewMode === 'card' ? 'bg-transparent' : 'bg-ivory')}
            title={previewMode === 'card' ? 'Davetiye kartı önizlemesi' : 'Davet sitesi önizlemesi'}
          />
        </div>

      </div>
      {onboardingDialog}
    </div>
  )
}

function Field({ label, value, onChange, testid, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</Label>
      <Input value={value} onChange={onChange} className={cn(inputCls, 'h-9 text-xs')} data-testid={testid} />
    </div>
  )
}
