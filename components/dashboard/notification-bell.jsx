'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Tarih bilgisi yok'
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications?limit=5', { credentials: 'include', cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Bildirimler yüklenemedi')
      setItems(data.items || [])
      setUnreadCount(data.unreadCount || 0)
      setError('')
    } catch (loadError) {
      setError(loadError.message || 'Bildirimler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = window.setInterval(load, 60_000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [load])

  const openNotification = async (item) => {
    if (!item.readAt) {
      try {
        const response = await fetch(`/api/notifications/${encodeURIComponent(item.id)}`, {
          method: 'PATCH',
          credentials: 'include',
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Bildirim okunamadı')
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry))
        setUnreadCount((count) => Math.max(0, count - 1))
      } catch (readError) {
        setError(readError.message || 'Bildirim okunamadı')
        return
      }
    }
    setOpen(false)
    router.push(item.href || '/panel/bildirimler')
  }

  const markAllRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Bildirimler okundu olarak işaretlenemedi')
      const readAt = new Date().toISOString()
      setItems((current) => current.map((item) => ({ ...item, readAt })))
      setUnreadCount(0)
      setError('')
    } catch (readError) {
      setError(readError.message || 'Bildirimler okundu olarak işaretlenemedi')
    }
  }

  return (
    <Popover open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen)
      if (nextOpen) load()
    }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-midnight" aria-label={`Bildirimler${unreadCount ? `, ${unreadCount} okunmamış` : ''}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Bildirimler</h2>
            <p className="text-xs text-muted-foreground">{unreadCount} okunmamış</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={markAllRead}>
              <Check className="mr-1 h-3.5 w-3.5" /> Tümünü oku
            </Button>
          )}
        </div>
        {error && <p role="alert" className="px-4 py-3 text-xs text-destructive">{error}</p>}
        {loading && !items.length ? (
          <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Yükleniyor
          </div>
        ) : items.length ? (
          <ul className="max-h-96 overflow-y-auto divide-y">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openNotification(item)}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="flex items-start gap-2">
                    {!item.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-champagne" />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{item.title}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{item.message}</span>
                      <span className="mt-2 block text-[11px] text-muted-foreground">{formatDate(item.createdAt)}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Henüz bildiriminiz yok.</p>
        )}
        <div className="border-t px-4 py-3 text-center">
          <button type="button" className="text-xs font-medium text-midnight underline-offset-4 hover:underline" onClick={() => { setOpen(false); router.push('/panel/bildirimler') }}>
            Tüm bildirimleri gör
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
