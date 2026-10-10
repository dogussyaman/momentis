import type { SiteSection, SiteSettings, SiteTheme, WeddingSite, SectionStyle, SectionAnimation } from './schema'
import { createSectionFromDefinition, uid } from './definitions'
import { MODERN_TEMPLATES } from './modern-templates'

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

const baseSettings: SiteSettings = {
  musicEnabled: false,
  showCountdown: true,
  brideName: '{{brideName}}',
  groomName: '{{groomName}}',
  eventDate: '{{eventDate}}',
  venueName: '{{venueName}}',
  venueAddress: '{{venueAddress}}',
  contactPhone: '',
  showNavbar: true,
  envelopeEnabled: false,
  seoTitle: '',
  seoDescription: '',
}

export const TEMPLATES: SiteTemplate[] = MODERN_TEMPLATES

export const TEMPLATE_MAP = Object.fromEntries(TEMPLATES.map((template) => [template.id, template]))

export function buildSiteFromTemplate(templateId: string, base?: Partial<WeddingSite>): WeddingSite {
  const template = TEMPLATE_MAP[templateId] ?? TEMPLATES[0]
  const sections: SiteSection[] = template.sections.map(([type, overrides], order) => ({
    ...createSectionFromDefinition(type, overrides),
    order,
  }))
  const now = new Date().toISOString()

  return {
    id: base?.id ?? uid('site'),
    userId: base?.userId ?? 'demo',
    title: base?.title ?? '{{coupleNames}}',
    slug: base?.slug ?? 'davet',
    templateId: template.id,
    theme: { ...template.theme },
    sections,
    settings: { ...baseSettings, ...(template.settings ?? {}), ...(base?.settings ?? {}) },
    status: base?.status ?? 'draft',
    createdAt: base?.createdAt ?? now,
    updatedAt: now,
  }
}
