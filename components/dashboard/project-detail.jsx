'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Copy, ExternalLink, Users, MailCheck, UserX, Send, Trash2, Eye, EyeOff, Pencil, QrCode } from 'lucide-react'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DavetiyeCanvasPreview } from '@/components/shared/davetiye-canvas-preview'
import { getEventType } from '@/lib/data/events'
import { formatEventDate } from '@/lib/projects'
import { GuestsTab } from './guests-tab'
import { SendTab } from './send-tab'
import { AlbumTab } from './album-tab'

const tabCls = 'rounded-2xl border-b-2 border-transparent px-0 pb-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground data-[state=active]:border-midnight data-[state=active]:bg-transparent data-[state=active]:text-midnight data-[state=active]:shadow-none'

export function ProjectDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [qrCodeData, setQrCodeData] = useState(null)
  const [qrCodeTitle, setQrCodeTitle] = useState('')

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`, { credentials: 'include', cache: 'no-store' })
    if (res.status === 404) { setNotFound(true); return }
    const data = await res.json().catch(() => ({}))
    if (data.project) setProject(data.project)
  }, [id])

  useEffect(() => { load() }, [load])

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(project.url); toast.success('Bağlantı kopyalandı') } catch { toast.error('Kopyalanamadı') }
  }

  const generateQr = async (url, title) => {
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } })
      setQrCodeData(dataUrl)
      setQrCodeTitle(title)
    } catch (err) {
      toast.error('QR Kod oluşturulamadı')
    }
  }

  const togglePublish = async () => {
    const res = await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ published: !project.published }) })
    const data = await res.json().catch(() => ({}))
    if (res.ok) { setProject(data.project); toast.success(data.project.published ? 'Davetiye yayınlandı' : 'Davetiye yayından kaldırıldı') } else toast.error(data?.error || 'Hata')
  }

  const remove = async () => {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) { toast.success('Etkinlik silindi'); router.replace('/panel') } else toast.error('Silinemedi')
  }

  if (notFound) {
    return <div className="py-24 text-center"><p className="font-serif text-3xl text-midnight">Etkinlik bulunamadı.</p><Link href="/panel" className="mt-6 inline-block border-b border-midnight text-sm">Panele dön</Link></div>
  }
  if (!project) return <div className="space-y-6"><Skeleton className="h-12 w-1/2 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>

  const type = getEventType(project.event_type)
  const s = project.stats || {}

  return (
    <div data-testid="project-detail">
      <Link href="/panel" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-midnight"><ArrowLeft className="h-3.5 w-3.5" /> Etkinliklerim</Link>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full border-midnight/20 text-[10px] uppercase tracking-[0.2em]">{type?.label}</Badge>
            <Badge className={project.published ? 'rounded-full border-0 bg-sage/30 text-[10px] uppercase tracking-[0.2em] text-midnight hover:bg-sage/30' : 'rounded-2xl border-0 bg-muted text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted'} data-testid="publish-badge">{project.published ? 'Yayında' : 'Taslak'}</Badge>
          </div>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-midnight md:text-5xl" data-testid="project-title">{[project.host_a, project.host_b].filter(Boolean).join(' & ')}</h1>
          <p className="mt-2 text-muted-foreground">{formatEventDate(project.date, project.time)}{project.venue ? ` · ${project.venue}` : ''}{project.city ? `, ${project.city}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="h-11 rounded-2xl border-midnight/20 text-[11px] uppercase tracking-[0.18em]">
            <Link href={`/panel/etkinlik/${id}/duzenle`} data-testid="edit-project"><Pencil className="mr-2 h-3.5 w-3.5" /> Düzenle</Link>
          </Button>
          <Button variant="outline" onClick={copyLink} className="h-11 rounded-2xl border-midnight/20 text-[11px] uppercase tracking-[0.18em]" data-testid="copy-link"><Copy className="mr-2 h-3.5 w-3.5" /> Site Bağlantısını Kopyala</Button>
          <Button variant="outline" onClick={() => generateQr(project.url, 'Davetiye Sitesi QR Kodu')} className="h-11 rounded-2xl border-midnight/20 text-[11px] uppercase tracking-[0.18em]" data-testid="qr-site"><QrCode className="mr-2 h-3.5 w-3.5" /> Site QR</Button>
          <Button asChild variant="outline" className="h-11 rounded-2xl border-midnight/20 text-[11px] uppercase tracking-[0.18em]">
            <a href={`/d/${project.slug}`} target="_blank" rel="noreferrer" data-testid="open-site"><ExternalLink className="mr-2 h-3.5 w-3.5" /> Siteyi Aç</a>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-11 rounded-2xl border-midnight/20 text-[11px] uppercase tracking-[0.18em] bg-champagne text-midnight hover:bg-champagne-light">
                <Eye className="mr-2 h-3.5 w-3.5" /> Davetiye Kartını Gör
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl bg-ivory rounded-2xl p-0 overflow-hidden border-0">
               <DialogTitle className="sr-only">Davetiye Kartı</DialogTitle>
               <DavetiyeCanvasPreview project={project} />
            </DialogContent>
          </Dialog>
          <Button onClick={togglePublish} className="h-11 rounded-2xl bg-midnight text-[11px] uppercase tracking-[0.18em] text-ivory hover:bg-midnight-700" data-testid="toggle-publish">{project.published ? <><EyeOff className="mr-2 h-3.5 w-3.5" /> Yayından Kaldır</> : <><Eye className="mr-2 h-3.5 w-3.5" /> Yayınla</>}</Button>
        </div>
      </div>

      <AlertDialog open={!!qrCodeData} onOpenChange={(open) => !open && setQrCodeData(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm text-center">
          <AlertDialogHeader><AlertDialogTitle className="font-serif text-2xl text-center">{qrCodeTitle}</AlertDialogTitle></AlertDialogHeader>
          <div className="flex justify-center p-4">
            {qrCodeData && <img src={qrCodeData} alt="QR Code" className="w-64 h-64 rounded-xl shadow-sm border border-border" />}
          </div>
          <AlertDialogFooter className="sm:justify-center flex-col gap-2">
            <Button asChild variant="default" className="w-full rounded-xl bg-midnight text-ivory">
              <a href={qrCodeData} download={`${project.slug}-${qrCodeTitle === 'Anı Albümü QR Kodu' ? 'album' : 'site'}-qr.png`}>Görseli İndir</a>
            </Button>
            <AlertDialogCancel className="rounded-xl w-full mt-2">Kapat</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Davetli" value={s.guest_count ?? 0} testid="stat-guests" />
        <Stat icon={MailCheck} label="Katılıyor" value={s.attending ?? 0} sub={`${s.attending_people ?? 0} kişi`} testid="stat-attending" />
        <Stat icon={UserX} label="Katılamıyor" value={s.declined ?? 0} testid="stat-declined" />
        <Stat icon={Send} label="Yanıt Oranı" value={s.guest_count ? `%${Math.round(((s.rsvp_total || 0) / s.guest_count) * 100)}` : '—'} sub={`${s.rsvp_total ?? 0} yanıt`} testid="stat-rate" />
      </div>

      <Tabs defaultValue="guests" className="mt-12">
        <TabsList className="h-auto w-full justify-start gap-8 rounded-2xl border-b border-border bg-transparent p-0">
          <TabsTrigger value="guests" className={tabCls} data-testid="tab-guests">Davetliler</TabsTrigger>
          <TabsTrigger value="rsvps" className={tabCls} data-testid="tab-rsvps">RSVP Yanıtları</TabsTrigger>
          <TabsTrigger value="send" className={tabCls} data-testid="tab-send">Toplu Gönderim</TabsTrigger>
          <TabsTrigger value="album" className={tabCls} data-testid="tab-album">Anı Albümü</TabsTrigger>
          <TabsTrigger value="settings" className={tabCls} data-testid="tab-settings">Ayarlar</TabsTrigger>
        </TabsList>
        <TabsContent value="guests" className="mt-8"><GuestsTab projectId={id} onChanged={load} /></TabsContent>
        <TabsContent value="rsvps" className="mt-8"><RsvpsTab projectId={id} /></TabsContent>
        <TabsContent value="send" className="mt-8"><SendTab projectId={id} project={project} onSent={load} /></TabsContent>
        <TabsContent value="album" className="mt-8"><AlbumTab projectId={id} project={project} onChanged={load} /></TabsContent>
        <TabsContent value="settings" className="mt-8">
          <div className="border border-destructive/30 bg-ivory-50 p-8">
            <p className="text-[11px] uppercase tracking-[0.3em] text-destructive">Tehlikeli Bölge</p>
            <h3 className="mt-3 font-serif text-2xl text-midnight">Etkinliği sil</h3>
            <p className="mt-2 text-sm text-muted-foreground">Davetiye, davetli listesi ve tüm RSVP yanıtları kalıcı olarak silinir.</p>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="outline" className="mt-6 h-11 rounded-2xl border-destructive text-[11px] uppercase tracking-[0.18em] text-destructive hover:bg-destructive hover:text-ivory" data-testid="delete-project"><Trash2 className="mr-2 h-3.5 w-3.5" /> Etkinliği Sil</Button></AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader><AlertDialogTitle className="font-serif text-2xl">Emin misiniz?</AlertDialogTitle><AlertDialogDescription>Bu işlem geri alınamaz.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel className="rounded-2xl">Vazgeç</AlertDialogCancel><AlertDialogAction onClick={remove} className="rounded-2xl bg-destructive text-ivory hover:bg-destructive/90" data-testid="confirm-delete">Evet, sil</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Stat({ icon: Icon, label, value, sub, testid }) {
  return (
    <div className="bg-ivory-50 p-6" data-testid={testid}>
      <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"><Icon className="h-3.5 w-3.5 text-champagne-dark" /> {label}</p>
      <p className="mt-3 font-serif text-4xl text-midnight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function RsvpsTab({ projectId }) {
  const [items, setItems] = useState(null)
  useEffect(() => {
    fetch(`/api/projects/${projectId}/rsvps`, { credentials: 'include', cache: 'no-store' }).then((r) => r.json()).then((d) => setItems(d.items || [])).catch(() => setItems([]))
  }, [projectId])

  if (items === null) return <Skeleton className="h-48 rounded-2xl" />
  if (!items.length) return <div className="border border-dashed border-border bg-ivory-50 px-8 py-16 text-center" data-testid="rsvps-empty"><p className="font-serif text-2xl text-midnight">Henüz yanıt yok.</p><p className="mt-2 text-sm text-muted-foreground">Davetiyenizi paylaştığınızda yanıtlar burada görünecek.</p></div>

  return (
    <div className="overflow-x-auto border border-border bg-ivory-50" data-testid="rsvps-table">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground"><th className="px-5 py-3 font-medium">Davetli</th><th className="px-5 py-3 font-medium">Katılım</th><th className="px-5 py-3 font-medium">Kişi</th><th className="px-5 py-3 font-medium">Menü</th><th className="px-5 py-3 font-medium">Not</th><th className="px-5 py-3 font-medium">Tarih</th></tr></thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-b border-border/60 last:border-0">
              <td className="px-5 py-4"><p className="text-midnight">{r.name}</p><p className="text-xs text-muted-foreground">{r.email || r.phone}</p></td>
              <td className="px-5 py-4">{r.attending ? <Badge className="rounded-full border-0 bg-sage/30 text-[10px] uppercase tracking-[0.15em] text-midnight hover:bg-sage/30">Katılıyor</Badge> : <Badge className="rounded-full border-0 bg-blush text-[10px] uppercase tracking-[0.15em] text-midnight hover:bg-blush">Katılamıyor</Badge>}</td>
              <td className="px-5 py-4 text-midnight">{r.attending ? r.guest_count : '—'}</td>
              <td className="px-5 py-4 text-midnight">{r.menu || '—'}</td>
              <td className="max-w-[240px] px-5 py-4 text-muted-foreground">{r.note || '—'}</td>
              <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('tr-TR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
