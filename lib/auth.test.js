import assert from 'node:assert/strict'
import test from 'node:test'
import { getCurrentUser, signAccountDeletionProof, signSession, verifyAccountDeletionProof } from './auth.js'

test('suspended users cannot reuse an existing API session', async () => {
  const originalSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret-not-for-authentication'
  try {
    const token = await signSession({ id: 'suspended-user', name: 'Test', email: 'user@example.test' })
    const db = {
      collection(name) {
        assert.equal(name, 'users')
        return { findOne: async () => ({ id: 'suspended-user', role: 'user', account_status: 'suspended' }) }
      },
    }
    const request = new Request('https://momentis.test/api/projects', {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert.equal(await getCurrentUser(request, db), null)
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = originalSecret
  }
})

test('deleted users cannot reuse sessions and deletion proofs are account-bound', async () => {
  const originalSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret-not-for-authentication'
  try {
    const token = await signSession({ id: 'deleted-user', name: 'Test', email: 'user@example.test' })
    const db = {
      collection(name) {
        assert.equal(name, 'users')
        return { findOne: async () => ({ id: 'deleted-user', role: 'user', account_status: 'deleted' }) }
      },
    }
    const request = new Request('https://momentis.test/api/projects', {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert.equal(await getCurrentUser(request, db), null)

    const proof = await signAccountDeletionProof('user-1')
    assert.equal(await verifyAccountDeletionProof(proof, 'user-1'), true)
    assert.equal(await verifyAccountDeletionProof(proof, 'user-2'), false)
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = originalSecret
  }
})
