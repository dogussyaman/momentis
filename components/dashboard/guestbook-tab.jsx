'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export function GuestbookTab({ projectId }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [messageToDelete, setMessageToDelete] = useState(null)

  const load = useCallback(async () => {
    setItems(null)
    setError('')
    try {
      const response = await fetch(`/api/projects/${projectId}/guestbook`, { credentials: 'include', cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Anı defteri yüklenemedi')
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Anı defteri yüklenemedi')
      setItems([])
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  const updateStatus = async (item, status) => {
    setBusyId(item.id)
    try {
      const response = await fetch(`/api/projects/${projectId}/guestbook/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Mesaj güncellenemedi')
      setItems((current) => current.map((message) => message.id === item.id ? { ...message, status } : message))
      toast.success(status === 'approved' ? 'Mesaj yayınlandı' : 'Mesaj yayından kaldırıldı')
    } catch (updateError) {
      toast.error(updateError instanceof Error ? updateError.message : 'Mesaj güncellenemedi')
    } finally {
      setBusyId('')
    }
  }

  const confirmRemove = async () => {
    if (!messageToDelete) return
    const item = messageToDelete
    setMessageToDelete(null)
    setBusyId(item.id)
    try {
      const response = await fetch(`/api/projects/${projectId}/guestbook/${item.id}`, { method: 'DELETE', credentials: 'include' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Mesaj silinemedi')
      setItems((current) => current.filter((message) => message.id !== item.id))
      toast.success('Mesaj silindi')
    } catch (removeError) {
      toast.error(removeError instanceof Error ? removeError.message : 'Mesaj silinemedi')
    } finally {
      setBusyId('')
    }
  }

  if (items === null) return <Skeleton className="h-48 rounded-2xl" />
  if (error) return <div className="border border-destructive/30 bg-ivory-50 px-8 py-10 text-center"><p className="text-sm text-destructive">{error}</p><Button variant="outline" className="mt-4 rounded-xl" onClick={load}>Yeniden dene</Button></div>
  if (!items.length) return <div className="border border-dashed border-border bg-ivory-50 px-8 py-16 text-center"><p className="font-serif text-2xl text-midnight">Henüz mesaj yok.</p><p className="mt-2 text-sm text-muted-foreground">Misafirlerin bıraktığı mesajlar burada görünecek.</p></div>

  return (
    <div className="space-y-3" data-testid="guestbook-messages">
      {items.map((item) => (
        <article key={item.id} className="flex flex-col gap-4 border border-border bg-ivory-50 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-midnight">{item.name}</h3>
              <Badge variant="outline" className="rounded-full text-[10px]">{item.status === 'approved' ? 'Yayında' : item.status === 'rejected' ? 'Reddedildi' : 'Onay bekliyor'}</Badge>
              <time className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString('tr-TR')}</time>
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{item.message}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {item.status !== 'approved' ? (
              <Button type="button" size="sm" disabled={busyId === item.id} onClick={() => updateStatus(item, 'approved')} className="rounded-xl bg-midnight text-ivory hover:bg-midnight-700">
                {busyId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />} Yayınla
              </Button>
            ) : (
              <Button type="button" size="sm" variant="outline" disabled={busyId === item.id} onClick={() => updateStatus(item, 'rejected')} className="rounded-xl"><X className="mr-1.5 h-4 w-4" /> Yayından kaldır</Button>
            )}
            <Button type="button" size="icon" variant="ghost" aria-label="Mesajı sil" disabled={busyId === item.id} onClick={() => setMessageToDelete(item)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </article>
      ))}

      <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent className="bg-ivory border-0 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl text-midnight">Mesajı Sil</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground mt-2">
              Bu mesajı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl border-midnight/20 text-midnight">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="rounded-xl bg-red-600 text-white hover:bg-red-700">Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
