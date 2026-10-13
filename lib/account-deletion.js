import { v4 as uuidv4 } from 'uuid'
import { withVipCreditTransaction } from './vip-design/credits.js'

export async function getAccountDeletionSummary(db, userId, session) {
  const projects = await db.collection('event_projects')
    .find({ user_id: userId }, {
      projection: { _id: 0, id: 1, deliverables: 1, canvas_design: 1 },
      ...(session ? { session } : {}),
    })
    .toArray()
  const projectIds = projects.map(({ id }) => id)
  const options = session ? { session } : undefined
  const [guests, vipRequests, purchases, grants] = await Promise.all([
    projectIds.length
      ? db.collection('guests').countDocuments({ project_id: { $in: projectIds } }, options)
      : 0,
    db.collection('vip_design_requests').find({ user_id: userId }, {
      projection: { _id: 0, id: 1, status: 1 }, ...(session ? { session } : {}),
    }).toArray(),
    db.collection('billing_purchases').find({ user_id: userId }, {
      projection: { _id: 0, id: 1, status: 1 }, ...(session ? { session } : {}),
    }).toArray(),
    db.collection('billing_grants').find({ user_id: userId, status: 'active' }, {
      projection: { _id: 0, remaining_event_credits: 1 }, ...(session ? { session } : {}),
    }).toArray(),
  ])
  return {
    events: projects.length,
    invitations: projects.filter((project) => project.deliverables?.invitation?.enabled || Boolean(project.canvas_design)).length,
    guests,
    vipRequests: vipRequests.length,
    pendingVipRequests: vipRequests.filter((item) => ['pending', 'in_progress'].includes(item.status)).length,
    orders: purchases.length,
    pendingOrders: purchases.filter((item) => item.status === 'pending').length,
    remainingCredits: grants.reduce((total, grant) => total + (Number(grant.remaining_event_credits) || 0), 0),
  }
}

async function deleteAccountData(db, userId, email, session) {
  const options = { session }
  const now = new Date()
  await db.collection('admin_access_guard').updateOne(
    { _id: 'admin-access' },
    { $inc: { version: 1 } },
    { upsert: true, session },
  )
  const account = await db.collection('users').findOne({ id: userId }, {
    projection: { _id: 0, role: 1, account_status: 1 },
    session,
  })
  if (!account || account.account_status === 'deleted') {
    return { status: 409, error: 'Hesap daha önce silinmiş veya bulunamadı' }
  }
  if (['admin', 'super_admin'].includes(account.role) && account.account_status !== 'suspended') {
    const activeAdmins = await db.collection('users')
      .find({
        role: { $in: ['admin', 'super_admin'] },
        account_status: { $nin: ['suspended', 'deleted'] },
      }, { projection: { _id: 0, id: 1 }, session })
      .toArray()
    if (!activeAdmins.some((item) => item.id !== userId)) {
      return { status: 409, error: 'Son etkin yönetici hesabı silinemez' }
    }
  }
  const summary = await getAccountDeletionSummary(db, userId, session)
  if (summary.pendingVipRequests || summary.pendingOrders) {
    return { status: 409, error: 'Bekleyen VIP talepleri veya siparişler sonuçlanmadan hesap silinemez', summary }
  }

  const projectIds = await db.collection('event_projects')
    .find({ user_id: userId }, { projection: { _id: 0, id: 1 }, session })
    .toArray()
    .then((items) => items.map(({ id }) => id))

  await db.collection('billing_grants').updateMany(
    { user_id: userId, status: 'active', remaining_event_credits: { $gt: 0 } },
    { $set: { remaining_event_credits: 0, status: 'closed', updated_at: now } },
    options,
  )
  if (summary.remainingCredits > 0) {
    await db.collection('admin_credit_movements').insertOne({
      id: uuidv4(),
      user_id: userId,
      kind: 'account_deletion_forfeiture',
      amount: -summary.remainingCredits,
      reason: 'Kullanıcının kendi hesabını silmesi',
      actor_user_id: null,
      request_key: `account-delete:${userId}`,
      campaign_id: null,
      created_at: now,
    }, options)
  }

  if (projectIds.length) {
    await Promise.all([
      db.collection('event_projects').deleteMany({ id: { $in: projectIds }, user_id: userId }, options),
      db.collection('guests').deleteMany({ project_id: { $in: projectIds } }, options),
      db.collection('rsvps').deleteMany({ project_id: { $in: projectIds } }, options),
      db.collection('album_photos').deleteMany({ project_id: { $in: projectIds } }, options),
      db.collection('guestbook_messages').deleteMany({ project_id: { $in: projectIds } }, options),
      db.collection('message_logs').deleteMany({ project_id: { $in: projectIds } }, options),
      db.collection('billing_project_entitlements').deleteMany({ project_id: { $in: projectIds } }, options),
    ])
  }
  await Promise.all([
    db.collection('billing_usage_counters').deleteMany({ user_id: userId }, options),
    db.collection('billing_usage_operations').deleteMany({ user_id: userId }, options),
    db.collection('notifications').deleteMany({ user_id: userId }, options),
    db.collection('password_reset_tokens').deleteMany({ user_id: userId }, options),
  ])

  const photoFiles = await db.collection('vip_request_photos.files')
    .find({ 'metadata.userId': userId }, { projection: { _id: 1 }, session })
    .toArray()
  if (photoFiles.length) {
    await db.collection('vip_request_photos.chunks').deleteMany({ files_id: { $in: photoFiles.map((file) => file._id) } }, options)
    await db.collection('vip_request_photos.files').deleteMany({ _id: { $in: photoFiles.map((file) => file._id) } }, options)
  }
  await db.collection('vip_design_requests').updateMany(
    { user_id: userId },
    {
      $set: { user_snapshot: { name: 'Silinmiş kullanıcı', email: '' }, anonymized_at: now },
      $unset: { eventDetails: '', site_draft: '', uploadedPhotoMetadata: '', delivery_outputs: '' },
    },
    options,
  )
  await db.collection('admin_audit_logs').updateMany(
    {
      target_type: 'user',
      target_id: userId,
      $or: [{ 'before.name': { $exists: true } }, { 'after.name': { $exists: true } }],
    },
    { $unset: { 'before.name': '', 'after.name': '' } },
    options,
  )

  const deletedEmail = `deleted+${userId}@deleted.invalid`
  const updated = await db.collection('users').updateOne(
    { id: userId, email, account_status: { $ne: 'deleted' } },
    {
      $set: {
        email: deletedEmail,
        name: 'Silinmiş kullanıcı',
        auth_provider: 'deleted',
        account_status: 'deleted',
        picture: null,
        updated_at: now,
      },
      $unset: { password_hash: '', google_id: '' },
    },
    options,
  )
  if (!updated.modifiedCount) return { status: 409, error: 'Hesap eşzamanlı değişti; yeniden deneyin' }
  const emailPattern = new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  await db.collection('login_attempts').deleteMany({ identifier: emailPattern }, options)
  await db.collection('admin_audit_logs').insertOne({
    id: uuidv4(),
    actor_user_id: userId,
    action: 'user.self_deleted',
    target_type: 'user',
    target_id: userId,
    before: { status: 'active' },
    after: { status: 'deleted', retainedOrders: summary.orders },
    reason: 'User-initiated account deletion',
    outcome: 'success',
    created_at: now,
  }, options)
  return { ok: true, summary }
}

export async function performAccountDeletion(db, userId, email) {
  await db.collection('admin_credit_movements').createIndex({ request_key: 1 }, { unique: true })
  return withVipCreditTransaction(db, (session) => deleteAccountData(db, userId, email, session))
}
