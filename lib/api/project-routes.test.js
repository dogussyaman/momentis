import assert from 'node:assert/strict'
import test from 'node:test'
import { handleProjectRoutes, handlePublicRoutes } from './project-routes.js'
import { computeProjectQuotaLimit } from '../billing/usage.js'
import { createMemoryDb } from '../test-utils/memory-db.js'

const partialString = { partialFilterExpression: { creation_request_id: { $type: 'string' } } }

async function makeDb(seed = {}) {
  const db = createMemoryDb(seed)
  // ensureBillingIndexes caches per process, so each test DB gets its unique indexes explicitly.
  await db.collection('event_projects').createIndex({ user_id: 1, creation_request_id: 1 }, { unique: true, ...partialString })
  await db.collection('billing_project_entitlements').createIndex({ project_id: 1 }, { unique: true })
  await db.collection('billing_usage_operations').createIndex({ user_id: 1, meter: 1, request_key: 1 }, { unique: true })
  return db
}

const user = { id: 'user-1', email: 'u1@example.com', name: 'Kullanıcı' }
const otherUser = { id: 'user-2', email: 'u2@example.com', name: 'Diğer' }

const weddingBody = (extra = {}) => ({
  event_type: 'dugun',
  host_a: 'Ayşe',
  host_b: 'Mehmet',
  date: '2030-06-15',
  event_data: { couple: { bride: 'Ayşe', groom: 'Mehmet' } },
  deliverables: { site: { enabled: true }, invitation: { enabled: false } },
  site_data: { templateId: undefined },
  ...extra,
})

function post(db, key, body, actor = user) {
  const request = new Request('http://localhost/api/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify(body),
  })
  return handleProjectRoutes({ db, route: '/projects', path: ['projects'], method: 'POST', request, user: actor })
}

function grantDoc(overrides = {}) {
  return {
    id: 'grant-1',
    user_id: user.id,
    package_id: 'premium',
    purchase_id: 'purchase-1',
    status: 'active',
    event_credits: 1,
    remaining_event_credits: 1,
    assigned_project_ids: [],
    created_at: new Date('2026-01-01'),
    ...overrides,
  }
}

test('computeProjectQuotaLimit ignores unspent credits of revoked/closed/expired grants', () => {
  assert.equal(computeProjectQuotaLimit([]), 1)
  assert.equal(computeProjectQuotaLimit([grantDoc({ event_credits: 3 })]), 4)
  assert.equal(computeProjectQuotaLimit([grantDoc({ event_credits: 3, status: 'revoked' })]), 1)
  assert.equal(computeProjectQuotaLimit([grantDoc({ event_credits: 3, status: 'closed' })]), 1)
  assert.equal(computeProjectQuotaLimit([grantDoc({ event_credits: 3, expires_at: new Date('2020-01-01') })]), 1)
  // Credits already spent on existing projects still count so they don't consume the free slot.
  assert.equal(computeProjectQuotaLimit([grantDoc({ event_credits: 3, status: 'revoked', assigned_project_ids: ['p1'] })]), 2)
})

test('revoked credits do not grant a new project slot', async () => {
  const db = await makeDb({
    billing_grants: [grantDoc({ event_credits: 3, remaining_event_credits: 3, status: 'revoked' })],
  })
  const first = await post(db, 'free-create-0001', weddingBody({ billing_package_id: 'baslangic' }))
  assert.equal(first.status, 201)
  const second = await post(db, 'free-create-0002', weddingBody({ billing_package_id: 'baslangic' }))
  assert.equal(second.status, 403)
  assert.equal((await second.json()).code, 'QUOTA_EXCEEDED')
  assert.equal(db.read('event_projects').length, 1)
})

test('the same creation request (sequential) creates a single project and spends one credit', async () => {
  const db = await makeDb({ billing_grants: [grantDoc()] })
  const a = await post(db, 'premium-create-01', weddingBody({ billing_package_id: 'premium' }))
  const b = await post(db, 'premium-create-01', weddingBody({ billing_package_id: 'premium' }))
  assert.equal(a.status, 201)
  assert.equal(b.status, 200)
  assert.equal(db.read('event_projects').length, 1)
  const [grant] = db.read('billing_grants')
  assert.equal(grant.remaining_event_credits, 0)
  assert.equal(grant.assigned_project_ids.length, 1)
})

test('concurrent identical creation requests never create two projects or overspend credits', async () => {
  const db = await makeDb({ billing_grants: [grantDoc()] })
  const responses = await Promise.all(
    Array.from({ length: 4 }, () => post(db, 'premium-create-02', weddingBody({ billing_package_id: 'premium' }))),
  )
  assert.ok(responses.every((response) => [200, 201].includes(response.status)), responses.map((r) => r.status).join())
  assert.equal(db.read('event_projects').length, 1)
  const [grant] = db.read('billing_grants')
  assert.equal(grant.remaining_event_credits, 0)
  assert.equal(grant.assigned_project_ids.length, 1)
})

test('two different requests with a single credit yield one project', async () => {
  const db = await makeDb({ billing_grants: [grantDoc()] })
  const responses = await Promise.all([
    post(db, 'premium-create-03', weddingBody({ billing_package_id: 'premium' })),
    post(db, 'premium-create-04', weddingBody({ billing_package_id: 'premium' })),
  ])
  const statuses = responses.map((response) => response.status).sort()
  assert.deepEqual(statuses, [201, 402])
  assert.equal(db.read('event_projects').length, 1)
  assert.equal(db.read('billing_grants')[0].remaining_event_credits, 0)
})

test('creation requires an Idempotency-Key', async () => {
  const db = await makeDb()
  const request = new Request('http://localhost/api/projects', { method: 'POST', body: JSON.stringify(weddingBody()) })
  const response = await handleProjectRoutes({ db, route: '/projects', path: ['projects'], method: 'POST', request, user })
  assert.equal(response.status, 400)
  assert.equal(db.read('event_projects').length, 0)
})

test("another user cannot read or edit someone else's project", async () => {
  const db = await makeDb()
  const created = await post(db, 'free-create-0003', weddingBody({ billing_package_id: 'baslangic' }))
  const { project } = await created.json()
  for (const method of ['GET', 'PATCH']) {
    const request = new Request(`http://localhost/api/projects/${project.id}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: method === 'PATCH' ? JSON.stringify({ title: 'Ele geçirildi' }) : undefined,
    })
    const response = await handleProjectRoutes({
      db, route: `/projects/${project.id}`, path: ['projects', project.id], method, request, user: otherUser,
    })
    assert.equal(response.status, 404)
  }
  assert.notEqual(db.read('event_projects')[0].title, 'Ele geçirildi')
})

test('unpublished event is not accessible publicly (returns 404)', async () => {
  const db = await makeDb()
  const created = await post(db, 'free-create-0004', weddingBody({ billing_package_id: 'baslangic' }))
  const { project } = await created.json()
  assert.equal(project.published, false)

  const publicReq = new Request(`http://localhost/api/public/invitations/${project.slug}`)
  const res = await handlePublicRoutes({
    db,
    route: `/public/invitations/${project.slug}`,
    path: ['public', 'invitations', project.slug],
    method: 'GET',
    request: publicReq,
  })
  assert.equal(res.status, 404)
})

test('public RSVP deduplicates on email and updates existing guest response', async () => {
  const db = await makeDb()
  await db.collection('rsvps').createIndex({ project_id: 1, email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } })
  const created = await post(db, 'free-create-0005', weddingBody({ billing_package_id: 'baslangic' }))
  const { project } = await created.json()

  // Publish project so public routes allow RSVP
  await db.collection('event_projects').updateOne({ id: project.id }, { $set: { published: true } })

  const makeRsvp = (name, attending, count) => new Request('http://localhost/api/public/rsvp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      slug: project.slug,
      name,
      email: 'davetli@example.com',
      attending,
      guest_count: count,
    }),
  })

  // First RSVP
  const firstRes = await handlePublicRoutes({
    db, route: '/public/rsvp', path: ['public', 'rsvp'], method: 'POST', request: makeRsvp('Ali Veli', true, 2),
  })
  assert.equal(firstRes.status, 201)
  assert.equal(db.read('rsvps').length, 1)
  assert.equal(db.read('rsvps')[0].guest_count, 2)

  // Repeated RSVP by same guest with updated attendance
  const updateRes = await handlePublicRoutes({
    db, route: '/public/rsvp', path: ['public', 'rsvp'], method: 'POST', request: makeRsvp('Ali Veli', false, 0),
  })
  assert.equal(updateRes.status, 200)
  assert.equal(db.read('rsvps').length, 1) // No duplicate row created
  assert.equal(db.read('rsvps')[0].attending, false)
  assert.equal(db.read('rsvps')[0].guest_count, 0)
})

test('photo uploads validate format with magic bytes and reject invalid files', async () => {
  const db = await makeDb({ billing_grants: [grantDoc()] })
  const created = await post(db, 'prem-create-album', weddingBody({ billing_package_id: 'premium', album_enabled: true }))
  const { project } = await created.json()
  await db.collection('event_projects').updateOne({ id: project.id }, { $set: { published: true, album_enabled: true } })

  // 1. Fake text/html disguised as image/jpeg -> rejected
  const fakePhotoReq = new Request(`http://localhost/api/public/album/${project.slug}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': 'upload-key-01' },
    body: JSON.stringify({
      uploader: 'Hacker',
      photos: ['data:image/jpeg;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='],
    }),
  })
  const fakeRes = await handlePublicRoutes({
    db, route: `/public/album/${project.slug}`, path: ['public', 'album', project.slug], method: 'POST', request: fakePhotoReq,
  })
  assert.equal(fakeRes.status, 400)
  assert.match((await fakeRes.json()).error, /Geçerli bir fotoğraf bulunamadı/)

  // 2. Real JPEG magic bytes (/9j/...) -> accepted
  const realJpegReq = new Request(`http://localhost/api/public/album/${project.slug}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': 'upload-key-02' },
    body: JSON.stringify({
      uploader: 'Davetli',
      photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...'],
    }),
  })
  const realRes = await handlePublicRoutes({
    db, route: `/public/album/${project.slug}`, path: ['public', 'album', project.slug], method: 'POST', request: realJpegReq,
  })
  assert.equal(realRes.status, 201)
  assert.equal(db.read('album_photos').length, 1)
})


test('public album GET and POST reject unpublished projects', async () => {
  const db = await makeDb()
  const created = await post(db, 'free-unpublished-album-01', weddingBody({ billing_package_id: 'baslangic' }))
  const { project } = await created.json()
  assert.equal(project.published, false)

  const getRequest = new Request(`http://localhost/api/public/album/${project.slug}`)
  const getResponse = await handlePublicRoutes({
    db,
    route: `/public/album/${project.slug}`,
    path: ['public', 'album', project.slug],
    method: 'GET',
    request: getRequest,
  })
  assert.equal(getResponse.status, 404)

  const postRequest = new Request(`http://localhost/api/public/album/${project.slug}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': 'unpublished-album-01' },
    body: JSON.stringify({
      uploader: 'Misafir',
      photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...'],
    }),
  })
  const postResponse = await handlePublicRoutes({
    db,
    route: `/public/album/${project.slug}`,
    path: ['public', 'album', project.slug],
    method: 'POST',
    request: postRequest,
  })
  assert.equal(postResponse.status, 404)
  assert.equal(db.read('album_photos').length, 0)
})

test('public album API hides album for a newly created project without the existing plan entitlement', async () => {
  const db = await makeDb()
  const created = await post(db, 'free-create-album-qr-01', weddingBody({ billing_package_id: 'baslangic' }))
  const { project } = await created.json()
  await db.collection('event_projects').updateOne(
    { id: project.id },
    { $set: { published: true, album_enabled: true } },
  )

  const request = new Request(`http://localhost/api/public/album/${project.slug}`)
  const response = await handlePublicRoutes({
    db,
    route: `/public/album/${project.slug}`,
    path: ['public', 'album', project.slug],
    method: 'GET',
    request,
  })
  const payload = await response.json()
  assert.equal(response.status, 200)
  assert.equal(payload.enabled, false)
  assert.deepEqual(payload.items, [])
})

test('public album API returns enabled for a published project with the existing plan entitlement', async () => {
  const db = await makeDb({ billing_grants: [grantDoc()] })
  const created = await post(db, 'premium-create-album-qr-01', weddingBody({
    billing_package_id: 'premium',
    album_enabled: true,
  }))
  const { project } = await created.json()
  await db.collection('event_projects').updateOne(
    { id: project.id },
    { $set: { published: true } },
  )

  const request = new Request(`http://localhost/api/public/album/${project.slug}`)
  const response = await handlePublicRoutes({
    db,
    route: `/public/album/${project.slug}`,
    path: ['public', 'album', project.slug],
    method: 'GET',
    request,
  })
  const payload = await response.json()
  assert.equal(response.status, 200)
  assert.equal(payload.enabled, true)
})
