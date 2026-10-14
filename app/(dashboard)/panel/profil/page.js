'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    status: 'idle', // idle, loading, success, error
    message: ''
  })
  const [deletionPreview, setDeletionPreview] = useState(null)
  const [deletionEmail, setDeletionEmail] = useState('')
  const [deletionPassword, setDeletionPassword] = useState('')
  const [deletionConfirmed, setDeletionConfirmed] = useState(false)
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false)
  const [deletionState, setDeletionState] = useState({ status: 'idle', message: '' })
  const [googleReauthReady, setGoogleReauthReady] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    fetch('/api/auth/account-deletion-preview', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Hesap silme bilgileri yüklenemedi')
        setDeletionPreview(data)
        setGoogleReauthReady(data.googleReauthValid === true)
      })
      .catch((error) => setDeletionState({ status: 'error', message: error.message }))
  }, [user?.id])

  const submitAccountDeletion = async () => {
    setDeletionState({ status: 'loading', message: '' })
    try {
      const response = await fetch('/api/auth/account', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationEmail: deletionEmail,
          ...(deletionPassword ? { currentPassword: deletionPassword } : {}),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (data.summary) setDeletionPreview(data.summary)
        throw new Error(data.error || 'Hesap silinemedi')
      }
      router.replace('/giris?accountDeleted=1')
      router.refresh()
    } catch (error) {
      setDeletionState({ status: 'error', message: error.message || 'Hesap silinemedi' })
    } finally {
      setDeletionDialogOpen(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setPasswordState(prev => ({ ...prev, status: 'error', message: 'Yeni şifreler eşleşmiyor.' }))
      return
    }
    if (passwordState.newPassword.length < 6) {
      setPasswordState(prev => ({ ...prev, status: 'error', message: 'Şifre en az 6 karakter olmalı.' }))
      return
    }

    setPasswordState(prev => ({ ...prev, status: 'loading', message: '' }))
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword: passwordState.currentPassword, 
          newPassword: passwordState.newPassword 
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordState({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          status: 'success',
          message: 'Şifreniz başarıyla güncellendi.'
        })
      } else {
        setPasswordState(prev => ({ ...prev, status: 'error', message: data.error || 'Bir hata oluştu.' }))
      }
    } catch {
      setPasswordState(prev => ({ ...prev, status: 'error', message: 'Bir hata oluştu. Lütfen tekrar deneyin.' }))
    }
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-midnight border-t-transparent" />
      </div>
    )
  }

  const hasPassword = user.auth_provider === 'password' || user.auth_provider === 'google+password'

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-serif text-midnight">Profilim</h1>
        <p className="mt-3 text-muted-foreground">Kişisel bilgilerinizi ve hesap ayarlarınızı görüntüleyin.</p>
      </div>
      
      <div className="space-y-8 rounded-3xl border border-border bg-white p-8 shadow-sm sm:p-10">
        <div className="space-y-6">
          <h2 className="text-xl font-serif text-midnight">Kişisel Bilgiler</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Ad Soyad</label>
              <div className="flex h-11 items-center rounded-xl border border-border bg-ivory-50 px-4 text-sm text-midnight/80">
                {user.name || 'Belirtilmemiş'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">E-posta</label>
              <div className="flex h-11 items-center rounded-xl border border-border bg-ivory-50 px-4 text-sm text-midnight/80">
                {user.email || 'Belirtilmemiş'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Hesap Türü</label>
              <div className="flex h-11 items-center rounded-xl border border-border bg-ivory-50 px-4 text-sm text-midnight/80 capitalize">
                {user.auth_provider === 'google' ? 'Google ile Giriş' : 'E-posta & Şifre'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 space-y-6">
          <h2 className="text-xl font-serif text-midnight">Güvenlik & Şifre</h2>
          <form onSubmit={handlePasswordChange} className="rounded-2xl border border-border bg-ivory-50 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium text-midnight">{hasPassword ? 'Şifre Değiştir' : 'Hesaba Şifre Ekle'}</h3>
              <Link href="/sifremi-unuttum" className="text-sm text-midnight underline decoration-champagne underline-offset-4 hover:text-champagne-dark">
                Şifremi unuttum
              </Link>
            </div>
            
            {hasPassword && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Mevcut Şifre</label>
                <input 
                  type="password" 
                  value={passwordState.currentPassword}
                  onChange={(e) => setPasswordState(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required 
                  className="flex h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-midnight outline-none focus:border-champagne focus:ring-1 focus:ring-champagne transition-all"
                  placeholder="Mevcut şifreniz"
                />
              </div>
            )}
            
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Yeni Şifre</label>
                <input 
                  type="password" 
                  value={passwordState.newPassword}
                  onChange={(e) => setPasswordState(prev => ({ ...prev, newPassword: e.target.value }))}
                  required 
                  className="flex h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-midnight outline-none focus:border-champagne focus:ring-1 focus:ring-champagne transition-all"
                  placeholder="Yeni şifreniz"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Yeni Şifre (Tekrar)</label>
                <input 
                  type="password" 
                  value={passwordState.confirmPassword}
                  onChange={(e) => setPasswordState(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required 
                  className="flex h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-midnight outline-none focus:border-champagne focus:ring-1 focus:ring-champagne transition-all"
                  placeholder="Yeni şifrenizi doğrulayın"
                />
              </div>
            </div>

            {passwordState.message && (
              <p className={cn("text-sm font-medium", passwordState.status === 'error' ? "text-red-500" : "text-emerald-600")}>
                {passwordState.message}
              </p>
            )}

            <Button 
              type="submit" 
              disabled={passwordState.status === 'loading'}
              className="bg-midnight text-ivory hover:bg-midnight-800 w-full sm:w-auto"
            >
              {passwordState.status === 'loading' ? 'Güncelleniyor...' : (hasPassword ? 'Şifreyi Güncelle' : 'Şifre Ekle')}
            </Button>
          </form>
        </div>

        <div className="space-y-5 border-t border-border pt-8">
          <div>
            <h2 className="text-xl font-serif text-destructive">Hesabımı Sil</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Bu işlem hesabınıza erişimi kalıcı olarak kapatır. Etkinlikleriniz, davetiyeleriniz, konuk/RSVP verileriniz ve kişisel tasarım içerikleriniz silinir. Yasal ve finansal kayıtlar silinmez; kullanılabilir kredileriniz işlem geçmişine kaydedilerek iptal edilir.
            </p>
          </div>

          {deletionPreview ? (
            <div className="grid gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm sm:grid-cols-2">
              <p>Etkinlik: <strong>{deletionPreview.events}</strong></p>
              <p>Davetiyeler: <strong>{deletionPreview.invitations}</strong></p>
              <p>Davetliler: <strong>{deletionPreview.guests}</strong></p>
              <p>VIP talepleri: <strong>{deletionPreview.vipRequests}</strong></p>
              <p>Sipariş kayıtları korunacak: <strong>{deletionPreview.orders}</strong></p>
              <p>İptal edilecek kullanılabilir kredi: <strong>{deletionPreview.remainingCredits}</strong></p>
              {(deletionPreview.pendingVipRequests > 0 || deletionPreview.pendingOrders > 0) && (
                <p className="font-medium text-amber-900 sm:col-span-2">
                  Bekleyen VIP talebi ({deletionPreview.pendingVipRequests}) veya sipariş ({deletionPreview.pendingOrders}) tamamlanmadan hesap silinemez. Önce bu işlemlerin sonuçlanmasını bekleyin.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Hesap silme önizlemesi yükleniyor…</p>
          )}

          <div className="space-y-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
            {hasPassword ? (
              <div className="space-y-2">
                <label htmlFor="deletion-password" className="text-sm font-medium text-midnight">Yeniden kimlik doğrulama için mevcut şifreniz</label>
                <input
                  id="deletion-password"
                  type="password"
                  autoComplete="current-password"
                  value={deletionPassword}
                  onChange={(event) => setDeletionPassword(event.target.value)}
                  className="flex h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-destructive focus:ring-1 focus:ring-destructive"
                />
                <a href="/api/auth/google/start?intent=delete-account" className="text-xs text-midnight underline underline-offset-4">
                  Google hesabımla yeniden doğrula
                </a>
                {googleReauthReady && <p className="text-xs font-medium text-emerald-700">Google kimliğiniz doğrulandı. Son onay için e-posta adresinizi girin.</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-midnight">Silme işleminden önce Google hesabınızla yeniden kimlik doğrulamanız gerekir.</p>
                <a href="/api/auth/google/start?intent=delete-account" className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-midnight hover:bg-ivory-50">
                  Google ile yeniden doğrula
                </a>
                {googleReauthReady && <p className="text-xs font-medium text-emerald-700">Google kimliğiniz doğrulandı. Son onay için e-posta adresinizi girin.</p>}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="deletion-email" className="text-sm font-medium text-midnight">Onaylamak için hesap e-posta adresinizi yazın</label>
              <input
                id="deletion-email"
                type="email"
                autoComplete="email"
                value={deletionEmail}
                onChange={(event) => setDeletionEmail(event.target.value)}
                className="flex h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-destructive focus:ring-1 focus:ring-destructive"
              />
            </div>
            <label className="flex items-start gap-3 text-sm leading-relaxed text-midnight">
              <input
                type="checkbox"
                checked={deletionConfirmed}
                onChange={(event) => setDeletionConfirmed(event.target.checked)}
                className="mt-1"
              />
              Silinecek içerikleri, korunacak sipariş/finansal kayıtları ve iptal edilecek kredileri anladım.
            </label>
            {deletionState.message && (
              <p role="alert" className={cn('text-sm font-medium', deletionState.status === 'error' ? 'text-destructive' : 'text-emerald-700')}>
                {deletionState.message}
              </p>
            )}
            <Button
              type="button"
              variant="destructive"
              disabled={!deletionPreview || deletionState.status === 'loading' || !deletionConfirmed ||
                deletionEmail.trim().toLowerCase() !== String(user.email || '').toLowerCase() ||
                (!deletionPassword && !googleReauthReady) ||
                deletionPreview.pendingVipRequests > 0 || deletionPreview.pendingOrders > 0}
              onClick={() => setDeletionDialogOpen(true)}
            >
              {deletionState.status === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Hesabımı kalıcı olarak sil
            </Button>
          </div>
        </div>
      </div>
      <AlertDialog open={deletionDialogOpen} onOpenChange={setDeletionDialogOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive text-lg sm:text-xl break-words"><AlertTriangle className="h-5 w-5 shrink-0" /> Hesabınız kalıcı olarak silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed">
              Kişisel etkinlik içerikleri silinir, kullanılabilir krediler iptal edilir ve yasal/finansal kayıtlar korunur. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2.5">
            <AlertDialogCancel className="w-full sm:w-auto rounded-xl">Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto rounded-xl"
              disabled={deletionState.status === 'loading'}
              onClick={(event) => {
                event.preventDefault()
                submitAccountDeletion()
              }}
            >
              Evet, hesabımı sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
