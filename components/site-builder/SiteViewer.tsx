'use client'
import { useEffect } from 'react'
import { ArrowDown, Heart } from 'lucide-react'
import type { WeddingSite } from '@/lib/site-builder/schema'
import { sectionRegistry } from './sections'
import { SiteRenderProvider } from './render/primitives'
import { loadGoogleFonts } from '@/lib/site-builder/fonts'
import { SECTION_DEFINITIONS } from '@/lib/site-builder/definitions'

function SiteNavigation({ site }: { site: WeddingSite }) {
  const navigationSections = site.sections.filter((section) =>
    section.visible && ['couple', 'story', 'event', 'gallery', 'album', 'rsvp'].includes(section.type)
  )
  const rsvp = navigationSections.find((section) => section.type === 'rsvp')
  const coupleNames = [site.settings.brideName, site.settings.groomName].filter(Boolean)

  return (
    <nav aria-label="Davet sitesi gezinme" className="sticky top-0 z-40 border-b border-current/[0.08] bg-[color-mix(in_srgb,var(--sb-bg)_86%,transparent)] shadow-[0_8px_30px_-22px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-8">
        <a href="#site-start" className="flex min-w-0 items-center gap-2.5" aria-label="Sayfa başına dön">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/15 text-[10px] sb-accent"><Heart className="h-3.5 w-3.5" /></span>
          <span className="truncate font-serif text-sm">{coupleNames.join(' & ') || site.title}</span>
        </a>
        <div className="sb-no-scrollbar flex items-center gap-1 overflow-x-auto">
          {navigationSections.filter((section) => section.id !== rsvp?.id).map((section) => {
            const definition = SECTION_DEFINITIONS.find((item) => item.type === section.type)
            const label = section.type === 'couple' ? 'Çift' : definition?.name || section.name || section.type
            return <a key={section.id} href={`#section-${section.id}`} className="shrink-0 rounded-full px-3 py-2 text-[10px] text-current/65 transition hover:bg-current/[0.06] hover:text-current">{label}</a>
          })}
          {rsvp && <a href={`#section-${rsvp.id}`} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full sb-bg-accent px-4 text-[10px] font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90">Katılım <ArrowDown className="h-3 w-3" /></a>}
        </div>
      </div>
    </nav>
  )
}

export function SiteViewer({ site, mode = 'live' }: { site: WeddingSite; mode?: 'live' | 'preview' }) {
  useEffect(() => {
    loadGoogleFonts([site.theme.headingFont, site.theme.bodyFont, site.theme.scriptFont])
  }, [site.theme.headingFont, site.theme.bodyFont, site.theme.scriptFont])

  if (!site) return null

  return (
    <SiteRenderProvider value={{ site, mode }}>
      <div 
        id="site-start"
        data-site-root
        className="sb-root relative flex min-h-screen w-full flex-col" 
        style={{ 
          backgroundColor: site.theme.backgroundColor, 
          color: site.theme.textColor,
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
