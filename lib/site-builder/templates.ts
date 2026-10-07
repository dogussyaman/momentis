import type { SiteSection, SiteSettings, SiteTheme, WeddingSite, SectionStyle, SectionAnimation } from './schema'
import { btn, createSectionFromDefinition, uid } from './definitions'
import { STOCK } from './media'

type SectionSpec = [type: string, overrides?: { props?: Record<string, any>; style?: SectionStyle; animation?: SectionAnimation }]

export interface SiteTemplate {
  id: string
  name: string
  tagline: string
  preview: string
  swatches: string[]
  theme: SiteTheme
  settings?: Partial<SiteSettings>
  sections: SectionSpec[]
}

const baseTheme: SiteTheme = {
  primaryColor: '#101827',
  secondaryColor: '#c9a96e',
  accentColor: '#c9a96e',
  backgroundColor: '#f8f4ec',
  surfaceColor: '#ffffff',
  textColor: '#101827',
  mutedColor: '#6b6458',
  headingFont: 'Playfair Display',
  bodyFont: 'Inter',
  scriptFont: 'Great Vibes',
  borderRadius: 12,
  buttonRadius: 999,
  headingScale: 1,
  letterSpacing: 'normal',
}

const baseSettings: SiteSettings = {
  musicEnabled: false,
  showCountdown: true,
  brideName: 'Ayşe',
  groomName: 'Mehmet',
  eventDate: '2026-06-12T17:00',
  venueName: 'Feriye Sarayı',
  venueAddress: 'Çırağan Cd. No:40, Beşiktaş, İstanbul',
  contactPhone: '+905555555555',
  showNavbar: true,
  seoTitle: 'Ayşe & Mehmet · 12 Haziran 2026',
  seoDescription: 'Düğünümüze davetlisiniz.',
}

export const TEMPLATES: SiteTemplate[] = [
  /* ---------------- 1. Klasik Zarafet ---------------- */
  {
    id: 'classic',
    name: 'Klasik Zarafet',
    tagline: 'Fildişi & altın, zamansız şıklık',
    preview: STOCK.hero1,
    swatches: ['#f8f4ec', '#c9a96e', '#101827'],
    theme: { ...baseTheme },
    sections: [
      ['hero', { style: { corners: 'classic', cornerColor: '#e9d8b4' } }],
      ['text', { props: { title: '', eyebrow: 'Bismillahirrahmanirrahim', body: '“Ve sizi çiftler halinde yarattık.”', variant: 'quote', author: 'Nebe, 8' }, style: { paddingY: 72 } }],
      ['couple', { props: { photoShape: 'arch' } }],
      ['countdown'],
      ['story', { style: { bgType: 'color', bgColor: '#ffffff' } }],
      ['event', { props: { layout: 'cards' } }],
      ['gallery', { props: { layout: 'masonry' }, style: { bgType: 'color', bgColor: '#ffffff' } }],
      ['rsvp', { props: { layout: 'card' } }],
      ['faq'],
      ['footer'],
    ],
  },

  /* ---------------- 2. Modern Minimal ---------------- */
  {
    id: 'minimal',
    name: 'Modern Minimal',
    tagline: 'Siyah & beyaz, editoryal sadelik',
    preview: STOCK.hero2,
    swatches: ['#ffffff', '#111111', '#a3a3a3'],
    theme: {
      ...baseTheme,
      primaryColor: '#111111',
      secondaryColor: '#111111',
      accentColor: '#111111',
      backgroundColor: '#ffffff',
      surfaceColor: '#f5f5f5',
      textColor: '#111111',
      mutedColor: '#737373',
      headingFont: 'Cormorant Garamond',
      bodyFont: 'Jost',
      scriptFont: 'Pinyon Script',
      borderRadius: 0,
      buttonRadius: 0,
      letterSpacing: 'wide',
    },
    sections: [
      [
        'hero',
        {
          props: { layout: 'split', titleFont: 'heading', titleSize: 90, sideImage: STOCK.hero2, eyebrow: 'Save the date', buttons: [btn('LCV', 'rsvp', 'solid'), btn('Detaylar', 'scroll', 'link')] },
          style: { bgType: 'color', bgColor: '#ffffff', textColor: '#111111', overlayOpacity: 0, minHeight: 'screen', paddingY: 0, paddingX: 0, width: 'full' },
        },
      ],
      ['divider', { props: { variant: 'line', lineWidth: 20 } }],
      ['couple', { props: { layout: 'stacked', photoShape: 'square', showAmpersand: false } }],
      ['event', { props: { layout: 'list' }, style: { bgType: 'color', bgColor: '#f5f5f5' } }],
      ['schedule', { props: { layout: 'grid' }, style: { width: 'normal' } }],
      ['gallery', { props: { layout: 'grid', columns: 4, gap: 4, aspect: 'square' }, style: { width: 'full', paddingX: 0 } }],
      ['rsvp', { props: { layout: 'plain' } }],
      ['footer', { style: { bgType: 'color', bgColor: '#111111', textColor: '#ffffff' } }],
    ],
  },

  /* ---------------- 3. Botanik Bahçe ---------------- */
  {
    id: 'botanical',
    name: 'Botanik Bahçe',
    tagline: 'Adaçayı yeşili, çiçekler ve kemerler',
    preview: STOCK.flowers,
    swatches: ['#f3f1ea', '#7d8f69', '#3d4a35'],
    theme: {
      ...baseTheme,
      primaryColor: '#3d4a35',
      secondaryColor: '#7d8f69',
      accentColor: '#7d8f69',
      backgroundColor: '#f3f1ea',
      surfaceColor: '#fbfaf6',
      textColor: '#2f3a29',
      mutedColor: '#6f7766',
      headingFont: 'Marcellus',
      bodyFont: 'Lato',
      scriptFont: 'Parisienne',
      borderRadius: 20,
    },
    sections: [
      [
        'hero',
        {
          props: { layout: 'frame', contentBox: 'solid' },
          style: { bgImage: STOCK.flowers, overlayOpacity: 15, textColor: '#2f3a29', corners: 'floral', cornerColor: '#7d8f69' },
        },
      ],
      ['divider', { props: { variant: 'floral' } }],
      ['couple', { props: { photoShape: 'arch', layout: 'cards' }, style: { corners: 'leaf', cornerColor: '#7d8f69' } }],
      ['story', { props: { layout: 'cards' } }],
      ['countdown', { props: { variant: 'circles' }, style: { bgImage: STOCK.bouquet, overlayColor: '#2f3a29', overlayOpacity: 65 } }],
      ['event', { props: { layout: 'split' } }],
      ['dresscode'],
      ['gallery', { props: { layout: 'collage' } }],
      ['rsvp', { props: { layout: 'split', image: STOCK.bouquet }, style: { marginX: 24, radius: 28, bgType: 'color', bgColor: '#fbfaf6', shadow: 'lg' } }],
      ['guestbook'],
      ['footer', { style: { bgColor: '#3d4a35' } }],
    ],
  },

  /* ---------------- 4. Akdeniz Yazı ---------------- */
  {
    id: 'mediterranean',
    name: 'Akdeniz Yazı',
    tagline: 'Terracotta & krem, sıcak yaz akşamı',
    preview: STOCK.hero3,
    swatches: ['#fbf3ea', '#c46a4a', '#3b2a22'],
    theme: {
      ...baseTheme,
      primaryColor: '#c46a4a',
      secondaryColor: '#e2b48c',
      accentColor: '#c46a4a',
      backgroundColor: '#fbf3ea',
      surfaceColor: '#fffaf4',
      textColor: '#3b2a22',
      mutedColor: '#8a6f60',
      headingFont: 'DM Serif Display',
      bodyFont: 'Nunito Sans',
      scriptFont: 'Allura',
      borderRadius: 16,
    },
    settings: { venueName: 'Bodrum Kempinski', venueAddress: 'Barbaros Mah. Kızılağaç Cad. No:42, Bodrum' },
    sections: [
      [
        'hero',
        {
          props: { layout: 'bottom', titleFont: 'script', titleSize: 120, eyebrow: 'Bodrum’da evleniyoruz', showCountdown: true },
          style: { bgImage: STOCK.hero3, overlayColor: '#3b2a22', overlayOpacity: 35, divider: 'wave' },
        },
      ],
      ['text', { props: { variant: 'script', title: 'Merhaba!', body: 'Ege’nin en güzel koyunda, gün batımında birlikte kutlayalım.' } }],
      ['event', { props: { layout: 'cards' }, style: { bgType: 'gradient', gradientFrom: '#fbf3ea', gradientTo: '#f4dcc6', gradientAngle: 180 } }],
      ['schedule'],
      ['gallery', { props: { layout: 'carousel', aspect: 'portrait' } }],
      ['accommodation'],
      ['rsvp', { props: { layout: 'card' }, style: { bgType: 'image', bgImage: STOCK.hero4, overlayColor: '#3b2a22', overlayOpacity: 55, textColor: '#ffffff' } }],
      ['gift'],
      ['music', { props: { variant: 'vinyl' } }],
      ['footer', { style: { bgColor: '#3b2a22' } }],
    ],
  },

  /* ---------------- 5. Gece Işıltısı ---------------- */
  {
    id: 'midnight',
    name: 'Gece Işıltısı',
    tagline: 'Lacivert & şampanya, lüks gece',
    preview: STOCK.hero5,
    swatches: ['#0b1020', '#d4b483', '#f3ead8'],
    theme: {
      ...baseTheme,
      primaryColor: '#d4b483',
      secondaryColor: '#d4b483',
      accentColor: '#d4b483',
      backgroundColor: '#0b1020',
      surfaceColor: '#141b31',
      textColor: '#f3ead8',
      mutedColor: '#9aa0b4',
      headingFont: 'Cinzel',
      bodyFont: 'Raleway',
      scriptFont: 'Alex Brush',
      borderRadius: 4,
      buttonRadius: 4,
      letterSpacing: 'wide',
    },
    sections: [
      [
        'hero',
        {
          props: { titleFont: 'heading', titleSize: 85, contentBox: 'glass', eyebrow: 'An evening to remember' },
          style: { bgImage: STOCK.hero5, overlayColor: '#0b1020', overlayOpacity: 55, corners: 'minimal', cornerColor: '#d4b483' },
        },
      ],
      ['countdown', { props: { variant: 'minimal' }, style: { bgType: 'theme', paddingY: 64 } }],
      ['couple', { props: { photoShape: 'circle' } }],
      ['story', { props: { layout: 'timeline' } }],
      ['divider', { props: { variant: 'monogram' } }],
      ['event', { props: { layout: 'split' } }],
      ['gallery', { props: { layout: 'grid', columns: 3, aspect: 'portrait' } }],
      ['dresscode', { props: { title: 'Black Tie', colors: [{ id: 'c_1', color: '#000000', name: 'Siyah' }, { id: 'c_2', color: '#d4b483', name: 'Şampanya' }, { id: 'c_3', color: '#1e2a4a', name: 'Lacivert' }] } }],
      ['rsvp', { style: { marginX: 24, radius: 8, borderWidth: 1, borderColor: '#d4b48355', bgType: 'color', bgColor: '#141b31' } }],
      ['faq'],
      ['footer', { style: { bgType: 'color', bgColor: '#060912', textColor: '#d4b483' } }],
    ],
  },
]

export const TEMPLATE_MAP = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]))

export function buildSiteFromTemplate(templateId: string, base?: Partial<WeddingSite>): WeddingSite {
  const tpl = TEMPLATE_MAP[templateId] ?? TEMPLATES[0]
  const sections: SiteSection[] = tpl.sections.map(([type, ov], i) => ({ ...createSectionFromDefinition(type, ov), order: i }))
  const now = new Date().toISOString()
  return {
    id: base?.id ?? uid('site'),
    userId: base?.userId ?? 'demo',
    title: base?.title ?? 'Ayşe & Mehmet',
    slug: base?.slug ?? 'ayse-ve-mehmet',
    templateId: tpl.id,
    theme: { ...tpl.theme },
    sections,
    settings: { ...baseSettings, ...(tpl.settings ?? {}), ...(base?.settings ?? {}) },
    status: base?.status ?? 'draft',
    createdAt: base?.createdAt ?? now,
    updatedAt: now,
  }
}
