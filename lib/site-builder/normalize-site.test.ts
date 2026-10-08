import assert from 'node:assert/strict'
import test from 'node:test'

import { createStarterSite, normalizeSiteForEditor } from './normalize-site'

test('createStarterSite returns a valid default site', () => {
  const site = createStarterSite({ title: 'Özel Düğün' })

  assert.equal(site.title, 'Özel Düğün')
  assert.equal(site.templateId, 'minimal')
  assert.ok(Array.isArray(site.sections) && site.sections.length > 0)
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
