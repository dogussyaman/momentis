import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createVipDesignRequest,
  getAdminVipDesignRequest,
  getMyVipDesignRequest,
  listAdminVipDesignRequests,
  listMyVipDesignRequests,
  listVipInvitationTemplates,
  listVipSiteTemplates,
  updateMockVipRequestStatus,
  VIP_REQUEST_STORAGE_KEY,
} from './mock-service.mjs'

function memoryStorage() {
  const data = new Map()
  return { getItem(key) { return data.get(key) ?? null }, setItem(key, value) { data.set(key, value) } }
}

function payload(overrides = {}) {
  return {
    userId: 'user-1', userName: 'Demo Kullanıcı', userEmail: 'demo@example.test',
    selectedSiteTemplateId: 'vip-site-3', selectedInvitationTemplateId: 'vip-invite-5',
    eventDetails: { brideName: 'Mina', groomName: 'Can', eventType: 'Düğün', date: '2027-07-18', time: '18:00', venue: 'Bahçe', address: 'Bursa' },
    preferences: { colors: 'Pudra', style: 'Romantik', referenceNotes: '', sections: [], description: '' },
    albumPreferences: { wantsAlbum: true, guestPhotoSharing: true },
    uploadedPhotoMetadata: [{ name: 'demo.jpg', type: 'image/jpeg', size: 1200 }],
    ...overrides,
  }
}

test('provides independent five-item VIP site and invitation catalogs', async () => {
  const sites = await listVipSiteTemplates()
  const invitations = await listVipInvitationTemplates()
  assert.equal(sites.length, 5)
  assert.equal(invitations.length, 5)
  assert.ok(sites.every((site) => site.id.startsWith('vip-site-')))
  assert.ok(invitations.every((invitation) => invitation.id.startsWith('vip-invite-')))
})

test('creates mock request and exposes same record to its owner and admin', async () => {
  const storage = memoryStorage()
  const request = await createVipDesignRequest(payload(), storage)
  assert.match(request.id, /^VIP-\d{4}-[A-Z0-9]+$/)
  assert.equal((await getMyVipDesignRequest(request.id, 'user-1', storage)).selectedInvitationTemplateId, 'vip-invite-5')
  assert.equal(await getMyVipDesignRequest(request.id, 'other-user', storage), null)
  assert.equal((await getAdminVipDesignRequest(request.id, storage)).selectedSiteTemplateId, 'vip-site-3')
  assert.equal((await listMyVipDesignRequests('user-1', storage)).length, 1)
  assert.equal((await listAdminVipDesignRequests({}, storage)).length, 1)
})

test('validates independent site and invitation selections and required form fields', async () => {
  const storage = memoryStorage()
  await assert.rejects(createVipDesignRequest(payload({ selectedInvitationTemplateId: '' }), storage), /davetiye/)
  await assert.rejects(createVipDesignRequest(payload({ selectedSiteTemplateId: 'missing' }), storage), /site konsepti/)
  await assert.rejects(createVipDesignRequest(payload({ eventDetails: { brideName: '', groomName: 'Can', date: '2027-07-18' } }), storage), /Gelin adı/)
  assert.equal(storage.getItem(VIP_REQUEST_STORAGE_KEY), null)
})

test('admin status changes are reflected in user list and support filtering', async () => {
  const storage = memoryStorage()
  const request = await createVipDesignRequest(payload(), storage)
  const updated = await updateMockVipRequestStatus(request.id, 'reviewing', 'İç not', storage)
  assert.equal(updated.status, 'reviewing')
  assert.equal(updated.adminNotes[0].note, 'İç not')
  assert.equal((await listMyVipDesignRequests('user-1', storage))[0].status, 'reviewing')
  assert.equal((await listAdminVipDesignRequests({ status: 'created' }, storage)).length, 0)
  assert.equal((await listAdminVipDesignRequests({ status: 'reviewing' }, storage)).length, 1)
  await assert.rejects(updateMockVipRequestStatus(request.id, 'bogus', '', storage), /Geçersiz/)
})
