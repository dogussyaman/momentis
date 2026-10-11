import assert from 'node:assert/strict'
import test from 'node:test'
import { BILLING_PLANS } from './plans.js'
import { getPublicBillingPackages, resolvePackageSettings, savePackageSettings } from './package-settings.js'

function createFakeDb() {
  const records = []
  const collection = {
    findOne: async ({ package_id }) => records.find((record) => record.package_id === package_id) || null,
    find: () => ({ toArray: async () => records.map((record) => ({ ...record })) }),
    updateOne: async ({ package_id }, update) => {
      let record = records.find((item) => item.package_id === package_id)
      if (!record) {
        record = { ...update.$setOnInsert }
        records.push(record)
      }
      Object.assign(record, update.$set)
    },
  }
  return { collection: () => collection }
}

test('package settings default to the current catalogue behavior', () => {
  assert.deepEqual(resolvePackageSettings(BILLING_PLANS.baslangic, null), {
    package_id: 'baslangic',
    is_active: true,
    is_public: true,
  })
})

test('deactivated package is hidden from the public catalogue without changing other plans', async () => {
  const db = createFakeDb()
  await savePackageSettings(db, BILLING_PLANS.baslangic, { is_active: false }, 'admin-1')

  const publicPackages = await getPublicBillingPackages(db)
  assert.deepEqual(publicPackages.map((plan) => plan.id), ['premium', 'atolye'])
})

test('reactivating a hidden package does not make it public implicitly', async () => {
  const db = createFakeDb()
  await savePackageSettings(db, BILLING_PLANS.premium, { is_public: false }, 'admin-1')
  const settings = await savePackageSettings(db, BILLING_PLANS.premium, { is_active: true }, 'admin-1')

  assert.equal(settings.is_active, true)
  assert.equal(settings.is_public, false)
})
