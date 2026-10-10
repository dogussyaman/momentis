import type { SiteTemplate } from './templates'
import { TEMPLATES } from './templates'

export const TEMPLATE_REGISTRY: SiteTemplate[] = TEMPLATES

export const TEMPLATE_INDEX = Object.fromEntries(
  TEMPLATE_REGISTRY.map((template) => [template.id, template]),
) as Record<string, SiteTemplate>

export function getTemplateById(id: string): SiteTemplate | undefined {
  return TEMPLATE_INDEX[id]
}

export function getTemplateCatalog() {
  return [...TEMPLATE_REGISTRY]
}
