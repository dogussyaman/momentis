'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, LoaderCircle, Mail, MailWarning } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'

const ADMIN_ROLES = ['super_admin', 'admin', 'support']
const MAIL_STATUS = {
  sent: 'E-posta gönderildi',
  pending: 'E-posta bekliyor',
  sending: 'E-posta gönderiliyor',
  failed: 'E-posta gönderilemedi',
  not_configured: 'E-posta ayarlı değil',
  not_available: 'E-posta adresi yok',
  not_requested: 'E-posta gönderilmedi',
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Tarih bilgisi yok'
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function internalHref(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/panel/bildirimler'
}

function canRetryEmailNow(notification) {
  if (['failed', 'not_configured', 'pending'].includes(notification.email?.status)) return true
  if (notification.email?.status !== 'sending') return false
  const lastAttempt = new Date(notification.email.lastAttemptAt || 0).getTime()
  return Date.now() - lastAttempt >= 5 * 60 * 1000
}

export function NotificationCenter() {
  const router = useRouter()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [emailStatus, setEmailStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const isAdmin = ADMIN_ROLES.includes(user?.role)
  const canRetryEmail = ['super_admin', 'admin'].includes(user?.role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications?limit=50', { credentials: 'include', cache: 'no-store' })
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

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/admin/notifications/email-status', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'E-posta durumu alınamadı')
        setEmailStatus(data)
      })
      .catch((statusError) => setError(statusError.message || 'E-posta durumu alınamadı'))
  }, [isAdmin])

  const markAllRead = async () => {
    setBusyId('all')
    setError('')
    setSuccess('')
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Bildirimler okundu olarak işaretlenemedi')
      const readAt = new Date().toISOString()
      setItems((current) => current.map((item) => ({ ...item, readAt })))
      setUnreadCount(0)
      setSuccess('Tüm bildirimler okundu olarak işaretlendi.')
    } catch (actionError) {
      setError(actionError.message || 'Bildirimler güncellenemedi')
    } finally {
      setBusyId('')
    }
  }

  const openItem = async (item) => {
    if (!item.readAt) {
      setBusyId(item.id)
      try {
        const response = await fetch(`/api/notifications/${encodeURIComponent(item.id)}`, { method: 'PATCH', credentials: 'include' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Bildirim okunamadı')
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry))
        setUnreadCount((count) => Math.max(0, count - 1))
      } catch (actionError) {
        setError(actionError.message || 'Bildirim okunamadı')
        setBusyId('')
        return
      }
      setBusyId('')
    }
    router.push(internalHref(item.href))
  }

  const retryEmail = async (item) => {
    setBusyId(item.id)
    setError('')
    setSuccess('')
    try {
      const response = await fetch(`/api/admin/notifications/${encodeURIComponent(item.id)}/retry-email`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'E-posta yeniden gönderilemedi')
      setSuccess('E-posta yeniden gönderildi.')
      await load()
    } catch (actionError) {
      setError(actionError.message || 'E-posta yeniden gönderilemedi')
    } finally {
      setBusyId('')
    }
  }

  return (
    <section className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Hesap merkezi</p>
          <h1 className="mt-2 text-3xl font-serif text-midnight">Bildirimler</h1>
          <p className="mt-2 text-sm text-muted-foreground">{unreadCount} okunmamış bildirim</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead} disabled={busyId === 'all'}>
            {busyId === 'all' ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Tümünü okundu işaretle
          </Button>
        )}
      </div>

      {isAdmin && emailStatus && (
        <div className={`mt-6 rounded-xl border p-4 text-sm ${emailStatus.configured ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>
          <div className="flex items-start gap-3">
            {emailStatus.configured ? <Mail className="mt-0.5 h-4 w-4 shrink-0" /> : <MailWarning className="mt-0.5 h-4 w-4 shrink-0" />}
            <div>
              <p className="font-medium">E-posta bildirimleri: {emailStatus.configured ? 'Etkin' : 'Uygulama içi bildirimler etkin'}</p>
              <p className="mt-1 text-xs">{emailStatus.message}</p>
            </div>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Bildirimler yükleniyor
          </div>
        ) : items.length ? (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id} className={`flex flex-wrap items-start gap-4 p-5 ${item.readAt ? '' : 'bg-champagne/5'}`}>
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.readAt ? 'bg-muted' : 'bg-champagne'}`} aria-hidden="true" />
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openItem(item)} disabled={busyId === item.id}>
                  <span className="block font-medium text-midnight">{item.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">{item.message}</span>
                  <span className="mt-2 block text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                </button>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {item.email?.status && (
                    <span className={`text-xs ${item.email.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {MAIL_STATUS[item.email.status] || `E-posta: ${item.email.status}`}
                    </span>
                  )}
                  {canRetryEmail && emailStatus?.configured && item.audience === 'admin' && canRetryEmailNow(item) && (
                    <Button size="sm" variant="outline" disabled={busyId === item.id} onClick={() => retryEmail(item)}>
                      {busyId === item.id ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Mail className="mr-2 h-3.5 w-3.5" />}
                      Yeniden gönder
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center p-12 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 font-medium text-midnight">Henüz bildiriminiz yok</p>
            <p className="mt-1 text-sm text-muted-foreground">Önemli hesap, proje ve talep güncellemeleri burada görünür.</p>
          </div>
        )}
      </div>
    </section>
  )
}
