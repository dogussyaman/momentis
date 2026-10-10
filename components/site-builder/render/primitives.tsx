'use client'

import { createContext, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ButtonConfig, SectionAnimation, SectionStyle, SiteSection, WeddingSite } from '@/lib/site-builder/schema'
import { runButtonAction } from '@/lib/site-builder/actions'
import type { SiteOverlayElement } from '@/lib/site-builder/schema'
import { useSiteEditorStore } from '@/store/site-editor-store'

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

export type RenderMode = 'editor' | 'live' | 'preview'

interface SiteRenderCtx {
  site: WeddingSite
  mode: RenderMode
}

const SiteCtx = createContext<SiteRenderCtx | null>(null)
export const SiteRenderProvider = SiteCtx.Provider
const EditableSectionCtx = createContext<SiteSection | null>(null)

export function useSiteRender() {
  const ctx = useContext(SiteCtx)
  if (!ctx) throw new Error('useSiteRender must be used inside SiteRenderProvider')
  return ctx
}

export function editableTextAttributes(section: SiteSection, key: string, mode: RenderMode) {
  return {
    'data-editable-section': section.id,
    'data-editable-key': key,
    contentEditable: mode === 'editor',
    suppressContentEditableWarning: true,
    spellCheck: false,
  }
}

export function editableTextStyle(props: Record<string, any>, key: string): CSSProperties {
  return props.inlineStyles?.[key] ?? {}
}

export interface SectionComponentProps {
  section: SiteSection
  props: Record<string, any>
}

/* ------------------------------------------------------------------ */
/*  Animation                                                          */
/* ------------------------------------------------------------------ */

const AnimCtx = createContext<SectionAnimation>({ type: 'none' })

function hiddenFor(type: SectionAnimation['type']) {
  switch (type) {
    case 'fade':
      return { opacity: 0 }
    case 'slide-up':
      return { opacity: 0, y: 16 }
    case 'slide-left':
      return { opacity: 0, x: 60 }
    case 'slide-right':
      return { opacity: 0, x: -60 }
    case 'zoom':
      return { opacity: 0, scale: 0.92 }
    case 'blur':
      return { opacity: 0, filter: 'blur(12px)' }
    case 'scale-blur':
      return { opacity: 0, scale: 0.7, filter: 'blur(20px)' }
    default:
      return {}
  }
}

/** Child element that animates in when its parent section enters the viewport. */
export function Reveal({ children, className, style, as = 'div' }: { children: ReactNode; className?: string; style?: CSSProperties; as?: 'div' | 'li' | 'span' }) {
  const anim = useContext(AnimCtx)
  const { mode } = useSiteRender()
  const prefersReducedMotion = useReducedMotion()
  
  const variants: Variants = useMemo(
    () => ({
      hidden: hiddenFor(anim.type),
      show: {
        opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)',
        transition: { duration: anim.duration ?? 0.8, ease: [0.22, 1, 0.36, 1] },
      },
    }),
    [anim.type, anim.duration],
  )
  
  const M = as === 'li' ? motion.li : as === 'span' ? motion.span : motion.div
  
  // Disable animations in editor or preview mode to prevent framer-motion strict-mode duplication bug and viewport detection issues inside scrollable divs
  if (anim.type === 'none' || mode === 'editor' || mode === 'preview' || prefersReducedMotion) {
    const Tag = as as any
    return <Tag className={className} style={style}>{children}</Tag>
  }
  
  return <M variants={variants} className={className} style={style}>{children}</M>
}

/* ------------------------------------------------------------------ */
/*  Section shell — background, overlay, spacing, corners, animation   */
/* ------------------------------------------------------------------ */

const WIDTHS: Record<string, string> = { narrow: '760px', normal: '1080px', wide: '1320px', full: 'none' }
const SHADOWS: Record<string, string> = {
  none: 'none',
  sm: '0 2px 8px rgba(0,0,0,.06)',
  md: '0 8px 24px rgba(0,0,0,.08)',
  lg: '0 18px 50px rgba(0,0,0,.12)',
  xl: '0 30px 80px rgba(0,0,0,.18)',
}

export function SectionShell({
  section,
  children,
  className,
  contentClassName,
  noContainer,
}: {
  section: SiteSection
  children: ReactNode
  className?: string
  contentClassName?: string
  noContainer?: boolean
}) {
  const { mode } = useSiteRender()
  const s: SectionStyle = section.style ?? {}
  const anim: SectionAnimation = section.animation ?? { type: 'none' }

  const minH =
    s.minHeight === 'screen' ? 'var(--sb-screen)' : s.minHeight === 'large' ? 'calc(var(--sb-screen) * 0.75)' : s.minHeight === 'half' ? 'calc(var(--sb-screen) * 0.5)' : undefined

  const hasMargin = (s.marginX ?? 0) > 0 || (s.marginY ?? 0) > 0

  const innerStyle: CSSProperties = {
    color: s.textColor || undefined,
    borderRadius: s.radius ? `${s.radius}px` : undefined,
    border: s.borderWidth ? `${s.borderWidth}px solid ${s.borderColor || 'currentColor'}` : undefined,
    boxShadow: SHADOWS[s.shadow ?? 'none'],
    minHeight: minH,
    ...(s.accentColor ? ({ '--sb-accent': s.accentColor } as any) : {}),
  }

  const align = s.align ?? 'center'
  const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: anim.stagger === false ? 0 : 0.12, delayChildren: anim.delay ?? 0 } },
  }

  const visibilityCls =
    mode !== 'editor'
      ? cn(s.hideOnMobile && '@max-3xl:hidden', s.hideOnDesktop && '@3xl:hidden')
      : undefined
  const overlayElements = Array.isArray(section.props.overlayElements)
    ? section.props.overlayElements as SiteOverlayElement[]
    : []

  return (
    <EditableSectionCtx.Provider value={section}>
    <section
      data-section-id={section.id}
      data-section-type={section.type}
      className={cn('relative w-full', visibilityCls, className)}
      style={{ padding: hasMargin ? `${s.marginY ?? 0}px ${s.marginX ?? 0}px` : undefined }}
    >
      <div className="relative overflow-hidden flex flex-col justify-center" style={innerStyle}>
        <SectionBackground style={s} sectionId={section.id} />
        {s.corners && s.corners !== 'none' && <CornerOrnaments variant={s.corners} color={s.cornerColor} />}
        {overlayElements.length > 0 && (
          <FreeformOverlayLayer section={section} elements={overlayElements} mode={mode} />
        )}

        <AnimCtx.Provider value={anim}>
          {mode === 'editor' || mode === 'preview' ? (
            <div
              className={cn('relative z-[2] w-full', contentClassName)}
              style={{
                paddingTop: s.paddingY ?? 96,
                paddingBottom: s.paddingY ?? 96,
                paddingLeft: noContainer ? 0 : s.paddingX ?? 24,
                paddingRight: noContainer ? 0 : s.paddingX ?? 24,
                textAlign: align,
              }}
            >
              {noContainer ? children : <div className="mx-auto w-full" style={{ maxWidth: WIDTHS[s.width ?? 'normal'] }}>{children}</div>}
            </div>
          ) : (
            <motion.div
              key={`${anim.type}-${anim.duration}-${anim.delay}-${anim.stagger}`}
              initial={anim.type === 'none' ? false : 'hidden'}
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={containerVariants}
              className={cn('relative z-[2] w-full', contentClassName)}
              style={{
                paddingTop: s.paddingY ?? 96,
                paddingBottom: s.paddingY ?? 96,
                paddingLeft: noContainer ? 0 : s.paddingX ?? 24,
                paddingRight: noContainer ? 0 : s.paddingX ?? 24,
                textAlign: align,
              }}
            >
              {noContainer ? children : <div className="mx-auto w-full" style={{ maxWidth: WIDTHS[s.width ?? 'normal'] }}>{children}</div>}
            </motion.div>
          )}
        </AnimCtx.Provider>

        {s.divider && s.divider !== 'none' && <ShapeDivider variant={s.divider} />}
      </div>
    </section>
    </EditableSectionCtx.Provider>
  )
}

function FreeformOverlayLayer({ section, elements, mode }: {
  section: SiteSection
  elements: SiteOverlayElement[]
  mode: RenderMode
}) {
  const { site } = useSiteRender()
  const selectedOverlayId = useSiteEditorStore((state) => state.selectedOverlayId)

  return (
    <div data-overlay-canvas={section.id} className="pointer-events-none absolute inset-0 z-[5]">
      {elements.map((element) => {
        const isSelected = mode === 'editor' && selectedOverlayId === element.id
        const position: CSSProperties = {
          position: 'absolute',
          left: `${element.x}%`,
          top: `${element.y}%`,
          width: `${element.width}%`,
          transform: 'translate(-50%, -50%)',
          color: element.color || '#ffffff',
          fontSize: `clamp(12px, ${Math.max(12, element.fontSize || 24) / 12}vw, ${element.fontSize || 24}px)`,
        }
        const editorAttributes = mode === 'editor' ? {
          'data-site-overlay-id': element.id,
          'data-site-overlay-section': section.id,
          'data-site-overlay-type': element.type,
          'data-overlay-x': element.x,
          'data-overlay-y': element.y,
        } : {}

        if (element.type === 'button') {
          const buttonStyle: CSSProperties = {
            color: element.color || '#ffffff',
            backgroundColor: element.backgroundColor || 'var(--sb-accent)',
            borderColor: element.backgroundColor || 'var(--sb-accent)',
            borderRadius: element.borderRadius === undefined ? 'var(--sb-btn-radius)' : `${element.borderRadius}px`,
          }
          const buttonClass = 'inline-flex min-h-10 w-full items-center justify-center rounded-full border px-5 py-2 text-center font-medium tracking-wide shadow-md transition hover:-translate-y-0.5'
          return (
            <div key={element.id} draggable={false} style={position} className="pointer-events-auto" {...editorAttributes}>
              {mode === 'editor' ? (
                <div className="pointer-events-none">
                  <span className={buttonClass} style={buttonStyle}>{element.text}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => runButtonAction({
                    id: element.id,
                    label: element.text,
                    variant: 'solid',
                    action: element.action || 'none',
                    target: element.target,
                  }, site)}
                  className={buttonClass}
                  style={buttonStyle}
                >
                  {element.text}
                </button>
              )}
              {mode === 'editor' && <OverlayDragHandle selected={isSelected} />}
            </div>
          )
        }

        return (
          <div
            key={element.id}
            draggable={false}
            style={position}
            className={cn(
              'pointer-events-auto whitespace-pre-wrap break-words rounded-sm text-center leading-tight',
              isSelected && 'bg-blue-500/5 outline outline-2 outline-dashed outline-blue-500 outline-offset-2',
            )}
            {...editorAttributes}
            contentEditable={mode === 'editor'}
            suppressContentEditableWarning
            spellCheck={false}
            data-editable-overlay="true"
          >
            {element.text}
            {mode === 'editor' && <OverlayDragHandle selected={isSelected} />}
          </div>
        )
      })}
    </div>
  )
}

function OverlayDragHandle({selected}: {selected: boolean}) {
  if (!selected) return null
  return (
    <button
      type="button"
      data-overlay-drag-handle
      aria-label="Katmanı sürükleyerek taşı"
      title="Sürükleyerek taşı"
      className="absolute -right-3 -top-3 z-20 flex h-6 w-6 cursor-move touch-none items-center justify-center rounded-full border border-blue-500 bg-white text-blue-600 shadow"
      contentEditable={false}
      onClick={(event) => event.preventDefault()}
    >
      <Icons.Move className="h-3.5 w-3.5" />
    </button>
  )
}

function SectionBackground({ style: s, sectionId }: { style: SectionStyle; sectionId: string }) {
  const type = s.bgType ?? 'theme'
  const pos = s.bgPosition === 'top' ? 'center top' : s.bgPosition === 'bottom' ? 'center bottom' : 'center'
  return (
    <>
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden>
        {type === 'color' && <div className="absolute inset-0" style={{ background: s.bgColor }} />}
        {type === 'gradient' && (
          <div className="absolute inset-0" style={{ background: `linear-gradient(${s.gradientAngle ?? 180}deg, ${s.gradientFrom ?? '#fff'}, ${s.gradientTo ?? '#eee'})` }} />
        )}
        {type === 'image' && s.bgImage && (
          <div
            className={cn('absolute inset-0 bg-cover', s.bgZoom && 'sb-kenburns')}
            style={{
              backgroundImage: `url("${s.bgImage}")`,
              backgroundPosition: pos,
              backgroundAttachment: s.bgParallax ? 'fixed' : undefined,
              filter: s.bgBlur ? `blur(${s.bgBlur}px)` : undefined,
              inset: s.bgBlur ? -s.bgBlur * 2 : 0,
            }}
            data-editable-image-section={sectionId}
            data-editable-image-key="bgImage"
          />
        )}
        {type === 'video' && s.bgVideo && (
          <video className="absolute inset-0 h-full w-full object-cover" src={s.bgVideo} autoPlay muted loop playsInline style={{ filter: s.bgBlur ? `blur(${s.bgBlur}px)` : undefined }} />
        )}
      </div>
      {(s.overlayOpacity ?? 0) > 0 && (
        <div className="absolute inset-0 z-[1]" aria-hidden style={{ background: s.overlayColor || '#000', opacity: (s.overlayOpacity ?? 0) / 100 }} />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Corner ornaments (SVG)                                             */
/* ------------------------------------------------------------------ */

function CornerSvg({ variant }: { variant: string }) {
  switch (variant) {
    case 'floral':
      return (
        <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M4 116C4 56 56 4 116 4" />
          <path d="M14 116C14 62 62 14 116 14" opacity=".5" />
          <circle cx="30" cy="30" r="6" />
          <path d="M30 18c4 6 4 18 0 24M18 30c6-4 18-4 24 0" />
          <path d="M50 22c8-10 22-10 30-4-8 2-20 8-30 4ZM22 50c-10 8-10 22-4 30 2-8 8-20 4-30Z" />
          <circle cx="62" cy="10" r="2" fill="currentColor" />
          <circle cx="10" cy="62" r="2" fill="currentColor" />
        </svg>
      )
    case 'leaf':
      return (
        <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M6 114C30 80 60 40 112 8" />
          <path d="M28 82c-14-4-20-16-18-26 10 4 18 14 18 26ZM28 82c4-14 16-20 26-18-4 10-14 18-26 18Z" />
          <path d="M52 52c-14-4-20-16-18-26 10 4 18 14 18 26ZM52 52c4-14 16-20 26-18-4 10-14 18-26 18Z" />
          <path d="M80 28c-10-4-14-12-12-20 8 3 12 10 12 20ZM80 28c4-10 12-14 20-12-3 8-10 12-20 12Z" />
        </svg>
      )
    case 'classic':
      return (
        <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M8 112V8h104" />
          <path d="M16 112V16h96" opacity=".6" />
          <path d="M16 40c12 0 24-12 24-24M40 16c0 14 10 24 24 24" />
          <path d="M16 40c0 14 10 24 24 24" />
          <circle cx="16" cy="16" r="4" fill="currentColor" />
        </svg>
      )
    case 'minimal':
    default:
      return (
        <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M10 70V10h60" />
          <circle cx="10" cy="10" r="2.5" fill="currentColor" />
        </svg>
      )
  }
}

function CornerOrnaments({ variant, color }: { variant: string; color?: string }) {
  const pos = ['top-3 left-3', 'top-3 right-3 -scale-x-100', 'bottom-3 left-3 -scale-y-100', 'bottom-3 right-3 scale-[-1]']
  return (
    <div className="pointer-events-none absolute inset-0 z-[3]" style={{ color: color || 'var(--sb-accent)' }} aria-hidden>
      {pos.map((p) => (
        <div key={p} className={cn('absolute w-16 h-16 @3xl:w-28 @3xl:h-28 opacity-80', p)}>
          <CornerSvg variant={variant} />
        </div>
      ))}
    </div>
  )
}

function ShapeDivider({ variant }: { variant: string }) {
  const d =
    variant === 'wave'
      ? 'M0,64 C240,120 480,0 720,48 C960,96 1200,24 1440,64 L1440,120 L0,120 Z'
      : variant === 'curve'
        ? 'M0,120 C480,0 960,0 1440,120 Z'
        : 'M0,120 L1440,20 L1440,120 Z'
  return (
    <svg className="absolute bottom-[-1px] left-0 z-[3] w-full h-10 @3xl:h-20" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="var(--sb-bg)" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Heading                                                            */
/* ------------------------------------------------------------------ */

export function SectionHeading({ eyebrow, title, subtitle, className, style }: { eyebrow?: string; title?: string; subtitle?: string; className?: string; style?: CSSProperties }) {
  const section = useContext(EditableSectionCtx)
  const { mode } = useSiteRender()
  const editable = (key: string) => section ? editableTextAttributes(section, key, mode) : {}
  if (!eyebrow && !title && !subtitle) return null
  return (
    <div className={cn('mb-12 @3xl:mb-16 flex flex-col gap-3', className)} style={style}>
      {eyebrow && (
        <Reveal>
          <span {...editable('eyebrow')} className="sb-eyebrow sb-accent" style={section ? editableTextStyle(section.props, 'eyebrow') : undefined}>{eyebrow}</span>
        </Reveal>
      )}
      {title && (
        <Reveal>
          <h2 {...editable('title')} className="sb-heading" style={{ fontSize: 'calc(clamp(2rem, 5cqi, 3.4rem) * var(--sb-heading-scale))', ...(section ? editableTextStyle(section.props, 'title') : {}) }}>
            {title}
          </h2>
        </Reveal>
      )}
      {subtitle && (
        <Reveal>
          <p {...editable('subtitle')} className="sb-muted max-w-xl text-[15px] leading-relaxed whitespace-pre-line" style={{ marginInline: 'auto', ...(section ? editableTextStyle(section.props, 'subtitle') : {}) }}>
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Buttons                                                            */
/* ------------------------------------------------------------------ */

export function DynamicIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null
  const Icon = (Icons as any)[name] as Icons.LucideIcon | undefined
  return Icon ? <Icon className={className} /> : null
}

const ACTION_ICONS: Record<string, string> = {
  rsvp: 'Send',
  map: 'MapPin',
  calendar: 'CalendarPlus',
  phone: 'Phone',
  whatsapp: 'MessageCircle',
  email: 'Mail',
  link: 'ExternalLink',
  scroll: 'ArrowDown',
}

export function SiteButton({ button, size = 'md', className, section, buttonIndex }: { button: ButtonConfig; size?: 'sm' | 'md' | 'lg'; className?: string; section?: SiteSection | null; buttonIndex?: number }) {
  const { site, mode } = useSiteRender()
  const v = button.variant ?? 'solid'
  const iconName = button.icon === 'auto' ? ACTION_ICONS[button.action] : button.icon
  const buttonSize = button.size ?? size
  const sizeCls = buttonSize === 'sm' ? 'h-9 px-4 text-[11px]' : buttonSize === 'lg' ? 'h-14 px-9 text-[13px]' : 'h-12 px-7 text-[12px]'

  const style: CSSProperties = { borderRadius: 'var(--sb-btn-radius)' }
  if (v === 'solid') Object.assign(style, { background: 'var(--sb-accent)', color: 'var(--sb-on-accent)', borderColor: 'var(--sb-accent)' })
  if (v === 'outline') Object.assign(style, { borderColor: 'currentColor' })
  if (v === 'soft') Object.assign(style, { background: 'color-mix(in srgb, var(--sb-accent) 16%, transparent)', borderColor: 'transparent' })
  if (button.backgroundColor) style.backgroundColor = button.backgroundColor
  if (button.textColor) style.color = button.textColor
  if (button.borderColor) style.borderColor = button.borderColor
  if (button.borderRadius !== undefined) style.borderRadius = `${button.borderRadius}px`
  Object.assign(style, button.inlineStyle ?? {})

  return (
    <button
      type="button"
      onClick={(e) => {
        if (mode === 'editor') return
        e.preventDefault()
        runButtonAction(button, site)
      }}
      className={cn(
        'group/btn inline-flex items-center justify-center gap-2 font-medium uppercase tracking-[0.18em] transition-all duration-300',
        v !== 'link' && 'border',
        v === 'link' ? 'h-auto px-1 underline underline-offset-8 decoration-1 hover:decoration-2' : sizeCls,
        v === 'solid' && 'hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg',
        v === 'outline' && 'hover:bg-current/10 hover:-translate-y-0.5',
        v === 'ghost' && 'border-transparent hover:bg-current/10',
        v === 'soft' && 'hover:-translate-y-0.5',
        className,
      )}
      style={style}
    >
      {iconName && <DynamicIcon name={iconName} className="w-4 h-4" />}
      <span
        {...(section && buttonIndex !== undefined ? {
          'data-editable-section': section.id,
          'data-editable-key': 'buttons',
          'data-editable-index': buttonIndex,
          contentEditable: mode === 'editor',
          suppressContentEditableWarning: true,
          spellCheck: false,
        } : {})}
      >
        {button.label}
      </span>
    </button>
  )
}

export function SiteButtons({ buttons, size, className, style }: { buttons?: ButtonConfig[]; size?: 'sm' | 'md' | 'lg'; className?: string; style?: CSSProperties }) {
  const section = useContext(EditableSectionCtx)
  if (!buttons?.length) return null

  return (
    <Reveal className={cn('flex flex-wrap items-center gap-3', className)} style={{ justifyContent: 'inherit', ...style }}>
      {buttons.map((b, index) => (
        <SiteButton key={b.id} button={b} size={size} section={section} buttonIndex={index} />
      ))}
    </Reveal>
  )
}

/** Maps text-align to flex justify so buttons follow the section alignment. */
export function alignToJustify(align?: string) {
  return align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
}

/* ------------------------------------------------------------------ */
/*  Image helper                                                       */
/* ------------------------------------------------------------------ */

export function SbImage({ src, alt = '', className, style }: { src?: string; alt?: string; className?: string; style?: CSSProperties }) {
  if (!src)
    return (
      <div className={cn('flex items-center justify-center bg-current/5', className)} style={style}>
        <Icons.ImageIcon className="w-8 h-8 opacity-30" />
      </div>
    )
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" draggable={false} className={cn('object-cover', className)} style={style} />
}

/* ------------------------------------------------------------------ */
/*  Countdown hook                                                     */
/* ------------------------------------------------------------------ */

export function useCountdown(target?: string) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const ts = target ? new Date(target).getTime() : NaN
  if (now === null || isNaN(ts)) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: false, valid: !isNaN(ts) }
  const diff = Math.max(0, ts - now)
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: diff === 0,
    valid: true,
  }
}
