import assert from 'node:assert/strict'
import test from 'node:test'

import { createStarterSite, normalizeSiteForEditor } from './normalize-site'
import { buildSiteFromTemplate, TEMPLATES } from './templates'

test('createStarterSite returns a valid default site', () => {
  const site = createStarterSite({ title: 'Özel Düğün' })

  assert.equal(site.title, 'Özel Düğün')
  assert.equal(site.templateId, 'portfolio')
  assert.ok(Array.isArray(site.sections) && site.sections.length >= 10)
  assert.ok(site.sections.some((section) => section.type === 'album'))
  assert.ok(site.sections.some((section) => section.type === 'share'))
  assert.equal(site.sections.find((section) => section.type === 'hero')?.props.showSideRays, true)
  assert.equal(site.status, 'draft')
})

test('normalizeSiteForEditor hydrates saved project site data without losing defaults', () => {
  const projectSite = {
    id: 'site-123',
    userId: 'user-42',
    title: 'Şafak & Deniz',
    slug: 'safak-deniz',
    templateId: 'classic',
    theme: {
      primaryColor: '#123456',
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
      letterSpacing: 'normal' as const,
    },
    sections: [
      {
        id: 'hero-1',
        type: 'hero',
        visible: true,
        order: 0,
        props: { title: 'Merhaba' },
        style: { paddingY: 24 },
      },
    ],
    settings: { musicEnabled: false, showCountdown: false },
    status: 'draft' as const,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
  }

  const normalized = normalizeSiteForEditor(projectSite, { title: 'Fallback', templateId: 'minimal' })

  assert.equal(normalized.title, 'Şafak & Deniz')
  assert.equal(normalized.slug, 'safak-deniz')
  assert.equal(normalized.templateId, 'classic')
  assert.equal(normalized.theme.primaryColor, '#123456')
  assert.equal(normalized.settings.showCountdown, false)
  assert.equal(normalized.sections[0].props.title, 'Merhaba')
  assert.equal(normalized.sections[0].visible, true)
})

test('the template catalog includes 20 additional designs with the shared wedding-site features', () => {
  const addedTemplates = TEMPLATES.filter((template) => template.id !== 'portfolio')
  const requiredSections = ['hero', 'couple', 'story', 'gallery', 'countdown', 'event', 'schedule', 'rsvp', 'guestbook', 'album', 'share', 'footer']

  assert.equal(addedTemplates.length, 20)
  assert.equal(new Set(TEMPLATES.map((template) => template.id)).size, TEMPLATES.length)

  for (const template of addedTemplates) {
    const site = buildSiteFromTemplate(template.id)
    const sectionTypes = new Set(site.sections.map((section) => section.type))

    assert.equal(site.templateId, template.id)
    for (const sectionType of requiredSections) assert.ok(sectionTypes.has(sectionType), `${template.id} is missing ${sectionType}`)
  }
})
