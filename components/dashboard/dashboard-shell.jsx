'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutGrid, PlusCircle, Palette, Send, LogOut, Menu, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Logo } from '@/components/shared/logo'
import { useAuth } from '@/components/auth/auth-provider'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/panel', label: 'Etkinliklerim', icon: LayoutGrid, exact: true },
  { href: '/panel/yeni', label: 'Yeni Etkinlik', icon: PlusCircle },
  { href: '/tasarimlar', label: 'Tasarımlar', icon: Palette, external: true },
  { href: '/gonderim-testi', label: 'Gönderim Testi', icon: Send, external: true },
]

function SidebarContent({ pathname, user, onLogout }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pt-8"><Logo tone="light" /></div>
      <nav className="mt-12 flex flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 px-3 py-3 text-[12px] uppercase tracking-[0.18em] transition-colors', active ? 'bg-ivory/10 text-ivory' : 'text-ivory/60 hover:bg-ivory/5 hover:text-ivory')} data-testid={`sidebar-${item.href.replace(/\//g, '-').slice(1)}`}>
              <Icon className="h-4 w-4" strokeWidth={1.5} /> {item.label}
              {item.external && <ExternalLink className="ml-auto h-3 w-3 opacity-50" />}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto border-t border-ivory/10 p-5">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-champagne/40">
            {user?.picture && <AvatarImage src={user.picture} alt={user.name} />}
            <AvatarFallback className="bg-midnight-700 font-serif text-sm text-champagne">{(user?.name || user?.email || '?').slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ivory" data-testid="sidebar-user-name">{user?.name}</p>
            <p className="truncate text-[11px] text-ivory/50">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-ivory/60 hover:bg-ivory/10 hover:text-ivory" aria-label="Çıkış yap" data-testid="logout-button"><LogOut className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  )
}

export function DashboardShell({ children }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

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
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden bg-midnight lg:block lg:min-h-screen" data-testid="dashboard-sidebar">
        <div className="sticky top-0 h-screen"><SidebarContent pathname={pathname} user={user} onLogout={onLogout} /></div>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-ivory/80 px-5 backdrop-blur lg:hidden">
          <Logo />
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Menü"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-[280px] border-0 bg-midnight p-0">
              <SheetTitle className="sr-only">Menü</SheetTitle>
              <SidebarContent pathname={pathname} user={user} onLogout={onLogout} />
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">{children}</main>
      </div>
    </div>
  )
}
