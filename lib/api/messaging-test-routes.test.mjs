import assert from 'node:assert/strict'
import test from 'node:test'
import { handleMessagingTestRoutes } from './messaging-test-routes.js'

function createDb() {
  const records = []
  return {
    records,
    collection() {
      return {
        async createIndex() {},
        async insertOne(record) {
          if (records.some((item) => item.user_id === record.user_id && item.idempotency_key === record.idempotency_key)) {
            const error = new Error('duplicate key')
            error.code = 11000
            throw error
          }
          records.push(structuredClone(record))
        },
        async findOne(filter) {
          const record = records.find((item) => Object.entries(filter).every(([key, value]) => item[key] === value))
          return record ? structuredClone(record) : null
        },
        async updateOne(filter, update) {
          const record = records.find((item) => Object.entries(filter).every(([key, value]) => item[key] === value))
          if (!record) return { matchedCount: 0, modifiedCount: 0 }
          Object.assign(record, structuredClone(update.$set))
          return { matchedCount: 1, modifiedCount: 1 }
        },
      }
    },
  }
}

function request(key = 'resend-test-0001', origin = 'https://momentis.test') {
  return new Request('https://momentis.test/api/messaging/test-email', {
    method: 'POST',
    headers: { 'Idempotency-Key': key, origin },
  })
}

const user = { id: 'user-1', email: 'account@example.test' }

test('Resend connection test sends only to the authenticated account and is idempotent', async () => {
  const previousKey = process.env.RESEND_API_KEY
  process.env.RESEND_API_KEY = 'test-key'
  try {
    const db = createDb()
    const recipients = []
    const context = { db, route: '/messaging/test-email', method: 'POST', request: request(), user }
    const options = { sendEmail: async ({ to }) => { recipients.push(to); return { id: 'resend-message-1' } } }
    const first = await handleMessagingTestRoutes(context, options)
    const repeated = await handleMessagingTestRoutes(context, options)
    assert.equal(first.status, 201)
    assert.equal((await first.json()).status, 'sent')
    assert.equal(repeated.status, 200)
    assert.equal((await repeated.json()).idempotent, true)
    assert.deepEqual(recipients, [user.email])
    assert.equal(db.records.length, 1)
    assert.equal(db.records[0].provider_id, 'resend-message-1')
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previousKey
  }
})

test('Resend connection test rejects missing sessions and cross-origin requests', async () => {
  const previousKey = process.env.RESEND_API_KEY
  process.env.RESEND_API_KEY = 'test-key'
  try {
    const db = createDb()
    let sends = 0
    const options = { sendEmail: async () => { sends++; return { id: 'should-not-send' } } }
    const base = { db, route: '/messaging/test-email', method: 'POST' }
    const unauthenticated = await handleMessagingTestRoutes({ ...base, request: request(), user: null }, options)
    const crossOrigin = await handleMessagingTestRoutes({ ...base, request: request('resend-test-0002', 'https://evil.test'), user }, options)
    assert.equal(unauthenticated.status, 401)
    assert.equal(crossOrigin.status, 403)
    assert.equal(sends, 0)
    assert.equal(db.records.length, 0)
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previousKey
  }
})

test('Resend provider failures are explicitly logged and returned without exposing secrets', async () => {
  const previousKey = process.env.RESEND_API_KEY
  process.env.RESEND_API_KEY = 'test-key'
  const originalError = console.error
  console.error = () => {}
  try {
    const db = createDb()
    const response = await handleMessagingTestRoutes({
      db,
      route: '/messaging/test-email',
      method: 'POST',
      request: request(),
      user,
    }, { sendEmail: async () => { throw new Error('provider failed for test-key') } })
    const body = await response.json()
    assert.equal(response.status, 502)
    assert.equal(body.status, 'failed')
    assert.equal(body.error.includes('test-key'), false)
    assert.equal(db.records[0].status, 'failed')
    assert.equal(db.records[0].error.includes('test-key'), false)
  } finally {
    console.error = originalError
    if (previousKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previousKey
  }
})

