import assert from 'node:assert/strict'
import test from 'node:test'
import { getSaveStatus, isSiteDirty, shouldWarnBeforeUnload } from './save-status.js'

test('isSiteDirty compares the site version to the last saved version for the same site', () => {
  const site = { id: 's1', updatedAt: '2026-01-02T00:00:00.000Z' }
  assert.equal(isSiteDirty(site, { id: 's1', version: '2026-01-02T00:00:00.000Z' }), false)
  assert.equal(isSiteDirty(site, { id: 's1', version: '2026-01-01T00:00:00.000Z' }), true)
  assert.equal(isSiteDirty(site, { id: 'other', version: 'x' }), false)
  assert.equal(isSiteDirty(null, null), false)
})

test('only server-backed editors with unsaved changes warn before unload', () => {
  assert.equal(shouldWarnBeforeUnload({ serverBacked: true, dirty: true }), true)
  assert.equal(shouldWarnBeforeUnload({ serverBacked: true, dirty: false }), false)
  assert.equal(shouldWarnBeforeUnload({ serverBacked: false, dirty: true }), false)
})

test('server-backed status distinguishes saving, unsaved and saved', () => {
  const base = { serverBacked: true, saveError: null, lastSavedAt: null }
  assert.equal(getSaveStatus({ ...base, isSaving: true, dirty: true }).kind, 'saving')
  assert.equal(getSaveStatus({ ...base, isSaving: false, dirty: true }).kind, 'dirty')
  assert.equal(getSaveStatus({ ...base, isSaving: false, dirty: false }).kind, 'saved')
})

test('server-backed status never claims a device draft', () => {
  const status = getSaveStatus({ serverBacked: true, isSaving: false, dirty: false, saveError: null, lastSavedAt: Date.now() })
  assert.notEqual(status.kind, 'local')
})

test('local-only status reports the device draft and storage errors', () => {
  const base = { serverBacked: false, dirty: false }
  assert.equal(getSaveStatus({ ...base, isSaving: false, saveError: null, lastSavedAt: null }).kind, 'idle')
  assert.equal(getSaveStatus({ ...base, isSaving: false, saveError: null, lastSavedAt: 1 }).kind, 'local')
  assert.equal(getSaveStatus({ ...base, isSaving: false, saveError: 'hata', lastSavedAt: 1 }).kind, 'error')
})
