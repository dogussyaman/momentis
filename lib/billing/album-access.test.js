import assert from 'node:assert/strict'
import test from 'node:test'

import { isAlbumEnabledForProject } from './album-access.js'

test('an explicitly disabled album stays disabled even when the plan includes it', () => {
  assert.equal(isAlbumEnabledForProject({ album_enabled: false, creation_request_id: 'new-project' }, { album: true }), false)
})

test('a current project can show its album only when the plan entitlement and event setting allow it', () => {
  assert.equal(isAlbumEnabledForProject({ album_enabled: true, creation_request_id: 'new-project' }, { album: true }), true)
  assert.equal(isAlbumEnabledForProject({ album_enabled: true, creation_request_id: 'new-project' }, { album: false }), false)
  assert.equal(isAlbumEnabledForProject({ creation_request_id: 'new-project' }, { album: true }), true)
  assert.equal(isAlbumEnabledForProject({ creation_request_id: 'new-project' }, { album: false }), false)
})

test('legacy projects that explicitly enabled an album retain their existing behavior', () => {
  assert.equal(isAlbumEnabledForProject({ album_enabled: true }, { album: false }), true)
  assert.equal(isAlbumEnabledForProject({ album_enabled: false }, { album: false }), false)
  assert.equal(isAlbumEnabledForProject({}, { album: false }), false)
})

test('album QR visibility and API access remain aligned for new free projects', () => {
  const project = { album_enabled: true, creation_request_id: 'new-free-project' }
  assert.equal(isAlbumEnabledForProject(project, { album: false }), false)
})

test('album remains enabled for the current plan when explicitly switched on', () => {
  const project = { album_enabled: true, creation_request_id: 'new-premium-project' }
  assert.equal(isAlbumEnabledForProject(project, { album: true }), true)
})
