'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthForm({ mode = 'login' }) {
  const isLogin = mode === 'login'
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    setLoading(false)
    toast.info('Hesap sistemi bir sonraki fazda aktifleşiyor. Şimdilik tasarımları keşfedebilirsiniz.')
  }

  return (
    <div className="w-full max-w-md" data-testid={`auth-form-${mode}`}>
      <p className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-champagne-dark"><span className="h-px w-8 bg-current" /> {isLogin ? 'Tekrar hoş geldiniz' : 'Hikâyeniz başlasın'}</p>
      <h1 className="font-serif text-4xl text-midnight">{isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}</h1>
      <p className="mt-3 text-muted-foreground">
        {isLogin ? 'Etkinliklerinizi yönetmek için hesabınıza giriş yapın.' : 'Ücretsiz başlayın; ilk davetiyenizi dakikalar içinde yayınlayın.'}
      </p>
      {searchParams.get('tasarim') && (
        <p className="mt-4 border border-champagne/50 bg-champagne/10 px-4 py-2 text-xs text-midnight">Seçtiğiniz tasarım: <span className="font-medium capitalize">{searchParams.get('tasarim').replace(/-/g, ' ')}</span></p>
      )}

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[11px] uppercase tracking-[0.2em]">Ad Soyad</Label>
            <Input id="name" required placeholder="Elif Yılmaz" className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-midnight" data-testid="auth-name" />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.2em]">E-posta</Label>
          <Input id="email" type="email" required placeholder="siz@ornek.com" className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-midnight" data-testid="auth-email" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.2em]">Şifre</Label>
            {isLogin && <Link href="#" className="text-xs text-muted-foreground hover:text-midnight">Şifremi unuttum</Link>}
          </div>
          <Input id="password" type="password" required minLength={6} placeholder="••••••••" className="h-12 rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-midnight" data-testid="auth-password" />
        </div>
        <Button type="submit" disabled={loading} className="h-12 w-full rounded-none bg-midnight text-[12px] uppercase tracking-[0.2em] text-ivory hover:bg-midnight-700" data-testid="auth-submit">
          {loading ? 'Lütfen bekleyin…' : isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
        </Button>
      </form>

      <p className="mt-8 text-sm text-muted-foreground">
        {isLogin ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
        <Link href={isLogin ? '/kayit' : '/giris'} className="border-b border-midnight text-midnight">{isLogin ? 'Hesap oluşturun' : 'Giriş yapın'}</Link>
      </p>
    </div>
  )
}
