'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Upload, Trash2, Mail, Phone, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const inputCls = 'h-11 rounded-2xl border-border bg-ivory-50'
const STATUS = { pending: { label: 'Bekliyor', cls: 'bg-muted text-muted-foreground' }, invited: { label: 'Gönderildi', cls: 'bg-champagne/30 text-midnight' }, responded: { label: 'Yanıtladı', cls: 'bg-sage/30 text-midnight' } }

function normalizeHeader(h) {
  const s = String(h || '').trim().toLowerCase()
  if (/(ad|isim|name)/.test(s)) return 'name'
  if (/(posta|mail)/.test(s)) return 'email'
  if (/(tel|phone|gsm|cep)/.test(s)) return 'phone'
  if (/(grup|group|masa|table)/.test(s)) return 'group'
  return s
}

export function GuestsTab({ projectId, onChanged }) {
  const [items, setItems] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', group: '' })
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef(null)

  const load = useCallback(() => {
    fetch(`/api/projects/${projectId}/guests`, { credentials: 'include', cache: 'no-store' }).then((r) => r.json()).then((d) => setItems(d.items || [])).catch(() => setItems([]))
  }, [projectId])
  useEffect(() => { load() }, [load])

  const addGuest = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/guests`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': window.crypto.randomUUID() }, credentials: 'include', body: JSON.stringify(form) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Eklenemedi')
      toast.success('Davetli eklendi')
      setForm({ name: '', email: '', phone: '', group: '' })
      setOpen(false)
      load(); onChanged?.()
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  const removeGuest = async (gid) => {
    const res = await fetch(`/api/projects/${projectId}/guests/${gid}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) { setItems((l) => l.filter((g) => g.id !== gid)); onChanged?.() } else toast.error('Silinemedi')
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      const rows = raw.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [normalizeHeader(k), v])))
      if (!rows.length) throw new Error('Dosyada satır bulunamadı')
      const res = await fetch(`/api/projects/${projectId}/guests/import`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': window.crypto.randomUUID() }, credentials: 'include', body: JSON.stringify({ rows }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'İçe aktarılamadı')
      toast.success(`${data.imported} davetli eklendi${data.skipped ? `, ${data.skipped} satır atlandı` : ''}`)
      load(); onChanged?.()
    } catch (err) { toast.error(err.message) } finally { setImporting(false); if (fileRef.current) fileRef.current.value = '' }
  }

  return (
    <div data-testid="guests-tab">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground" data-testid="guest-count">{items ? `${items.length} davetli` : 'Yükleniyor…'}</p>
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFile} data-testid="import-file-input" />
          <Button variant="outline" disabled={importing} onClick={() => fileRef.current?.click()} className="h-11 rounded-2xl border-midnight/20 text-[11px] uppercase tracking-[0.18em]" data-testid="import-button"><Upload className="mr-2 h-3.5 w-3.5" /> {importing ? 'Yükleniyor…' : 'CSV / Excel Yükle'}</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="h-11 rounded-2xl bg-midnight text-[11px] uppercase tracking-[0.18em] text-ivory hover:bg-midnight-700" data-testid="add-guest-button"><Plus className="mr-2 h-3.5 w-3.5" /> Davetli Ekle</Button></DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader><DialogTitle className="font-serif text-2xl">Yeni Davetli</DialogTitle><DialogDescription>E-posta veya telefon ekleyin; davetiyenizi toplu gönderimle iletebilirsiniz.</DialogDescription></DialogHeader>
              <form onSubmit={addGuest} className="space-y-4">
                <div className="space-y-2"><Label className="text-[11px] uppercase tracking-[0.2em]">Ad Soyad *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} data-testid="guest-name" /></div>
                <div className="space-y-2"><Label className="text-[11px] uppercase tracking-[0.2em]">E-posta</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} data-testid="guest-email" /></div>
                <div className="space-y-2"><Label className="text-[11px] uppercase tracking-[0.2em]">Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0532 123 45 67" className={inputCls} data-testid="guest-phone" /></div>
                <div className="space-y-2"><Label className="text-[11px] uppercase tracking-[0.2em]">Grup</Label><Input value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} placeholder="Aile, Arkadaşlar, İş…" className={inputCls} data-testid="guest-group" /></div>
                <Button type="submit" disabled={saving} className="h-11 w-full rounded-2xl bg-midnight text-[11px] uppercase tracking-[0.18em] text-ivory hover:bg-midnight-700" data-testid="guest-submit">{saving ? 'Ekleniyor…' : 'Ekle'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><FileSpreadsheet className="h-3.5 w-3.5" /> Dosya sütunları: <span className="font-medium text-midnight">Ad Soyad, E-posta, Telefon, Grup</span> (başlıklar esnek eşleştirilir).</p>

      {items === null ? <Skeleton className="mt-6 h-48 rounded-2xl" /> : items.length === 0 ? (
        <div className="mt-6 border border-dashed border-border bg-ivory-50 px-8 py-16 text-center" data-testid="guests-empty"><p className="font-serif text-2xl text-midnight">Davetli listeniz boş.</p><p className="mt-2 text-sm text-muted-foreground">Tek tek ekleyin ya da CSV/Excel dosyanızı yükleyin.</p></div>
      ) : (
        <div className="mt-6 overflow-x-auto border border-border bg-ivory-50" data-testid="guests-table">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground"><th className="px-5 py-3 font-medium">Davetli</th><th className="px-5 py-3 font-medium">İletişim</th><th className="px-5 py-3 font-medium">Grup</th><th className="px-5 py-3 font-medium">Durum</th><th className="px-5 py-3" /></tr></thead>
            <tbody>
              {items.map((g) => {
                const st = STATUS[g.status] || STATUS.pending
                return (
                  <tr key={g.id} className="border-b border-border/60 last:border-0" data-testid={`guest-row-${g.id}`}>
                    <td className="px-5 py-4 text-midnight">{g.name}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {g.email && <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {g.email}</span>}
                        {g.phone && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {g.phone}</span>}
                        {!g.email && !g.phone && <span>—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{g.group || '—'}</td>
                    <td className="px-5 py-4"><Badge className={`rounded-full border-0 text-[10px] uppercase tracking-[0.15em] hover:${st.cls.split(' ')[0]} ${st.cls}`}>{st.label}</Badge></td>
                    <td className="px-5 py-4 text-right"><Button variant="ghost" size="icon" onClick={() => removeGuest(g.id)} className="text-muted-foreground hover:text-destructive" aria-label="Sil" data-testid={`delete-guest-${g.id}`}><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
