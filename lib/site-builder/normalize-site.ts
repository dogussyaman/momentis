import type { WeddingSite, SiteSettings, SiteTheme } from './schema'
import { buildSiteFromTemplate } from './templates'

const DEFAULT_SITE_TITLE = 'Bizim Düğün'
const DEFAULT_SITE_SLUG = 'bizim-dugun'

function mergeTheme(source: Partial<SiteTheme> | undefined, fallback: SiteTheme): SiteTheme {
  return { ...fallback, ...(source || {}) }
}

function mergeSettings(source: Partial<SiteSettings> | undefined, fallback: SiteSettings): SiteSettings {
  return { ...fallback, ...(source || {}) }
}

export function createStarterSite(overrides: Partial<WeddingSite> = {}): WeddingSite {
  const templateId = overrides.templateId || 'portfolio'
  const template = buildSiteFromTemplate(templateId)
  const now = new Date().toISOString()

  return normalizeSiteForEditor(
    {
      ...template,
      ...overrides,
      id: overrides.id || 'starter-site',
      userId: overrides.userId || 'demo',
      title: overrides.title || DEFAULT_SITE_TITLE,
      slug: overrides.slug || DEFAULT_SITE_SLUG,
      templateId,
      theme: mergeTheme(overrides.theme, template.theme),
      settings: mergeSettings(overrides.settings, template.settings || { musicEnabled: false, showCountdown: true }),
      sections: Array.isArray(overrides.sections) && overrides.sections.length ? overrides.sections : template.sections,
      status: overrides.status || 'draft',
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
    },
    {
      templateId,
      title: DEFAULT_SITE_TITLE,
      slug: DEFAULT_SITE_SLUG,
    },
  )
}

export function normalizeSiteForEditor(input: Partial<WeddingSite> | null | undefined, fallback: Partial<WeddingSite> = {}): WeddingSite {
  const baseTemplateId = input?.templateId || fallback.templateId || 'portfolio'
  const template = buildSiteFromTemplate(baseTemplateId)
  const resolved = {
    ...template,
    ...fallback,
    ...input,
    id: input?.id || fallback.id || 'editor-site',
    userId: input?.userId || fallback.userId || 'demo',
    title: input?.title || fallback.title || DEFAULT_SITE_TITLE,
    slug: input?.slug || fallback.slug || DEFAULT_SITE_SLUG,
    templateId: baseTemplateId,
    theme: mergeTheme(input?.theme, mergeTheme(fallback.theme, template.theme)),
    settings: mergeSettings(input?.settings, mergeSettings(fallback.settings, template.settings || { musicEnabled: false, showCountdown: true })),
    sections: Array.isArray(input?.sections) && input.sections.length ? input.sections : Array.isArray(fallback.sections) && fallback.sections.length ? fallback.sections : template.sections,
    status: input?.status || fallback.status || 'draft',
    createdAt: input?.createdAt || fallback.createdAt || new Date().toISOString(),
    updatedAt: input?.updatedAt || fallback.updatedAt || new Date().toISOString(),
  }

  return {
    ...resolved,
    sections: resolved.sections.map((section: any, index: number) => ({
      ...section,
      id: section?.id || `${section?.type || 'section'}-${index}`,
      visible: section?.visible ?? true,
      order: Number.isFinite(section?.order) ? Number(section.order) : index,
      props: section?.props || {},
      style: section?.style || {},
      animation: section?.animation || { type: 'fade', duration: 0.8, delay: 0 },
    })),
  }
}
