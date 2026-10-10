export type TemplateShape = {
  id: string
  name: string
  tagline?: string
  preview?: string
  swatches?: string[]
  sections?: unknown[]
}

export function validateTemplateDefinition(template: TemplateShape) {
  const errors: string[] = []

  if (!template.id || typeof template.id !== 'string') {
    errors.push('Template id is required.')
  }

  if (!template.name || typeof template.name !== 'string') {
    errors.push('Template name is required.')
  }

  if (!Array.isArray(template.sections)) {
    errors.push('Template sections must be an array.')
  }

  if (template.swatches && (!Array.isArray(template.swatches) || template.swatches.some((swatch) => typeof swatch !== 'string'))) {
    errors.push('Template swatches must be an array of CSS color strings.')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
