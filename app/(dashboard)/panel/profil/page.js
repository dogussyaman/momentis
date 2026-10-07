'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const { user } = useAuth()
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    status: 'idle', // idle, loading, success, error
    message: ''
  })

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
      </div>
    </div>
  )
}
