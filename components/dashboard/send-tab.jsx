'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, MessageSquare, Send, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

const TYPE_LABELS = { invitation: 'Davetiye', rsvp: 'RSVP Onayı', reminder: 'Hatırlatma' }

export function SendTab({ projectId, project, onSent }) {
  const [status, setStatus] = useState(null)
  const [guests, setGuests] = useState([])
  const [channel, setChannel] = useState('email')
  const [type, setType] = useState('invitation')
  const [onlyPending, setOnlyPending] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])

  const loadLogs = useCallback(() => {
    fetch(`/api/projects/${projectId}/messages`, { credentials: 'include', cache: 'no-store' }).then((r) => r.json()).then((d) => setLogs(d.items || [])).catch(() => {})
  }, [projectId])

  useEffect(() => {
    fetch('/api/messaging/status').then((r) => r.json()).then(setStatus).catch(() => {})
    fetch(`/api/projects/${projectId}/guests`, { credentials: 'include', cache: 'no-store' }).then((r) => r.json()).then((d) => setGuests(d.items || [])).catch(() => {})
    loadLogs()
  }, [projectId, loadLogs])

  const eligible = guests.filter((g) => (channel === 'email' ? g.email : g.phone) && (!onlyPending || g.status !== 'responded'))
  const configured = status ? status[channel]?.configured : true

  const send = async () => {
    setSending(true)
    setResult(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ channel, type, guest_ids: eligible.map((g) => g.id) }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Gönderim başarısız')
      setResult(data)
      toast.success(`${data.sent} gönderildi${data.failed ? `, ${data.failed} başarısız` : ''}${data.skipped ? `, ${data.skipped} atlandı` : ''}`)
      loadLogs(); onSent?.()
      fetch(`/api/projects/${projectId}/guests`, { credentials: 'include', cache: 'no-store' }).then((r) => r.json()).then((d) => setGuests(d.items || []))
    } catch (e) { toast.error(e.message) } finally { setSending(false) }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12" data-testid="send-tab">
      <div className="lg:col-span-5">
        <div className="border border-border bg-ivory p-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-champagne-dark">Kanal</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[{ id: 'email', label: 'E-posta', icon: Mail }, { id: 'sms', label: 'SMS', icon: MessageSquare }].map((c) => (
              <button key={c.id} type="button" onClick={() => setChannel(c.id)} data-testid={`send-channel-${c.id}`} className={cn('flex items-center justify-center gap-2 border px-4 py-3 text-[11px] uppercase tracking-[0.18em] transition-colors', channel === c.id ? 'border-midnight bg-midnight text-ivory' : 'border-border text-midnight/70 hover:border-midnight/40')}>
                <c.icon className="h-4 w-4" /> {c.label}
                <span className={cn('ml-1 h-1.5 w-1.5 rounded-full', status?.[c.id]?.configured ? 'bg-sage' : 'bg-destructive')} />
              </button>
            ))}
          </div>
          {!configured && <p className="mt-3 text-xs text-destructive" data-testid="send-not-configured">{channel === 'sms' ? 'SMS kanalı henüz yapılandırılmadı (Twilio kimlik bilgileri bekleniyor).' : 'E-posta kanalı yapılandırılmadı.'}</p>}

          <p className="mt-8 text-[11px] uppercase tracking-[0.3em] text-champagne-dark">Mesaj Türü</p>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="mt-3 h-11 rounded-2xl border-border bg-ivory-50" data-testid="send-type"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(TYPE_LABELS).filter(([k]) => k !== 'rsvp').map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>

          <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm text-midnight">
            <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} className="h-4 w-4 accent-[#101827]" data-testid="only-pending" />
            Yanıt vermiş davetlileri atla
          </label>

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">Alıcı sayısı</p>
            <p className="mt-1 font-serif text-4xl text-midnight" data-testid="eligible-count">{eligible.length} <span className="text-base text-muted-foreground">/ {guests.length}</span></p>
            <p className="mt-1 text-xs text-muted-foreground">{channel === 'email' ? 'E-posta adresi olan davetliler' : 'Telefon numarası olan davetliler'}</p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={sending || !configured || !eligible.length || !project?.published} className="mt-6 h-12 w-full rounded-2xl bg-champagne text-[12px] uppercase tracking-[0.2em] text-midnight hover:bg-champagne-light" data-testid="bulk-send-button"><Send className="mr-2 h-4 w-4" /> {sending ? 'Gönderiliyor…' : `${eligible.length} Kişiye Gönder`}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader><AlertDialogTitle className="font-serif text-2xl">{TYPE_LABELS[type]} gönderilsin mi?</AlertDialogTitle><AlertDialogDescription>{eligible.length} davetliye {channel === 'email' ? 'e-posta' : 'SMS'} gönderilecek. Gönderim birkaç saniye sürebilir.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel className="rounded-2xl">Vazgeç</AlertDialogCancel><AlertDialogAction onClick={send} className="rounded-2xl bg-midnight text-ivory hover:bg-midnight-700" data-testid="confirm-bulk-send">Gönder</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {!project?.published && <p className="mt-3 text-xs text-muted-foreground">Gönderim için davetiyenin yayında olması gerekir.</p>}
        </div>

        {result && (
          <div className="mt-6 border border-border bg-ivory-50 p-6" data-testid="send-result">
            <p className="text-[11px] uppercase tracking-[0.3em] text-champagne-dark">Sonuç</p>
            <div className="mt-3 flex gap-6 text-sm">
              <span className="flex items-center gap-1.5 text-midnight"><CheckCircle2 className="h-4 w-4 text-sage" /> {result.sent} gönderildi</span>
              <span className="flex items-center gap-1.5 text-midnight"><XCircle className="h-4 w-4 text-destructive" /> {result.failed} başarısız</span>
              <span className="flex items-center gap-1.5 text-midnight"><MinusCircle className="h-4 w-4 text-muted-foreground" /> {result.skipped} atlandı</span>
            </div>
            {result.results?.some((r) => r.error) && (
              <ul className="mt-4 space-y-1 text-xs text-destructive">{result.results.filter((r) => r.error).slice(0, 5).map((r) => <li key={r.guest_id}>{r.name}: {r.error}</li>)}</ul>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-7">
        <p className="text-[11px] uppercase tracking-[0.3em] text-champagne-dark">Gönderim Geçmişi</p>
        <div className="mt-3 divide-y divide-border border border-border bg-ivory-50" data-testid="send-logs">
          {logs.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted-foreground">Henüz gönderim yapılmadı.</p>}
          {logs.map((l) => (
            <div key={l.id} className="flex items-start gap-4 px-5 py-4 text-sm">
              {l.status === 'failed' ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full text-[10px] uppercase tracking-[0.15em]">{l.channel === 'email' ? 'E-posta' : 'SMS'}</Badge>
                  <Badge variant="outline" className="rounded-full text-[10px] uppercase tracking-[0.15em]">{TYPE_LABELS[l.type] || l.type}</Badge>
                  <span className="text-midnight">{l.guest_name}</span>
                  <span className="truncate text-muted-foreground">{l.to}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString('tr-TR')} · {l.status}{l.error && <span className="text-destructive"> · {l.error}</span>}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
