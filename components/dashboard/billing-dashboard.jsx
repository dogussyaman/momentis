'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { BILLING_PLANS } from '@/lib/billing/plans'
import { formatPrice } from '@/lib/data/packages'

function formatCount(value) {
  return value === null ? 'Sınırsız' : String(value ?? 0)
}

export function BillingDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyPackage, setBusyPackage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/billing/account', { credentials: 'include', cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Paket bilgileri alınamadı')
      setSnapshot(data)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const startMockPurchase = async (plan) => {
    setBusyPackage(plan.id)
    try {
      const requestKey = window.crypto.randomUUID()
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey },
        credentials: 'include',
        body: JSON.stringify({ packageId: plan.id }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Satın alma başlatılamadı')

      const confirmation = await fetch('/api/billing/mock-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ purchaseId: data.purchase.id }),
      })
      const confirmationData = await confirmation.json().catch(() => ({}))
      if (!confirmation.ok) throw new Error(confirmationData.error || 'Mock ödeme onaylanamadı')

      toast.success(`${plan.name} paketi etkinleştirildi: ${confirmationData.eventCredits} etkinlik kredisi`)
      await load()
      const returnTo = searchParams.get('returnTo')
      if (returnTo?.startsWith('/panel/') && !returnTo.startsWith('//')) {
        const destination = new URL(returnTo, window.location.origin)
        if (destination.pathname === '/panel/yeni') destination.searchParams.set('paket', plan.id)
        router.replace(`${destination.pathname}${destination.search}`)
      }
    } catch (purchaseError) {
      toast.error(purchaseError.message)
    } finally {
      setBusyPackage('')
    }
  }

  if (loading && !snapshot) {
    return <div className="flex min-h-64 items-center justify-center" role="status"><Loader2 className="h-6 w-6 animate-spin" /> <span className="sr-only">Paket bilgileri yükleniyor</span></div>
  }

  if (error && !snapshot) {
    return <div className="mx-auto max-w-2xl rounded-3xl border border-destructive/30 bg-white p-8 text-center">
      <p className="text-sm text-destructive">{error}</p>
      <Button className="mt-4" variant="outline" onClick={load}>Tekrar dene</Button>
    </div>
  }

  const freePlan = BILLING_PLANS[snapshot?.account?.plan_id] || BILLING_PLANS.baslangic
  const remainingCredits = snapshot?.quotas?.eventCreditsRemaining || 0

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="text-center">
        <h1 className="font-serif text-4xl text-midnight">Paketim</h1>
        <p className="mt-3 text-muted-foreground">Paket haklarınız ve kullanımınız sunucudaki hesabınızdan görüntülenir.</p>
      </div>

      <section className="rounded-3xl border border-champagne/40 bg-gradient-to-br from-champagne/10 to-transparent p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne-dark">Hesap paketi</p>
            <h2 className="mt-2 font-serif text-3xl text-midnight">{freePlan.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{snapshot?.usage?.projects || 0} kayıtlı etkinlik · {remainingCredits} kullanılabilir ücretli etkinlik kredisi</p>
          </div>
          <div className="rounded-2xl border border-border bg-white/80 px-5 py-4 text-sm">
            <p>Ücretsiz proje hakkı: {formatCount(snapshot?.quotas?.freeProjects)}</p>
            <p className="mt-1">Toplam proje kapasitesi: {formatCount(snapshot?.quotas?.projects)}</p>
          </div>
        </div>
        {!!snapshot?.grants?.length && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {snapshot.grants.map((grant) => (
              <div key={grant.id} className="flex items-center justify-between rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm">
                <span>{BILLING_PLANS[grant.package_id]?.name || grant.package_id}</span>
                <span>{grant.remaining_event_credits} / {grant.event_credits} etkinlik kredisi</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {Object.values(BILLING_PLANS).filter((plan) => plan.price > 0).map((plan) => (
          <article key={plan.id} className="flex flex-col rounded-3xl border border-border bg-white p-7 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-champagne-dark">{plan.tagline}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <h3 className="font-serif text-3xl text-midnight">{plan.name}</h3>
              <span className="text-sm text-muted-foreground">{formatPrice(plan.price)} · {plan.period}</span>
            </div>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-muted-foreground">
              {plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
            </ul>
            <Button
              className="mt-7 rounded-full bg-midnight text-ivory hover:bg-midnight-700"
              onClick={() => startMockPurchase(plan)}
              disabled={!snapshot?.mockPaymentAvailable || Boolean(busyPackage)}
            >
              {busyPackage === plan.id ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> İşleniyor</> : snapshot?.mockPaymentAvailable ? 'Geliştirme için mock satın alma' : 'Ödeme şu anda kullanılamıyor'}
            </Button>
          </article>
        ))}
      </section>
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Mock ödeme yalnızca geliştirme ve test ortamlarında çalışır. Üretimde herhangi bir ödeme veya hak tanımlama yapılmaz.
      </p>
    </div>
  )
}
