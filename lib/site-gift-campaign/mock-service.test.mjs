import assert from 'node:assert/strict'
import test from 'node:test'
import {
  acquireDemoSiteEntitlement,
  getEligibility,
  getEligibleTemplates,
  getSelectedTemplate,
  getSelectionStatus,
  MOCK_GIFT_TEMPLATES,
  selectTemplate,
  SITE_GIFT_STORAGE_KEY,
} from './mock-service.mjs'

function createStorage(seed = null) {
  const values = new Map(seed ? [[SITE_GIFT_STORAGE_KEY, seed]] : [])
  return {
    getItem(key) { return values.get(key) ?? null },
    setItem(key, value) { values.set(key, value) },
  }
}

test('returns ineligible without a simulated site entitlement', async () => {
  const eligibility = await getEligibility('missing-entitlement', createStorage())
  assert.equal(eligibility.eligibilityStatus, 'not_eligible')
  assert.deepEqual(await getEligibleTemplates('missing-entitlement', createStorage()), [])
})

test('demo entitlement exposes exactly five eligible premium templates', async () => {
  const storage = createStorage()
  const eligibility = await acquireDemoSiteEntitlement('site-demo-1', storage)
  const templates = await getEligibleTemplates('site-demo-1', storage)
  assert.equal(eligibility.mode, 'mock')
  assert.equal(eligibility.includedInvitationCount, 1)
  assert.equal(templates.length, 5)
  assert.equal(MOCK_GIFT_TEMPLATES.length, 5)
  assert.ok(templates.every((template) => template.premium))
})

test('selection is single-use, preserved on refresh, and rejects invalid IDs', async () => {
  const storage = createStorage()
  await acquireDemoSiteEntitlement('site-demo-2', storage)
  await assert.rejects(selectTemplate('missing-template', 'site-demo-2', storage), /Geçersiz/)
  await selectTemplate('ivory-elegance', 'site-demo-2', storage)
  assert.equal((await getSelectionStatus('site-demo-2', storage)).selectedTemplateId, 'ivory-elegance')
  await assert.rejects(selectTemplate('midnight', 'site-demo-2', storage), /daha önce kullanılmış/)
  assert.equal((await getSelectionStatus('site-demo-2', storage)).selectedTemplateId, 'ivory-elegance')
})

test('only returns the selected template for its matching entitlement', async () => {
  const storage = createStorage()
  await acquireDemoSiteEntitlement('site-demo-5', storage)
  await selectTemplate('midnight', 'site-demo-5', storage)

  assert.equal((await getSelectedTemplate('midnight', 'site-demo-5', storage)).id, 'midnight')
  assert.equal(await getSelectedTemplate('ivory-elegance', 'site-demo-5', storage), null)
  assert.equal(await getSelectedTemplate('midnight', 'other-entitlement', storage), null)
})

test('repeated demo acquisition does not reset an existing selection', async () => {
  const storage = createStorage()
  await acquireDemoSiteEntitlement('site-demo-3', storage)
  await selectTemplate('botanical-sage', 'site-demo-3', storage)
  const entitlement = await acquireDemoSiteEntitlement('site-demo-3', storage)
  assert.equal(entitlement.selectedTemplateId, 'botanical-sage')
})

test('reports malformed storage instead of silently replacing it', async () => {
  const storage = createStorage('{not-json')
  await assert.rejects(getEligibility('site-demo-4', storage), SyntaxError)
})
