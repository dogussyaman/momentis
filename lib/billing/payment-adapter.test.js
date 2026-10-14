import assert from 'node:assert/strict'
import test from 'node:test'
import {
  generateIyzWSv2Header,
  verifyIyzicoWebhookSignature,
  completePurchaseAndGrantCredits,
} from './payment-adapter.js'
import { BILLING_PLANS } from './plans.js'

function createMemoryDb(seed = {}) {
  const records = new Map(Object.entries(seed).map(([name, values]) => [name, values.map((item) => ({ ...item }))]))
  return {
    read(name) { return records.get(name) || [] },
    collection(name) {
      const rows = records.get(name) || []
      records.set(name, rows)
      return {
        createIndex: async () => 'ok',
        findOne: async (query) => {
          return rows.find((r) => Object.entries(query).every(([k, v]) => {
            if (k === '$or') return v.some((cond) => Object.entries(cond).every(([ck, cv]) => r[ck] === cv))
            return r[k] === v
          })) || null
        },
        find(query = {}) {
          let res = rows.filter((r) => Object.entries(query).every(([k, v]) => r[k] === v))
          return {
            sort: () => ({ toArray: async () => [...res] }),
            toArray: async () => [...res],
          }
        },
        insertOne: async (doc) => {
          rows.push({ ...doc })
          return { insertedId: doc.id }
        },
        updateOne: async (query, update, { upsert } = {}) => {
          let r = rows.find((item) => Object.entries(query).every(([k, v]) => item[k] === v))
          if (!r && upsert) {
            r = { ...(update.$setOnInsert || {}) }
            rows.push(r)
            return { upsertedCount: 1 }
          }
          if (!r) return { modifiedCount: 0 }
          Object.assign(r, update.$set || {})
          return { modifiedCount: 1 }
        },
      }
    },
    client: {
      startSession() {
        return {
          withTransaction: async (op) => op({}),
          endSession: async () => {},
        }
      },
    },
  }
}

test('generateIyzWSv2Header produces standard IYZWSv2 header with base64 encoded HMAC-SHA256 signature', () => {
  const header = generateIyzWSv2Header({
    apiKey: 'sandbox-api-key-123',
    secretKey: 'sandbox-secret-key-456',
    uriPath: '/payment/iyzipos/checkoutform/initialize/auth/ecom',
    randomKey: '1690000000000',
    body: { price: '1999.00', currency: 'TRY' },
  })

  assert.ok(header.startsWith('IYZWSv2 '))
  const base64Part = header.slice('IYZWSv2 '.length)
  const decoded = Buffer.from(base64Part, 'base64').toString('utf-8')
  assert.ok(decoded.includes('apiKey:sandbox-api-key-123'))
  assert.ok(decoded.includes('randomKey:1690000000000'))
  assert.ok(decoded.includes('signature:'))
})

test('verifyIyzicoWebhookSignature verifies X-IYZ-SIGNATURE-V3 correctly and rejects tampering', () => {
  const secretKey = 'merchant-secret-789'
  const payload = {
    iyziEventType: 'PAYMENT_SUCCESS',
    paymentId: '12345678',
    token: 'token-abc',
    paymentConversationId: 'conv-xyz',
    status: 'SUCCESS',
  }

  // Valid signature calculation: secretKey + eventType + paymentId + token + conversationId + status
  const crypto = require('node:crypto')
  const raw = `${secretKey}PAYMENT_SUCCESS12345678token-abcconv-xyzSUCCESS`
  const validSignature = crypto.createHmac('sha256', secretKey).update(raw).digest('hex')

  const isVerified = verifyIyzicoWebhookSignature({
    payload,
    signature: validSignature,
    secretKey,
  })
  assert.equal(isVerified, true)

  // Tampered payload
  const isTamperedRejected = verifyIyzicoWebhookSignature({
    payload: { ...payload, status: 'FAILURE' },
    signature: validSignature,
    secretKey,
  })
  assert.equal(isTamperedRejected, false)

  // Tampered signature
  const isInvalidSigRejected = verifyIyzicoWebhookSignature({
    payload,
    signature: 'bad-signature',
    secretKey,
  })
  assert.equal(isInvalidSigRejected, false)
})

test('completePurchaseAndGrantCredits transitions pending purchase to paid, grants credits, and is idempotent', async () => {
  const user = { id: 'user-pay-1', name: 'Zeynep Kaya', email: 'zeynep@example.test' }
  const db = createMemoryDb({
    users: [user],
    billing_purchases: [
      {
        id: 'purchase-premium-1',
        user_id: user.id,
        package_id: 'premium',
        amount: BILLING_PLANS.premium.price,
        currency: 'TRY',
        provider: 'iyzico',
        status: 'pending',
      },
    ],
  })

  // 1. Initial verification and completion
  const result = await completePurchaseAndGrantCredits({
    db,
    purchaseId: 'purchase-premium-1',
    provider: 'iyzico',
    paymentId: 'iyzi-pay-999',
    rawResult: { status: 'success', paymentStatus: 'SUCCESS' },
  })
  assert.equal(result.ok, true)
  assert.equal(result.packageId, 'premium')
  assert.equal(result.eventCredits, BILLING_PLANS.premium.eventCredits)

  const updatedPurchase = db.read('billing_purchases')[0]
  assert.equal(updatedPurchase.status, 'paid')
  assert.equal(updatedPurchase.payment_id, 'iyzi-pay-999')

  const grants = db.read('billing_grants')
  assert.equal(grants.length, 1)
  assert.equal(grants[0].purchase_id, 'purchase-premium-1')
  assert.equal(grants[0].event_credits, BILLING_PLANS.premium.eventCredits)
  assert.equal(grants[0].status, 'active')

  const movements = db.read('admin_credit_movements')
  assert.equal(movements.length, 1)
  assert.equal(movements[0].kind, 'credit')
  assert.equal(movements[0].amount, BILLING_PLANS.premium.eventCredits)

  // 2. Duplicate completion call (replay / concurrent webhook) is idempotent
  const replay = await completePurchaseAndGrantCredits({
    db,
    purchaseId: 'purchase-premium-1',
    provider: 'iyzico',
    paymentId: 'iyzi-pay-999',
  })
  assert.equal(replay.ok, true)
  assert.equal(replay.idempotent, true)

  // No duplicate grant or movement created
  assert.equal(db.read('billing_grants').length, 1)
  assert.equal(db.read('admin_credit_movements').length, 1)
})
