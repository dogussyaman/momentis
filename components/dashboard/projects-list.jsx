'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Users, MailCheck, ExternalLink, CalendarDays, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { getEventType } from '@/lib/data/events'
import { useAuth } from '@/components/auth/auth-provider'

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="mb-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-champagne-dark"><span className="h-px w-8 bg-current" /> {eyebrow}</p>}
        <h1 className="font-serif text-4xl leading-tight text-midnight md:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-xl text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function ProjectsList() {
  const { user } = useAuth()
  const [items, setItems] = useState(null)

  useEffect(() => {
    fetch('/api/projects', { credentials: 'include' }).then((r) => r.json()).then((d) => setItems(d.items || [])).catch(() => setItems([]))
  }, [])

  const deleteProject = async (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm("Bu etkinliği kalıcı olarak silmek istediğinize emin misiniz?")) return
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error("Silme işlemi başarısız oldu")
      toast.success("Etkinlik başarıyla silindi")
      setItems((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div data-testid="projects-list">
      <PageHeader
        eyebrow={`Merhaba, ${user?.name?.split(' ')[0] || ''}`}
        title="Etkinlikleriniz"
        description="Davetiyelerinizi, davetli listelerinizi ve RSVP yanıtlarını tek bir yerden yönetin."
        action={
          <Button asChild className="h-12 rounded-2xl bg-midnight px-6 text-[12px] uppercase tracking-[0.2em] text-ivory hover:bg-midnight-700">
            <Link href="/panel/yeni" data-testid="new-project-button"><Plus className="mr-2 h-4 w-4" /> Yeni Etkinlik</Link>
          </Button>
        }
      />

      {items === null ? (
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="mt-12 border border-dashed border-border bg-ivory-50 px-8 py-24 text-center" data-testid="projects-empty">
          <CalendarDays className="mx-auto h-10 w-10 text-champagne" strokeWidth={1.2} />
          <h2 className="mt-6 font-serif text-3xl text-midnight">Henüz bir etkinliğiniz yok.</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">İlk davetiyenizi oluşturmak sadece birkaç dakika sürer. Tasarımınızı seçin, detayları girin, paylaşın.</p>
          <Button asChild className="mt-8 h-12 rounded-2xl bg-champagne px-8 text-[12px] uppercase tracking-[0.2em] text-midnight hover:bg-champagne-light">
            <Link href="/panel/yeni">İlk Etkinliğini Oluştur</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => {
            const type = getEventType(p.event_type)
            return (
              <div key={p.id} className="group flex flex-col overflow-hidden rounded-3xl border border-midnight/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-champagne/70 hover:shadow-[0_24px_60px_-32px_rgba(16,24,39,0.35)]" data-testid={`project-card-${p.slug}`}>
                <Link href={`/panel/etkinlik/${p.id}`} className="flex flex-1 flex-col p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="rounded-full border-midnight/20 text-[10px] uppercase tracking-[0.2em]">{type?.label}</Badge>
                    <Badge className={p.published ? 'rounded-full border-0 bg-sage/30 text-[10px] uppercase tracking-[0.2em] text-midnight hover:bg-sage/30' : 'rounded-2xl border-0 bg-muted text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted'}>{p.published ? 'Yayında' : 'Taslak'}</Badge>
                  </div>
                  <h3 className="mt-7 font-serif text-3xl leading-tight text-midnight">{[p.host_a, p.host_b].filter(Boolean).join(' & ')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.date ? new Date(`${p.date}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tarih belirtilmedi'}{p.venue ? ` · ${p.venue}` : ''}</p>
                  <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-5">
                    <div><p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"><Users className="h-3.5 w-3.5" /> Davetli</p><p className="mt-1 font-serif text-2xl text-midnight">{p.stats?.guest_count ?? 0}</p></div>
                    <div><p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"><MailCheck className="h-3.5 w-3.5" /> Katılıyor</p><p className="mt-1 font-serif text-2xl text-midnight">{p.stats?.attending_people ?? 0}</p></div>
                  </div>
                  <p className="mt-5 flex items-center gap-2 truncate text-xs text-champagne-dark"><ExternalLink className="h-3 w-3" /> /d/{p.slug}</p>
                </Link>
                <div className="flex flex-wrap gap-2 border-t border-midnight/8 bg-ivory-50/60 px-5 py-4">
                  <Button asChild size="sm" variant="outline" className="h-9 flex-1 rounded-xl border-midnight/15 bg-white px-3 text-[10px] uppercase tracking-widest text-midnight hover:bg-midnight hover:text-white">
                    <Link href={`/panel/etkinlik/${p.id}`}><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Aç</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="h-9 flex-1 rounded-xl border-midnight/15 bg-white px-3 text-[10px] uppercase tracking-widest text-midnight hover:bg-midnight hover:text-white">
                    <Link href={`/panel/etkinlik/${p.id}/duzenle`}><Edit className="mr-1.5 h-3.5 w-3.5" /> Düzenle</Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={(e) => deleteProject(p.id, e)} className="h-9 rounded-xl px-3 text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-50 hover:text-red-600" aria-label={`${p.host_a} etkinliğini sil`}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Sil
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
