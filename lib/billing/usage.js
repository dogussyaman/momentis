import crypto from 'node:crypto'
import { FREE_PLAN_ID, getBillingPlan, isMockPaymentEnabled } from './plans'

const noId = { projection: { _id: 0 } }
let indexPromise

export async function ensureBillingIndexes(db) {
  if (!indexPromise) {
    indexPromise = Promise.all([
      db.collection('billing_accounts').createIndex({ user_id: 1 }, { unique: true }),
      db.collection('billing_purchases').createIndex({ user_id: 1, idempotency_key: 1 }, { unique: true }),
      db.collection('billing_grants').createIndex({ purchase_id: 1 }, { unique: true }),
      db.collection('billing_project_entitlements').createIndex({ project_id: 1 }, { unique: true }),
      db.collection('billing_usage_operations').createIndex({ user_id: 1, meter: 1, request_key: 1 }, { unique: true }),
      db.collection('event_projects').createIndex(
        { user_id: 1, creation_request_id: 1 },
        { unique: true, partialFilterExpression: { creation_request_id: { $type: 'string' } } },
      ),
      db.collection('guests').createIndex(
        { project_id: 1, creation_request_id: 1 },
        { unique: true, partialFilterExpression: { creation_request_id: { $type: 'string' } } },
      ),
      db.collection('album_photos').createIndex(
        { project_id: 1, creation_request_id: 1 },
        { unique: true, partialFilterExpression: { creation_request_id: { $type: 'string' } } },
      ),
    ]).catch((error) => {
      indexPromise = null
      throw error
    })
  }
  await indexPromise
}

export async function ensureBillingAccount(db, userId) {
  await ensureBillingIndexes(db)
  const now = new Date()
  await db.collection('billing_accounts').updateOne(
    { user_id: userId },
    { $setOnInsert: { user_id: userId, plan_id: FREE_PLAN_ID, created_at: now }, $set: { updated_at: now } },
    { upsert: true },
  )
}

function counterId(userId, meter, projectId) {
  return [userId, meter, projectId || 'account'].join(':')
}

function operationId(userId, meter, requestKey, projectId = null) {
  return crypto.createHash('sha256').update(`${userId}:${meter}:${projectId || 'account'}:${requestKey}`).digest('hex')
}

export function getRequestKey(request) {
  const key = request.headers.get('idempotency-key')
  return typeof key === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(key) ? key : null
}

export async function getProjectPlan(db, userId, projectId) {
  const assignment = await db.collection('billing_project_entitlements').findOne({ user_id: userId, project_id: projectId }, noId)
  return getBillingPlan(assignment?.package_id) || getBillingPlan(FREE_PLAN_ID)
}

export async function consumeQuota(db, { userId, meter, requestKey, limit, amount = 1, projectId = null }) {
  await ensureBillingIndexes(db)
  if (!requestKey || !Number.isInteger(amount) || amount < 1) {
    throw new Error('Bir kullanım kotası için geçerli bir idempotency anahtarı ve miktar zorunludur')
  }
  const operations = db.collection('billing_usage_operations')
  const counters = db.collection('billing_usage_counters')
  const id = operationId(userId, meter, requestKey, projectId)
  const usageId = counterId(userId, meter, projectId)
  let operation = await operations.findOne({ _id: id })

  if (operation?.status === 'consumed') {
    await counters.updateOne({ _id: usageId }, { $pull: { pending_operation_ids: id } })
    return { allowed: true, used: true }
  }
  if (operation?.status === 'reserving' || operation?.status === 'pending') {
    const counter = await counters.findOne({ _id: usageId })
    if (counter?.pending_operation_ids?.includes(id)) {
      await operations.updateOne({ _id: id }, { $set: { status: 'consumed', updated_at: new Date() } })
      await counters.updateOne({ _id: usageId }, { $pull: { pending_operation_ids: id } })
      return { allowed: true, used: true }
    }
  }

  if (!operation) {
    const now = new Date()
    try {
      await operations.insertOne({ _id: id, user_id: userId, meter, request_key: requestKey, project_id: projectId, amount, status: 'pending', created_at: now, updated_at: now })
    } catch (error) {
      if (error?.code !== 11000) throw error
      operation = await operations.findOne({ _id: id })
      if (operation?.status === 'consumed') return { allowed: true, used: true }
      if (operation?.status !== 'pending' && operation?.status !== 'reserving') throw error
    }
  } else if (operation.status === 'released') {
    await operations.updateOne(
      { _id: id, status: 'released' },
      { $set: { status: 'pending', amount, updated_at: new Date() } },
    )
  } else if (operation.status === 'reserving' && operation.reservation_started_at < new Date(Date.now() - 120_000)) {
    await operations.updateOne(
      { _id: id, status: 'reserving', reservation_started_at: operation.reservation_started_at },
      { $set: { status: 'pending', updated_at: new Date() }, $unset: { reservation_started_at: '' } },
    )
  } else if (operation.status === 'reserving') {
    return { allowed: true, used: true, processing: true }
  }

  const reservationStartedAt = new Date()
  const claimed = await operations.updateOne(
    { _id: id, status: 'pending' },
    { $set: { status: 'reserving', reservation_started_at: reservationStartedAt, updated_at: reservationStartedAt } },
  )
  if (!claimed.modifiedCount) {
    operation = await operations.findOne({ _id: id })
    if (operation?.status === 'consumed') return { allowed: true, used: true }
    if (operation?.status === 'reserving') return { allowed: true, used: true, processing: true }
    if (operation?.status === 'released') return consumeQuota(db, { userId, meter, requestKey, limit, amount, projectId })
    return { allowed: false, used: false, count: 0, limit }
  }

  await counters.updateOne(
    { _id: usageId },
    { $setOnInsert: { user_id: userId, meter, project_id: projectId, used: 0, pending_operation_ids: [] } },
    { upsert: true },
  )
  const quotaFilter = { _id: usageId, pending_operation_ids: { $ne: id } }
  if (Number.isFinite(limit)) quotaFilter.used = { $lte: limit - amount }
  const result = await counters.updateOne(
    quotaFilter,
    { $inc: { used: amount }, $addToSet: { pending_operation_ids: id } },
  )
  if (!result.modifiedCount) {
    const counter = await counters.findOne({ _id: usageId })
    if (counter?.pending_operation_ids?.includes(id)) {
      await operations.updateOne({ _id: id }, { $set: { status: 'consumed', updated_at: new Date() } })
      await counters.updateOne({ _id: usageId }, { $pull: { pending_operation_ids: id } })
      return { allowed: true, used: true }
    }
    await operations.deleteOne({ _id: id, status: 'reserving' })
    return { allowed: false, used: false, count: counter?.used || 0, limit }
  }

  await operations.updateOne(
    { _id: id, status: 'reserving', reservation_started_at: reservationStartedAt },
    { $set: { status: 'consumed', updated_at: new Date() }, $unset: { reservation_started_at: '' } },
  )
  await counters.updateOne({ _id: usageId }, { $pull: { pending_operation_ids: id } })
  return { allowed: true, used: false }
}

export async function releaseQuota(db, { userId, meter, requestKey, amount, projectId = null }) {
  const id = operationId(userId, meter, requestKey, projectId)
  const operations = db.collection('billing_usage_operations')
  const counters = db.collection('billing_usage_counters')
  const usageId = counterId(userId, meter, projectId)
  let operation = await operations.findOne({ _id: id })
  if (!operation) return false
  if (operation.status === 'released') {
    await counters.updateOne({ _id: usageId }, { $pull: { refunded_operation_ids: id } })
    return false
  }
  let releaseToken = null
  if (operation.status === 'consumed') {
    releaseToken = crypto.randomUUID()
    const releaseStartedAt = new Date()
    const claim = await operations.updateOne(
      { _id: id, status: 'consumed' },
      { $set: {
        status: 'releasing',
        release_amount: amount || operation.amount || 1,
        release_token: releaseToken,
        release_started_at: releaseStartedAt,
        updated_at: releaseStartedAt,
      } },
    )
    if (!claim.modifiedCount) operation = await operations.findOne({ _id: id })
    else operation = { ...operation, status: 'releasing', release_amount: amount || operation.amount || 1, release_token: releaseToken }
  }
  if (operation.status === 'releasing') {
    const current = await counters.findOne({ _id: usageId })
    if (current?.refunded_operation_ids?.includes(id)) {
      await operations.updateOne(
        { _id: id, status: 'releasing' },
        { $set: { status: 'released', updated_at: new Date() }, $unset: { release_token: '', release_started_at: '' } },
      )
      await counters.updateOne({ _id: usageId }, { $pull: { refunded_operation_ids: id } })
      return true
    }
    if (releaseToken !== operation.release_token) {
      const staleBefore = new Date(Date.now() - 120_000)
      if (operation.release_started_at > staleBefore) return false
      releaseToken = crypto.randomUUID()
      const claim = await operations.updateOne(
        { _id: id, status: 'releasing', release_started_at: operation.release_started_at },
        { $set: { release_token: releaseToken, release_started_at: new Date(), updated_at: new Date() } },
      )
      if (!claim.modifiedCount) return false
      operation = { ...operation, release_token: releaseToken }
    }
  }
  if (operation.status !== 'releasing' || !releaseToken) return false
  const releaseAmount = amount || operation.release_amount || operation.amount || 1
  const refund = await counters.updateOne(
    { _id: usageId, used: { $gte: releaseAmount }, refunded_operation_ids: { $ne: id } },
    { $inc: { used: -releaseAmount }, $addToSet: { refunded_operation_ids: id } },
  )
  if (!refund.modifiedCount) {
    const current = await counters.findOne({ _id: usageId })
    if (!current?.refunded_operation_ids?.includes(id)) {
      throw new Error(`Kota iadesi uygulanamadı: ${meter}`)
    }
  }
  await operations.updateOne(
    { _id: id, status: 'releasing', release_token: releaseToken },
    { $set: { status: 'released', updated_at: new Date() }, $unset: { release_token: '', release_started_at: '' } },
  )
  await counters.updateOne({ _id: usageId }, { $pull: { refunded_operation_ids: id } })
  return true
}

export async function claimEventCredit(db, { userId, packageId, projectId }) {
  const packagePlan = getBillingPlan(packageId)
  if (!packagePlan || packagePlan.grantMode !== 'event_credits') return null
  const assignments = db.collection('billing_project_entitlements')
  const existingAssignment = await assignments.findOne({ user_id: userId, project_id: projectId }, noId)
  if (existingAssignment) {
    if (existingAssignment.package_id !== packageId) return null
    const existingGrant = await db.collection('billing_grants').findOne({ id: existingAssignment.grant_id }, noId)
    return existingGrant ? { ...existingGrant, newlyAssigned: false } : null
  }
  const reservedGrant = await db.collection('billing_grants').findOne(
    { user_id: userId, package_id: packageId, assigned_project_ids: projectId },
    noId,
  )
  if (reservedGrant) {
    const assigned = await assignments.updateOne(
      { project_id: projectId },
      { $setOnInsert: { user_id: userId, project_id: projectId, package_id: packageId, grant_id: reservedGrant.id, created_at: new Date() } },
      { upsert: true },
    )
    return { ...reservedGrant, newlyAssigned: Boolean(assigned.upsertedCount) }
  }
  const grant = await db.collection('billing_grants').findOneAndUpdate(
    { user_id: userId, package_id: packageId, status: 'active', remaining_event_credits: { $gt: 0 }, assigned_project_ids: { $ne: projectId } },
    { $inc: { remaining_event_credits: -1 }, $addToSet: { assigned_project_ids: projectId }, $set: { updated_at: new Date() } },
    { sort: { created_at: 1 }, returnDocument: 'after', projection: { _id: 0 } },
  )
  if (!grant) return null
  try {
    await assignments.insertOne({
      user_id: userId,
      project_id: projectId,
      package_id: packageId,
      grant_id: grant.id,
      created_at: new Date(),
    })
  } catch (error) {
    if (error?.code === 11000) {
      const duplicate = await assignments.findOne({ user_id: userId, project_id: projectId }, noId)
      if (duplicate?.package_id === packageId) {
        if (duplicate.grant_id !== grant.id) {
          await db.collection('billing_grants').updateOne(
            { id: grant.id, assigned_project_ids: projectId },
            { $inc: { remaining_event_credits: 1 }, $pull: { assigned_project_ids: projectId }, $set: { updated_at: new Date() } },
          )
        }
        const existingGrant = await db.collection('billing_grants').findOne({ id: duplicate.grant_id }, noId)
        return existingGrant ? { ...existingGrant, newlyAssigned: false } : null
      }
    }
    await db.collection('billing_grants').updateOne(
      { id: grant.id, assigned_project_ids: projectId },
      { $inc: { remaining_event_credits: 1 }, $pull: { assigned_project_ids: projectId }, $set: { updated_at: new Date() } },
    )
    throw error
  }
  return { ...grant, newlyAssigned: true }
}

export async function restoreEventCredit(db, { grantId, projectId }) {
  await db.collection('billing_project_entitlements').deleteOne({ grant_id: grantId, project_id: projectId })
  await db.collection('billing_grants').updateOne(
    { id: grantId, assigned_project_ids: projectId },
    { $inc: { remaining_event_credits: 1 }, $pull: { assigned_project_ids: projectId }, $set: { updated_at: new Date() } },
  )
}

export async function getBillingSnapshot(db, userId) {
  await ensureBillingAccount(db, userId)
  const [account, grants, projects, usage] = await Promise.all([
    db.collection('billing_accounts').findOne({ user_id: userId }, noId),
    db.collection('billing_grants').find({ user_id: userId }, noId).sort({ created_at: 1 }).toArray(),
    db.collection('event_projects').countDocuments({ user_id: userId }),
    db.collection('billing_usage_counters').find({ user_id: userId, project_id: null }, noId).toArray(),
  ])
  const creditsRemaining = grants.reduce((sum, grant) => sum + (grant.remaining_event_credits || 0), 0)
  const totalCredits = grants.reduce((sum, grant) => sum + (grant.event_credits || 0), 0)
  const usageByMeter = Object.fromEntries(usage.map((row) => [row.meter, row.used || 0]))
  return {
    account: { ...account, plan_id: account?.plan_id || FREE_PLAN_ID },
    grants,
    usage: { projects, ...usageByMeter },
    quotas: { projects: 1 + totalCredits, freeProjects: 1, eventCreditsRemaining: creditsRemaining },
    mockPaymentAvailable: isMockPaymentEnabled(),
  }
}
