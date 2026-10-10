'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, CreditCard, ExternalLink, FileEdit, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/components/auth/auth-provider'
import { BILLING_PLANS } from '@/lib/billing/plans'

function dateLabel(value) {
  if (!value) return 'Tarih belirtilmedi'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Tarih belirtilmedi'
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function MetricCard({ icon: Icon, label, value, detail, href, tone = 'sage' }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone === 'gold' ? 'bg-champagne/20 text-champagne-dark' : 'bg-sage/25 text-midnight'}`}>
          <Icon className="h-5 w-5" />
        </span>
        {href && <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-midnight" />}
      </div>
      <p className="mt-5 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-3xl text-midnight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </>
  )
  const className = 'group rounded-3xl border border-midnight/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-champagne/60 hover:shadow-md sm:p-6'
  return href ? <Link href={href} className={className}>{content}</Link> : <div className={className}>{content}</div>
}

export function DashboardHome() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [eventsResponse, draftsResponse, billingResponse] = await Promise.all([
        fetch('/api/projects?view=active', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/projects?view=drafts', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/billing/account', { credentials: 'include', cache: 'no-store' }),
      ])
      const [events, drafts, billing] = await Promise.all([
        eventsResponse.json().catch(() => ({})),
        draftsResponse.json().catch(() => ({})),
        billingResponse.json().catch(() => ({})),
      ])
      if (!eventsResponse.ok) throw new Error(events.error || 'Etkinlik özetleri yüklenemedi.')
      if (!draftsResponse.ok) throw new Error(drafts.error || 'Taslaklar yüklenemedi.')
      if (!billingResponse.ok) throw new Error(billing.error || 'Paket bilgileri yüklenemedi.')
      setData({ events: events.items || [], drafts: drafts.items || [], billing })
    } catch (loadError) {
      setError(loadError.message || 'Panel bilgileri yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const activeEvents = data?.events || []
  const drafts = data?.drafts || []
  const nextEvent = activeEvents
    .filter((event) => event.date && new Date(`${event.date}T23:59:59`).getTime() >= Date.now())
    .sort((a, b) => new Date(`${a.date}T12:00:00`).getTime() - new Date(`${b.date}T12:00:00`).getTime())[0]
  const billing = data?.billing
  const plan = BILLING_PLANS[billing?.account?.plan_id] || BILLING_PLANS.baslangic
  const credits = billing?.quotas?.eventCreditsRemaining || 0

  return (
    <div className="mx-auto max-w-7xl space-y-8" data-testid="dashboard-home">
      <section className="relative overflow-hidden rounded-[2rem] bg-midnight px-6 py-8 text-ivory shadow-xl sm:px-9 sm:py-10">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-champagne/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-champagne"><span className="h-px w-8 bg-current" /> MOMENTIS · Etkinlik stüdyosu</p>
            <h1 className="mt-4 font-serif text-3xl sm:text-4xl">Merhaba{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ivory/65">Etkinliklerinizi, davetiyelerinizi ve yanıtları tek bir yerden takip edin.</p>
          </div>
          <Button asChild className="h-11 w-fit rounded-2xl bg-champagne px-5 text-xs font-semibold uppercase tracking-wider text-midnight hover:bg-champagne-light">
            <Link href="/panel/yeni"><Plus className="mr-2 h-4 w-4" /> Yeni etkinlik</Link>
          </Button>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex flex-col justify-between gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive sm:flex-row sm:items-center">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>Yeniden dene</Button>
        </div>
      )}

      <section aria-label="Hesap özeti" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading && !data ? (
          [0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-44 rounded-3xl" />)
        ) : (
          <>
            <MetricCard icon={CalendarDays} label="Yayındaki etkinlikler" value={activeEvents.length} detail="Yayınlanmış davetleriniz" href="/panel/etkinlikler" />
            <MetricCard icon={FileEdit} label="Taslaklar" value={drafts.length} detail="Düzenlemeye hazır çalışmalar" href="/panel/taslaklar" tone="gold" />
            <MetricCard icon={Users} label="Davetli toplamı" value={activeEvents.reduce((total, event) => total + (event.stats?.guest_count || 0), 0)} detail="Yayındaki etkinliklerden" href="/panel/etkinlikler" />
            <MetricCard icon={CreditCard} label="Hesap paketi" value={plan.name} detail={`${credits} ücretli etkinlik kredisi`} href="/panel/paketim" tone="gold" />
          </>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-midnight/10 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-champagne-dark">Takviminiz</p>
              <h2 className="mt-2 font-serif text-2xl text-midnight">Sıradaki etkinlik</h2>
            </div>
            <CalendarDays className="h-5 w-5 text-champagne-dark" />
          </div>
          {loading && !data ? (
            <Skeleton className="mt-5 h-28 rounded-2xl" />
          ) : nextEvent ? (
            <Link href={`/panel/etkinlik/${nextEvent.id}`} className="mt-5 flex flex-col justify-between gap-4 rounded-2xl bg-ivory-50 p-5 transition hover:bg-sage/15 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-serif text-xl text-midnight">{[nextEvent.host_a, nextEvent.host_b].filter(Boolean).join(' & ') || nextEvent.title || 'Etkinliğiniz'}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{dateLabel(nextEvent.date)}{nextEvent.venue ? ` · ${nextEvent.venue}` : ''}</p>
              </div>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-champagne-dark">Etkinliği aç <ArrowRight className="h-4 w-4" /></span>
            </Link>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-ivory-50/70 px-5 py-7 text-center">
              <Clock3 className="mx-auto h-6 w-6 text-champagne-dark" />
              <p className="mt-3 text-sm text-muted-foreground">Yaklaşan bir etkinliğiniz yok.</p>
              <Button asChild variant="link" className="mt-1 text-midnight"><Link href="/panel/yeni">İlk etkinliğinizi oluştur <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-midnight/10 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-champagne-dark">Hızlı erişim</p>
          <h2 className="mt-2 font-serif text-2xl text-midnight">Çalışma alanınız</h2>
          <div className="mt-5 space-y-2">
            <QuickLink href="/panel/etkinlikler" icon={CheckCircle2} title="Etkinliklerim" detail="Davetleri ve yanıtları yönetin" />
            <QuickLink href="/panel/taslaklar" icon={FileEdit} title="Taslaklar" detail="Kaldığınız yerden devam edin" />
            <QuickLink href="/panel/paketim" icon={CreditCard} title="Paket ve haklar" detail="Kullanımınızı görüntüleyin" />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-midnight/10 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-champagne-dark">Son çalışmalar</p>
            <h2 className="mt-2 font-serif text-2xl text-midnight">Etkinliklerinize devam edin</h2>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-xl border-midnight/15">
            <Link href="/panel/etkinlikler">Tüm etkinlikler <ExternalLink className="ml-2 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
        {loading && !data ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">{[0, 1].map((item) => <Skeleton key={item} className="h-20 rounded-2xl" />)}</div>
        ) : activeEvents.length || drafts.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[...drafts.slice(0, 2), ...activeEvents.slice(0, 2)].slice(0, 4).map((event) => {
              const isDraft = drafts.some((draft) => draft.id === event.id)
              return (
                <Link key={event.id} href={`/panel/etkinlik/${event.id}`} className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-border/70 bg-ivory-50/50 p-4 transition hover:border-champagne/60 hover:bg-ivory-50">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-midnight">{[event.host_a, event.host_b].filter(Boolean).join(' & ') || event.title || 'Etkinliğiniz'}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">{dateLabel(event.date)} · {isDraft ? 'Taslak' : 'Yayında'}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-ivory-50 px-5 py-7 text-center">
            <p className="text-sm text-muted-foreground">Henüz bir çalışmanız yok. Yeni bir etkinlik oluşturarak başlayın.</p>
            <Button asChild className="mt-4 rounded-xl bg-midnight text-ivory hover:bg-midnight-700"><Link href="/panel/yeni"><Plus className="mr-2 h-4 w-4" /> Etkinlik oluştur</Link></Button>
          </div>
        )}
      </section>
    </div>
  )
}

function QuickLink({ href, icon: Icon, title, detail }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl p-3 transition hover:bg-ivory-50">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ivory-50 text-champagne-dark transition group-hover:bg-champagne/20"><Icon className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-midnight">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-midnight" />
    </Link>
  )
}
