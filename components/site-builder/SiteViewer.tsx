'use client'
import { useEffect, useState } from 'react'
import { ArrowDown, Heart } from 'lucide-react'
import type { WeddingSite } from '@/lib/site-builder/schema'
import { sectionRegistry } from './sections'
import { SiteRenderProvider } from './render/primitives'
import { loadGoogleFonts } from '@/lib/site-builder/fonts'
import { SECTION_DEFINITIONS } from '@/lib/site-builder/definitions'

function SiteNavigation({ site }: { site: WeddingSite }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navStyle = site.settings.navStyle ?? 'bar'
  const navigationSections = site.sections.filter((section) =>
    section.visible && ['couple', 'story', 'event', 'schedule', 'gallery', 'rsvp'].includes(section.type)
  )
  const rsvp = navigationSections.find((section) => section.type === 'rsvp')
  const links = navigationSections.filter((section) => section.id !== rsvp?.id)
  const coupleNames = [site.settings.brideName, site.settings.groomName].filter(Boolean)
  const name = coupleNames.join(' & ') || site.title
  const initials = coupleNames.map((n) => String(n)[0]).join(' & ')
  const labelOf = (section: WeddingSite['sections'][number]) => {
    const definition = SECTION_DEFINITIONS.find((item) => item.type === section.type)
    return section.type === 'couple' ? 'Çift' : section.type === 'story' ? 'Hikâyemiz' : definition?.name || section.name || section.type
  }

  const linkEls = links.map((section) => (
    <a key={section.id} href={`#section-${section.id}`} className="shrink-0 rounded-full px-3.5 py-2 text-[11px] uppercase tracking-[0.16em] opacity-70 transition hover:bg-current/[0.07] hover:opacity-100">{labelOf(section)}</a>
  ))
  const cta = rsvp && (
    <a href={`#section-${rsvp.id}`} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full sb-bg-accent px-5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--sb-on-accent)] shadow-sm transition hover:-translate-y-0.5 hover:opacity-90">Katılım <ArrowDown className="h-3 w-3" /></a>
  )
  const brand = (
    <a href="#site-start" className="flex min-w-0 items-center gap-2.5" aria-label="Sayfa başına dön">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-current/20 sb-accent"><Heart className="h-3.5 w-3.5" /></span>
      <span className="truncate text-sm sb-heading">{name}</span>
    </a>
  )

  if (navStyle === 'centered') {
    return (
      <nav aria-label="Davet sitesi gezinme" className="sticky top-0 z-40 border-b border-current/10 bg-[color-mix(in_srgb,var(--sb-bg)_90%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-1 px-4 py-3">
          <a href="#site-start" className="sb-script sb-accent text-3xl leading-none">{initials || name}</a>
          <div className="sb-no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto">{linkEls}{cta}</div>
        </div>
      </nav>
    )
  }

  if (navStyle === 'floating') {
    return (
      <nav aria-label="Davet sitesi gezinme" className="sticky top-3 z-40 mx-auto -mb-16 w-[calc(100%-1.5rem)] max-w-5xl">
        <div className={`flex min-h-14 items-center justify-between gap-3 rounded-full border border-current/10 px-3 pl-4 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 ${scrolled ? 'bg-[color-mix(in_srgb,var(--sb-bg)_92%,transparent)]' : 'bg-[color-mix(in_srgb,var(--sb-bg)_70%,transparent)]'}`}>
          {brand}
          <div className="sb-no-scrollbar hidden items-center gap-0.5 overflow-x-auto md:flex">{linkEls}</div>
          {cta}
        </div>
      </nav>
    )
  }

  if (navStyle === 'transparent') {
    return (
      <nav aria-label="Davet sitesi gezinme" className={`sticky top-0 z-40 -mb-[72px] transition-all duration-300 ${scrolled ? 'border-b border-current/10 bg-[color-mix(in_srgb,var(--sb-bg)_88%,transparent)] shadow-[0_8px_30px_-22px_rgba(0,0,0,0.45)] backdrop-blur-xl' : 'border-b border-transparent bg-transparent'}`}>
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-10">
          <a href="#site-start" className={`sb-script text-3xl leading-none transition-colors ${scrolled ? 'sb-accent' : 'text-white'}`}>{initials || name}</a>
          <div className={`sb-no-scrollbar hidden items-center gap-1 overflow-x-auto md:flex ${scrolled ? '' : 'text-white'}`}>{linkEls}</div>
          {cta}
        </div>
      </nav>
    )
  }

  return (
    <nav aria-label="Davet sitesi gezinme" className="sticky top-0 z-40 border-b border-current/[0.08] bg-[color-mix(in_srgb,var(--sb-bg)_86%,transparent)] shadow-[0_8px_30px_-22px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-8">
        {brand}
        <div className="sb-no-scrollbar flex items-center gap-1 overflow-x-auto">{linkEls}{cta}</div>
      </div>
    </nav>
  )
}

export function SiteViewer({ site, mode = 'live', viewportHeight, textScale = 100 }: { site: WeddingSite; mode?: 'live' | 'preview'; viewportHeight?: number; textScale?: number }) {
  useEffect(() => {
    loadGoogleFonts([site.theme.headingFont, site.theme.bodyFont, site.theme.scriptFont])
  }, [site.theme.headingFont, site.theme.bodyFont, site.theme.scriptFont])

  if (!site) return null

  return (
    <SiteRenderProvider value={{ site, mode }}>
      <div 
        id="site-start"
        data-site-root
        className={`sb-root relative flex w-full flex-col ${viewportHeight ? '' : 'min-h-screen'}`}
        style={{ 
          backgroundColor: site.theme.backgroundColor, 
          color: site.theme.textColor,
          minHeight: viewportHeight ? `${viewportHeight}px` : undefined,
          fontSize: `${textScale}%`,
          '--sb-bg': site.theme.backgroundColor,
          '--sb-text': site.theme.textColor,
          '--sb-accent': site.theme.accentColor,
          '--sb-surface': site.theme.surfaceColor,
          '--sb-line': `${site.theme.textColor}1a`,
          '--sb-on-accent': site.theme.backgroundColor,
          '--sb-heading-font': `'${site.theme.headingFont}', serif`,
          '--sb-body-font': `'${site.theme.bodyFont}', sans-serif`,
          '--sb-script-font': `'${site.theme.scriptFont}', cursive`,
          '--sb-radius': `${site.theme.borderRadius}px`,
          '--sb-btn-radius': `${site.theme.buttonRadius}px`,
          '--sb-heading-scale': site.theme.headingScale,
          '--sb-heading-tracking': site.theme.letterSpacing === 'tight' ? '-0.03em' : site.theme.letterSpacing === 'wide' ? '0.06em' : 'normal',
          '--sb-screen': viewportHeight ? `${viewportHeight}px` : '100vh',
        } as any}
      >
        {site.settings.showNavbar !== false && <SiteNavigation site={site} />}
        {site.sections.filter(s => s.visible).map((section) => {
          const Component = sectionRegistry[section.type]?.component
          if (!Component) return null
          
          return (
            <div key={section.id} id={`section-${section.id}`}>
              <Component section={section} props={section.props} />
            </div>
          )
        })}
      </div>
    </SiteRenderProvider>
  )
}
