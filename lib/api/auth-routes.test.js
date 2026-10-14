import assert from 'node:assert/strict'
import test from 'node:test'
import crypto from 'node:crypto'
import { handleAuthRoutes } from './auth-routes.js'
import { getCurrentUser, signSession } from '../auth.js'

function createMockDb() {
  const collections = {
    users: [],
    login_attempts: [],
    password_reset_tokens: [],
    auth_rate_limits: [],
    billing_accounts: [],
    notifications: [],
  }

  function getCollection(name) {
    if (!collections[name]) collections[name] = []
    const items = collections[name]

    return {
      async createIndex() { return 'ok' },
      async find(query = {}) {
        const matches = items.filter((item) => {
          return Object.entries(query).every(([k, v]) => {
            if (v && typeof v === 'object' && '$in' in v) return v.$in.includes(item[k])
            if (v && typeof v === 'object' && '$nin' in v) return !v.$nin.includes(item[k])
            return item[k] === v
          })
        })
        return {
          toArray: async () => matches,
          limit: (n) => ({ toArray: async () => matches.slice(0, n) }),
          sort: () => ({ toArray: async () => matches, limit: (n) => ({ toArray: async () => matches.slice(0, n) }) }),
        }
      },
      async findOne(query) {
        return items.find((item) => {
          return Object.entries(query).every(([k, v]) => {
            if (v && typeof v === 'object' && '$in' in v) return v.$in.includes(item[k])
            if (v && typeof v === 'object' && '$nin' in v) return !v.$nin.includes(item[k])
            if (v && typeof v === 'object' && '$gt' in v) return item[k] > v.$gt
            if (v && typeof v === 'object' && '$regex' in v) return new RegExp(v.$regex).test(item[k])
            return item[k] === v
          })
        }) || null
      },
      async insertOne(doc) {
        if (queryMatchesDuplicate(name, doc)) {
          const err = new Error('E11000 duplicate key error')
          err.code = 11000
          throw err
        }
        items.push({ ...doc })
        return { insertedId: doc.id || doc._id }
      },
      async updateOne(filter, update) {
        const item = await this.findOne(filter)
        if (!item) return { modifiedCount: 0 }
        applyUpdate(item, update)
        return { modifiedCount: 1 }
      },
      async findOneAndUpdate(filter, update, options = {}) {
        const item = await this.findOne(filter)
        if (!item) {
          if (options.upsert) {
            const newItem = { ...filter }
            applyUpdate(newItem, update)
            items.push(newItem)
            return options.returnDocument === 'after' ? newItem : null
          }
          return null
        }
        applyUpdate(item, update)
        return options.returnDocument === 'after' ? item : item
      },
      async deleteOne(filter) {
        const index = items.findIndex((item) => Object.entries(filter).every(([k, v]) => item[k] === v))
        if (index >= 0) {
          items.splice(index, 1)
          return { deletedCount: 1 }
        }
        return { deletedCount: 0 }
      },
      async deleteMany(filter) {
        let count = 0
        for (let i = items.length - 1; i >= 0; i--) {
          const item = items[i]
          const match = Object.entries(filter).every(([k, v]) => {
            if (v && typeof v === 'object' && '$regex' in v) return new RegExp(v.$regex).test(item[k])
            return item[k] === v
          })
          if (match) {
            items.splice(i, 1)
            count++
          }
        }
        return { deletedCount: count }
      },
      async countDocuments(filter = {}) {
        return items.filter((item) => Object.entries(filter).every(([k, v]) => item[k] === v)).length
      },
    }
  }

  function queryMatchesDuplicate(collectionName, doc) {
    if (collectionName === 'users') {
      return collections.users.some((u) => u.email === doc.email)
    }
    if (collectionName === 'auth_rate_limits') {
      return collections.auth_rate_limits.some((r) => r.key === doc.key)
    }
    return false
  }

  function applyUpdate(target, update) {
    if (update.$set) Object.assign(target, update.$set)
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        target[k] = (target[k] || 0) + v
      }
    }
    if (update.$setOnInsert) {
      for (const [k, v] of Object.entries(update.$setOnInsert)) {
        if (target[k] === undefined) target[k] = v
      }
    }
    if (update.$unset) {
      for (const k of Object.keys(update.$unset)) {
        delete target[k]
      }
    }
  }

  return {
    collection(name) {
      return getCollection(name)
    },
    _collections: collections,
  }
}

test('Faz 1 - registration returns 409 on duplicate key conflict', async () => {
  const db = createMockDb()
  const originalSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret-momentis-auth'

  try {
    const makeRequest = (email) => new Request('https://momentis.test/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: JSON.stringify({ email, password: 'password123', name: 'Ayşe Yılmaz' }),
    })

    const res1 = await handleAuthRoutes({
      db,
      route: '/auth/register',
      method: 'POST',
      request: makeRequest('ayse@example.com'),
      user: null,
    })
    assert.equal(res1.status, 201)

    // Second registration with same email
    const res2 = await handleAuthRoutes({
      db,
      route: '/auth/register',
      method: 'POST',
      request: makeRequest('ayse@example.com'),
      user: null,
    })
    assert.equal(res2.status, 409)
    const data2 = await res2.json()
    assert.match(data2.error, /zaten bir hesap var/)
  } finally {
    process.env.JWT_SECRET = originalSecret
  }
})

test('Faz 1 - password reset token is strictly single-use and atomic', async () => {
  const db = createMockDb()
  const originalSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret-momentis-auth'

  try {
    const userId = 'user-reset-test'
    await db.collection('users').insertOne({
      id: userId,
      email: 'reset@example.com',
      name: 'Reset Test',
      password_hash: 'old_hash',
      auth_provider: 'password',
    })

    const rawToken = 'secret-reset-token-xyz'
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    await db.collection('password_reset_tokens').insertOne({
      id: 'token-1',
      user_id: userId,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 3600 * 1000),
      used: false,
    })

    const makeResetRequest = () => new Request('https://momentis.test/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: JSON.stringify({ token: rawToken, password: 'newSecurePassword123' }),
    })

    // First use must succeed
    const res1 = await handleAuthRoutes({
      db,
      route: '/auth/reset-password',
      method: 'POST',
      request: makeResetRequest(),
      user: null,
    })
    assert.equal(res1.status, 200)

    // Second use of the EXACT SAME token must fail (atomic consumption)
    const res2 = await handleAuthRoutes({
      db,
      route: '/auth/reset-password',
      method: 'POST',
      request: makeResetRequest(),
      user: null,
    })
    assert.equal(res2.status, 400)
    const data2 = await res2.json()
    assert.match(data2.error, /geçersiz ya da süresi dolmuş/)
  } finally {
    process.env.JWT_SECRET = originalSecret
  }
})

test('Faz 1 - password change/reset immediately invalidates previous sessions', async () => {
  const db = createMockDb()
  const originalSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret-momentis-auth'

  try {
    const userId = 'user-session-test'
    const userDoc = {
      id: userId,
      email: 'session@example.com',
      name: 'Session Test',
      password_hash: 'hash_1',
      auth_provider: 'password',
    }
    await db.collection('users').insertOne(userDoc)

    // Old token issued 60 seconds ago
    const pastSecret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { SignJWT } = await import('jose')
    const oldToken = await new SignJWT({ email: userDoc.email, name: userDoc.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 60)
      .setExpirationTime('7d')
      .sign(pastSecret)

    // Password changed just now
    const pwdChanged = new Date()
    await db.collection('users').updateOne(
      { id: userId },
      { $set: { password_changed_at: pwdChanged } }
    )

    // Verifying old token must return null because token was issued before password change
    const oldRequest = new Request('https://momentis.test/api/projects', {
      headers: { Authorization: `Bearer ${oldToken}` },
    })
    const verifiedUser = await getCurrentUser(oldRequest, db)
    assert.equal(verifiedUser, null, 'Old token must be invalidated after password change')

    // New token issued after password change must succeed
    const newToken = await signSession({ ...userDoc, password_changed_at: pwdChanged })
    const newRequest = new Request('https://momentis.test/api/projects', {
      headers: { Authorization: `Bearer ${newToken}` },
    })
    const verifiedNewUser = await getCurrentUser(newRequest, db)
    assert.ok(verifiedNewUser, 'New token issued after password change must be valid')
    assert.equal(verifiedNewUser.id, userId)
  } finally {
    process.env.JWT_SECRET = originalSecret
  }
})

test('Faz 1 - rate limiting protects forgot-password endpoint from abuse', async () => {
  const db = createMockDb()
  const originalSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret-momentis-auth'

  try {
    await db.collection('users').insertOne({
      id: 'target-user',
      email: 'target@example.com',
      name: 'Target User',
      password_hash: 'hash',
      auth_provider: 'password',
    })

    const makeForgotRequest = () => new Request('https://momentis.test/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '9.8.7.6' },
      body: JSON.stringify({ email: 'target@example.com' }),
    })

    // 5 attempts allowed
    for (let i = 0; i < 5; i++) {
      const res = await handleAuthRoutes({
        db,
        route: '/auth/forgot-password',
        method: 'POST',
        request: makeForgotRequest(),
        user: null,
      })
      assert.equal(res.status, 200)
    }

    // 6th attempt must be rate-limited with 429
    const blockedRes = await handleAuthRoutes({
      db,
      route: '/auth/forgot-password',
      method: 'POST',
      request: makeForgotRequest(),
      user: null,
    })
    assert.equal(blockedRes.status, 429)
    const data = await blockedRes.json()
    assert.match(data.error, /Çok fazla/)
  } finally {
    process.env.JWT_SECRET = originalSecret
  }
})
