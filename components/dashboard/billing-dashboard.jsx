'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Coins, Compass, Crown, Loader2, ShieldCheck, Sparkles, Ticket } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { BILLING_PLANS } from '@/lib/billing/plans'
import { formatPrice } from '@/lib/data/packages'
import { LuxuryLoader } from '@/components/ui/luxury-loader'

function formatCount(value) {
  return value === null ? 'Sınırsız' : String(value ?? 0)
}

export function BillingDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [snapshot, setSnapshot] = useState(null)
  const [availablePackages, setAvailablePackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyPackage, setBusyPackage] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponHistory, setCouponHistory] = useState([])
  const [couponBusy, setCouponBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [response, packageResponse, couponResponse] = await Promise.all([
        fetch('/api/billing/account', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/packages', { cache: 'no-store' }),
        fetch('/api/billing/coupons/history', { credentials: 'include', cache: 'no-store' }),
      ])
      const [data, packageData, couponData] = await Promise.all([
        response.json().catch(() => ({})),
        packageResponse.json().catch(() => ({})),
        couponResponse.json().catch(() => ({})),
      ])
      if (!response.ok) throw new Error(data.error || 'Paket bilgileri alınamadı')
      if (!packageResponse.ok) throw new Error(packageData.error || 'Satışa açık paketler alınamadı')
      if (!couponResponse.ok) throw new Error(couponData.error || 'Kupon geçmişi alınamadı')
      setSnapshot(data)
      setAvailablePackages(packageData.items || [])
      setCouponHistory(couponData.items || [])
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const redeemCoupon = async (event) => {
    event.preventDefault()
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    setCouponBusy(true)
    try {
      const response = await fetch('/api/billing/coupons/redeem', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': window.crypto.randomUUID() },
        body: JSON.stringify({ code }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Kupon kullanılamadı')
      toast.success(`${data.credits} etkinlik kredisi hesabınıza eklendi`)
      setCouponCode('')
      await load()
    } catch (couponError) {
      toast.error(couponError.message)
    } finally {
      setCouponBusy(false)
    }
  }

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
    return (
      <div className="mx-auto max-w-5xl py-12">
        <LuxuryLoader
          variant="card"
          title="Paket ve Kota Bilgileri Yükleniyor…"
          subtitle="MOMENTIS · FATURALANDIRMA & HAKLAR"
          icon={Crown}
        />
      </div>
    )
  }

  if (error && !snapshot) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-destructive/20 bg-white p-8 text-center shadow-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-2xl text-midnight">Bilgiler Alınamadı</h2>
        <p className="mt-2 text-sm text-destructive">{error}</p>
        <Button className="mt-6 rounded-xl border-midnight/20" variant="outline" onClick={load}>
          Tekrar Dene
        </Button>
      </div>
    )
  }

  const freePlan = BILLING_PLANS[snapshot?.account?.plan_id] || BILLING_PLANS.baslangic
  const remainingCredits = snapshot?.quotas?.eventCreditsRemaining || 0

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="inline-flex items-center gap-2 rounded-full border border-champagne/40 bg-champagne/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-dark">
          <Crown className="h-3.5 w-3.5 text-champagne-dark" /> Paket & Kullanım
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl text-midnight">Paket Yönetimi</h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Hesabınıza tanımlı paket haklarınızı, kalan etkinlik kredilerinizi ve dışa aktarma kotalarınızı görüntüleyin.
        </p>
      </div>

      {/* Account Tier Banner */}
      <section className="relative overflow-hidden rounded-[2rem] border border-champagne/40 bg-gradient-to-br from-champagne/15 via-white to-ivory-50 p-7 sm:p-9 shadow-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-champagne/20 blur-3xl"
        />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-midnight px-3 py-1 text-[11px] font-medium text-champagne">
              <Sparkles className="h-3.5 w-3.5 text-champagne" /> Aktif Hesap Planı
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-midnight">{freePlan.name}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {snapshot?.usage?.projects || 0} kayıtlı etkinlik ·{' '}
              <span className="font-semibold text-midnight">{remainingCredits}</span> kullanılabilir ücretli etkinlik kredisi
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
            <div className="rounded-2xl border border-midnight/10 bg-white/90 px-4 py-3 text-center shadow-xs">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Ücretsiz Hak</p>
              <p className="mt-1 font-serif text-xl font-medium text-midnight">{formatCount(snapshot?.quotas?.freeProjects)}</p>
            </div>
            <div className="rounded-2xl border border-midnight/10 bg-white/90 px-4 py-3 text-center shadow-xs">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Toplam Kapasite</p>
              <p className="mt-1 font-serif text-xl font-medium text-midnight">{formatCount(snapshot?.quotas?.projects)}</p>
            </div>
          </div>
        </div>

        {!!snapshot?.grants?.length && (
          <div className="mt-6 border-t border-midnight/10 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-midnight mb-3">Tanımlı Kredi Hakları</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {snapshot.grants.map((grant) => (
                <div
                  key={grant.id}
                  className="flex items-center justify-between rounded-2xl border border-midnight/10 bg-white/80 px-4 py-3 text-sm shadow-2xs"
                >
                  <span className="font-medium text-midnight">{BILLING_PLANS[grant.package_id]?.name || grant.package_id}</span>
                  <span className="rounded-full bg-champagne/20 px-2.5 py-0.5 text-xs font-medium text-midnight">
                    {grant.remaining_event_credits} / {grant.event_credits} kredi
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Coupon Redemption Section */}
      <section className="rounded-3xl border border-midnight/10 bg-white p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-champagne/20 text-champagne-dark">
                <Ticket className="h-4 w-4" />
              </div>
              <h2 className="font-serif text-xl text-midnight">Kredi Kuponu & Promosyon</h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground pt-1">
              Geçerli bir hediye promosyon kodu hesabınıza ek etkinlik kredisi tanımlar.
            </p>
            {couponHistory.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Son Kullanılanlar:</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {couponHistory.slice(0, 3).map((item) => (
                    <span key={item.id} className="rounded-lg bg-ivory-50 border border-midnight/10 px-2.5 py-1 text-midnight">
                      {item.code} <span className="text-champagne-dark font-medium">(+{item.credits} kredi)</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={redeemCoupon} className="flex gap-2 w-full sm:w-auto">
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              maxLength={32}
              required
              aria-label="Kupon kodu"
              placeholder="Örn: HEDIYE2026"
              className="h-10 min-w-0 flex-1 sm:w-48 rounded-xl border border-midnight/15 bg-ivory-50 px-3 text-sm uppercase tracking-wider outline-none focus:border-champagne focus:bg-white"
            />
            <Button
              type="submit"
              disabled={couponBusy || !couponCode.trim()}
              className="h-10 rounded-xl bg-midnight text-ivory hover:bg-midnight-700 text-xs uppercase tracking-wider font-semibold"
            >
              {couponBusy ? 'Uygulanıyor…' : 'Kullan'}
            </Button>
          </form>
        </div>
      </section>

      {/* Available Packages Grid */}
      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-dark">Plan Seçenekleri</p>
          <h2 className="font-serif text-2xl text-midnight">Mevcut Paketler</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {availablePackages
            .filter((plan) => plan.price > 0)
            .map((plan) => {
              const isAtelier = plan.id === 'atolye'
              return (
                <article
                  key={plan.id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-7 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    isAtelier
                      ? 'border-champagne/60 bg-gradient-to-b from-white to-champagne/10'
                      : 'border-midnight/10 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-midnight text-champagne shadow-sm ring-1 ring-champagne/25">
                        {isAtelier ? <Sparkles className="h-6 w-6 text-champagne" /> : <Crown className="h-6 w-6 text-champagne" />}
                      </div>
                      <span className="rounded-full bg-champagne/20 px-3 py-1 text-[11px] font-medium text-midnight">
                        {plan.tagline}
                      </span>
                    </div>

                    <div className="mt-5 flex items-baseline gap-2">
                      <h3 className="font-serif text-3xl text-midnight">{plan.name}</h3>
                      <span className="text-sm font-semibold text-champagne-dark">
                        {formatPrice(plan.price)} <span className="text-xs text-muted-foreground font-normal">/ {plan.period}</span>
                      </span>
                    </div>

                    <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-800 font-bold">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className="mt-8 h-11 rounded-2xl bg-midnight text-ivory transition-all hover:bg-midnight-700 hover:shadow-md"
                    onClick={() => startMockPurchase(plan)}
                    disabled={!snapshot?.mockPaymentAvailable || Boolean(busyPackage)}
                  >
                    {busyPackage === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-champagne" /> İşleniyor…
                      </>
                    ) : snapshot?.mockPaymentAvailable ? (
                      'Geliştirme için Mock Satın Alma'
                    ) : (
                      'Ödeme Şu Anda Kullanılamıyor'
                    )}
                  </Button>
                </article>
              )
            })}
        </div>
      </section>

      {/* Disclaimers & Security */}
      <div className="rounded-2xl border border-midnight/10 bg-ivory-50/70 p-5 space-y-2 text-xs text-muted-foreground">
        <p className="leading-relaxed">
          Davetiye dışa aktarma kotası, etkinlik başına 1 ayrı dışa aktarma isteğidir. Aynı istek anahtarıyla yapılan teknik tekrarlar yeniden sayılmaz; yeni istekler kota kullanır. Dosya türüne göre ayrı bir kota tanımlı değildir.
        </p>
        <p className="flex items-center gap-2 font-medium text-midnight pt-1">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          Mock ödeme yalnızca geliştirme ve test ortamlarında çalışır. Üretimde herhangi bir ödeme veya yetkisiz hak tanımlama yapılmaz.
        </p>
      </div>
    </div>
  )
}

