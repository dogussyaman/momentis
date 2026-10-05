'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, RotateCcw, Save, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InvitationPreview } from '@/components/shared/invitation-preview'
import { EVENT_TYPES } from '@/lib/data/events'
import { THEME_PRESETS } from '@/lib/data/themes'
import { formatEventDate } from '@/lib/projects'
import { cn } from '@/lib/utils'

const inputCls = 'h-11 rounded-2xl border-border bg-ivory-50'
const tabCls = 'rounded-2xl border-b-2 border-transparent px-0 pb-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground data-[state=active]:border-midnight data-[state=active]:bg-transparent data-[state=active]:text-midnight data-[state=active]:shadow-none'
const PALETTE_KEYS = [['bg', 'Zemin'], ['accent', 'Vurgu'], ['text', 'Metin'], ['muted', 'İkincil']]

function pick(project) {
  return {
    host_a: project.host_a || '', host_b: project.host_b || '', title: project.title || '', event_type: project.event_type || 'dugun',
    date: project.date || '', time: project.time || '', venue: project.venue || '', address: project.address || '', city: project.city || '',
    story: project.story || '', dress_code: project.dress_code || '', rsvp_deadline: project.rsvp_deadline || '',
    program: Array.isArray(project.program) ? project.program : [],
    menu_options: Array.isArray(project.menu_options) ? project.menu_options : [],
    template_slug: project.template_slug || 'aurelia',
    palette: project.palette || null,
    slug: project.slug || '',
  }
}

export function ProjectEditor() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState(null)
  const [templates, setTemplates] = useState([])
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [menuInput, setMenuInput] = useState('')

  useEffect(() => {
    fetch(`/api/projects/${id}`, { credentials: 'include', cache: 'no-store' }).then((r) => r.json()).then((d) => { if (d.project) { setProject(d.project); setForm(pick(d.project)) } }).catch(() => {})
    fetch('/api/templates').then((r) => r.json()).then((d) => setTemplates(d.items || [])).catch(() => {})
  }, [id])

  const template = useMemo(() => templates.find((t) => t.slug === form?.template_slug), [templates, form?.template_slug])
  const effectivePalette = form?.palette || template?.palette
  const previewTemplate = template ? { ...template, palette: effectivePalette } : (effectivePalette ? { palette: effectivePalette, layout: 'classic' } : undefined)
  const eventType = EVENT_TYPES.find((e) => e.id === form?.event_type)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const setPaletteColor = (k, v) => setForm((f) => ({ ...f, palette: { ...(f.palette || template?.palette || {}), [k]: v.toUpperCase() } }))
  const resetPalette = () => setForm((f) => ({ ...f, palette: null }))
  const applyPreset = (preset) => setForm((f) => ({ ...f, palette: { ...preset.palette } }))
  const activePreset = THEME_PRESETS.find((t) => effectivePalette && t.palette.bg === effectivePalette.bg && t.palette.accent === effectivePalette.accent && t.palette.text === effectivePalette.text && t.palette.muted === effectivePalette.muted)

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

  const save = async () => {
    if (!form.host_a || !form.date) { toast.error('Ev sahibi adı ve tarih zorunludur'); return }
    setSaving(true)
    try {
      const body = { ...form, palette: form.palette && Object.keys(form.palette).length === 4 ? form.palette : null }
      const res = await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Kaydedilemedi')
      setProject(data.project)
      setForm(pick(data.project))
      toast.success('Değişiklikler kaydedildi')
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  if (!form) return <div className="space-y-6"><Skeleton className="h-12 w-1/2 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>

  return (
    <div data-testid="project-editor">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href={`/panel/etkinlik/${id}`} className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-midnight" data-testid="editor-back"><ArrowLeft className="h-3.5 w-3.5" /> Etkinliğe dön</Link>
          <h1 className="mt-6 font-serif text-4xl leading-tight text-midnight md:text-5xl">Davetiyeyi Düzenle</h1>
          <p className="mt-2 text-muted-foreground">Değişiklikler kaydettiğinizde yayındaki davetiyeye anında yansır.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-11 rounded-2xl border-midnight/20 text-[11px] uppercase tracking-[0.18em]"><a href={`/d/${project.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-3.5 w-3.5" /> Önizle</a></Button>
          <Button onClick={save} disabled={saving} className="h-11 rounded-2xl bg-champagne px-6 text-[11px] uppercase tracking-[0.18em] text-midnight hover:bg-champagne-light" data-testid="editor-save"><Save className="mr-2 h-3.5 w-3.5" /> {saving ? 'Kaydediliyor…' : 'Kaydet'}</Button>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Tabs defaultValue="details">
            <TabsList className="h-auto w-full justify-start gap-8 rounded-2xl border-b border-border bg-transparent p-0">
              <TabsTrigger value="details" className={tabCls} data-testid="editor-tab-details">Detaylar</TabsTrigger>
              <TabsTrigger value="content" className={tabCls} data-testid="editor-tab-content">Hikâye & Program</TabsTrigger>
              <TabsTrigger value="design" className={tabCls} data-testid="editor-tab-design">Tasarım & Renkler</TabsTrigger>
              <TabsTrigger value="rsvp" className={tabCls} data-testid="editor-tab-rsvp">RSVP</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-8 space-y-6 border border-border bg-ivory p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ev Sahibi 1 *" value={form.host_a} onChange={set('host_a')} testid="edit-host-a" />
                <Field label="Ev Sahibi 2" value={form.host_b} onChange={set('host_b')} testid="edit-host-b" />
                <Field label="Başlık" value={form.title} onChange={set('title')} testid="edit-title" className="sm:col-span-2" />
                <div className="space-y-2"><Label className="text-[11px] uppercase tracking-[0.2em]">Tarih *</Label><Input type="date" value={form.date} onChange={set('date')} className={inputCls} data-testid="edit-date" /></div>
                <div className="space-y-2"><Label className="text-[11px] uppercase tracking-[0.2em]">Saat</Label><Input type="time" value={form.time} onChange={set('time')} className={inputCls} data-testid="edit-time" /></div>
                <Field label="Mekân" value={form.venue} onChange={set('venue')} testid="edit-venue" />
                <Field label="Şehir" value={form.city} onChange={set('city')} testid="edit-city" />
                <Field label="Adres" value={form.address} onChange={set('address')} testid="edit-address" className="sm:col-span-2" />
                <Field label="Kıyafet Kodu" value={form.dress_code} onChange={set('dress_code')} testid="edit-dress" />
                <Field label="Bağlantı (slug)" value={form.slug} onChange={set('slug')} testid="edit-slug" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[0.2em]">Etkinlik Türü</Label>
                <div className="flex flex-wrap gap-2">{EVENT_TYPES.map((e) => <button key={e.id} type="button" onClick={() => setForm((f) => ({ ...f, event_type: e.id }))} className={cn('border px-3 py-2 text-[11px] uppercase tracking-[0.18em]', form.event_type === e.id ? 'border-midnight bg-midnight text-ivory' : 'border-border text-midnight/70')}>{e.label}</button>)}</div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="mt-8 space-y-8 border border-border bg-ivory p-8">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[0.2em]">Hikâyeniz</Label>
                <Textarea rows={5} value={form.story} onChange={set('story')} className="rounded-2xl border-border bg-ivory-50" data-testid="edit-story" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] uppercase tracking-[0.2em]">Program Akışı</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={addProgram} className="text-xs" data-testid="add-program"><Plus className="mr-1 h-3.5 w-3.5" /> Satır ekle</Button>
                </div>
                <div className="mt-3 space-y-2">
                  {form.program.length === 0 && <p className="text-sm text-muted-foreground">Henüz program eklenmedi. Örn: 18:30 Karşılama · 19:00 Nikâh · 20:00 Yemek</p>}
                  {form.program.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={p.time} onChange={(e) => updateProgram(i, 'time', e.target.value)} placeholder="19:00" className={cn(inputCls, 'w-24')} data-testid={`program-time-${i}`} />
                      <Input value={p.title} onChange={(e) => updateProgram(i, 'title', e.target.value)} placeholder="Nikâh töreni" className={inputCls} data-testid={`program-title-${i}`} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeProgram(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="design" className="mt-8 space-y-8">
              <div className="border border-border bg-ivory p-8">
                <Label className="text-[11px] uppercase tracking-[0.2em]">Tasarım</Label>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {templates.map((t) => (
                    <button key={t.slug} type="button" onClick={() => setForm((f) => ({ ...f, template_slug: t.slug, palette: null }))} data-testid={`edit-template-${t.slug}`} className={cn('group border p-2 text-left', form.template_slug === t.slug ? 'border-midnight ring-1 ring-midnight' : 'border-border hover:border-midnight/40')}>
                      <div className="aspect-[3/4] overflow-hidden"><img src={t.cover} alt={t.name} className="h-full w-full object-cover" /></div>
                      <p className="mt-2 truncate font-serif text-sm text-midnight">{t.name}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="border border-border bg-ivory p-8">
                <Label className="text-[11px] uppercase tracking-[0.2em]">Hazır Temalar</Label>
                <p className="mt-1 text-xs text-muted-foreground">Yuvarlak kart temalarından birine dokunun; renkler anında önizlemeye yansır.</p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {THEME_PRESETS.map((t) => {
                    const active = activePreset?.id === t.id
                    return (
                      <button
                        key={t.id} type="button" onClick={() => applyPreset(t)}
                        data-testid={`theme-${t.id}`}
                        className={cn('group overflow-hidden rounded-2xl border p-3 text-left transition-all', active ? 'border-midnight ring-2 ring-midnight/70' : 'border-border hover:border-midnight/40 hover:-translate-y-0.5')}
                      >
                        <div className="flex h-14 w-full items-center justify-center gap-1 rounded-xl" style={{ backgroundColor: t.palette.bg }}>
                          <span className="font-serif text-lg" style={{ color: t.palette.text }}>Aa</span>
                          <span className="ml-1 h-6 w-6 rounded-full" style={{ backgroundColor: t.palette.accent }} />
                        </div>
                        <p className="mt-2 truncate text-[11px] font-medium uppercase tracking-[0.12em] text-midnight">{t.name}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="border border-border bg-ivory p-8">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] uppercase tracking-[0.2em]">Renk Paleti</Label>
                  {form.palette && <Button type="button" variant="ghost" size="sm" onClick={resetPalette} className="text-xs" data-testid="reset-palette"><RotateCcw className="mr-1 h-3.5 w-3.5" /> Tasarım renklerine dön</Button>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{form.palette ? 'Özel renkler kullanılıyor.' : 'Tasarımın varsayılan renkleri kullanılıyor; değiştirmek için bir renge dokunun.'}</p>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {PALETTE_KEYS.map(([k, label]) => (
                    <div key={k} className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={effectivePalette?.[k] || '#000000'} onChange={(e) => setPaletteColor(k, e.target.value)} className="h-11 w-11 cursor-pointer border border-border bg-transparent p-1" aria-label={label} data-testid={`color-${k}`} />
                        <Input value={effectivePalette?.[k] || ''} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setPaletteColor(k, e.target.value)} className={cn(inputCls, 'font-mono text-xs uppercase')} data-testid={`hex-${k}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rsvp" className="mt-8 space-y-6 border border-border bg-ivory p-8">
              <div className="space-y-2 sm:max-w-xs"><Label className="text-[11px] uppercase tracking-[0.2em]">RSVP Son Tarihi</Label><Input type="date" value={form.rsvp_deadline} onChange={set('rsvp_deadline')} className={inputCls} data-testid="edit-deadline" /></div>
              <div>
                <Label className="text-[11px] uppercase tracking-[0.2em]">Menü Seçenekleri</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.menu_options.map((m) => <span key={m} className="flex items-center gap-2 border border-border bg-ivory-50 px-3 py-1.5 text-sm">{m}<button type="button" onClick={() => removeMenu(m)} className="text-muted-foreground hover:text-destructive" aria-label={`${m} sil`}>×</button></span>)}
                </div>
                <div className="mt-3 flex max-w-sm gap-2">
                  <Input value={menuInput} onChange={(e) => setMenuInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMenu() } }} placeholder="Örn. Vegan" className={inputCls} data-testid="menu-input" />
                  <Button type="button" variant="outline" onClick={addMenu} className="h-11 rounded-2xl" data-testid="menu-add">Ekle</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-12">
            <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Canlı Önizleme</p>
            <div className="mx-auto w-full max-w-[340px] [container-type:inline-size]" data-testid="editor-preview">
              <InvitationPreview
                template={previewTemplate}
                names={{ a: form.host_a || 'Elif', b: form.host_b || 'Kaan' }}
                date={formatEventDate(form.date, form.time) || 'Tarih'}
                venue={[form.venue, form.city].filter(Boolean).join(', ') || 'Mekân'}
                greeting={eventType?.greeting}
              />
            </div>
            {form.story && <p className="mx-auto mt-6 max-w-[340px] text-center font-serif text-sm italic text-muted-foreground line-clamp-3">“{form.story}”</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, testid, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-[11px] uppercase tracking-[0.2em]">{label}</Label>
      <Input value={value} onChange={onChange} className={inputCls} data-testid={testid} />
    </div>
  )
}
