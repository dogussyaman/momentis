import assert from 'node:assert/strict'
import test from 'node:test'
import { handleCampaignRoutes } from './campaign-routes.js'

function matches(record, query) {
  return Object.entries(query).every(([key, value]) => {
    if (key === '$or') return value.some((condition) => matches(record, condition))
    const actual = record[key]
    if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
      if (value.$in) return value.$in.includes(actual)
      if (value.$nin) return !value.$nin.includes(actual)
      if (value.$lt !== undefined) return actual < value.$lt
      if (value.$lte !== undefined) return actual <= value.$lte
      if (value.$gt !== undefined) return actual > value.$gt
      if (value.$gte !== undefined) return actual >= value.$gte
      if (value.$ne !== undefined) return actual !== value.$ne
      if (value.$exists !== undefined) return (actual !== undefined) === value.$exists
      return false
    }
    return actual === value
  })
}

function createMemoryDb(seed = {}) {
  const records = new Map(Object.entries(seed).map(([name, values]) => [name, values.map((item) => ({ ...item }))]))
  const db = {
    read(name) {
      return records.get(name) || []
    },
    collection(name) {
      const rows = records.get(name) || []
      records.set(name, rows)
      const duplicate = (doc, excluding) => {
        const uniqueFields = {
          credit_coupons: ['code'],
          admin_credit_batches: ['request_key'],
          admin_credit_batch_results: ['batch_id', 'user_id'],
          coupon_redemptions: ['request_key'],
          coupon_attempt_windows: ['user_id'],
          admin_campaign_attempt_windows: ['user_id'],
          admin_credit_movements: ['request_key'],
          billing_grants: ['purchase_id'],
        }[name] || []
        return rows.some((row) => row !== excluding && uniqueFields.length &&
          uniqueFields.every((field) => row[field] === doc[field]))
      }
      return {
        createIndex: async () => 'ok',
        findOne: async (query) => rows.find((row) => matches(row, query)) || null,
        find(query = {}) {
          let result = rows.filter((row) => matches(row, query))
          const cursor = {
            sort(spec) {
              const [[field, direction]] = Object.entries(spec)
              result = [...result].sort((a, b) => {
                const av = a[field]
                const bv = b[field]
                return (av > bv ? 1 : av < bv ? -1 : 0) * direction
              })
              return this
            },
            skip(count) { result = result.slice(count); return this },
            limit(count) { result = result.slice(0, count); return this },
            toArray: async () => result.map((row) => ({ ...row })),
          }
          return cursor
        },
        insertOne: async (doc) => {
          if (duplicate(doc)) {
            const error = new Error('duplicate key')
            error.code = 11000
            throw error
          }
          rows.push({ ...doc })
          return { insertedId: doc.id }
        },
        deleteOne: async (query) => {
          const index = rows.findIndex((row) => matches(row, query))
          if (index < 0) return { deletedCount: 0 }
          rows.splice(index, 1)
          return { deletedCount: 1 }
        },
        updateOne: async (query, update, { upsert } = {}) => {
          let row = rows.find((item) => matches(item, query))
          const inserted = !row && upsert
          if (!row && upsert) {
            row = { ...update.$setOnInsert }
            rows.push(row)
          }
          if (!row) return { matchedCount: 0, modifiedCount: 0 }
          const next = { ...row, ...(update.$setOnInsert || {}), ...(update.$set || {}) }
          for (const [field, amount] of Object.entries(update.$inc || {})) next[field] = (next[field] || 0) + amount
          if (duplicate(next, row)) {
            const error = new Error('duplicate key')
            error.code = 11000
            throw error
          }
          Object.assign(row, next)
          return { matchedCount: inserted ? 0 : 1, modifiedCount: inserted ? 0 : 1, upsertedCount: inserted ? 1 : 0 }
        },
        countDocuments: async (query = {}) => rows.filter((row) => matches(row, query)).length,
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

function request(url, { method = 'GET', body, key, origin = 'https://momentis.test' } = {}) {
  return new Request(`https://momentis.test${url}`, {
    method,
    headers: {
      ...(method !== 'GET' ? { Origin: origin, 'Content-Type': 'application/json' } : {}),
      ...(key ? { 'Idempotency-Key': key } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

test('campaign routes require super-admin authorization and reject cross-origin mutations', async () => {
  const db = createMemoryDb()
  const unauthorized = await handleCampaignRoutes({
    db, route: '/admin/campaigns', method: 'GET', request: request('/api/admin/campaigns'), user: null,
  })
  assert.equal(unauthorized.status, 401)

  const rejected = await handleCampaignRoutes({
    db,
    route: '/admin/campaigns/credit-batch',
    method: 'POST',
    request: request('/api/admin/campaigns/credit-batch', {
      method: 'POST', key: 'campaign-key-001', origin: 'https://attacker.test',
      body: { userIds: ['user-1'], creditsPerUser: 1, reason: 'Kampanya testi için kredi' },
    }),
    user: { id: 'root', role: 'super_admin' },
  })
  assert.equal(rejected.status, 403)
})

test('bulk credit campaign records an append-only idempotent ledger for each active user', async () => {
  const db = createMemoryDb({
    users: [
      { id: 'user-1', email: 'one@example.test', account_status: 'active' },
      { id: 'user-2', email: 'two@example.test', account_status: 'active' },
    ],
  })
  const actor = { id: 'root', role: 'super_admin' }
  const body = { userIds: ['user-1', 'user-2'], creditsPerUser: 3, reason: 'Etkinlik kampanyası hediyesi' }
  const result = await handleCampaignRoutes({
    db,
    route: '/admin/campaigns/credit-batch',
    method: 'POST',
    request: request('/api/admin/campaigns/credit-batch', { method: 'POST', key: 'campaign-key-002', body }),
    user: actor,
  })
  assert.equal(result.status, 200)
  const report = await result.json()
  assert.deepEqual(report.summary, { succeeded: 2, skipped: 0, failed: 0 })
  assert.equal(report.totalAmount, 6)
  assert.equal(db.read('billing_grants').length, 2)
  assert.equal(db.read('admin_credit_movements').length, 2)
  assert.ok(db.read('admin_credit_movements').every((movement) => movement.amount === 3 && movement.campaign_id))

  const repeated = await handleCampaignRoutes({
    db,
    route: '/admin/campaigns/credit-batch',
    method: 'POST',
    request: request('/api/admin/campaigns/credit-batch', { method: 'POST', key: 'campaign-key-002', body }),
    user: actor,
  })
  assert.equal((await repeated.json()).summary.succeeded, 2)
  assert.equal(db.read('billing_grants').length, 2)
  assert.equal(db.read('admin_credit_movements').length, 2)
})

test('partial bulk credit campaigns can retry failed recipients without duplicating successful grants', async () => {
  const db = createMemoryDb({
    users: [{ id: 'user-1', account_status: 'active' }],
  })
  const collection = db.collection.bind(db)
  let failFirstGrant = true
  db.collection = (name) => {
    const result = collection(name)
    if (name !== 'billing_grants') return result
    return {
      ...result,
      insertOne: async (...args) => {
        if (failFirstGrant) {
          failFirstGrant = false
          throw new Error('temporary database error')
        }
        return result.insertOne(...args)
      },
    }
  }
  const actor = { id: 'root', role: 'super_admin' }
  const body = { userIds: ['user-1'], creditsPerUser: 3, reason: 'Geçici hata yeniden deneme' }
  const initial = await handleCampaignRoutes({
    db,
    route: '/admin/campaigns/credit-batch',
    method: 'POST',
    request: request('/api/admin/campaigns/credit-batch', { method: 'POST', key: 'campaign-retry-001', body }),
    user: actor,
  })
  const partialReport = await initial.json()
  assert.equal(partialReport.status, 'partial')
  assert.equal(partialReport.summary.failed, 1)
  assert.equal(db.read('billing_grants').length, 0)

  const retried = await handleCampaignRoutes({
    db,
    route: `/admin/campaigns/batches/${partialReport.id}/retry`,
    method: 'POST',
    request: request(`/api/admin/campaigns/batches/${partialReport.id}/retry`, { method: 'POST' }),
    user: actor,
  })
  const finalReport = await retried.json()
  assert.equal(finalReport.status, 'completed')
  assert.deepEqual(finalReport.summary, { succeeded: 1, skipped: 0, failed: 0 })
  assert.equal(db.read('billing_grants').length, 1)
  assert.equal(db.read('admin_credit_movements').length, 1)
})

test('credit coupons enforce total-use limits and replay an idempotent redemption once', async () => {
  const db = createMemoryDb()
  const admin = { id: 'root', role: 'super_admin' }
  const now = Date.now()
  const create = await handleCampaignRoutes({
    db,
    route: '/admin/coupons',
    method: 'POST',
    request: request('/api/admin/coupons', {
      method: 'POST',
      body: {
        kind: 'credit_gift',
        code: 'GIFT-ONE',
        credits: 2,
        startsAt: new Date(now - 60_000).toISOString(),
        endsAt: new Date(now + 60_000).toISOString(),
        totalLimit: 1,
        perUserLimit: 1,
        terms: 'Test kuponu',
        active: true,
      },
    }),
    user: admin,
  })
  assert.equal(create.status, 201)

  const first = await handleCampaignRoutes({
    db,
    route: '/billing/coupons/redeem',
    method: 'POST',
    request: request('/api/billing/coupons/redeem', { method: 'POST', key: 'redeem-key-001', body: { code: 'gift-one' } }),
    user: { id: 'user-1', role: 'user' },
  })
  assert.equal((await first.json()).credits, 2)
  const replay = await handleCampaignRoutes({
    db,
    route: '/billing/coupons/redeem',
    method: 'POST',
    request: request('/api/billing/coupons/redeem', { method: 'POST', key: 'redeem-key-001', body: { code: 'GIFT-ONE' } }),
    user: { id: 'user-1', role: 'user' },
  })
  assert.equal((await replay.json()).idempotent, true)
  assert.equal(db.read('billing_grants').length, 1)
  assert.equal(db.read('admin_credit_movements').length, 1)

  const second = await handleCampaignRoutes({
    db,
    route: '/billing/coupons/redeem',
    method: 'POST',
    request: request('/api/billing/coupons/redeem', { method: 'POST', key: 'redeem-key-002', body: { code: 'GIFT-ONE' } }),
    user: { id: 'user-2', role: 'user' },
  })
  assert.equal(second.status, 409)
  assert.equal(db.read('credit_coupons')[0].redemption_count, 1)

  const history = await handleCampaignRoutes({
    db,
    route: `/admin/coupons/${db.read('credit_coupons')[0].id}/redemptions`,
    method: 'GET',
    request: request('/api/admin/coupons/history'),
    user: admin,
  })
  assert.equal((await history.json()).items.length, 1)
  const report = await handleCampaignRoutes({
    db,
    route: '/admin/campaigns/report',
    method: 'GET',
    request: request('/api/admin/campaigns/report'),
    user: admin,
  })
  const campaignReport = (await report.json()).items[0]
  assert.equal(campaignReport.distributedCredits, 2)
  assert.equal(campaignReport.redemptionCount, 1)
})

test('coupon discounts are not accepted as if a payment-discount system existed', async () => {
  const db = createMemoryDb()
  const response = await handleCampaignRoutes({
    db,
    route: '/admin/coupons',
    method: 'POST',
    request: request('/api/admin/coupons', {
      method: 'POST',
      body: { kind: 'discount', code: 'DISCOUNT', credits: 10 },
    }),
    user: { id: 'root', role: 'super_admin' },
  })
  assert.equal(response.status, 400)
  assert.equal(db.read('credit_coupons').length, 0)
})

test('Faz 3: test coupon grants 4 credits per selected package, blocks prod abuse, and allows safe unused revocation', async () => {
  const admin = { id: 'root', role: 'super_admin' }
  const user = { id: 'user-faz3', role: 'user' }
  const db = createMemoryDb({
    users: [
      { id: 'user-faz3', email: 'faz3@momentis.test', account_status: 'active' },
    ],
  })

  // 1. Create a test coupon with 4 credits for each package (premium + atolye)
  const createRes = await handleCampaignRoutes({
    db,
    route: '/admin/coupons',
    method: 'POST',
    request: request('/api/admin/coupons', {
      method: 'POST',
      body: {
        code: 'TEST4X4',
        kind: 'credit_gift',
        credits_per_package: 4,
        packages: ['premium', 'atolye'],
        is_test_only: true,
        startsAt: new Date(Date.now() - 60000).toISOString(),
        endsAt: new Date(Date.now() + 86400000).toISOString(),
        totalLimit: 10,
        perUserLimit: 1,
        terms: 'Faz 3 test kuponu',
        active: true,
      },
    }),
    user: admin,
  })
  assert.equal(createRes.status, 201)
  const createdCoupon = (await createRes.json()).coupon
  assert.equal(createdCoupon.is_test_only, true)
  assert.equal(createdCoupon.credits, 8) // 4 * 2
  assert.deepEqual(createdCoupon.packages, ['premium', 'atolye'])

  // 2. In production without override, test coupon redemption is blocked
  const originalEnv = process.env.NODE_ENV
  const originalAllow = process.env.MOMENTIS_ALLOW_TEST_COUPONS_IN_PROD
  try {
    process.env.NODE_ENV = 'production'
    delete process.env.MOMENTIS_ALLOW_TEST_COUPONS_IN_PROD
    const prodBlockRes = await handleCampaignRoutes({
      db,
      route: '/billing/coupons/redeem',
      method: 'POST',
      request: request('/api/billing/coupons/redeem', {
        method: 'POST',
        key: 'redeem-faz3-prod',
        body: { code: 'TEST4X4' },
      }),
      user,
    })
    assert.equal(prodBlockRes.status, 403)
  } finally {
    process.env.NODE_ENV = originalEnv
    if (originalAllow !== undefined) process.env.MOMENTIS_ALLOW_TEST_COUPONS_IN_PROD = originalAllow
  }

  // 3. Redeem in test environment: generates 2 separate billing_grants (4 credits each)
  const redeemRes = await handleCampaignRoutes({
    db,
    route: '/billing/coupons/redeem',
    method: 'POST',
    request: request('/api/billing/coupons/redeem', {
      method: 'POST',
      key: 'redeem-faz3-001',
      body: { code: 'TEST4X4' },
    }),
    user,
  })
  assert.equal(redeemRes.status, 200)
  const redeemData = await redeemRes.json()
  assert.equal(redeemData.ok, true)
  assert.equal(redeemData.credits, 8)

  const grants = db.read('billing_grants')
  assert.equal(grants.length, 2)
  const premiumGrant = grants.find((g) => g.package_id === 'premium')
  const atolyeGrant = grants.find((g) => g.package_id === 'atolye')
  assert.ok(premiumGrant)
  assert.ok(atolyeGrant)
  assert.equal(premiumGrant.event_credits, 4)
  assert.equal(premiumGrant.remaining_event_credits, 4)
  assert.equal(premiumGrant.status, 'active')
  assert.equal(atolyeGrant.event_credits, 4)
  assert.equal(atolyeGrant.remaining_event_credits, 4)

  // 4. Repeated redemption with same key is idempotent
  const replayRes = await handleCampaignRoutes({
    db,
    route: '/billing/coupons/redeem',
    method: 'POST',
    request: request('/api/billing/coupons/redeem', {
      method: 'POST',
      key: 'redeem-faz3-001',
      body: { code: 'TEST4X4' },
    }),
    user,
  })
  assert.equal((await replayRes.json()).idempotent, true)

  // 5. Repeated redemption with different key is rejected (per-user limit)
  const secondRedeemRes = await handleCampaignRoutes({
    db,
    route: '/billing/coupons/redeem',
    method: 'POST',
    request: request('/api/billing/coupons/redeem', {
      method: 'POST',
      key: 'redeem-faz3-002',
      body: { code: 'TEST4X4' },
    }),
    user,
  })
  assert.equal(secondRedeemRes.status, 409)

  // 6. Simulate partial usage: user uses 1 credit from premiumGrant (assigned to project-1)
  premiumGrant.remaining_event_credits = 3
  premiumGrant.assigned_project_ids = ['project-1']

  // 7. Super admin revokes unused coupon grants:
  // - atolyeGrant is completely unused (4/4 remaining, 0 assigned) -> revoked
  // - premiumGrant has been used (3/4 remaining, assigned to project-1) -> skipped & protected
  const revokeRes = await handleCampaignRoutes({
    db,
    route: `/admin/coupons/${createdCoupon.id}/revoke-unused`,
    method: 'POST',
    request: request(`/api/admin/coupons/${createdCoupon.id}/revoke-unused`, {
      method: 'POST',
      body: { reason: 'Test kredilerini geri alma işlemi' },
    }),
    user: admin,
  })
  assert.equal(revokeRes.status, 200)
  const revokeData = await revokeRes.json()
  assert.equal(revokeData.ok, true)
  assert.equal(revokeData.revokedCount, 1)
  assert.equal(revokeData.revokedCredits, 4)
  assert.equal(revokeData.skippedCount, 1)

  assert.equal(atolyeGrant.status, 'revoked')
  assert.equal(atolyeGrant.remaining_event_credits, 0)
  assert.equal(premiumGrant.status, 'active')
  assert.equal(premiumGrant.remaining_event_credits, 3)

  // Ledger movement recorded for revocation
  const movements = db.read('admin_credit_movements')
  const debitMovement = movements.find((m) => m.kind === 'debit' && m.grant_id === atolyeGrant.id)
  assert.ok(debitMovement)
  assert.equal(debitMovement.amount, 4)
})

test('test-only coupons in production are blocked for normal users and allowed for admins or allowlisted users', async () => {
  const db = createMemoryDb({
    users: [
      { id: 'user-normal', email: 'normal@example.com', role: 'user', account_status: 'active' },
      { id: 'user-admin', email: 'admin@example.com', role: 'admin', account_status: 'active' },
      { id: 'user-allowlisted', email: 'tester@example.com', role: 'user', account_status: 'active' },
    ],
    credit_coupons: [{
      id: 'coupon-test-prod',
      campaign_id: 'camp-test-1',
      code: 'TESTPROD100',
      kind: 'credit_gift',
      credits: 1,
      credits_per_package: 1,
      packages: ['premium'],
      is_test_only: true,
      active: true,
      starts_at: new Date(Date.now() - 3600_000),
      ends_at: new Date(Date.now() + 3600_000),
      total_limit: null,
      per_user_limit: 1,
      redemption_count: 0,
      created_by: 'super-admin',
      created_at: new Date(),
    }],
    coupon_redemptions: [],
    billing_grants: [],
    admin_credit_movements: [],
  })

  const prevEnv = process.env.NODE_ENV
  const prevAllow = process.env.MOMENTIS_ALLOW_TEST_COUPONS_IN_PROD
  const prevList = process.env.MOMENTIS_TEST_COUPON_ALLOWLIST

  try {
    process.env.NODE_ENV = 'production'
    process.env.MOMENTIS_ALLOW_TEST_COUPONS_IN_PROD = 'true'
    process.env.MOMENTIS_TEST_COUPON_ALLOWLIST = 'tester@example.com'

    // 1. Normal user without allowlist -> 403
    const normalRes = await handleCampaignRoutes({
      db,
      route: '/billing/coupons/redeem',
      method: 'POST',
      request: request('/api/billing/coupons/redeem', {
        method: 'POST',
        key: 'test-prod-key-1',
        body: { code: 'TESTPROD100' },
      }),
      user: { id: 'user-normal', email: 'normal@example.com', role: 'user' },
    })
    assert.equal(normalRes.status, 403)
    const normalData = await normalRes.json()
    assert.match(normalData.error, /yetkili test hesapları/)

    // 2. Allowlisted user -> 200/201 ok
    const allowlistedRes = await handleCampaignRoutes({
      db,
      route: '/billing/coupons/redeem',
      method: 'POST',
      request: request('/api/billing/coupons/redeem', {
        method: 'POST',
        key: 'test-prod-key-2',
        body: { code: 'TESTPROD100' },
      }),
      user: { id: 'user-allowlisted', email: 'tester@example.com', role: 'user' },
    })
    assert.equal(allowlistedRes.status, 200)

    // 3. Admin user -> 200/201 ok
    const adminRes = await handleCampaignRoutes({
      db,
      route: '/billing/coupons/redeem',
      method: 'POST',
      request: request('/api/billing/coupons/redeem', {
        method: 'POST',
        key: 'test-prod-key-3',
        body: { code: 'TESTPROD100' },
      }),
      user: { id: 'user-admin', email: 'admin@example.com', role: 'admin' },
    })
    assert.equal(adminRes.status, 200)
  } finally {
    process.env.NODE_ENV = prevEnv
    process.env.MOMENTIS_ALLOW_TEST_COUPONS_IN_PROD = prevAllow
    process.env.MOMENTIS_TEST_COUPON_ALLOWLIST = prevList
  }
})

test('bulk preview and distribution support target all users and selections exceeding old 100 limit', async () => {
  const users = Array.from({ length: 120 }, (_, index) => ({
    id: `user-bulk-${index + 1}`,
    email: `bulk${index + 1}@example.com`,
    role: 'user',
    account_status: 'active',
  }))
  const db = createMemoryDb({ users })
  const actor = { id: 'root', role: 'super_admin' }

  // 1. Preview targeting all users (all: true)
  const previewAllRes = await handleCampaignRoutes({
    db,
    route: '/admin/campaigns/bulk-preview',
    method: 'POST',
    request: request('/api/admin/campaigns/bulk-preview', {
      method: 'POST',
      body: { all: true, creditsPerUser: 2, reason: 'Tüm aktif kullanıcılara bayram kredisi' },
    }),
    user: actor,
  })
  assert.equal(previewAllRes.status, 200)
  const previewAll = await previewAllRes.json()
  assert.equal(previewAll.userCount, 120)
  assert.equal(previewAll.totalCredits, 240)

  // 2. Batch distribute targeting all users via userIds (> 100 users)
  const batchRes = await handleCampaignRoutes({
    db,
    route: '/admin/campaigns/credit-batch',
    method: 'POST',
    request: request('/api/admin/campaigns/credit-batch', {
      method: 'POST',
      key: 'batch-all-users-key-1',
      body: { userIds: previewAll.userIds, creditsPerUser: 2, reason: 'Tüm aktif kullanıcılara bayram kredisi' },
    }),
    user: actor,
  })
  assert.equal(batchRes.status, 200)
  const batchReport = await batchRes.json()
  assert.equal(batchReport.summary.succeeded, 120)
  assert.equal(batchReport.summary.failed, 0)
  assert.equal(db.read('billing_grants').length, 120)

  // 3. Test bulk credit with sendEmail: true records notification
  const singleUserDb = createMemoryDb({
    users: [{ id: 'user-mail-1', email: 'mailtest@example.com', role: 'user', account_status: 'active' }],
  })
  const emailBatchRes = await handleCampaignRoutes({
    db: singleUserDb,
    route: '/admin/campaigns/credit-batch',
    method: 'POST',
    request: request('/api/admin/campaigns/credit-batch', {
      method: 'POST',
      key: 'batch-email-test-1',
      body: { userIds: ['user-mail-1'], creditsPerUser: 1, reason: 'Tebrikler hediye krediniz yüklendi', sendEmail: true },
    }),
    user: actor,
  })
  assert.equal(emailBatchRes.status, 200)
  const notifications = singleUserDb.read('notifications')
  assert.equal(notifications.length, 1)
  assert.equal(notifications[0].recipient_id, 'user-mail-1')
  assert.equal(notifications[0].email.template, 'adminCreditGranted')
  assert.equal(notifications[0].email.to, 'mailtest@example.com')
})

