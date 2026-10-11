'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Menu, Sparkles, X } from 'lucide-react'
import GooeyNav, { type GooeyNavItem } from '@/components/GooeyNav'
import { Button } from '@/components/ui/button'

const items: GooeyNavItem[] = [
  { label: 'Ana Sayfa', href: '#home' },
  { label: 'Çiftimiz', href: '#couple' },
  { label: 'Düğün', href: '#details' },
  { label: 'Galeri', href: '#gallery' },
  { label: 'RSVP', href: '#rsvp' },
]

export function Ozel1Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const scrollRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-40 transition-all duration-500',
        scrolled
          ? 'px-3 pt-3 sm:px-6'
          : 'px-0 pt-0',
      ].join(' ')}
    >
      <div
        className={[
          'mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-5 transition-all duration-500 sm:px-8',
          scrolled
            ? 'h-[54px] rounded-full bg-[#1e1c19]/80 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl ring-1 ring-white/10'
            : 'h-[76px] bg-gradient-to-b from-black/50 via-black/20 to-transparent',
        ].join(' ')}
      >
        {/* Logo */}
        <Link
          href="#home"
          className="inline-flex items-center gap-2 text-white transition-opacity duration-300 hover:opacity-80"
          aria-label="Lal ve Emir ana sayfa"
        >
          <Sparkles className="h-4 w-4 text-[#e7c98f]" />
          <span className="font-serif text-base tracking-wide sm:text-lg">
            Lal <i className="text-[#e7c98f]">&</i> Emir
          </span>
        </Link>

        {/* Desktop GooeyNav */}
        <div className="hidden justify-self-center md:block">
          <GooeyNav
            items={items}
            initialActiveIndex={0}
            theme="dark"
            size="md"
            frame={false}
            particleCount={15}
            spread={56}
            animationTime={600}
            timeVariance={300}
            gooeyness={0.5}
            wobble={0.5}
            hoverEffect
            color="#e7c98f"
            activeTextColor="#332a20"
            className={scrolled ? '' : 'mix-blend-difference'}
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center justify-self-end gap-2">
          <Link
            href="#rsvp"
            className="rounded-full px-3 py-2 text-[8px] font-medium uppercase tracking-[0.12em] text-white/80 transition hover:text-[#e7c98f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-4 sm:text-[9px] sm:tracking-[0.16em]"
          >
            Katılım bildir
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? 'Demo site menüsünü kapat' : 'Demo site menüsünü aç'}
            aria-expanded={menuOpen}
            aria-controls="ozel-1-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="text-white/80 transition hover:bg-white/10 hover:text-white md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Mobile menu dropdown */}
          {menuOpen && (
            <nav
              id="ozel-1-mobile-menu"
              aria-label="Mobil demo site gezinme"
              className="absolute right-3 top-full z-[60] mt-1 w-[min(85vw,360px)] rounded-2xl border border-[#e9e1d5] bg-[#fbf8f2] p-3 text-midnight shadow-xl md:hidden"
            >
              <p className="px-3 py-2 font-serif text-lg">Lal & Emir</p>
              <div className="mt-1 flex flex-col gap-1">
                {items.map((item) => (
                  <Link
                    href={item.href || '#home'}
                    key={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-3 text-sm transition hover:bg-midnight/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b18d58]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}