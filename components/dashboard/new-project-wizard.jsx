'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InvitationPreview } from '@/components/shared/invitation-preview'
import { EVENT_TYPES } from '@/lib/data/events'
import { formatEventDate } from '@/lib/projects'
import { cn } from '@/lib/utils'
import { PageHeader } from './projects-list'
import { StoryTemplatesModal } from './story-templates-modal'

const STEPS = ['Etkinlik Türü', 'Detaylar', 'Tasarım', 'Özet']
const inputCls = 'h-11 rounded-2xl border-border bg-ivory-50'

export function NewProjectWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [templates, setTemplates] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    event_type: 'dugun', host_a: '', host_b: '', date: '', time: '19:00', venue: '', address: '', city: '', story: '',
    template_slug: searchParams.get('tasarim') || '', rsvp_deadline: '',
  })

  useEffect(() => {
    fetch('/api/templates').then((r) => r.json()).then((d) => setTemplates(d.items || [])).catch(() => {})
  }, [])

  const filteredTemplates = useMemo(() => {
    const inCat = templates.filter((t) => t.category === form.event_type)
    return inCat.length ? [...inCat, ...templates.filter((t) => t.category !== form.event_type)] : templates
  }, [templates, form.event_type])

  const selectedTemplate = templates.find((t) => t.slug === form.template_slug)
  const eventType = EVENT_TYPES.find((e) => e.id === form.event_type)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const canNext = step === 0 ? Boolean(form.event_type) : step === 1 ? Boolean(form.host_a && form.date) : step === 2 ? Boolean(form.template_slug) : true

  const submit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Etkinlik oluşturulamadı')
      toast.success('Etkinliğiniz oluşturuldu ve yayında!')
      router.replace(`/panel/etkinlik/${data.project.id}`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div data-testid="new-project-wizard">
      <PageHeader eyebrow="Yeni Etkinlik" title="Davetiyenizi oluşturalım." description="Dört kısa adım; ardından davetiyeniz yayında." />

      <ol className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
        {STEPS.map((s, i) => (
          <li key={s} className={cn('flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]', i === step ? 'text-midnight' : i < step ? 'text-champagne-dark' : 'text-muted-foreground')}>
            <span className={cn('flex h-7 w-7 items-center justify-center border font-serif text-sm', i === step ? 'border-midnight bg-midnight text-ivory' : i < step ? 'border-champagne bg-champagne text-midnight' : 'border-border')}>{i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2" data-testid="step-event-type">
              {EVENT_TYPES.map((e) => (
                <button key={e.id} type="button" onClick={() => setForm((f) => ({ ...f, event_type: e.id }))} data-testid={`event-type-${e.id}`}
                  className={cn('border p-6 text-left transition-all duration-300', form.event_type === e.id ? 'border-midnight bg-midnight text-ivory' : 'border-border bg-ivory-50 hover:border-midnight/40')}>
                  <p className="font-serif text-2xl">{e.label}</p>
                  <p className={cn('mt-1 text-sm', form.event_type === e.id ? 'text-ivory/70' : 'text-muted-foreground')}>{e.description}</p>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 border border-border bg-ivory p-8" data-testid="step-details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={form.event_type === 'kurumsal' ? 'Kurum / Ev Sahibi' : 'Ev Sahibi 1'} value={form.host_a} onChange={set('host_a')} testid="host-a" required />
                <Field label={form.event_type === 'kurumsal' ? 'Etkinlik Adı' : 'Ev Sahibi 2'} value={form.host_b} onChange={set('host_b')} testid="host-b" />
                <div className="space-y-2"><Label className="text-[11px] uppercase tracking-[0.2em]">Tarih *</Label><Input type="date" value={form.date} onChange={set('date')} className={inputCls} data-testid="event-date" /></div>
                <div className="space-y-2"><Label className="text-[11px] uppercase tracking-[0.2em]">Saat</Label><Input type="time" value={form.time} onChange={set('time')} className={inputCls} data-testid="event-time" /></div>
                <Field label="Mekân" value={form.venue} onChange={set('venue')} testid="venue" />
                <Field label="Şehir" value={form.city} onChange={set('city')} testid="city" />
                <Field label="Adres" value={form.address} onChange={set('address')} testid="address" className="sm:col-span-2" />
                <div className="space-y-2"><Label className="text-[11px] uppercase tracking-[0.2em]">RSVP Son Tarihi</Label><Input type="date" value={form.rsvp_deadline} onChange={set('rsvp_deadline')} className={inputCls} data-testid="rsvp-deadline" /></div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] uppercase tracking-[0.2em]">Hikâyeniz (isteğe bağlı)</Label>
                  <StoryTemplatesModal onSelect={(content) => setForm((f) => ({ ...f, story: content }))} />
                </div>
                <Textarea value={form.story} onChange={set('story')} rows={4} placeholder="Nasıl tanıştınız, bu gün sizin için ne ifade ediyor…" className="rounded-2xl border-border bg-ivory-50" data-testid="story" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="step-template">
              {filteredTemplates.map((t) => (
                <button key={t.slug} type="button" onClick={() => setForm((f) => ({ ...f, template_slug: t.slug }))} data-testid={`pick-template-${t.slug}`}
                  className={cn('group border p-3 text-left transition-all duration-300', form.template_slug === t.slug ? 'border-midnight ring-1 ring-midnight' : 'border-border hover:border-midnight/40')}>
                  <div className="aspect-[3/4] overflow-hidden"><img src={t.cover} alt={t.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-serif text-lg text-midnight">{t.name}</p>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t.tier === 'premium' ? 'Premium' : 'Ücretsiz'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="border border-border bg-ivory p-8" data-testid="step-summary">
              <p className="text-[11px] uppercase tracking-[0.3em] text-champagne-dark">Özet</p>
              <h2 className="mt-3 font-serif text-4xl text-midnight">{[form.host_a, form.host_b].filter(Boolean).join(' & ')}</h2>
              <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Row k="Etkinlik" v={eventType?.label} />
                <Row k="Tarih" v={formatEventDate(form.date, form.time)} />
                <Row k="Mekân" v={[form.venue, form.city].filter(Boolean).join(', ') || '—'} />
                <Row k="Tasarım" v={selectedTemplate?.name} />
              </dl>
              <p className="mt-8 text-sm text-muted-foreground">Oluşturduğunuzda davetiyeniz hemen yayınlanır; tüm detayları daha sonra düzenleyebilirsiniz.</p>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="rounded-2xl text-[12px] uppercase tracking-[0.2em]" data-testid="wizard-back"><ArrowLeft className="mr-2 h-4 w-4" /> Geri</Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)} className="h-12 rounded-2xl bg-midnight px-8 text-[12px] uppercase tracking-[0.2em] text-ivory hover:bg-midnight-700" data-testid="wizard-next">Devam <ArrowRight className="ml-2 h-4 w-4" /></Button>
            ) : (
              <Button type="button" disabled={saving} onClick={submit} className="h-12 rounded-2xl bg-champagne px-8 text-[12px] uppercase tracking-[0.2em] text-midnight hover:bg-champagne-light" data-testid="wizard-submit">{saving ? 'Oluşturuluyor…' : 'Oluştur ve Yayınla'}</Button>
            )}
          </div>
        </div>

        <div className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-12">
            <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Canlı Önizleme</p>
            <div className="mx-auto w-[320px] [container-type:inline-size]">
              <InvitationPreview
                template={selectedTemplate}
                names={{ a: form.host_a || 'Elif', b: form.host_b || 'Kaan' }}
                date={formatEventDate(form.date, form.time) || '14 Eylül 2025'}
                venue={[form.venue, form.city].filter(Boolean).join(', ') || 'Mekân bilgisi'}
                greeting={eventType?.greeting}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, testid, className, required }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-[11px] uppercase tracking-[0.2em]">{label}{required && ' *'}</Label>
      <Input value={value} onChange={onChange} className={inputCls} data-testid={testid} />
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{k}</dt>
      <dd className="mt-1 text-midnight">{v || '—'}</dd>
    </div>
  )
}
