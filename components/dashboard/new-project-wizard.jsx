'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, RotateCcw, Save, Smartphone, Tablet, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { InvitationPreview } from '@/components/shared/invitation-preview'
import { EVENT_TYPES } from '@/lib/data/events'
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
import { SiteEditor } from '@/components/site-builder/SiteEditor'
import { useEditorStore } from '@/store/editor-store'
import { normalizeSiteForEditor } from '@/lib/site-builder/normalize-site'

const inputCls = 'h-11 rounded-2xl border-border bg-ivory-50'
const PALETTE_KEYS = [['bg', 'Zemin'], ['accent', 'Vurgu'], ['text', 'Metin'], ['muted', 'İkincil']]
const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`)

export function NewProjectWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [menuInput, setMenuInput] = useState('')
  const [device, setDevice] = useState('mobile')
  const [previewMode, setPreviewMode] = useState('site')
  const [designTarget, setDesignTarget] = useState('site')
  const [openSection, setOpenSection] = useState('details')
  const iframeRef = useRef(null)
  
  const { design: canvasDesign } = useEditorStore()

  const [form, setForm] = useState({
    event_type: 'dugun', host_a: '', host_b: '',
    bride_mother: '', bride_father: '', groom_mother: '', groom_father: '', title: '',
    date: '', time: '19:00', venue: '', address: '', city: '',
    story: '', dress_code: '', rsvp_deadline: '',
    program: [], menu_options: [],
    template_slug: searchParams.get('tasarim') || 'aurelia',
    card_template: 'Klasik Altın', card_theme: 0, card_layout: 'classic', card_message: '',
    palette: null, website_font: 'playfair', hero_image: '', qr_enabled: true,
    hero_image_opacity: 52,
    qr_message: 'Bu QR kodunu paylaşarak davet sayfasına hızlıca ulaşabilirsiniz.', spotify_url: '',
    gift_enabled: false, gift_message: '', gift_iban: '', gift_account_name: '', gift_url: '',
  })

  // Davetiye-svg temalarını Next.js'in beklediği palet yapısına uyarlama
  const activeTemaIndex = form?.card_theme ?? (SABLONLAR[form?.card_template || 'Klasik Altın']?.tema || 0)
  const effectivePalette = form?.palette || { bg: '#F8F4EC', accent: '#C9A96E', text: '#101827', muted: '#8B8577' }
  const selectedSiteTemplate = TEMPLATES.find((item) => item.slug === form?.template_slug) || TEMPLATES[0]
  const previewTemplate = { ...selectedSiteTemplate, palette: effectivePalette }
  const eventType = EVENT_TYPES.find((e) => e.id === form.event_type)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const changeDesignTarget = (target) => { setDesignTarget(target); setPreviewMode(target === 'site' ? 'site' : 'card'); setOpenSection('design') }
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

  const submit = async () => {
    const isManual = designTarget === 'card'
    if (!isManual && (!form.host_a || !form.date)) { toast.error('Gelin adı ve tarih zorunludur'); return }
    setSaving(true)
    try {
      const body = { 
        ...form, 
        host_a: form.host_a || 'İsimsiz', 
        date: form.date || new Date().toISOString(),
        palette: form.palette && Object.keys(form.palette).length === 4 ? form.palette : null,
        canvas_design: isManual ? canvasDesign : form.canvas_design,
        site_data: form.site_data
      }
      const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Etkinlik oluşturulamadı')
      toast.success('Etkinliğiniz oluşturuldu ve yayında!')
      router.replace(`/panel/etkinlik/${data.project.id}`)
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const handleSiteSave = async (siteData) => {
    setForm((f) => ({ ...f, site_data: siteData }));
    changeDesignTarget('card');
    toast.success('Site tasarımı kaydedildi. Şimdi davetiye kartını hazırlayabilirsiniz.');
  }

  if (designTarget === 'card') {
    return (
      <div className="flex flex-col h-[calc(100dvh-4rem)] lg:h-[100dvh] w-full" data-testid="new-project-wizard-canvas">
        <div className="flex-1 w-full relative overflow-hidden bg-ivory">
          <CanvasEditor 
            topbarLeft={
              <Button variant="ghost" onClick={() => changeDesignTarget('site')} className="shrink-0 whitespace-nowrap text-xs uppercase tracking-wider text-muted-foreground hover:text-midnight">
                <ArrowLeft className="w-4 h-4 mr-2" /> Site Formuna Dön
              </Button>
            }
            topbarRight={
              <Button onClick={submit} disabled={saving} size="sm" className="h-8 rounded-full bg-champagne px-5 text-[10px] uppercase tracking-[0.18em] text-midnight hover:bg-champagne-light">
                <Save className="mr-1.5 h-3 w-3" /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  if (designTarget === 'site') {
    return (
      <div className="flex flex-col h-[calc(100dvh-4rem)] lg:h-[100dvh] w-full">
        <SiteEditor
          initialSite={form.site_data ? normalizeSiteForEditor(form.site_data, { title: form.title || 'Bizim Düğün', slug: 'bizim-dugun', templateId: form.template_slug || 'minimal', userId: 'demo' }) : null}
          onSwitchToCard={() => changeDesignTarget('card')}
          onSave={handleSiteSave}
        />
      </div>
    )
  }

  return null;
}

function Field({ label, value, onChange, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</Label>
      <Input value={value} onChange={onChange} className={cn(inputCls, 'h-9 text-xs')} />
    </div>
  )
}
