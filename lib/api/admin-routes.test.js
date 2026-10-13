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
      if (value.$nin) return !value.$nin.includes(actual)
      if (value.$gt !== undefined) return actual > value.$gt
      if (value.$gte !== undefined) return actual >= value.$gte
      if (value.$ne !== undefined) return actual !== value.$ne
      if (value.$exists !== undefined) return (actual !== undefined) === value.$exists
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
            skip(size) { result = result.slice(size); return this },
            limit(size) { result = result.slice(0, size); return this },
            toArray: async () => result.map((record) => ({ ...record })),
          }
          return cursor
        },
        insertOne: async (document) => { collectionRecords.push({ ...document }); return { insertedId: document.id } },
        deleteOne: async (query) => {
          const index = collectionRecords.findIndex((record) => matches(record, query))
          if (index < 0) return { deletedCount: 0 }
          collectionRecords.splice(index, 1)
          return { deletedCount: 1 }
        },
        deleteMany: async (query) => {
          const before = collectionRecords.length
          records.set(name, collectionRecords.filter((record) => !matches(record, query)))
          return { deletedCount: before - records.get(name).length }
        },
        updateOne: async (query, update, { upsert } = {}) => {
          let record = collectionRecords.find((item) => matches(item, query))
          const inserted = !record && upsert
          if (!record && upsert) {
            record = { ...update.$setOnInsert }
            collectionRecords.push(record)
          }
          if (!record) return { matchedCount: 0 }
          Object.assign(record, update.$set)
          for (const [key, amount] of Object.entries(update.$inc || {})) record[key] = (record[key] || 0) + amount
          return { matchedCount: inserted ? 0 : 1, modifiedCount: inserted || Object.keys(update.$set || {}).length || Object.keys(update.$inc || {}).length ? 1 : 0, upsertedCount: inserted ? 1 : 0 }
        },
        countDocuments: async (query = {}) => collectionRecords.filter((record) => matches(record, query)).length,
      }
    },
    client: {
      startSession() {
        return {
          withTransaction: async (operation) => operation({}),
          endSession: async () => {},
        }
      },
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
    body: JSON.stringify({ packageId: 'premium', amount: 1, reason: 'Müşteri destek telafisi' }),
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
      body: JSON.stringify({ packageId: 'premium', amount: 1, reason: 'Müşteri destek telafisi' }),
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

test('user list filters and paginates without exposing authentication fields', async () => {
  const db = createMemoryDb()
  db.seed('users', [
    { id: 'user-1', name: 'Ada', email: 'ada@example.test', role: 'user', created_at: new Date('2025-01-01'), password_hash: 'secret-1' },
    { id: 'user-2', name: 'Bora', email: 'bora@example.test', role: 'admin', account_status: 'suspended', created_at: new Date('2025-01-02'), password_hash: 'secret-2' },
  ])
  db.seed('billing_grants', [{ id: 'grant-1', user_id: 'user-1', package_id: 'premium', event_credits: 1, remaining_event_credits: 1, status: 'active' }])
  const request = new Request('https://momentis.test/api/admin/users?status=active&page=1&limit=1')
  const response = await handleAdminRoutes({ db, route: '/admin/users', method: 'GET', request, user: { id: 'root-1', role: 'super_admin' } })
  const payload = await response.json()
  assert.equal(payload.total, 1)
  assert.equal(payload.page, 1)
  assert.equal(payload.items[0].id, 'user-1')
  assert.equal(payload.items[0].quota.remainingCredits, 1)
  assert.equal(payload.items[0].status, 'active')
  assert.equal(JSON.stringify(payload).includes('password_hash'), false)
  assert.equal(JSON.stringify(payload).includes('secret-1'), false)
})

test('user profile updates are authorized, constrained, and auditable', async () => {
  const db = createMemoryDb()
  db.seed('users', [{ id: 'user-1', name: 'Old Name', email: 'user@example.test', role: 'user' }])
  const makeRequest = (body, origin = 'https://momentis.test') => new Request('https://momentis.test/api/admin/users/user-1', {
    method: 'PATCH',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const denied = await handleAdminRoutes({
    db, route: '/admin/users/user-1', method: 'PATCH', request: makeRequest({ name: 'New Name' }),
    user: { id: 'admin-1', role: 'admin' },
  })
  assert.equal(denied.status, 403)
  const changed = await handleAdminRoutes({
    db, route: '/admin/users/user-1', method: 'PATCH', request: makeRequest({ name: 'New Name' }),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(changed.status, 200)
  assert.equal(db.read('users')[0].name, 'New Name')
  assert.equal(db.read('admin_audit_logs')[0].action, 'user.profile.updated')
  const emailMutation = await handleAdminRoutes({
    db, route: '/admin/users/user-1', method: 'PATCH', request: makeRequest({ email: 'changed@example.test' }),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(emailMutation.status, 400)
})

test('support and regular admin roles cannot read or mutate user management records', async () => {
  const db = createMemoryDb()
  db.seed('users', [{ id: 'user-1', name: 'Test User', email: 'user@example.test', role: 'user' }])
  const routes = [
    ['/admin/users/user-1', 'GET', undefined],
    ['/admin/users/user-1', 'PATCH', { name: 'Changed' }],
    ['/admin/users/user-1/status', 'PATCH', { status: 'suspended' }],
    ['/admin/users/user-1/credits', 'POST', { kind: 'subtract', amount: 1, reason: 'Approved adjustment' }],
    ['/admin/users/user-1', 'DELETE', { confirmEmail: 'user@example.test' }],
  ]
  for (const role of ['support', 'admin']) {
    for (const [route, method, body] of routes) {
      const request = new Request(`https://momentis.test/api${route}`, {
        method,
        headers: { Origin: 'https://momentis.test', 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      const response = await handleAdminRoutes({
        db, route, method, request, user: { id: `${role}-1`, role },
      })
      assert.equal(response.status, 403, `${role} should be denied ${method} ${route}`)
    }
  }
})

test('user detail returns real related records while excluding passwords and private event payloads', async () => {
  const db = createMemoryDb()
  db.seed('users', [{
    id: 'user-1', name: 'Test User', email: 'user@example.test', role: 'user',
    created_at: new Date('2025-01-01'), password_hash: 'private-hash',
  }])
  db.seed('billing_accounts', [{ user_id: 'user-1', plan_id: 'baslangic' }])
  db.seed('event_projects', [{
    id: 'event-1', user_id: 'user-1', title: 'Test event', event_type: 'dugun', date: '2027-01-01',
    deliverables: { invitation: { enabled: true } }, published: true, canvas_design: { secret: 'private-canvas' },
    gift_iban: 'private-iban', created_at: new Date('2025-01-02'),
  }])
  db.seed('vip_design_requests', [{
    id: 'vip-1', user_id: 'user-1', status: 'submitted', createdAt: new Date('2025-01-03'),
    eventDetails: { eventType: 'dugun', date: '2027-02-03', address: 'private-address', familyInfo: 'private-family' },
    site_draft: { status: 'draft', private: 'site-payload' },
  }])
  db.seed('billing_purchases', [{
    id: 'purchase-1', user_id: 'user-1', package_id: 'premium', amount: 1490, currency: 'TRY',
    provider: 'mock', status: 'pending', idempotency_key: 'private-key',
  }])
  db.seed('vip_credit_movements', [{
    request_id: 'vip-1', user_id: 'user-1', kind: 'debit', amount: 2,
    reason: 'private customer note', allocations: [{ grant_id: 'grant-1' },], created_at: new Date(),
  }])
  const response = await handleAdminRoutes({
    db,
    route: '/admin/users/user-1',
    method: 'GET',
    request: new Request('https://momentis.test/api/admin/users/user-1'),
    user: { id: 'root-1', role: 'super_admin' },
  })
  const payload = await response.json()
  assert.equal(response.status, 200)
  assert.equal(payload.events[0].id, 'event-1')
  assert.equal(payload.invitations[0].id, 'event-1')
  assert.equal(payload.vipRequests[0].eventDetails.eventType, 'dugun')
  assert.equal(payload.orders[0].id, 'purchase-1')
  assert.equal(payload.creditMovements[0].source, 'vip')
  const serialized = JSON.stringify(payload)
  for (const sensitive of ['private-hash', 'private-canvas', 'private-iban', 'private-address', 'private-family', 'private-key', 'private customer note', 'site-payload']) {
    assert.equal(serialized.includes(sensitive), false)
  }
})

test('credit additions require plan-matching amounts and record immutable movements; deductions debit grants', async () => {
  const db = createMemoryDb()
  db.seed('users', [
    { id: 'root-1', email: 'root@example.test', role: 'super_admin' },
    { id: 'user-1', email: 'person@example.test', name: 'Test Person', role: 'user' },
  ])
  const addRequest = (amount, key = 'credit-add-0001') => new Request('https://momentis.test/api/admin/users/user-1/grants', {
    method: 'POST',
    headers: { Origin: 'https://momentis.test', 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify({ packageId: 'atolye', amount, reason: 'Kampanya kapsaminda destek' }),
  })
  const invalid = await handleAdminRoutes({
    db, route: '/admin/users/user-1/grants', method: 'POST', request: addRequest(2),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(invalid.status, 400)
  const added = await handleAdminRoutes({
    db, route: '/admin/users/user-1/grants', method: 'POST', request: addRequest(3),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(added.status, 201, JSON.stringify(await added.clone().json()))
  assert.equal(db.read('admin_credit_movements')[0].amount, 3)
  assert.equal(db.read('admin_credit_movements')[0].kind, 'credit')

  const debit = await handleAdminRoutes({
    db, route: '/admin/users/user-1/credits', method: 'POST',
    request: new Request('https://momentis.test/api/admin/users/user-1/credits', {
      method: 'POST',
      headers: { Origin: 'https://momentis.test', 'Content-Type': 'application/json', 'Idempotency-Key': 'credit-debit-0001' },
      body: JSON.stringify({ kind: 'subtract', amount: 2, reason: 'Duzeltme talebi onaylandi' }),
    }),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(debit.status, 201, JSON.stringify(await debit.clone().json()))
  assert.equal(db.read('billing_grants')[0].remaining_event_credits, 1)
  assert.equal(db.read('admin_credit_movements').length, 2)
  assert.deepEqual(db.read('admin_credit_movements')[1].allocations, [{ grant_id: db.read('billing_grants')[0].id, amount: 2 }])
  const insufficient = await handleAdminRoutes({
    db, route: '/admin/users/user-1/credits', method: 'POST',
    request: new Request('https://momentis.test/api/admin/users/user-1/credits', {
      method: 'POST',
      headers: { Origin: 'https://momentis.test', 'Content-Type': 'application/json', 'Idempotency-Key': 'credit-debit-0002' },
      body: JSON.stringify({ kind: 'subtract', amount: 2, reason: 'Duzeltme talebi onaylandi' }),
    }),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(insufficient.status, 409)
})

test('account suspension protects self, super admins, and the final active admin', async () => {
  const db = createMemoryDb()
  db.seed('users', [
    { id: 'admin-1', role: 'admin' },
    { id: 'user-1', role: 'user' },
  ])
  const setStatus = (id, status) => new Request(`https://momentis.test/api/admin/users/${id}/status`, {
    method: 'PATCH',
    headers: { Origin: 'https://momentis.test', 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const lastAdmin = await handleAdminRoutes({
    db, route: '/admin/users/admin-1/status', method: 'PATCH', request: setStatus('admin-1', 'suspended'),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(lastAdmin.status, 409)
  const self = await handleAdminRoutes({
    db, route: '/admin/users/root-1/status', method: 'PATCH', request: setStatus('root-1', 'suspended'),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(self.status, 409)
  const suspended = await handleAdminRoutes({
    db, route: '/admin/users/user-1/status', method: 'PATCH', request: setStatus('user-1', 'suspended'),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(suspended.status, 200)
  assert.equal(db.read('users').find((item) => item.id === 'user-1').account_status, 'suspended')
  const activated = await handleAdminRoutes({
    db, route: '/admin/users/user-1/status', method: 'PATCH', request: setStatus('user-1', 'active'),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(activated.status, 200)
  assert.equal(db.read('users').find((item) => item.id === 'user-1').account_status, 'active')
})

test('bulk account changes audit each target and preserve at least one active administrator', async () => {
  const db = createMemoryDb()
  db.seed('users', [
    { id: 'admin-1', role: 'admin', account_status: 'active' },
    { id: 'admin-2', role: 'admin', account_status: 'active' },
    { id: 'user-1', role: 'user', account_status: 'active' },
  ])
  const makeRequest = (userIds) => new Request('https://momentis.test/api/admin/users/bulk-status', {
    method: 'POST',
    headers: { Origin: 'https://momentis.test', 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds, status: 'suspended', reason: 'Policy violation reviewed' }),
  })
  const root = { id: 'root-1', role: 'super_admin' }
  const changed = await handleAdminRoutes({
    db, route: '/admin/users/bulk-status', method: 'POST',
    request: makeRequest(['admin-1', 'user-1']), user: root,
  })
  assert.equal(changed.status, 200)
  assert.deepEqual((await changed.json()).changed.sort(), ['admin-1', 'user-1'])
  assert.equal(db.read('admin_audit_logs').length, 2)

  const lastAdmin = await handleAdminRoutes({
    db, route: '/admin/users/bulk-status', method: 'POST',
    request: makeRequest(['admin-2']), user: root,
  })
  assert.equal(lastAdmin.status, 409)
  assert.equal(db.read('users').find((item) => item.id === 'admin-2').account_status, 'active')
})

test('user deletion is confirmed, relation-safe, and refuses the last admin', async () => {
  const db = createMemoryDb()
  db.seed('users', [
    { id: 'admin-1', email: 'admin@example.test', role: 'admin' },
    { id: 'user-1', email: 'user@example.test', role: 'user' },
    { id: 'empty-1', email: 'empty@example.test', role: 'user' },
  ])
  db.seed('event_projects', [{ id: 'event-1', user_id: 'user-1' }])
  const deleteRequest = (id, confirmEmail) => new Request(`https://momentis.test/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: { Origin: 'https://momentis.test', 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmEmail }),
  })
  const related = await handleAdminRoutes({
    db, route: '/admin/users/user-1', method: 'DELETE', request: deleteRequest('user-1', 'user@example.test'),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(related.status, 409)
  assert.equal(db.read('users').some((item) => item.id === 'user-1'), true)
  const finalAdmin = await handleAdminRoutes({
    db, route: '/admin/users/admin-1', method: 'DELETE', request: deleteRequest('admin-1', 'admin@example.test'),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(finalAdmin.status, 409)
  const wrongConfirmation = await handleAdminRoutes({
    db, route: '/admin/users/empty-1', method: 'DELETE', request: deleteRequest('empty-1', 'wrong@example.test'),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(wrongConfirmation.status, 400)
  const removed = await handleAdminRoutes({
    db, route: '/admin/users/empty-1', method: 'DELETE', request: deleteRequest('empty-1', 'empty@example.test'),
    user: { id: 'root-1', role: 'super_admin' },
  })
  assert.equal(removed.status, 200)
  assert.equal(db.read('users').some((item) => item.id === 'empty-1'), false)
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
