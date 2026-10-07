'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from './auth-provider'

const inputCls = 'h-11 rounded-xl border-border/80 bg-ivory-50/70 px-4 focus-visible:border-champagne-dark focus-visible:ring-2 focus-visible:ring-champagne/25'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z" />
      <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z" />
      <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.3 19.3 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z" />
    </svg>
  )
}

export function AuthForm({ mode = 'login' }) {
  const isLogin = mode === 'login'
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const nextParams = () => {
    const p = new URLSearchParams()
    if (searchParams.get('tasarim')) p.set('tasarim', searchParams.get('tasarim'))
    if (searchParams.get('paket')) p.set('paket', searchParams.get('paket'))
    if (searchParams.get('next')) p.set('next', searchParams.get('next'))
    return p.toString()
  }

  const destination = () => {
    const next = searchParams.get('next')
    if (next) {
      const target = new URL(next, window.location.origin)
      if (target.origin === window.location.origin) return `${target.pathname}${target.search}${target.hash}`
    }
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
    window.location.href = `/api/auth/google/start?next=${encodeURIComponent(next)}`
  }

  return (
    <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_28px_80px_-40px_rgba(16,24,39,0.35)] backdrop-blur sm:p-7" data-testid={`auth-form-${mode}`}>
      <div className="mb-5">
        <p className="mb-3 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.3em] text-champagne-dark"><span className="h-px w-7 bg-current" /> {isLogin ? 'Tekrar hoş geldiniz' : 'Hikâyeniz başlasın'}</p>
        <h1 className="font-serif text-3xl tracking-tight text-midnight sm:text-4xl">{isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {isLogin ? 'Etkinliklerinizi ve davetiyelerinizi yönetmek için hesabınıza giriş yapın.' : 'Ücretsiz hesabınızı oluşturun; davetiyenizi kendi hikâyenize göre hazırlayın.'}
        </p>
      </div>
      {searchParams.get('tasarim') && (
        <p className="mb-4 rounded-xl border border-champagne/50 bg-champagne/10 px-4 py-2.5 text-xs text-midnight">Seçtiğiniz tasarım: <span className="font-medium capitalize">{searchParams.get('tasarim').replace(/-/g, ' ')}</span></p>
      )}

      <Button type="button" variant="outline" onClick={onGoogle} disabled={loading} className="h-11 w-full rounded-xl border-border bg-white text-sm font-medium normal-case tracking-normal text-midnight shadow-sm hover:border-midnight/30 hover:bg-ivory-50" data-testid="auth-google">
        <GoogleIcon /> <span className="ml-2.5">Google ile devam et</span>
      </Button>

      <div className="my-4 flex items-center gap-4 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground"><span className="h-px flex-1 bg-border" /> veya e-posta ile <span className="h-px flex-1 bg-border" /></div>

      <form onSubmit={onSubmit} className="space-y-3">
        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-medium text-midnight/80">Ad Soyad</Label>
            <Input id="name" autoComplete="name" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Örn. Elif Yılmaz" className={inputCls} data-testid="auth-name" />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-medium text-midnight/80">E-posta</Label>
          <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="siz@ornek.com" className={inputCls} data-testid="auth-email" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium text-midnight/80">Şifre</Label>
            {isLogin && <Link href="/sifremi-unuttum" className="text-xs font-medium text-midnight/65 underline-offset-4 hover:text-midnight hover:underline" data-testid="forgot-link">Şifremi unuttum</Link>}
          </div>
          <div className="relative">
            <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="En az 6 karakter" className={`${inputCls} pr-12`} data-testid="auth-password" />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-2 flex w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-midnight/5 hover:text-midnight" aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'} aria-pressed={showPassword}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {!isLogin && <p className="text-[11px] text-muted-foreground">En az 6 karakter kullanın.</p>}
        </div>
        {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive" data-testid="auth-error">{error}</p>}
        <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-midnight text-sm font-medium normal-case tracking-wide text-ivory shadow-sm hover:bg-midnight-700" data-testid="auth-submit">
          {loading ? 'Lütfen bekleyin…' : isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-champagne-dark" /> Hesap bilgileriniz güvenli oturumla korunur.</div>
      <p className="mt-4 border-t border-border/70 pt-4 text-center text-sm text-muted-foreground">
        {isLogin ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
        <Link href={`${isLogin ? '/kayit' : '/giris'}${nextParams() ? `?${nextParams()}` : ''}`} className="font-medium text-midnight underline decoration-champagne underline-offset-4" data-testid="auth-switch">{isLogin ? 'Hesap oluşturun' : 'Giriş yapın'}</Link>
      </p>
    </div>
  )
}
