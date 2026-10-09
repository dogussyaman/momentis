'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowDown, AudioLines, Heart, Pause, Play, Volume2 } from 'lucide-react'
import { SITE_AUDIO_LIBRARY } from '@/lib/site-builder/media'
import type { WeddingSite } from '@/lib/site-builder/schema'
import { sectionRegistry } from './sections'
import { SiteRenderProvider, useSiteRender } from './render/primitives'
import { loadGoogleFonts } from '@/lib/site-builder/fonts'
import { getSiteRootStyle } from '@/lib/site-builder/render-style'
import { SECTION_DEFINITIONS } from '@/lib/site-builder/definitions'

export function SiteNavigation({ site }: { site: WeddingSite }) {
  const { mode } = useSiteRender()
  const [scrolled, setScrolled] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  useEffect(() => {
    let scrollTarget: Window | HTMLElement = window
    let parent = navRef.current?.parentElement ?? null
    while (parent) {
      const overflowY = window.getComputedStyle(parent).overflowY
      if (overflowY === 'auto' || overflowY === 'scroll') {
        scrollTarget = parent
        break
      }
      parent = parent.parentElement
    }
    const onScroll = () => {
      const scrollTop = scrollTarget instanceof HTMLElement ? scrollTarget.scrollTop : window.scrollY
      setScrolled(scrollTop > 40)
    }
    onScroll()
    scrollTarget.addEventListener('scroll', onScroll, { passive: true })
    return () => scrollTarget.removeEventListener('scroll', onScroll)
  }, [])

  const navStyle = site.settings.navStyle ?? 'bar'
  const navigationSections = site.sections.filter((section) =>
    section.visible && ['couple', 'story', 'event', 'schedule', 'gallery', 'rsvp'].includes(section.type)
  )
  const rsvp = navigationSections.find((section) => section.type === 'rsvp')
  const links = navigationSections.filter((section) => section.id !== rsvp?.id)
  const coupleSection = site.sections.find((section) => section.type === 'couple')
  const sectionNames = [coupleSection?.props.brideName, coupleSection?.props.groomName]
    .filter((value) => typeof value === 'string' && value && !value.includes('{{'))
  const coupleNames = sectionNames.length
    ? sectionNames
    : [site.settings.brideName, site.settings.groomName].filter(Boolean)
  const name = coupleNames.join(' & ') || site.title
  const initials = coupleNames.map((n) => String(n)[0]).join(' & ')
  const labelOf = (section: WeddingSite['sections'][number]) => {
    const definition = SECTION_DEFINITIONS.find((item) => item.type === section.type)
    return section.type === 'couple' ? 'Çift' : section.type === 'story' ? 'Hikâyemiz' : definition?.name || section.name || section.type
  }

  const linkEls = links.map((section) => (
    <a key={section.id} href={`#section-${section.id}`} onClick={(event) => { if (mode === 'editor') event.preventDefault() }} className="shrink-0 rounded-full px-3.5 py-2 text-[11px] uppercase tracking-[0.16em] opacity-70 transition hover:bg-current/[0.07] hover:opacity-100">{labelOf(section)}</a>
  ))
  const cta = rsvp && (
    <a href={`#section-${rsvp.id}`} onClick={(event) => { if (mode === 'editor') event.preventDefault() }} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full sb-bg-accent px-5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--sb-on-accent)] shadow-sm transition hover:-translate-y-0.5 hover:opacity-90">Katılım <ArrowDown className="h-3 w-3" /></a>
  )
  const brand = (
    <a href="#site-start" onClick={(event) => { if (mode === 'editor') event.preventDefault() }} className="flex min-w-0 items-center gap-2.5" aria-label="Sayfa başına dön">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-current/20 sb-accent"><Heart className="h-3.5 w-3.5" /></span>
      <span className="truncate text-sm sb-heading">{name}</span>
    </a>
  )

  if (navStyle === 'centered') {
    return (
      <nav ref={navRef} aria-label="Davet sitesi gezinme" className="sticky top-0 z-40 border-b border-current/10 bg-[color-mix(in_srgb,var(--sb-bg)_90%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-1 px-4 py-3">
          <a href="#site-start" onClick={(event) => { if (mode === 'editor') event.preventDefault() }} className="sb-script sb-accent text-3xl leading-none">{initials || name}</a>
          <div className="sb-no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto">{linkEls}{cta}</div>
        </div>
      </nav>
    )
  }

  if (navStyle === 'floating') {
    return (
      <nav ref={navRef} aria-label="Davet sitesi gezinme" className="sticky top-3 z-40 mx-auto -mb-16 w-[calc(100%-1.5rem)] max-w-5xl">
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
      <nav ref={navRef} aria-label="Davet sitesi gezinme" className={`sticky top-0 z-40 -mb-[72px] transition-all duration-300 ${scrolled ? 'border-b border-current/10 bg-[color-mix(in_srgb,var(--sb-bg)_88%,transparent)] shadow-[0_8px_30px_-22px_rgba(0,0,0,0.45)] backdrop-blur-xl' : 'border-b border-transparent bg-transparent'}`}>
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-10">
          <a href="#site-start" onClick={(event) => { if (mode === 'editor') event.preventDefault() }} className={`sb-script text-3xl leading-none transition-colors ${scrolled ? 'sb-accent' : 'text-white'}`}>{initials || name}</a>
          <div className={`sb-no-scrollbar hidden items-center gap-1 overflow-x-auto md:flex ${scrolled ? '' : 'text-white'}`}>{linkEls}</div>
          {cta}
        </div>
      </nav>
    )
  }

  return (
    <nav ref={navRef} aria-label="Davet sitesi gezinme" className="sticky top-0 z-40 border-b border-current/[0.08] bg-[color-mix(in_srgb,var(--sb-bg)_86%,transparent)] shadow-[0_8px_30px_-22px_rgba(0,0,0,0.45)] backdrop-blur-xl">
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
        style={getSiteRootStyle(site, textScale, viewportHeight)}
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
        <SiteMusicPlayer site={site} mode={mode} />
      </div>
    </SiteRenderProvider>
  )
}

function SiteMusicPlayer({ site, mode }: { site: WeddingSite; mode: 'live' | 'preview' }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [playbackError, setPlaybackError] = useState('')
  const src = site.settings.musicEnabled ? site.settings.musicUrl : undefined
  const track = SITE_AUDIO_LIBRARY.find((item) => item.src === src)
  const trackName = track?.label || src?.split('/').pop()?.split('?')[0] || 'Seçilen parça'

  useEffect(() => {
    audioRef.current?.pause()
    setPlaying(false)
    setPlaybackError('')
  }, [src])

  if (!src) return null

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio) return
    setPlaybackError('')
    if (!audio.paused) {
      audio.pause()
      return
    }
    try {
      await audio.play()
    } catch {
      setPlaybackError('Müzik oynatılamadı. Ses bağlantısını kontrol edin.')
    }
  }

  return (
    <div className={`z-50 ${mode === 'preview' ? 'absolute' : 'fixed'} bottom-4 right-4 flex max-w-[calc(100%-2rem)] flex-col items-end gap-1.5 sm:bottom-6 sm:right-6`}>
      <audio
        ref={audioRef}
        src={src}
        loop
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
      {playbackError && <p role="status" className="max-w-64 rounded-xl bg-white px-3 py-2 text-[10px] text-red-600 shadow-lg">{playbackError}</p>}
      <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 py-2 pl-3 pr-2 text-midnight shadow-[0_12px_40px_-16px_rgba(16,24,39,0.38)] ring-1 ring-black/[0.04] backdrop-blur-xl sm:gap-3.5 sm:py-2.5 sm:pl-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3eadb] text-[#9a7136] ${playing ? 'animate-pulse' : ''}`}>
          <AudioLines className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[8px] font-semibold uppercase tracking-[0.17em] text-[#9a7136]">Davetin sesi</p>
          <p className="mt-0.5 max-w-40 truncate font-serif text-xs sm:max-w-52 sm:text-sm">{trackName}</p>
          <p className="mt-0.5 text-[9px] text-midnight/55">{playing ? 'Şu an çalıyor' : 'Dinlemek için başlatın'}</p>
        </div>
        <button
          type="button"
          onClick={() => void togglePlayback()}
          aria-label={playing ? 'Müziği duraklat' : 'Müziği başlat'}
          className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-midnight px-3.5 text-white shadow-sm transition hover:bg-midnight/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b89966] focus-visible:ring-offset-2 sm:px-4"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
          <span className="text-[10px] font-medium">{playing ? 'Durdur' : 'Müziği aç'}</span>
        </button>
        <Volume2 className="mr-1 hidden h-4 w-4 shrink-0 text-midnight/35 sm:block" aria-hidden="true" />
      </div>
    </div>
  )
}
