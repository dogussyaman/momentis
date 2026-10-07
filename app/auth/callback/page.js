'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/shared/logo'

export default function AuthCallbackPage() {
  const [error, setError] = useState('')

  useEffect(() => {
    const queryError = new URLSearchParams(window.location.search).get('error')
    if (queryError) {
      setError(queryError)
    }
    const timeout = queryError ? undefined : setTimeout(() => {
      setError('Giriş işlemi tamamlanamadı. Lütfen tekrar deneyin.')
    }, 5000)
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-champagne/20 via-ivory to-ivory px-6 text-center">
      <Logo />
      <section className="mt-12 w-full max-w-lg rounded-3xl border border-white/80 bg-white/90 p-8 shadow-[0_24px_72px_-40px_rgba(16,24,39,0.35)] sm:p-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-champagne-dark">Google ile giriş</p>
        <p role={error ? 'alert' : 'status'} className="mt-4 font-serif text-2xl leading-snug text-midnight sm:text-3xl" data-testid="callback-status">{error || 'Oturumunuz açılıyor…'}</p>
        {error && (
          <div className="mt-7">
            <p className="text-sm leading-relaxed text-muted-foreground">Giriş tamamlanmadı. Hesabınıza e-posta ve şifrenizle giriş yapabilir veya Google girişini yeniden deneyebilirsiniz.</p>
            <Link href="/giris" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-midnight px-6 text-sm font-medium text-ivory transition-colors hover:bg-midnight-700">Giriş sayfasına dön</Link>
          </div>
        )}
      </section>
    </main>
  )
}
