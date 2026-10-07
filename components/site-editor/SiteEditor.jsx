'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Eye, GripVertical, Palette, Plus, Save, Smartphone, Tablet, Monitor, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { THEME_PRESETS } from '@/lib/data/themes'
import { createSection, createSiteConfig } from '@/lib/site-editor'
import { SiteRenderer } from './SiteRenderer'

const labels = { hero:'Hero / Kapak', story:'Hikâyemiz', event:'Etkinlik', location:'Konum & Harita', gallery:'Fotoğraf Galerisi', countdown:'Geri Sayım', rsvp:'RSVP', music:'Müzik', gift:'Hediye', footer:'Alt Bilgi' }
const types = Object.keys(labels)

export function SiteEditor({ project, templates }) {
  const template = templates.find((t) => t.slug === project.template_slug) || templates[0]
  const [config, setConfig] = useState(() => project.site_config || createSiteConfig(project, template))
  const [selectedId, setSelectedId] = useState(config.sections[0]?.id || null)
  const [device, setDevice] = useState('desktop')
  const [saving, setSaving] = useState(false)
  const selected = config.sections.find((s) => s.id === selectedId)

  const updateSelected = (patch) => setConfig((c) => ({ ...c, sections: c.sections.map((s) => s.id === selectedId ? { ...s, ...patch } : s) }))
  const updateProps = (patch) => updateSelected({ props: { ...(selected?.props || {}), ...patch } })
  const move = (direction) => setConfig((c) => {
    const i = c.sections.findIndex((s) => s.id === selectedId)
    const j = direction === 'up' ? i - 1 : i + 1
    if (i < 0 || j < 0 || j >= c.sections.length) return c
    const sections = [...c.sections]; [sections[i], sections[j]] = [sections[j], sections[i]]
    return { ...c, sections }
  })
  const add = (type) => {
    const section = createSection(type, project)
    setConfig((c) => ({ ...c, sections: [...c.sections, section] }))
    setSelectedId(section.id)
  }
  const remove = () => {
    if (!selected) return
    setConfig((c) => ({ ...c, sections: c.sections.filter((s) => s.id !== selectedId) }))
    setSelectedId(null)
  }
  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/projects/' + project.id, { method:'PATCH', headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify({ site_config: config }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Kaydedilemedi')
      setConfig(data.project.site_config || config)
      toast.success('Site tasarımı kaydedildi')
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }
  const applyTheme = (theme) => setConfig((c) => ({ ...c, theme: { ...c.theme, palette: theme.palette } }))
  const setPalette = (key, value) => setConfig((c) => ({ ...c, theme: { ...c.theme, palette: { ...c.theme.palette, [key]: value } } }))

  return <div className="fixed inset-0 z-40 flex min-h-0 bg-[#e9e4d9] text-midnight" data-testid="site-editor">
    <aside className="flex w-[300px] shrink-0 flex-col border-r border-border bg-ivory">
      <div className="flex items-center justify-between border-b p-4">
        <div><p className="text-[9px] uppercase tracking-[0.25em] text-champagne-dark">MOMENTIS · Site Editor</p><h1 className="mt-1 font-serif text-xl">{project.host_a} & {project.host_b || '...'}</h1></div>
        <Button size="icon" variant="ghost" onClick={() => history.back()}><X className="h-4 w-4"/></Button>
      </div>
      <div className="border-b p-3"><Button className="h-10 w-full rounded-xl bg-midnight text-ivory" onClick={() => document.getElementById('site-add-section')?.scrollIntoView({block:'center'})}><Plus className="mr-2 h-4 w-4"/> Bölüm ekle</Button></div>
      <div className="flex-1 overflow-y-auto p-3">
        <p className="px-2 pb-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Sayfa yapısı</p>
        {config.sections.map((s, i) => <div key={s.id} onClick={() => setSelectedId(s.id)} className={'mb-1 flex cursor-pointer items-center gap-2 rounded-xl border px-2 py-2.5 ' + (selectedId === s.id ? 'border-midnight bg-midnight text-ivory' : 'border-transparent hover:bg-ivory-50')}><GripVertical className="h-3.5 w-3.5 opacity-40"/><span className="flex-1 text-xs">{labels[s.type]}</span><span className="text-[9px] opacity-50">{i+1}</span></div>)}
        <div id="site-add-section" className="mt-4 border-t pt-4"><p className="px-2 pb-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Yeni bölüm</p><div className="grid grid-cols-2 gap-2">{types.map(type => <button key={type} onClick={() => add(type)} className="rounded-lg border border-border bg-ivory-50 px-2 py-2 text-left text-[10px] hover:border-midnight/40">{labels[type]}</button>)}</div></div>
      </div>
      <div className="border-t p-3"><Button onClick={save} disabled={saving} className="h-10 w-full rounded-xl bg-champagne text-midnight hover:bg-champagne-light"><Save className="mr-2 h-4 w-4"/>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Button></div>
    </aside>

    <main className="min-w-0 flex-1 overflow-hidden">
      <div className="flex h-14 items-center justify-between border-b border-border bg-ivory/90 px-4 backdrop-blur">
        <div className="flex items-center gap-1 rounded-full border p-1">{[['mobile',Smartphone],['tablet',Tablet],['desktop',Monitor]].map(([key,Icon]) => <Button key={key} variant="ghost" size="sm" onClick={() => setDevice(key)} className={'h-7 rounded-full px-3 text-[9px] uppercase ' + (device === key ? 'bg-midnight text-ivory' : '')}><Icon className="mr-1.5 h-3 w-3"/>{key}</Button>)}</div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Canlı önizleme · {template?.name || 'Şablon'}</div>
        <Button variant="outline" size="sm" onClick={() => window.open('/d/' + project.slug, '_blank')}><Eye className="mr-1.5 h-3.5 w-3.5"/> Yayında gör</Button>
      </div>
      <div className="h-[calc(100%-3.5rem)] overflow-auto p-5"><div className="mx-auto min-h-full overflow-hidden bg-white shadow-2xl" style={{width:device==='mobile'?390:device==='tablet'?720:'100%',maxWidth:'100%'}}><SiteRenderer project={project} config={config} preview /></div></div>
    </main>

    <aside className="w-[320px] shrink-0 overflow-y-auto border-l border-border bg-ivory p-4">
      {selected ? <><div className="flex items-center justify-between"><div><p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Bölüm ayarları</p><h2 className="mt-1 font-serif text-xl">{labels[selected.type]}</h2></div><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => move('up')}><ArrowUp className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={() => move('down')}><ArrowDown className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={remove} className="text-destructive"><Trash2 className="h-4 w-4"/></Button></div></div>
        <div className="mt-5 space-y-4">
          {selected.type === 'hero' && <><Field label="Üst başlık" value={selected.props.eyebrow} onChange={v => updateProps({eyebrow:v})}/><Field label="Ana başlık" value={selected.props.title} onChange={v => updateProps({title:v})}/><Field label="Alt metin" value={selected.props.subtitle} onChange={v => updateProps({subtitle:v})}/></>}
          {selected.type === 'story' && <><Field label="Etiket" value={selected.props.label} onChange={v => updateProps({label:v})}/><Field label="Başlık" value={selected.props.title} onChange={v => updateProps({title:v})}/><Field label="Hikâye" value={selected.props.body} multiline onChange={v => updateProps({body:v})}/></>}
          {['event','location','gallery','countdown','rsvp','music','gift','footer'].includes(selected.type) && <Field label="Bölüm başlığı" value={selected.props.title || ''} onChange={v => updateProps({title:v})}/>}
          {selected.type === 'event' && <div className="flex items-center justify-between rounded-xl border p-3"><Label className="text-xs">Aileleri göster</Label><Switch checked={selected.props.showFamilies !== false} onCheckedChange={v => updateProps({showFamilies:v})}/></div>}
          {selected.type === 'countdown' && <div className="flex items-center justify-between rounded-xl border p-3"><Label className="text-xs">Geri sayımı göster</Label><Switch checked={selected.props.enabled !== false} onCheckedChange={v => updateProps({enabled:v})}/></div>}
          {selected.type === 'gallery' && <p className="text-[10px] leading-relaxed text-muted-foreground">Galeri medya kütüphanesine bağlanacak. Şimdilik hero görseli önizlemede kullanılabilir.</p>}
        </div>
      </> : <div className="py-10 text-center text-sm text-muted-foreground">Düzenlemek için soldan bir bölüm seçin.</div>}
      <div className="mt-8 border-t pt-5"><div className="flex items-center gap-2"><Palette className="h-4 w-4"/><h3 className="text-xs font-medium">Site teması</h3></div><div className="mt-3 grid grid-cols-2 gap-2">{THEME_PRESETS.slice(0,8).map(t => <button key={t.id} onClick={() => applyTheme(t)} className="rounded-xl border p-2 text-left hover:border-midnight/40"><span className="mb-1 block h-5 rounded-md" style={{background:t.palette.bg,border:'1px solid '+t.palette.accent}}/><span className="text-[9px]">{t.name}</span></button>)}</div><div className="mt-4 grid grid-cols-2 gap-2">{Object.entries(config.theme.palette).map(([key,value]) => <div key={key} className="space-y-1"><Label className="text-[9px] uppercase">{key}</Label><Input value={value} onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setPalette(key,e.target.value)} className="h-8 font-mono text-[10px]"/></div>)}</div><div className="mt-4"><Label className="text-[9px] uppercase">Yazı tipi</Label><Select value={config.theme.font} onValueChange={font => setConfig(c => ({...c,theme:{...c.theme,font}}))}><SelectTrigger className="mt-1 h-9"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="playfair">Playfair Display</SelectItem><SelectItem value="dm-sans">DM Sans</SelectItem><SelectItem value="georgia">Georgia</SelectItem></SelectContent></Select></div></div>
    </aside>
  </div>
}
function Field({label,value,onChange,multiline=false}){return <div className="space-y-1.5"><Label className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>{multiline?<textarea value={value||''} onChange={e=>onChange(e.target.value)} className="min-h-28 w-full rounded-xl border border-border bg-ivory-50 p-3 text-xs outline-none focus:border-midnight"/>:<Input value={value||''} onChange={e=>onChange(e.target.value)} className="h-9 rounded-xl bg-ivory-50 text-xs"/>}</div>}
