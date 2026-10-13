import assert from 'node:assert/strict'
import test from 'node:test'
import { getAccountDeletionSummary, performAccountDeletion } from './account-deletion.js'

function getPath(value, path) {
  return path.split('.').reduce((current, part) => current?.[part], value)
}

function matches(record, query) {
  return Object.entries(query).every(([key, value]) => {
    if (key === '$or') return value.some((condition) => matches(record, condition))
    const actual = getPath(record, key)
    if (value instanceof RegExp) return value.test(String(actual || ''))
    if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
      if (value.$in) return value.$in.includes(actual)
      if (value.$nin) return !value.$nin.includes(actual)
      if (value.$gt !== undefined) return actual > value.$gt
      if (value.$ne !== undefined) return actual !== value.$ne
      if (value.$exists !== undefined) return (actual !== undefined) === value.$exists
      return false
    }
    return actual === value
  })
}

function applyUpdate(record, update) {
  Object.assign(record, update.$setOnInsert || {}, update.$set || {})
  for (const [key, amount] of Object.entries(update.$inc || {})) record[key] = (record[key] || 0) + amount
  for (const key of Object.keys(update.$unset || {})) {
    const parts = key.split('.')
    const parent = parts.slice(0, -1).reduce((current, part) => current?.[part], record)
    if (parent) delete parent[parts.at(-1)]
  }
}

function createMemoryDb(seed = {}) {
  const records = new Map(Object.entries(seed).map(([name, rows]) => [name, rows.map((row) => structuredClone(row))]))
  const db = {
    read(name) { return records.get(name) || [] },
    collection(name) {
      const rows = records.get(name) || []
      records.set(name, rows)
      return {
        createIndex: async () => 'ok',
        findOne: async (query) => rows.find((row) => matches(row, query)) || null,
        find(query = {}) {
          const result = rows.filter((row) => matches(row, query))
          return { toArray: async () => result.map((row) => structuredClone(row)) }
        },
        insertOne: async (doc) => {
          rows.push(structuredClone(doc))
          return { insertedId: doc.id }
        },
        updateOne: async (query, update, { upsert } = {}) => {
          let record = rows.find((row) => matches(row, query))
          const inserted = !record && upsert
          if (!record && upsert) {
            record = {}
            rows.push(record)
          }
          if (!record) return { matchedCount: 0, modifiedCount: 0 }
          applyUpdate(record, update)
          return { matchedCount: inserted ? 0 : 1, modifiedCount: 1, upsertedCount: inserted ? 1 : 0 }
        },
        updateMany: async (query, update) => {
          const matched = rows.filter((row) => matches(row, query))
          matched.forEach((row) => applyUpdate(row, update))
          return { matchedCount: matched.length, modifiedCount: matched.length }
        },
        deleteOne: async (query) => {
          const index = rows.findIndex((row) => matches(row, query))
          if (index < 0) return { deletedCount: 0 }
          rows.splice(index, 1)
          return { deletedCount: 1 }
        },
        deleteMany: async (query) => {
          const remaining = rows.filter((row) => !matches(row, query))
          records.set(name, remaining)
          return { deletedCount: rows.length - remaining.length }
        },
        countDocuments: async (query = {}) => rows.filter((row) => matches(row, query)).length,
      }
    },
    client: {
      startSession() {
        return { withTransaction: async (operation) => operation({}), endSession: async () => {} }
      },
    },
  }
  return db
}

test('account deletion preview exposes related content, orders, VIP requests, and available credits', async () => {
  const db = createMemoryDb({
    event_projects: [{ id: 'event-1', user_id: 'user-1', deliverables: { invitation: { enabled: true } } }],
    guests: [{ project_id: 'event-1' }],
    vip_design_requests: [{ id: 'vip-1', user_id: 'user-1', status: 'pending' }],
    billing_purchases: [{ id: 'order-1', user_id: 'user-1', status: 'pending' }],
    billing_grants: [{ user_id: 'user-1', status: 'active', remaining_event_credits: 4 }],
  })
  assert.deepEqual(await getAccountDeletionSummary(db, 'user-1'), {
    events: 1,
    invitations: 1,
    guests: 1,
    vipRequests: 1,
    pendingVipRequests: 1,
    orders: 1,
    pendingOrders: 1,
    remainingCredits: 4,
  })
})

test('self-deletion anonymizes the account, removes personal event data, forfeits credits, and retains orders', async () => {
  const db = createMemoryDb({
    users: [{
      id: 'user-1',
      email: 'user@example.test',
      name: 'Private Name',
      role: 'user',
      account_status: 'active',
      auth_provider: 'password',
      password_hash: 'hashed-secret',
    }],
    event_projects: [{ id: 'event-1', user_id: 'user-1', title: 'Private event', deliverables: { invitation: { enabled: true } } }],
    guests: [{ id: 'guest-1', project_id: 'event-1', name: 'Guest' }],
    rsvps: [{ project_id: 'event-1' }],
    album_photos: [{ project_id: 'event-1' }],
    guestbook_messages: [{ project_id: 'event-1' }],
    message_logs: [{ project_id: 'event-1' }],
    billing_project_entitlements: [{ project_id: 'event-1' }],
    billing_purchases: [{ id: 'order-1', user_id: 'user-1', status: 'mock_verified', amount: 1490 }],
    billing_grants: [{ id: 'grant-1', user_id: 'user-1', status: 'active', remaining_event_credits: 3 }],
    vip_design_requests: [{
      id: 'vip-1',
      user_id: 'user-1',
      status: 'completed',
      user_snapshot: { name: 'Private Name', email: 'user@example.test' },
      eventDetails: { title: 'Private event' },
      delivery_outputs: { private: true },
    }],
    password_reset_tokens: [{ user_id: 'user-1' }],
    billing_usage_counters: [{ user_id: 'user-1' }],
    billing_usage_operations: [{ user_id: 'user-1' }],
    notifications: [{ user_id: 'user-1' }],
    login_attempts: [{ identifier: '127.0.0.1:user@example.test' }],
  })

  const result = await performAccountDeletion(db, 'user-1', 'user@example.test')
  assert.equal(result.ok, true)
  const account = db.read('users')[0]
  assert.equal(account.account_status, 'deleted')
  assert.equal(account.email, 'deleted+user-1@deleted.invalid')
  assert.equal(account.name, 'Silinmiş kullanıcı')
  assert.equal('password_hash' in account, false)
  assert.equal(db.read('event_projects').length, 0)
  assert.equal(db.read('guests').length, 0)
  assert.equal(db.read('rsvps').length, 0)
  assert.equal(db.read('billing_purchases').length, 1)
  assert.equal(db.read('billing_grants')[0].remaining_event_credits, 0)
  assert.equal(db.read('billing_grants')[0].status, 'closed')
  assert.equal(db.read('admin_credit_movements')[0].amount, -3)
  assert.equal(db.read('vip_design_requests')[0].user_snapshot.email, '')
  assert.equal('eventDetails' in db.read('vip_design_requests')[0], false)
  assert.equal(db.read('notifications').length, 0)
})

test('deletion is blocked while VIP or purchase activity is pending and protects the final admin', async () => {
  const pendingDb = createMemoryDb({
    users: [{ id: 'user-1', email: 'user@example.test', role: 'user', account_status: 'active' }],
    vip_design_requests: [{ id: 'vip-1', user_id: 'user-1', status: 'in_progress' }],
  })
  const pending = await performAccountDeletion(pendingDb, 'user-1', 'user@example.test')
  assert.equal(pending.status, 409)
  assert.equal(pendingDb.read('users')[0].account_status, 'active')

  const adminDb = createMemoryDb({
    users: [{ id: 'admin-1', email: 'admin@example.test', role: 'admin', account_status: 'active' }],
  })
  const lastAdmin = await performAccountDeletion(adminDb, 'admin-1', 'admin@example.test')
  assert.equal(lastAdmin.status, 409)
  assert.equal(adminDb.read('users')[0].email, 'admin@example.test')
})
