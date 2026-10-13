import assert from 'node:assert/strict'
import test from 'node:test'
import { ObjectId } from 'mongodb'
import { Readable, Writable } from 'node:stream'
import { handleVipRoutes } from './vip-routes.js'
import { getPublishedVipSite } from '../vip-design/public-site.js'

function matches(document, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$or') return expected.some((condition) => matches(document, condition))
    const actual = key.split('.').reduce((value, part) => value?.[part], document)
    if (expected && typeof expected === 'object' && '$in' in expected) return expected.$in.includes(actual)
    if (expected && typeof expected === 'object' && '$exists' in expected) return (actual !== undefined) === expected.$exists
    if (expected && typeof expected === 'object' && '$gte' in expected) return actual >= expected.$gte
    if (expected && typeof expected === 'object' && '$gt' in expected) return actual > expected.$gt
    if (expected && typeof expected === 'object' && '$ne' in expected) return actual !== expected.$ne
    if (expected instanceof RegExp) return expected.test(String(actual || ''))
    if (expected instanceof Date && actual instanceof Date) return expected.getTime() === actual.getTime()
    return actual === expected
  })
}

async function setVipStatus(db, id, status, extra = {}) {
  return handleVipRoutes({
    db,
    route: `/admin/vip-requests/${id}`,
    method: 'PATCH',
    user: admin,
    request: request(`/admin/vip-requests/${id}`, 'PATCH', { status, ...extra }, { origin: 'https://momentis.test' }),
  })
}

async function completeVipOutputs(db, id, photoBucket = createPhotoBucket()) {
  const draftRoute = `/admin/vip-requests/${id}/site-draft`
  const createdDraft = await handleVipRoutes({
    db,
    route: draftRoute,
    method: 'POST',
    user: admin,
    request: request(draftRoute, 'POST', {}, { origin: 'https://momentis.test' }),
  })
  assert.equal(createdDraft.status, 200)
  const publishRoute = `${draftRoute}/publish`
  const published = await handleVipRoutes({
    db,
    route: publishRoute,
    method: 'POST',
    user: admin,
    request: request(publishRoute, 'POST', {}, { origin: 'https://momentis.test' }),
  })
  assert.equal(published.status, 200)
  const form = new FormData()
  form.set('file', new Blob([Buffer.from('%PDF-1.7\nVIP invitation output')], { type: 'application/pdf' }), 'vip-davetiye.pdf')
  const outputRoute = `/admin/vip-requests/${id}/delivery/invitation`
  const output = await handleVipRoutes({
    db,
    photoBucket,
    route: outputRoute,
    method: 'POST',
    user: admin,
    request: request(outputRoute, 'POST', form, { origin: 'https://momentis.test' }),
  })
  assert.equal(output.status, 200)
  return photoBucket
}

async function remainingCredits(db, userId = customer.id) {
  const grants = await db.collection('billing_grants').find({ user_id: userId, status: 'active' }).toArray()
  return grants.reduce((sum, grant) => sum + grant.remaining_event_credits, 0)
}

function clone(value) {
  return structuredClone(value)
}

function setPath(target, path, value) {
  const parts = path.split('.')
  const last = parts.pop()
  const parent = parts.reduce((current, part) => (current[part] ||= {}), target)
  parent[last] = clone(value)
}

function createDb({ credits = 10, notificationFailure = false } = {}) {
  const records = []
  const collections = new Map([
    ['vip_design_requests', records],
    ['billing_grants', [{
      id: 'grant-1',
      user_id: customer.id,
      status: 'active',
      event_credits: credits,
      remaining_event_credits: credits,
      created_at: new Date('2026-01-01T00:00:00Z'),
      updated_at: new Date('2026-01-01T00:00:00Z'),
    }]],
  ])
  const indexes = []
  const collectionsRequested = []
  let transactionTail = Promise.resolve()
  const db = {
    records,
    indexes,
    collectionsRequested,
    collection(name) {
      collectionsRequested.push(name)
      if (!collections.has(name)) collections.set(name, [])
      const collectionRecords = collections.get(name)
      return {
        async createIndex(keys, options) {
          indexes.push({ keys, options })
        },
        async findOne(filter) {
          const result = collectionRecords.find((record) => matches(record, filter))
          return result ? clone(result) : null
        },
        async insertOne(record) {
          if (name === 'notifications' && notificationFailure) throw new Error('notification persistence unavailable')
          if (collectionRecords.some((item) => (record.id && item.id === record.id) ||
            (name === 'vip_design_requests' && item.user_id === record.user_id && item.idempotency_key === record.idempotency_key) ||
            (name === 'notifications' && item.event_id === record.event_id && item.recipient_id === record.recipient_id) ||
            (name === 'vip_credit_movements' && item.request_id === record.request_id && item.kind === record.kind))) {
            const error = new Error('duplicate key')
            error.code = 11000
            throw error
          }
          collectionRecords.push(clone(record))
          return { insertedId: record.id }
        },
        async updateOne(filter, update) {
          const record = collectionRecords.find((item) => matches(item, filter))
          if (!record) return { modifiedCount: 0 }
          for (const [key, value] of Object.entries(update.$set || {})) setPath(record, key, value)
          for (const [key, value] of Object.entries(update.$inc || {})) {
            const actual = key.split('.').reduce((current, part) => current?.[part], record) || 0
            setPath(record, key, actual + value)
          }
          for (const [key, value] of Object.entries(update.$push || {})) {
            const parts = key.split('.')
            const last = parts.pop()
            const parent = parts.reduce((item, part) => (item[part] ||= {}), record)
            if (!Array.isArray(parent[last])) parent[last] = []
            parent[last].push(clone(value))
          }
          return { modifiedCount: 1 }
        },
        find(filter) {
          let result = collectionRecords.filter((record) => matches(record, filter)).map(clone)
          const cursor = {
            sort(sortFields) {
              const [[field, direction]] = Object.entries(sortFields)
              result.sort((left, right) => (left[field] - right[field]) * direction)
              return cursor
            },
            skip(count) {
              result = result.slice(count)
              return cursor
            },
            limit(count) {
              result = result.slice(0, count)
              return cursor
            },
            async toArray() {
              return result
            },
          }
          return cursor
        },
        async countDocuments(filter) {
          return collectionRecords.filter((record) => matches(record, filter)).length
        },
      }
    },
  }
  db.client = {
    startSession() {
      return {
        async withTransaction(callback) {
          const previous = transactionTail
          let release
          transactionTail = new Promise((resolve) => { release = resolve })
          await previous
          const backup = new Map([...collections].map(([name, values]) => [name, values.map(clone)]))
          try {
            return await callback(this)
          } catch (error) {
            for (const [name, values] of backup) {
              const original = collections.get(name)
              original.splice(0, original.length, ...values)
            }
            for (const name of [...collections.keys()]) {
              if (!backup.has(name)) collections.delete(name)
            }
            throw error
          } finally {
            release()
          }
        },
        async endSession() {},
      }
    },
  }
  return db
}

function createPhotoBucket() {
  const files = new Map()
  return {
    files,
    openUploadStream(name, options) {
      const id = new ObjectId()
      const chunks = []
      const stream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(Buffer.from(chunk))
          callback()
        },
        final(callback) {
          files.set(id.toString(), {
            _id: id,
            filename: name,
            metadata: clone(options.metadata),
            contentType: options.contentType,
            bytes: Buffer.concat(chunks),
          })
          callback()
        },
      })
      stream.id = id
      stream.abort = async () => {
        files.delete(id.toString())
        stream.destroy()
      }

      return stream
    },
    async delete(id) {
      files.delete(id.toString())
    },
    openDownloadStream(id) {
      const file = files.get(id.toString())
      return Readable.from(file ? [file.bytes] : [])
    },
  }
}

function payload(overrides = {}) {
  return {
    selectedSiteTemplateId: 'vip-site-1',
    selectedInvitationTemplateId: 'vip-invite-1',
    eventDetails: {
      brideName: 'Ayşe',
      groomName: 'Can',
      eventType: 'Düğün',
      date: '2027-09-12',
      time: '18:30',
      venue: 'Sarnıç Köşk',
      address: 'İstanbul',
      familyInfo: '',
      invitationText: '',
    },
    preferences: {
      colors: '',
      style: 'Romantik',
      referenceNotes: '',
      sections: ['Hikâyemiz'],
      description: '',
    },
    albumPreferences: { wantsAlbum: true, guestPhotoSharing: true },
    uploadedPhotoMetadata: [],
    ...overrides,
  }
}

function request(path, method = 'GET', body, headers = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  return new Request(`https://momentis.test/api${path}`, {
    method,
    headers: {
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })
}

const customer = { id: 'user-1', name: 'Test User', email: 'user@example.test', role: 'user' }
const admin = { id: 'admin-1', name: 'Admin', email: 'admin@example.test', role: 'admin' }
const support = { id: 'support-1', role: 'support' }
const postHeaders = { origin: 'https://momentis.test', 'Idempotency-Key': 'viprequest-key-001' }

test('VIP templates and options are public without a session', async () => {
  const db = createDb()
  const siteResponse = await handleVipRoutes({ db, route: '/vip/site-templates', method: 'GET', request: request('/vip/site-templates') })
  const invitationResponse = await handleVipRoutes({ db, route: '/vip/invitation-templates', method: 'GET', request: request('/vip/invitation-templates') })
  const optionsResponse = await handleVipRoutes({ db, route: '/vip/options', method: 'GET', request: request('/vip/options') })
  assert.equal(siteResponse.status, 200)
  assert.equal(invitationResponse.status, 200)
  assert.equal(optionsResponse.status, 200)
  assert.equal((await siteResponse.json()).items.length, 5)
  assert.equal((await invitationResponse.json()).items.length, 5)
})

test('VIP request requires login and validates submitted data server-side', async () => {
  const db = createDb()
  const unauthenticated = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  assert.equal(unauthenticated.status, 401)

  const invalidDate = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload({ eventDetails: { ...payload().eventDetails, date: '2027-02-29' } }), postHeaders),
  })
  assert.equal(invalidDate.status, 400)
  assert.equal(db.records.length, 0)
})

test('successful requests persist under authenticated user and repeated POSTs are idempotent', async () => {
  const db = createDb()
  const submitted = payload({ userId: 'attacker-id', userEmail: 'attacker@example.test' })
  const invoke = () => handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', submitted, postHeaders),
  })

  const [firstResponse, repeatedResponse] = await Promise.all([invoke(), invoke()])
  assert.ok([200, 201].includes(firstResponse.status))
  assert.ok([200, 201].includes(repeatedResponse.status))
  const first = await firstResponse.json()
  const repeated = await repeatedResponse.json()
  assert.equal(first.request.id, repeated.request.id)
  assert.equal(db.records.length, 1)
  assert.equal(db.records[0].user_id, customer.id)
  assert.equal(db.records[0].user_snapshot.email, customer.email)
  assert.equal(db.records[0].status, 'pending')
  assert.equal(db.records[0].userId, undefined)
  assert.equal(db.indexes.some((index) => index.options?.unique), true)
  assert.deepEqual([...new Set(db.collectionsRequested)].sort(), [
    'billing_grants',
    'notifications',
    'users',
    'vip_credit_movements',
    'vip_design_requests',
    'vip_request_photos.files',
  ])
})

test('VIP photos are content-validated, stored in GridFS and downloadable only by the request owner', async () => {
  const db = createDb()
  const photoBucket = createPhotoBucket()
  const photoBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const photoId = 'photo-file-001'
  const submitted = payload({
    uploadedPhotoMetadata: [{
      photoId,
      name: 'dugun.png',
      type: 'image/png',
      size: photoBytes.length,
    }],
  })
  const form = new FormData()
  form.set('payload', JSON.stringify(submitted))
  form.append(`photo:${photoId}`, new Blob([photoBytes], { type: 'image/png' }), 'dugun.png')
  const createdResponse = await handleVipRoutes({
    db,
    photoBucket,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', form, postHeaders),
  })
  assert.equal(createdResponse.status, 201)
  const { request: created } = await createdResponse.json()
  assert.equal(created.uploadedPhotoMetadata[0].uploaded, true)
  assert.equal('fileId' in created.uploadedPhotoMetadata[0], false)
  assert.equal(photoBucket.files.size, 1)

  const retryForm = new FormData()
  retryForm.set('payload', JSON.stringify(submitted))
  retryForm.append(`photo:${photoId}`, new Blob([photoBytes], { type: 'image/png' }), 'dugun.png')
  const retried = await handleVipRoutes({
    db,
    photoBucket,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', retryForm, postHeaders),
  })
  assert.equal(retried.status, 200)
  assert.equal((await retried.json()).request.id, created.id)
  assert.equal(photoBucket.files.size, 1)

  const downloaded = await handleVipRoutes({
    db,
    photoBucket,
    route: `/vip/requests/${created.id}/photos/${photoId}`,
    method: 'GET',
    user: customer,
    request: request(`/vip/requests/${created.id}/photos/${photoId}`),
  })
  assert.equal(downloaded.status, 200)
  assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), photoBytes)

  const adminDownload = await handleVipRoutes({
    db,
    photoBucket,
    route: `/admin/vip-requests/${created.id}/photos/${photoId}`,
    method: 'GET',
    user: admin,
    request: request(`/admin/vip-requests/${created.id}/photos/${photoId}`),
  })
  assert.equal(adminDownload.status, 200)

  const otherUser = await handleVipRoutes({
    db,
    photoBucket,
    route: `/vip/requests/${created.id}/photos/${photoId}`,
    method: 'GET',
    user: { ...customer, id: 'other-user' },
    request: request(`/vip/requests/${created.id}/photos/${photoId}`),
  })
  assert.equal(otherUser.status, 404)
})

test('VIP photo upload rejects mismatched image content without leaving files or a request', async () => {
  const db = createDb()
  const photoBucket = createPhotoBucket()
  const photoId = 'photo-file-002'
  const bytes = Buffer.from('not a png')
  const submitted = payload({
    uploadedPhotoMetadata: [{ photoId, name: 'fake.png', type: 'image/png', size: bytes.length }],
  })
  const form = new FormData()
  form.set('payload', JSON.stringify(submitted))
  form.append(`photo:${photoId}`, new Blob([bytes], { type: 'image/png' }), 'fake.png')
  const response = await handleVipRoutes({
    db,
    photoBucket,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', form, { ...postHeaders, 'Idempotency-Key': 'photo-invalid-001' }),
  })
  assert.equal(response.status, 400)
  assert.equal(db.records.length, 0)
  assert.equal(photoBucket.files.size, 0)
})

test('the same idempotency key cannot create a different request and users cannot read each other', async () => {
  const db = createDb()
  await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  const conflict = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload({ selectedSiteTemplateId: 'vip-site-2' }), postHeaders),
  })
  assert.equal(conflict.status, 409)

  const itemId = db.records[0].id
  const forbidden = await handleVipRoutes({
    db,
    route: `/vip/requests/${itemId}`,
    method: 'GET',
    user: { ...customer, id: 'other-user' },
    request: request(`/vip/requests/${itemId}`),
  })
  assert.equal(forbidden.status, 404)
})

test('admin approval and internal notes are audited but never returned to the customer', async () => {
  const db = createDb()
  const createdResponse = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  const created = await createdResponse.json()
  const itemId = created.request.id
  const updateResponse = await handleVipRoutes({
    db,
    route: `/admin/vip-requests/${itemId}`,
    method: 'PATCH',
    user: admin,
    request: request(`/admin/vip-requests/${itemId}`, 'PATCH', { status: 'approved', note: 'İç değerlendirme' }, { origin: 'https://momentis.test' }),
  })
  assert.equal(updateResponse.status, 200)
  assert.equal(db.records[0].status, 'approved')
  assert.equal(db.records[0].internal_notes[0].note, 'İç değerlendirme')
  assert.equal(db.records[0].audit_trail.at(-1).internal_note, 'İç değerlendirme')

  const customerResponse = await handleVipRoutes({
    db,
    route: `/vip/requests/${itemId}`,
    method: 'GET',
    user: customer,
    request: request(`/vip/requests/${itemId}`),
  })
  const customerBody = await customerResponse.json()
  assert.equal(customerBody.request.status, 'approved')
  assert.equal('internal_notes' in customerBody.request, false)
  assert.equal('audit_trail' in customerBody.request, false)
  assert.equal(JSON.stringify(customerBody).includes('İç değerlendirme'), false)
  assert.equal(customerBody.vipCreditBalance, 8)

  assert.equal((await setVipStatus(db, itemId, 'in_progress')).status, 200)
  assert.equal((await setVipStatus(db, itemId, 'delivered')).status, 409)
  const outputBucket = await completeVipOutputs(db, itemId)
  assert.equal((await setVipStatus(db, itemId, 'delivered')).status, 200)
  assert.equal(db.records[0].status, 'delivered')
  assert.deepEqual(db.records[0].timeline.map((item) => item.status), ['pending', 'approved', 'in_progress', 'delivered'])
  const downloadedInvitation = await handleVipRoutes({
    db,
    photoBucket: outputBucket,
    route: `/vip/requests/${itemId}/delivery/invitation`,
    method: 'GET',
    user: customer,
    request: request(`/vip/requests/${itemId}/delivery/invitation`),
  })
  assert.equal(downloadedInvitation.status, 200)
  assert.match(Buffer.from(await downloadedInvitation.arrayBuffer()).toString(), /^%PDF-1\.7/)
  const otherUserDownload = await handleVipRoutes({
    db,
    photoBucket: outputBucket,
    route: `/vip/requests/${itemId}/delivery/invitation`,
    method: 'GET',
    user: { ...customer, id: 'other-user' },
    request: request(`/vip/requests/${itemId}/delivery/invitation`),
  })
  assert.equal(otherUserDownload.status, 404)
})

test('support can read admin requests but cannot change their state', async () => {
  const db = createDb()
  const readResponse = await handleVipRoutes({
    db,
    route: '/admin/vip-requests',
    method: 'GET',
    user: support,
    request: request('/admin/vip-requests'),
  })
  assert.equal(readResponse.status, 200)
  const response = await handleVipRoutes({
    db,
    route: '/admin/vip-requests/VIP-2027-1234567890',
    method: 'PATCH',
    user: support,
    request: request('/admin/vip-requests/VIP-2027-1234567890', 'PATCH', { status: 'approved' }, { origin: 'https://momentis.test' }),
  })
  assert.equal(response.status, 403)
})

test('admin VIP queue groups approved and in-progress requests separately from incoming requests', async () => {
  const db = createDb()
  const createdResponse = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  const { request: created } = await createdResponse.json()
  const setStatus = async (status) => {
    const response = await handleVipRoutes({
      db,
      route: `/admin/vip-requests/${created.id}`,
      method: 'PATCH',
      user: admin,
      request: request(`/admin/vip-requests/${created.id}`, 'PATCH', { status }, { origin: 'https://momentis.test' }),
    })
    assert.equal(response.status, 200)
  }
  const list = async (status) => {
    const response = await handleVipRoutes({
      db,
      route: '/admin/vip-requests',
      method: 'GET',
      user: admin,
      request: request(`/admin/vip-requests?status=${status}`),
    })
    assert.equal(response.status, 200)
    return response.json()
  }

  assert.equal((await list('incoming')).total, 1)
  await setStatus('approved')
  assert.equal((await list('incoming')).total, 0)
  assert.equal((await list('processing')).total, 1)
  const summary = await list('summary')
  assert.deepEqual(summary.counts, { incoming: 0, processing: 1, completed: 0, all: 1 })

  await setStatus('in_progress')
  assert.equal((await list('processing')).items[0].status, 'in_progress')
  await completeVipOutputs(db, created.id)
  await setStatus('delivered')
  assert.equal((await list('completed')).items[0].status, 'delivered')
  assert.deepEqual((await list('summary')).counts, { incoming: 0, processing: 0, completed: 1, all: 1 })
})

test('invalid state transitions and cross-origin mutations are rejected', async () => {
  const db = createDb()
  const createdResponse = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  const { request: created } = await createdResponse.json()
  const invalidTransition = await handleVipRoutes({
    db,
    route: `/admin/vip-requests/${created.id}`,
    method: 'PATCH',
    user: admin,
    request: request(`/admin/vip-requests/${created.id}`, 'PATCH', { status: 'delivered' }, { origin: 'https://momentis.test' }),
  })
  assert.equal(invalidTransition.status, 409)

  const rejection = await handleVipRoutes({
    db,
    route: `/admin/vip-requests/${created.id}`,
    method: 'PATCH',
    user: admin,
    request: request(`/admin/vip-requests/${created.id}`, 'PATCH', { status: 'rejected' }, { origin: 'https://momentis.test' }),
  })
  assert.equal(rejection.status, 200)
  assert.equal(db.records[0].status, 'rejected')

  const crossOrigin = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), { ...postHeaders, origin: 'https://attacker.test', 'Idempotency-Key': 'otherrequest-key-01' }),
  })
  assert.equal(crossOrigin.status, 403)
})

test('VIP site draft creation is admin-only, requires approval, and is idempotent', async () => {
  const db = createDb()
  const createdResponse = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  const { request: created } = await createdResponse.json()
  const draftRoute = `/admin/vip-requests/${created.id}/site-draft`
  const createDraft = (user) => handleVipRoutes({
    db,
    route: draftRoute,
    method: 'POST',
    user,
    request: request(draftRoute, 'POST', {}, { origin: 'https://momentis.test' }),
  })

  assert.equal((await createDraft(support)).status, 403)
  assert.equal((await createDraft(admin)).status, 409)

  const approve = await handleVipRoutes({
    db,
    route: `/admin/vip-requests/${created.id}`,
    method: 'PATCH',
    user: admin,
    request: request(`/admin/vip-requests/${created.id}`, 'PATCH', { status: 'approved' }, { origin: 'https://momentis.test' }),
  })
  assert.equal(approve.status, 200)

  const [firstResponse, repeatedResponse] = await Promise.all([createDraft(admin), createDraft(admin)])
  assert.equal(firstResponse.status, 200)
  assert.equal(repeatedResponse.status, 200)
  assert.equal(db.records[0].site_draft.status, 'draft')
  assert.equal(db.records[0].site_draft.templateId, 'vip-site-1')
  assert.equal(db.records[0].site_draft.site_data.settings.brideName, 'Ayşe')
  assert.equal(db.records[0].site_draft.site_data.settings.venueName, 'Sarnıç Köşk')
  assert.equal(db.records[0].audit_trail.filter(({ action }) => action === 'site_draft.created').length, 1)
  assert.equal(db.collectionsRequested.includes('event_projects'), false)

  const customerResponse = await handleVipRoutes({
    db,
    route: `/vip/requests/${created.id}`,
    method: 'GET',
    user: customer,
    request: request(`/vip/requests/${created.id}`),
  })
  const customerBody = await customerResponse.json()
  assert.equal('site_draft' in customerBody.request, false)
  assert.equal(customerBody.request.publishedSite, null)
  assert.equal(await getPublishedVipSite(db, db.records[0].site_draft.slug), null)
})

test('VIP site draft editing is admin-only and validates the saved editor data', async () => {
  const db = createDb()
  const createdResponse = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  const { request: created } = await createdResponse.json()
  const id = created.id
  const statusResponse = await handleVipRoutes({
    db,
    route: `/admin/vip-requests/${id}`,
    method: 'PATCH',
    user: admin,
    request: request(`/admin/vip-requests/${id}`, 'PATCH', { status: 'approved' }, { origin: 'https://momentis.test' }),
  })
  assert.equal(statusResponse.status, 200)
  const draftRoute = `/admin/vip-requests/${id}/site-draft`
  const createResponse = await handleVipRoutes({
    db,
    route: draftRoute,
    method: 'POST',
    user: admin,
    request: request(draftRoute, 'POST', {}, { origin: 'https://momentis.test' }),
  })
  const { request: withDraft } = await createResponse.json()

  const unauthorizedSave = await handleVipRoutes({
    db,
    route: draftRoute,
    method: 'PATCH',
    user: support,
    request: request(draftRoute, 'PATCH', { siteData: withDraft.site_draft.site_data }, { origin: 'https://momentis.test' }),
  })
  assert.equal(unauthorizedSave.status, 403)

  const invalidSave = await handleVipRoutes({
    db,
    route: draftRoute,
    method: 'PATCH',
    user: admin,
    request: request(draftRoute, 'PATCH', { siteData: { title: 'Missing required editor data' } }, { origin: 'https://momentis.test' }),
  })
  assert.equal(invalidSave.status, 400)

  const siteData = structuredClone(withDraft.site_draft.site_data)
  siteData.title = 'Ayşe & Can · VIP'
  const saveResponse = await handleVipRoutes({
    db,
    route: draftRoute,
    method: 'PATCH',
    user: admin,
    request: request(draftRoute, 'PATCH', { siteData }, { origin: 'https://momentis.test' }),
  })
  assert.equal(saveResponse.status, 200)
  assert.equal(db.records[0].site_draft.site_data.title, 'Ayşe & Can · VIP')
  assert.equal(db.records[0].site_draft.site_data.userId, customer.id)
  assert.equal(db.records[0].site_draft.status, 'draft')
  assert.equal(db.records[0].audit_trail.filter(({ action }) => action === 'site_draft.updated').length, 1)
})

test('VIP site publication requires production status and publishes one public site', async () => {
  const db = createDb()
  const createdResponse = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  const { request: created } = await createdResponse.json()
  const id = created.id
  const changeStatus = async (status) => handleVipRoutes({
    db,
    route: `/admin/vip-requests/${id}`,
    method: 'PATCH',
    user: admin,
    request: request(`/admin/vip-requests/${id}`, 'PATCH', { status }, { origin: 'https://momentis.test' }),
  })
  assert.equal((await changeStatus('approved')).status, 200)

  const draftRoute = `/admin/vip-requests/${id}/site-draft`
  await handleVipRoutes({
    db,
    route: draftRoute,
    method: 'POST',
    user: admin,
    request: request(draftRoute, 'POST', {}, { origin: 'https://momentis.test' }),
  })
  const publishRoute = `${draftRoute}/publish`
  const publish = () => handleVipRoutes({
    db,
    route: publishRoute,
    method: 'POST',
    user: admin,
    request: request(publishRoute, 'POST', {}, { origin: 'https://momentis.test' }),
  })
  assert.equal((await publish()).status, 409)
  assert.equal(await getPublishedVipSite(db, db.records[0].site_draft.slug), null)

  assert.equal((await changeStatus('in_progress')).status, 200)
  assert.equal((await changeStatus('delivered')).status, 409)
  const published = await publish()
  assert.equal(published.status, 200)
  assert.equal(db.records[0].site_draft.status, 'published')
  assert.equal(db.records[0].site_draft.site_data.status, 'published')
  assert.equal(db.records[0].status, 'in_progress')
  assert.equal((await changeStatus('delivered')).status, 409)
  await completeVipOutputs(db, id)
  assert.equal((await changeStatus('delivered')).status, 200)
  assert.equal(db.records[0].status, 'delivered')
  const publicSite = await getPublishedVipSite(db, db.records[0].site_draft.slug)
  assert.equal(publicSite.title, 'Ayşe & Can')
  assert.equal('userId' in publicSite, false)
  const customerResponse = await handleVipRoutes({
    db,
    route: `/vip/requests/${id}`,
    method: 'GET',
    user: customer,
    request: request(`/vip/requests/${id}`),
  })
  const customerBody = await customerResponse.json()
  assert.equal(customerBody.request.publishedSite.slug, db.records[0].site_draft.slug)

  const repeated = await publish()
  assert.equal(repeated.status, 200)
  assert.equal((await repeated.json()).idempotent, true)
  assert.equal(db.records[0].audit_trail.filter(({ action }) => action === 'site_draft.published').length, 1)
})

test('VIP requests atomically spend two available event credits and expose the remaining balance', async () => {
  const db = createDb({ credits: 3 })
  const response = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  assert.equal(response.status, 201)
  const body = await response.json()
  assert.equal(body.request.creditStatus.charged, 2)
  assert.equal(body.request.creditStatus.refunded, 0)
  assert.equal(await remainingCredits(db), 1)
  const debit = await db.collection('vip_credit_movements').findOne({ request_id: body.request.id, kind: 'debit' })
  assert.equal(debit.amount, 2)
  assert.equal(debit.user_id, customer.id)
  assert.equal(debit.admin_id, null)
  assert.equal(debit.allocations[0].grant_id, 'grant-1')

  const detail = await handleVipRoutes({
    db,
    route: `/vip/requests/${body.request.id}`,
    method: 'GET',
    user: customer,
    request: request(`/vip/requests/${body.request.id}`),
  })
  assert.equal((await detail.json()).vipCreditBalance, 1)
})

test('VIP request with fewer than two event credits creates no request or debit', async () => {
  const db = createDb({ credits: 1 })
  const response = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  assert.equal(response.status, 402)
  assert.equal(db.records.length, 0)
  assert.equal(await remainingCredits(db), 1)
  assert.equal(await db.collection('vip_credit_movements').countDocuments({}), 0)
})

test('rejection refunds the two charged credits once and records the admin decision', async () => {
  const db = createDb({ credits: 2 })
  const createdResponse = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  const { request: created } = await createdResponse.json()
  assert.equal(await remainingCredits(db), 0)

  const [first, repeated] = await Promise.all([
    setVipStatus(db, created.id, 'rejected'),
    setVipStatus(db, created.id, 'rejected'),
  ])
  assert.equal(first.status, 200)
  assert.equal(repeated.status, 200)
  assert.equal(await remainingCredits(db), 2)
  assert.equal(await db.collection('vip_credit_movements').countDocuments({ request_id: created.id, kind: 'refund' }), 1)
  assert.equal(await db.collection('vip_credit_movements').countDocuments({ request_id: created.id, kind: 'refund_denied' }), 0)
  assert.equal(db.records[0].vip_credit.refund_status, 'refunded')
})

test('cancellation before production requires a reason and refunds two credits', async () => {
  const db = createDb({ credits: 2 })
  const createdResponse = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  const { request: created } = await createdResponse.json()
  const missingReason = await setVipStatus(db, created.id, 'cancelled')
  assert.equal(missingReason.status, 400)
  assert.equal((await setVipStatus(db, created.id, 'cancelled', { cancellationReason: 'other' })).status, 400)
  const cancelled = await setVipStatus(db, created.id, 'cancelled', { cancellationReason: 'customer_request' })
  assert.equal(cancelled.status, 200)
  assert.equal(await remainingCredits(db), 2)
  assert.equal(db.records[0].cancellation_decision.refund_status, 'refunded')
  assert.equal(db.records[0].cancellation_decision.decided_by, admin.id)
  assert.equal((await db.collection('vip_credit_movements').findOne({ request_id: created.id, kind: 'refund' })).reason, 'vip_request_cancelled:customer_request')
})

test('cancellation after production records the no-refund policy and reason', async () => {
  const db = createDb({ credits: 2 })
  const createdResponse = await handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  const { request: created } = await createdResponse.json()
  assert.equal((await setVipStatus(db, created.id, 'approved')).status, 200)
  assert.equal((await setVipStatus(db, created.id, 'in_progress')).status, 200)
  assert.ok(db.records[0].production_started_at)

  const cancelled = await setVipStatus(db, created.id, 'cancelled', { cancellationReason: 'scope_change' })
  assert.equal(cancelled.status, 200)
  assert.equal(await remainingCredits(db), 0)
  assert.equal(db.records[0].vip_credit.refund_status, 'not_refunded_after_production')
  assert.equal(db.records[0].cancellation_decision.policy, 'no_refund_after_production_started')
  const decision = await db.collection('vip_credit_movements').findOne({ request_id: created.id, kind: 'refund_denied' })
  assert.equal(decision.amount, 0)
  assert.equal(decision.admin_id, admin.id)
  assert.equal(decision.reason, 'production_started_non_refundable:scope_change')
  const customerView = await handleVipRoutes({
    db,
    route: `/vip/requests/${created.id}`,
    method: 'GET',
    user: customer,
    request: request(`/vip/requests/${created.id}`),
  })
  assert.equal((await customerView.json()).request.creditStatus.refundReason, 'Üretim başladıktan sonraki iptallerde iade yapılmaz. Gerekçe: Hizmet kapsamı değişikliği')
})

test('concurrent different VIP requests cannot overspend the same two-credit balance', async () => {
  const db = createDb({ credits: 2 })
  const submit = (key) => handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), { origin: 'https://momentis.test', 'Idempotency-Key': key }),
  })
  const responses = await Promise.all([submit('viprequest-key-101'), submit('viprequest-key-102')])
  assert.deepEqual(responses.map(({ status }) => status).sort(), [201, 402])
  assert.equal(db.records.length, 1)
  assert.equal(await remainingCredits(db), 0)
  assert.equal(await db.collection('vip_credit_movements').countDocuments({ kind: 'debit' }), 1)
})

test('request retries are idempotent and do not debit a second time', async () => {
  const db = createDb({ credits: 2 })
  const submit = () => handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  const first = await submit()
  const retry = await submit()
  assert.equal(first.status, 201)
  assert.equal(retry.status, 200)
  assert.equal((await retry.json()).idempotent, true)
  assert.equal(db.records.length, 1)
  assert.equal(await remainingCredits(db), 0)
  assert.equal(await db.collection('vip_credit_movements').countDocuments({ kind: 'debit' }), 1)
})

test('concurrent retries with one idempotency key create one request and one debit', async () => {
  const db = createDb({ credits: 2 })
  const submit = () => handleVipRoutes({
    db,
    route: '/vip/requests',
    method: 'POST',
    user: customer,
    request: request('/vip/requests', 'POST', payload(), postHeaders),
  })
  const responses = await Promise.all([submit(), submit()])
  assert.deepEqual(responses.map(({ status }) => status).sort(), [200, 201])
  const bodies = await Promise.all(responses.map((response) => response.json()))
  assert.equal(bodies[0].request.id, bodies[1].request.id)
  assert.equal(db.records.length, 1)
  assert.equal(await remainingCredits(db), 0)
  assert.equal(await db.collection('vip_credit_movements').countDocuments({ kind: 'debit' }), 1)
})

test('VIP admin detail shows explicit unconfigured email delivery state', async () => {
  const previousKey = process.env.RESEND_API_KEY
  delete process.env.RESEND_API_KEY
  try {
    const db = createDb({ credits: 2 })
    await db.collection('users').insertOne({ id: admin.id, email: admin.email, role: admin.role })
    const createdResponse = await handleVipRoutes({
      db,
      route: '/vip/requests',
      method: 'POST',
      user: customer,
      request: request('/vip/requests', 'POST', payload(), postHeaders),
    })
    const { request: created } = await createdResponse.json()
    const detail = await handleVipRoutes({
      db,
      route: `/admin/vip-requests/${created.id}`,
      method: 'GET',
      user: admin,
      request: request(`/admin/vip-requests/${created.id}`),
    })
    const result = await detail.json()
    assert.equal(detail.status, 200)
    assert.equal(result.request.credit_movements.length, 1)
    assert.equal(result.request.email_notifications.length, 2)
    assert.ok(result.request.email_notifications.every(({ email }) => email.status === 'not_configured'))
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previousKey
  }
})

test('VIP request remains committed when in-app notification storage fails', async () => {
  const db = createDb({ credits: 2, notificationFailure: true })
  const originalError = console.error
  console.error = () => {}
  try {
    const response = await handleVipRoutes({
      db,
      route: '/vip/requests',
      method: 'POST',
      user: customer,
      request: request('/vip/requests', 'POST', payload(), postHeaders),
    })
    assert.equal(response.status, 201)
    assert.equal(db.records.length, 1)
    assert.equal(await remainingCredits(db), 0)
    assert.equal(await db.collection('vip_credit_movements').countDocuments({ kind: 'debit' }), 1)
  } finally {
    console.error = originalError
  }
})
