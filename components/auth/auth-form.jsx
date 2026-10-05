'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from './auth-provider'

const inputCls = 'h-12 rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-midnight'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3.1 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.2-.2-1.7H12z" />
    </svg>
  )
}

export function AuthForm({ mode = 'login' }) {
  const isLogin = mode === 'login'
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const nextParams = () => {
    const p = new URLSearchParams()
    if (searchParams.get('tasarim')) p.set('tasarim', searchParams.get('tasarim'))
    if (searchParams.get('paket')) p.set('paket', searchParams.get('paket'))
    return p.toString()
  }

  const destination = () => {
    const next = searchParams.get('next')
    if (next && next.startsWith('/')) return next
    const q = nextParams()
    return isLogin && !q ? '/panel' : `/panel/yeni${q ? `?${q}` : ''}`
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/auth/${isLogin ? 'login' : 'register'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(isLogin ? { email: form.email, password: form.password } : form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Bir hata oluştu')
      setUser(data.user)
      toast.success(isLogin ? 'Tekrar hoş geldiniz!' : 'Hesabınız oluşturuldu.')
      router.replace(destination())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const onGoogle = () => {
    const q = nextParams()
    const next = searchParams.get('next') || (q ? `/panel/yeni?${q}` : '/panel')
    try { sessionStorage.setItem('momentis_after_login', next) } catch {}
    const redirect = `${window.location.origin}/auth/callback`
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirect)}`
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

      <Button type="button" variant="outline" onClick={onGoogle} className="mt-8 h-12 w-full rounded-none border-midnight/20 text-[12px] uppercase tracking-[0.18em] text-midnight hover:bg-midnight/5" data-testid="auth-google">
        <GoogleIcon /> <span className="ml-3">Google ile devam et</span>
      </Button>

      <div className="my-6 flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground"><span className="h-px flex-1 bg-border" /> veya <span className="h-px flex-1 bg-border" /></div>

      <form onSubmit={onSubmit} className="space-y-6">
        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[11px] uppercase tracking-[0.2em]">Ad Soyad</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Elif Yılmaz" className={inputCls} data-testid="auth-name" />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.2em]">E-posta</Label>
          <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="siz@ornek.com" className={inputCls} data-testid="auth-email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.2em]">Şifre</Label>
          <Input id="password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className={inputCls} data-testid="auth-password" />
        </div>
        {error && <p className="text-sm text-destructive" data-testid="auth-error">{error}</p>}
        <Button type="submit" disabled={loading} className="h-12 w-full rounded-none bg-midnight text-[12px] uppercase tracking-[0.2em] text-ivory hover:bg-midnight-700" data-testid="auth-submit">
          {loading ? 'Lütfen bekleyin…' : isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
        </Button>
      </form>

      <p className="mt-8 text-sm text-muted-foreground">
        {isLogin ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
        <Link href={`${isLogin ? '/kayit' : '/giris'}${nextParams() ? `?${nextParams()}` : ''}`} className="border-b border-midnight text-midnight" data-testid="auth-switch">{isLogin ? 'Hesap oluşturun' : 'Giriş yapın'}</Link>
      </p>
    </div>
  )
}
