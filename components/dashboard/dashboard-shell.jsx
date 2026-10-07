'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Plus, PanelsTopLeft, Send, LogOut, Menu, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Logo } from '@/components/shared/logo'
import { useAuth } from '@/components/auth/auth-provider'
import { cn } from '@/lib/utils'

const NAV_GROUPS = [
  {
    label: 'Çalışma Alanı',
    items: [
      { href: '/panel', label: 'Etkinliklerim', icon: LayoutDashboard, isActive: (pathname) => pathname === '/panel' || pathname.startsWith('/panel/etkinlik/') },
      { href: '/panel/yeni', label: 'Yeni Etkinlik', icon: Plus },
    ],
  },
  {
    label: 'Keşfet',
    items: [
      { href: '/panel/sablonlar', label: 'Site Şablonları', icon: PanelsTopLeft },
    ],
  },
  {
    label: 'Araçlar',
    items: [
      { href: '/panel/gonderim-testi', label: 'Gönderim Testi', icon: Send },
    ],
  },
]

function SidebarContent({ pathname, user, onLogout, onNavigate }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-midnight via-midnight to-midnight-700">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-champagne/10 blur-3xl" />
      <div className="relative border-b border-ivory/10 px-6 pb-6 pt-7">
        <Logo tone="light" />
        <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.24em] text-ivory/45">Etkinlik stüdyosu</p>
      </div>
      <nav className="relative flex-1 space-y-7 overflow-y-auto px-4 py-7">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-ivory/35">{group.label}</p>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = item.isActive ? item.isActive(pathname) : item.exact ? pathname === item.href : pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={onNavigate}
                    className={cn(
                      'group flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                      active
                        ? 'border-ivory/10 bg-ivory/10 text-ivory shadow-sm'
                        : 'border-transparent text-ivory/60 hover:border-ivory/5 hover:bg-ivory/5 hover:text-ivory',
                    )}
                    data-testid={`sidebar-${item.href.replace(/\//g, '-').slice(1)}`}
                  >
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition-colors', active ? 'bg-champagne text-midnight' : 'bg-ivory/5 text-ivory/60 group-hover:text-ivory')}>
                      <Icon className="h-4 w-4" strokeWidth={1.7} />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', active ? 'text-champagne' : 'text-ivory/25 group-hover:translate-x-0.5 group-hover:text-ivory/60')} />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="relative border-t border-ivory/10 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-ivory/10 bg-ivory/5 p-3">
          <Avatar className="h-10 w-10 border border-champagne/40">
            {user?.picture && <AvatarImage src={user.picture} alt={user.name} />}
            <AvatarFallback className="bg-midnight-700 font-serif text-sm text-champagne">{(user?.name || user?.email || '?').slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ivory" data-testid="sidebar-user-name">{user?.name}</p>
            <p className="truncate text-[11px] text-ivory/50">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="h-8 w-8 text-ivory/50 hover:bg-ivory/10 hover:text-ivory" aria-label="Çıkış yap" data-testid="logout-button"><LogOut className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  )
}

export function DashboardShell({ children }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (user === false) router.replace(`/giris?next=${encodeURIComponent(pathname)}`)
  }, [user, pathname, router])

  const onLogout = async () => { await logout(); router.replace('/') }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <div className="text-center">
          <Logo />
          <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{user === null ? 'Oturum kontrol ediliyor…' : 'Yönlendiriliyor…'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="hidden lg:block lg:min-h-screen" data-testid="dashboard-sidebar">
        <div className="sticky top-0 h-screen"><SidebarContent pathname={pathname} user={user} onLogout={onLogout} /></div>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-ivory/80 px-5 backdrop-blur lg:hidden">
          <Logo />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Menü"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-[300px] border-0 bg-midnight p-0">
              <SheetTitle className="sr-only">Menü</SheetTitle>
            <SidebarContent pathname={pathname} user={user} onLogout={onLogout} onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>
        <main className={cn('flex-1', !pathname.includes('/duzenle') && !pathname.endsWith('/yeni') && 'px-5 py-8 sm:px-8 lg:px-12 lg:py-12')}>{children}</main>
      </div>
    </div>
  )
}
