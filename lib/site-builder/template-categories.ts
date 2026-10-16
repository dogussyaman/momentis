import type { SiteTemplate } from './templates'

export const SITE_TEMPLATE_CATEGORIES = [
  'Tümü',
  'Modern',
  'Romantik',
  'Doğa',
  'Klasik',
  'Sinematik',
  'Editoryal',
] as const

export type SiteTemplateCategory = typeof SITE_TEMPLATE_CATEGORIES[number]

const CATEGORY_BY_ID: Record<string, Exclude<SiteTemplateCategory, 'Tümü'>> = {
  portfolio: 'Modern',
  'noir-gold': 'Klasik',
  'botanical-romance': 'Doğa',
  'editorial-ivory': 'Editoryal',
  'terracotta-sunset': 'Romantik',
  'ege-esintisi': 'Doğa',
  'lavanta-ruyasi': 'Romantik',
  'garden-party': 'Doğa',
  'modern-minimal': 'Modern',
  'film-noir': 'Sinematik',
  'bordo-klasik': 'Klasik',
  'akdeniz-zeytin': 'Doğa',
  'art-deco': 'Klasik',
  'boho-earth': 'Doğa',
  'gece-yildizi': 'Sinematik',
  provence: 'Doğa',
  'inci-luks': 'Klasik',
  'kir-cicegi': 'Romantik',
  'sehir-sikligi': 'Modern',
  'sage-atelier': 'Doğa',
  'kiraz-cicegi': 'Romantik',
}

export function getSiteTemplateCategory(template: Pick<SiteTemplate, 'id'>): Exclude<SiteTemplateCategory, 'Tümü'> {
  return CATEGORY_BY_ID[template.id] || 'Modern'
}

export function filterSiteTemplates<T extends Pick<SiteTemplate, 'id' | 'name' | 'tagline'>>(
  templates: T[],
  category: SiteTemplateCategory,
  query: string,
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('tr')
  return templates.filter((template) => {
    const matchesCategory = category === 'Tümü' || getSiteTemplateCategory(template) === category
    const matchesQuery = !normalizedQuery ||
      (template.name + ' ' + template.tagline).toLocaleLowerCase('tr').includes(normalizedQuery)
    return matchesCategory && matchesQuery
  })
}
