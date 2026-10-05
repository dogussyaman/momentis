'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const inputCls = 'h-12 rounded-2xl border-0 border-b border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-midnight'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(null)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Bir hata oluştu')
      setDone(data)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  if (done) {
    return (
      <div className="w-full max-w-md" data-testid="forgot-success">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-champagne/20 text-champagne-dark"><MailCheck className="h-5 w-5" /></div>
        <h1 className="mt-6 font-serif text-4xl text-midnight">E-postanızı kontrol edin</h1>
        <p className="mt-4 text-muted-foreground">Eğer <span className="text-midnight">{email}</span> adresiyle bir hesap varsa, şifre sıfırlama bağlantısı gönderdik. Bağlantı 1 saat geçerlidir.</p>
        {done.delivery === 'failed' && <p className="mt-4 border border-champagne/50 bg-champagne/10 px-4 py-3 text-xs text-midnight">E-posta servisi şu an yalnızca doğrulanmış adrese gönderim yapabiliyor. Bağlantı sunucu kayıtlarına da yazıldı.</p>}
        <Link href="/giris" className="mt-8 inline-block border-b border-midnight text-sm text-midnight">Giriş sayfasına dön</Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md" data-testid="forgot-form">
      <p className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-champagne-dark"><span className="h-px w-8 bg-current" /> Şifremi unuttum</p>
      <h1 className="font-serif text-4xl text-midnight">Şifrenizi sıfırlayın</h1>
      <p className="mt-3 text-muted-foreground">Hesabınıza bağlı e-posta adresinizi girin; size bir sıfırlama bağlantısı gönderelim.</p>
      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.2em]">E-posta</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="siz@ornek.com" className={inputCls} data-testid="forgot-email" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl bg-midnight text-[12px] uppercase tracking-[0.2em] text-ivory hover:bg-midnight-700" data-testid="forgot-submit">{loading ? 'Gönderiliyor…' : 'Bağlantı Gönder'}</Button>
      </form>
      <p className="mt-8 text-sm text-muted-foreground">Şifrenizi hatırladınız mı? <Link href="/giris" className="border-b border-midnight text-midnight">Giriş yapın</Link></p>
    </div>
  )
}

export function ResetPasswordForm({ token }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('Şifreler eşleşmiyor'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ token, password }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Bir hata oluştu')
      setDone(true)
      setTimeout(() => { window.location.assign('/panel') }, 1200)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  if (!token) {
    return <div className="w-full max-w-md" data-testid="reset-invalid"><h1 className="font-serif text-4xl text-midnight">Geçersiz bağlantı</h1><p className="mt-4 text-muted-foreground">Sıfırlama bağlantısı eksik ya da bozuk.</p><Link href="/sifremi-unuttum" className="mt-8 inline-block border-b border-midnight text-sm text-midnight">Yeni bağlantı iste</Link></div>
  }
  if (done) {
    return <div className="w-full max-w-md" data-testid="reset-success"><h1 className="font-serif text-4xl text-midnight">Şifreniz güncellendi</h1><p className="mt-4 text-muted-foreground">Panele yönlendiriliyorsunuz…</p></div>
  }

  return (
    <div className="w-full max-w-md" data-testid="reset-form">
      <p className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-champagne-dark"><span className="h-px w-8 bg-current" /> Yeni şifre</p>
      <h1 className="font-serif text-4xl text-midnight">Yeni şifrenizi belirleyin</h1>
      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <div className="space-y-2"><Label htmlFor="password" className="text-[11px] uppercase tracking-[0.2em]">Yeni Şifre</Label><Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} data-testid="reset-password" /></div>
        <div className="space-y-2"><Label htmlFor="confirm" className="text-[11px] uppercase tracking-[0.2em]">Şifre (Tekrar)</Label><Input id="confirm" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} data-testid="reset-confirm" /></div>
        {error && <p className="text-sm text-destructive" data-testid="reset-error">{error}</p>}
        <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl bg-midnight text-[12px] uppercase tracking-[0.2em] text-ivory hover:bg-midnight-700" data-testid="reset-submit">{loading ? 'Kaydediliyor…' : 'Şifreyi Güncelle'}</Button>
      </form>
    </div>
  )
}
