'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, MessageSquare, RefreshCw, Send, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const TYPE_LABELS = { invitation: 'Davetiye', rsvp: 'RSVP Onayı', reminder: 'Hatırlatma' }

const DEFAULTS = {
  guestName: 'Ayşe Demir',
  hosts: 'Elif & Kaan',
  eventTitle: 'Elif & Kaan’ın Düğünü',
  eventDate: '14 Eylül 2025, 19:00',
  venue: 'Four Seasons Bosphorus, İstanbul',
  invitationUrl: '',
}

const inputCls = 'h-11 rounded-none border-border bg-ivory-50'

export function MessagingTester() {
  const [status, setStatus] = useState(null)
  const [channel, setChannel] = useState('email')
  const [type, setType] = useState('invitation')
  const [to, setTo] = useState('')
  const [form, setForm] = useState(DEFAULTS)
  const [preview, setPreview] = useState(null)
  const [sending, setSending] = useState(false)
  const [logs, setLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && !form.invitationUrl) {
      setForm((f) => ({ ...f, invitationUrl: `${window.location.origin}/d/elif-kaan` }))
    }
  }, [])

  const loadStatus = useCallback(() => {
    fetch('/api/messaging/status').then((r) => r.json()).then(setStatus).catch(() => setStatus(null))
  }, [])

  const loadLogs = useCallback(() => {
    setLoadingLogs(true)
    fetch('/api/messaging/logs?limit=15').then((r) => r.json()).then((d) => setLogs(d?.items || [])).catch(() => {}).finally(() => setLoadingLogs(false))
  }, [])

  useEffect(() => { loadStatus(); loadLogs() }, [loadStatus, loadLogs])

  useEffect(() => {
    const controller = new AbortController()
    const t = setTimeout(() => {
      fetch('/api/messaging/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel, type, ...form }), signal: controller.signal })
        .then((r) => r.json()).then(setPreview).catch(() => {})
    }, 250)
    return () => { clearTimeout(t); controller.abort() }
  }, [channel, type, form])

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSend = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/messaging/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, type, to, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Gönderim başarısız')
      toast.success(channel === 'email' ? 'E-posta gönderildi.' : `SMS kuyruğa alındı (${data.message?.status}).`)
      loadLogs()
    } catch (err) {
      toast.error(err.message)
      loadLogs()
    } finally {
      setSending(false)
    }
  }

  const channelConfigured = status ? status[channel]?.configured : true

  return (
    <div className="grid gap-10 lg:grid-cols-12" data-testid="messaging-tester">
      <div className="lg:col-span-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatusCard icon={Mail} label="Resend E-posta" data={status?.email} testid="status-email" />
          <StatusCard icon={MessageSquare} label="Twilio SMS" data={status?.sms} testid="status-sms" />
        </div>

        <form onSubmit={onSend} className="mt-8 space-y-6 border border-border bg-ivory p-8">
          <Tabs value={channel} onValueChange={setChannel}>
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-none bg-ivory-200 p-1">
              <TabsTrigger value="email" className="rounded-none text-[11px] uppercase tracking-[0.2em] data-[state=active]:bg-midnight data-[state=active]:text-ivory" data-testid="channel-email">E-posta</TabsTrigger>
              <TabsTrigger value="sms" className="rounded-none text-[11px] uppercase tracking-[0.2em] data-[state=active]:bg-midnight data-[state=active]:text-ivory" data-testid="channel-sms">SMS</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-[0.2em]">Mesaj Türü</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className={inputCls} data-testid="message-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to" className="text-[11px] uppercase tracking-[0.2em]">{channel === 'email' ? 'Alıcı E-posta' : 'Alıcı Telefon (+90)'}</Label>
            <Input id="to" required value={to} onChange={(e) => setTo(e.target.value)} placeholder={channel === 'email' ? 'misafir@ornek.com' : '0532 123 45 67'} className={inputCls} data-testid="recipient" />
            {channel === 'email' && status?.email?.sender?.includes('resend.dev') && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">Test göndericisi (onboarding@resend.dev) kullanılıyor: yalnızca Resend hesabınızın e-postasına gönderim yapılabilir. Kendi alan adınızı doğruladiğınızda bu kısıt kalkar.</p>
            )}
            {channel === 'sms' && <p className="text-[11px] text-muted-foreground">Deneme (trial) hesaplarda yalnızca Twilio’da doğrulanmış numaralara SMS gider.</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Davetli Adı" value={form.guestName} onChange={update('guestName')} testid="guest-name" />
            <Field label="Ev Sahipleri" value={form.hosts} onChange={update('hosts')} testid="hosts" />
            <Field label="Etkinlik" value={form.eventTitle} onChange={update('eventTitle')} testid="event-title" className="sm:col-span-2" />
            <Field label="Tarih" value={form.eventDate} onChange={update('eventDate')} testid="event-date" />
            <Field label="Mekân" value={form.venue} onChange={update('venue')} testid="venue" />
            <Field label="Davetiye Bağlantısı" value={form.invitationUrl} onChange={update('invitationUrl')} testid="invitation-url" className="sm:col-span-2" />
          </div>

          <Button type="submit" disabled={sending || !channelConfigured} className="h-12 w-full rounded-none bg-midnight text-[12px] uppercase tracking-[0.2em] text-ivory hover:bg-midnight-700" data-testid="send-button">
            {sending ? 'Gönderiliyor…' : <><Send className="mr-2 h-4 w-4" /> {channel === 'email' ? 'Test E-postası Gönder' : 'Test SMS Gönder'}</>}
          </Button>
          {!channelConfigured && <p className="text-center text-xs text-destructive" data-testid="not-configured">Bu kanal henüz yapılandırılmadı. .env dosyasına kimlik bilgilerini ekleyin.</p>}
        </form>
      </div>

      <div className="lg:col-span-7">
        <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-champagne-dark">Canlı Önizleme</p>
        {channel === 'email' ? (
          <div className="border border-border bg-ivory-50">
            <div className="border-b border-border px-5 py-3 text-sm"><span className="text-muted-foreground">Konu:</span> <span className="font-medium text-midnight" data-testid="preview-subject">{preview?.subject || '…'}</span></div>
            <iframe title="E-posta önizleme" srcDoc={preview?.html || ''} className="h-[620px] w-full bg-ivory" data-testid="preview-email" />
          </div>
        ) : (
          <div className="flex justify-center border border-border bg-ivory-50 py-16">
            <div className="w-[300px] rounded-[2rem] border-8 border-midnight bg-ivory p-5 shadow-2xl">
              <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">MOMENTIS</p>
              <div className="mt-6 rounded-2xl rounded-tl-sm bg-ivory-200 p-4 text-sm leading-relaxed text-midnight" data-testid="preview-sms">{preview?.body || '…'}</div>
              <p className="mt-2 text-right text-[10px] text-muted-foreground">{(preview?.body || '').length} karakter</p>
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.3em] text-champagne-dark">Son Gönderimler</p>
          <Button variant="ghost" size="sm" onClick={loadLogs} className="text-xs" data-testid="refresh-logs"><RefreshCw className={cn('mr-2 h-3.5 w-3.5', loadingLogs && 'animate-spin')} /> Yenile</Button>
        </div>
        <div className="mt-3 divide-y divide-border border border-border bg-ivory-50" data-testid="message-logs">
          {logs.length === 0 && <p className="px-5 py-8 text-center text-sm text-muted-foreground">Henüz gönderim yok.</p>}
          {logs.map((l) => (
            <div key={l.id} className="flex items-start gap-4 px-5 py-4 text-sm">
              {l.status === 'failed' ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> : l.status === 'sent' || l.status === 'delivered' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage" /> : <Clock className="mt-0.5 h-4 w-4 shrink-0 text-champagne" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-[0.15em]">{l.channel === 'email' ? 'E-posta' : 'SMS'}</Badge>
                  <Badge variant="outline" className="rounded-none text-[10px] uppercase tracking-[0.15em]">{TYPE_LABELS[l.type] || l.type}</Badge>
                  <span className="truncate text-midnight">{l.to}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString('tr-TR')} · {l.status}{l.provider_id ? ` · ${l.provider_id}` : ''}
                  {l.error && <span className="text-destructive"> · {l.error}</span>}
                </p>
              </div>
            </div>
          ))}
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

function StatusCard({ icon: Icon, label, data, testid }) {
  const ok = data?.configured
  return (
    <div className="border border-border bg-ivory-50 p-5" data-testid={testid}>
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-champagne-dark" strokeWidth={1.5} />
        <span className={cn('h-2 w-2 rounded-full', data == null ? 'bg-muted-foreground/40' : ok ? 'bg-sage' : 'bg-destructive')} />
      </div>
      <p className="mt-4 text-sm font-medium text-midnight">{label}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{data == null ? 'Kontrol ediliyor…' : ok ? data.sender : 'Yapılandırılmadı'}</p>
    </div>
  )
}
