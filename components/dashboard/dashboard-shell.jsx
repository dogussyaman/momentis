'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Plus, PanelsTopLeft, Send, LogOut, Menu, ChevronRight, FileEdit, Archive, User, CreditCard, ChevronLeft, ShieldCheck, Gift, Bell, TicketPercent, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Logo } from '@/components/shared/logo'
import { useAuth } from '@/components/auth/auth-provider'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { canManageSuperAdmin } from '@/lib/admin/authorization'
import { NotificationBell } from '@/components/dashboard/notification-bell'

const NAV_GROUPS = [
  {
    label: 'Çalışma Alanı',
    items: [
      { href: '/panel', label: 'Genel Bakış', icon: LayoutDashboard, exact: true },
      { href: '/panel/etkinlikler', label: 'Etkinliklerim', icon: CalendarDays, isActive: (pathname) => pathname.startsWith('/panel/etkinlikler') || pathname.startsWith('/panel/etkinlik/') },
      { href: '/panel/taslaklar', label: 'Taslaklar', icon: FileEdit },
      { href: '/panel/arsiv', label: 'Arşiv', icon: Archive },
      { href: '/panel/yeni', label: 'Yeni Etkinlik', icon: Plus },
      { href: '/panel/vip-taleplerim', label: 'VIP Taleplerim', icon: Gift },
    ],
  },
  {
    label: 'Keşfet',
    items: [
      { href: '/panel/sablonlar', label: 'Site Şablonları', icon: PanelsTopLeft },
    ],
  },
  {
    label: 'Hesap & Ayarlar',
    items: [
      { href: '/panel/profil', label: 'Profilim', icon: User },
      { href: '/panel/paketim', label: 'Paketim', icon: CreditCard },
      { href: '/panel/bildirimler', label: 'Bildirimler', icon: Bell },
    ],
  },
  {
    label: 'Araçlar',
    items: [
      { href: '/panel/gonderim-testi', label: 'Gönderim Testi', icon: Send },
    ],
  },
  {
    label: 'Yönetim',
    adminOnly: true,
    items: [
      { href: '/panel/admin', label: 'Admin Paneli', icon: ShieldCheck },
    ],
  },
]

const ADMIN_NAV_GROUPS = [
  {
    label: 'Yönetim',
    items: [
      { href: '/panel/admin', label: 'Yönetim Özeti', icon: ShieldCheck, exact: true },
      { href: '/panel/admin/templates', label: 'Şablon Yönetimi', icon: PanelsTopLeft },
      { href: '/panel/admin/email-templates', label: 'E-posta Şablonları', icon: Mail },
      { href: '/panel/admin/users', label: 'Kullanıcılar ve Kotalar', icon: User },
      { href: '/panel/admin/campaigns', label: 'Kredi Kampanyaları', icon: TicketPercent },
      { href: '/panel/admin/vip-talepler', label: 'VIP Tasarım Talepleri', icon: Gift },
      { href: '/panel/bildirimler', label: 'Bildirim Merkezi', icon: Bell },
    ],
  },
  {
    label: 'Kampanyalar',
    items: [
      { href: '/panel/hediye-davetiye', label: 'Hediye Davetiye', icon: Gift },
    ],
  },
  {
    label: 'Uygulama',
    items: [
      { href: '/panel/vip-taleplerim', label: 'VIP Taleplerim', icon: Gift },
      { href: '/panel', label: 'Kullanıcı Paneline Dön', icon: LayoutDashboard, exact: true },
    ],
  },
]

function SidebarContent({ pathname, user, onLogout, onNavigate, isCollapsed }) {
  const isAdmin = ['super_admin', 'admin', 'support'].includes(user?.role)
  const navGroups = isAdmin
    ? ADMIN_NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) =>
      !['/panel/admin/users', '/panel/admin/campaigns'].includes(item.href) || canManageSuperAdmin(user),
    ) }))
    : NAV_GROUPS.filter((group) => !group.adminOnly)
  return (
    <TooltipProvider delayDuration={100}>
      <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-midnight via-midnight to-midnight-700">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-champagne/10 blur-3xl" />
        
        <div className={cn("relative flex flex-col items-center border-b border-ivory/10 pb-6 pt-7 transition-all duration-300", isCollapsed ? "px-2" : "px-6 items-start")}>
          <div className={cn("transition-all duration-300 w-full flex", isCollapsed ? "mt-2 justify-center" : "")}>
            {isCollapsed ? (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                <Logo tone="light" showText={false} />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Logo tone="light" />
              </motion.div>
            )}
          </div>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.p 
                initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 20 }} exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="text-[10px] font-medium uppercase tracking-[0.24em] text-ivory/45 overflow-hidden"
              >
                Etkinlik stüdyosu
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        
        <nav className={cn("sb-no-scrollbar relative min-h-0 flex-1 space-y-7 overflow-y-auto overflow-x-hidden py-7 transition-all duration-300", isCollapsed ? "px-3" : "px-4")}>
          {navGroups.map((group) => (
            <div key={group.label} className={cn(isCollapsed && "flex flex-col items-center space-y-2")}>
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 8 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-ivory/35 overflow-hidden whitespace-nowrap"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>
              {isCollapsed && <div className="h-px w-8 bg-ivory/10 mb-2 mt-4 first:hidden" />}
              <div className={cn("flex flex-col gap-1 w-full", isCollapsed ? "items-center" : "")}>
                {group.items.map((item) => {
                  const active = item.isActive ? item.isActive(pathname) : item.exact ? pathname === item.href : pathname.startsWith(item.href)
                  const Icon = item.icon
                  
                  const linkContent = (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'group flex min-h-11 items-center rounded-xl border py-2.5 text-[13px] font-medium transition-all duration-200',
                        isCollapsed ? 'justify-center w-11 px-0' : 'gap-3 px-3 w-full',
                        active
                          ? 'border-ivory/10 bg-ivory/10 text-ivory shadow-sm'
                          : 'border-transparent text-ivory/60 hover:border-ivory/5 hover:bg-ivory/5 hover:text-ivory',
                      )}
                    >
                      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors', active ? 'bg-champagne text-midnight' : 'bg-ivory/5 text-ivory/60 group-hover:text-ivory')}>
                        <Icon className="h-4 w-4" strokeWidth={1.7} />
                      </span>
                      <AnimatePresence initial={false}>
                        {!isCollapsed && (
                          <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex-1 whitespace-nowrap overflow-hidden">
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <AnimatePresence initial={false}>
                        {!isCollapsed && (
                          <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
                            <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 transition-transform', active ? 'text-champagne' : 'text-ivory/25 group-hover:translate-x-0.5 group-hover:text-ivory/60')} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Link>
                  )

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          {linkContent}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-white text-midnight border-none font-medium ml-2 shadow-md">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return <div key={item.href}>{linkContent}</div>
                })}
              </div>
            </div>
          ))}
        </nav>

        <motion.div
          layout
          transition={{ layout: { duration: 0.28, ease: 'easeInOut' } }}
          className={cn("relative border-t transition-colors duration-300", isCollapsed ? "border-transparent p-3" : "border-ivory/10 p-4")}
        >
          <motion.div
            layout
            transition={{ layout: { duration: 0.28, ease: 'easeInOut' } }}
            className={cn("flex w-full items-center rounded-xl border border-ivory/10 bg-ivory/5 transition-all duration-300", isCollapsed ? "flex-col justify-center gap-2 p-1.5" : "gap-3 p-3")}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/panel/profil" className="block shrink-0 outline-none" onClick={onNavigate}>
                  <Avatar className="h-10 w-10 shrink-0 border border-champagne/40 transition-transform hover:scale-105">
                    {user?.picture && <AvatarImage src={user.picture} alt={user.name} />}
                    <AvatarFallback className="bg-midnight-700 font-serif text-sm text-champagne">{(user?.name || user?.email || '?').slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="bg-white text-midnight border-none font-medium ml-2 shadow-md">
                  Profilim
                </TooltipContent>
              )}
            </Tooltip>
            
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate text-sm text-ivory">{user?.name}</p>
                  <p className="truncate text-[11px] text-ivory/50">{user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onLogout} title={isCollapsed ? undefined : "Çıkış yap"} className={cn("shrink-0 text-ivory/50 transition-all duration-300 hover:bg-red-500/10 hover:text-red-400", isCollapsed ? "h-9 w-9 rounded-xl" : "h-8 w-8")}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="bg-white text-midnight border-none font-medium ml-2 shadow-md">
                  Çıkış Yap
                </TooltipContent>
              )}
            </Tooltip>
          </motion.div>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}

export function DashboardShell({ children }) {
  const { user, status, refresh, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [navSummary, setNavSummary] = useState({ status: 'loading' })
  const [summaryRefresh, setSummaryRefresh] = useState(0)
  const isAdmin = ['super_admin', 'admin', 'support'].includes(user?.role)

  useEffect(() => {
    if (user === false) router.replace(`/giris?next=${encodeURIComponent(pathname)}`)
  }, [user, pathname, router])

  useEffect(() => {
    if (!user || user === false) return
    let active = true
    setNavSummary((current) => current.status === 'ready' ? current : { status: 'loading' })
    const load = async (url) => {
      const response = await fetch(url, { credentials: 'include', cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Hesap özeti yüklenemedi.')
      return payload
    }
    const requests = [
      load('/api/billing/account'),
      load('/api/vip/requests?limit=1'),
      ...(isAdmin ? [load('/api/admin/vip-requests?status=pending&limit=1')] : []),
    ]
    Promise.all(requests)
      .then(([billing, vip, adminVip]) => {
        if (!active) return
        setNavSummary({
          status: 'ready',
          credits: billing.quotas?.eventCreditsRemaining ?? 0,
          vipTotal: vip.total ?? 0,
          pendingVip: adminVip?.total ?? 0,
        })
      })
      .catch(() => {
        if (active) setNavSummary((current) => current.status === 'ready'
          ? current
          : { status: 'error', message: 'Hesap özeti alınamadı. Bağlantınızı kontrol edip yeniden deneyin.' })
      })
    return () => { active = false }
  }, [user?.id, isAdmin, pathname, summaryRefresh])

  useEffect(() => {
    const refreshSummary = () => setSummaryRefresh((count) => count + 1)
    window.addEventListener('vip-request-updated', refreshSummary)
    return () => window.removeEventListener('vip-request-updated', refreshSummary)
  }, [])

  const onLogout = async () => { await logout(); router.replace('/') }
  const headerTitle = pathname.startsWith('/panel/admin/vip-talepler')
    ? 'VIP talep yönetimi'
    : pathname.startsWith('/panel/admin')
      ? 'Yönetim paneli'
      : pathname.startsWith('/panel/vip-taleplerim')
        ? 'VIP taleplerim'
        : pathname.startsWith('/panel/paketim')
          ? 'Paket ve krediler'
          : 'Etkinlik stüdyosu'

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <div className="text-center">
          <Logo />
          {status === 'error' ? (
            <>
              <p className="mt-6 text-sm text-muted-foreground">Oturum doğrulanamadı. Bağlantınızı kontrol edip yeniden deneyin.</p>
              <Button variant="outline" onClick={refresh} className="mt-4">Yeniden dene</Button>
            </>
          ) : (
            <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{user === null ? 'Oturum kontrol ediliyor…' : 'Yönlendiriliyor…'}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-ivory overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-30 hidden h-full shrink-0 border-r border-ivory/10 shadow-[8px_0_24px_rgba(15,23,42,0.08)] lg:block"
      >
        {/* Toggle Button placed outside overflow-hidden */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-8 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-ivory/20 bg-midnight text-champagne shadow-[0_4px_15px_rgba(0,0,0,0.5)] transition-all hover:bg-champagne hover:text-midnight hover:scale-110"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", isCollapsed && "rotate-180")} />
        </button>

        <div className="sticky top-0 h-screen w-full">
          <SidebarContent 
            pathname={pathname} 
            user={user} 
            onLogout={onLogout} 
            isCollapsed={isCollapsed}
          />
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-midnight/15 bg-ivory px-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)] sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <div className="lg:hidden"><Logo /></div>
            <p className="hidden truncate text-sm font-medium text-midnight lg:block">
              {headerTitle}
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {navSummary.status === 'ready' && (
              isAdmin ? (
                <Link href="/panel/admin/vip-talepler" className="inline-flex h-9 items-center gap-2 rounded-xl border border-midnight/10 bg-white px-2.5 text-xs font-medium text-midnight shadow-sm transition hover:border-champagne/70 hover:bg-champagne/10 sm:px-3">
                  <Gift className="h-4 w-4 text-champagne-dark" />
                  <span className="hidden sm:inline">Bekleyen VIP</span>
                  <span className="font-semibold tabular-nums">{navSummary.pendingVip}</span>
                </Link>
              ) : (
                <>
                  <Link href="/panel/paketim" className="inline-flex h-9 items-center gap-2 rounded-xl border border-midnight/10 bg-white px-2.5 text-xs font-medium text-midnight shadow-sm transition hover:border-champagne/70 hover:bg-champagne/10 sm:px-3">
                    <CreditCard className="h-4 w-4 text-champagne-dark" />
                    <span className="hidden sm:inline">Kalan kredi</span>
                    <span className="font-semibold tabular-nums">{navSummary.credits}</span>
                  </Link>
                  <Link href="/panel/vip-taleplerim" className="inline-flex h-9 items-center gap-2 rounded-xl border border-midnight/10 bg-white px-2.5 text-xs font-medium text-midnight shadow-sm transition hover:border-champagne/70 hover:bg-champagne/10 sm:px-3">
                    <Gift className="h-4 w-4 text-champagne-dark" />
                    <span className="hidden sm:inline">VIP talepleri</span>
                    <span className="font-semibold tabular-nums">{navSummary.vipTotal}</span>
                  </Link>
                </>
              )
            )}
            {navSummary.status === 'error' && (
              <button type="button" onClick={() => setSummaryRefresh((count) => count + 1)} className="hidden rounded-xl border border-destructive/20 bg-white px-3 py-2 text-[10px] text-destructive sm:block" title={navSummary.message}>
                Hesap özeti yenilenemedi · Yenile
              </button>
            )}
            <NotificationBell />
            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Menü"><Menu className="h-5 w-5" /></Button></SheetTrigger>
                <SheetContent side="left" className="w-[280px] border-0 bg-midnight p-0">
                  <SheetTitle className="sr-only">Menü</SheetTitle>
                  <SidebarContent pathname={pathname} user={user} onLogout={onLogout} onNavigate={() => setMobileMenuOpen(false)} isCollapsed={false} />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        {/* Main Content Container */}
        <main className={cn('min-w-0 flex-1 relative z-0 overflow-y-auto overflow-x-hidden', !pathname.includes('/duzenle') && !pathname.endsWith('/yeni') && !pathname.endsWith('/site') && 'px-5 py-8 sm:px-8 lg:px-12 lg:py-12')}>
          {children}
        </main>
      </div>
    </div>
  )
}
