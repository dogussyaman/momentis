'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Logo } from '@/components/shared/logo'
import { NAV_LINKS } from '@/lib/data/site'
import { useAuth } from '@/components/auth/auth-provider'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const overHero = pathname === '/' && !scrolled
  const tone = overHero ? 'light' : 'dark'

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled ? 'border-b border-border/70 bg-ivory/85 backdrop-blur-xl' : 'bg-transparent'
      )}
      data-testid="navbar"
    >
      <div className="container flex h-20 items-center justify-between">
        <Logo tone={tone} />

        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative text-[13px] font-medium uppercase tracking-[0.18em] transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-champagne after:transition-all after:duration-500 hover:after:w-full',
                overHero ? 'text-ivory/80 hover:text-ivory' : 'text-midnight/70 hover:text-midnight',
                pathname.startsWith(link.href) && 'after:w-full'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Button asChild className="rounded-2xl bg-champagne px-6 text-[13px] uppercase tracking-[0.16em] text-midnight hover:bg-champagne-dark">
              <Link href="/panel" data-testid="nav-panel">Panelim</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className={cn('text-[13px] uppercase tracking-[0.16em]', overHero ? 'text-ivory hover:bg-ivory/10 hover:text-ivory' : 'text-midnight hover:bg-midnight/5')}>
                <Link href="/giris" data-testid="nav-login">Giriş Yap</Link>
              </Button>
              <Button asChild className="rounded-2xl bg-champagne px-6 text-[13px] uppercase tracking-[0.16em] text-midnight hover:bg-champagne-dark">
                <Link href="/kayit" data-testid="nav-register">Hemen Başla</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className={cn('md:hidden', overHero ? 'text-ivory hover:bg-ivory/10 hover:text-ivory' : 'text-midnight')} aria-label="Menü" data-testid="nav-mobile-toggle">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] border-l-border bg-ivory sm:max-w-sm">
            <SheetTitle className="sr-only">Menü</SheetTitle>
            <div className="mt-4 flex h-full flex-col">
              <Logo />
              <nav className="mt-12 flex flex-col gap-6">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="font-serif text-3xl text-midnight">
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3 pb-8">
                {user ? (
                  <Button asChild className="rounded-2xl bg-champagne uppercase tracking-[0.16em] text-midnight hover:bg-champagne-dark">
                    <Link href="/panel" onClick={() => setOpen(false)}>Panelim</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="rounded-2xl border-midnight uppercase tracking-[0.16em]">
                      <Link href="/giris" onClick={() => setOpen(false)}>Giriş Yap</Link>
                    </Button>
                    <Button asChild className="rounded-2xl bg-champagne uppercase tracking-[0.16em] text-midnight hover:bg-champagne-dark">
                      <Link href="/kayit" onClick={() => setOpen(false)}>Hemen Başla</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
