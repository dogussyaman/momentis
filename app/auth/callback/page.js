'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/shared/logo'
import { useAuth } from '@/components/auth/auth-provider'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { setUser } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.hash.slice(1)).get('session_id')
    if (!sessionId) { setError('Oturum kimliği bulunamadı. Lütfen tekrar giriş yapmayı deneyin.'); return }
    window.history.replaceState({}, document.title, '/auth/callback')
    fetch('/api/auth/google/exchange', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ sessionId }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data?.error || 'Giriş başarısız')
        setUser(data.user)
        let next = '/panel'
        try { next = sessionStorage.getItem('momentis_after_login') || '/panel'; sessionStorage.removeItem('momentis_after_login') } catch {}
        router.replace(next)
      })
      .catch((e) => setError(e.message))
  }, [router, setUser])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <Logo />
      <p className="mt-12 text-[11px] uppercase tracking-[0.3em] text-champagne-dark">Google ile giriş</p>
      <p className="mt-4 font-serif text-3xl text-midnight" data-testid="callback-status">{error || 'Oturumunuz açılıyor…'}</p>
      {error && <a href="/giris" className="mt-8 border-b border-midnight text-sm text-midnight">Giriş sayfasına dön</a>}
    </main>
  )
}
