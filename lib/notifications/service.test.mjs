import assert from 'node:assert/strict'
import test from 'node:test'
import { createNotification, notifyAdmins, retryNotificationEmail } from './service.js'
import { handleNotificationRoutes } from '../api/notification-routes.js'
import { buildNotificationEmail } from './email-templates.js'

function clone(value) {
  return structuredClone(value)
}

function matches(document, filter) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = key.split('.').reduce((value, part) => value?.[part], document)
    if (expected && typeof expected === 'object' && '$in' in expected) return expected.$in.includes(actual)
    return actual === expected
  })
}

function setPath(target, path, value) {
  const parts = path.split('.')
  const last = parts.pop()
  const parent = parts.reduce((current, part) => (current[part] ||= {}), target)
  parent[last] = clone(value)
}

function createDb(seed = []) {
  const collections = new Map([['notifications', seed.map(clone)]])
  return {
    collections,
    get records() {
      return collections.get('notifications')
    },
    collection(name) {
      if (!collections.has(name)) collections.set(name, [])
      const records = collections.get(name)
      return {
        async createIndex() {},
        async insertOne(record) {
          if (name === 'notifications' && records.some((item) => item.event_id === record.event_id && item.recipient_id === record.recipient_id)) {
            const error = new Error('duplicate key')
            error.code = 11000
            throw error
          }
          records.push(clone(record))
          return { insertedId: record.id }
        },
        async findOne(filter) {
          const record = records.find((item) => matches(item, filter))
          return record ? clone(record) : null
        },
        find(filter) {
          let results = records.filter((record) => matches(record, filter)).map(clone)
          const cursor = {
            sort(fields) {
              const [[key, direction]] = Object.entries(fields)
              results.sort((left, right) => (new Date(right[key]).getTime() - new Date(left[key]).getTime()) * direction)
              return cursor
            },
            limit(count) {
              results = results.slice(0, count)
              return cursor
            },
            async toArray() {
              return results
            },
          }
          return cursor
        },
        async countDocuments(filter) {
          return records.filter((record) => matches(record, filter)).length
        },
        async updateOne(filter, update) {
          const record = records.find((item) => matches(item, filter))
          if (!record) return { matchedCount: 0, modifiedCount: 0 }
          for (const [key, value] of Object.entries(update.$set || {})) setPath(record, key, value)
          for (const [key, value] of Object.entries(update.$inc || {})) {
            const oldValue = key.split('.').reduce((current, part) => current?.[part], record) || 0
            setPath(record, key, oldValue + value)
          }
          for (const key of Object.keys(update.$unset || {})) {
            const parts = key.split('.')
            const last = parts.pop()
            const parent = parts.reduce((current, part) => current?.[part], record)
            if (parent) delete parent[last]
          }
          return { matchedCount: 1, modifiedCount: 1 }
        },
        async updateMany(filter, update) {
          let modifiedCount = 0
          for (const record of records.filter((item) => matches(item, filter))) {
            for (const [key, value] of Object.entries(update.$set || {})) setPath(record, key, value)
            modifiedCount++
          }
          return { modifiedCount }
        },
      }
    },
  }
}

test('notification insert is idempotent and sends email only once', async () => {
  const previousKey = process.env.RESEND_API_KEY
  process.env.RESEND_API_KEY = 'test-key'
  try {
    const db = createDb()
    let sends = 0
    const options = { sendEmail: async () => { sends++; return { id: 'email-1' } } }
    const input = {
      eventId: 'vip:request-1:created:user',
      recipientId: 'user-1',
      type: 'vip_request',
      title: 'VIP talebiniz alındı',
      message: 'Talebiniz alındı.',
      emailTo: 'user@example.test',
      emailTemplate: 'vipRequestCustomer',
    }
    const first = await createNotification(db, input, options)
    const duplicate = await createNotification(db, input, options)
    assert.equal(first.duplicate, false)
    assert.equal(first.notification.email.status, 'sent')
    assert.equal(duplicate.duplicate, true)
    assert.equal(db.records.length, 1)
    assert.equal(sends, 1)
    assert.equal(db.records[0].email.attempts, 1)
    assert.equal(db.records[0].email.template, 'vipRequestCustomer')
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previousKey
  }
})

test('notification email templates use event-appropriate content, CTAs and escaped dynamic text', async () => {
  const userEmail = buildNotificationEmail({
    title: 'VIP talebiniz <güncellendi>',
    message: 'Yeni aşama & tasarım süreci',
    href: '/panel/vip-taleplerim/VIP-1',
    email: { template: 'vipStatusCustomer', subject: 'VIP talep güncellendi' },
  }, 'https://momentis.test')
  const adminEmail = buildNotificationEmail({
    title: 'Yeni VIP talebi',
    message: 'Kullanıcı yeni bir talep iletti.',
    href: '/panel/admin/vip-talepler/VIP-1',
    email: { template: 'vipRequestAdmin', subject: 'Yeni VIP talebi' },
  }, 'https://momentis.test')

  assert.equal(userEmail.subject, 'VIP talep güncellendi')
  assert.match(userEmail.html, /MOMENTIS · VIP talep güncellemesi/)
  assert.match(userEmail.html, /Talebimin durumunu gör/)
  assert.match(userEmail.html, /VIP talebiniz &lt;güncellendi&gt;/)
  assert.match(userEmail.html, /Yeni aşama &amp; tasarım süreci/)
  assert.match(adminEmail.html, /MOMENTIS · Yeni VIP talebi/)
  assert.match(adminEmail.html, /Talebi yönet/)
})

test('unknown notification email templates are rejected before an event is stored', async () => {
  const db = createDb()
  await assert.rejects(createNotification(db, {
    eventId: 'account:unknown-template:user',
    recipientId: 'user-3',
    type: 'account',
    title: 'Hesap bildirimi',
    message: 'Hesap bildirimi içeriği.',
    emailTemplate: 'not-a-template',
  }), /Bilinmeyen e-posta şablonu/)
  assert.equal(db.records.length, 0)
})

test('admin VIP stage notifications stay in-app while customer stage emails use the customer template', async () => {
  const previousKey = process.env.RESEND_API_KEY
  process.env.RESEND_API_KEY = 'test-key'
  const db = createDb()
  try {
    await createNotification(db, {
      eventId: 'vip:request-4:status:approved:user',
      recipientId: 'user-4',
      type: 'vip_status',
      title: 'VIP talebiniz: Onaylandı',
      message: 'Tasarım aşamasına geçildi.',
      emailTo: 'customer@example.test',
      emailTemplate: 'vipStatusCustomer',
    }, { sendEmail: async () => ({ id: 'customer-status-email' }) })
    await createNotification(db, {
      eventId: 'vip:request-4:admin-status:approved',
      recipientId: 'admin-4',
      audience: 'admin',
      type: 'vip_status',
      title: 'VIP talep aşaması güncellendi',
      message: 'Talep onaylandı.',
      emailTo: 'admin@example.test',
      emailTemplate: 'vipStatusAdmin',
      email: false,
    })
    assert.equal(db.records.find((item) => item.recipient_id === 'user-4').email.status, 'sent')
    const adminNotice = db.records.find((item) => item.recipient_id === 'admin-4')
    assert.equal(adminNotice.email.template, 'vipStatusAdmin')
    assert.equal(adminNotice.email.status, 'not_requested')
    assert.equal(adminNotice.email.attempts, 0)
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previousKey
  }
})

test('email failure is recorded without losing the in-app notification', async () => {
  const previousKey = process.env.RESEND_API_KEY
  process.env.RESEND_API_KEY = 'test-key'
  const originalError = console.error
  console.error = () => {}
  try {
    const db = createDb()
    const result = await createNotification(db, {
      eventId: 'account:failed-email:user',
      recipientId: 'user-2',
      type: 'account',
      title: 'Hesap bildirimi',
      message: 'Hesap bildirimi içeriği.',
      emailTo: 'user@example.test',
    }, { sendEmail: async () => { throw new Error('provider unavailable') } })
    assert.equal(result.notification.email.status, 'failed')
    assert.equal(db.records[0].email.status, 'failed')
    assert.equal(db.records[0].email.attempts, 1)
    assert.equal(db.records.length, 1)
  } finally {
    console.error = originalError
    if (previousKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previousKey
  }
})

test('notification is retained with an explicit status when email is not configured', async () => {
  const previousKey = process.env.RESEND_API_KEY
  delete process.env.RESEND_API_KEY
  try {
    const db = createDb()
    const result = await createNotification(db, {
      eventId: 'vip:no-email:user',
      recipientId: 'user-3',
      type: 'vip_request',
      title: 'Talep alındı',
      message: 'Talebiniz kaydedildi.',
      emailTo: 'user@example.test',
    })
    assert.equal(result.notification.email.status, 'not_configured')
    assert.equal(db.records.length, 1)
    assert.equal(db.records[0].email.status, 'not_configured')
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previousKey
  }
})

test('admin events are persisted separately for admin and support recipients', async () => {
  const previousKey = process.env.RESEND_API_KEY
  delete process.env.RESEND_API_KEY
  try {
    const db = createDb()
    await db.collection('users').insertOne({ id: 'admin-1', email: 'admin@example.test', role: 'admin' })
    await db.collection('users').insertOne({ id: 'support-1', email: 'support@example.test', role: 'support' })
    await notifyAdmins(db, {
      eventId: 'vip:request-2:created:admin',
      type: 'vip_request',
      title: 'Yeni VIP talebi',
      message: 'Yeni bir talep geldi.',
    })
    assert.deepEqual(db.records.map(({ recipient_id, audience }) => [recipient_id, audience]).sort(), [
      ['admin-1', 'admin'],
      ['support-1', 'admin'],
    ])
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previousKey
  }
})

test('admin email retry only sends an existing notification once', async () => {
  const previousKey = process.env.RESEND_API_KEY
  delete process.env.RESEND_API_KEY
  try {
    const db = createDb()
    const created = await createNotification(db, {
      eventId: 'vip:request-3:admin',
      recipientId: 'admin-1',
      audience: 'admin',
      type: 'vip_request',
      title: 'Yeni VIP talebi',
      message: 'Talep bekliyor.',
      emailTo: 'admin@example.test',
    })
    assert.equal(created.notification.email.status, 'not_configured')
    process.env.RESEND_API_KEY = 'test-key'
    let sends = 0
    const first = await retryNotificationEmail(db, created.notification.id, {
      sendEmail: async () => { sends++; return { id: 'email-retry-1' } },
    })
    const repeated = await retryNotificationEmail(db, created.notification.id, {
      sendEmail: async () => { sends++; return { id: 'email-retry-2' } },
    })
    assert.equal(first.emailStatus, 'sent')
    assert.equal(repeated.status, 409)
    assert.equal(sends, 1)
    assert.equal(db.records[0].email.attempts, 1)
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = previousKey
  }
})

test('notification API limits results and read mutations to the authenticated recipient', async () => {
  const db = createDb([
    { id: 'own', recipient_id: 'user-1', audience: 'user', read_at: null, created_at: new Date(), email: {} },
    { id: 'other', recipient_id: 'user-2', audience: 'user', read_at: null, created_at: new Date(), email: {} },
    { id: 'admin-alert', recipient_id: 'user-1', audience: 'admin', read_at: null, created_at: new Date(), email: {} },
  ])
  const list = await handleNotificationRoutes({
    db, route: '/notifications', method: 'GET',
    request: new Request('https://momentis.test/api/notifications'),
    user: { id: 'user-1', role: 'user' },
  })
  const listBody = await list.json()
  assert.deepEqual(listBody.items.map((item) => item.id), ['own'])
  assert.equal(listBody.unreadCount, 1)

  const adminList = await handleNotificationRoutes({
    db, route: '/notifications', method: 'GET',
    request: new Request('https://momentis.test/api/notifications'),
    user: { id: 'user-1', role: 'admin' },
  })
  const adminListBody = await adminList.json()
  assert.deepEqual(new Set(adminListBody.items.map((item) => item.id)), new Set(['own', 'admin-alert']))
  assert.equal(adminListBody.unreadCount, 2)

  const forbiddenMark = await handleNotificationRoutes({
    db, route: '/notifications/other', method: 'PATCH',
    request: new Request('https://momentis.test/api/notifications/other', { method: 'PATCH', headers: { origin: 'https://momentis.test' } }),
    user: { id: 'user-1', role: 'user' },
  })
  assert.equal(forbiddenMark.status, 404)
  assert.equal(db.records.find((item) => item.id === 'other').read_at, null)
})

test('support cannot retry notification email', async () => {
  const response = await handleNotificationRoutes({
    db: createDb(),
    route: '/admin/notifications/email-1/retry-email',
    method: 'POST',
    request: new Request('https://momentis.test/api/admin/notifications/email-1/retry-email', { method: 'POST' }),
    user: { id: 'support-1', role: 'support' },
  })
  assert.equal(response.status, 403)
})
