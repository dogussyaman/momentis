export const VIP_REQUEST_CREDIT_COST = 2

const noId = { projection: { _id: 0 } }

export async function withVipCreditTransaction(db, operation) {
  if (typeof db.client?.startSession !== 'function') {
    throw new Error('VIP kredi işlemleri için MongoDB transaction desteği zorunludur')
  }
  const session = db.client.startSession()
  try {
    return await session.withTransaction(
      () => operation(session),
      {
        readPreference: 'primary',
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      },
    )
  } finally {
    await session.endSession()
  }
}

export async function chargeVipRequestCredits(db, {
  requestId,
  userId,
  amount = VIP_REQUEST_CREDIT_COST,
  reason,
  now,
  session,
}) {
  const grants = await db.collection('billing_grants')
    .find({ user_id: userId, status: 'active', remaining_event_credits: { $gt: 0 } }, { ...noId, session })
    .sort({ created_at: 1 })
    .toArray()
  const available = grants.reduce((total, grant) => total + grant.remaining_event_credits, 0)
  if (available < amount) {
    const error = new Error('VIP talebi için en az 2 kullanılabilir etkinlik kredisi gerekir')
    error.code = 'VIP_INSUFFICIENT_CREDITS'
    throw error
  }

  let remaining = amount
  const allocations = []
  for (const grant of grants) {
    if (remaining === 0) break
    const allocated = Math.min(remaining, grant.remaining_event_credits)
    const result = await db.collection('billing_grants').updateOne(
      { id: grant.id, user_id: userId, status: 'active', remaining_event_credits: { $gte: allocated } },
      { $inc: { remaining_event_credits: -allocated }, $set: { updated_at: now } },
      { session },
    )
    if (!result.modifiedCount) {
      const error = new Error('VIP kredileri eşzamanlı değişti; lütfen yeniden deneyin')
      error.code = 'VIP_CREDIT_CONFLICT'
      throw error
    }
    allocations.push({ grant_id: grant.id, amount: allocated })
    remaining -= allocated
  }

  await db.collection('vip_credit_movements').insertOne({
    request_id: requestId,
    user_id: userId,
    kind: 'debit',
    amount,
    reason,
    allocations,
    admin_id: null,
    admin_role: null,
    created_at: now,
  }, { session })
  return allocations
}

export async function refundVipRequestCredits(db, {
  request,
  reason,
  admin,
  now,
  session,
}) {
  const amount = request.vip_credit?.charged_amount || 0
  if (amount !== VIP_REQUEST_CREDIT_COST || request.vip_credit?.refund_status === 'refunded') {
    const error = new Error('VIP talebi için iade edilebilir kredi hareketi bulunamadı')
    error.code = 'VIP_REFUND_UNAVAILABLE'
    throw error
  }

  const debit = await db.collection('vip_credit_movements').findOne(
    { request_id: request.id, kind: 'debit' },
    { ...noId, session },
  )
  if (!debit || !Array.isArray(debit.allocations) || !debit.allocations.length) {
    const error = new Error('VIP talebinin kaynak kredi hareketi bulunamadı')
    error.code = 'VIP_REFUND_SOURCE_MISSING'
    throw error
  }

  for (const allocation of debit.allocations) {
    const restored = await db.collection('billing_grants').updateOne(
      { id: allocation.grant_id, user_id: request.user_id, status: 'active' },
      { $inc: { remaining_event_credits: allocation.amount }, $set: { updated_at: now } },
      { session },
    )
    if (!restored.modifiedCount) {
      const error = new Error(`VIP kredisi iade edilemedi: ${allocation.grant_id}`)
      error.code = 'VIP_REFUND_GRANT_MISSING'
      throw error
    }
  }

  await db.collection('vip_credit_movements').insertOne({
    request_id: request.id,
    user_id: request.user_id,
    kind: 'refund',
    amount,
    reason,
    allocations: debit.allocations,
    admin_id: admin.id,
    admin_role: admin.role || null,
    created_at: now,
  }, { session })
  return amount
}

export async function recordVipRefundDecision(db, {
  request,
  reason,
  admin,
  now,
  session,
}) {
  await db.collection('vip_credit_movements').insertOne({
    request_id: request.id,
    user_id: request.user_id,
    kind: 'refund_denied',
    amount: 0,
    reason,
    allocations: [],
    admin_id: admin.id,
    admin_role: admin.role || null,
    created_at: now,
  }, { session })
}
