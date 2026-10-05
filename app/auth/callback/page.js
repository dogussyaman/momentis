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
    const queryError = new URLSearchParams(window.location.search).get('error')
    if (queryError) {
      setError(queryError)
    } else {
      // If we landed here without an error, the backend auth flow is likely still processing
      // or we reached this page by mistake. We'll just wait or let the user click to go back.
      setTimeout(() => {
        if (!queryError) setError('Giriş işlemi tamamlanamadı. Lütfen tekrar deneyin.')
      }, 5000)
    }
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <Logo />
      <p className="mt-12 text-[11px] uppercase tracking-[0.3em] text-champagne-dark">Google ile giriş</p>
      <p className="mt-4 font-serif text-3xl text-midnight" data-testid="callback-status">{error || 'Oturumunuz açılıyor…'}</p>
      {error && <a href="/giris" className="mt-8 border-b border-midnight text-sm text-midnight">Giriş sayfasına dön</a>}
    </main>
  )
}
