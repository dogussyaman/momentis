/* ------------------------------------------------------------------ */
/*  MOMENTIS Site Builder — JSON schema                                */
/* ------------------------------------------------------------------ */

export type ButtonAction =
  | 'none'
  | 'scroll'
  | 'link'
  | 'rsvp'
  | 'map'
  | 'calendar'
  | 'phone'
  | 'whatsapp'
  | 'email'

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'soft' | 'link'

export interface ButtonConfig {
  id: string
  label: string
  variant: ButtonVariant
  action: ButtonAction
  /** scroll → section id · link → url · map → address · phone/whatsapp → number · email → address */
  target?: string
  icon?: string
  newTab?: boolean
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  borderRadius?: number
  size?: 'sm' | 'md' | 'lg'
  eventTitle?: string
  eventLocation?: string
  inlineStyle?: Record<string, string | number>
}

export type BgType = 'theme' | 'color' | 'gradient' | 'image' | 'video'
export type CornerOrnament = 'none' | 'floral' | 'classic' | 'minimal' | 'leaf'

export interface SectionStyle {
  bgType?: BgType
  bgColor?: string
  gradientFrom?: string
  gradientTo?: string
  gradientAngle?: number
  bgImage?: string
  bgVideo?: string
  bgPosition?: 'center' | 'top' | 'bottom'
  bgParallax?: boolean
  bgZoom?: boolean
  overlayColor?: string
  overlayOpacity?: number // 0-100
  bgBlur?: number // px
  textColor?: string
  accentColor?: string
  paddingY?: number // px
  paddingX?: number // px
  width?: 'narrow' | 'normal' | 'wide' | 'full'
  align?: 'left' | 'center' | 'right'
  minHeight?: 'auto' | 'half' | 'large' | 'screen'
  marginX?: number // outer spacing (card look)
  marginY?: number
  radius?: number
  borderWidth?: number
  borderColor?: string
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  corners?: CornerOrnament
  cornerColor?: string
  divider?: 'none' | 'wave' | 'curve' | 'slant'
  hideOnMobile?: boolean
  hideOnDesktop?: boolean
  elementGap?: number // Gap between main content blocks (default 20px)
  buttonMarginTop?: number // Extra margin above buttons (default 12px)
  titleMarginBottom?: number // Extra margin below title (default 0px)
}

export type AnimationType = 'none' | 'fade' | 'slide-up' | 'slide-left' | 'slide-right' | 'zoom' | 'blur'

export interface SectionAnimation {
  type: AnimationType
  duration?: number
  delay?: number
  stagger?: boolean
}

export type SiteSection = {
  id: string
  type: string
  name?: string
  visible: boolean
  locked?: boolean
  order: number
  variant?: string
  props: Record<string, any>
  style: SectionStyle
  animation?: SectionAnimation
}

export interface SiteTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  mutedColor: string
  headingFont: string
  bodyFont: string
  scriptFont: string
  borderRadius: number
  buttonRadius: number
  headingScale: number // 0.8 - 1.4
  letterSpacing: 'tight' | 'normal' | 'wide'
}

export interface SiteSettings {
  musicEnabled: boolean
  musicUrl?: string
  musicAutoplay?: boolean
  showCountdown: boolean
  seoTitle?: string
  seoDescription?: string
  favicon?: string
  // Global wedding info (used by calendar / map actions & as defaults)
  brideName?: string
  groomName?: string
  eventDate?: string // ISO datetime
  venueName?: string
  venueAddress?: string
  contactPhone?: string
  showNavbar?: boolean
  navStyle?: 'bar' | 'floating' | 'centered' | 'transparent'
  rsvpDeadline?: string
}

export type WeddingSite = {
  id: string
  userId: string
  title: string
  slug: string
  templateId: string
  theme: SiteTheme
  sections: SiteSection[]
  settings: SiteSettings
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

/* ------------------------------------------------------------------ */
/*  Inspector field definitions                                        */
/* ------------------------------------------------------------------ */

export type FieldOption = { value: string; label: string }

type BaseField = {
  key: string
  label: string
  group?: string
  help?: string
  placeholder?: string
  showIf?: (values: Record<string, any>) => boolean
}

export type FieldDef =
  | (BaseField & { type: 'text' | 'textarea' | 'url' | 'date' | 'datetime' | 'time' | 'color' | 'toggle' | 'image' | 'video' | 'buttons' | 'section-ref' | 'icon' })
  | (BaseField & { type: 'number' | 'slider'; min?: number; max?: number; step?: number; unit?: string })
  | (BaseField & { type: 'select' | 'segmented'; options: FieldOption[] })
  | (BaseField & {
      type: 'list'
      itemFields: FieldDef[]
      itemLabelKey: string
      newItem: () => Record<string, any>
      maxItems?: number
    })
