import assert from 'node:assert/strict'
import test from 'node:test'
import { handleAdminRoutes } from './admin-routes.js'
import { canManageAdmin, canReadAdmin, getAdminAuthorizationError, getPostLoginDestination } from '../admin/authorization.js'

function createMemoryDb() {
  const records = new Map()
  const matches = (record, query) => Object.entries(query).every(([key, value]) => {
    if (key === '$or') return value.some((condition) => matches(record, condition))
    const actual = record[key]
    if (value instanceof RegExp) return value.test(actual || '')
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (value.$in) return value.$in.includes(actual)
      if (value.$gt) return actual > value.$gt
    }
    return actual === value
  })
  const db = {
    seed(name, documents) {
      records.set(name, documents.map((item) => ({ ...item })))
    },
    read(name) {
      return records.get(name) || []
    },
    command: async () => ({ ok: 1 }),
    collection(name) {
      const collectionRecords = records.get(name) || []
      records.set(name, collectionRecords)
      return {
        createIndex: async () => 'ok',
        findOne: async (query) => collectionRecords.find((record) => matches(record, query)) || null,
        find: (query = {}) => {
          let result = collectionRecords.filter((record) => matches(record, query))
          const cursor = {
            sort() { return this },
            limit(size) { result = result.slice(0, size); return this },
            toArray: async () => result.map((record) => ({ ...record })),
          }
          return cursor
        },
        insertOne: async (document) => { collectionRecords.push({ ...document }); return { insertedId: document.id } },
        updateOne: async (query, update, { upsert } = {}) => {
          let record = collectionRecords.find((item) => matches(item, query))
          const inserted = !record && upsert
          if (!record && upsert) {
            record = { ...update.$setOnInsert }
            collectionRecords.push(record)
          }
          if (!record) return { matchedCount: 0 }
          Object.assign(record, update.$set)
          return { matchedCount: inserted ? 0 : 1, modifiedCount: inserted || Object.keys(update.$set || {}).length ? 1 : 0, upsertedCount: inserted ? 1 : 0 }
        },
        countDocuments: async (query = {}) => collectionRecords.filter((record) => matches(record, query)).length,
      }
    },
  }
  return db
}

test('only persisted admin roles can read administration data', () => {
  assert.equal(canReadAdmin(null), false)
  assert.equal(canReadAdmin({ role: 'user' }), false)
  assert.equal(canReadAdmin({ role: 'support' }), true)
  assert.equal(canReadAdmin({ role: 'admin' }), true)
  assert.equal(canReadAdmin({ role: 'super_admin' }), true)
})

test('support role is read-only', () => {
  assert.equal(canManageAdmin({ role: 'support' }), false)
  assert.equal(canManageAdmin({ role: 'admin' }), true)
  assert.equal(canManageAdmin({ role: 'super_admin' }), true)
})

test('admins land in admin home after login while regular users retain safe destinations', () => {
  assert.equal(getPostLoginDestination({ role: 'super_admin' }, '/panel'), '/panel/admin')
  assert.equal(getPostLoginDestination({ role: 'admin' }, '/panel/yeni?paket=atelier'), '/panel/admin')
  assert.equal(getPostLoginDestination({ role: 'support' }, '/panel'), '/panel/admin')
  assert.equal(getPostLoginDestination({ role: 'user' }, '/panel/yeni?paket=atelier'), '/panel/yeni?paket=atelier')
  assert.equal(getPostLoginDestination({ role: 'user' }, '//attacker.test'), '/panel')
  assert.equal(getPostLoginDestination({ role: 'user' }, '/panel/admin'), '/panel')
  assert.equal(getPostLoginDestination({ role: 'super_admin' }, '/\\attacker.test'), '/panel/admin')
  assert.equal(getPostLoginDestination({ role: 'super_admin' }, '/fiyatlandirma'), '/fiyatlandirma')
})

test('unauthenticated users are rejected and support cannot mutate admin data', () => {
  assert.deepEqual(getAdminAuthorizationError(null, 'GET'), { status: 401, error: 'Oturum gerekli' })
  assert.deepEqual(getAdminAuthorizationError({ role: 'user' }, 'GET'), {
    status: 403,
    error: 'Bu işlem için yönetici yetkisi gerekli',
  })
  assert.equal(getAdminAuthorizationError({ role: 'support' }, 'PATCH').status, 403)
  assert.equal(getAdminAuthorizationError({ role: 'admin' }, 'PATCH'), null)
})

test('admin package status changes are same-origin, audited, and idempotent', async () => {
  const db = createMemoryDb()
  const user = { id: 'admin-1', role: 'super_admin' }
  const request = (origin = 'https://momentis.test') => new Request(
    'https://momentis.test/api/admin/packages/baslangic',
    {
      method: 'PATCH',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    },
  )

  const rejected = await handleAdminRoutes({
    db, route: '/admin/packages/baslangic', method: 'PATCH', request: request('https://attacker.test'), user,
  })
  assert.equal(rejected.status, 403)

  const changed = await handleAdminRoutes({
    db, route: '/admin/packages/baslangic', method: 'PATCH', request: request(), user,
  })
  assert.equal(changed.status, 200)
  assert.equal((await changed.json()).settings.is_active, false)

  const repeated = await handleAdminRoutes({
    db, route: '/admin/packages/baslangic', method: 'PATCH', request: request(), user,
  })
  assert.equal(repeated.status, 200)

  const logs = await handleAdminRoutes({
    db,
    route: '/admin/audit-logs',
    method: 'GET',
    request: new Request('https://momentis.test/api/admin/audit-logs'),
    user,
  })
  assert.equal((await logs.json()).items.length, 1)
})

test('admin mutation accepts public origin when the app is behind a local reverse proxy', async () => {
  const db = createMemoryDb()
  const request = new Request('http://0.0.0.0:3000/api/admin/packages/baslangic', {
    method: 'PATCH',
    headers: {
      Origin: 'http://localhost:3000',
      Host: 'localhost:3000',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_active: false }),
  })
  const response = await handleAdminRoutes({
    db,
    route: '/admin/packages/baslangic',
    method: 'PATCH',
    request,
    user: { id: 'admin-1', role: 'super_admin' },
  })
  assert.equal(response.status, 200)
})

test('admin mutation rejects a different Origin even when the request Host matches it', async () => {
  const db = createMemoryDb()
  const request = new Request('https://momentis.test/api/admin/packages/baslangic', {
    method: 'PATCH',
    headers: {
      Origin: 'https://attacker.test',
      Host: 'momentis.test',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_active: false }),
  })
  const response = await handleAdminRoutes({
    db,
    route: '/admin/packages/baslangic',
    method: 'PATCH',
    request,
    user: { id: 'admin-1', role: 'super_admin' },
  })
  assert.equal(response.status, 403)
})

test('admin can change an individual invitation or website template tier', async () => {
  const db = createMemoryDb()
  const user = { id: 'admin-1', role: 'super_admin' }
  const siteTemplates = [{ id: 'portfolio', name: 'Modern Düğün', tagline: 'Düzenlenebilir site' }]
  const makeRequest = (key, tier) => new Request(`https://momentis.test/api/admin/templates/website/${key}`, {
    method: 'PATCH',
    headers: { Origin: 'https://momentis.test', 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier }),
  })

  const saved = await handleAdminRoutes({
    db,
    route: '/admin/templates/website/portfolio',
    method: 'PATCH',
    request: makeRequest('portfolio', 'premium'),
    user,
    siteTemplates,
  })
  assert.equal(saved.status, 200)
  assert.equal((await saved.json()).template.tier, 'premium')

  const listed = await handleAdminRoutes({
    db,
    route: '/admin/templates',
    method: 'GET',
    request: new Request('https://momentis.test/api/admin/templates'),
    user,
    siteTemplates,
  })
  const items = (await listed.json()).items
  assert.equal(items.find((item) => item.type === 'website' && item.key === 'portfolio').tier, 'premium')
  assert.equal(items.find((item) => item.type === 'invitation' && item.key === 'riviera').tier, 'free')
  assert.equal(items.some((item) => item.type === 'invitation' && item.key === 'sb-portfolio'), false)

  const duplicateInvitation = await handleAdminRoutes({
    db,
    route: '/admin/templates/invitation/sb-portfolio',
    method: 'PATCH',
    request: new Request('https://momentis.test/api/admin/templates/invitation/sb-portfolio', {
      method: 'PATCH',
      headers: { Origin: 'https://momentis.test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: 'premium' }),
    }),
    user,
    siteTemplates,
  })
  assert.equal(duplicateInvitation.status, 404)
})

test('admin can disable a template and the change is auditable', async () => {
  const db = createMemoryDb()
  const user = { id: 'admin-1', role: 'admin' }
  const request = new Request('https://momentis.test/api/admin/templates/website/portfolio', {
    method: 'PATCH',
    headers: { Origin: 'https://momentis.test', 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: false }),
  })
  const changed = await handleAdminRoutes({
    db, route: '/admin/templates/website/portfolio', method: 'PATCH', request, user,
    siteTemplates: [{ id: 'portfolio', name: 'Modern Düğün', tagline: 'Düzenlenebilir site' }],
  })
  assert.equal(changed.status, 200)
  assert.equal((await changed.json()).template.active, false)

  const listing = await handleAdminRoutes({
    db,
    route: '/admin/templates',
    method: 'GET',
    request: new Request('https://momentis.test/api/admin/templates'),
    user,
    siteTemplates: [{ id: 'portfolio', name: 'Modern Düğün', tagline: 'Düzenlenebilir site' }],
  })
  assert.equal((await listing.json()).items.find((item) => item.key === 'portfolio').active, false)
  const logs = await handleAdminRoutes({
    db, route: '/admin/audit-logs', method: 'GET',
    request: new Request('https://momentis.test/api/admin/audit-logs'), user,
  })
  assert.equal((await logs.json()).items[0].action, 'template.availability.updated')
})

test('only super admins can manage user roles and quotas', async () => {
  const db = createMemoryDb()
  db.seed('users', [
    { id: 'root-1', email: 'root@example.test', role: 'super_admin' },
    { id: 'user-1', email: 'person@example.test', name: 'Test Person', role: 'user' },
  ])
  const makeRequest = (url, method, body) => new Request(`https://momentis.test${url}`, {
    method,
    headers: { Origin: 'https://momentis.test', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const denied = await handleAdminRoutes({
    db, route: '/admin/users', method: 'GET',
    request: new Request('https://momentis.test/api/admin/users'),
    user: { id: 'admin-1', role: 'admin' },
  })
  assert.equal(denied.status, 403)

  const changed = await handleAdminRoutes({
    db, route: '/admin/users/user-1/role', method: 'PATCH',
    request: makeRequest('/api/admin/users/user-1/role', 'PATCH', { role: 'admin' }),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(changed.status, 200)
  assert.equal(db.read('users').find((item) => item.id === 'user-1').role, 'admin')

  const elevatedRole = await handleAdminRoutes({
    db, route: '/admin/users/user-1/role', method: 'PATCH',
    request: makeRequest('/api/admin/users/user-1/role', 'PATCH', { role: 'super_admin' }),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(elevatedRole.status, 400)

  const grantRequest = new Request('https://momentis.test/api/admin/users/user-1/grants', {
    method: 'POST',
    headers: { Origin: 'https://momentis.test', 'Content-Type': 'application/json', 'Idempotency-Key': 'test-grant-0001' },
    body: JSON.stringify({ packageId: 'premium', reason: 'Müşteri destek telafisi' }),
  })
  const granted = await handleAdminRoutes({
    db, route: '/admin/users/user-1/grants', method: 'POST',
    request: grantRequest,
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(granted.status, 201)
  const newGrant = (await granted.json()).grant
  assert.equal(newGrant.eventCredits, 1)

  const retry = await handleAdminRoutes({
    db, route: '/admin/users/user-1/grants', method: 'POST',
    request: new Request('https://momentis.test/api/admin/users/user-1/grants', {
      method: 'POST',
      headers: { Origin: 'https://momentis.test', 'Content-Type': 'application/json', 'Idempotency-Key': 'test-grant-0001' },
      body: JSON.stringify({ packageId: 'premium', reason: 'Müşteri destek telafisi' }),
    }),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(retry.status, 200)
  assert.equal((await retry.json()).idempotent, true)

  const listed = await handleAdminRoutes({
    db, route: '/admin/users', method: 'GET',
    request: new Request('https://momentis.test/api/admin/users'),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal((await listed.json()).items.find((item) => item.id === 'user-1').quota.remainingCredits, 1)

  const revoked = await handleAdminRoutes({
    db, route: `/admin/users/user-1/grants/${newGrant.id}`, method: 'PATCH',
    request: makeRequest(`/api/admin/users/user-1/grants/${newGrant.id}`, 'PATCH', { action: 'revoke', reason: 'Yanlış kullanıcıya tanımlandı' }),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(revoked.status, 200)
  const revokedAgain = await handleAdminRoutes({
    db, route: `/admin/users/user-1/grants/${newGrant.id}`, method: 'PATCH',
    request: makeRequest(`/api/admin/users/user-1/grants/${newGrant.id}`, 'PATCH', { action: 'revoke', reason: 'Yanlış kullanıcıya tanımlandı' }),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal((await revokedAgain.json()).idempotent, true)
})

test('diagnostics are available to admins, not support, and report persisted failures', async () => {
  const db = createMemoryDb()
  db.seed('message_logs', [{ id: 'log-1', status: 'failed', type: 'invitation', channel: 'email', project_id: 'project-1', error: 'Provider unavailable' }])
  const request = new Request('https://momentis.test/api/admin/diagnostics')
  const denied = await handleAdminRoutes({ db, route: '/admin/diagnostics', method: 'GET', request, user: { role: 'support' } })
  assert.equal(denied.status, 403)
  const result = await handleAdminRoutes({ db, route: '/admin/diagnostics', method: 'GET', request, user: { role: 'admin' } })
  assert.equal(result.status, 200)
  const diagnostics = await result.json()
  assert.equal(diagnostics.checks.failedMessages, 1)
  assert.equal(diagnostics.failures[0].error, 'Provider unavailable')
})
