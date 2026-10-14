import assert from 'node:assert/strict'
import test from 'node:test'

import { getAlbumSectionAnchor, getPublicInvitationUrl } from './public-url'

test('public invitation URLs are absolute and encode the slug', () => {
  assert.equal(
    getPublicInvitationUrl('https://momentis-mu.vercel.app', 'safak-deniz'),
    'https://momentis-mu.vercel.app/d/safak-deniz',
  )
  assert.equal(
    getPublicInvitationUrl('https://momentis-mu.vercel.app', 'safak-deniz', 'section-album-12'),
    'https://momentis-mu.vercel.app/d/safak-deniz#section-album-12',
  )
})

test('album QR anchor matches SiteViewer section wrapper IDs', () => {
  assert.equal(
    getAlbumSectionAnchor({ sections: [{ id: 'album-12', type: 'album', visible: true }] }),
    'section-album-12',
  )
})

test('hidden album sections are not selected for SiteViewer QR navigation', () => {
  assert.equal(
    getAlbumSectionAnchor({ sections: [{ id: 'album-12', type: 'album', visible: false }] }),
    '',
  )
})

test('legacy invitation pages retain the #album anchor', () => {
  assert.equal(getAlbumSectionAnchor(null), 'album')
})

test('modern site data without sections does not fall back to the legacy album anchor', () => {
  assert.equal(getAlbumSectionAnchor({ title: 'Site exists but has no section list' }), '')
})
