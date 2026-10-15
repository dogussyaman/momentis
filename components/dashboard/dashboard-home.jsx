'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Crown,
  ExternalLink,
  FileEdit,
  Gift,
  MapPin,
  PanelsTopLeft,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth/auth-provider'
import { BILLING_PLANS } from '@/lib/billing/plans'
import { DashboardHomeSkeleton } from '@/components/ui/luxury-loader'

function dateLabel(value) {
  if (!value) return 'Tarih belirtilmedi'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Tarih belirtilmedi'
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  href,
  badgeText,
  badgeTone = 'default',
}) {
  const content = (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-midnight text-champagne shadow-sm ring-1 ring-champagne/25 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md">
          <Icon className="h-5 w-5 text-champagne" />
        </div>
        {badgeText ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
              badgeTone === 'emerald'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : badgeTone === 'amber'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-champagne/40 bg-champagne/10 text-midnight'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                badgeTone === 'emerald'
                  ? 'bg-emerald-500'
                  : badgeTone === 'amber'
                  ? 'bg-amber-500'
                  : 'bg-champagne-dark'
              }`}
            />
            {badgeText}
          </span>
        ) : (
          href && (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ivory-50 text-muted-foreground transition group-hover:bg-champagne/20 group-hover:text-midnight">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          )
        )}
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-champagne-dark">
          {label}
        </p>
        <p className="mt-1 font-serif text-3xl sm:text-4xl font-normal tracking-tight text-midnight">
          {value}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  )

  const className =
    'group relative overflow-hidden rounded-3xl border border-midnight/10 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-champagne/60 hover:shadow-lg'

  return href ? (
    <Link href={href} className={className}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-champagne/10 blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
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

  useEffect(() => {
    load()
  }, [load])

  if (loading && !data) {
    return <DashboardHomeSkeleton />
  }

  const activeEvents = data?.events || []
  const drafts = data?.drafts || []
  const nextEvent = activeEvents
    .filter((event) => event.date && new Date(`${event.date}T23:59:59`).getTime() >= Date.now())
    .sort((a, b) => new Date(`${a.date}T12:00:00`).getTime() - new Date(`${b.date}T12:00:00`).getTime())[0]
  const billing = data?.billing
  const plan = BILLING_PLANS[billing?.account?.plan_id] || BILLING_PLANS.baslangic
  const credits = billing?.quotas?.eventCreditsRemaining || 0
  const totalGuests = activeEvents.reduce(
    (total, event) => total + (event.stats?.guest_count || 0),
    0
  )

  return (
    <div className="mx-auto max-w-7xl space-y-8" data-testid="dashboard-home">
      {/* Modern Executive Hero Banner */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-midnight via-midnight/95 to-midnight-700 px-6 py-8 text-ivory shadow-xl sm:px-9 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-champagne/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-12 -bottom-24 h-64 w-64 rounded-full bg-champagne-light/10 blur-2xl"
        />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-[11px] font-medium text-champagne backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-champagne opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-champagne" />
              </span>
              MOMENTIS · Etkinlik Stüdyosu
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight text-ivory">
              Merhaba{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="max-w-xl text-sm leading-6 text-ivory/70">
              Etkinliklerinizi, dijital davetiyelerinizi, LCV yanıtlarını ve VIP taleplerinizi tek bir komuta merkezinden yönetin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="h-11 rounded-2xl bg-champagne px-5 text-xs font-semibold uppercase tracking-wider text-midnight shadow-md transition-all hover:bg-champagne-light hover:shadow-lg"
            >
              <Link href="/panel/yeni">
                <Plus className="mr-2 h-4 w-4" /> Yeni Etkinlik
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-2xl border-ivory/20 bg-white/5 px-5 text-xs font-medium text-ivory backdrop-blur-sm hover:bg-white/10 hover:text-white"
            >
              <Link href="/panel/sablonlar">
                <PanelsTopLeft className="mr-2 h-4 w-4 text-champagne" /> Şablonları Keşfet
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive sm:flex-row sm:items-center"
        >
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>
            Yeniden dene
          </Button>
        </div>
      )}

      {/* 4 Executive KPI Metric Cards */}
      <section aria-label="Hesap özeti" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CalendarDays}
          label="Yayındaki Etkinlikler"
          value={activeEvents.length}
          detail="Aktif ve yayında olan davetleriniz"
          href="/panel/etkinlikler"
          badgeText={activeEvents.length > 0 ? 'Aktif' : undefined}
          badgeTone="emerald"
        />
        <MetricCard
          icon={FileEdit}
          label="Taslak Çalışmalar"
          value={drafts.length}
          detail="Düzenlemeye ve yayına hazır çalışmalar"
          href="/panel/taslaklar"
          badgeText={drafts.length > 0 ? `${drafts.length} taslak` : undefined}
          badgeTone="amber"
        />
        <MetricCard
          icon={Users}
          label="Kayıtlı Davetliler"
          value={totalGuests}
          detail="Etkinliklerinizdeki toplam konuk sayısı"
          href="/panel/etkinlikler"
        />
        <MetricCard
          icon={Crown}
          label="Hesap Paketi"
          value={plan.name}
          detail={`${credits} kullanılabilir etkinlik kredisi`}
          href="/panel/paketim"
          badgeText={`${credits} Kredi`}
          badgeTone="default"
        />
      </section>

      {/* 2-Column: Next Event & Quick Workspace Hub */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Next Event Card */}
        <div className="rounded-3xl border border-midnight/10 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-7">
          <div className="flex items-center justify-between gap-4 border-b border-midnight/5 pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-dark">
                Takvim & Zaman Çizelgesi
              </p>
              <h2 className="mt-1 font-serif text-2xl text-midnight">Sıradaki Etkinliğiniz</h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-champagne/15 text-champagne-dark">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>

          {nextEvent ? (
            <div className="mt-6 space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-midnight/10 bg-gradient-to-br from-ivory-50 to-champagne/5 p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Yayında
                    </span>
                    <h3 className="font-serif text-2xl text-midnight">
                      {[nextEvent.host_a, nextEvent.host_b].filter(Boolean).join(' & ') ||
                        nextEvent.title ||
                        'Etkinliğiniz'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                      <span className="inline-flex items-center gap-1 font-medium text-midnight">
                        <Clock3 className="h-3.5 w-3.5 text-champagne-dark" />
                        {dateLabel(nextEvent.date)}
                      </span>
                      {nextEvent.venue && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-champagne-dark" />
                            {nextEvent.venue}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    asChild
                    className="h-10 shrink-0 rounded-xl bg-midnight px-4 text-xs font-medium text-ivory hover:bg-midnight-700"
                  >
                    <Link href={`/panel/etkinlik/${nextEvent.id}`}>
                      Etkinliği Yönet <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-midnight/15 bg-ivory-50/70 px-6 py-9 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-champagne/15 text-champagne-dark">
                <Clock3 className="h-6 w-6" />
              </div>
              <p className="mt-3 font-serif text-lg text-midnight">Yaklaşan bir etkinliğiniz yok</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Yeni bir düğün, nişan veya özel davet oluşturarak ilk etkinliğinizi planlayın.
              </p>
              <Button asChild variant="link" className="mt-2 text-midnight font-medium">
                <Link href="/panel/yeni">
                  İlk etkinliğinizi oluşturun <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Quick Access Hub */}
        <div className="rounded-3xl border border-midnight/10 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-dark">
            Hızlı Gezinti
          </p>
          <h2 className="mt-1 font-serif text-2xl text-midnight">Çalışma Alanınız</h2>
          
          <div className="mt-5 space-y-2">
            <QuickLink
              href="/panel/etkinlikler"
              icon={CheckCircle2}
              title="Etkinliklerim"
              detail="Davetiyeleri ve LCV yanıtlarını inceleyin"
              badge={activeEvents.length > 0 ? String(activeEvents.length) : undefined}
            />
            <QuickLink
              href="/panel/taslaklar"
              icon={FileEdit}
              title="Taslaklarım"
              detail="Kaldığınız yerden tasarıma devam edin"
              badge={drafts.length > 0 ? String(drafts.length) : undefined}
            />
            <QuickLink
              href="/panel/vip-taleplerim"
              icon={Gift}
              title="VIP Tasarım Talepleri"
              detail="Özel tasarım sürecini ve revizyonları izleyin"
            />
            <QuickLink
              href="/panel/paketim"
              icon={CreditCard}
              title="Paket & Haklar"
              detail="Kalan kredilerinizi ve limitlerinizi yönetin"
            />
          </div>
        </div>
      </section>

      {/* Recent Activity / Projects */}
      <section className="rounded-3xl border border-midnight/10 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-7">
        <div className="flex flex-col justify-between gap-4 border-b border-midnight/5 pb-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-champagne-dark">
              Son Hareketler
            </p>
            <h2 className="mt-1 font-serif text-2xl text-midnight">Etkinliklerinize Devam Edin</h2>
          </div>
          <Button
            asChild
            variant="outline"
            className="w-fit rounded-xl border-midnight/15 hover:border-champagne hover:bg-champagne/10"
          >
            <Link href="/panel/etkinlikler">
              Tümünü Görüntüle <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {activeEvents.length || drafts.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[...drafts.slice(0, 2), ...activeEvents.slice(0, 2)].slice(0, 4).map((event) => {
              const isDraft = drafts.some((draft) => draft.id === event.id)
              return (
                <Link
                  key={event.id}
                  href={`/panel/etkinlik/${event.id}`}
                  className="group flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-midnight/10 bg-ivory-50/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-champagne/60 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isDraft ? 'bg-amber-100/70 text-amber-800' : 'bg-champagne/20 text-champagne-dark'
                      }`}
                    >
                      {isDraft ? <FileEdit className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-serif text-base font-medium text-midnight group-hover:text-champagne-dark transition-colors">
                        {[event.host_a, event.host_b].filter(Boolean).join(' & ') ||
                          event.title ||
                          'Etkinliğiniz'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {dateLabel(event.date)} ·{' '}
                        <span
                          className={`font-medium ${
                            isDraft ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {isDraft ? 'Taslak' : 'Yayında'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-midnight/10 text-muted-foreground transition group-hover:border-champagne/60 group-hover:bg-champagne/20 group-hover:text-midnight">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-ivory-50 px-5 py-9 text-center">
            <p className="text-sm text-muted-foreground">
              Henüz bir çalışmanız bulunmuyor. Yeni bir etkinlik oluşturarak hemen başlayabilirsiniz.
            </p>
            <Button
              asChild
              className="mt-4 rounded-xl bg-midnight text-ivory hover:bg-midnight-700"
            >
              <Link href="/panel/yeni">
                <Plus className="mr-2 h-4 w-4" /> Etkinlik Oluştur
              </Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}

function QuickLink({ href, icon: Icon, title, detail, badge }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 rounded-2xl p-3 transition-all duration-200 hover:bg-ivory-50/80 hover:translate-x-0.5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory-50 text-champagne-dark ring-1 ring-midnight/5 transition-all group-hover:bg-midnight group-hover:text-champagne group-hover:ring-champagne/30">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-midnight group-hover:text-champagne-dark transition-colors">
            {title}
          </p>
          {badge && (
            <span className="rounded-full bg-champagne/20 px-2 py-0.5 text-[10px] font-semibold text-midnight">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-midnight" />
    </Link>
  )
}
